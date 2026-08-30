# Vita Launcher Metadata

Static Game Story metadata for Vita Launcher.

## Repository layout

```text
stories/<game-key>.lua
screenshots/<image-name>.jpg
```

The launcher requests `stories/<game-key>.lua`, then downloads every image
listed in that story from `screenshots/`. Game keys are Vita/PSP title IDs when
available; otherwise they are the game's filename or title with non-alphanumeric
characters replaced by underscores.

## Story format

```lua
return {
    genre = "Action / Adventure",
    year = "2012",
    players = "1 Player",
    synopsis = "A concise original, back-of-box style description.",
    gameplay = "Exploration, combat, puzzles, and touch controls.",
    screenshots = {
        "PCSA00001_1.jpg",
        "PCSA00001_2.jpg",
        "PCSA00001_3.jpg"
    },
    source_name = "Vita Launcher Metadata",
    source_url = "https://example.invalid/source"
}
```

Use at most three screenshots. Use original or permitted copy; do not copy long
editorial descriptions or unlicensed artwork from third-party sites.

## Vita Launcher setup

Vita Launcher v0.2.28 and later use this repository by default. Cached metadata
and screenshots are stored in `ux0:/data/RetroFlow/GAME_STORIES/`.