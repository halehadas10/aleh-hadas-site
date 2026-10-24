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

  /* ===== persistent state (survives shell re-inits; bound once) ===== */
  var S = {
    spyPairs: [],
    navLinks: [],
    revealObs: null,
    heroSlides: [], heroIdx: 0, heroTimer: null,
    actTimer: null
  };

  function ahSmoothScroll(targetY) {
    /* steps must be behavior:'instant': with html{scroll-behavior:smooth} every
       plain scrollTo starts its own native smooth animation, and the per-frame
       retargets fight each other until the scroll never moves (killed the fast
       scroll - user video 24.10). */
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      window.scrollTo({ top: targetY, behavior: 'instant' }); return;
    }
    var startY = window.scrollY, dist = targetY - startY;
    if (Math.abs(dist) < 4) { window.scrollTo({ top: targetY, behavior: 'instant' }); return; }
    var dur = Math.min(620, Math.max(260, Math.abs(dist) * 0.22));
    var t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2; /* easeInOutCubic */
      window.scrollTo({ top: startY + dist * e, behavior: 'instant' });
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
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
    document.querySelectorAll('.site-header .brand[href="#home"]').forEach(function (link) {
      bindOnce(link, 'brand', 'click', function (e) {
        e.preventDefault();
        ahSmoothScroll(0);
      });
    });

    /* Nav clicks land with the section title just under the fixed header */
    document.querySelectorAll('.main-nav a[href^="#"]').forEach(function (link) {
      bindOnce(link, 'navAnchor', 'click', function (e) {
        var id = link.getAttribute('href').slice(1);
        if (!id) return;
        e.preventDefault();
        if (id === 'home') { ahSmoothScroll(0); return; }
        var target = document.getElementById(id);
        if (!target) return;
        var title = target.querySelector('.section-title') || target;
        var y = 0; for (var n = title; n; n = n.offsetParent) y += n.offsetTop;
        var extra = (id === 'donate') ? 100 : 14;
        y = y - header.offsetHeight - extra;
        ahSmoothScroll(Math.max(0, y));
        history.replaceState(null, '', '#' + id);
        var scope = target.closest('section') || target;
        scope.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
        if (scope.classList.contains('reveal')) scope.classList.add('is-visible');
        if (target.classList.contains('reveal')) target.classList.add('is-visible');
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
      function go(i) {
        idx = (i + items) % items;
        /* Track is LTR: shifting left (negative X) moves forward, matching swipe + arrow glyphs */
        track.style.transform = 'translateX(' + (-idx * 100) + '%)';
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
      /* Touch swipe (mobile): swipe left = next image, swipe right = previous (RTL forward) */
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
          go(dx < 0 ? idx + 1 : idx - 1);
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

    /* Team: show/hide the rest of the team cards */
    var teamMore = document.getElementById('teamMore');
    var teamExtra = document.getElementById('teamExtra');
    bindOnce(teamMore, 'teamMore', 'click', function () {
      if (teamExtra.hasAttribute('hidden')) {
        teamExtra.removeAttribute('hidden');
        teamMore.textContent = 'סגירת הרשימה';
      } else {
        teamExtra.setAttribute('hidden', '');
        teamMore.textContent = 'לשאר חברי הצוות';
      }
    });

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
