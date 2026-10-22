/* Photo placeholder mode: poster lightbox shows the placeholder while SITE_PHOTOS=false */
if (!window.SITE_PHOTOS) {
  document.querySelectorAll('.news-card:not(.program-card):not(.news-card-real)').forEach(function (card) {
    card.setAttribute('data-full', './assets/no-image.svg');
  });
}

(function () {
  'use strict';

  /* Header state */
  var header = document.getElementById('siteHeader');
  function onScroll() {
    header.classList.toggle('is-scrolled', window.scrollY > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile nav */
  var toggle = document.getElementById('navToggle');
  var nav = document.getElementById('mainNav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('is-open');
    toggle.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    document.body.style.overflow = open ? 'hidden' : '';
  });
  nav.addEventListener('click', function (e) {
    if (e.target.closest('.nav-link')) {
      nav.classList.remove('is-open');
      toggle.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* Nav clicks land with the section title just under the fixed header */
  document.querySelectorAll('.main-nav a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      var id = link.getAttribute('href').slice(1);
      if (!id) return;
      e.preventDefault();
      if (id === 'home') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      var target = document.getElementById(id);
      if (!target) return;
      var title = target.querySelector('.section-title') || target;
      var y = 0; for (var n = title; n; n = n.offsetParent) y += n.offsetTop;
      y = y - header.offsetHeight - 14;
      window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
      history.replaceState(null, '', '#' + id);
      /* Reveal the target right away so content is never left hidden after a jump */
      var scope = target.closest('section') || target;
      scope.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('is-visible'); });
      if (scope.classList.contains('reveal')) scope.classList.add('is-visible');
      if (target.classList.contains('reveal')) target.classList.add('is-visible');
    });
  });

  /* Active nav link on scroll: position-based, follows the real top-to-bottom
     section order (#home maps to the hero). Re-mapped after the section reorder. */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var spyPairs = navLinks.map(function (l) {
    var sel = l.getAttribute('href');
    var el = sel === '#home' ? document.getElementById('hero') : document.querySelector(sel);
    return el ? { link: l, el: el } : null;
  }).filter(Boolean).sort(function (a, b) { return a.el.offsetTop - b.el.offsetTop; });
  /* Live document-absolute tops: offsetTop is offsetParent-relative and breaks for
     nested targets (#donate lives inside #contact), which made the highlight jump
     to תרומה at the top of the page. Measure each target live instead. */
  function spyUpdate() {
    var pos = window.scrollY + window.innerHeight * 0.35;
    var current = spyPairs[0];
    var bestTop = -Infinity;
    for (var i = 0; i < spyPairs.length; i++) {
      var top = spyPairs[i].el.getBoundingClientRect().top + window.scrollY;
      if (top - 90 <= pos && top > bestTop) { bestTop = top; current = spyPairs[i]; }
    }
    navLinks.forEach(function (l) { l.classList.toggle('is-active', l === current.link); });
  }
  window.addEventListener('scroll', spyUpdate, { passive: true });
  window.addEventListener('resize', spyUpdate);
  spyUpdate();

  /* Reveal on scroll: replays on every re-entry, with hysteresis so the
     enter (15% visible) and exit (fully out) thresholds differ - this stops
     the show/hide oscillation that made sections jitter at the viewport edge. */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      var r = en.intersectionRatio;
      if (en.isIntersecting && (r >= 0.15 || en.boundingClientRect.height > window.innerHeight)) {
        en.target.classList.add('is-visible');
      } else if (r === 0) {
        /* remove only when the element is at least 60px outside the viewport -
           the 36px reveal shift can then never pull it back in (no oscillation) */
        var b = en.boundingClientRect;
        if (b.bottom < -60 || b.top > window.innerHeight + 60) {
          en.target.classList.remove('is-visible');
        }
      }
    });
  }, { threshold: [0, 0.15] });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* Hero carousel */
  var heroSlides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var heroIdx = 0;
  function heroGo(i) {
    heroSlides[heroIdx].classList.remove('is-on');
    heroIdx = (i + heroSlides.length) % heroSlides.length;
    heroSlides[heroIdx].classList.add('is-on');
  }
  setInterval(function () { heroGo(heroIdx + 1); }, 5500);


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
    muteBtn.addEventListener('click', function () {
      promo.muted = !promo.muted;
      if (!promo.muted) { var pr = promo.play(); if (pr && pr.catch) pr.catch(function () {}); }
      setMuteUI();
    });
    var videoObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= 0.4) {
          var p = promo.play();
          if (p && p.catch) p.catch(function () {});
        } else {
          promo.pause();
        }
      });
    }, { threshold: [0, 0.4] });
    videoObs.observe(videoFrame);
  }

  /* Activities carousel */
  var track = document.getElementById('actTrack');
  var items = track.children.length;
  var dots = document.getElementById('actDots');
  var idx = 0, timer;
  for (var d = 0; d < items; d++) {
    (function (i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'תמונה ' + (i + 1));
      if (i === 0) b.classList.add('is-on');
      b.addEventListener('click', function () { go(i); restart(); });
      dots.appendChild(b);
    })(d);
  }
  function go(i) {
    idx = (i + items) % items;
    /* Track is LTR: shifting left (negative X) moves forward, matching swipe + arrow glyphs */
    track.style.transform = 'translateX(' + (-idx * 100) + '%)';
    for (var k = 0; k < items; k++) dots.children[k].classList.toggle('is-on', k === idx);
  }
  function restart() {
    clearInterval(timer);
    timer = setInterval(function () { go(idx + 1); }, 4500);
  }
  document.querySelectorAll('.carousel-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      go(idx + parseInt(b.getAttribute('data-dir'), 10));
      restart();
    });
  });
  /* Touch swipe (mobile): swipe left = next image, swipe right = previous (RTL forward) */
  var carousel = document.getElementById('actCarousel');
  var touchX = null, touchY = null;
  carousel.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
    touchY = e.touches[0].clientY;
    clearInterval(timer);
  }, { passive: true });
  carousel.addEventListener('touchend', function (e) {
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

  /* Lightbox for posters */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  document.querySelectorAll('.news-card:not(.program-card)').forEach(function (card) {
    card.addEventListener('click', function () {
      lightboxImg.src = card.getAttribute('data-full');
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      history.pushState({ lightbox: true }, '');
    });
  });
  function closeLightbox(fromPopstate) {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
    if (!fromPopstate && history.state && history.state.lightbox) {
      history.back();
    }
  }
  /* Browser/mouse Back closes the lightbox instead of leaving the page */
  window.addEventListener('popstate', function () {
    if (lightbox.classList.contains('is-open')) closeLightbox(true);
  });
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
})();

/* Team: show/hide the rest of the team cards */
document.addEventListener('DOMContentLoaded', function () {
  var teamMore = document.getElementById('teamMore');
  var teamExtra = document.getElementById('teamExtra');
  if (teamMore && teamExtra) {
    teamMore.addEventListener('click', function () {
      if (teamExtra.hasAttribute('hidden')) {
        teamExtra.removeAttribute('hidden');
        teamMore.textContent = 'סגירת הרשימה';
      } else {
        teamExtra.setAttribute('hidden', '');
        teamMore.textContent = 'לשאר חברי הצוות';
      }
    });
  }
});
