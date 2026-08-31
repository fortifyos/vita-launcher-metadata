import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const storiesPath = join(root, "stories");

function readField(source, field) {
  const match = source.match(new RegExp(`^\\s*${field}\\s*=\\s*"((?:\\\\.|[^"\\\\])*)"\\s*,?\\s*$`, "m"));
  if (!match) throw new Error(`Missing ${field}`);
  return match[1];
}

let converted = 0;
for (const file of readdirSync(storiesPath).sort()) {
  if (!file.endsWith(".lua") || file === "_template.lua") continue;
  const path = join(storiesPath, file);
  const source = readFileSync(path, "utf8");
  if (/^\s*highlights\s*=/m.test(source)) continue;

  const genre = readField(source, "genre");
  const year = readField(source, "year");
  const players = readField(source, "players");
  const highlights = [
    readField(source, "synopsis"),
    readField(source, "gameplay"),
    readField(source, "ideal_for")
  ];

  const migrated = [
    "return {",
    `    genre = "${genre}",`,
    `    year = "${year}",`,
    `    players = "${players}",`,
    "    highlights = {",
    ...highlights.map((highlight) => `        "${highlight}",`).map((line, index, lines) => index === lines.length - 1 ? line.slice(0, -1) : line),
    "    }",
    "}",
    ""
  ].join("\n");
  writeFileSync(path, migrated, "utf8");
  converted += 1;
}

console.log(`Migrated ${converted} legacy Game Story files.`);
