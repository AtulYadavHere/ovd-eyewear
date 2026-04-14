/* ========================================
   OVD EYEWEAR - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initMobileMenu();
  initLanguageToggle();
  initScrollAnimations();
  initFormValidation();
  initSmoothScroll();
});

/* ========================================
   Mobile Menu
   ======================================== */
function initMobileMenu() {
  const toggle = document.querySelector('.nav__toggle');
  const mobileMenu = document.querySelector('.nav__mobile');

  if (!toggle || !mobileMenu) return;

  toggle.addEventListener('click', function() {
    mobileMenu.classList.toggle('nav__mobile--open');
    this.classList.toggle('nav__toggle--active');

    // Animate hamburger to X
    const spans = this.querySelectorAll('span');
    if (this.classList.contains('nav__toggle--active')) {
      spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
      spans[1].style.opacity = '0';
      spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
    } else {
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    }
  });

  // Close menu when clicking a link
  const mobileLinks = mobileMenu.querySelectorAll('.nav__mobile-link');
  mobileLinks.forEach(link => {
    link.addEventListener('click', function() {
      mobileMenu.classList.remove('nav__mobile--open');
      toggle.classList.remove('nav__toggle--active');
      const spans = toggle.querySelectorAll('span');
      spans[0].style.transform = '';
      spans[1].style.opacity = '';
      spans[2].style.transform = '';
    });
  });

  // Close menu on resize
  window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
      mobileMenu.classList.remove('nav__mobile--open');
      toggle.classList.remove('nav__toggle--active');
    }
  });
}

/* ========================================
   Language Toggle (Bilingual)
   ======================================== */
function initLanguageToggle() {
  const langBtns = document.querySelectorAll('.nav__lang-btn');
  const currentLangDisplay = document.querySelector('.current-lang');

  if (langBtns.length === 0) return;

  // Check saved preference
  const savedLang = localStorage.getItem('ovd-lang') || 'en';

  langBtns.forEach(btn => {
    if (btn.dataset.lang === savedLang) {
      btn.classList.add('nav__lang-btn--active');
    } else {
      btn.classList.remove('nav__lang-btn--active');
    }

    btn.addEventListener('click', function() {
      const lang = this.dataset.lang;

      // Update active state
      langBtns.forEach(b => b.classList.remove('nav__lang-btn--active'));
      this.classList.add('nav__lang-btn--active');

      // Update body class for CSS-based language switching
      if (lang === 'hi') {
        document.body.classList.add('hindi');
      } else {
        document.body.classList.remove('hindi');
      }

      // Save preference
      localStorage.setItem('ovd-lang', lang);

      // Update current language display
      if (currentLangDisplay) {
        currentLangDisplay.textContent = lang.toUpperCase();
      }
    });
  });

  // Apply saved language
  if (savedLang === 'hi') {
    document.body.classList.add('hindi');
  }
}

/* ========================================
   Scroll Animations
   ======================================== */
function initScrollAnimations() {
  const fadeElements = document.querySelectorAll('.fade-in');

  if (fadeElements.length === 0) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('fade-in--visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  fadeElements.forEach(el => observer.observe(el));
}

/* ========================================
   Form Validation
   ======================================== */
function initFormValidation() {
  const forms = document.querySelectorAll('form[data-validate]');

  forms.forEach(form => {
    form.addEventListener('submit', function(e) {
      e.preventDefault();

      let isValid = true;
      const requiredFields = form.querySelectorAll('[required]');

      requiredFields.forEach(field => {
        const value = field.value.trim();
        const fieldName = field.name || field.id;

        // Clear previous error
        field.classList.remove('form-input--error');
        const existingError = field.parentElement.querySelector('.form-error');
        if (existingError) existingError.remove();

        // Check if empty
        if (!value) {
          isValid = false;
          showFieldError(field, 'This field is required');
        }

        // Email validation
        if (field.type === 'email' && value) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            isValid = false;
            showFieldError(field, 'Please enter a valid email address');
          }
        }

        // Phone validation
        if (field.type === 'tel' && value) {
          const phoneRegex = /^[0-9]{10}$/;
          if (!phoneRegex.test(value.replace(/\s/g, ''))) {
            isValid = false;
            showFieldError(field, 'Please enter a valid 10-digit phone number');
          }
        }
      });

      if (isValid) {
        // Simulate form submission
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Sending...</span>';
        submitBtn.disabled = true;

        // Simulate API call
        setTimeout(() => {
          // Success feedback
          form.innerHTML = `
            <div style="text-align: center; padding: var(--space-xl);">
              <div style="font-size: 4rem; margin-bottom: var(--space-md);">✅</div>
              <h3 style="color: var(--primary-blue); margin-bottom: var(--space-md);">Thank You!</h3>
              <p style="color: var(--text-secondary);">Your message has been sent successfully. We'll get back to you soon.</p>
            </div>
          `;
        }, 1500);
      }
    });
  });
}

function showFieldError(field, message) {
  field.classList.add('form-input--error');
  const error = document.createElement('span');
  error.className = 'form-error';
  error.style.cssText = 'color: var(--error); font-size: 0.8125rem; margin-top: var(--space-xs); display: block;';
  error.textContent = message;
  field.parentElement.appendChild(error);
}

/* ========================================
   Smooth Scroll
   ======================================== */
function initSmoothScroll() {
  const links = document.querySelectorAll('a[href^="#"]');

  links.forEach(link => {
    link.addEventListener('click', function(e) {
      const href = this.getAttribute('href');

      if (href === '#') return;

      const target = document.querySelector(href);

      if (target) {
        e.preventDefault();
        const navHeight = document.querySelector('.nav')?.offsetHeight || 72;
        const targetPosition = target.offsetTop - navHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

/* ========================================
   WhatsApp Integration
   ======================================== */
function openWhatsApp(message = '') {
  const phone = '919479474567'; // Format: country code + number (no spaces or dashes)
  const defaultMessage = message || 'Hi! I would like to book an appointment at OVD Eyewear.';
  const encodedMessage = encodeURIComponent(defaultMessage);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
}

// Make WhatsApp function globally available
window.openWhatsApp = openWhatsApp;

/* ========================================
   Newsletter Form
   ======================================== */
function initNewsletter() {
  const newsletterForm = document.querySelector('.newsletter__form');

  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function(e) {
      e.preventDefault();

      const emailInput = this.querySelector('input[type="email"]');
      const submitBtn = this.querySelector('button');

      if (emailInput.value) {
        submitBtn.innerHTML = '<span>Subscribed!</span>';
        submitBtn.disabled = true;
        emailInput.disabled = true;

        setTimeout(() => {
          submitBtn.innerHTML = 'Subscribe';
          submitBtn.disabled = false;
          emailInput.disabled = false;
          emailInput.value = '';
        }, 3000);
      }
    });
  }
}

// Initialize newsletter on load
document.addEventListener('DOMContentLoaded', initNewsletter);

/* ========================================
   Navbar Scroll Effect
   ======================================== */
(function() {
  let lastScroll = 0;
  const nav = document.querySelector('.nav');

  if (!nav) return;

  window.addEventListener('scroll', function() {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
      nav.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.1)';
    } else {
      nav.style.boxShadow = 'none';
    }

    lastScroll = currentScroll;
  });
})();
