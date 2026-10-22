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

  /* Active nav link on scroll */
  var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-link'));
  var sections = navLinks
    .map(function (l) { return document.querySelector(l.getAttribute('href')); })
    .filter(Boolean);
  var spy = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        navLinks.forEach(function (l) {
          l.classList.toggle('is-active', l.getAttribute('href') === '#' + en.target.id);
        });
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  sections.forEach(function (s) { spy.observe(s); });

  /* Reveal on scroll */
  var revealObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) {
        en.target.classList.add('is-visible');
        revealObs.unobserve(en.target);
      }
    });
  }, { threshold: 0.15 });
  document.querySelectorAll('.reveal').forEach(function (el) { revealObs.observe(el); });

  /* Hero carousel */
  var heroSlides = Array.prototype.slice.call(document.querySelectorAll('.hero-slide'));
  var heroDots = document.getElementById('heroDots');
  var heroIdx = 0;
  heroSlides.forEach(function (_, i) {
    var b = document.createElement('button');
    b.setAttribute('aria-label', 'תמונה ' + (i + 1));
    if (i === 0) b.classList.add('is-on');
    b.addEventListener('click', function () { heroGo(i); });
    heroDots.appendChild(b);
  });
  function heroGo(i) {
    heroSlides[heroIdx].classList.remove('is-on');
    heroDots.children[heroIdx].classList.remove('is-on');
    heroIdx = (i + heroSlides.length) % heroSlides.length;
    heroSlides[heroIdx].classList.add('is-on');
    heroDots.children[heroIdx].classList.add('is-on');
  }
  setInterval(function () { heroGo(heroIdx + 1); }, 5500);

  /* 16 tiles (placeholders, למילוי בהמשך) */
  var tilesGrid = document.getElementById('tilesGrid');
  for (var t = 0; t < 16; t++) {
    var tile = document.createElement('div');
    tile.className = 'tile reveal';
    tile.innerHTML = '<span class="tile-num">—</span><span class="tile-label">יתמלא בקרוב</span>';
    tilesGrid.appendChild(tile);
    revealObs.observe(tile);
  }

  /* Promo video - YouTube embed, autoplays muted in view, pauses out of view */
  var videoFrame = document.getElementById('videoFrame');
  if (videoFrame) {
    var ytFrame = document.createElement('iframe');
    ytFrame.src = 'https://www.youtube-nocookie.com/embed/tCTWXSj6ksc?enablejsapi=1&rel=0&modestbranding=1&playsinline=1&mute=1';
    ytFrame.title = 'הסרטון שלנו';
    ytFrame.allow = 'autoplay; encrypted-media; picture-in-picture';
    ytFrame.allowFullscreen = true;
    ytFrame.setAttribute('loading', 'lazy');
    videoFrame.appendChild(ytFrame);
    var ytCmd = function (func) {
      ytFrame.contentWindow.postMessage(JSON.stringify({ event: 'command', func: func, args: [] }), '*');
    };
    var videoObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.intersectionRatio >= 0.4) { ytCmd('playVideo'); }
        else { ytCmd('pauseVideo'); }
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
    /* RTL: track flows right-to-left, so shifting right (positive X) moves forward */
    track.style.transform = 'translateX(' + (idx * 100) + '%)';
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
  restart();

  /* Lightbox for posters */
  var lightbox = document.getElementById('lightbox');
  var lightboxImg = document.getElementById('lightboxImg');
  document.querySelectorAll('.news-card').forEach(function (card) {
    card.addEventListener('click', function () {
      lightboxImg.src = card.getAttribute('data-full');
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    });
  });
  function closeLightbox() {
    lightbox.classList.remove('is-open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    lightboxImg.src = '';
  }
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLightbox(); });
})();
