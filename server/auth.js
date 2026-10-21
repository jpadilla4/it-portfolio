'use strict';

/**
 * Autenticación manual (usuario + contraseña) para el panel administrativo.
 *
 * Decisiones de seguridad:
 *  - Contraseñas con scrypt (función de derivación de claves) y sal aleatoria.
 *  - Sesiones del lado del servidor: la cookie solo contiene un token aleatorio
 *    y en la base de datos se guarda únicamente su hash SHA-256.
 *  - Cookie HttpOnly + SameSite=Strict (+ Secure en producción).
 *  - Protección CSRF básica comparando el encabezado Origin con el Host.
 *  - Límite de intentos por IP para frenar fuerza bruta (guardado en la base
 *    de datos para que funcione aunque haya varias instancias del servidor).
 */

const crypto = require('crypto');
const db = require('./db');

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días
const COOKIE_NAME = 'sid';

/* ---------- Contraseñas (scrypt, con sal aleatoria) ---------- */

/**
 * Genera el hash de una contraseña.
 * @param {string} password Contraseña en texto plano.
 * @returns {string} Cadena con formato `scrypt$<sal-hex>$<hash-hex>`.
 */
function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const hash = crypto.scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

/**
 * Verifica una contraseña contra un hash almacenado, en tiempo constante
 * (timingSafeEqual) para evitar ataques por temporización.
 * @param {string} password Contraseña ingresada.
 * @param {string} stored Hash almacenado con el formato de {@link hashPassword}.
 * @returns {boolean} `true` si coincide.
 */
function verifyPassword(password, stored) {
  const [scheme, saltHex, hashHex] = String(stored).split('$');
  if (scheme !== 'scrypt' || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, 'hex');
  const actual = crypto.scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);
  return crypto.timingSafeEqual(expected, actual);
}

/* ---------- Sesiones ---------- */

/** Calcula el hash SHA-256 (hex) de un valor. */
const sha256 = (v) => crypto.createHash('sha256').update(v).digest('hex');

/**
 * Crea una sesión nueva para un usuario.
 * @param {number} userId Id del usuario.
 * @returns {Promise<string>} Token en claro que se enviará al navegador en la cookie.
 */
async function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  await db.run('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
    [sha256(token), userId, Date.now() + SESSION_TTL_MS]);
  return token;
}

/**
 * Elimina una sesión (cierre de sesión).
 * @param {string|null} token Token de la cookie.
 */
async function destroySession(token) {
  if (token) await db.run('DELETE FROM sessions WHERE token_hash = ?', [sha256(token)]);
}

/**
 * Cierra todas las sesiones de un usuario, salvo (opcionalmente) la actual.
 * Se usa al cambiar la contraseña.
 * @param {number} userId Id del usuario.
 * @param {string} [exceptToken] Token de la sesión que debe conservarse.
 */
async function destroyUserSessions(userId, exceptToken) {
  const keep = exceptToken ? sha256(exceptToken) : '';
  await db.run('DELETE FROM sessions WHERE user_id = ? AND token_hash != ?', [userId, keep]);
}

/**
 * Convierte el encabezado `Cookie` en un objeto clave/valor.
 * @param {string} [header] Valor del encabezado Cookie.
 * @returns {Object<string,string>}
 */
function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Obtiene el token de sesión de la cookie de la petición (o `null`). */
function getToken(req) {
  return parseCookies(req.headers.cookie)[COOKIE_NAME] || null;
}

/**
 * Devuelve el usuario autenticado de la petición, o `null` si no hay sesión
 * válida. Si la sesión expiró, la elimina.
 * @returns {Promise<{id:number, username:string}|null>}
 */
async function getUserFromRequest(req) {
  const token = getToken(req);
  if (!token) return null;
  const row = await db.get(
    `SELECT u.id, u.username, s.expires_at FROM sessions s
     JOIN users u ON u.id = s.user_id WHERE s.token_hash = ?`,
    [sha256(token)]
  );
  if (!row) return null;
  if (row.expires_at < Date.now()) {
    await destroySession(token);
    return null;
  }
  return { id: row.id, username: row.username };
}

/** Envía la cookie de sesión (HttpOnly, SameSite=Strict, Secure en producción). */
function setSessionCookie(res, token) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
  );
}

/** Borra la cookie de sesión del navegador. */
function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${COOKIE_NAME}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`);
}

/* ---------- Middleware ---------- */

/**
 * Middleware: exige una sesión válida; si no, responde 401.
 * Deja el usuario en `req.user`.
 */
async function requireAuth(req, res, next) {
  try {
    const user = await getUserFromRequest(req);
    if (!user) return res.status(401).json({ error: 'No autenticado' });
    req.user = user;
    next();
  } catch (e) {
    next(e);
  }
}

/** Protección CSRF básica: el Origin (si existe) debe coincidir con el Host. */
function sameOrigin(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const origin = req.headers.origin;
  if (origin) {
    try {
      if (new URL(origin).host !== req.headers.host) {
        return res.status(403).json({ error: 'Origen no permitido' });
      }
    } catch {
      return res.status(403).json({ error: 'Origen no válido' });
    }
  }
  next();
}

/**
 * Fábrica de un limitador de intentos por IP, guardado en la base de datos.
 * @param {{name:string, windowMs:number, max:number, message:string}} opciones
 *   `name`: identifica al limitador; `windowMs`: duración de la ventana;
 *   `max`: intentos permitidos en la ventana; `message`: texto del error 429.
 * @returns {Function} Middleware de Express.
 */
function rateLimit({ name, windowMs, max, message }) {
  return async (req, res, next) => {
    try {
      const now = Date.now();
      // Suma un intento o reinicia el contador si la ventana ya terminó.
      const row = await db.get(
        `INSERT INTO rate_limits (key, count, reset_at) VALUES (?, 1, ?)
         ON CONFLICT(key) DO UPDATE SET
           count    = CASE WHEN reset_at < ? THEN 1 ELSE count + 1 END,
           reset_at = CASE WHEN reset_at < ? THEN excluded.reset_at ELSE reset_at END
         RETURNING count, reset_at`,
        [`${name}:${req.ip}`, now + windowMs, now, now]
      );
      if (row.count > max) {
        res.setHeader('Retry-After', Math.ceil((row.reset_at - now) / 1000));
        return res.status(429).json({ error: message });
      }
      next();
    } catch (e) {
      next(e);
    }
  };
}

module.exports = {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  destroyUserSessions,
  getToken,
  getUserFromRequest,
  setSessionCookie,
  clearSessionCookie,
  requireAuth,
  sameOrigin,
  rateLimit
};
