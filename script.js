/* VUMC YouTube Grid (RSS, inline play, no modal) - CORS-safe
 * - Tries direct fetch to YouTube RSS; on CORS failure, retries via AllOrigins proxy
 * - Click a card to play inline (iframe replaces the image)
 */

(function () {
  const CHANNEL_ID = window.CHANNEL_ID || "";
  const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(CHANNEL_ID)}`;

  const grid = document.getElementById("grid");
  const q = document.getElementById("q");
  const reloadBtn = document.getElementById("reload");

  let allItems = [];
  let filtered = [];

  init();

  function init() {
    loadFeed();

    q?.addEventListener("input", onSearch);
    reloadBtn?.addEventListener("click", () => loadFeed(true));
  }

  async function loadFeed(bust = false) {
    grid.innerHTML = "";
    try {
      const xmlText = await fetchWithCors(FEED_URL, bust);
      const items = parseYouTubeFeed(xmlText);
      allItems = items;
      filtered = items.slice();
      render();
    } catch (err) {
      console.error(err);
      grid.innerHTML = `<div style="padding:12px;color:#b00020;">Could not load videos.</div>`;
    } finally {
      if (reloadBtn) reloadBtn.disabled = false;
    }
  }

  // ---- CORS helper: try direct, then proxy ----
  async function fetchWithCors(url, bust = false) {
    const bustQ = bust ? (url.includes("?") ? "&" : "?") + "t=" + Date.now() : "";
    const direct = url + bustQ;

    // 1) Try direct (may fail due to CORS)
    try {
      const r = await fetch(direct, { mode: "cors" });
      if (r.ok) return await r.text();
      // If status is 200-299 but opaque, fall through to proxy
    } catch (_) { /* ignore and try proxy */ }

    // 2) CORS-friendly proxy (AllOrigins)
    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
    const rp = await fetch(proxied);
    if (!rp.ok) throw new Error(`Proxy fetch failed: ${rp.status}`);
    return await rp.text();
  }

  function parseYouTubeFeed(xmlText) {
    const doc = new window.DOMParser().parseFromString(xmlText, "application/xml");
    const parseErr = doc.querySelector("parsererror");
    if (parseErr) throw new Error("Invalid XML received.");

    const entries = Array.from(doc.querySelectorAll("entry"));
    const items = entries.map(e => {
      const id = text(e, "id");                  // yt:video:VIDEOID
      const videoId = id.split(":").pop();
      const title = text(e, "title");
      const published = text(e, "published");
      const group = e.querySelector("group");
      const thumb = group?.querySelector("thumbnail")?.getAttribute("url") || "";
      const desc = group?.querySelector("description")?.textContent || "";
      return { videoId, title, published, thumbnail: thumb, description: desc };
    });

    items.sort((a, b) => new Date(b.published) - new Date(a.published));
    return items;
  }

  function text(parent, tag) {
    return parent.querySelector(tag)?.textContent || "";
  }

  function onSearch() {
    const term = (q.value || "").trim().toLowerCase();
    filtered = !term
      ? allItems.slice()
      : allItems.filter(v =>
          v.title.toLowerCase().includes(term) ||
          (v.description || "").toLowerCase().includes(term)
        );
    render();
  }

  function render() {
    grid.innerHTML = "";
    const frag = document.createDocumentFragment();
    filtered.forEach(v => frag.appendChild(card(v)));
    grid.appendChild(frag);
  }

  function card(v) {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <div class="thumb" data-video="${esc(v.videoId)}" data-thumb="${esc(v.thumbnail)}">
        <img loading="lazy" src="${esc(v.thumbnail)}" alt="">
        <div class="playbtn"><div class="triangle"></div></div>
      </div>
      <div class="meta">
        <div class="vtitle">${esc(v.title)}</div>
        <div class="subtle">${fmtDate(v.published)}</div>
      </div>
    `;
    const thumb = el.querySelector(".thumb");
    thumb.addEventListener("click", () => playInline(thumb));
    return el;
  }

  // Replace a thumbnail with an inline YouTube iframe (muted autoplay)
  function playInline(thumbEl) {
    stopAllInlinePlayers();
    const vid = thumbEl.dataset.video;
    thumbEl.innerHTML = `
      <iframe
        src="https://www.youtube.com/embed/${encodeURIComponent(vid)}?autoplay=1&mute=1&playsinline=1"
        title="YouTube inline player"
        allow="autoplay; encrypted-media; picture-in-picture; clipboard-write"
        allowfullscreen
        style="width:100%;height:100%;border:0;display:block;"
      ></iframe>`;
  }

  // Restore all thumbs (stop any active players)
  function stopAllInlinePlayers() {
    document.querySelectorAll(".thumb").forEach(t => {
      if (t.querySelector("iframe")) {
        const thumbUrl = t.dataset.thumb || "";
        t.innerHTML = `
          <img loading="lazy" src="${esc(thumbUrl)}" alt="">
          <div class="playbtn"><div class="triangle"></div></div>`;
        t.onclick = () => playInline(t);
      }
    });
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
    }[c]));
  }
})();
