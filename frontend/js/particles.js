/**
 * particles.js
 * Canvas particle field for hero background
 * Siddharth Nishkalan Portfolio
 */

(function () {
  'use strict';

  const canvas = document.getElementById('particles');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, particles = [], animId;
  let mouseX = -9999, mouseY = -9999;

  // ─── CONFIG ───
  const CFG = {
    count:        90,
    maxDist:      130,
    baseRadius:   1.2,
    speed:        0.22,
    mouseRadius:  180,
    mouseStrength:0.012,
    colors: [
      'rgba(0,212,255,',    // cyan
      'rgba(167,139,250,',  // purple
      'rgba(57,211,83,',    // green
    ],
  };

  // ─── PARTICLE CLASS ───
  class Particle {
    constructor() { this.reset(true); }

    reset(randomPos = false) {
      this.x  = randomPos ? Math.random() * W : (Math.random() < .5 ? -10 : W + 10);
      this.y  = randomPos ? Math.random() * H : Math.random() * H;
      this.r  = Math.random() * CFG.baseRadius + .4;
      this.vx = (Math.random() - .5) * CFG.speed;
      this.vy = (Math.random() - .5) * CFG.speed;
      this.alpha = Math.random() * .35 + .1;
      this.color = CFG.colors[Math.floor(Math.random() * CFG.colors.length)];
      this.pulse = Math.random() * Math.PI * 2; // phase offset
    }

    update(t) {
      // Mouse repulsion
      const dx = this.x - mouseX;
      const dy = this.y - mouseY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CFG.mouseRadius) {
        const force = (CFG.mouseRadius - dist) / CFG.mouseRadius;
        this.vx += (dx / dist) * force * CFG.mouseStrength;
        this.vy += (dy / dist) * force * CFG.mouseStrength;
      }

      // Soft friction
      this.vx *= 0.996;
      this.vy *= 0.996;

      // Speed cap
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > CFG.speed * 3) {
        this.vx = (this.vx / speed) * CFG.speed * 3;
        this.vy = (this.vy / speed) * CFG.speed * 3;
      }

      this.x += this.vx;
      this.y += this.vy;

      // Wrap edges
      if (this.x < -20) this.x = W + 20;
      if (this.x > W + 20) this.x = -20;
      if (this.y < -20) this.y = H + 20;
      if (this.y > H + 20) this.y = -20;

      // Pulse alpha
      this.currentAlpha = this.alpha * (0.7 + 0.3 * Math.sin(t * .001 + this.pulse));
    }

    draw(t) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color + this.currentAlpha + ')';
      ctx.fill();
    }
  }

  // ─── INIT ───
  function init() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    const n = Math.min(Math.floor(W * H / 12000), CFG.count);
    particles = Array.from({ length: n }, () => new Particle());
  }

  // ─── DRAW ───
  function draw(t) {
    ctx.clearRect(0, 0, W, H);

    // Update
    particles.forEach(p => p.update(t));

    // Connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < CFG.maxDist * CFG.maxDist) {
          const alpha = (1 - Math.sqrt(d2) / CFG.maxDist) * 0.12;
          ctx.beginPath();
          ctx.strokeStyle = `rgba(0,212,255,${alpha})`;
          ctx.lineWidth = .5;
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // Draw particles on top
    particles.forEach(p => p.draw(t));

    animId = requestAnimationFrame(draw);
  }

  // ─── MOUSE ───
  document.addEventListener('mousemove', e => {
    mouseX = e.clientX;
    mouseY = e.clientY;
  });

  // ─── RESIZE ───
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  // ─── VISIBILITY ───
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(animId); }
    else { animId = requestAnimationFrame(draw); }
  });

  // ─── HERO SCROLL FADE ───
  const hero = document.getElementById('hero');
  window.addEventListener('scroll', () => {
    if (!hero) return;
    const prog = Math.min(window.scrollY / (hero.offsetHeight * .8), 1);
    canvas.style.opacity = 1 - prog;
  }, { passive: true });

  init();
  requestAnimationFrame(draw);
})();
