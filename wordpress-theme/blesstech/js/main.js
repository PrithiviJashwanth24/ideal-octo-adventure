/**
 * Blesstech Theme — Main JS
 * Handles nav, scroll animations, video player, contact form
 */
(function () {
  'use strict';

  /* ── Sticky Header ─────────────────────────────────────── */
  const header = document.getElementById('site-header');
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', window.scrollY > 60);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── Hamburger Menu ────────────────────────────────────── */
  const hamburger = document.getElementById('hamburger');
  const navMenu = document.getElementById('nav-menu');
  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', navMenu.classList.contains('open'));
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => navMenu.classList.remove('open'));
    });
  }

  /* ── Scroll Animations (Intersection Observer) ──────────── */
  const animateEls = document.querySelectorAll('.fade-up');
  if (animateEls.length && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    animateEls.forEach(el => observer.observe(el));
  } else {
    animateEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Video Player ──────────────────────────────────────── */
  const video = document.getElementById('brand-reel');
  const playBtn = document.getElementById('reel-play');
  if (video && playBtn) {
    playBtn.addEventListener('click', () => {
      if (video.paused) {
        video.muted = false;
        video.play();
        playBtn.style.opacity = '0';
        playBtn.style.pointerEvents = 'none';
      } else {
        video.pause();
        playBtn.style.opacity = '1';
        playBtn.style.pointerEvents = '';
      }
    });
    // Autoplay muted when in viewport
    if ('IntersectionObserver' in window) {
      const videoObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            video.muted = true;
            video.play().catch(() => {});
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.5 });
      videoObs.observe(video);
    }
  }

  /* ── Stat Counter Animation ────────────────────────────── */
  function animateCounter(el, target, suffix = '') {
    const isFloat = target % 1 !== 0;
    const duration = 1800;
    const step = 16;
    const steps = duration / step;
    let current = 0;
    const increment = target / steps;
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      el.textContent = (isFloat ? current.toFixed(1) : Math.floor(current)) + suffix;
    }, step);
  }

  const statNumbers = document.querySelectorAll('.stat-number');
  if (statNumbers.length && 'IntersectionObserver' in window) {
    const statObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const raw = entry.target.textContent;
          const match = raw.match(/([\d.]+)(.*)/);
          if (match) {
            animateCounter(entry.target, parseFloat(match[1]), match[2]);
          }
          statObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    statNumbers.forEach(el => statObs.observe(el));
  }

  /* ── Smooth Scroll ─────────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const target = document.querySelector(link.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = header ? header.offsetHeight + 16 : 80;
        window.scrollTo({
          top: target.getBoundingClientRect().top + window.scrollY - offset,
          behavior: 'smooth',
        });
      }
    });
  });

  /* ── Contact Form ──────────────────────────────────────── */
  const form = document.getElementById('contact-form');
  const status = document.getElementById('form-status');
  if (form && status && typeof blesstech !== 'undefined') {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const btn = form.querySelector('[type=submit]');
      const original = btn.textContent;
      btn.disabled = true;
      btn.textContent = 'Sending...';

      const body = new FormData(form);
      body.append('action', 'blesstech_contact');
      body.append('nonce', blesstech.nonce);

      try {
        const res = await fetch(blesstech.ajax_url, { method: 'POST', body });
        const data = await res.json();
        status.style.display = 'block';
        if (data.success) {
          status.style.background = 'rgba(52,211,153,0.12)';
          status.style.border = '1px solid rgba(52,211,153,0.4)';
          status.style.color = '#34d399';
          status.textContent = data.data;
          form.reset();
        } else {
          status.style.background = 'rgba(248,113,113,0.12)';
          status.style.border = '1px solid rgba(248,113,113,0.4)';
          status.style.color = '#f87171';
          status.textContent = data.data;
        }
      } catch {
        status.style.display = 'block';
        status.textContent = 'Network error. Please try again.';
      } finally {
        btn.disabled = false;
        btn.textContent = original;
      }
    });
  }

})();
