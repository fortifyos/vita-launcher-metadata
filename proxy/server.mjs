import http from "node:http";

const required = [
  "SCREENSCRAPER_DEVELOPER_ID",
  "SCREENSCRAPER_DEVELOPER_PASSWORD"
];
for (const name of required) {
  if (!process.env[name]) throw new Error(`Missing ${name}`);
}

const systemIds = JSON.parse(process.env.SCREENSCRAPER_SYSTEM_IDS || "{}");
const cache = new Map();
const cacheTtlMs = 24 * 60 * 60 * 1000;
const apiBase = "https://api.screenscraper.fr/api2";

function upstreamUrl(endpoint, values) {
  const query = new URLSearchParams({
    devid: process.env.SCREENSCRAPER_DEVELOPER_ID,
    devpassword: process.env.SCREENSCRAPER_DEVELOPER_PASSWORD,
    softname: process.env.SCREENSCRAPER_SOFTWARE_NAME || "VitaLauncher",
    output: "json",
    ...values
  });
  if (process.env.SCREENSCRAPER_USER_ID) query.set("ssid", process.env.SCREENSCRAPER_USER_ID);
  if (process.env.SCREENSCRAPER_USER_PASSWORD) query.set("sspassword", process.env.SCREENSCRAPER_USER_PASSWORD);
  return `${apiBase}/${endpoint}?${query}`;
}

async function getJson(endpoint, values) {
  const response = await fetch(upstreamUrl(endpoint, values), { headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`ScreenScraper returned ${response.status}`);
  return response.json();
}

function firstArray(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  for (const child of Object.values(value)) {
    const found = firstArray(child);
    if (found.length) return found;
  }
  return [];
}

function firstText(value) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object") return "";
  return Object.values(value).find((item) => typeof item === "string") || "";
}

function imageUrls(value, result = []) {
  if (typeof value === "string") return result;
  if (!value || typeof value !== "object") return result;
  for (const [key, child] of Object.entries(value)) {
    if (typeof child === "string" && /^https?:\/\//.test(child) && /screenshot/i.test(key)) {
      result.push(child);
    } else {
      imageUrls(child, result);
    }
  }
  return [...new Set(result)].slice(0, 3);
}

function luaString(value) {
  return JSON.stringify(String(value || ""));
}

function storyAsLua(story) {
  const screenshots = story.screenshots.map((url) => `    ${luaString(url)}`).join(",\n");
  return [
    "return {",
    `    genre = ${luaString(story.genre)},`,
    `    year = ${luaString(story.year)},`,
    `    players = ${luaString(story.players)},`,
    `    synopsis = ${luaString(story.synopsis)},`,
    `    gameplay = ${luaString(story.gameplay)},`,
    "    screenshots = {",
    screenshots,
    "    },",
    `    source_name = ${luaString("ScreenScraper")}`,
    "}"
  ].join("\n");
}

async function fetchStory(platform, title) {
  const systemId = systemIds[platform];
  if (!systemId) throw new Error(`Unsupported or unconfigured platform: ${platform}`);
  const search = await getJson("jeuRecherche.php", { systemeid: systemId, recherche: title });
  const game = firstArray(search.jeux || search.response?.jeux)[0];
  if (!game?.id) throw new Error("Game not found");
  const detail = await getJson("jeuInfos.php", { systemeid: systemId, gameid: game.id });
  const item = detail.jeu || detail.response?.jeu || detail;
  const synopsis = firstText(item.synopsis?.synopsis_en || item.synopsis?.synopsis_us || item.synopsis);
  const genre = firstText(item.genres?.genres_en || item.genres?.genres_us || item.genres);
  const year = String(firstText(item.dates?.date_us || item.dates?.date_eu || item.dates)).slice(0, 4);
  return {
    genre: genre || "Game",
    year,
    players: String(item.joueurs || ""),
    synopsis,
    gameplay: "",
    screenshots: imageUrls(item.medias)
  };
}

function send(response, status, body, contentType = "text/plain; charset=utf-8") {
  response.writeHead(status, { "Content-Type": contentType, "Cache-Control": "public, max-age=86400" });
  response.end(body);
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host}`);
  if (url.pathname === "/health") return send(response, 200, "ok");
  if (url.pathname !== "/v1/story.lua") return send(response, 404, "Not found");

  const platform = url.searchParams.get("platform") || "";
  const title = url.searchParams.get("title") || "";
  if (!platform || !title) return send(response, 400, "platform and title are required");
  const cacheKey = `${platform}:${title.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return send(response, 200, cached.body, "text/plain; charset=utf-8");

  try {
    const body = storyAsLua(await fetchStory(platform, title));
    cache.set(cacheKey, { body, expiresAt: Date.now() + cacheTtlMs });
    return send(response, 200, body, "text/plain; charset=utf-8");
  } catch (error) {
    return send(response, 404, error.message);
  }
});

server.listen(Number(process.env.PORT || 8787), () => {
  console.log(`Vita Launcher metadata proxy listening on ${process.env.PORT || 8787}`);
});
