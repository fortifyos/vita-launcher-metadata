import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const normalise = (title) => title.replace(/[™®]/g, "").replace(/[^A-Za-z0-9_-]/g, "_");
const titles = readFileSync(join(root, "catalogue", "psvita-north-america.tsv"), "utf8")
  .trim().split(/\r?\n/).slice(1).map((line) => line.split("\t")[0]);
const catalogue = readFileSync(join(root, "catalogue.lua"), "utf8");
const stories = readdirSync(join(root, "stories")).filter((file) => file.endsWith(".lua") && file !== "_template.lua");
const baselineKeys = new Set([...catalogue.matchAll(/^  \["([^"]+)"\]/gm)].map((match) => match[1]));
const storyKeys = new Set(stories.map((file) => file.slice(0, -4)));
const missingBaseline = titles.filter((title) => !baselineKeys.has(normalise(title)));
const invalidStories = stories.filter((file) => !/highlights\s*=/.test(readFileSync(join(root, "stories", file), "utf8")));

console.log(JSON.stringify({
  manifest_titles: titles.length,
  baseline_entries: baselineKeys.size,
  authored_stories: storyKeys.size,
  missing_baseline: missingBaseline,
  stories_without_highlights: invalidStories
}, null, 2));
