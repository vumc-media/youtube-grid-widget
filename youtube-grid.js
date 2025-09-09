/* YouTube Streams Grid Widget
 * Author: ChatGPT for Versailles UMC
 * Usage: include this file and add a <div id="youtube-grid" data-channel-id="UC..." data-api-key="..."></div>
 */
(function(){
  const mount = document.getElementById('youtube-grid');
  if (!mount) return console.warn('[youtube-grid] mount element #youtube-grid not found.');

  const API_KEY = (mount.getAttribute('data-api-key') || '').trim();
  const CHANNEL_ID = (mount.getAttribute('data-channel-id') || '').trim();
  const MAX_RESULTS = parseInt(mount.getAttribute('data-max-results') || '12', 10);
  const OPEN_IN = (mount.getAttribute('data-open-in') || 'same').toLowerCase(); // 'newtab' or 'same'

  if (!API_KEY || !CHANNEL_ID) {
    mount.innerHTML = '<p style="color:#b00;background:#fff3f3;border:1px solid #f3c4c4;padding:10px;border-radius:8px;">Missing <strong>data-api-key</strong> or <strong>data-channel-id</strong>.</p>';
    return;
  }

  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  mount.appendChild(gridEl);

  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  // Step 1: get recent videos from the channel (includes live/upcoming/completed)
  // We intentionally use search.list because it exposes liveBroadcastContent for quick labeling.
  const searchURL = new URL('https://www.googleapis.com/youtube/v3/search');
  searchURL.search = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    channelId: CHANNEL_ID,
    maxResults: String(Math.min(MAX_RESULTS, 50)),
    type: 'video',
    order: 'date',
    // For livestream emphasis, you can uncomment one of these:
    // eventType: 'live',     // only live
    // eventType: 'upcoming', // only upcoming
  }).toString();

  fetch(searchURL.toString())
    .then(r => r.json())
    .then(async data => {
      if (!data || !Array.isArray(data.items)) throw new Error('Bad API response');
      const items = data.items;

      // Collect ids
      const ids = items.map(it => it.id && it.id.videoId).filter(Boolean);
      if (!ids.length) {
        gridEl.innerHTML = '<p class="footerlink">No recent videos found.</p>';
        return;
      }

      // Step 2: bulk fetch liveStreamingDetails + stats
      const videosURL = new URL('https://www.googleapis.com/youtube/v3/videos');
      videosURL.search = new URLSearchParams({
        key: API_KEY,
        part: 'snippet,liveStreamingDetails,statistics',
        id: ids.join(','),
        maxResults: String(ids.length)
      }).toString();

      const vData = await fetch(videosURL.toString()).then(r => r.json());
      const byId = new Map();
      (vData.items || []).forEach(v => byId.set(v.id, v));

      // Step 3: render cards
      items.forEach(it => {
        const id = it.id.videoId;
        const base = byId.get(id) || {};
        const sn = base.snippet || it.snippet || {};
        const live = (sn.liveBroadcastContent || '').toLowerCase(); // live | upcoming | none
        const lsd = (base.liveStreamingDetails || {});
        const scheduled = lsd.scheduledStartTime ? new Date(lsd.scheduledStartTime) : null;
        const actualStart = lsd.actualStartTime ? new Date(lsd.actualStartTime) : null;
        const published = sn.publishedAt ? new Date(sn.publishedAt) : null;

        const title = sn.title || '(untitled)';
        const thumb = (sn.thumbnails && (sn.thumbnails.maxres || sn.thumbnails.high || sn.thumbnails.medium || sn.thumbnails.default)) || {};
        const img = thumb.url || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        const url = `https://www.youtube.com/watch?v=${id}`;

        const card = document.createElement('article');
        card.className = 'card';

        const tdiv = document.createElement('div');
        tdiv.className = 'thumb';
        const im = document.createElement('img');
        im.loading = 'lazy';
        im.src = img;
        im.alt = title;
        tdiv.appendChild(im);

        if (live === 'live') {
          const b = document.createElement('div');
          b.className = 'badge live';
          b.textContent = 'LIVE';
          tdiv.appendChild(b);
        } else if (live === 'upcoming') {
          const b = document.createElement('div');
          b.className = 'badge upcoming';
          b.textContent = 'UPCOMING';
          tdiv.appendChild(b);
        }

        const meta = document.createElement('div');
        meta.className = 'meta';
        const ttl = document.createElement('div');
        ttl.className = 'title';
        ttl.textContent = title;
        const time = document.createElement('div');
        time.className = 'time';

        if (live === 'live' && actualStart) {
          time.textContent = 'Started ' + fmt.format(actualStart);
        } else if (live === 'upcoming' && scheduled) {
          time.textContent = 'Starts ' + fmt.format(scheduled);
        } else if (published) {
          time.textContent = fmt.format(published);
        } else {
          time.textContent = '—';
        }

        meta.appendChild(ttl);
        meta.appendChild(time);

        const actions = document.createElement('div');
        actions.className = 'actions';
        const watch = document.createElement('a');
        watch.className = 'btn primary';
        watch.textContent = 'Watch';
        watch.href = url;
        if (OPEN_IN === 'newtab') watch.target = '_blank';
        actions.appendChild(watch);

        // Build
        card.appendChild(tdiv);
        card.appendChild(meta);
        card.appendChild(actions);
        gridEl.appendChild(card);
      });

      // Footer
      const footer = document.createElement('div');
      footer.className = 'footerlink';
      footer.innerHTML = '<a href="https://www.youtube.com/@versaillesumc/streams" target="_blank" rel="noopener">View all streams on YouTube →</a>';
      mount.appendChild(footer);
    })
    .catch(err => {
      console.error('[youtube-grid] error', err);
      mount.innerHTML = '<p style="color:#b00;background:#fff3f3;border:1px solid #f3c4c4;padding:10px;border-radius:8px;">Failed to load videos. Double-check your API key (YouTube Data API v3) and Channel ID.</p>';
    });
})();