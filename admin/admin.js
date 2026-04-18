let cmsData = null;
let isAuthenticated = false;

const byId = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', async () => {
  setupTabs();
  setupForms();
  setupAuthUi();
  await verifyAuthAndInitialize();
});

function setupAuthUi() {
  byId('login-form').addEventListener('submit', login);
  byId('logout-btn').addEventListener('click', logout);
}

async function verifyAuthAndInitialize() {
  try {
    const status = await api('/api/admin/auth-status', { method: 'GET' });
    setAuthState(Boolean(status.authenticated));
    if (status.authenticated) {
      await loadContent();
    }
  } catch (_error) {
    setAuthState(false);
  }
}

function setAuthState(authenticated) {
  isAuthenticated = authenticated;
  byId('login-view').classList.toggle('hidden', authenticated);
  byId('admin-shell').classList.toggle('hidden', !authenticated);
  byId('logout-btn').classList.toggle('hidden', !authenticated);

  const headerText = byId('admin-header-text');
  headerText.textContent = authenticated
    ? 'Edit services, products, about page, contact details, and social links.'
    : 'Login to manage services, products, about page, contact details, and social links.';

  const loginError = byId('login-error');
  loginError.classList.add('hidden');
  loginError.textContent = '';
}

async function login(event) {
  event.preventDefault();
  const form = event.target;
  const payload = {
    username: form.username.value.trim(),
    password: form.password.value
  };

  try {
    await api('/api/admin/login', { method: 'POST', body: JSON.stringify(payload) });
    form.reset();
    setAuthState(true);
    showToast('Login successful.');
    await loadContent();
  } catch (error) {
    const loginError = byId('login-error');
    loginError.textContent = error.message;
    loginError.classList.remove('hidden');
  }
}

async function logout() {
  try {
    await api('/api/admin/logout', { method: 'POST' });
  } catch (_error) {
    // Keep UX smooth even if logout request fails.
  }

  cmsData = null;
  setAuthState(false);
}

function setupTabs() {
  const buttons = document.querySelectorAll('.tab-btn');
  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('tab-btn--active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('tab-panel--active'));
      btn.classList.add('tab-btn--active');
      byId(`tab-${btn.dataset.tab}`).classList.add('tab-panel--active');
    });
  });
}

function showToast(message, ok = true) {
  const toast = byId('toast');
  toast.textContent = message;
  toast.className = `toast toast--show ${ok ? 'toast--ok' : 'toast--error'}`;
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json'
    },
    ...options
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${response.status}`);
  }

  return response.json().catch(() => ({}));
}

async function loadContent() {
  if (!isAuthenticated) return;

  try {
    cmsData = await api('/api/admin/content', { method: 'GET' });
    fillSiteForm();
    fillAboutForm();
    fillContactForm();
    renderProducts();
    renderServices();
    renderSocialLinks();
  } catch (error) {
    showToast(error.message, false);
  }
}

function fillSiteForm() {
  const form = byId('site-form');
  form.name.value = cmsData.site.name || '';
  form.tagline.value = cmsData.site.tagline || '';
  form.logo.value = cmsData.site.logo || '';
  form.whatsappPhone.value = cmsData.site.whatsappPhone || '';
}

function fillAboutForm() {
  const form = byId('about-form');
  Object.entries(cmsData.about || {}).forEach(([k, v]) => {
    if (form[k]) form[k].value = v || '';
  });
}

function fillContactForm() {
  const form = byId('contact-form');
  Object.entries(cmsData.contact || {}).forEach(([k, v]) => {
    if (form[k]) form[k].value = v || '';
  });
}

function toLines(value) {
  return Array.isArray(value) ? value.join('\n') : '';
}

function fromLines(value) {
  return String(value || '')
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean);
}

function renderProducts() {
  const host = byId('products-list');
  host.innerHTML = '';

  (cmsData.products || []).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card__top">
        <div>
          <strong>${item.title}</strong>
          <div class="item-card__meta">${item.sku} | ${item.category} | ${item.price}</div>
        </div>
        <div class="item-card__actions">
          <button class="edit-btn" data-id="${item.id}" data-type="product">Edit</button>
          <button class="delete-btn" data-id="${item.id}" data-type="product">Delete</button>
        </div>
      </div>
      <div class="item-card__meta">${(item.features || []).join(' | ')}</div>
    `;
    host.appendChild(card);
  });
}

