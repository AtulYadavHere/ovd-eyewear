/* ========================================
   OVD EYEWEAR - Main JavaScript
   ======================================== */

document.addEventListener('DOMContentLoaded', function() {
  // Initialize all components
  initMobileMenu();
  initLanguageToggle();
  initHomeProductRunway();
  initHeroTypingLoop();
  initScrollAnimations();
  initShopFilters();
  initFormValidation();
  initSmoothScroll();
});

/* ========================================
   Hero Typing Loop
   ======================================== */
function initHeroTypingLoop() {
  const title = document.querySelector('.hero__title');
  if (!title) return;

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const lines = Array.from(title.querySelectorAll('span'));
  if (lines.length === 0) return;

  const fullText = lines.map((line) => (line.textContent || '').trim()).filter(Boolean);
  if (fullText.length === 0) return;

  // Keep line heights stable while typing and deleting.
  lines.forEach((line, index) => {
    line.classList.add('hero__typing-line');
    line.setAttribute('data-full-text', fullText[index] || '');
    line.textContent = '';
  });

  const progress = fullText.map(() => 0);
  const lastLineIndex = lines.length - 1;

  let mode = 'typing';
  let activeLine = 0;
  let timerId;

  const schedule = (delay) => {
    timerId = window.setTimeout(step, delay);
  };

  const render = () => {
    lines.forEach((line, index) => {
      const content = fullText[index] || '';
      line.textContent = content.slice(0, progress[index]);
      line.classList.toggle('hero__typing-line--active', index === activeLine && mode !== 'holding');
    });
  };

  const step = () => {
    let nextDelay = 80;

    if (mode === 'typing') {
      progress[activeLine] = Math.min(progress[activeLine] + 1, fullText[activeLine].length);
      if (progress[activeLine] >= fullText[activeLine].length) {
        if (activeLine < lastLineIndex) {
          mode = 'linePause';
          nextDelay = 220;
        } else {
          mode = 'holding';
          nextDelay = 1400;
        }
      }
    } else if (mode === 'linePause') {
      activeLine = Math.min(activeLine + 1, lastLineIndex);
      mode = 'typing';
      nextDelay = 90;
    } else if (mode === 'holding') {
      mode = 'deleting';
      activeLine = lastLineIndex;
      nextDelay = 45;
    } else if (mode === 'deleting') {
      progress[activeLine] = Math.max(progress[activeLine] - 1, 0);
      nextDelay = 35;

      if (progress[activeLine] === 0) {
        if (activeLine > 0) {
          activeLine -= 1;
          nextDelay = 75;
        } else {
          mode = 'restartPause';
          nextDelay = 260;
        }
      }
    } else if (mode === 'restartPause') {
      mode = 'typing';
      activeLine = 0;
      nextDelay = 100;
    }

    render();
    schedule(nextDelay);
  };

  render();
  schedule(360);

  window.addEventListener('beforeunload', () => {
    window.clearTimeout(timerId);
  }, { once: true });
}

/* ========================================
   Home Product Runway
   ======================================== */
async function initHomeProductRunway() {
  const section = document.querySelector('.product-runway');
  const track = document.getElementById('home-product-runway');
  if (!track || !section) return;

  let products = [];

  if (window.__ovdCms && Array.isArray(window.__ovdCms.products)) {
    products = window.__ovdCms.products;
  } else {
    try {
      const response = await fetch('/api/public/content');
      if (response.ok) {
        const data = await response.json();
        products = Array.isArray(data.products) ? data.products : [];
      }
    } catch (_error) {
      products = [];
    }
  }

  // Fallback for file:// or when API is unavailable.
  if (products.length === 0) {
    products = buildRunwayProductsFromHomeCards();
  }

  // Final fallback so the runway never looks empty.
  if (products.length === 0) {
    products = getStaticRunwayFallbackProducts();
  }

  if (products.length === 0) {
    section.classList.add('product-runway--hidden');
    track.innerHTML = '';
    return;
  }

  section.classList.remove('product-runway--hidden');

  const randomTen = pickRandomProducts(products, 10);
  const belt = renderRunwayBelt(randomTen);

  track.innerHTML = `${belt}${belt}`;
}

