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
  var mountOpts = null; /* lesson-page mount config for in-frame player (v91) */
  function buildBar(host) {
    if (bar && bar.isConnected) {
      if (host && bar.parentNode !== host) {
        bar.classList.add('ahp-inflow');
        host.appendChild(bar);
        document.body.classList.remove('ahp-has-bar');
      } else if (!host) {
        var existing_mount = document.getElementById('lpAudio');
        if (existing_mount && bar.parentNode !== existing_mount.parentNode) {
          /* v86: #lpAudio innerHTML gets rewritten by lesson-player init -
             the bar must be a SIBLING after it, not a child (unless an explicit
             in-frame host mount point is given). v87: relocate whenever the bar
             lives anywhere else (body or inside mount) */
          bar.classList.add('ahp-inflow');
          existing_mount.parentNode.insertBefore(bar, existing_mount.nextSibling);
          document.body.classList.remove('ahp-has-bar');
        }
      }
      return;
    }
    bar = null;
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
          '<button type="button" class="ahp-btn ahp-speed" id="ahpSpeed" aria-label="מהירות ניגון" title="מהירות ניגון">\u00d71</button>' +
          '<span class="ahp-volwrap"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ahp-volicon"><path d="M11 5L6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 5.5a9.4 9.4 0 0 1 0 13"/></svg><input type="range" class="ahp-vol" id="ahpVol" min="0" max="1" step="0.05" value="1" aria-label="עוצמת קול" title="עוצמת קול"></span>' +
          '<button type="button" class="ahp-btn ahp-close" id="ahpClose" aria-label="סגירת הנגן" title="סגירה">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';
    /* v85 (user video 213-280s): player lives in-flow on the lesson page,
       never as a floating/fixed bar. Audio keeps playing when leaving;
       no bar follows. Reference: shaveihevron.org pattern. */
    var mount = document.getElementById('lpAudio');
    if (host) {
      bar.classList.add('ahp-inflow');
      host.appendChild(bar);
    } else if (mount) {
      bar.classList.add('ahp-inflow');
      mount.parentNode.insertBefore(bar, mount.nextSibling);
    } else {
      document.body.appendChild(bar);
    }

    $('ahpPlay').addEventListener('click', function () {
      if (bar && bar.dataset.preview === '1' && mountOpts) {
        API.load({ id: mountOpts.id, src: mountOpts.src, title: mountOpts.title, rabbi: mountOpts.rabbi, cover: mountOpts.cover });
        return;
      }
      API.toggle();
    });
    $('ahpFwd').addEventListener('click', function () { API.seekBy(30); });
    $('ahpBack').addEventListener('click', function () { API.seekBy(-15); });
    /* Speed cycle + volume (persisted) */
    var SPEEDS = [1, 1.25, 1.5, 2, 0.5, 0.75];
    var speedIdx = 0;
    try {
      var sv = parseFloat(localStorage.getItem('ahSpeed'));
      if (sv > 0) { var k = SPEEDS.indexOf(sv); speedIdx = k >= 0 ? k : 0; if (k < 0) SPEEDS[0] = sv; }
      var vv = parseFloat(localStorage.getItem('ahVol'));
      if (!isNaN(vv)) audio.volume = Math.min(1, Math.max(0, vv));
    } catch (e) {}
    audio.playbackRate = SPEEDS[speedIdx];
    var speedBtn = $('ahpSpeed'), volInput = $('ahpVol');
    function paintSpeed() { speedBtn.textContent = '\u00d7' + SPEEDS[speedIdx]; }
    paintSpeed();
    speedBtn.addEventListener('click', function () {
      speedIdx = (speedIdx + 1) % SPEEDS.length;
      audio.playbackRate = SPEEDS[speedIdx];
      paintSpeed();
      try { localStorage.setItem('ahSpeed', String(SPEEDS[speedIdx])); } catch (e) {}
    });
    volInput.value = String(audio.volume);
    volInput.addEventListener('input', function () {
      audio.volume = parseFloat(volInput.value);
      try { localStorage.setItem('ahVol', volInput.value); } catch (e) {}
    });
    $('ahpClose').addEventListener('click', function () { API.stop(); });
    bar.dataset.preview = '';
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

  /* Paused preview of the page's own lesson inside the mounted frame:
     real title/rabbi/cover and total duration (from lessons.json), 0:00 position,
     play icon. Audio element untouched; first Play loads and starts. */
  function previewBar() {
    if (!bar || !mountOpts) return;
    bar.dataset.preview = '1';
    var cov = $('ahpCover');
    cov.onerror = function () { cov.onerror = null; cov.src = './assets/covers/show.jpg'; };
    cov.src = mountOpts.cover || './assets/covers/show.jpg';
    $('ahpTitle').textContent = mountOpts.title || '';
    $('ahpSub').textContent = mountOpts.rabbi || '';
    $('ahpFill').style.width = '0%';
    $('ahpProg').setAttribute('aria-valuenow', 0);
    $('ahpTime').textContent = fmt(0) + ' / ' + fmt(mountOpts.durationSec || 0);
    $('ahpPlay').querySelector('.ahp-i-play').style.display = '';
    $('ahpPlay').querySelector('.ahp-i-pause').style.display = 'none';
    $('ahpPlay').setAttribute('aria-label', 'הפעלה');
    /* X stops whatever is actually playing elsewhere; hidden when nothing is */
    var cl = $('ahpClose'); if (cl) cl.style.display = current ? '' : 'none';
  }

  /* ---------- API ---------- */
  var API = {
    load: function (o) {
      if (!o || !o.src) return;
      buildBar(mountOpts && mountOpts.host && mountOpts.host.isConnected ? mountOpts.host : null);
      bar.dataset.preview = '';
      var cl0 = $('ahpClose'); if (cl0) cl0.style.display = '';
      current = { id: o.id || o.src, src: o.src, title: o.title || '', rabbi: o.rabbi || '', cover: o.cover || '' };
      pendingPosition = (typeof o.position === 'number') ? o.position : null;
      var cov = $('ahpCover');
      cov.onerror = function () { cov.onerror = null; cov.src = './assets/covers/show.jpg'; };
      cov.src = current.cover || './assets/covers/show.jpg';
      $('ahpTitle').textContent = current.title;
      $('ahpSub').textContent = current.rabbi;
      bar.hidden = !bar.classList.contains('ahp-inflow');
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
      current = null;
      clearSnapshot();
      document.body.classList.remove('ahp-has-bar');
      if ('mediaSession' in navigator) { try { navigator.mediaSession.playbackState = 'none'; } catch (_) {} }
      /* v91: mounted in-frame player returns to its paused preview (one-click
         replay) instead of vanishing - there is no separate launch button. */
      if (mountOpts && mountOpts.host && mountOpts.host.isConnected) { previewBar(); return; }
      if (bar) bar.hidden = true;
    },
    /* v91 (user 25.10 14:10:52): mount the player INSIDE the lesson page's
       audio frame, visible from page load. Same lesson -> live bind (continuity
       preserved); otherwise a paused preview bound to the page's lesson -
       the audio element is untouched until the first Play click. */
    mount: function (o) {
      if (!o || !o.host) return;
      mountOpts = o;
      buildBar(o.host);
      bar.hidden = false;
      if (current && current.id === o.id) {
        bar.dataset.preview = '';
        var cl = $('ahpClose'); if (cl) cl.style.display = '';
        /* v92: rebuilt bar starts empty - re-populate meta + cover (same lesson) */
        var cov = $('ahpCover');
        if (cov) { cov.onerror = function () { cov.onerror = null; cov.src = './assets/covers/show.jpg'; }; cov.src = current.cover || './assets/covers/show.jpg'; }
        if ($('ahpTitle')) $('ahpTitle').textContent = current.title;
        if ($('ahpSub')) $('ahpSub').textContent = current.rabbi;
        syncUI();
        return;
      }
      previewBar();
    },
    reshow: function () {
      if (!current) return;
      buildBar();
      /* v88: rebuilt bar starts empty - re-populate meta + cover */
      var cov = $('ahpCover');
      if (cov) { cov.onerror = function () { cov.onerror = null; cov.src = './assets/covers/show.jpg'; }; cov.src = current.cover || './assets/covers/show.jpg'; }
      if ($('ahpTitle')) $('ahpTitle').textContent = current.title;
      if ($('ahpSub')) $('ahpSub').textContent = current.rabbi;
      bar.hidden = !bar.classList.contains('ahp-inflow');
      if (!bar.hidden) { var t0 = $('ahpTime'); if (t0) syncUI(); }
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
