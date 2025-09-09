# YouTube Streams Grid (Versailles UMC)
A lightweight, client‑side widget that renders a responsive grid of your channel’s live, upcoming, and recent videos.

- **Auto‑updates** by calling the YouTube Data API v3
- Shows **LIVE** / **UPCOMING** badges using `liveBroadcastContent` and `liveStreamingDetails`
- No build process, just static files (works great on **GitHub Pages** or any static host)

## Quick start
1. Create a **YouTube Data API v3** key in Google Cloud Console.
   - **Application restrictions**: HTTP referrers (web sites)
   - **API restrictions**: Restrict to **YouTube Data API v3**
2. Put the key into `index.html` → `data-api-key="YOUR_API_KEY_HERE"`
3. Open `index.html` in a browser, or publish the folder via **GitHub Pages**.

## Embed as a "widget" on any site
Host these files (e.g., `https://yourname.github.io/vumc-youtube-grid/`) then embed with an iframe:

```html
<iframe src="https://yourname.github.io/vumc-youtube-grid/" style="width:100%;height:900px;border:0;"></iframe>
```

## Configure
The mount element accepts data attributes:

```html
<div id="youtube-grid"
     data-channel-id="UC_svgodM3blLqWEBQ5yNjmA"
     data-api-key="YOUR_API_KEY_HERE"
     data-max-results="12"
     data-open-in="newtab">
</div>
```

- `data-channel-id` – your YouTube Channel ID (starts with `UC...`)
- `data-api-key` – your YouTube Data API v3 key
- `data-max-results` – number of videos to fetch (1–50; default 12)
- `data-open-in` – `newtab` or `same` (default)

## Notes
- The API call uses `search.list` for recent videos, then `videos.list` to enrich with `liveStreamingDetails` (scheduled/actual times).
- If your channel posts lots of non-sermon videos, you can filter or sort client‑side in `youtube-grid.js` (search for the `// render cards` section).
- If you need **only live** or **only upcoming**, uncomment `eventType` in the `searchURL` params in `youtube-grid.js`.

## Security reminder
Your API key is embedded client-side. In Google Cloud Console, set:
- **Application restrictions:** HTTP referrers (web sites) → add your site(s)
- **API restrictions:** Enable only **YouTube Data API v3**
If you change domains, update the allowed referrers.
