/**
 * Pine Beach — main.js
 * Nav scroll state, mobile menu, scroll reveal, email form.
 */

(() => {
  'use strict';

  /* ── Nav scroll state ── */
  const nav = document.querySelector('.site-nav');
  const updateNav = () => {
    nav.classList.toggle('scrolled', window.scrollY > 24);
  };
  window.addEventListener('scroll', updateNav, { passive: true });
  updateNav();

  /* ── Mobile hamburger ── */
  const hamburger   = document.querySelector('.nav-hamburger');
  const mobileMenu  = document.querySelector('.nav-mobile-menu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      const open = hamburger.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', String(open));
      mobileMenu.classList.toggle('open', open);
      mobileMenu.setAttribute('aria-hidden', String(!open));
    });

    // Close on mobile link click
    mobileMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
        mobileMenu.classList.remove('open');
        mobileMenu.setAttribute('aria-hidden', 'true');
      });
    });
  }

  /* ── Scroll-reveal ── */
  const revealEls = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window && revealEls.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback: show everything
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── Smooth scroll for anchor links ── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (!target) return;
      e.preventDefault();
      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ── Email form ── */
  const form      = document.getElementById('email-form');
  const successEl = document.getElementById('form-success');
  const submitBtn = form?.querySelector('[type="submit"]');

  if (form && successEl && submitBtn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const email = form.querySelector('#email-input')?.value?.trim();
      if (!email) return;

      // Show loading state
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        /**
         * TODO: replace this with your email provider endpoint.
         * Options: Mailchimp, ConvertKit, Resend, Brevo, etc.
         *
         * Example for a generic POST:
         * await fetch('https://your-provider.com/subscribe', {
         *   method: 'POST',
         *   headers: { 'Content-Type': 'application/json' },
         *   body: JSON.stringify({ email })
         * });
         */

        // Simulated delay (remove when real endpoint is wired)
        await new Promise(resolve => setTimeout(resolve, 900));

        // Success
        form.querySelector('.email-form-row').style.display = 'none';
        form.querySelector('.form-fine-print').style.display = 'none';
        successEl.hidden = false;

      } catch (err) {
        console.error('Email signup failed:', err);
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;

        // Show a simple inline error
        const errEl = form.querySelector('.form-error') || createErrorEl(form);
        errEl.textContent = 'Something went wrong. Try again or email us directly.';
        errEl.hidden = false;
      }
    });
  }

  function createErrorEl(parent) {
    const el = document.createElement('p');
    el.className = 'form-error';
    el.style.cssText = 'color:rgba(255,150,150,.9);font-size:.875rem;margin-top:.25rem;';
    parent.appendChild(el);
    return el;
  }

  /* ── Add reveal classes to sections ── */
  // We do this in JS so the CSS still works without JS (no hidden content).
  const revealTargets = [
    '.hero-badge', '.hero-logo', '.hero-headline', '.hero-sub',
    '.hero-ctas', '.hero-trust',
    '.what-grid', '.stat-strip',
    '.section-label', '.section-title', '.section-sub',
    '.products-grid', '.steps-grid',
    '.proof-badge-row', '.proof-headline', '.proof-body', '.quotes-grid',
    '.email-inner',
  ];

  revealTargets.forEach((selector, i) => {
    document.querySelectorAll(selector).forEach((el, j) => {
      el.classList.add('reveal');
      if ((i + j) % 4 === 1) el.classList.add('reveal-delay-1');
      if ((i + j) % 4 === 2) el.classList.add('reveal-delay-2');
      if ((i + j) % 4 === 3) el.classList.add('reveal-delay-3');
    });
  });

  // Re-observe after adding classes
  if ('IntersectionObserver' in window) {
    const observer2 = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer2.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });

    document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer2.observe(el));
  }

})();
