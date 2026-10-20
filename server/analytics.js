'use strict';

/**
 * Estadísticas de visitas del sitio público, propias y anónimas.
 *
 * Decisiones de privacidad:
 *  - Sin cookies ni almacenamiento en el navegador del visitante.
 *  - No se guarda la IP. Para contar visitantes únicos se guarda un hash de
 *    (sal del día + IP + navegador). La sal es aleatoria, cambia cada día y la
 *    del día anterior se borra, así que el hash no se puede revertir ni enlazar
 *    entre días.
 *  - El detalle de cada visita se borra a los 90 días; antes se resume en
 *    `daily_stats` (visitas y visitantes por día), que sí se conserva.
 *
 * No se cuentan los bots ni las visitas con una sesión del panel abierta.
 */

const crypto = require('crypto');
const db = require('./db');
const auth = require('./auth');

const RETENTION_DAYS = 90;
// Zona horaria con la que se agrupan las visitas por día.
const TIME_ZONE = process.env.STATS_TZ || 'America/Puerto_Rico';

// Agentes de usuario de bots, crawlers, vistas previas de enlaces y herramientas.
const BOT_RE = /bot|crawl|spider|slurp|archiver|preview|headless|lighthouse|pagespeed|monitor|uptime|curl|wget|python|java\/|go-http|axios|node-fetch|facebookexternalhit|whatsapp|telegram|discord|slack|embedly/i;

// Fuentes conocidas: se buscan en el dominio de origen o en `?ref=` / `?utm_source=`.
const SOURCES = [
  [/linkedin|lnkd/i, 'LinkedIn'],
  [/google/i, 'Google'],
  [/github/i, 'GitHub'],
  [/bing/i, 'Bing'],
  [/duckduckgo/i, 'DuckDuckGo'],
  [/yahoo/i, 'Yahoo'],
  [/indeed/i, 'Indeed'],
  [/facebook|instagram|^fb$|\.fb\./i, 'Facebook / Instagram'],
  [/twitter|^t\.co$|^x\.com$/i, 'X / Twitter'],
  [/mail|outlook/i, 'Email']
];

