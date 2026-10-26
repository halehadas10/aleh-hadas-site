/* Lesson page: native YouTube player (YouTube settings: captions + speed), own audio player,
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

    /* Own player only. Unhosted lessons keep the outbound Spotify action. */
    if (window.AHPlayer && window.AHPlayer.unmount) window.AHPlayer.unmount();
    $('lpAudio').innerHTML = '';
    $('lpAudio').hidden = true;
    if (lesson.audioUrl && window.AHPlayer) {
      /* v91 (user 14:10:52): player sits INSIDE the audio frame from the start,
         visible and paused - no intermediate "נגן את השיעור" button;
         one Play click starts. Mount point re-created here on every init,
         so the bar is always (re)built after our own innerHTML rewrite. */
      const bar2 = $('lpAudio');
      bar2.hidden = false;
      const cover = (lesson.spotifyUrl || '').match(/episode\/([A-Za-z0-9]+)/)
        ? './assets/covers/ep-' + lesson.spotifyUrl.match(/episode\/([A-Za-z0-9]+)/)[1] + '.jpg'
        : (lesson.thumbnail || './assets/covers/show.jpg');
      bar2.innerHTML = '<div class="lp-player-mount" id="lpPlayerMount"></div>';
      window.AHPlayer.mount({
        id: lesson.id, src: lesson.audioUrl,
        title: lesson.topic, rabbi: lesson.rabbi || '', cover: cover,
        durationSec: lesson.durationSec || 0,
        host: $('lpPlayerMount')
      });
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
    let created = false, ready = false, swapped = false;
    function createPlayer() {
      if (created || swapped) return; created = true;
      player = new YT.Player('lpFrame', {
        videoId: vid,
        playerVars: { controls: 1, rel: 0, start: startAt, modestbranding: 1 },
        events: {
          onReady: function () { ready = true; },
          onError: function () { swapNocookie(); },
          onStateChange: ev => { if (window.AHsaveState) AHsaveState(ev.target, vid); }
        }
      });
    }
    /* v142 (owner 26.10 14:15, real iPhone retest still blank): ONE watchdog
       for every dead path - v78's fallback only covered "API script never
       loaded", leaving a permanent white box when the API loaded but the
       player iframe never became ready (blocked embed), or when the nocookie
       embed itself is blocked device-side. Chain: 4s without onReady ->
       plain nocookie iframe; 6s without its load event -> tappable thumbnail
       link. Audio player untouched. */
    function swapNocookie() {
      if (swapped) return; swapped = true; created = true;
      const host = document.getElementById('lpFrame');
      if (!host) return;
      host.outerHTML = '<iframe id="lpFrame" class="lp-frame" ' +
        'src="https://www.youtube-nocookie.com/embed/' + encodeURIComponent(vid) + '?rel=0&modestbranding=1" ' +
        'title="נגן וידאו" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen></iframe>';
      const f = document.getElementById('lpFrame');
      let loaded = false;
      if (f) f.addEventListener('load', function () { loaded = true; });
      setTimeout(function () { if (!loaded) swapLinkCard(); }, 6000);
    }
    function swapLinkCard() {
      const host = document.getElementById('lpFrame');
      if (!host) return;
      host.outerHTML = '<a id="lpFrame" class="lp-frame lp-yt-fallback" href="' + lesson.youtubeUrl + '" target="_blank" rel="noopener">' +
        '<img src="https://i.ytimg.com/vi/' + encodeURIComponent(vid) + '/hqdefault.jpg" alt="' + lesson.title + '" loading="lazy">' +
        '<span class="lp-yt-fallback-label">הווידאו לא נטען כאן - לחצו לצפייה ביוטיוב</span></a>';
    }
    setTimeout(function () { if (!ready) swapNocookie(); }, 4000);
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
    /* v142 (owner 26.10 14:16): חזרה לאתר has a FIXED target now
       (./index.html#virtual, the homepage beit-midrash section) - the old
       history.back()/ah-return hijack that sent users to arbitrary prior
       spots is removed. The recommendations page keeps its own back logic. */

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
