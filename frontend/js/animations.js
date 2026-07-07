/**
 * animations.js
 * Scroll reveals · counter animations · parallax · skill bars
 * Siddharth Nishkalan Portfolio
 */

(function () {
  'use strict';

  // ─── INTERSECTION OBSERVERS ───

  /** Generic reveal observer */
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        // Don't unobserve so re-scroll keeps it visible
      }
    });
  }, { threshold: 0.13 });

  document.querySelectorAll('.reveal, .reveal-left, .reveal-right').forEach(el => {
    revealObs.observe(el);
  });

  // ─── SKILL CARDS STAGGER ───
  const skillRows = document.querySelectorAll('.skill-row');
  skillRows.forEach(row => {
    const cards = row.querySelectorAll('.skill-card');
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        cards.forEach((c, i) => {
          setTimeout(() => c.classList.add('in'), i * 80);
        });
      }
    }, { threshold: 0.15 }).observe(row);
  });

  // ─── CONCEPT CHIPS STAGGER ───
  const chipContainers = document.querySelectorAll('.concept-chips');
  chipContainers.forEach(container => {
    const chips = container.querySelectorAll('.concept-chip');
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        chips.forEach((c, i) => {
          setTimeout(() => c.classList.add('in'), parseInt(c.dataset.delay) || i * 80);
        });
      }
    }, { threshold: 0.2 }).observe(container);
  });

  // ─── PROJECT CARDS ───
  document.querySelectorAll('.proj-card').forEach(card => {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) card.classList.add('in');
    }, { threshold: 0.15 }).observe(card);
  });

  // ─── TIMELINE ITEMS ───
  document.querySelectorAll('.timeline-item').forEach(item => {
    revealObs.observe(item);
  });

  // ─── FOOTER ───
  const footer = document.querySelector('footer');
  if (footer) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) footer.classList.add('in');
    }, { threshold: 0.2 }).observe(footer);
  }

  // ─── LANG BARS ───
  const langCard = document.querySelector('.lang-card');
  if (langCard) {
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) langCard.classList.add('in');
    }, { threshold: 0.3 }).observe(langCard);
  }

  // ─── COUNTER ANIMATION ───
  function animateCounter(el) {
    const target  = parseFloat(el.dataset.count);
    const decimal = el.dataset.decimal || '';
    const suffix  = el.dataset.suffix  || '';
    const dur     = 1400; // ms
    const start   = performance.now();

    el.classList.add('counting');

    function step(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / dur, 1);
      // ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const val = ease * target;

      if (decimal) {
        el.textContent = val.toFixed(2) + suffix;
      } else {
        el.textContent = Math.floor(val) + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = (decimal ? target.toFixed(2) : target) + decimal + suffix;
        el.classList.remove('counting');
      }
    }
    requestAnimationFrame(step);
  }

  const aboutSection = document.getElementById('about');
  if (aboutSection) {
    let counted = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !counted) {
        counted = true;
        document.querySelectorAll('.stat-num[data-count]').forEach(el => animateCounter(el));
      }
    }, { threshold: 0.3 }).observe(aboutSection);
  }

  // ─── PARALLAX ───
  // Section-based parallax for alt sections background
  const sections = document.querySelectorAll('.section');

  function onScroll() {
    const sy = window.scrollY;

    // Hero: fade grid bg on scroll
    const heroGrid = document.querySelector('.grid-bg');
    if (heroGrid) {
      const vh = window.innerHeight;
      const fade = Math.min(sy / (vh * 0.6), 1);
      heroGrid.style.opacity = 1 - fade;
    }

    // Sections: subtle translateY for depth layers
    sections.forEach(sec => {
      const rect   = sec.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      const depth  = center * 0.04;
      const hexBg  = sec.querySelector('.hex-bg');
      if (hexBg) hexBg.style.transform = `translateY(${depth}px)`;
    });

    // Gesture SVG parallax
    const gesture = document.querySelector('.hero-gesture');
    if (gesture) {
      gesture.style.transform = `translateY(calc(-52% + ${sy * 0.18}px))`;
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  // ─── TERMINAL TYPEWRITER (project code blocks) ───
  function typewriterTerminal(pre, delay = 0) {
    const original = pre.innerHTML;
    pre.innerHTML = '';
    pre.style.minHeight = '120px';

    // Split by \n preserving HTML tags
    const lines = original.split('\n');
    let lineIdx = 0;
    let charIdx = 0;
    let currentLine = '';
    let lineEl = null;

    function nextChar() {
      if (lineIdx >= lines.length) return;

      if (charIdx === 0) {
        lineEl = document.createElement('div');
        lineEl.style.minHeight = '1em';
        pre.appendChild(lineEl);
      }

      currentLine = lines[lineIdx];
      if (charIdx < currentLine.length) {
        lineEl.innerHTML = currentLine.slice(0, charIdx + 1);
        charIdx++;
        setTimeout(nextChar, 18);
      } else {
        lineIdx++;
        charIdx = 0;
        setTimeout(nextChar, 30);
      }
    }

    setTimeout(nextChar, delay);
  }

  // Trigger terminal animations when project cards enter view
  document.querySelectorAll('.proj-terminal .terminal-code').forEach((pre, idx) => {
    let done = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !done) {
        done = true;
        typewriterTerminal(pre, idx * 200);
      }
    }, { threshold: 0.5 }).observe(pre);
  });

  // ─── ARCHITECTURE DIAGRAM ───
  const archDiagram = document.getElementById('arch-diagram');
  if (archDiagram) {
    let archDone = false;
    new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && !archDone) {
        archDone = true;
        archDiagram.querySelectorAll('.arch-node').forEach(node => {
          node.style.opacity = '';
          node.style.transform = '';
        });
      }
    }, { threshold: 0.4 }).observe(archDiagram);
  }

  // ─── SECTION ACTIVE LINKS ───
  const navLinks = document.querySelectorAll('.nav-links a');
  const sectionIds = ['hero', 'skills', 'projects', 'education', 'about', 'contact'];

  function updateActiveLink() {
    const sy = window.scrollY + window.innerHeight * 0.4;
    let active = '';
    sectionIds.forEach(id => {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= sy) active = id;
    });
    navLinks.forEach(a => {
      const href = a.getAttribute('href').replace('#', '');
      a.classList.toggle('active', href === active);
    });
  }

  window.addEventListener('scroll', updateActiveLink, { passive: true });
  updateActiveLink();

  // ─── GESTURE FPS FAKE COUNTER ───
  const fpsEl = document.getElementById('fps-count');
  if (fpsEl) {
    setInterval(() => {
      // Simulate realistic FPS jitter around 60
      const jitter = Math.round(56 + Math.random() * 8);
      fpsEl.textContent = jitter;
    }, 1000);
  }

  // ─── PROJ CARDS REVEAL CLASS FOR ARCH ───
  document.querySelectorAll('.proj-card').forEach(card => {
    revealObs.observe(card);
  });

})();
