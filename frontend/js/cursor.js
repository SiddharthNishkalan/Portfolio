/**
 * cursor.js
 * Custom cursor: dot + lagging ring + canvas trail
 * Siddharth Nishkalan Portfolio
 */

(function () {
  'use strict';

  const dot   = document.getElementById('cursor-dot');
  const ring  = document.getElementById('cursor-ring');
  const glow  = document.getElementById('cursor-glow');
  const trail = document.getElementById('cursor-trail');

  if (!dot || !ring) return;

  // ─── TRAIL CANVAS ───
  const tCtx = trail ? trail.getContext('2d') : null;
  let TW = 0, TH = 0;
  const TRAIL_POINTS = [];
  const MAX_TRAIL    = 28;

  function sizeTrail() {
    if (!trail) return;
    TW = trail.width  = window.innerWidth;
    TH = trail.height = window.innerHeight;
  }
  window.addEventListener('resize', sizeTrail);
  sizeTrail();

  // ─── MOUSE STATE ───
  let mx = window.innerWidth / 2;
  let my = window.innerHeight / 2;
  let rx = mx, ry = my; // ring lerp position

  // ─── TRACK MOUSE ───
  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;

    dot.style.left = mx + 'px';
    dot.style.top  = my + 'px';

    if (glow) {
      glow.style.left = mx + 'px';
      glow.style.top  = my + 'px';
    }

    TRAIL_POINTS.push({ x: mx, y: my, a: 1, t: Date.now() });
    if (TRAIL_POINTS.length > MAX_TRAIL) TRAIL_POINTS.shift();
  });

  // ─── RING LERP LOOP ───
  ;(function lerpRing() {
    rx += (mx - rx) * 0.15;
    ry += (my - ry) * 0.15;
    ring.style.left = rx + 'px';
    ring.style.top  = ry + 'px';
    requestAnimationFrame(lerpRing);
  })();

  // ─── TRAIL DRAW LOOP ───
  if (tCtx) {
    ;(function drawTrail() {
      tCtx.clearRect(0, 0, TW, TH);

      if (TRAIL_POINTS.length > 1) {
        const now = Date.now();
        for (let i = 1; i < TRAIL_POINTS.length; i++) {
          const age = (now - TRAIL_POINTS[i].t) / 400; // 0→1 over 400ms
          const alpha = Math.max(0, (1 - age) * (i / TRAIL_POINTS.length) * 0.55);
          const radius = (i / TRAIL_POINTS.length) * 3;

          tCtx.beginPath();
          tCtx.moveTo(TRAIL_POINTS[i - 1].x, TRAIL_POINTS[i - 1].y);
          tCtx.lineTo(TRAIL_POINTS[i].x, TRAIL_POINTS[i].y);
          tCtx.strokeStyle = `rgba(0,212,255,${alpha})`;
          tCtx.lineWidth = radius;
          tCtx.lineCap = 'round';
          tCtx.stroke();
        }
      }

      requestAnimationFrame(drawTrail);
    })();
  }

  // ─── HOVER STATES ───
  const interactives = 'a, button, .skill-card, .proj-card, .stat-card, .tl-card, .cbtn, .btn-proj, .btn-primary, .btn-ghost, .chip, .concept-chip, .tag-pill, .contact-btn, .arch-node';

  document.querySelectorAll(interactives).forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });

  // Use MutationObserver to catch dynamically revealed elements too
  const obs = new MutationObserver(() => {
    document.querySelectorAll(interactives + ':not([data-cursor-bound])').forEach(el => {
      el.setAttribute('data-cursor-bound', '1');
      el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
      el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
    });
  });
  obs.observe(document.body, { childList: true, subtree: true });

  // ─── CLICK RIPPLE ───
  document.addEventListener('click', e => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position:fixed;left:${e.clientX}px;top:${e.clientY}px;
      width:6px;height:6px;border-radius:50%;
      background:rgba(0,212,255,.6);
      pointer-events:none;z-index:9997;
      transform:translate(-50%,-50%);
      animation:clickRipple .5s ease forwards;
    `;
    document.body.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  });

  // Inject ripple keyframe once
  if (!document.getElementById('ripple-kf')) {
    const style = document.createElement('style');
    style.id = 'ripple-kf';
    style.textContent = `
      @keyframes clickRipple {
        from { width:6px;height:6px;opacity:.7; }
        to   { width:40px;height:40px;opacity:0; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─── HIDE on LEAVE ───
  document.addEventListener('mouseleave', () => {
    dot.style.opacity  = '0';
    ring.style.opacity = '0';
  });
  document.addEventListener('mouseenter', () => {
    dot.style.opacity  = '';
    ring.style.opacity = '';
  });
})();
