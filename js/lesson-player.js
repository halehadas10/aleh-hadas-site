/* Lesson page: custom YouTube player (volume + speed), share/copy, platform links, resume */
(function () {
  const q = new URLSearchParams(location.search);
  const vid = q.get('v');
  const PS_KEY = 'ah-player';
  const $ = id => document.getElementById(id);
  let player = null, lesson = null;

  const fmt = s => { s = Math.floor(s || 0); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

  fetch('./data/lessons.json').then(r => r.json()).then(d => {
    lesson = (d.lessons || []).find(l => l.id === vid);
    if (!lesson) { $('lpTitle').textContent = 'השיעור לא נמצא'; return; }
    document.title = lesson.topic + ' | עלה הדס';
    $('lpTitle').textContent = lesson.topic;
    $('lpRabbi').textContent = lesson.rabbi || '';
    $('lpDate').textContent = lesson.hebrewDate;
    $('lpDur').textContent = Math.round(lesson.durationSec / 60) + ' דקות';
    $('lpDesc').textContent = lesson.description || '';
    $('lpSeries').innerHTML = 'עוד מהשיעורים: <a href="' + (lesson.seriesUrl || '#') + '" target="_blank" rel="noopener">' + lesson.series + '</a>';
    $('lpYouTube').href = lesson.youtubeUrl;
    if (lesson.spotifyUrl) { $('lpSpotify').href = lesson.spotifyUrl; }
    else { $('lpSpotify').style.display = 'none'; }
    /* more from this series */
    const more = d.lessons.filter(l => l.series === lesson.series && l.id !== vid && l.onSpotify).slice(0, 4);
    const grid = $('lpMore');
    more.forEach(l => {
      const a = document.createElement('a');
      a.className = 'ls-card';
      a.href = './lesson.html?v=' + encodeURIComponent(l.id);
      a.innerHTML = '<span class="ls-thumb"><img src="' + l.thumbnail + '" alt="' + l.topic + '" loading="lazy">' +
        '<span class="ls-dur">' + Math.round(l.durationSec / 60) + ' דקות</span></span>' +
        '<span class="ls-body"><span class="ls-topic">' + l.topic + '</span>' +
        '<span class="ls-meta">' + (l.rabbi ? l.rabbi + ' · ' : '') + l.hebrewDate + '</span></span>';
      grid.appendChild(a);
    });
    initPlayer();
  }).catch(() => { $('lpTitle').textContent = 'שגיאה בטעינת השיעור'; });

  function initPlayer() {
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    let startAt = 0;
    try {
      const st = JSON.parse(localStorage.getItem(PS_KEY) || 'null');
      if (st && st.v === vid && st.t > 10) startAt = Math.floor(st.t);
    } catch (e) {}
    window.onYouTubeIframeAPIReady = () => {
      player = new YT.Player('lpFrame', {
        videoId: vid,
        playerVars: { controls: 0, rel: 0, start: startAt, modestbranding: 1 },
        events: { onReady: onReady, onStateChange: onState }
      });
    };
  }

  function onReady() {
    const seek = $('lpSeek'), vol = $('lpVol'), spd = $('lpSpeed');
    vol.value = player.getVolume();
    setInterval(() => {
      if (!player.getDuration) return;
      const d = player.getDuration(), c = player.getCurrentTime();
      if (d) seek.value = (c / d) * 1000;
      $('lpTime').textContent = fmt(c) + ' / ' + fmt(d);
    }, 500);
    seek.addEventListener('input', () => {
      const d = player.getDuration();
      if (d) player.seekTo((seek.value / 1000) * d, true);
    });
    vol.addEventListener('input', () => player.setVolume(vol.value));
    spd.addEventListener('change', () => player.setPlaybackRate(parseFloat(spd.value)));
    if (window.AHsaveState) AHsaveState(player, vid);
  }

  function onState(ev) {
    const btn = $('lpPlay');
    btn.innerHTML = ev.data === 1
      ? '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>'
      : '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg>';
  }

  document.addEventListener('DOMContentLoaded', () => {
    $('lpPlay').addEventListener('click', () => {
      if (!player) return;
      const s = player.getPlayerState();
      s === 1 ? player.pauseVideo() : player.playVideo();
    });
    $('lpShare').addEventListener('click', async () => {
      const url = location.href;
      const data = { title: lesson ? lesson.topic : 'שיעור', text: lesson ? lesson.title : '', url };
      if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
      try {
        await navigator.clipboard.writeText(url);
        $('lpShare').textContent = 'הקישור הועתק ✓';
        setTimeout(() => $('lpShare').textContent = 'שיתוף / העתקת קישור', 2200);
      } catch (e) {}
    });
  });
})();
