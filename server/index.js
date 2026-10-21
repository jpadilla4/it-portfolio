'use strict';

/**
 * Servidor Express del portafolio.
 *
 * Responsabilidades:
 *  - API pública:         GET /api/portfolio, POST /api/contact y POST /api/track.
 *  - Autenticación:       registro (solo la primera cuenta), login, logout y cambio de contraseña.
 *  - API administrativa:  edición de secciones, bandeja de solicitudes y estadísticas.
 *  - Archivos estáticos:  sitio público (`public/`) y panel admin (`public/admin/`).
 *    En Vercel los sirve la plataforma; Express solo atiende `/api/*` (ver api/index.js).
 *
 * Ejecutado directamente (`npm start`) escucha en PORT; importado, solo exporta la app.
 *
 * Variables de entorno opcionales (también se leen de un archivo `.env`):
 *  - TURSO_DATABASE_URL, TURSO_AUTH_TOKEN: base de datos en Turso (si faltan, usa data/app.db).
 *  - PORT:        puerto de escucha (por defecto 3000).
 *  - NODE_ENV:    con `production` la cookie de sesión se marca como Secure.
 *  - TRUST_PROXY: con `1` confía en el proxy inverso para obtener la IP real (automático en Vercel).
 *  - STATS_TZ:    zona horaria de las estadísticas (por defecto America/Puerto_Rico).
 */

// Carga `.env` si existe (en Vercel las variables vienen de la plataforma).
try { process.loadEnvFile(); } catch { /* sin archivo .env */ }

const path = require('path');
const express = require('express');
const db = require('./db');
const defaults = require('./defaults');
const auth = require('./auth');
const analytics = require('./analytics');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

app.disable('x-powered-by');
app.set('trust proxy', process.env.TRUST_PROXY === '1' || !!process.env.VERCEL);

// Encabezados de seguridad básicos para todas las respuestas.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'same-origin');
  next();
});
app.use(express.json({ limit: '200kb' }));
// Espera a que el esquema de la base de datos esté listo (primera petición tras arrancar).
app.use((req, res, next) => db.ready.then(() => next(), next));
app.use('/api', auth.sameOrigin);
app.use('/api', (req, res, next) => {
  // Las respuestas de la API nunca deben cachearse.
  res.setHeader('Cache-Control', 'no-store');
  next();
});

/* ================= Utilidades ================= */

// Hash de relleno: se verifica contra él cuando el usuario no existe, para que
// el tiempo de respuesta no revele qué usuarios están registrados.
const DUMMY_HASH = auth.hashPassword('dummy-password-for-timing');
const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Envuelve un manejador asíncrono para que sus errores lleguen al manejador
 * global (Express 4 no captura promesas rechazadas).
 */
const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

/** Devuelve el tipo "lógico" de un valor distinguiendo array y null. */
const kindOf = (v) => (Array.isArray(v) ? 'array' : v === null ? 'null' : typeof v);

/**
 * Ajusta `value` a la forma de `template`: descarta claves desconocidas,
 * rellena las faltantes y fuerza los tipos primitivos.
 *
 * Soporta los textos bilingües `{ es, en }` porque son simplemente objetos
 * cuyas claves son cadenas (o listas de cadenas).
 *
 * @param {*} value Valor recibido (del cliente o de la base de datos).
 * @param {*} template Plantilla con la forma esperada (viene de `defaults.js`).
 * @param {number} [depth=0] Profundidad actual (protege contra estructuras enormes).
 * @returns {*} Valor saneado con la forma de la plantilla.
 * @throws {Error} Si la estructura no coincide con la plantilla.
 */
function conform(value, template, depth = 0) {
  if (depth > 6) throw new Error('Estructura demasiado profunda');
  const kind = kindOf(template);

  if (kind === 'string') return String(value ?? '').trim().slice(0, 5000);
  if (kind === 'number') {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  }
  if (kind === 'boolean') return value === true || value === 'true';

  if (kind === 'array') {
    if (!Array.isArray(value)) throw new Error('Se esperaba una lista');
    if (value.length > 100) throw new Error('Demasiados elementos en una lista');
    const itemTemplate = template[0];
    // Lista libre de textos (p. ej. logros o tecnologías): se normalizan a cadenas.
    if (itemTemplate === undefined) {
      return value.map((v) => String(v ?? '').trim().slice(0, 5000));
    }
    return value.map((item) => conform(item, itemTemplate, depth + 1));
  }

  if (kind === 'object') {
    if (kindOf(value) !== 'object') throw new Error('Se esperaba un objeto');
    const out = {};
    for (const key of Object.keys(template)) {
      out[key] = conform(value[key] ?? template[key], template[key], depth + 1);
    }
    return out;
  }
  return value;
}