const dayFmt = new Intl.DateTimeFormat('en-CA', { timeZone: TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' });

/** Día actual (YYYY-MM-DD) en la zona horaria de las estadísticas. */
const today = () => dayFmt.format(new Date());

/** Suma `n` días (puede ser negativo) a un día YYYY-MM-DD. */
function addDays(day, n) {
  const d = new Date(`${day}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Devuelve la sal del día (la crea si no existe) y borra las anteriores. */
function saltFor(day) {
  const row = db.prepare('SELECT salt FROM analytics_salts WHERE day = ?').get(day);
  if (row) return row.salt;
  const salt = crypto.randomBytes(16).toString('hex');
  db.prepare('INSERT OR IGNORE INTO analytics_salts (day, salt) VALUES (?, ?)').run(day, salt);
  db.prepare('DELETE FROM analytics_salts WHERE day < ?').run(day);
  return db.prepare('SELECT salt FROM analytics_salts WHERE day = ?').get(day).salt;
}

/**
 * Nombre legible de la fuente de la visita.
 * @param {string} referrer `document.referrer` del visitante.
 * @param {string} ref Valor de `?ref=` o `?utm_source=` (tiene prioridad).
 * @param {string} host Host del propio sitio (las visitas internas cuentan como directas).
 */
function classifySource(referrer, ref, host) {
  const named = (s) => (SOURCES.find(([re]) => re.test(s)) || [])[1];
  if (ref) return named(ref) || ref.charAt(0).toUpperCase() + ref.slice(1, 40);
  let hostname;
  try { hostname = new URL(referrer).hostname.replace(/^www\./, ''); } catch { return 'Directo'; }
  if (!hostname || hostname === String(host).split(':')[0]) return 'Directo';
  return named(hostname) || hostname.slice(0, 60);
}

/** Tipo de dispositivo a partir del agente de usuario. */
function deviceOf(ua) {
  if (/iPad|Tablet|Android(?!.*Mobile)/i.test(ua)) return 'Tablet';
  if (/Mobi|iPhone|Android/i.test(ua)) return 'Móvil';
  return 'Escritorio';
}

/**
 * Registra una página vista del sitio público.
 * @returns {boolean} `true` si se contó; `false` si era un bot o el administrador.
 */
function record(req, body = {}) {
  const ua = String(req.headers['user-agent'] || '');
  if (!ua || BOT_RE.test(ua)) return false;
  if (auth.getUserFromRequest(req)) return false;

  const day = today();
  const visitor = crypto.createHash('sha256').update(`${saltFor(day)}|${req.ip}|${ua}`).digest('hex').slice(0, 32);
  const lang = ['es', 'en'].includes(body.lang) ? body.lang : 'es';
  const source = classifySource(String(body.referrer || ''), String(body.ref || '').trim(), req.headers.host);

  db.prepare('INSERT INTO pageviews (day, visitor, source, device, lang) VALUES (?, ?, ?, ?, ?)')
    .run(day, visitor, source, deviceOf(ua), lang);
  return true;
}

/** Resume en `daily_stats` y borra el detalle de más de 90 días; borra sales viejas. */
function purge() {
  const cutoff = addDays(today(), -RETENTION_DAYS);
  db.exec('BEGIN');
  try {
    db.prepare(
      `INSERT INTO daily_stats (day, views, visitors)
       SELECT day, COUNT(*), COUNT(DISTINCT visitor) FROM pageviews WHERE day < ? GROUP BY day
       ON CONFLICT(day) DO UPDATE SET views = views + excluded.views, visitors = visitors + excluded.visitors`
    ).run(cutoff);
    db.prepare('DELETE FROM pageviews WHERE day < ?').run(cutoff);
    db.prepare('DELETE FROM analytics_salts WHERE day < ?').run(today());
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/**
 * Estadísticas para el panel.
 * @param {number} days Días del periodo (7, 30 o 90).
 */
function getStats(days) {
  const end = today();
  const start = addDays(end, -(days - 1));

  const perDay = new Map(
    db.prepare('SELECT day, COUNT(*) AS views, COUNT(DISTINCT visitor) AS visitors FROM pageviews WHERE day >= ? GROUP BY day')
      .all(start).map((r) => [r.day, r])
  );
  const series = [];
  for (let d = start; d <= end; d = addDays(d, 1)) {
    const r = perDay.get(d);
    series.push({ day: d, views: r ? r.views : 0, visitors: r ? r.visitors : 0 });
  }
  const sum = (key) => series.reduce((n, r) => n + r[key], 0);

  // Desgloses: cuenta visitantes (día + hash), no recargas de página.
  const breakdown = (col) => db.prepare(
    `SELECT ${col} AS label, COUNT(DISTINCT day || visitor) AS visitors FROM pageviews
     WHERE day >= ? GROUP BY ${col} ORDER BY visitors DESC LIMIT 10`
  ).all(start);

  const archived = db.prepare('SELECT COALESCE(SUM(views), 0) AS views, COALESCE(SUM(visitors), 0) AS visitors FROM daily_stats').get();
  const live = db.prepare(
    'SELECT COUNT(*) AS views, (SELECT COALESCE(SUM(n), 0) FROM (SELECT COUNT(DISTINCT visitor) AS n FROM pageviews GROUP BY day)) AS visitors FROM pageviews'
  ).get();
  const todayRow = series[series.length - 1];

  return {
    days,
    timeZone: TIME_ZONE,
    today: { views: todayRow.views, visitors: todayRow.visitors },
    period: { views: sum('views'), visitors: sum('visitors') },
    allTime: { views: archived.views + live.views, visitors: archived.visitors + live.visitors },
    series,
    sources: breakdown('source'),
    devices: breakdown('device'),
    langs: breakdown('lang')
  };
}

// Limpieza al arrancar y cada 6 horas (sin impedir que el proceso termine).
purge();
setInterval(purge, 6 * 60 * 60 * 1000).unref();

module.exports = { record, getStats };
