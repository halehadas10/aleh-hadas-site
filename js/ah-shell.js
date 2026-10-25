/* עלה הדס - same-document navigation shell (23.10)
   Keeps the audio player (and document) alive across internal page navigations,
   so playback continues without a gap. Intercepts internal .html links, swaps
   <main>, re-runs page scripts via their re-init hooks, manages history.
   Any failure falls back to a normal full navigation. */
(function () {
  'use strict';
  if (window.AHShell) return;

  /* Site root from this script's own URL (js/ah-shell.js lives one level
     under the root), NOT from location.href: in-shell the URL moves into
     subdirectories, and the persistent header/footer chrome (authored on
     root-level pages with './...' links) would then resolve against the
     subdirectory and 404 (Roi 25.10: /programs/index.html#programs). */
  var AH_ROOT = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return new URL('../', s).href;
    } catch (e) {}
    return new URL('.', location.href).href;
  })();

  /* Re-point the persistent chrome's root-relative './...' links at the real
     site root, once, so they survive shell navigation into subdirectories.
     Swapped-in <main> content keeps its own relative links (resolved against
     the current URL, which matches the page it came from). */
  (function rootifyChromeLinks() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.site-header a[href^="./"], .site-footer a[href^="./"]'),
      function (a) {
        try { a.href = new URL(a.getAttribute('href').slice(2), AH_ROOT).href; } catch (e) {}
      });
  })();

  var cache = {}; /* url -> Promise<string(html)> */
  var loadedScripts = {}; /* absolute src -> true */
  Array.prototype.forEach.call(document.scripts, function (s) {
    if (s.src) loadedScripts[s.src.split('?')[0]] = true;
  });

  function isInternalPage(a) {
    if (!a || !a.href) return false;
    if (a.target === '_blank' || a.hasAttribute('download')) return false;
    var u;
    try { u = new URL(a.href, location.href); } catch (e) { return false; }
    if (u.origin !== location.origin) return false;
    if (!/\.html?$/i.test(u.pathname) && u.pathname !== '/' && !u.pathname.endsWith('/')) return false;
    /* same-page anchor: let main.js smooth-scroll handle it */
    if (u.pathname === location.pathname && u.hash && (!u.search || u.search === location.search)) return false;
    if (a.href.indexOf('tel:') === 0 || a.href.indexOf('mailto:') === 0) return false;
    return true;
  }

  function fetchPage(url) {
    if (!cache[url]) {
      cache[url] = fetch(url, { credentials: 'same-origin', cache: 'no-cache' }).then(function (r) {
        if (!r.ok) throw new Error('http ' + r.status);
        return r.text();
      });
    }
    return cache[url];
  }

  function execInlineScripts(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('script'), function (old) {
      if (old.src) return;
      var s = document.createElement('script');
      s.textContent = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  function loadMissingScripts(doc, pageUrl) {
    var jobs = [];
    Array.prototype.forEach.call(doc.querySelectorAll('script[src]'), function (s) {
      var abs = new URL(s.getAttribute('src'), pageUrl).href.split('?')[0];
      if (loadedScripts[abs]) return;
      if (abs.indexOf(location.origin) !== 0) return; /* third-party scripts load inside their own widgets */
      loadedScripts[abs] = true;
      jobs.push(new Promise(function (resolve) {
        var el = document.createElement('script');
        el.src = abs;
        el.onload = el.onerror = function () { resolve(); };
        document.body.appendChild(el);
      }));
    });
    return Promise.all(jobs);
  }

  function reinit() {
    try { if (window.AHMainRescan) window.AHMainRescan(); } catch (e) {}
    try { if (window.AHLessonsInit && (document.getElementById('lsPage') || document.getElementById('lsCarousel'))) window.AHLessonsInit(); } catch (e) {}
    try { if (window.AHLessonInit && document.getElementById('lpTitle')) window.AHLessonInit(); } catch (e) {}
  }

  /* Page-local head styles: a full page load applies them, a shell swap must
     import them too - otherwise page-specific layout (homepage quote cards,
     quotes-page card styling, prize-medal sizing) silently disappears after
     in-site navigation (user video 24.10: "giant medal", broken quote cards).
     Imported once per unique content, class-scoped rules, never removed. */
  function importHeadStyles(doc) {
    var seen = window.__ahShellStyles = window.__ahShellStyles || {};
    Array.prototype.forEach.call(doc.querySelectorAll('head style'), function (st) {
      var txt = st.textContent || '';
      if (seen[txt]) return;
      seen[txt] = true;
      var el = document.createElement('style');
      el.textContent = txt;
      document.head.appendChild(el);
    });
  }

  var navId = 0;
  var currentNav = 0;
  var scrollMemory = {}; /* navId -> scrollY */

  function swapTo(url, opts) {
    opts = opts || {};
    try { url = new URL(url, location.href).href; } catch (e) {}
    return fetchPage(url).then(function (html) {
      var doc = new DOMParser().parseFromString(html, 'text/html');
      var newMain = doc.querySelector('main');
      var curMain = document.querySelector('main');
      if (!newMain || !curMain) throw new Error('no main');
      return loadMissingScripts(doc, url).then(function () {
        importHeadStyles(doc);
        /* adopt the new main */
        var imported = document.importNode(newMain, true);
        curMain.parentNode.replaceChild(imported, curMain);
        document.title = doc.title || document.title;
        execInlineScripts(imported);
        if (!opts.pop) {
          scrollMemory[currentNav] = window.scrollY;
          currentNav = ++navId;
          history.pushState({ ahShell: true, nav: currentNav, url: url }, '', url);
          /* hash target: reset INSTANTLY to top, then let AHScrollToId glide
             down - a plain scrollTo here runs as native CSS-smooth and races
             the custom animation (teleport-to-bottom bug, user 24.10).
             no hash (e.g. logo to index): keep the plain call so the existing
             CSS scroll-behavior gives one native smooth scroll to top. */
          if (url.indexOf('#') !== -1) window.scrollTo({ top: 0, behavior: 'instant' });
          else window.scrollTo(0, 0);
        }
        window.AHShellActive = true;
        reinit();
        /* land on the hash target AFTER the new main is initialized, with the
           same header-offset scroll the nav uses (AHScrollToId from main.js) */
        if (!opts.pop && url.indexOf('#') !== -1) {
          var hashId = decodeURIComponent(url.split('#')[1]);
          /* double rAF: measure after the swapped main has laid out, or the
             target position is computed against pre-layout heights */
          requestAnimationFrame(function () { requestAnimationFrame(function () {
            var done = false;
            try { if (window.AHScrollToId) done = window.AHScrollToId(hashId); } catch (e) {}
            if (!done) { var el = document.getElementById(hashId); if (el) el.scrollIntoView(); }
          }); });
        }
        if (opts.pop && scrollMemory[currentNav] != null) {
          window.scrollTo(0, scrollMemory[currentNav]);
        }
        /* prefetch likely next pages */
        Array.prototype.forEach.call(imported.querySelectorAll('a'), function (a) {
          if (isInternalPage(a)) {
            try { fetchPage(new URL(a.href, location.href).href); } catch (e) {}
          }
        });
      });
    }).catch(function (e) {
      try { window.__ahShellError = (e && (e.message || e)) + ''; console.error('ah-shell fallback:', e); } catch (_) {}
      location.href = url; /* hard fallback */
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a');
    if (!isInternalPage(a)) return;
    var url = new URL(a.href, location.href).href;
    e.preventDefault();
    swapTo(url, {});
  });

  window.addEventListener('popstate', function (e) {
    var st = e.state;
    if (st && st.ahShell) {
      currentNav = st.nav;
      swapTo(st.url, { pop: true });
    }
  });

  /* mark the initial entry so Back from the first swapped page works */
  try { history.replaceState({ ahShell: true, nav: 0, url: location.href }, ''); } catch (e) {}

  window.AHShell = { go: swapTo, active: true };
  window.AHShellActive = true;
})();
