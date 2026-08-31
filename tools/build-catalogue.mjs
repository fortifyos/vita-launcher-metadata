import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(root, "catalogue", "psvita-north-america.tsv");
const outputPath = join(root, "catalogue.lua");

const styleGuides = [
  [/(visual novel|otome)/, "Reading and narrative choices are the focus, making it a natural fit for a quieter, story-led session.", "Players looking for character-driven reading rather than reflex-heavy play."],
  [/(role-playing|rpg)/, "Expect character growth and longer-form progression to shape the portable play rhythm.", "Players who want a game to return to across many sessions."],
  [/(platform)/, "Movement, timing, and learning the layout of each challenge are central to the experience.", "Players who enjoy focused stages and improving through repetition."],
  [/(puzzle)/, "The pace centers on observation and problem-solving rather than speed alone.", "Players after a thoughtful game for short or unhurried sessions."],
  [/(racing|driving)/, "The core appeal is mastering routes, handling, and repeatable runs.", "Players who enjoy shaving time from a run or chasing a cleaner race."],
  [/(shooter|fps|shoot)/, "The moment-to-moment loop emphasizes positioning, aiming, and managing pressure.", "Players wanting immediate action in compact sessions."],
  [/(run and gun|beat 'em up|hack and slash|brawler)/, "The game centers on direct encounters, reading immediate threats, and building confidence through repeat attempts.", "Players looking for responsive action and clear, short-term goals."],
  [/(fighting)/, "Matches reward learning a character's options and reacting cleanly under pressure.", "Players who enjoy practice, head-to-head play, and skill expression."],
  [/(sports)/, "Its appeal comes from the rhythm of a familiar sport and repeatable competitive play.", "Players looking for an accessible competitive game to revisit."],
  [/(strategy|tactical)/, "Planning ahead and weighing limited options shape the pace more than quick reactions.", "Players who prefer deliberate decisions and longer-term planning."],
  [/(simulation|management)/, "The experience leans on systems, experimentation, and gradual improvement.", "Players who enjoy learning a system and setting their own goals."],
  [/(music|rhythm)/, "Timing and pattern recognition drive the action, with quick feedback on each attempt.", "Players who enjoy score chasing and replaying a favorite track or stage."],
  [/(adventure)/, "Exploration and discovery set the pace, with progress coming from following its world and objectives.", "Players looking for a guided change of pace from purely score-driven games."],
  [/(arcade)/, "Short, repeatable runs make it easy to learn the rules and improve from attempt to attempt.", "Players who want immediate play and a reason to chase another run."],
  [/(action)/, "The game is built around active play and responding to immediate challenges.", "Players who want a direct, energetic game for a short session."]
];

function normalise(title) {
  return title.replace(/[™®]/g, "").replace(/[^A-Za-z0-9_-]/g, "_");
}

function escapeLua(value) {
  return value.replace(/\\/g, "\\\\").replace(/"/g, "\\\"").replace(/[\r\n]+/g, " ");
}

function yearFromDate(value) {
  const match = value.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
}

function guideFor(genre) {
  const lower = genre.toLowerCase();
  return styleGuides.find(([pattern]) => pattern.test(lower))
    || [null, "Its listed genre gives a useful starting point before choosing it from a large Vita library.", "Players exploring a less familiar corner of the Vita catalogue."];
}

const lines = readFileSync(manifestPath, "utf8").replace(/^\uFEFF/, "").trim().split(/\r?\n/);
const entries = new Map();
for (const line of lines.slice(1)) {
  const [title, genre, northAmericaRelease] = line.split("\t");
  const key = normalise(title);
  if (!title || !genre || !key) throw new Error(`Invalid manifest row: ${line}`);
  if (entries.has(key)) throw new Error(`Duplicate catalogue key: ${key}`);
  const [, gameplay, idealFor] = guideFor(genre);
  entries.set(key, {
    title,
    genre,
    year: yearFromDate(northAmericaRelease),
    gameplay,
    idealFor
  });
}

const output = [
  "-- Generated from catalogue/psvita-north-america.tsv.",
  "-- Facts are attributed in SOURCES.md; prose is original Vita Launcher baseline guidance.",
  "return {"
];
for (const [key, story] of [...entries].sort(([a], [b]) => a.localeCompare(b))) {
  output.push(`  ["${escapeLua(key)}"] = {`);
  output.push(`    genre = "${escapeLua(story.genre)}",`);
  output.push(`    year = "${story.year}",`);
  output.push("    players = \"\",");
  output.push(`    synopsis = "${escapeLua(`${story.title} is listed in the ${story.genre.toLowerCase()} category of the North American PS Vita catalogue.`)}",`);
  output.push(`    gameplay = "${escapeLua(story.gameplay)}",`);
  output.push(`    ideal_for = "${escapeLua(story.idealFor)}",`);
  output.push("    editorial_status = \"baseline\"");
  output.push("  },");
}
output.push("}", "");
writeFileSync(outputPath, output.join("\n"), "utf8");
console.log(`Generated ${entries.size} Game Stories in ${outputPath}`);

