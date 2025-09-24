/* VUMC YouTube Grid (RSS, inline play, no modal)
 * - No API key required (uses public channel RSS feed)
 * - Click a card to play inline (iframe replaces the image)
 * - Clicking a different card stops others (restores thumbnail)
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
    fetchFeed().then(items => {
      allItems = items;
      filtered = items.slice();
      render();
    }).catch(err => {
      console.error(err);
      grid.innerHTML = `<div style="padding:12px;color:#b00020;">Could not load videos.</div>`;
    });

    q?.addEventListener("input", onSearch);
    reloadBtn?.addEventListener("click", () => {
      reloadBtn.disabled = true;
      fetchFeed(true).then(items => {
        allItems = items;
        filtered = items.slice();
        render();
      }).finally(() => (reloadBtn.disabled = false));
    });
  }

  async function fetchFeed(bustCache = false) {
    const url = FEED_URL + (bustCache ? `&t=${Date.now()}` : "");
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Feed error ${res.status}`);
    const xmlText = await res.text();
    const doc = new window.DOMParser().parseFromString(xmlText, "application/xml");

    const entries = Array.from(doc.querySelectorAll("entry"));
    const items = entries.map(e => {
      const id = text(e, "id");           // yt:video:VIDEOID
      const videoId = id.split(":").pop();
      const title = text(e, "title");
      const published = text(e, "published");
      const group = e.querySelector("group");
      const thumb = group?.querySelector("thumbnail")?.getAttribute("url") || "";
      const desc = group?.querySelector("description")?.textContent || "";
      return { videoId, title, published, thumbnail: thumb, description: desc };
    });

    // newest first (RSS usually already sorted)
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
      const isIframe = !!t.querySelector("iframe");
      if (isIframe) {
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
