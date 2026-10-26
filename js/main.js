/* Photo placeholder mode: poster lightbox shows the placeholder while SITE_PHOTOS=false */
function ahPhotoPlaceholders() {
  if (!window.SITE_PHOTOS) {
    document.querySelectorAll('.news-card:not(.program-card):not(.news-card-real)').forEach(function (card) {
      card.setAttribute('data-full', './assets/no-image.svg');
    });
  }
}

(function () {
  'use strict';

  /* Site root from this script's own URL (js/main.js lives one level under
     the root), captured NOW while document.currentScript is live. NEVER
     resolve './index.html' against location.href in goHomeIndex: in the shell
     the URL moves into subdirectories (programs/program-N.html), so a
     relative target 404'd as /programs/index.html#... (Roi 25.10). */
  var AH_ROOT = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return new URL('../', s).href;
    } catch (e) {}
    return new URL('.', location.href).href;
  })();

  /* ===== persistent state (survives shell re-inits; bound once) ===== */
  var S = {
    spyPairs: [],
    navLinks: [],
    revealObs: null,
    heroSlides: [], heroIdx: 0, heroTimer: null,
    actTimer: null
  };

  var ahScrollToken = 0;
  var ahScrollFrame = 0;
  function ahCancelScroll() {
    ++ahScrollToken;
    cancelAnimationFrame(ahScrollFrame);
  }
  function ahSmoothScroll(targetY, onDone) {
    ahCancelScroll();
    var myToken = ahScrollToken;
    var startY = window.scrollY, dist = targetY - startY;
    if (Math.abs(dist) < 4 || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      window.scrollTo({ top: targetY, behavior: 'instant' });
      if (onDone) onDone(myToken);
      return;
    }
    var dur = Math.min(620, Math.max(260, Math.abs(dist) * 0.22));
    var elapsed = 0, lastTime = null;
    function step(ts) {
      if (myToken !== ahScrollToken) return;
      /* Advance only on rendered frames. A wall-clock deadline teleports
         when a busy browser withholds frames. Cap one frame's advance so
         returning after a stall cannot swallow the whole visible glide. */
      if (lastTime !== null) elapsed += Math.min(40, Math.max(0, ts - lastTime));
      lastTime = ts;
      var p = Math.min(1, elapsed / dur);
      var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2;
      window.scrollTo({ top: startY + dist * e, behavior: 'instant' });
      if (p < 1) ahScrollFrame = requestAnimationFrame(step);
      else {
        if (onDone) onDone(myToken);
      }
    }
    ahScrollFrame = requestAnimationFrame(step);
  }
  /* Manual input cancels both the glide and its pending layout correction. */
  window.addEventListener('wheel', ahCancelScroll, { passive: true });
  window.addEventListener('touchstart', ahCancelScroll, { passive: true });
  window.addEventListener('keydown', function (e) {
    if (/^(ArrowUp|ArrowDown|PageUp|PageDown|Home|End| )$/.test(e.key) &&
        !/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) && !e.target.isContentEditable) ahCancelScroll();
  });

  function ahOnHomePage() {
    return /\/index\.html?$/.test(location.pathname) || /\/$/.test(location.pathname);
  }

  /* Active nav link on scroll: position-based, follows the real top-to-bottom
     section order (#home maps to the hero). Rebuilt on every init (shell-safe). */
  function buildSpy() {
    S.navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
    S.spyPairs = S.navLinks.map(function (l) {
      var sel = l.getAttribute('href');
      if (!sel || sel.charAt(0) !== '#') return null;
      var el = sel === '#home' ? document.getElementById('hero') : document.querySelector(sel);
      return el ? { link: l, el: el } : null;
    }).filter(Boolean).sort(function (a, b) {
      return (a.el.getBoundingClientRect().top + window.scrollY) - (b.el.getBoundingClientRect().top + window.scrollY);
    });
  }
  /* Live document-absolute tops: offsetTop is offsetParent-relative and breaks for
     nested targets (#donate lives inside #contact). Measure each target live instead. */
  function spyUpdate() {
    if (!S.spyPairs.length) { return; }
    var pos = window.scrollY + window.innerHeight * 0.35;
    var current = S.spyPairs[0];
    var bestTop = -Infinity;
    for (var i = 0; i < S.spyPairs.length; i++) {
      if (!S.spyPairs[i].el.isConnected) continue;
      var top = S.spyPairs[i].el.getBoundingClientRect().top + window.scrollY;
      if (top - 90 <= pos && top > bestTop) { bestTop = top; current = S.spyPairs[i]; }
    }
    S.navLinks.forEach(function (l) { l.classList.toggle('is-active', l === current.link); });
    /* remember the visitor's current homepage section so inner pages
       (quotes "חזרה לאתר", Roi 25.10) can return to it. Only the homepage
       builds spyPairs (bare '#...' nav hrefs), so this never writes elsewhere. */
    /* no section above the read line yet => visitor is on the hero (desktop
       nav has no #home item) - record 'home', not the first section */
    var curId = (bestTop === -Infinity) ? 'home' : current.link.getAttribute('href').slice(1);
    /* Bottom of the page (Roi 25.10, "החלק האחרון בדף הראשי"): the 35%-viewport
       read line never crosses the last block (the תרומה section has no nav
       pair), so the spy stayed on the previous section even with the donation
       area filling the screen. At the page bottom, record the actual last
       homepage section so the quotes "חזרה לאתר" returns there. */
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) {
      var homeSecs = document.querySelectorAll('main section[id]');
      if (homeSecs.length) curId = homeSecs[homeSecs.length - 1].id;
    }
    if (S.lastSpyId !== curId) {
      S.lastSpyId = curId;
      /* homepage only: in-shell inner pages keep the home header whose bare
         '#...' nav links can pair with same-id elements on the inner page
         (quotes page has id="quotes"), which clobbered the saved home section
         and broke the quotes "back to site" return target */
      try { if (ahOnHomePage()) sessionStorage.setItem('ah-home-section', curId); } catch (e) {}
    }
  }

  function bindOnce(el, key, ev, fn, opts) {
    if (!el) return;
    el.__ahBound = el.__ahBound || {};
    if (el.__ahBound[key]) return;
    el.__ahBound[key] = true;
    el.addEventListener(ev, fn, opts);
  }

  function init() {
    ahPhotoPlaceholders();

    /* Header state */
    var header = document.getElementById('siteHeader');
    function onScroll() {
      if (header) header.classList.toggle('is-scrolled', window.scrollY > 40);
    }
    if (!window.__ahMainPersistent) {
      window.addEventListener('scroll', onScroll, { passive: true });
    }
    onScroll();

    /* Mobile nav */
    var toggle = document.getElementById('navToggle');
    var nav = document.getElementById('mainNav');
    bindOnce(toggle, 'navToggle', 'click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    bindOnce(nav, 'navClose', 'click', function (e) {
      if (e.target.closest('.nav-link')) {
        nav.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });

    /* Header logos: same fast eased scroll-to-top as the nav */
    document.querySelectorAll('.site-header .brand[href="#home"], .site-header .brand[href="./index.html"], .site-header .brand[href="index.html"], .site-header .brand[href$="/index.html"]').forEach(function (link) {
      bindOnce(link, 'brandHome', 'click', function (e) {
        e.preventDefault();
        if (!onHomePage() || !document.getElementById('hero')) { goHomeIndex('#home'); return; }
        ahSmoothScroll(0);
      });
    });

    /* Pages reached through the shell keep the index header, whose links are
       bare #anchors that only exist on the homepage. Missing target => navigate
       home to that section instead of a dead click (Roi report 24.10). */
    function onHomePage() {
      return /\/index\.html?$/.test(location.pathname) || /\/$/.test(location.pathname);
    }
    function goHomeIndex(hash) {
      var target = new URL('index.html' + hash, AH_ROOT).href;
      if (window.AHShell && window.AHShell.go) { window.AHShell.go(target); }
      else { location.href = target; }
    }
    window.AHScrollToId = function (id) {
      if (id === 'home') { ahSmoothScroll(0); return true; }
      var target = document.getElementById(id);
      if (!target) return false;
      function targetTop() {
        var title = target.querySelector('.section-title') || target;
        var y = 0; for (var n = title; n; n = n.offsetParent) y += n.offsetTop;
        var extra = (id === 'donate') ? 100 : 14;
        return Math.max(0, y - header.offsetHeight - extra);
      }
      /* Correct lazy-layout changes only AFTER the visible glide has ended,
         never at a wall-clock timeout that can cancel a delayed animation. */
      ahSmoothScroll(targetTop(), function (completedToken) {
        setTimeout(function () {
          if (completedToken !== ahScrollToken) return;
          var fresh = targetTop();
          if (Math.abs(fresh - window.scrollY) > 150) ahSmoothScroll(fresh);
        }, 160);
      });
      var scope = target.closest('section') || target;
      scope.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      if (scope.classList.contains('reveal')) scope.classList.add('is-visible');
      if (target.classList.contains('reveal')) target.classList.add('is-visible');
      return true;
    };

    /* Nav clicks land with the section title just under the fixed header */
    document.querySelectorAll('.main-nav a[href^="#"], .main-nav a[href*="index.html#"]').forEach(function (link) {
      bindOnce(link, 'navAnchor', 'click', function (e) {
        var href = link.getAttribute('href');
        var h = href.indexOf('#');
        var id = h === -1 ? '' : decodeURIComponent(href.slice(h + 1));
        if (!id) return;
        e.preventDefault();
        if (id === 'home') {
          if (!onHomePage() || !document.getElementById('hero')) { goHomeIndex('#home'); return; }
          ahSmoothScroll(0); return;
        }
        /* v142 (owner 26.10 14:11, BOTH platforms): the donate nav tab opens
           the payment mini window OVER THE CURRENT PAGE - inner pages no
           longer navigate home for it (checked before the off-home redirect) */
        if (id === 'donate' && window.AHDonateOpen && window.AHDonateOpen()) {
          /* v142b (owner voice 26.10 14:21, BOTH platforms): opening the window
             must NOT touch the page - no scroll, no top-jump, no URL change */
          return;
        }
        /* off-homepage the header's bare #anchors ALWAYS mean homepage sections,
           even if some other page happens to reuse the same id (#donate) */
        if (!onHomePage() || !document.getElementById(id)) { goHomeIndex('#' + id); return; }
        window.AHScrollToId(id);
        history.replaceState(null, '', '#' + id);
      });
    });

    /* Scroll spy (rebuilt every init; listeners bound once below) */
    buildSpy();
    spyUpdate();

    /* Reveal on scroll: replays on every re-entry, with hysteresis so the
       enter (15% visible) and exit (fully out) thresholds differ - this stops
       the show/hide oscillation that made sections jitter at the viewport edge. */
    if (!S.revealObs) {
      S.revealObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          var r = en.intersectionRatio;
          if (en.isIntersecting && (r >= 0.15 || en.boundingClientRect.height > window.innerHeight)) {
            /* reveal once, stay revealed - no re-animation on later scrolls */
            en.target.classList.add('is-visible');
            S.revealObs.unobserve(en.target);
          }
        });
      }, { threshold: [0, 0.15] });
    }
    document.querySelectorAll('.reveal:not(.is-visible)').forEach(function (el) { S.revealObs.observe(el); });

    /* v118 (user 25.10 18:19): pause the promo video while it is offscreen -
       a looping autoplay decode competes with scrolling on modest hardware */
    var promoV = document.getElementById('promoVideo');
    if (promoV && 'IntersectionObserver' in window && !promoV.__ahObs) {
      promoV.__ahObs = true;
      new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (en.isIntersecting) { var pr = promoV.play(); if (pr && pr.catch) pr.catch(function () {}); }
          else { promoV.pause(); }
        });
      }, { threshold: 0.05 }).observe(promoV);
    }

    /* Hero carousel (index only; timer rebuilt on every init so swaps never leak) */
    if (S.heroTimer) { clearInterval(S.heroTimer); S.heroTimer = null; }
    S.heroSlides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
    if (S.heroSlides.length) {
      S.heroIdx = 0;
      function heroGo(i) {
        if (!S.heroSlides.length) return;
        S.heroSlides[S.heroIdx].classList.remove('is-on');
        S.heroIdx = (i + S.heroSlides.length) % S.heroSlides.length;
        S.heroSlides[S.heroIdx].classList.add('is-on');
      }
      S.heroTimer = setInterval(function () {
        if (!S.heroSlides.length || !S.heroSlides[0].isConnected) {
          clearInterval(S.heroTimer); S.heroTimer = null; S.heroSlides = []; return;
        }
        heroGo(S.heroIdx + 1);
      }, 5500);
    }

    /* Promo video - self-hosted: autoplays muted in view, pauses out of view, resumes where it stopped */
    var videoFrame = document.getElementById('videoFrame');
    var promo = document.getElementById('promoVideo');
    if (videoFrame && promo) {
      var muteBtn = document.getElementById('videoMute');
      var setMuteUI = function () {
        muteBtn.classList.toggle('is-on', !promo.muted);
        muteBtn.setAttribute('aria-pressed', promo.muted ? 'false' : 'true');
        muteBtn.setAttribute('aria-label', promo.muted ? 'הפעלת צליל' : 'השתקה');
      };
      bindOnce(muteBtn, 'videoMute', 'click', function () {
        promo.muted = !promo.muted;
        if (!promo.muted) { var pr = promo.play(); if (pr && pr.catch) pr.catch(function () {}); }
        setMuteUI();
      });
      if (!videoFrame.__ahObserved) {
        videoFrame.__ahObserved = true;
        var promoSeen = false;
        var videoObs = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!promo.isConnected) { videoObs.disconnect(); return; }
            if (entry.isIntersecting) {
              promoSeen = true;
              var p = promo.play();
              if (p && p.catch) p.catch(function () {});
            } else if (promoSeen) {
              promo.pause();
            }
          });
        }, { threshold: [0] });
        videoObs.observe(videoFrame);
      }
      setMuteUI();
    }

    /* Activities carousel (index only - guard pages without it) */
    if (S.actTimer) { clearInterval(S.actTimer); S.actTimer = null; }
    var track = document.getElementById('actTrack');
    var items = track ? track.children.length : 0;
    if (track) {
      var dots = document.getElementById('actDots');
      var idx = 0;
      if (!dots.__ahBuilt) {
        dots.__ahBuilt = true;
        for (var d = 0; d < items; d++) {
          (function (i) {
            var b = document.createElement('button');
            b.setAttribute('aria-label', 'תמונה ' + (i + 1));
            if (i === 0) b.classList.add('is-on');
            b.addEventListener('click', function () { go(i); restart(); });
            dots.appendChild(b);
          })(d);
        }
      }
      /* v136 (owner 26.10 07:53, MOBILE ONLY): phones run the carousel
         left-to-right - track is direction:rtl there, so advancing shifts +X
         and the next image enters from the left. Desktop unchanged (-X). */
      function actLtrMotion() { return window.matchMedia && window.matchMedia('(max-width: 860px)').matches; }
      function go(i) {
        idx = (i + items) % items;
        /* Track is LTR on desktop: shifting left (negative X) moves forward, matching swipe + arrow glyphs */
        track.style.transform = 'translateX(' + ((actLtrMotion() ? 1 : -1) * idx * 100) + '%)';
        for (var k = 0; k < items; k++) dots.children[k].classList.toggle('is-on', k === idx);
      }
      function restart() {
        if (S.actTimer) clearInterval(S.actTimer);
        S.actTimer = setInterval(function () {
          if (!track.isConnected) { clearInterval(S.actTimer); S.actTimer = null; return; }
          go(idx + 1);
        }, 4500);
      }
      document.querySelectorAll('.carousel-btn').forEach(function (b) {
        bindOnce(b, 'carouselBtn', 'click', function () {
          go(idx + parseInt(b.getAttribute('data-dir'), 10));
          restart();
        });
      });
      /* Touch swipe (mobile): swipe left = next image, swipe right = previous (RTL forward).
         v136: with the phone carousel traveling left-to-right, swipe right = next,
         swipe left = previous - follows the motion. Desktop unchanged. */
      var carousel = document.getElementById('actCarousel');
      var touchX = null, touchY = null;
      bindOnce(carousel, 'swipeStart', 'touchstart', function (e) {
        touchX = e.touches[0].clientX;
        touchY = e.touches[0].clientY;
        if (S.actTimer) clearInterval(S.actTimer);
      }, { passive: true });
      bindOnce(carousel, 'swipeEnd', 'touchend', function (e) {
        if (touchX === null) { restart(); return; }
        var dx = e.changedTouches[0].clientX - touchX;
        var dy = e.changedTouches[0].clientY - touchY;
        touchX = null; touchY = null;
        if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5) {
          go(actLtrMotion() ? (dx > 0 ? idx + 1 : idx - 1) : (dx < 0 ? idx + 1 : idx - 1));
        }
        restart();
      }, { passive: true });
      restart();
    }

    /* Lightbox for posters */
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightboxImg');
    if (lightbox && lightboxImg) {
      document.querySelectorAll('.news-card:not(.program-card)').forEach(function (card) {
        bindOnce(card, 'lightboxCard', 'click', function () {
          lightboxImg.src = card.getAttribute('data-full');
          lightbox.classList.add('is-open');
          lightbox.setAttribute('aria-hidden', 'false');
          document.body.style.overflow = 'hidden';
          history.pushState({ lightbox: true }, '');
        });
      });
      function closeLightbox(fromPopstate) {
        var lb = document.getElementById('lightbox');
        var lbImg = document.getElementById('lightboxImg');
        if (!lb || !lbImg) return;
        lb.classList.remove('is-open');
        lb.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lbImg.src = '';
        if (!fromPopstate && history.state && history.state.lightbox) {
          history.back();
        }
      }
      /* Browser/mouse Back closes the lightbox instead of leaving the page */
      if (!window.__ahLbPop) {
        window.__ahLbPop = true;
        window.addEventListener('popstate', function () {
          var lb = document.getElementById('lightbox');
          if (lb && lb.classList.contains('is-open')) closeLightbox(true);
        });
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') closeLightbox();
        });
      }
      bindOnce(document.getElementById('lightboxClose'), 'lightboxClose', 'click', closeLightbox);
      bindOnce(lightbox, 'lightboxBg', 'click', function (e) { if (e.target === lightbox) closeLightbox(); });
    }

    /* Donation payment mini window (v131; logic moved from a body-level
       inline script into main.js in v137: body scripts only run on a full
       index.html load, so after a shell swap from another page the CTA was
       left dead. main.js init re-runs on every swap).
       v142 (owner 26.10 14:11, BOTH platforms): the window opens OVER THE
       CURRENT PAGE on every page, so its markup is injected at BODY level
       (survives shell swaps, exists on inner pages) instead of living in the
       homepage <main>. Markup/wording/links unchanged from v141. */
    var DN_PAY_HTML =
      '<div class="dn-pay-overlay" id="dnPayOverlay" role="dialog" aria-modal="true" aria-label="בחירת אמצעי תרומה">' +
        '<div class="dn-pay-card">' +
          '<button type="button" class="dn-pay-x" aria-label="סגירה">&times;</button>' +
          '<p class="dn-pay-title" id="dnPayTitle">תרומה</p>' +
          '<p class="dn-pay-sub">בחרו אמצעי תרומה:</p>' +
          '<a class="dn-pay-btn dn-pay-jgive" href="https://www.jgive.com/new/he/ils/donation-targets/60540" target="_blank" rel="noopener"><img class="dn-pay-logo" src="./assets/logo-jgive.png" alt="לוגו JGive"><span>JGive<span class="dn-pay-hint">דף התרומות הכללי של עלה הדס</span></span></a>' +
          '<a class="dn-pay-btn dn-pay-paybox" href="https://links.payboxapp.com/XzfSfUmCq6b" target="_blank" rel="noopener"><img class="dn-pay-logo" src="./assets/logo-paybox.png" alt="לוגו PayBox"><span>PayBox<span class="dn-pay-hint">קופת ״כפרות עלה הדס״</span></span></a>' +
          '<a class="dn-pay-btn dn-pay-bit" href="https://www.bitpay.co.il/app/share-info?i=RYfExz8N&amp;j=true" target="_blank" rel="noopener"><img class="dn-pay-logo" src="./assets/logo-bit.png" alt="לוגו Bit"><span>Bit<span class="dn-pay-hint">קישור התרומה של עלה הדס באפליקציית ביט</span></span></a>' +
          '<button type="button" class="dn-pay-close" id="dnPayClose">סגירה</button>' +
        '</div>' +
      '</div>';
    (function () {
      window.AHDonateOpen = function () {
        var o = document.getElementById('dnPayOverlay');
        if (!o) return false;
        o.classList.add('open');
        return true;
      };
      var dnOverlay = document.getElementById('dnPayOverlay');
      if (!dnOverlay) {
        document.body.insertAdjacentHTML('beforeend', DN_PAY_HTML);
        dnOverlay = document.getElementById('dnPayOverlay');
      }
      if (!dnOverlay) return;
      function dnClose() { dnOverlay.classList.remove('open'); }
      bindOnce(document.getElementById('donateOpenBtn'), 'donateOpen', 'click', function () { window.AHDonateOpen(); });
      bindOnce(document.getElementById('dnPayClose'), 'dnPayClose', 'click', dnClose);
        bindOnce(document.querySelector('#dnPayOverlay .dn-pay-x'), 'dnPayX', 'click', dnClose);
      bindOnce(dnOverlay, 'dnPayBg', 'click', function (e) { if (e.target === dnOverlay) dnClose(); });
      if (!window.__ahDonateEsc) {
        window.__ahDonateEsc = true;
        document.addEventListener('keydown', function (e) {
          if (e.key === 'Escape') { var o = document.getElementById('dnPayOverlay'); if (o) o.classList.remove('open'); }
        });
      }
      /* v137: the footer donate link is the same entry point - open the window
         v142: on EVERY page (the window opens over the current page now) */
      document.querySelectorAll('.footer-donate[href$="#donate"]').forEach(function (a) {
        bindOnce(a, 'footerDonate', 'click', function (e) {
          e.preventDefault();
          window.AHDonateOpen();
        });
      });
      /* v142: inner-page תרמו עכשיו buttons open the window in place too */
      document.querySelectorAll('a.btn-donate[href$="#donate"]').forEach(function (a) {
        bindOnce(a, 'ctaDonate', 'click', function (e) {
          e.preventDefault();
          window.AHDonateOpen();
        });
      });
      /* v137: landing on index.html#donate (redirect stub of the removed
         donation page, cross-page nav tabs, stale cached pages whose old CTA
         still points at donate.html) opens the window over the section */
      if (location.hash === '#donate') {
        setTimeout(function () { window.AHDonateOpen(); }, 350);
      }
    })();

    /* Team: show/hide the rest of the team cards */
    var teamMore = document.getElementById('teamMore');
    var teamExtra = document.getElementById('teamExtra');
    var teamCloseWrap = document.getElementById('teamCloseWrap');
    var teamClose = document.getElementById('teamClose');
    var teamCloseTimer = null;
    function teamOpen() {
      if (teamCloseTimer) { clearTimeout(teamCloseTimer); teamCloseTimer = null; }
      teamExtra.classList.remove('team-closing');
      teamExtra.removeAttribute('hidden');
      void teamExtra.offsetWidth;
      teamExtra.classList.add('team-anim-in');
      teamMore.textContent = 'סגירת הרשימה';
      if (teamCloseWrap) teamCloseWrap.removeAttribute('hidden');
    }
    function teamCollapse() {
      /* v137 (owner 26.10 07:57, BOTH platforms): closing the team list (the X
         or סגירת הרשימה) glides back to the top of the contact section */
      if (window.AHScrollToId) window.AHScrollToId('contact');
      teamExtra.classList.remove('team-anim-in');
      teamExtra.classList.add('team-closing');
      teamMore.textContent = 'לשאר חברי הצוות';
      if (teamCloseWrap) teamCloseWrap.setAttribute('hidden', '');
      teamCloseTimer = setTimeout(function () {
        teamExtra.setAttribute('hidden', '');
        teamExtra.classList.remove('team-closing');
        teamCloseTimer = null;
      }, 260);
    }
    bindOnce(teamMore, 'teamMore', 'click', function () {
      if (teamExtra.hasAttribute('hidden') || teamExtra.classList.contains('team-closing')) { teamOpen(); } else { teamCollapse(); }
    });
    bindOnce(teamClose, 'teamClose', 'click', teamCollapse);

    /* Persistent global listeners (bound once ever) */
    if (!window.__ahMainPersistent) {
      window.__ahMainPersistent = true;
      window.addEventListener('scroll', spyUpdate, { passive: true });
      window.addEventListener('resize', spyUpdate);
    }
  }

  window.AHMainRescan = init;
  init();
})();
