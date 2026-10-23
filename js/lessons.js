/* Virtual midrash: renders lesson cards from data/lessons.json (homepage carousel + lessons page) */
(function () {
  const PS_KEY = 'ah-player';
  const fmtDur = s => { s = Math.floor(s || 0); const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = String(s % 60).padStart(2, '0'); return h ? h + ':' + String(m).padStart(2, '0') + ':' + ss : m + ':' + ss; };

  async function loadData() {
    const base = document.body.dataset.base || '.';
    const r = await fetch(base + '/data/lessons.json?v=' + Date.now());
    return r.json();
  }

  function card(l, base) {
    const d = document.createElement('div');
    d.className = 'ls-card reveal is-visible';
    const url = base + '/lesson.html?v=' + encodeURIComponent(l.id);
    d.innerHTML =
      '<a class="ls-main" href="' + url + '">' +
      '<span class="ls-thumb"><img src="' + l.thumbnail + '" alt="' + l.topic + '" loading="lazy">' +
      '<span class="ls-dur">' + fmtDur(l.durationSec) + '</span>' +
      '<span class="ls-play"><svg viewBox="0 0 24 24"><path fill="currentColor" d="M8 5v14l11-7z"/></svg></span></span>' +
      '<span class="ls-body">' +
      '<span class="ls-topic">' + l.topic + '</span>' +
      '<span class="ls-meta">' + (l.rabbi ? l.rabbi + ' · ' : '') + l.hebrewDate + '</span>' +
      (l.description ? '<span class="ls-desc">' + l.description.replace(/</g, '&lt;').slice(0, 110) + (l.description.length > 110 ? '…' : '') + '</span>' : '') +
      '<span class="ls-series">עוד מהשיעורים: ' + l.series + '</span>' +
      '</span></a>' +
      '<span class="ls-actions">' +
      '<a class="ls-act" href="' + url + '">▶ צפייה</a>' +
      (l.spotifyUrl ? '<a class="ls-act ls-act-sp" href="' + l.spotifyUrl + '" target="_blank" rel="noopener">האזנה בספוטיפיי</a>' : '') +
      '</span>';
    return d;
  }

  function renderCarousel(data) {
    const host = document.getElementById('lsCarousel');
    if (!host) return;
    const both = data.lessons;
    both.forEach(l => host.appendChild(card(l, '.')));
    const cnt = document.getElementById('lsCount');
    if (cnt) cnt.textContent = both.length + ' שיעורים זמינים לצפייה ולהאזנה';
    const next = document.getElementById('lsNext'), prev = document.getElementById('lsPrev');
    if (next) next.onclick = () => host.scrollBy({ left: -host.clientWidth * 0.85, behavior: 'smooth' });
    if (prev) prev.onclick = () => host.scrollBy({ left: host.clientWidth * 0.85, behavior: 'smooth' });
  }

  function renderPage(data) {
    const host = document.getElementById('lsPage');
    if (!host) return;
    const both = data.lessons;
    const bySeries = {};
    both.forEach(l => { (bySeries[l.series] = bySeries[l.series] || []).push(l); });
    Object.keys(bySeries).forEach(name => {
      const sec = document.createElement('section');
      sec.className = 'ls-series-sec';
      sec.innerHTML = '<h2 class="ls-series-title">' + name + '</h2>' +
        '<p class="ls-series-count">' + bySeries[name].length + ' שיעורים</p>';
      const grid = document.createElement('div');
      grid.className = 'ls-grid';
      bySeries[name].forEach(l => grid.appendChild(card(l, '.')));
      sec.appendChild(grid);
      host.appendChild(sec);
    });
    const cnt = document.getElementById('lsCount');
    if (cnt) cnt.textContent = both.length + ' שיעורים · מתעדכן אוטומטית כל יום';
  }

  function saveState(player, v) {
    if (!player || !player.getCurrentTime) return;
    let hasPlayed = false;
    clearInterval(player._ahSave);
    player._ahSave = setInterval(() => {
      try {
        const stt = player.getPlayerState();
        if (stt === 1) hasPlayed = true;
        if (!hasPlayed) return; /* autoplay blocked: keep the saved resume state */
        localStorage.setItem(PS_KEY, JSON.stringify({
          v, t: player.getCurrentTime(),
          playing: stt === 1, ts: Date.now()
        }));
      } catch (e) {}
    }, 3000);
  }
  window.AHsaveState = saveState;

  const RET_KEY = 'ah-return';
  document.addEventListener('click', e => {
    const a = e.target.closest && e.target.closest('a.ls-main, a.ls-act');
    if (a && a.href && a.href.indexOf('lesson.html') !== -1) {
      try { sessionStorage.setItem(RET_KEY, JSON.stringify({ url: location.pathname, y: window.scrollY })); } catch (_) {}
    }
  });
  function restoreScroll() {
    let st = null;
    try { st = JSON.parse(sessionStorage.getItem(RET_KEY) || 'null'); } catch (_) {}
    if (!st) return;
    if (!location.pathname.endsWith(String(st.url).split('/').pop())) return;
    sessionStorage.removeItem(RET_KEY);
    try { history.scrollRestoration = 'manual'; } catch (_) {}
    window.scrollTo({ top: st.y, behavior: 'instant' });
  }

  document.addEventListener('DOMContentLoaded', () => {
    loadData().then(d => { renderCarousel(d); renderPage(d); restoreScroll(); }).catch(() => {});
  });
})();