function renderServices() {
  const host = byId('services-list');
  host.innerHTML = '';

  (cmsData.services || []).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card__top">
        <div>
          <strong>${item.title}</strong>
          <div class="item-card__meta">${item.image}</div>
        </div>
        <div class="item-card__actions">
          <button class="edit-btn" data-id="${item.id}" data-type="service">Edit</button>
          <button class="delete-btn" data-id="${item.id}" data-type="service">Delete</button>
        </div>
      </div>
      <div class="item-card__meta">${item.description}</div>
    `;
    host.appendChild(card);
  });
}

function renderSocialLinks() {
  const host = byId('social-list');
  host.innerHTML = '';

  (cmsData.socialLinks || []).forEach((item) => {
    const card = document.createElement('article');
    card.className = 'item-card';
    card.innerHTML = `
      <div class="item-card__top">
        <div>
          <strong>${item.icon} ${item.label}</strong>
          <div class="item-card__meta">${item.url}</div>
        </div>
        <div class="item-card__actions">
          <button class="edit-btn" data-id="${item.id}" data-type="social">Edit</button>
          <button class="delete-btn" data-id="${item.id}" data-type="social">Delete</button>
        </div>
      </div>
    `;
    host.appendChild(card);
  });
}

function setupForms() {
  byId('site-form').addEventListener('submit', async (event) => {
    if (!isAuthenticated) return;
    event.preventDefault();
    const form = event.target;

    const payload = {
      name: form.name.value.trim(),
      tagline: form.tagline.value.trim(),
      logo: form.logo.value.trim(),
      whatsappPhone: form.whatsappPhone.value.trim()
    };

    try {
      await api('/api/admin/site', { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Site settings updated.');
      await loadContent();
    } catch (error) {
      showToast(error.message, false);
    }
  });

  byId('about-form').addEventListener('submit', async (event) => {
    if (!isAuthenticated) return;
    event.preventDefault();
    const form = event.target;
    const payload = Object.fromEntries(new FormData(form));

    try {
      await api('/api/admin/about', { method: 'PUT', body: JSON.stringify(payload) });
      showToast('About page updated.');
      await loadContent();
    } catch (error) {
      showToast(error.message, false);
    }
  });

  byId('contact-form').addEventListener('submit', async (event) => {
    if (!isAuthenticated) return;
    event.preventDefault();
    const payload = Object.fromEntries(new FormData(event.target));

    try {
      await api('/api/admin/contact', { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Contact page updated.');
      await loadContent();
    } catch (error) {
      showToast(error.message, false);
    }
  });

  byId('product-form').addEventListener('submit', saveProduct);
  byId('service-form').addEventListener('submit', saveService);
  byId('social-form').addEventListener('submit', saveSocial);

  byId('product-reset').addEventListener('click', () => byId('product-form').reset());
  byId('service-reset').addEventListener('click', () => byId('service-form').reset());
  byId('social-reset').addEventListener('click', () => byId('social-form').reset());

  document.body.addEventListener('click', async (event) => {
    if (!isAuthenticated) return;
    const target = event.target;
    if (!(target instanceof HTMLButtonElement)) return;

    const type = target.dataset.type;
    const id = target.dataset.id;
    if (!type || !id) return;

    if (target.classList.contains('edit-btn')) {
      editItem(type, id);
      return;
    }

    if (target.classList.contains('delete-btn')) {
      if (!confirm('Delete this item?')) return;
      await deleteItem(type, id);
    }
  });

  byId('product-image-upload').addEventListener('change', async (event) => {
    const url = await uploadImage(event.target.files[0]);
    if (url) byId('product-form').image.value = url;
  });

  byId('service-image-upload').addEventListener('change', async (event) => {
    const url = await uploadImage(event.target.files[0]);
    if (url) byId('service-form').image.value = url;
  });
}

async function uploadImage(file) {
  if (!isAuthenticated) return null;
  if (!file) return null;

  try {
    const formData = new FormData();
    formData.append('image', file);

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Upload failed.');
    const data = await response.json();
    showToast('Image uploaded.');
    return data.url;
  } catch (error) {
    showToast(error.message, false);
    return null;
  }
}

async function saveProduct(event) {
  if (!isAuthenticated) return;
  event.preventDefault();
  const form = event.target;
  const payload = {
    sku: form.sku.value.trim(),
    title: form.title.value.trim(),
    category: form.category.value.trim(),
    badge: form.badge.value.trim(),
    price: form.price.value.trim(),
    image: form.image.value.trim(),
    alt: form.alt.value.trim(),
    whatsappMessage: form.whatsappMessage.value.trim(),
    features: fromLines(form.features.value)
  };

  try {
    const id = form.id.value.trim();
    if (id) {
      await api(`/api/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Product updated.');
    } else {
      await api('/api/admin/products', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Product added.');
    }
    form.reset();
    await loadContent();
  } catch (error) {
    showToast(error.message, false);
  }
}

