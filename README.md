# YouTube Streams Grid (Popup Player)
A static widget that lists your channel’s recent / live / upcoming videos in a responsive grid. Clicking a card opens a **popup modal player**.

## Quick start
1. Enable **YouTube Data API v3** in Google Cloud Console and create an API key.
2. Open `index.html` and verify `data-channel-id` and `data-api-key` are correct.
3. Publish the folder to **GitHub Pages** (or any static host).

## Embed on any site
```html
<iframe src="https://YOURNAME.github.io/vumc-youtube-grid-modal/" style="width:100%;height:1000px;border:0;"></iframe>
```

## Security
Restrict your API key:
- Application restrictions: **HTTP referrers (web sites)**
- API restrictions: **YouTube Data API v3**
