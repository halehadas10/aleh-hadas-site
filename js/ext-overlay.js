/* In-site overlay for external articles: opens marked links (data-overlay) in an iframe
   modal with a "חזרה לאתר" button top-right. No navigation happens, so closing returns
   to the exact spot. Sites that forbid framing (X-Frame-Options) keep target=_blank. */
(function () {
  var ov = null;
  function close() {
    if (!ov) return;
    ov.remove();
    ov = null;
    document.body.style.overflow = '';
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-overlay]');
    if (!a) return;
    e.preventDefault();
    if (ov) ov.remove();
    document.body.style.overflow = 'hidden';
    ov = document.createElement('div');
    ov.className = 'ext-overlay';
    ov.innerHTML =
      '<div class="ext-overlay-bar">' +
        '<button type="button" class="ext-overlay-back">חזרה לאתר ✕</button>' +
        '<a class="ext-overlay-newtab" href="' + a.href + '" target="_blank" rel="noopener">פתיחה בחלון חדש</a>' +
      '</div>' +
      '<iframe class="ext-overlay-frame" src="' + a.href + '" referrerpolicy="no-referrer" title="תוכן חיצוני"></iframe>';
    document.body.appendChild(ov);
    ov.querySelector('.ext-overlay-back').addEventListener('click', close);
  });
})();