async function saveService(event) {
  if (!isAuthenticated) return;
  event.preventDefault();
  const form = event.target;
  const payload = {
    title: form.title.value.trim(),
    description: form.description.value.trim(),
    image: form.image.value.trim(),
    alt: form.alt.value.trim()
  };

  try {
    const id = form.id.value.trim();
    if (id) {
      await api(`/api/admin/services/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Service updated.');
    } else {
      await api('/api/admin/services', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Service added.');
    }
    form.reset();
    await loadContent();
  } catch (error) {
    showToast(error.message, false);
  }
}

async function saveSocial(event) {
  if (!isAuthenticated) return;
  event.preventDefault();
  const form = event.target;
  const payload = {
    label: form.label.value.trim(),
    icon: form.icon.value.trim(),
    url: form.url.value.trim()
  };

  try {
    const id = form.id.value.trim();
    if (id) {
      await api(`/api/admin/social-links/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
      showToast('Social link updated.');
    } else {
      await api('/api/admin/social-links', { method: 'POST', body: JSON.stringify(payload) });
      showToast('Social link added.');
    }
    form.reset();
    await loadContent();
  } catch (error) {
    showToast(error.message, false);
  }
}

function editItem(type, id) {
  if (type === 'product') {
    const item = (cmsData.products || []).find((x) => x.id === id);
    if (!item) return;
    const form = byId('product-form');
    form.id.value = item.id;
    form.sku.value = item.sku || '';
    form.title.value = item.title || '';
    form.category.value = item.category || '';
    form.badge.value = item.badge || '';
    form.price.value = item.price || '';
    form.image.value = item.image || '';
    form.alt.value = item.alt || '';
    form.whatsappMessage.value = item.whatsappMessage || '';
    form.features.value = toLines(item.features);
    return;
  }

  if (type === 'service') {
    const item = (cmsData.services || []).find((x) => x.id === id);
    if (!item) return;
    const form = byId('service-form');
    form.id.value = item.id;
    form.title.value = item.title || '';
    form.description.value = item.description || '';
    form.image.value = item.image || '';
    form.alt.value = item.alt || '';
    return;
  }

  if (type === 'social') {
    const item = (cmsData.socialLinks || []).find((x) => x.id === id);
    if (!item) return;
    const form = byId('social-form');
    form.id.value = item.id;
    form.label.value = item.label || '';
    form.icon.value = item.icon || '';
    form.url.value = item.url || '';
  }
}

async function deleteItem(type, id) {
  if (!isAuthenticated) return;
  try {
    if (type === 'product') {
      await api(`/api/admin/products/${id}`, { method: 'DELETE' });
      showToast('Product deleted.');
    }

    if (type === 'service') {
      await api(`/api/admin/services/${id}`, { method: 'DELETE' });
      showToast('Service deleted.');
    }

    if (type === 'social') {
      await api(`/api/admin/social-links/${id}`, { method: 'DELETE' });
      showToast('Social link deleted.');
    }

    await loadContent();
  } catch (error) {
    showToast(error.message, false);
  }
}
