/* עלה הדס - custom continuous audio player (23.10)
   Spotify-style: cover, shiur name, play/pause, -15/+30, seek.
   No listener login. Background play via Media Session API (tab stays open).
   Cross-page continuity: the audio element lives OUTSIDE the swapped <main>
   (see ah-shell.js); localStorage snapshot covers full reloads only. */
(function () {
  'use strict';
  if (window.AHPlayer) return;

  var LS_KEY = 'ah-player-v1';
  var audio = new Audio();
  audio.preload = 'auto';
  var current = null; /* {id, src, title, rabbi, cover} */
  var saveTimer = null;

  function $(id) { return document.getElementById(id); }
  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0');
    return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss;
  }

  /* ---------- UI ---------- */
  var bar;
  function buildBar() {
    if (bar) return;
    bar = document.createElement('div');
    bar.id = 'ahPlayer';
    bar.className = 'ahp';
    bar.setAttribute('dir', 'rtl');
    bar.hidden = true;
    bar.innerHTML =
      '<div class="ahp-progress" id="ahpProg" role="slider" aria-label="סרגל התקדמות" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" tabindex="0">' +
        '<div class="ahp-progress-fill" id="ahpFill"></div>' +
      '</div>' +
      '<div class="ahp-row">' +
        '<img class="ahp-cover" id="ahpCover" alt="" width="48" height="48">' +
        '<div class="ahp-meta">' +
          '<div class="ahp-title" id="ahpTitle"></div>' +
          '<div class="ahp-sub" id="ahpSub"></div>' +
        '</div>' +
        '<div class="ahp-time" id="ahpTime">0:00</div>' +
        '<div class="ahp-controls">' +
          '<button type="button" class="ahp-btn" id="ahpFwd" aria-label="קדימה 30 שניות" title="קדימה 30 שניות">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/><text x="12" y="12.5" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="800" font-family="inherit" fill="currentColor" stroke="none">30</text></svg>' +
          '</button>' +
          '<button type="button" class="ahp-btn ahp-play" id="ahpPlay" aria-label="הפעלה" title="הפעלה">' +
            '<svg class="ahp-i-play" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13l11-6.5z"/></svg>' +
            '<svg class="ahp-i-pause" viewBox="0 0 24 24" fill="currentColor" style="display:none"><path d="M7 5h3.6v14H7zM13.4 5H17v14h-3.6z"/></svg>' +
          '</button>' +
          '<button type="button" class="ahp-btn" id="ahpBack" aria-label="אחורה 15 שניות" title="אחורה 15 שניות">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 4v6h6"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/><text x="12" y="12.5" text-anchor="middle" dominant-baseline="central" font-size="9" font-weight="800" font-family="inherit" fill="currentColor" stroke="none">15</text></svg>' +
          '</button>' +
          '<button type="button" class="ahp-btn ahp-close" id="ahpClose" aria-label="סגירת הנגן" title="סגירה">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    document.body.classList.add('ahp-has-bar');

    $('ahpPlay').addEventListener('click', function () { API.toggle(); });
    $('ahpFwd').addEventListener('click', function () { API.seekBy(30); });
    $('ahpBack').addEventListener('click', function () { API.seekBy(-15); });
    $('ahpClose').addEventListener('click', function () { API.stop(); });
    var prog = $('ahpProg');
    function seekFromEvent(e) {
      if (!audio.duration) return;
      var r = prog.getBoundingClientRect();
      var x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      /* RTL bar: time flows right-to-left */
      var frac = 1 - Math.min(1, Math.max(0, x / r.width));
      audio.currentTime = frac * audio.duration;
    }
    prog.addEventListener('click', seekFromEvent);
    prog.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') API.seekBy(5);
      if (e.key === 'ArrowRight') API.seekBy(-5);
    });
  }

  function syncUI() {
    if (!bar || !current) return;
    var playing = !audio.paused && !audio.ended;
    $('ahpPlay').querySelector('.ahp-i-play').style.display = playing ? 'none' : '';
    $('ahpPlay').querySelector('.ahp-i-pause').style.display = playing ? '' : 'none';
    $('ahpPlay').setAttribute('aria-label', playing ? 'השהיה' : 'הפעלה');
    var d = audio.duration || 0, t = audio.currentTime || 0;
    $('ahpFill').style.width = d ? (t / d * 100) + '%' : '0%';
    $('ahpProg').setAttribute('aria-valuenow', d ? Math.round(t / d * 100) : 0);
    $('ahpTime').textContent = fmt(t) + ' / ' + fmt(d);
    if ('mediaSession' in navigator) {
      try { navigator.mediaSession.playbackState = playing ? 'playing' : 'paused'; } catch (_) {}
      try {
        navigator.mediaSession.setPositionState({ duration: d || 0, playbackRate: audio.playbackRate, position: t || 0 });
      } catch (_) {}
    }
  }

  function updateMediaSession() {
    if (!('mediaSession' in navigator) || !current) return;
    try {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title || '',
        artist: current.rabbi || 'בית מדרש עלה הדס',
        album: 'שיעורי עלה הדס',
        artwork: current.cover ? [
          { src: current.cover, sizes: '512x512', type: 'image/jpeg' }
        ] : []
      });
      navigator.mediaSession.setActionHandler('play', function () { API.play(); });
      navigator.mediaSession.setActionHandler('pause', function () { API.pause(); });
      navigator.mediaSession.setActionHandler('seekbackward', function () { API.seekBy(-15); });
      navigator.mediaSession.setActionHandler('seekforward', function () { API.seekBy(30); });
      navigator.mediaSession.setActionHandler('seekto', function (d) {
        if (d.seekTime != null) audio.currentTime = d.seekTime;
      });
      navigator.mediaSession.setActionHandler('stop', function () { API.stop(); });
    } catch (_) {}
  }

  /* ---------- snapshot (full reloads only) ---------- */
  function saveSnapshot() {
    if (!current) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify({
        id: current.id, src: current.src, title: current.title, rabbi: current.rabbi,
        cover: current.cover, pos: audio.currentTime || 0,
        playing: !audio.paused && !audio.ended, ts: Date.now()
      }));
    } catch (_) {}
  }
  function clearSnapshot() { try { localStorage.removeItem(LS_KEY); } catch (_) {} }

  function restoreSnapshot() {
    var st = null;
    try { st = JSON.parse(localStorage.getItem(LS_KEY) || 'null'); } catch (_) {}
    if (!st || !st.src) return;
    /* Fresh page load: browsers block autoplay-with-sound, so we restore the bar
       paused at the saved position; one tap continues. In-shell navigation never
       touches this path - the element keeps playing. */
    API.load({ id: st.id, src: st.src, title: st.title, rabbi: st.rabbi, cover: st.cover, position: st.pos, autoplay: false });
  }

  /* ---------- autonext (25.10): on natural end, play the next hosted lesson.
     Order mirrors the lesson page: lessons with audioUrl only, sorted by
     published date, first one after the current lesson (wrapping). */
  var lessonsCache = null;
  function fetchLessons(cb) {
    if (lessonsCache) return cb(lessonsCache);
    fetch('./data/lessons.json?v=' + Date.now()).then(function (r) { return r.json(); }).then(function (d) {
      lessonsCache = (d && d.lessons) || [];
      cb(lessonsCache);
    }).catch(function () { cb([]); });
  }
  function coverFor(l) {
    var m = (l.spotifyUrl || '').match(/episode\/([A-Za-z0-9]+)/);
    return m ? './assets/covers/ep-' + m[1] + '.jpg' : (l.thumbnail || './assets/covers/show.jpg');
  }
  function playNext(endedId) {
    fetchLessons(function (all) {
      if (!current || current.id !== endedId) return; /* user moved on meanwhile */
      var playable = all.filter(function (l) { return !!l.audioUrl; });
      var curL = null;
      playable.forEach(function (l) { if (l.id === endedId) curL = l; });
      if (!curL) return;
      var curT = new Date(curL.published || 0).getTime();
      var rest = playable.filter(function (l) { return l.id !== endedId; })
        .sort(function (a, b) { return new Date(a.published || 0) - new Date(b.published || 0); });
      if (!rest.length) return;
      var next = null;
      for (var i = 0; i < rest.length; i++) {
        if (new Date(rest[i].published || 0).getTime() > curT) { next = rest[i]; break; }
      }
      if (!next) next = rest[0];
      API.load({ id: next.id, src: next.audioUrl, title: next.topic, rabbi: next.rabbi || '', cover: coverFor(next) });
    });
  }

  /* ---------- events ---------- */
  audio.addEventListener('play', syncUI);
  audio.addEventListener('pause', function () { syncUI(); saveSnapshot(); });
  audio.addEventListener('ended', function () {
    var endedId = current && current.id;
    syncUI(); clearSnapshot();
    if (endedId) playNext(endedId);
  });
  audio.addEventListener('timeupdate', function () {
    syncUI();
    if (!saveTimer) {
      saveTimer = setTimeout(function () { saveTimer = null; saveSnapshot(); }, 2000);
    }
  });
  audio.addEventListener('loadedmetadata', function () {
    if (pendingPosition != null && isFinite(pendingPosition) && pendingPosition > 0) {
      try { audio.currentTime = Math.min(pendingPosition, (audio.duration || pendingPosition) - 0.25); } catch (_) {}
    }
    pendingPosition = null;
    syncUI();
  });
  window.addEventListener('pagehide', saveSnapshot);

  var pendingPosition = null;

  /* ---------- API ---------- */
  var API = {
    load: function (o) {
      if (!o || !o.src) return;
      buildBar();
      current = { id: o.id || o.src, src: o.src, title: o.title || '', rabbi: o.rabbi || '', cover: o.cover || '' };
      pendingPosition = (typeof o.position === 'number') ? o.position : null;
      var cov = $('ahpCover');
      cov.onerror = function () { cov.onerror = null; cov.src = './assets/covers/show.jpg'; };
      cov.src = current.cover || './assets/covers/show.jpg';
      $('ahpTitle').textContent = current.title;
      $('ahpSub').textContent = current.rabbi;
      bar.hidden = false;
      if (audio.getAttribute('src') !== current.src) {
        audio.src = current.src;
        audio.load();
      } else if (pendingPosition != null) {
        try { audio.currentTime = pendingPosition; } catch (_) {}
        pendingPosition = null;
      }
      updateMediaSession();
      saveSnapshot();
      if (o.autoplay !== false) API.play();
      syncUI();
    },
    play: function () {
      var p = audio.play();
      if (p && p.catch) p.catch(function () { syncUI(); });
    },
    pause: function () { audio.pause(); },
    toggle: function () { if (audio.paused || audio.ended) API.play(); else API.pause(); },
    seekBy: function (delta) {
      if (!audio.duration) return;
      try { audio.currentTime = Math.min(audio.duration, Math.max(0, (audio.currentTime || 0) + delta)); } catch (_) {}
      syncUI();
    },
    stop: function () {
      audio.pause();
      if (bar) bar.hidden = true;
      document.body.classList.remove('ahp-has-bar');
      current = null;
      clearSnapshot();
      if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'none'; } catch (_) {} }
    },
    state: function () {
      return {
        current: current, position: audio.currentTime || 0, duration: audio.duration || 0,
        playing: !audio.paused && !audio.ended
      };
    },
    isLoaded: function () { return !!current; }
  };
  window.AHPlayer = API;

  /* Restore after a full page load (refresh / new visit to the tab's site). */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreSnapshot);
  } else {
    restoreSnapshot();
  }
})();
