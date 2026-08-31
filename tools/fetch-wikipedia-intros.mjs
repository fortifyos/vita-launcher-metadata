import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, "catalogue", "psvita-north-america.tsv");
const outputPath = join(root, "catalogue", "research", "wikipedia-intros.json");
const limit = Number.parseInt(process.argv[2] || "0", 10);
const chunkSize = 40;

const rows = readFileSync(manifestPath, "utf8")
  .replace(/^\uFEFF/, "")
  .trim()
  .split(/\r?\n/)
  .slice(1)
  .map((line) => line.split("\t")[0])
  .filter(Boolean);
const titles = limit > 0 ? rows.slice(0, limit) : rows;

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function request(chunk) {
  const url = new URL("https://en.wikipedia.org/w/api.php");
  url.search = new URLSearchParams({
    action: "query",
    format: "json",
    redirects: "1",
    prop: "extracts|pageprops",
    exintro: "1",
    explaintext: "1",
    titles: chunk.join("|")
  }).toString();

  for (let attempt = 1; attempt <= 5; attempt += 1) {
    const response = await fetch(url, {
      headers: { "User-Agent": "VitaLauncherMetadataResearch/1.0 (personal metadata project)" }
    });
    if (response.ok) return response.json();
    if (attempt === 5) throw new Error(`Wikipedia request failed: HTTP ${response.status}`);
    await sleep(3000 * attempt);
  }
}

mkdirSync(dirname(outputPath), { recursive: true });
const previous = (() => {
  try { return JSON.parse(readFileSync(outputPath, "utf8")); }
  catch { return { records: [], requested_titles: [] }; }
})();
const byTitle = new Map((previous.records || []).map((record) => [record.canonical_title, record]));
const requestedTitles = new Set(previous.requested_titles || []);

for (let index = 0; index < titles.length; index += chunkSize) {
  const chunk = titles.slice(index, index + chunkSize);
  if (chunk.every((title) => requestedTitles.has(title))) continue;
  const payload = await request(chunk);
  const pages = Object.values(payload.query?.pages || {});
  for (const page of pages) {
    byTitle.set(page.title || "", {
      canonical_title: page.title || "",
      extract: page.extract || "",
      missing: Boolean(page.missing),
      disambiguation: Boolean(page.pageprops?.disambiguation)
    });
  }
  for (const title of chunk) requestedTitles.add(title);
  const records = [...byTitle.values()];
  writeFileSync(outputPath, JSON.stringify({
    source: "English Wikipedia API",
    requested_titles: [...requestedTitles].sort(),
    records
  }, null, 2) + "\n", "utf8");
  console.log(`Fetched ${Math.min(index + chunk.length, titles.length)} of ${titles.length}; saved ${records.length} records`);
  if (index + chunkSize < titles.length) await sleep(6000);
}

const records = [...byTitle.values()];
const usable = records.filter((record) => !record.missing && !record.disambiguation && record.extract.length > 0).length;
console.log(`Saved ${records.length} records; ${usable} contain usable introductory facts.`);
