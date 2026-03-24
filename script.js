/* VUMC YouTube Grid
 * - Shows past videos only
 * - Click thumbnail to open video in modal popup
 * - RSS + AllOrigins proxy fallback (no API key)
 */

(function () {
  const CHANNEL_ID = window.CHANNEL_ID || "";
  const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(CHANNEL_ID)}`;

  const grid = document.getElementById("grid");
  const q = document.getElementById("q");
  const reloadBtn = document.getElementById("reload");

  const modal = document.getElementById("videoModal");
  const modalFrame = document.getElementById("videoModalFrame");
  const modalClose = document.getElementById("videoModalClose");
  const modalBackdrop = document.getElementById("videoModalBackdrop");

  let allItems = [];
  let filtered = [];

  init();

  function init() {
    loadFeed();

    q?.addEventListener("input", onSearch);
    reloadBtn?.addEventListener("click", () => loadFeed(true));

    modalClose?.addEventListener("click", closeModal);
    modalBackdrop?.addEventListener("click", closeModal);

    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  async function loadFeed(bust = false) {
    grid.innerHTML = "";
    try {
      const xmlText = await fetchWithCors(FEED_URL, bust);
      let items = parseYouTubeFeed(xmlText);

      const now = new Date();

      // Keep only videos with publish dates in the past
      items = items.filter(item => {
        const publishedDate = new Date(item.published);
        return !isNaN(publishedDate) && publishedDate <= now;
      });

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

  async function fetchWithCors(url, bust = false) {
    const bustQ = bust ? (url.includes("?") ? "&" : "?") + "t=" + Date.now() : "";
    const direct = url + bustQ;

    try {
      const r = await fetch(direct, { mode: "cors" });
      if (r.ok) return await r.text();
    } catch (_) {}

    const proxied = `https://api.allorigins.win/raw?url=${encodeURIComponent(direct)}`;
    const rp = await fetch(proxied);
    if (!rp.ok) throw new Error(`Proxy fetch failed: ${rp.status}`);
    return await rp.text();
  }

  function parseYouTubeFeed(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "application/xml");
    if (doc.querySelector("parsererror")) throw new Error("Invalid XML");

    const entries = Array.from(doc.querySelectorAll("entry"));
    const items = entries.map(e => {
      const id = e.querySelector("id")?.textContent || "";
      const videoId = id.split(":").pop();
      const title = e.querySelector("title")?.textContent || "";
      const published = e.querySelector("published")?.textContent || "";
      const group = e.querySelector("group");
      const thumb = group?.querySelector("thumbnail")?.getAttribute("url") || "";
      const desc = group?.querySelector("description")?.textContent || "";

      return {
        videoId,
        title,
        published,
        thumbnail: thumb,
        description: desc
      };
    });

    items.sort((a, b) => new Date(b.published) - new Date(a.published));
    return items;
  }

  function onSearch() {
    const term = (q?.value || "").trim().toLowerCase();
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

    if (!filtered.length) {
      grid.innerHTML = `<div style="padding:12px;">No past videos found.</div>`;
      return;
    }

    const frag = document.createDocumentFragment();
    filtered.forEach(v => frag.appendChild(card(v)));
    grid.appendChild(frag);
  }

  function card(v) {
    const el = document.createElement("div");
    el.className = "card";
    el.innerHTML = `
      <button class="thumb thumb-btn" type="button" aria-label="Play ${esc(v.title)}">
        <img loading="lazy" src="${esc(v.thumbnail)}" alt="${esc(v.title)}">
        <div class="playbtn"><div class="triangle"></div></div>
      </button>
      <div class="meta">
        <div class="vtitle">${esc(v.title)}</div>
        <div class="subtle">${fmtDate(v.published)}</div>
      </div>
    `;

    const thumb = el.querySelector(".thumb");
    thumb.addEventListener("click", () => openModal(v.videoId));

    return el;
  }

  function openModal(videoId) {
    if (!modal || !modalFrame) return;

    modalFrame.src = `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&rel=0`;
    modal.classList.remove("hidden");
    modal.setAttribute("aria-hidden", "false");
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    if (!modal || !modalFrame) return;

    modalFrame.src = "";
    modal.classList.add("hidden");
    modal.setAttribute("aria-hidden", "true");
    document.documentElement.style.overflow = "";
    document.body.style.overflow = "";
  }

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }

  function esc(s) {
    return String(s || "").replace(/[&<>"']/g, c => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    }[c]));
  }
})();