/**
 * Lee todas las secciones del portafolio desde la base de datos.
 *
 * Cada sección se valida contra su plantilla; si el contenido guardado tiene
 * una forma antigua o está corrupto, se usa el contenido por defecto en lugar
 * de romper el sitio público.
 *
 * @returns {Promise<Object<string, *>>} Mapa `sección -> contenido`.
 */
async function getPortfolio() {
  const stored = {};
  for (const row of await db.all('SELECT section, value FROM portfolio')) {
    stored[row.section] = row.value;
  }

  const out = {};
  for (const section of Object.keys(defaults)) {
    try {
      out[section] = conform(JSON.parse(stored[section]), defaults[section]);
    } catch {
      out[section] = defaults[section];
    }
  }
  return out;
}

/**
 * Guarda (o reemplaza) el contenido de una sección.
 * @param {string} section Nombre de la sección.
 * @param {*} value Contenido ya saneado.
 */
function saveSection(section, value) {
  return db.run(
    `INSERT INTO portfolio (section, value, updated_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(section) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
    [section, JSON.stringify(value)]
  );
}

/* ================= API pública ================= */

// Contenido completo del portafolio (todas las secciones, ambos idiomas).
app.get('/api/portfolio', wrap(async (req, res) => {
  res.json(await getPortfolio());
}));

// Formulario "Solicitar entrevista" del sitio público (máx. 8 envíos/hora por IP).
app.post(
  '/api/contact',
  auth.rateLimit({ name: 'contact', windowMs: 60 * 60 * 1000, max: 8, message: 'Demasiadas solicitudes. Intenta más tarde.' }),
  wrap(async (req, res) => {
    const { name, email, mode, duration } = req.body || {};
    const clean = (v, max) => String(v ?? '').trim().slice(0, max);
    const data = {
      name: clean(name, 120),
      email: clean(email, 160),
      mode: clean(mode, 40),
      duration: clean(duration, 40)
    };
    if (!data.name) return res.status(400).json({ error: 'El nombre es obligatorio' });
    if (!EMAIL_RE.test(data.email)) return res.status(400).json({ error: 'Email no válido' });

    await db.run('INSERT INTO messages (name, email, mode, duration) VALUES (?, ?, ?, ?)',
      [data.name, data.email, data.mode, data.duration]);
    res.status(201).json({ ok: true });
  })
);

// Registro anónimo de una página vista (lo envía portfolio.js al cargar).
app.post(
  '/api/track',
  auth.rateLimit({ name: 'track', windowMs: 10 * 60 * 1000, max: 30, message: 'Demasiadas solicitudes.' }),
  wrap(async (req, res) => {
    const { referrer, ref, lang } = req.body || {};
    await analytics.record(req, {
      referrer: String(referrer ?? '').slice(0, 500),
      ref: String(ref ?? '').slice(0, 40),
      lang
    });
    res.status(204).end();
  })
);

/* ================= Autenticación ================= */

// Máx. 10 intentos cada 15 minutos por IP en las rutas sensibles.
const loginLimiter = auth.rateLimit({
  name: 'login',
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Demasiados intentos. Espera unos minutos.'
});

// Estado de la sesión: indica si ya existe alguna cuenta (para mostrar
// "Crear cuenta" o "Iniciar sesión") y el usuario actual, si lo hay.
app.get('/api/auth/status', wrap(async (req, res) => {
  const { n } = await db.get('SELECT COUNT(*) AS n FROM users');
  res.json({ hasUsers: n > 0, user: await auth.getUserFromRequest(req) });
}));

// Registro: solo permitido mientras no exista ningún usuario (primera cuenta admin).
app.post('/api/auth/register', loginLimiter, wrap(async (req, res) => {
  const { n } = await db.get('SELECT COUNT(*) AS n FROM users');
  if (n > 0) return res.status(403).json({ error: 'El registro está cerrado' });

  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!USERNAME_RE.test(username)) {
    return res.status(400).json({ error: 'Usuario: 3-32 caracteres (letras, números, . _ -)' });
  }
  if (password.length < 8 || password.length > 200) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  // Inserta solo si sigue sin haber usuarios (evita dos registros simultáneos).
  const info = await db.run(
    'INSERT INTO users (username, password_hash) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM users)',
    [username, auth.hashPassword(password)]
  );
  if (!info.rowsAffected) return res.status(403).json({ error: 'El registro está cerrado' });
  const id = Number(info.lastInsertRowid);
  auth.setSessionCookie(res, await auth.createSession(id));
  res.status(201).json({ user: { id, username } });
}));

// Inicio de sesión con usuario y contraseña.
app.post('/api/auth/login', loginLimiter, wrap(async (req, res) => {
  const username = String(req.body?.username ?? '').trim();
  const password = String(req.body?.password ?? '');
  const user = await db.get('SELECT id, username, password_hash FROM users WHERE username = ?', [username]);

  const ok = auth.verifyPassword(password, user ? user.password_hash : DUMMY_HASH);
  if (!user || !ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  auth.setSessionCookie(res, await auth.createSession(user.id));
  res.json({ user: { id: user.id, username: user.username } });
}));

// Cierre de sesión: borra la sesión del servidor y la cookie del navegador.
app.post('/api/auth/logout', wrap(async (req, res) => {
  await auth.destroySession(auth.getToken(req));
  auth.clearSessionCookie(res);
  res.json({ ok: true });
}));

// Cambio de contraseña (requiere la actual). Cierra las demás sesiones abiertas.
app.post('/api/auth/password', auth.requireAuth, loginLimiter, wrap(async (req, res) => {
  const current = String(req.body?.currentPassword ?? '');
  const next = String(req.body?.newPassword ?? '');
  const row = await db.get('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);

  if (!auth.verifyPassword(current, row.password_hash)) {
    return res.status(400).json({ error: 'La contraseña actual no es correcta' });
  }
  if (next.length < 8 || next.length > 200) {
    return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 8 caracteres' });
  }
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [auth.hashPassword(next), req.user.id]);
  await auth.destroyUserSessions(req.user.id, auth.getToken(req));
  res.json({ ok: true });
}));

/* ================= API administrativa ================= */

// Todas las rutas de este router exigen sesión iniciada.
const admin = express.Router();
admin.use(auth.requireAuth);

// Reemplaza el contenido de una sección (validado contra la plantilla de defaults).
admin.put('/portfolio/:section', wrap(async (req, res) => {
  const { section } = req.params;
  if (!Object.hasOwn(defaults, section)) return res.status(404).json({ error: 'Sección desconocida' });
  let value;
  try {
    value = conform(req.body, defaults[section]);
  } catch (e) {
    return res.status(400).json({ error: e.message });
  }
  await saveSection(section, value);
  res.json({ section, value });
}));

// Restaura una sección a su contenido original.
admin.post('/portfolio/:section/reset', wrap(async (req, res) => {
  const { section } = req.params;
  if (!Object.hasOwn(defaults, section)) return res.status(404).json({ error: 'Sección desconocida' });
  await saveSection(section, defaults[section]);
  res.json({ section, value: defaults[section] });
}));

// Bandeja de solicitudes de entrevista (las 500 más recientes).
admin.get('/messages', wrap(async (req, res) => {
  const rows = await db.all('SELECT id, name, email, mode, duration, is_read, created_at FROM messages ORDER BY id DESC LIMIT 500');
  res.json(rows.map((r) => ({ ...r })));
}));

// Marca una solicitud como leída / no leída.
admin.patch('/messages/:id', wrap(async (req, res) => {
  const read = req.body?.is_read ? 1 : 0;
  await db.run('UPDATE messages SET is_read = ? WHERE id = ?', [read, Number(req.params.id)]);
  res.json({ ok: true });
}));

// Elimina una solicitud.
admin.delete('/messages/:id', wrap(async (req, res) => {
  await db.run('DELETE FROM messages WHERE id = ?', [Number(req.params.id)]);
  res.json({ ok: true });
}));

// Estadísticas de visitas del periodo pedido (7, 30 o 90 días).
admin.get('/stats', wrap(async (req, res) => {
  const days = [7, 30, 90].includes(Number(req.query.days)) ? Number(req.query.days) : 30;
  res.json(await analytics.getStats(days));
}));

app.use('/api/admin', admin);

// Cualquier otra ruta /api/* no existente.
app.use('/api', (req, res) => res.status(404).json({ error: 'No encontrado' }));

/* ================= Archivos estáticos ================= */

// express.static redirige /admin → /admin/ y sirve public/admin/index.html
app.use(express.static(PUBLIC_DIR));

// Manejador de errores global (JSON inválido, cuerpo demasiado grande, etc.).
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'JSON no válido' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Contenido demasiado grande' });
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Portafolio:  http://localhost:${PORT}`);
    console.log(`Panel admin: http://localhost:${PORT}/admin/`);
    console.log(`Base de datos: ${process.env.TURSO_DATABASE_URL ? 'Turso' : 'archivo local data/app.db'}`);
  });
}
