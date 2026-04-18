(function () {
  async function loadCmsContent() {
    try {
      const response = await fetch('/api/public/content');
      if (!response.ok) return;
      const content = await response.json();
      window.__ovdCms = content;
      window.__ovdPhone = normalizePhone(content?.site?.whatsappPhone || content?.contact?.phone || '');

      applyGlobalContent(content);
      applyPageContent(content);
    } catch (_error) {
      // Keep static fallback content if API is unavailable.
    }
  }

  function normalizePhone(phone) {
    return String(phone || '').replace(/\D+/g, '');
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const WHATSAPP_ICON_SVG = '<svg class="icon--whatsapp" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path fill="currentColor" d="M20.52 3.48A11.86 11.86 0 0 0 12.08 0C5.57 0 .28 5.29.28 11.8c0 2.08.55 4.13 1.59 5.94L0 24l6.46-1.69a11.77 11.77 0 0 0 5.62 1.43h.01c6.5 0 11.79-5.29 11.79-11.8 0-3.15-1.23-6.12-3.36-8.46zM12.09 21.72h-.01a9.78 9.78 0 0 1-4.98-1.36l-.36-.21-3.83 1 1.02-3.74-.23-.39a9.78 9.78 0 0 1-1.5-5.21c0-5.41 4.4-9.81 9.81-9.81 2.62 0 5.08 1.02 6.93 2.88a9.74 9.74 0 0 1 2.87 6.93c0 5.41-4.4 9.81-9.81 9.81zm5.39-7.36c-.29-.15-1.72-.85-1.99-.95-.27-.1-.46-.15-.66.15-.2.29-.76.95-.94 1.14-.17.2-.35.22-.64.08-.29-.15-1.24-.46-2.35-1.47a8.89 8.89 0 0 1-1.63-2.03c-.17-.29-.02-.45.13-.6.14-.14.29-.35.43-.52.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.52-.07-.15-.66-1.6-.9-2.19-.24-.58-.48-.5-.66-.51h-.56c-.2 0-.52.07-.79.37-.27.29-1.04 1.02-1.04 2.48s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.09 4.48.71.31 1.27.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.72-.7 1.96-1.37.24-.66.24-1.23.17-1.35-.07-.12-.27-.2-.56-.35z"/></svg>';

  function getSocialIconMarkup(item) {
    const label = String(item.label || '').toLowerCase();
    if (label.includes('whatsapp')) return WHATSAPP_ICON_SVG;
    return escapeHtml(item.icon || '🔗');
  }

  function setText(selector, value) {
    const node = document.querySelector(selector);
    if (node && value !== undefined) node.textContent = value;
  }

  function setInputValue(selector, value) {
    const node = document.querySelector(selector);
    if (node) node.value = value;
  }

  function applyGlobalContent(content) {
    const site = content.site || {};
    const contact = content.contact || {};

    if (site.logo) {
      document.querySelectorAll('.nav__logo-image, .footer__logo-image').forEach((img) => {
        img.src = site.logo;
      });
    }

    if (site.tagline) {
      document.querySelectorAll('.footer__tagline').forEach((el) => {
        el.textContent = site.tagline;
      });
    }

    if (contact.address) {
      document.querySelectorAll('.footer__contact-item').forEach((item) => {
        const icon = item.querySelector('span');
        if (!icon) return;
        if (icon.textContent.includes('📍')) {
          const parts = item.querySelectorAll('span');
          if (parts[1]) parts[1].textContent = contact.address;
        }
      });
    }

    if (contact.phone) {
      const normalized = normalizePhone(contact.phone);
      document.querySelectorAll('a[href^="tel:"]').forEach((link) => {
        link.href = `tel:+${normalized}`;
        link.textContent = contact.phone;
      });
    }

    if (contact.email) {
      document.querySelectorAll('a[href^="mailto:"]').forEach((link) => {
        link.href = `mailto:${contact.email}`;
        link.textContent = contact.email;
      });
    }

    renderSocialLinks(content.socialLinks || []);
  }

  function renderSocialLinks(items) {
    if (!Array.isArray(items) || items.length === 0) return;

    const html = items
      .map((item) => {
        const label = escapeHtml(item.label || 'Social');
        const icon = getSocialIconMarkup(item);
        const url = escapeHtml(item.url || '#');
        return `<a href="${url}" class="footer__social-link" aria-label="${label}" target="_blank" rel="noopener">${icon}</a>`;
      })
      .join('');

    document.querySelectorAll('.footer__social').forEach((holder) => {
      holder.innerHTML = html;
    });
  }

  function applyPageContent(content) {
    const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();

    if (page === 'products.html') applyProducts(content);
    if (page === 'services.html') applyServices(content);
    if (page === 'about.html') applyAbout(content);
    if (page === 'contact.html') applyContact(content);
  }

  function applyProducts(content) {
    const products = content.products || [];
    const grid = document.querySelector('.shop-grid');
    if (!grid || products.length === 0) return;

    grid.innerHTML = products
      .map((item) => {
        const features = Array.isArray(item.features) ? item.features : [];
        const listHtml = features.map((f) => `<li>${escapeHtml(f)}</li>`).join('');
        return `
          <article class="shop-card fade-in" data-category="${escapeHtml(item.category || '')}" data-sku="${escapeHtml(item.sku || '')}" data-title="${escapeHtml((item.title || '').toLowerCase())}">
            <div class="shop-card__media">
              <img src="${escapeHtml(item.image || '')}" alt="${escapeHtml(item.alt || item.title || 'Product image')}" loading="lazy">
              <span class="shop-card__badge">${escapeHtml(item.badge || 'Featured')}</span>
            </div>
            <div class="shop-card__content">
              <p class="shop-card__sku">SKU: ${escapeHtml(item.sku || '-')}</p>
              <h3 class="shop-card__title">${escapeHtml(item.title || 'Untitled Product')}</h3>
              <p class="shop-card__price">${escapeHtml(item.price || '')}</p>
              <ul class="shop-card__features">${listHtml}</ul>
              <button class="btn btn--primary btn--sm shop-card__cta" onclick="openWhatsApp('${escapeHtml(item.whatsappMessage || `Hi, I am interested in ${item.title || 'this product'}.`)}')">Order on WhatsApp</button>
            </div>
          </article>
        `;
      })
      .join('');

    const toolbar = document.querySelector('.shop-toolbar');
    if (toolbar) {
      const allCategories = new Set(['all']);
      products.forEach((p) => {
        String(p.category || '')
          .split(/\s+/)
          .filter(Boolean)
          .forEach((c) => allCategories.add(c.toLowerCase()));
      });

      toolbar.innerHTML = Array.from(allCategories)
        .map((category, index) => {
          const label = category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1);
          return `<button class="shop-filter ${index === 0 ? 'shop-filter--active' : ''}" data-filter="${escapeHtml(category)}">${escapeHtml(label)}</button>`;
        })
        .join('');
    }

    if (typeof window.initShopFilters === 'function') {
      window.initShopFilters();
    }
  }

  function applyServices(content) {
    const services = content.services || [];
    const grids = document.querySelectorAll('.services-grid');
    if (services.length === 0 || grids.length === 0) return;

    const firstGrid = grids[0];
    firstGrid.innerHTML = services
      .map((item) => {
        const image = escapeHtml(item.image || '');
        const style = `background-image: linear-gradient(135deg, rgba(0, 147, 217, 0.12) 0%, rgba(234, 69, 123, 0.12) 100%), url('${image}'); background-size: cover; background-position: center;`;
        return `
          <div class="service-card fade-in">
            <div class="service-card__icon" style="${style}"></div>
            <h3 class="service-card__title"><span class="en-content">${escapeHtml(item.title || 'Service')}</span></h3>
            <p class="service-card__text"><span class="en-content">${escapeHtml(item.description || '')}</span></p>
          </div>
        `;
      })
      .join('');
  }

  function applyAbout(content) {
    const about = content.about || {};
    setText('.page-header__title .en-content', about.pageTitle);
    setText('.page-header__text .en-content', about.pageSubtitle);

    const storyImage = document.querySelector('.section .about-grid .about__image');
    if (storyImage && about.storyImage) {
      storyImage.style.backgroundImage = `linear-gradient(135deg, rgba(0, 147, 217, 0.08) 0%, rgba(234, 69, 123, 0.08) 100%), url('${about.storyImage}')`;
      storyImage.style.backgroundSize = 'cover';
      storyImage.style.backgroundPosition = 'center';
    }

    setText('.section .about-grid .about__content h2 .en-content', about.storyTitle);

    const storyParagraphs = document.querySelectorAll('.section .about-grid .about__content .en-content .about__text');
    if (storyParagraphs[0] && about.storyParagraph1) storyParagraphs[0].textContent = about.storyParagraph1;
    if (storyParagraphs[1] && about.storyParagraph2) storyParagraphs[1].textContent = about.storyParagraph2;

    setText('.section.section--alt .cta .cta__title .en-content', about.missionTitle);
    setText('.section.section--alt .cta .cta__text .en-content', about.missionText);

    const experienceTitle = document.querySelectorAll('.section.section--alt .about-grid .about__content h2 .en-content');
    if (experienceTitle[0] && about.experienceTitle) experienceTitle[0].textContent = about.experienceTitle;

    const experienceText = document.querySelector('.section.section--alt .about-grid .about__content .about__text.en-content');
    if (experienceText && about.experienceText) experienceText.textContent = about.experienceText;

    const experienceImage = document.querySelector('.section.section--alt .about-grid .about__image.fade-in');
    if (experienceImage && about.experienceImage) {
      experienceImage.style.backgroundImage = `linear-gradient(135deg, rgba(0, 147, 217, 0.08) 0%, rgba(234, 69, 123, 0.08) 100%), url('${about.experienceImage}')`;
      experienceImage.style.backgroundSize = 'cover';
      experienceImage.style.backgroundPosition = 'center';
    }

    const ownerCard = document.querySelector('.about-grid.fade-in[style*="max-width: 800px"]');
    if (ownerCard) {
      const ownerImage = ownerCard.querySelector('.about__image');
      if (ownerImage && about.ownerImage) {
        ownerImage.style.backgroundImage = `linear-gradient(135deg, rgba(0, 147, 217, 0.08) 0%, rgba(234, 69, 123, 0.08) 100%), url('${about.ownerImage}')`;
        ownerImage.style.backgroundSize = 'cover';
        ownerImage.style.backgroundPosition = 'center';
      }
      setText('.about-grid.fade-in[style*="max-width: 800px"] h3', about.ownerName);
      setText('.about-grid.fade-in[style*="max-width: 800px"] p[style*="primary-pink"] .en-content', about.ownerRole);
      setText('.about-grid.fade-in[style*="max-width: 800px"] .about__text .en-content', about.ownerQuote);
    }
  }

  function applyContact(content) {
    const contact = content.contact || {};

    setText('.page-header__title .en-content', 'Contact Us');

    const infoItems = document.querySelectorAll('.contact-info__item');
    infoItems.forEach((item) => {
      const icon = item.querySelector('.contact-info__icon')?.textContent || '';
      if (icon.includes('📍') && contact.address) {
        const value = item.querySelector('.contact-info__value');
        if (value) value.textContent = contact.address;
      }
      if (icon.includes('📞') && contact.phone) {
        const link = item.querySelector('a');
        if (link) {
          const phone = normalizePhone(contact.phone);
          link.href = `tel:+${phone}`;
          link.textContent = contact.phone;
        }
      }
      if (icon.includes('✉️') && contact.email) {
        const link = item.querySelector('a');
        if (link) {
          link.href = `mailto:${contact.email}`;
          link.textContent = contact.email;
        }
      }
      if (icon.includes('🕐') && contact.hours) {
        const value = item.querySelector('.contact-info__value .en-content') || item.querySelector('.contact-info__value');
        if (value) value.textContent = contact.hours;
      }
      if (icon.includes('📷')) {
        const link = item.querySelector('a');
        if (link && contact.instagramUrl) {
          link.href = contact.instagramUrl;
          link.textContent = contact.instagramHandle || contact.instagramUrl;
        }
      }
    });

    if (contact.mapEmbedUrl) {
      const mapFrame = document.querySelector('.map-container iframe');
      if (mapFrame) mapFrame.src = contact.mapEmbedUrl;
    }

    const phone = normalizePhone(contact.phone || '');
    if (phone) {
      document.querySelectorAll('a.btn[href^="tel:"]').forEach((btn) => {
        btn.href = `tel:+${phone}`;
      });
    }

    setInputValue('#phone', '');
  }

  document.addEventListener('DOMContentLoaded', loadCmsContent);
})();
