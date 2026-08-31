# Vita Launcher Metadata

An original, curated Game Story catalogue for Vita Launcher. It deliberately
does not redistribute screenshots, cover art, reviews, or publisher copy.

## Repository layout

```text
stories/<game-key>.lua
```

The launcher requests `stories/<game-key>.lua`. Game keys are Vita/PSP title
IDs when available; otherwise they are the game's filename or title with
non-alphanumeric characters replaced by underscores.

For the North American Vita catalogue, the launcher falls back to the combined
`catalogue.lua` file after a title-specific entry is not found. Downloading it
once makes the available entries work offline.

## Story format

```lua
return {
    genre = "Action / Adventure",
    year = "2012",
    players = "1 Player",
    synopsis = "A concise original description of the experience.",
    gameplay = "The core loop, controls, pacing, and challenge.",
    ideal_for = "The player or mood this title best suits."
}
```

Keep every text field concise and written from scratch. Facts such as release
year and player count should be verified against official material or an open
facts source. Do not copy long editorial descriptions, reviews, screenshots,
or artwork from third-party sites.

## Vita Launcher setup

Vita Launcher v0.2.29 and later use this repository by default. Downloaded
metadata is cached in `ux0:/data/RetroFlow/GAME_STORIES/`.

## Coverage

`catalogue/psvita-north-america.tsv` currently tracks 1,000 North American PS
Vita releases. `catalogue.lua` supplies baseline original genre guidance for
every entry; entries marked `editorial_status = "baseline"` can be expanded
with title-specific prose without changing the launcher format.

