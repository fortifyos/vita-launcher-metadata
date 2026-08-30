# Metadata Proxy

This service keeps ScreenScraper credentials off the Vita and transforms API
responses into the Lua Game Story format consumed by Vita Launcher.

## Setup

1. Request approved developer credentials from ScreenScraper.
2. Copy `.env.example` to `.env` in the deployment environment and set every
   credential there. Never commit `.env`.
3. Retrieve the Vita, PSP, and PlayStation system IDs using ScreenScraper's
   `systemesListe.php` endpoint and replace the zero values in
   `SCREENSCRAPER_SYSTEM_IDS`.
4. Deploy on any Node 20+ host with HTTPS enabled.

The public endpoint is:

```text
GET /v1/story.lua?platform=psvita&title=Uncharted%20Golden%20Abyss
```

The Vita-side client integration is intentionally deferred until a deployed URL
and approved ScreenScraper credentials exist. This prevents an unusable build
from shipping with placeholder network settings.
