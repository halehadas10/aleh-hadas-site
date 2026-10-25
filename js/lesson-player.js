/* Lesson page: native YouTube player (YouTube settings: captions + speed), audio-only Spotify bar,
   share/copy, platform links, resume, stop-on-leave, back-restore */
(function () {
  const PS_KEY = 'ah-player';
  const $ = id => document.getElementById(id);
  let player = null, lesson = null, vid = null;

  const fmtDur = s => { s = Math.floor(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0'); return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss; };

  window.AHLessonInit = ahInit;
  function ahInit() {
  /* vid must be read per init: under the navigation shell this script loads
     once (on the index, no ?v=) and lesson pages arrive later via swaps */
  vid = new URLSearchParams(location.search).get('v');
  fetch('./data/lessons.json?v=' + Date.now()).then(r => r.json()).then(d => {
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

    /* audio-only bar: our own player when audioUrl exists (no listener login);
       Spotify embed kept as fallback until audio files are hosted */
    if (lesson.audioUrl && window.AHPlayer) {
      const bar2 = $('lpAudio');
      bar2.hidden = false;
      const cover = (lesson.spotifyUrl || '').match(/episode\/([A-Za-z0-9]+)/)
        ? './assets/covers/ep-' + lesson.spotifyUrl.match(/episode\/([A-Za-z0-9]+)/)[1] + '.jpg'
        : (lesson.thumbnail || './assets/covers/show.jpg');
      bar2.innerHTML = '<span class="lp-audio-label">האזנה בלבד, ללא וידאו</span>' +
        '<button type="button" class="lp-own-play" id="lpOwnPlay">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>' +
        ' נגן את השיעור</button>';
      $('lpOwnPlay').addEventListener('click', function () {
        window.AHPlayer.load({
          id: lesson.id, src: lesson.audioUrl,
          title: lesson.topic, rabbi: lesson.rabbi || '', cover: cover
        });
      });
    }
    const m = (!lesson.audioUrl || !window.AHPlayer) ? (lesson.spotifyUrl || '').match(/episode\/([A-Za-z0-9]+)/) : null;
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
    ahBindChrome();
  }).catch(() => { $('lpTitle').textContent = 'שגיאה בטעינת השיעור'; });

  }
  ahInit();

  function initPlayer() {
    let startAt = 0;
    try {
      const st = JSON.parse(localStorage.getItem(PS_KEY) || 'null');
      if (st && st.v === vid && st.t > 10) startAt = Math.floor(st.t);
    } catch (e) {}
    let created = false;
    function createPlayer() {
      if (created) return; created = true;
      player = new YT.Player('lpFrame', {
        videoId: vid,
        playerVars: { controls: 1, rel: 0, start: startAt, modestbranding: 1 },
        events: { onStateChange: ev => { if (window.AHsaveState) AHsaveState(ev.target, vid); } }
      });
    }
    /* v78 mobile fallback: if the IFrame API is blocked or slow (seen blank on
       phone Safari/4G), inject a plain youtube-nocookie embed after 4s */
    setTimeout(function () {
      if (created) return; created = true;
      const host = document.getElementById('lpFrame');
      if (!host || host.tagName !== 'DIV') return;
      host.outerHTML = '<iframe id="lpFrame" class="lp-frame" ' +
        'src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vid) + '?rel=0&modestbranding=1" ' +
        'title="נגן וידאו" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen></iframe>';
    }, 4000);
    if (window.YT && window.YT.Player) { createPlayer(); return; }
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);
    window.onYouTubeIframeAPIReady = createPlayer;
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

  function ahBindChrome() {
    /* חזרה לאתר: return to the exact prior spot. Same-origin referrer -> history.back()
       restores the page WITH its scroll position; otherwise the stored ah-return url. */
    const backBtn = document.querySelector('a.btn-back[href="./index.html"]');
    try {
      const ref = document.referrer ? new URL(document.referrer) : null;
      if (backBtn && ref && ref.origin === location.origin && history.length > 1 && !window.AHShellActive) {
        if (!backBtn.__ahBound) { backBtn.__ahBound = true; backBtn.addEventListener('click', function (e) { e.preventDefault(); history.back(); }); }
      } else {
        const st = JSON.parse(sessionStorage.getItem('ah-return') || 'null');
        if (st && st.url && backBtn) backBtn.href = st.url;
      }
    } catch (e) {}

    const shareBtn = $('lpShare');
    if (shareBtn && !shareBtn.__ahBound) {
      shareBtn.__ahBound = true;
      shareBtn.addEventListener('click', async () => {
        const url = location.href;
        const data = { title: lesson ? lesson.topic : 'שיעור', text: lesson ? lesson.title : '', url };
        if (navigator.share) { try { await navigator.share(data); return; } catch (e) { if (e && e.name === 'AbortError') return; } }
        try {
          await navigator.clipboard.writeText(url);
          shareBtn.textContent = 'הקישור הועתק ✓';
          setTimeout(() => shareBtn.textContent = 'שיתוף / העתקת קישור', 2200);
        } catch (e) {}
      });
    }
  }
  document.addEventListener('DOMContentLoaded', ahBindChrome);
  window.AHLessonBindChrome = ahBindChrome;
})();
