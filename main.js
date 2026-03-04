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

/* ════════════════════════════════════════════════════════════════
   Pine Beach Onboarding Wizard — PBWizard class
   6-step modal collecting all info needed to build a website.
   On submit: console.log(formData) + show success screen.
════════════════════════════════════════════════════════════════ */
(function() {
  'use strict';

  const INDUSTRY_LABELS = {
    'physiotherapy':        'Physiotherapy',
    'personal-training':    'Personal Training',
    'nutrition':            'Nutrition',
    'chiropractic':         'Chiropractic',
    'massage-therapy':      'Massage Therapy',
    'occupational-therapy': 'Occupational Therapy',
    'other-health-wellness':'Other Health / Wellness',
    'trades':               'Trades',
    'other':                'Other',
  };
  const PALETTE_LABELS = {
    'warm-earth':       'Warm Earth',
    'ocean-blue':       'Ocean Blue',
    'forest-green':     'Forest Green',
    'modern-minimal':   'Modern Minimal',
    'sunset-gold':      'Sunset Gold',
    'classic-charcoal': 'Classic Charcoal',
  };

  class PBWizard {
    constructor() {
      this.modal      = document.getElementById('pbw-modal');
      if (!this.modal) return;

      this.backdrop   = document.getElementById('pbw-backdrop');
      this.content    = document.getElementById('pbw-content');
      this.footer     = document.getElementById('pbw-footer');
      this.btnBack    = document.getElementById('pbw-back');
      this.btnNext    = document.getElementById('pbw-next');
      this.btnSubmit  = document.getElementById('pbw-submit');
      this.stepNumEl  = document.getElementById('pbw-step-num');
      this.progressEl = document.getElementById('pbw-progress');

      this.currentStep = 1;
      this.totalSteps  = 6;
      this.formData    = {};
      this.logoFile    = null;
      this.logoObjURL  = null;
      this.docFiles    = [];

      this._bind();
      this._updateUI();
    }

    /* ── Binding ── */
    _bind() {
      // Trigger buttons (anywhere on page)
      document.querySelectorAll('[data-wizard-trigger]').forEach(el => {
        el.addEventListener('click', (e) => { e.preventDefault(); this.open(); });
      });

      // Close
      document.getElementById('pbw-close')?.addEventListener('click', () => this.close());
      this.backdrop?.addEventListener('click', () => this.close());
      document.getElementById('pbw-success-close')?.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.modal.classList.contains('is-open')) this.close();
      });

      // Navigation
      this.btnBack?.addEventListener('click',   () => this.prev());
      this.btnNext?.addEventListener('click',   () => this.next());
      this.btnSubmit?.addEventListener('click', () => this.submit());

      // Products Yes/No toggle
      const prodYes    = document.getElementById('pbw-prod-yes');
      const prodNo     = document.getElementById('pbw-prod-no');
      const prodDetail = document.getElementById('pbw-products-detail');
      [prodYes, prodNo].forEach(r => r?.addEventListener('change', () => {
        if (prodDetail) prodDetail.hidden = !(prodYes?.checked);
      }));

      // Logo upload → preview
      const logoInput   = document.getElementById('pbw-logo');
      const logoPreview = document.getElementById('pbw-logo-preview');
      const logoImg     = document.getElementById('pbw-logo-img');
      const logoRemove  = document.getElementById('pbw-logo-remove');

      logoInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (this.logoObjURL) URL.revokeObjectURL(this.logoObjURL);
        this.logoFile   = file;
        this.logoObjURL = URL.createObjectURL(file);
        logoImg.src     = this.logoObjURL;
        logoPreview.hidden = false;
      });
      logoRemove?.addEventListener('click', () => {
        logoInput.value = '';
        logoImg.src     = '';
        logoPreview.hidden = true;
        if (this.logoObjURL) { URL.revokeObjectURL(this.logoObjURL); this.logoObjURL = null; }
        this.logoFile = null;
      });

      // Document upload → file list
      const docsInput = document.getElementById('pbw-docs');
      const docsList  = document.getElementById('pbw-docs-list');
      docsInput?.addEventListener('change', () => this._renderFileList(docsInput, docsList));
    }

    /* ── File list renderer ── */
    _renderFileList(input, listEl) {
      listEl.innerHTML = '';
      this.docFiles = Array.from(input.files);
      this.docFiles.forEach((file, i) => {
        const item = document.createElement('div');
        item.className = 'pbw-file-item';
        item.innerHTML = `<span class="pbw-file-item-name">${this._esc(file.name)}</span>
          <span class="pbw-file-remove" title="Remove">✕</span>`;
        item.querySelector('.pbw-file-remove').addEventListener('click', () => {
          // Clear input + re-render without this file (FileList is read-only;
          // rebuild via DataTransfer if supported, else clear all)
          if (typeof DataTransfer !== 'undefined') {
            const dt = new DataTransfer();
            this.docFiles.forEach((f, j) => { if (j !== i) dt.items.add(f); });
            input.files = dt.files;
          } else {
            input.value = '';
          }
          this._renderFileList(input, listEl);
        });
        listEl.appendChild(item);
      });
    }

    /* ── Open / close ── */
    open() {
      this._resetSuccess();
      this.modal.hidden = false;
      requestAnimationFrame(() => this.modal.classList.add('is-open'));
      document.body.style.overflow = 'hidden';
      setTimeout(() => {
        document.getElementById('pbw-biz-name')?.focus();
      }, 350);
    }
    close() {
      this.modal.classList.remove('is-open');
      setTimeout(() => { this.modal.hidden = true; }, 280);
      document.body.style.overflow = '';
    }

    /* ── Step navigation ── */
    goToStep(step, direction) {
      const dir = direction || (step > this.currentStep ? 'fwd' : 'bwd');
      const curPanel = document.getElementById(`pbw-s${this.currentStep}`);
      const nxtPanel = document.getElementById(`pbw-s${step}`);
      if (!nxtPanel) return;

      // Animate out
      const outClass = dir === 'fwd' ? 'pbw-anim-out-left' : 'pbw-anim-out-right';
      if (curPanel) {
        curPanel.classList.add(outClass);
        setTimeout(() => {
          curPanel.hidden = true;
          curPanel.classList.remove(outClass);
        }, 220);
      }

      // Animate in
      const inClass = dir === 'fwd' ? 'pbw-anim-in-right' : 'pbw-anim-in-left';
      setTimeout(() => {
        nxtPanel.hidden = false;
        nxtPanel.classList.add(inClass);
        setTimeout(() => nxtPanel.classList.remove(inClass), 300);
        if (this.content) this.content.scrollTop = 0;
      }, 140);

      this.currentStep = step;
      this._updateUI();
    }

    next() {
      if (!this._validate()) return;
      this._collect(this.currentStep);
      if (this.currentStep === this.totalSteps - 1) this._buildReview();
      if (this.currentStep < this.totalSteps) this.goToStep(this.currentStep + 1, 'fwd');
    }
    prev() {
      if (this.currentStep > 1) this.goToStep(this.currentStep - 1, 'bwd');
    }

    /* ── Validation ── */
    _validate() {
      // Clear previous errors
      this.modal.querySelectorAll('.pbw-error').forEach(el => el.remove());
      this.modal.querySelectorAll('.is-error').forEach(el => el.classList.remove('is-error'));

      const err = (msg, ...ids) => {
        ids.forEach(id => document.getElementById(id)?.classList.add('is-error'));
        this._showError(msg);
        return false;
      };

      if (this.currentStep === 1) {
        const biz  = document.getElementById('pbw-biz-name')?.value.trim();
        const name = document.getElementById('pbw-your-name')?.value.trim();
        const mail = document.getElementById('pbw-email')?.value.trim();
        const loc  = document.getElementById('pbw-location')?.value.trim();
        if (!biz)  return err('Please enter your business name.', 'pbw-biz-name');
        if (!name) return err('Please enter your name.', 'pbw-your-name');
        if (!mail) return err('Please enter your email address.', 'pbw-email');
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)) return err('Please enter a valid email address.', 'pbw-email');
        if (!loc)  return err('Please enter your business location.', 'pbw-location');
      }
      if (this.currentStep === 3) {
        const ind   = document.getElementById('pbw-industry')?.value;
        const about = document.getElementById('pbw-about')?.value.trim();
        if (!ind)   return err('Please select your business type.', 'pbw-industry');
        if (!about) return err('Please tell us about your business.', 'pbw-about');
      }
      return true;
    }

    _showError(msg) {
      const panel = document.getElementById(`pbw-s${this.currentStep}`);
      const el    = document.createElement('div');
      el.className = 'pbw-error';
      el.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg> ${this._esc(msg)}`;
      const desc = panel?.querySelector('.pbw-step-desc');
      desc?.insertAdjacentElement('afterend', el);
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    /* ── Data collection ── */
    _collect(step) {
      const v = (id) => document.getElementById(id)?.value?.trim() || '';
      switch (step) {
        case 1:
          Object.assign(this.formData, {
            businessName: v('pbw-biz-name'),
            yourName:     v('pbw-your-name'),
            email:        v('pbw-email'),
            phone:        v('pbw-phone'),
            location:     v('pbw-location'),
          });
          break;
        case 2:
          Object.assign(this.formData, {
            websiteUrl:   v('pbw-website'),
            facebookUrl:  v('pbw-facebook'),
            instagramUrl: v('pbw-instagram'),
            linkedinUrl:  v('pbw-linkedin'),
            googleBizUrl: v('pbw-google-biz'),
            otherSocial:  v('pbw-other-social'),
          });
          break;
        case 3:
          Object.assign(this.formData, {
            industry:  document.getElementById('pbw-industry')?.value || '',
            about:     v('pbw-about'),
            documents: this.docFiles.map(f => f.name),
          });
          break;
        case 4:
          Object.assign(this.formData, {
            palette:     document.querySelector('input[name="pbw-palette"]:checked')?.value || '',
            customBrand: v('pbw-custom-brand'),
            logoFileName: this.logoFile?.name || '',
          });
          break;
        case 5:
          Object.assign(this.formData, {
            recommendsProducts: document.querySelector('input[name="pbw-rec-products"]:checked')?.value || '',
            productDescription: v('pbw-product-desc'),
            productTypes: Array.from(document.querySelectorAll('input[name="pbw-prod-type"]:checked')).map(el => el.value),
          });
          break;
      }
    }

    /* ── Review builder ── */
    _buildReview() {
      // Collect all steps first
      for (let i = 1; i <= 5; i++) this._collect(i);

      const fd = this.formData;
      const sections = [
        {
          title: 'About You', step: 1,
          rows: [
            ['Business name', fd.businessName],
            ['Your name',     fd.yourName],
            ['Email',         fd.email],
            ['Phone',         fd.phone || '—'],
            ['Location',      fd.location],
          ]
        },
        {
          title: 'Online Presence', step: 2,
          rows: [
            ['Website',          fd.websiteUrl   || '—'],
            ['Facebook',         fd.facebookUrl  || '—'],
            ['Instagram',        fd.instagramUrl || '—'],
            ['LinkedIn',         fd.linkedinUrl  || '—'],
            ['Google Business',  fd.googleBizUrl || '—'],
          ].filter(r => r[1] !== '—')
        },
        {
          title: 'About Your Business', step: 3,
          rows: [
            ['Industry', INDUSTRY_LABELS[fd.industry] || fd.industry],
            ['About',    fd.about ? (fd.about.slice(0, 100) + (fd.about.length > 100 ? '…' : '')) : '—'],
            ['Files',    fd.documents?.length ? `${fd.documents.length} file(s)` : 'None'],
          ]
        },
        {
          title: 'Your Brand', step: 4,
          rows: [
            ['Colour palette', PALETTE_LABELS[fd.palette] || 'Not selected'],
            ['Logo',           fd.logoFileName || 'Not uploaded'],
            ['Preferences',    fd.customBrand || '—'],
          ]
        },
        {
          title: 'Products', step: 5,
          rows: [
            ['Recommends products', fd.recommendsProducts === 'yes' ? 'Yes' : 'No'],
            ...(fd.recommendsProducts === 'yes' && fd.productTypes?.length
              ? [['Product types', fd.productTypes.join(', ')]] : [])
          ]
        },
      ];

      const reviewEl = document.getElementById('pbw-review');
      if (!reviewEl) return;
      reviewEl.innerHTML = sections.map(s => `
        <div class="pbw-review-section">
          <div class="pbw-review-header">
            <span class="pbw-review-title">${this._esc(s.title)}</span>
            <button class="pbw-review-edit" data-edit-step="${s.step}" type="button">Edit</button>
          </div>
          <div class="pbw-review-fields">
            ${s.rows.map(r => `
              <div class="pbw-review-row">
                <span class="pbw-review-key">${this._esc(r[0])}</span>
                <span class="pbw-review-val">${this._esc(String(r[1]))}</span>
              </div>`).join('')}
          </div>
        </div>`).join('');

      reviewEl.querySelectorAll('[data-edit-step]').forEach(btn => {
        btn.addEventListener('click', () => this.goToStep(parseInt(btn.dataset.editStep), 'bwd'));
      });
    }

    /* ── UI state update ── */
    _updateUI() {
      const step = this.currentStep;
      const total = this.totalSteps;
      const pct = Math.round(((step - 1) / (total - 1)) * 100);

      if (this.progressEl) this.progressEl.style.width = `${pct}%`;
      if (this.stepNumEl)  this.stepNumEl.textContent  = step;

      // Dots
      for (let i = 1; i <= total; i++) {
        const dot  = document.getElementById(`pbw-dot-${i}`);
        const line = document.getElementById(`pbw-line-${i}`);
        if (dot) {
          dot.classList.toggle('is-active', i === step);
          dot.classList.toggle('is-done',   i < step);
        }
        if (line) line.classList.toggle('is-done', i < step);
      }

      // Back button
      if (this.btnBack) this.btnBack.hidden = step === 1;

      // Next vs Submit
      const isLast = step === total;
      if (this.btnNext)   this.btnNext.hidden   = isLast;
      if (this.btnSubmit) this.btnSubmit.hidden  = !isLast;
    }

    /* ── Submit ── */
    submit() {
      this._collect(5);
      this._collect(6);

      const data = {
        ...this.formData,
        submittedAt: new Date().toISOString(),
      };

      console.log('[Pine Beach] 🌊 New website enquiry:', data);

      this._showSuccess();
    }

    _showSuccess() {
      if (this.content) this.content.hidden = true;
      if (this.footer)  this.footer.hidden  = true;

      const successEl = document.getElementById('pbw-success');
      if (successEl) {
        successEl.hidden = false;
        const nameEl  = document.getElementById('pbw-success-name');
        const emailEl = document.getElementById('pbw-success-email');
        if (nameEl)  nameEl.textContent  = this.formData.yourName?.split(' ')[0] || 'there';
        if (emailEl) emailEl.textContent = this.formData.email || 'your inbox';
        if (this.content) {
          this.content.hidden = false;
          this.content.scrollTop = 0;
        }
      }
    }

    _resetSuccess() {
      const successEl = document.getElementById('pbw-success');
      if (successEl) successEl.hidden = true;
      if (this.content) this.content.hidden = false;
      if (this.footer)  this.footer.hidden  = false;

      // Reset to step 1
      for (let i = 1; i <= this.totalSteps; i++) {
        const panel = document.getElementById(`pbw-s${i}`);
        if (panel) panel.hidden = (i !== 1);
      }
      this.currentStep = 1;
      this.formData = {};
      this.logoFile = null;
      this.docFiles = [];
      this._updateUI();
    }

    /* ── Utility ── */
    _esc(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
    }
  }

  // Initialise wizard when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new PBWizard());
  } else {
    new PBWizard();
  }

})();
