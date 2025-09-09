/* YouTube Streams Grid Widget with Popup Modal
 * Author: ChatGPT for Versailles UMC
 */
(function(){
  const mount = document.getElementById('youtube-grid');
  if (!mount) return console.warn('[youtube-grid] mount element #youtube-grid not found.');

  const API_KEY = (mount.getAttribute('data-api-key') || '').trim();
  const CHANNEL_ID = (mount.getAttribute('data-channel-id') || '').trim();
  const MAX_RESULTS = parseInt(mount.getAttribute('data-max-results') || '12', 10);

  if (!API_KEY || !CHANNEL_ID) {
    mount.innerHTML = '<p style="color:#b00;background:#fff3f3;border:1px solid #f3c4c4;padding:10px;border-radius:8px;">Missing <strong>data-api-key</strong> or <strong>data-channel-id</strong>.</p>';
    return;
  }

  const gridEl = document.createElement('div');
  gridEl.className = 'grid';
  mount.appendChild(gridEl);

  const fmt = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

  const searchURL = new URL('https://www.googleapis.com/youtube/v3/search');
  searchURL.search = new URLSearchParams({
    key: API_KEY,
    part: 'snippet',
    channelId: CHANNEL_ID,
    maxResults: String(Math.min(MAX_RESULTS, 50)),
    type: 'video',
    order: 'date'
  }).toString();

  fetch(searchURL.toString())
    .then(r => r.json())
    .then(async data => {
      if (!data || !Array.isArray(data.items)) throw new Error('Bad API response');
      const items = data.items;
      const ids = items.map(it => it.id && it.id.videoId).filter(Boolean);
      if (!ids.length) {
        gridEl.innerHTML = '<p class="footerlink">No recent videos found.</p>';
        return;
      }

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

        const card = document.createElement('article');
        card.className = 'card';
        card.setAttribute('tabindex','0');
        card.setAttribute('role','button');
        card.setAttribute('aria-label','Play ' + title);
        card.addEventListener('click', () => openModal(id));
        card.addEventListener('keypress', (e) => { if (e.key === 'Enter' || e.key === ' ') openModal(id); });

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

        card.appendChild(tdiv);
        card.appendChild(meta);
        gridEl.appendChild(card);
      });

      const footer = document.createElement('div');
      footer.className = 'footerlink';
      footer.innerHTML = '<a href="https://www.youtube.com/@versaillesumc/streams" target="_blank" rel="noopener">View all streams on YouTube →</a>';
      mount.appendChild(footer);
    })
    .catch(err => {
      console.error('[youtube-grid] error', err);
      mount.innerHTML = '<p style="color:#b00;background:#fff3f3;border:1px solid #f3c4c4;padding:10px;border-radius:8px;">Failed to load videos. Double-check your API key (YouTube Data API v3) and Channel ID.</p>';
    });

  // Modal logic
  const modal = document.getElementById('ytModal');
  const modalFrame = document.getElementById('ytPlayer');
  const closeBtn = document.querySelector('#ytModal .close');

  function openModal(videoId) {
    modal.classList.add('show');
    modal.setAttribute('aria-hidden','false');
    modalFrame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
  }
  function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden','true');
    modalFrame.src = '';
  }
  closeBtn.onclick = closeModal;
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
})();