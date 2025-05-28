const apiKey = 'AIzaSyAiXOBowvA3h2fzPCyZXf2OkJNQUNupPxo';
const playlistId = 'PLD_PrR9HqVplPbdJn4BNN70FGPWvlYOB1';
const maxResults = 50;

fetch(`https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${apiKey}`)
  .then(res => res.json())
  .then(data => {
    const grid = document.getElementById('grid');
    data.items.forEach(item => {
      const vid = item.snippet.resourceId.videoId;
      const thumb = item.snippet.thumbnails.medium.url;
      const title = item.snippet.title;

      const div = document.createElement('div');
      div.className = 'video';
      div.innerHTML = `
        <a href="https://www.youtube.com/watch?v=${vid}" target="_blank" rel="noopener noreferrer">
          <img src="${thumb}" alt="${title}">
          <p>${title}</p>
        </a>
      `;
      grid.appendChild(div);
    });
  })
  .catch(error => {
    console.error('Error loading playlist:', error);
    document.getElementById('grid').innerText = 'Failed to load playlist.';
  });
