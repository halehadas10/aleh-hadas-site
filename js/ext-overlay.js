/* In-site overlay for external articles: opens marked links (data-overlay) in an iframe
   modal with a "חזרה לאתר" button top-right. No navigation happens, so closing returns
   to the exact spot. The iframe is sandboxed WITHOUT allow-top-navigation so framed
   sites cannot frame-bust and navigate the quotes page away (which lost the scroll
   position); scroll position is also saved and restored explicitly on close.
   Sites that forbid framing (X-Frame-Options) keep target=_blank. */
(function () {
  var ov = null, savedY = 0;
  function close() {
    if (!ov) return;
    ov.remove();
    ov = null;
    document.body.style.overflow = '';
    window.scrollTo(0, savedY);
  }
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-overlay]');
    if (!a) return;
    e.preventDefault();
    if (ov) ov.remove();
    savedY = window.scrollY || window.pageYOffset || 0;
    document.body.style.overflow = 'hidden';
    ov = document.createElement('div');
    ov.className = 'ext-overlay';
    ov.innerHTML =
      '<div class="ext-overlay-bar">' +
        '<button type="button" class="ext-overlay-back">חזרה לאתר ✕</button>' +
        '<a class="ext-overlay-newtab" href="' + a.href + '" target="_blank" rel="noopener">פתיחה בחלון חדש</a>' +
      '</div>' +
      '<iframe class="ext-overlay-frame" sandbox="allow-scripts allow-same-origin allow-forms allow-popups" src="' + a.href + '" referrerpolicy="no-referrer" title="תוכן חיצוני"></iframe>';
    document.body.appendChild(ov);
    ov.querySelector('.ext-overlay-back').addEventListener('click', close);
  });
})();
