const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;

const ROOT_DIR = __dirname;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const UPLOADS_DIR = path.join(ROOT_DIR, 'uploads');
const DATA_FILE = path.join(DATA_DIR, 'content.json');
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const ADMIN_SESSION_COOKIE = 'ovd_admin_session';
const ADMIN_SESSION_TOKEN = crypto.randomBytes(24).toString('hex');
const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

ensureDir(DATA_DIR);
ensureDir(UPLOADS_DIR);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

function getBaseUrl(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim();
  const protocol = forwardedProto || req.protocol || 'https';
  const host = req.get('host') || 'localhost';
  return `${protocol}://${host}`;
}

app.get('/robots.txt', (req, res) => {
  const baseUrl = getBaseUrl(req);
  res.type('text/plain');
  res.send([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin',
    'Disallow: /api/admin',
    `Sitemap: ${baseUrl}/sitemap.xml`
  ].join('\n'));
});

app.get('/sitemap.xml', (req, res) => {
  const baseUrl = getBaseUrl(req);
  const today = new Date().toISOString().split('T')[0];
  const pages = ['/', '/index.html', '/products.html', '/services.html', '/about.html', '/contact.html'];
  const urlSet = pages
    .map((url) => {
      return `\n  <url>\n    <loc>${baseUrl}${url}</loc>\n    <lastmod>${today}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${url === '/' ? '1.0' : '0.8'}</priority>\n  </url>`;
    })
    .join('');

  res.type('application/xml');
  res.send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlSet}\n</urlset>`);
});

app.use('/uploads', express.static(UPLOADS_DIR));
app.use(express.static(ROOT_DIR));

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safeBase = file.originalname
      .toLowerCase()
      .replace(/[^a-z0-9.\-_]/g, '-')
      .replace(/-+/g, '-');
    const ext = path.extname(safeBase) || '.jpg';
    const base = path.basename(safeBase, ext);
    cb(null, `${Date.now()}-${base}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024
  },
  fileFilter: (_req, file, cb) => {
    if ((file.mimetype || '').startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed.'));
  }
});

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

function readContent() {
  const raw = fs.readFileSync(DATA_FILE, 'utf-8');
  return JSON.parse(raw);
}

function writeContent(content) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(content, null, 2), 'utf-8');
}

function createId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizePhone(phone) {
  return String(phone || '').replace(/\D+/g, '');
}

function parseCookies(req) {
  const cookieHeader = req.headers.cookie || '';
  const cookies = {};

  cookieHeader.split(';').forEach((part) => {
    const [rawKey, ...rest] = part.split('=');
    const key = (rawKey || '').trim();
    if (!key) return;
    const value = rest.join('=').trim();
    cookies[key] = decodeURIComponent(value || '');
  });

  return cookies;
}

function isAdminAuthenticated(req) {
  const cookies = parseCookies(req);
  return cookies[ADMIN_SESSION_COOKIE] === ADMIN_SESSION_TOKEN;
}

function requireAdminAuth(req, res, next) {
  if (isAdminAuthenticated(req)) return next();
  return res.status(401).json({ message: 'Unauthorized. Please login.' });
}

function setAdminSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=${ADMIN_SESSION_TOKEN}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}`
  );
}

function clearAdminSessionCookie(res) {
  res.setHeader(
    'Set-Cookie',
    `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`
  );
}

app.get('/api/public/content', (_req, res) => {
  res.json(readContent());
});

app.post('/api/public/appointments', (req, res) => {
  const name = String(req.body.name || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = String(req.body.email || '').trim();
  const service = String(req.body.service || '').trim();
  const date = String(req.body.date || '').trim();
  const message = String(req.body.message || '').trim();

  if (!name || !phone) {
    return res.status(400).json({ message: 'Name and phone are required.' });
  }

  const content = readContent();
  if (!Array.isArray(content.appointments)) {
    content.appointments = [];
  }

  const appointment = {
    id: createId('appt'),
    name,
    phone,
    email,
    service,
    date,
    message,
    createdAt: new Date().toISOString()
  };

  content.appointments.unshift(appointment);
  content.appointments = content.appointments.slice(0, 500);
  writeContent(content);

  return res.status(201).json({ ok: true, appointment });
});

app.post('/api/public/prescription-upload', upload.single('prescription'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No prescription image uploaded.' });

  const baseUrl = getBaseUrl(req);
  return res.status(201).json({
    ok: true,
    filename: req.file.filename,
    url: `${baseUrl}/uploads/${req.file.filename}`
  });
});

app.post('/api/admin/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ message: 'Invalid username or password.' });
  }

  setAdminSessionCookie(res);
  return res.json({ ok: true, message: 'Login successful.' });
});

app.post('/api/admin/logout', (_req, res) => {
  clearAdminSessionCookie(res);
  return res.json({ ok: true, message: 'Logged out.' });
});

app.get('/api/admin/auth-status', (req, res) => {
  res.json({ authenticated: isAdminAuthenticated(req) });
});

app.use('/api/admin', (req, res, next) => {
  if (req.path === '/login' || req.path === '/logout' || req.path === '/auth-status') {
    return next();
  }
  return requireAdminAuth(req, res, next);
});

app.get('/api/admin/content', (_req, res) => {
  res.json(readContent());
});

app.get('/api/admin/appointments', (_req, res) => {
  const content = readContent();
  res.json(content.appointments || []);
});

app.delete('/api/admin/appointments/:id', (req, res) => {
  const content = readContent();
  const list = Array.isArray(content.appointments) ? content.appointments : [];
  const before = list.length;
  content.appointments = list.filter((a) => a.id !== req.params.id);

  if (content.appointments.length === before) {
    return res.status(404).json({ message: 'Appointment not found.' });
  }

  writeContent(content);
  return res.json({ ok: true });
});

app.put('/api/admin/content', (req, res) => {
  writeContent(req.body);
  res.json({ ok: true, message: 'Content updated.' });
});

app.put('/api/admin/site', (req, res) => {
  const content = readContent();
  content.site = { ...content.site, ...req.body };
  if (req.body.whatsappPhone) {
    content.site.whatsappPhone = normalizePhone(req.body.whatsappPhone);
  }
  writeContent(content);
  res.json({ ok: true, site: content.site });
});

app.put('/api/admin/about', (req, res) => {
  const content = readContent();
  content.about = { ...content.about, ...req.body };
  writeContent(content);
  res.json({ ok: true, about: content.about });
});

app.put('/api/admin/contact', (req, res) => {
  const content = readContent();
  content.contact = { ...content.contact, ...req.body };
  writeContent(content);
  res.json({ ok: true, contact: content.contact });
});

app.get('/api/admin/products', (_req, res) => {
  res.json(readContent().products || []);
});

app.post('/api/admin/products', (req, res) => {
  const content = readContent();
  const product = { ...req.body, id: createId('prod') };
  content.products.push(product);
  writeContent(content);
  res.status(201).json(product);
});

app.put('/api/admin/products/:id', (req, res) => {
  const content = readContent();
  const index = content.products.findIndex((p) => p.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Product not found.' });

  content.products[index] = { ...content.products[index], ...req.body, id: content.products[index].id };
  writeContent(content);
  res.json(content.products[index]);
});

app.delete('/api/admin/products/:id', (req, res) => {
  const content = readContent();
  const before = content.products.length;
  content.products = content.products.filter((p) => p.id !== req.params.id);
  if (content.products.length === before) {
    return res.status(404).json({ message: 'Product not found.' });
  }
  writeContent(content);
  res.json({ ok: true });
});

app.get('/api/admin/services', (_req, res) => {
  res.json(readContent().services || []);
});

app.post('/api/admin/services', (req, res) => {
  const content = readContent();
  const service = { ...req.body, id: createId('svc') };
  content.services.push(service);
  writeContent(content);
  res.status(201).json(service);
});

app.put('/api/admin/services/:id', (req, res) => {
  const content = readContent();
  const index = content.services.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Service not found.' });

  content.services[index] = { ...content.services[index], ...req.body, id: content.services[index].id };
  writeContent(content);
  res.json(content.services[index]);
});

app.delete('/api/admin/services/:id', (req, res) => {
  const content = readContent();
  const before = content.services.length;
  content.services = content.services.filter((s) => s.id !== req.params.id);
  if (content.services.length === before) {
    return res.status(404).json({ message: 'Service not found.' });
  }
  writeContent(content);
  res.json({ ok: true });
});

app.get('/api/admin/social-links', (_req, res) => {
  res.json(readContent().socialLinks || []);
});

app.post('/api/admin/social-links', (req, res) => {
  const content = readContent();
  const socialLink = { ...req.body, id: createId('social') };
  content.socialLinks.push(socialLink);
  writeContent(content);
  res.status(201).json(socialLink);
});

app.put('/api/admin/social-links/:id', (req, res) => {
  const content = readContent();
  const index = content.socialLinks.findIndex((s) => s.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Social link not found.' });

  content.socialLinks[index] = { ...content.socialLinks[index], ...req.body, id: content.socialLinks[index].id };
  writeContent(content);
  res.json(content.socialLinks[index]);
});

app.delete('/api/admin/social-links/:id', (req, res) => {
  const content = readContent();
  const before = content.socialLinks.length;
  content.socialLinks = content.socialLinks.filter((s) => s.id !== req.params.id);
  if (content.socialLinks.length === before) {
    return res.status(404).json({ message: 'Social link not found.' });
  }
  writeContent(content);
  res.json({ ok: true });
});

app.post('/api/admin/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No image uploaded.' });
  res.status(201).json({
    ok: true,
    filename: req.file.filename,
    url: `/uploads/${req.file.filename}`
  });
});

app.get('/admin', (_req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'admin', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`OVD CMS server running on http://localhost:${PORT}`);
  console.log(`Admin panel: http://localhost:${PORT}/admin`);
});
