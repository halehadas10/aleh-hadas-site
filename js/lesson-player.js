/* Lesson page: native YouTube player (YouTube settings: captions + speed), audio-only Spotify bar,
   share/copy, platform links, resume, stop-on-leave, back-restore */
(function () {
  const q = new URLSearchParams(location.search);
  const vid = q.get('v');
  const PS_KEY = 'ah-player';
  const $ = id => document.getElementById(id);
  let player = null, lesson = null;

  const fmtDur = s => { s = Math.floor(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0'); return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss; };

  fetch('./data/lessons.json').then(r => r.json()).then(d => {
    const all = d.lessons || []; /* 23.10 v40: shared links to non-Spotify lessons must open too */
    lesson = all.find(l => l.id === vid);
    if (!lesson) { $('lpTitle').textContent = 'השיעור לא נמצא'; return; }
    document.title = lesson.topic + ' | עלה הדס';
    $('lpTitle').textContent = lesson.topic;
    $('lpRabbi').textContent = lesson.rabbi || '';
    $('lpDate').textContent = lesson.hebrewDate;
    $('lpDur').textContent = fmtDur(lesson.durationSec);
    $('lpDesc').textContent = lesson.description || '';
    $('lpYouTube').href = lesson.youtubeUrl;
    if (lesson.spotifyUrl) { $('lpSpotify').href = lesson.spotifyUrl; }
    else { $('lpSpotify').style.display = 'none'; }

    /* audio-only bar: Spotify embed (true audio-only playback, no video, no ripping) */
    const m = (lesson.spotifyUrl || '').match(/episode\/([A-Za-z0-9]+)/);
    if (m) {
      const bar = $('lpAudio');
      bar.hidden = false;
      bar.innerHTML = '<span class="lp-audio-label">האזנה בלבד, ללא וידאו</span>' +
        '<iframe src="https://open.spotify.com/embed/episode/' + m[1] + '?utm_source=generator&theme=0" ' +
        'width="100%" height="80" frameborder="0" title="האזנה בלבד" loading="lazy" ' +
        'allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe>';
    }

    /* עוד מהסדרה: this lesson's series first (nearest date after this lesson, wrapping),
       then עוד שיעורים: everything not already shown in the series row */
    const rest = all.filter(l => l.id !== vid)
      .sort((a, b) => new Date(a.published) - new Date(b.published));
    const curT = new Date(lesson.published).getTime();
    let start = rest.findIndex(l => new Date(l.published).getTime() > curT);
    if (start === -1) start = 0;
    const orderedAll = rest.slice(start).concat(rest.slice(0, start));
    const seriesRest = orderedAll.filter(l => l.series === lesson.series);
    const others = orderedAll.filter(l => l.series !== lesson.series);
    const st = $('lpSeriesTitle');
    if (seriesRest.length) {
      st.textContent = 'עוד מ' + lesson.series;
      $('lpSeriesGrid').id = 'lpSeriesGrid';
      renderCards($('lpSeriesGrid'), seriesRest);
    } else { st.style.display = 'none'; }
    const grid = $('lpMore');
    renderCards(grid, others);
    function renderCards(host, list) {
      list.forEach(l => {
        const a = document.createElement('a');
        a.className = 'ls-card';
        a.href = './lesson.html?v=' + encodeURIComponent(l.id);
        a.innerHTML = '<span class="ls-thumb"><img src="' + l.thumbnail + '" alt="' + l.topic + '" loading="lazy">' +
          '<span class="ls-dur">' + fmtDur(l.durationSec) + '</span></span>' +
          '<span class="ls-body"><span class="ls-topic">' + l.topic + '</span>' +
          '<span class="ls-meta">' + (l.rabbi ? l.rabbi + ' · ' : '') + l.hebrewDate + '</span></span>';
        host.appendChild(a);
      });
    }

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
        playerVars: { controls: 1, rel: 0, start: startAt, modestbranding: 1 },
        events: { onStateChange: ev => { if (window.AHsaveState) AHsaveState(ev.target, vid); } }
      });
    };
  }

  /* stop playback when leaving the page (audio kept playing, mostly on phones) */
  function stopPlayback() {
    try { if (player && player.stopVideo) player.stopVideo(); } catch (e) {}
    try {
      const st = JSON.parse(localStorage.getItem(PS_KEY) || 'null');
      if (st && st.v === vid) { st.playing = false; localStorage.setItem(PS_KEY, JSON.stringify(st)); }
    } catch (e) {}
  }
  window.addEventListener('pagehide', stopPlayback);
  window.addEventListener('beforeunload', stopPlayback);

  document.addEventListener('DOMContentLoaded', () => {
    /* חזרה לאתר: return to the exact prior spot. Same-origin referrer -> history.back()
       restores the page WITH its scroll position; otherwise the stored ah-return url. */
    const backBtn = document.querySelector('a.btn-back[href="./index.html"]');
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (backBtn && ref && ref.origin === location.origin && history.length > 1) {
        backBtn.addEventListener('click', function (e) { e.preventDefault(); history.back(); });
      } else {
        const st = JSON.parse(sessionStorage.getItem('ah-return') || 'null');
        if (st && st.url && backBtn) backBtn.href = st.url;
      }
    } catch (e) {}

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
