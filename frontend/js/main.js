/**
 * main.js
 * Navigation · Typing animation · Progress bar · Mobile menu · Init
 * Siddharth Nishkalan Portfolio
 */

(function () {
  'use strict';

  // ─── NAVBAR SCROLL ───
  const nav      = document.getElementById('nav');
  const progress = document.getElementById('progress-bar');

  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    const dh = document.body.scrollHeight - window.innerHeight;

    // Nav glass
    if (nav) nav.classList.toggle('scrolled', sy > 60);

    // Progress bar
    if (progress) progress.style.width = (dh > 0 ? (sy / dh) * 100 : 0) + '%';
  }, { passive: true });

  // ─── SMOOTH ANCHOR ───
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const target = document.querySelector(a.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Close mobile menu if open
      const navLinks = document.getElementById('nav-links');
      const toggle   = document.getElementById('nav-toggle');
      if (navLinks && navLinks.classList.contains('open')) {
        navLinks.classList.remove('open');
        toggle && toggle.classList.remove('open');
      }
    });
  });

  // ─── MOBILE MENU ───
  const navToggle = document.getElementById('nav-toggle');
  const navLinks  = document.getElementById('nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('open');
      navLinks.classList.toggle('open');
    });

    // Close on outside click
    document.addEventListener('click', e => {
      if (!nav.contains(e.target)) {
        navToggle.classList.remove('open');
        navLinks.classList.remove('open');
      }
    });
  }

  // ─── HERO NAME GLITCH DATA ATTRIBUTE ───
  document.querySelectorAll('.hero-name-line').forEach(el => {
    el.setAttribute('data-text', el.textContent.trim());
  });

  // ─── TYPING ANIMATION ───
  const typedEl = document.getElementById('typed-role');
  if (typedEl) {
    const phrases = [
      'Computer Vision Developer',
      'B.Tech IT Student @ SKCE',
      'Python · OpenCV · MediaPipe',
      'DSA Enthusiast · CGPA 9.45',
      'Building Air Canva & Interview Guard',
    ];

    let phraseIdx = 0;
    let charIdx   = 0;
    let deleting  = false;
    let pauseTimer;

    function type() {
      const phrase = phrases[phraseIdx];

      if (!deleting) {
        typedEl.textContent = phrase.slice(0, charIdx + 1);
        charIdx++;
        if (charIdx === phrase.length) {
          // Pause at full phrase
          clearTimeout(pauseTimer);
          pauseTimer = setTimeout(() => { deleting = true; type(); }, 2200);
          return;
        }
        setTimeout(type, 55);
      } else {
        typedEl.textContent = phrase.slice(0, charIdx - 1);
        charIdx--;
        if (charIdx === 0) {
          deleting = false;
          phraseIdx = (phraseIdx + 1) % phrases.length;
          setTimeout(type, 400);
          return;
        }
        setTimeout(type, 28);
      }
    }

    // Start after hero animations settle
    setTimeout(type, 1400);
  }

  // ─── KEYBOARD NAVIGATION ───
  document.addEventListener('keydown', e => {
    // Press Escape to close mobile menu
    if (e.key === 'Escape') {
      const links  = document.getElementById('nav-links');
      const toggle = document.getElementById('nav-toggle');
      links  && links.classList.remove('open');
      toggle && toggle.classList.remove('open');
    }
  });

  // ─── LAZY PREFERS REDUCED MOTION ───
  const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyReducedMotion() {
    document.body.classList.toggle('reduced-motion', mq.matches);
  }
  mq.addEventListener('change', applyReducedMotion);
  applyReducedMotion();

  // ─── YEAR IN FOOTER ───
  const footerCopy = document.querySelector('.footer-copy');
  if (footerCopy) {
    footerCopy.textContent = `Built with craft · ${new Date().getFullYear()}`;
  }

  // ─── CONSOLE EASTER EGG ───
  const styles = [
    'color:#00d4ff;font-size:1.1rem;font-weight:bold;font-family:monospace',
    'color:#a78bfa;font-size:.85rem;font-family:monospace',
    'color:#7a90b0;font-size:.75rem;font-family:monospace',
  ];
  console.log('%c👋 Hey there, fellow developer!', styles[0]);
  console.log('%cThis is Siddharth Nishkalan\'s portfolio.', styles[1]);
  console.log('%cs.siddharthnishkalan@gmail.com', styles[2]);

  // ─── PERFORMANCE: PAUSE ANIMATIONS OFFSCREEN ───
  document.addEventListener('visibilitychange', () => {
    document.body.classList.toggle('tab-hidden', document.hidden);
  });

  // ─── LINK EXTERNAL IN NEW TAB SAFETY ───
  document.querySelectorAll('a[target="_blank"]').forEach(a => {
    if (!a.rel.includes('noopener')) a.rel = 'noopener noreferrer';
  });

})();
