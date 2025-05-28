const apiKey = 'AIzaSyCLVqRwWSV-XaU5FpsY_7E7Cwr2SzTX-mg';
const playlistId = 'PLD_PrR9HqVplPbdJn4BNN70FGPWvlYOB1';
const maxResults = 50;

fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById('grid');

    if (!data.items || data.items.length === 0) {
      grid.innerText = 'No videos found or playlist is private.';
      return;
    }

    data.items.forEach(item => {
      const snippet = item.snippet;
      const vid = snippet?.resourceId?.videoId;
      const thumb = snippet?.thumbnails?.medium?.url;
      const title = snippet?.title;

      if (!vid || !thumb) return;

      const div = document.createElement('div');
      div.className = 'video';
      div.innerHTML = `
        <div class="thumbnail" data-video="${vid}">
          <img src="${thumb}" alt="${title}">
          <p>${title}</p>
        </div>
      `;
      grid.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error loading playlist:', error);
    document.getElementById('grid').innerText = 'Failed to load playlist.';
  });

// Handle modal video playback
document.addEventListener('click', function (e) {
  if (e.target.closest('.thumbnail')) {
    const videoId = e.target.closest('.thumbnail').getAttribute('data-video');
    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoFrame');
    frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    modal.style.display = 'block';
  }

  if (e.target.classList.contains('close') || e.target.id === 'videoModal') {
    const modal = document.getElementById('videoModal');
    const frame = document.getElementById('videoFrame');
    frame.src = '';
    modal.style.display = 'none';
  }
});
