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

    // Attach modal logic after videos load
    document.querySelectorAll('.thumbnail').forEach(item => {
      item.addEventListener('click', function () {
        const videoId = this.getAttribute('data-video');
        const modal = document.getElementById('videoModal');
        const frame = document.getElementById('videoFrame');
        frame.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
        modal.style.display = 'block';
      });
    });

    document.querySelector('.close').addEventListener('click', function () {
      document.getElementById('videoModal').style.display = 'none';
      document.getElementById('videoFrame').src = '';
    });

    window.addEventListener('click', function (e) {
      if (e.target.id === 'videoModal') {
        document.getElementById('videoModal').style.display = 'none';
        document.getElementById('videoFrame').src = '';
      }
    });
  })
  .catch(error => {
    console.error('Error loading playlist:', error);
    document.getElementById('grid').innerText = 'Failed to load playlist.';
  });