function buildRunwayProductsFromHomeCards() {
  const cards = document.querySelectorAll('.products-grid .product-card');
  if (cards.length === 0) return [];

  return Array.from(cards).map((card, index) => {
    const title = card.querySelector('.product-card__title')?.textContent?.trim() || `Featured Product ${index + 1}`;
    const text = card.querySelector('.product-card__text')?.textContent?.trim() || 'Premium quality eyewear.';
    const imageHolder = card.querySelector('.product-card__image');
    const style = imageHolder?.getAttribute('style') || '';
    const match = style.match(/url\((['"]?)(.*?)\1\)/i);
    const image = match?.[2] || 'images/shop-product-cards-main-catalog-1.jpeg';

    return {
      title,
      category: inferCategoryFromTitle(title),
      price: text,
      image,
      alt: title
    };
  });
}

function getStaticRunwayFallbackProducts() {
  return [
    {
      title: 'AeroShield Polarized Sunglasses',
      sku: 'OVD-SUN-101',
      category: 'sunglasses premium',
      price: 'Rs 2,499 - Rs 3,299',
      image: 'images/shop-product-cards-main-catalog-1.jpeg',
      alt: 'AeroShield Polarized Sunglasses'
    },
    {
      title: 'SunMuse Gradient Aviators',
      sku: 'OVD-SUN-118',
      category: 'sunglasses',
      price: 'Rs 1,899 - Rs 2,499',
      image: 'images/shop-product-cards-main-catalog-2.jpeg',
      alt: 'SunMuse Gradient Aviators'
    },
    {
      title: 'ClearEdge Acetate Frame',
      sku: 'OVD-OPT-203',
      category: 'optical',
      price: 'Rs 2,199 - Rs 3,799',
      image: 'images/shop-product-cards-main-catalog-3.jpeg',
      alt: 'ClearEdge Acetate Frame'
    },
    {
      title: 'TitanLite Air Titanium',
      sku: 'OVD-OPT-245',
      category: 'optical premium',
      price: 'Rs 4,999 - Rs 7,499',
      image: 'images/shop-product-cards-main-catalog-4.jpeg',
      alt: 'TitanLite Air Titanium'
    },
    {
      title: 'ScreenGuard BlueCut Pro',
      sku: 'OVD-CMP-311',
      category: 'computer',
      price: 'Rs 1,699 - Rs 2,899',
      image: 'images/shop-product-cards-main-catalog-5.jpeg',
      alt: 'ScreenGuard BlueCut Pro'
    }
  ];
}

function inferCategoryFromTitle(title) {
  const t = String(title || '').toLowerCase();
  if (t.includes('sunglass') || t.includes('aviator')) return 'sunglasses';
  if (t.includes('computer') || t.includes('bluecut') || t.includes('desk')) return 'computer';
  return 'optical';
}

function getPrimaryFilter(category) {
  const tokens = String(category || '')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);

  const allowed = ['sunglasses', 'optical', 'computer', 'premium'];
  return tokens.find((t) => allowed.includes(t)) || 'all';
}

function buildRunwayLink(item) {
  const params = new URLSearchParams();
  const filter = getPrimaryFilter(item.category);
  params.set('filter', filter);

  if (item.sku) {
    params.set('sku', item.sku);
  } else if (item.title) {
    params.set('title', item.title);
  }

  return `products.html?${params.toString()}#shop-catalog`;
}

function pickRandomProducts(products, count) {
  const pool = [...products];

  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const picked = pool.slice(0, Math.min(count, pool.length));

  if (picked.length < count) {
    let i = 0;
    while (picked.length < count) {
      picked.push(pool[i % pool.length]);
      i += 1;
    }
  }

  return picked;
}

function renderRunwayBelt(products) {
  const cards = products.map((item) => {
    const title = escapeHtml(item.title || 'Featured Product');
    const price = escapeHtml(item.price || 'Best Price');
    const image = escapeHtml(item.image || 'images/shop-product-cards-main-catalog-1.jpeg');
    const alt = escapeHtml(item.alt || item.title || 'Product image');
    const href = escapeHtml(buildRunwayLink(item));

    return `
      <a class="product-runway__item" href="${href}" aria-label="View ${title}">
        <span class="product-runway__thumb">
          <img src="${image}" alt="${alt}" loading="lazy">
        </span>
        <span>
          <span class="product-runway__name">${title}</span>
          <span class="product-runway__price">${price}</span>
        </span>
      </a>
    `;
  }).join('');

  return `<div class="product-runway__belt">${cards}</div>`;
}

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

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
   Shop Filters
   ======================================== */
function initShopFilters() {
  const filterButtons = document.querySelectorAll('.shop-filter');
  const cards = document.querySelectorAll('.shop-card');

  if (filterButtons.length === 0 || cards.length === 0) return;

  annotateShopCards(cards);

  const applyFilter = (selectedFilter) => {
    filterButtons.forEach((btn) => {
      btn.classList.toggle('shop-filter--active', btn.dataset.filter === selectedFilter);
    });

    cards.forEach((card) => {
      const categories = card.dataset.category || '';
      const shouldShow = selectedFilter === 'all' || categories.includes(selectedFilter);
      card.classList.toggle('shop-card--hidden', !shouldShow);
    });
  };

  filterButtons.forEach(button => {
    button.addEventListener('click', function() {
      const selectedFilter = this.dataset.filter || 'all';
      applyFilter(selectedFilter);

      const url = new URL(window.location.href);
      url.searchParams.set('filter', selectedFilter);
      window.history.replaceState({}, '', url.toString());
    });
  });

  applyProductDeepLink(cards, applyFilter);
}

function annotateShopCards(cards) {
  cards.forEach((card, index) => {
    const skuText = card.querySelector('.shop-card__sku')?.textContent || '';
    const skuMatch = skuText.match(/SKU:\s*([^\s]+)/i);
    const sku = (skuMatch?.[1] || '').trim();
    const title = (card.querySelector('.shop-card__title')?.textContent || '').trim();

    if (sku) {
      card.dataset.sku = sku;
      card.id = `product-${slugify(sku)}`;
    } else if (!card.id) {
      card.id = `product-item-${index + 1}`;
    }

    if (title) {
      card.dataset.title = title.toLowerCase();
    }
  });
}

function applyProductDeepLink(cards, applyFilter) {
  const params = new URLSearchParams(window.location.search);
  const filter = (params.get('filter') || 'all').toLowerCase();
  const sku = (params.get('sku') || '').trim().toLowerCase();
  const title = (params.get('title') || '').trim().toLowerCase();

  applyFilter(filter);

  if (!sku && !title) return;

  const target = Array.from(cards).find((card) => {
    const cardSku = (card.dataset.sku || '').toLowerCase();
    const cardTitle = (card.dataset.title || '').toLowerCase();
    return (sku && cardSku === sku) || (title && cardTitle.includes(title));
  });

  if (!target) return;

  if (target.classList.contains('shop-card--hidden')) {
    target.classList.remove('shop-card--hidden');
  }

  target.classList.add('shop-card--target');
  target.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.setTimeout(() => {
    target.classList.remove('shop-card--target');
  }, 2200);
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/* ========================================
   WhatsApp Integration
   ======================================== */
function openWhatsApp(message = '') {
  const phone = window.__ovdPhone || '919479474567'; // Format: country code + number (no spaces or dashes)
  const defaultMessage = message || 'Hi! I would like to book an appointment at OVD Eyewear.';
  const encodedMessage = encodeURIComponent(defaultMessage);
  window.open(`https://wa.me/${phone}?text=${encodedMessage}`, '_blank');
}

// Make WhatsApp function globally available
window.openWhatsApp = openWhatsApp;
window.initShopFilters = initShopFilters;

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
