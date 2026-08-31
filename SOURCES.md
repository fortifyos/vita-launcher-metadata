# Sources and Attribution

## North American Vita manifest

`catalogue/psvita-north-america.tsv` is generated from the English Wikipedia
*Lists of PlayStation Vita games* release tables. It preserves only the game
title, listed genre, and North American release date needed to track coverage.
Those tables are available under the Creative Commons Attribution-ShareAlike
license. See the source list and its revision history at:

- https://en.wikipedia.org/wiki/Lists_of_PlayStation_Vita_games

The Game Story prose in `stories/` is written independently for Vita Launcher.
It is not copied from the release-list source, Push Square, reviews, store
pages, screenshots, or other editorial sources.

## Fact research

`tools/fetch-wikipedia-intros.mjs` can retrieve introductory English Wikipedia
material to verify game settings, mechanics, and scope while stories are being
authored. Its generated research cache is deliberately ignored by Git and is
never downloaded by Vita Launcher. Published `highlights` remain short,
independently written summaries; the source material is not redistributed.

