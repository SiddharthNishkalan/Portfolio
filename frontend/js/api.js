/**
 * api.js — Frontend ↔ Flask Backend Connector
 * Handles: contact form, visitor tracking, GitHub stats, portfolio stats
 * Siddharth Nishkalan Portfolio
 */

(function () {
  'use strict';

  // ── Config ─────────────────────────────────────────────────────────────────
  const API_BASE = 'https://portfolio-backend-j18h.onrender.com';   // Change to deployed URL in prod
  const TIMEOUT  = 8000;                       // 8 second request timeout

  // ── Fetch wrapper with timeout ─────────────────────────────────────────────
  async function apiFetch(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    try {
      const res = await fetch(API_BASE + path, {
        headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
        signal: controller.signal,
        ...options,
      });
      clearTimeout(timer);
      const data = await res.json();
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      clearTimeout(timer);
      if (err.name === 'AbortError') {
        return { ok: false, status: 0, data: { error: 'Request timed out.' } };
      }
      return { ok: false, status: 0, data: { error: 'Network error.' } };
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CONTACT FORM
  // ═══════════════════════════════════════════════════════════════════════════

  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', handleContactSubmit);
  }

  async function handleContactSubmit(e) {
    e.preventDefault();

    const form    = e.target;
    const btn     = form.querySelector('.form-submit-btn');
    const status  = document.getElementById('form-status');

    // Collect fields
    const payload = {
      name:    form.querySelector('[name="name"]')?.value.trim()    || '',
      email:   form.querySelector('[name="email"]')?.value.trim()   || '',
      subject: form.querySelector('[name="subject"]')?.value.trim() || 'Portfolio Enquiry',
      message: form.querySelector('[name="message"]')?.value.trim() || '',
      website: form.querySelector('[name="website"]')?.value        || '',  // honeypot
    };

    // Client-side validation
    if (payload.name.length < 2) {
      return showFormStatus(status, 'error', 'Please enter your full name.');
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(payload.email)) {
      return showFormStatus(status, 'error', 'Please enter a valid email address.');
    }
    if (payload.message.length < 10) {
      return showFormStatus(status, 'error', 'Message must be at least 10 characters.');
    }

    // Loading state
    setButtonLoading(btn, true);
    clearFormStatus(status);

    const { ok, data } = await apiFetch('/api/contact/', {
      method: 'POST',
      body:   JSON.stringify(payload),
    });

    setButtonLoading(btn, false);

    if (ok && data.success) {
      showFormStatus(status, 'success',
        data.message || 'Message sent! I\'ll reply within 24 hours 🚀');
      form.reset();
      confettiPop();
    } else {
      showFormStatus(status, 'error',
        data.error || 'Something went wrong. Please try emailing me directly.');
    }
  }

  function showFormStatus(el, type, text) {
    if (!el) return;
    el.textContent = text;
    el.className   = 'form-status ' + type;
    el.style.display = 'block';
    setTimeout(() => { if (el.className.includes(type)) clearFormStatus(el); }, 7000);
  }

  function clearFormStatus(el) {
    if (!el) return;
    el.style.display = 'none';
    el.textContent   = '';
    el.className     = 'form-status';
  }

  function setButtonLoading(btn, loading) {
    if (!btn) return;
    btn.disabled       = loading;
    btn.dataset.orig   = btn.dataset.orig || btn.innerHTML;
    btn.innerHTML      = loading
      ? '<span class="btn-spinner"></span> Sending…'
      : btn.dataset.orig;
  }

  // Small confetti burst on success
  function confettiPop() {
    const colors = ['#00d4ff', '#a78bfa', '#39d353', '#f98500'];
    for (let i = 0; i < 28; i++) {
      const dot = document.createElement('div');
      const color = colors[i % colors.length];
      const startX = window.innerWidth / 2 + (Math.random() - .5) * 300;
      const startY = window.innerHeight * .7;
      dot.style.cssText = `
        position:fixed; left:${startX}px; top:${startY}px;
        width:${4 + Math.random() * 5}px; height:${4 + Math.random() * 5}px;
        border-radius:50%; background:${color}; pointer-events:none; z-index:9000;
        animation:confetti ${.8 + Math.random() * .6}s ease-out forwards;
        --dx:${(Math.random() - .5) * 200}px;
        --dy:${-(80 + Math.random() * 140)}px;
      `;
      document.body.appendChild(dot);
      setTimeout(() => dot.remove(), 1500);
    }

    if (!document.getElementById('confetti-kf')) {
      const s = document.createElement('style');
      s.id = 'confetti-kf';
      s.textContent = `@keyframes confetti {
        from { opacity:1; transform:translate(0,0) scale(1); }
        to   { opacity:0; transform:translate(var(--dx),var(--dy)) scale(0); }
      }`;
      document.head.appendChild(s);
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // VISITOR TRACKING
  // ═══════════════════════════════════════════════════════════════════════════

  // Record a visit after a short delay (ensures page has loaded)
  setTimeout(() => {
    apiFetch('/api/stats/visit', {
      method: 'POST',
      body: JSON.stringify({ page: window.location.pathname }),
    }).catch(() => { /* silently ignore */ });
  }, 2000);

  // ═══════════════════════════════════════════════════════════════════════════
  // PORTFOLIO STATS (visitor count display)
  // ═══════════════════════════════════════════════════════════════════════════

  async function loadPortfolioStats() {
    const visitorEl = document.getElementById('visitor-count');
    if (!visitorEl) return;

    const { ok, data } = await apiFetch('/api/stats/');
    if (ok) {
      visitorEl.textContent = data.unique_30d?.toLocaleString() || '—';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // GITHUB STATS
  // ═══════════════════════════════════════════════════════════════════════════

  async function loadGitHubStats() {
    const repoCountEl  = document.getElementById('gh-repos');
    const followersEl  = document.getElementById('gh-followers');

    if (!repoCountEl && !followersEl) return;

    const { ok, data } = await apiFetch('/api/github/profile');
    if (ok) {
      if (repoCountEl)  repoCountEl.textContent  = data.public_repos ?? '—';
      if (followersEl)  followersEl.textContent   = data.followers    ?? '—';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // INIT
  // ═══════════════════════════════════════════════════════════════════════════

  // Load stats when DOM is ready (non-blocking)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      loadPortfolioStats();
      loadGitHubStats();
    });
  } else {
    loadPortfolioStats();
    loadGitHubStats();
  }

})();
