'use strict';

/**
 * Capa de base de datos.
 *
 * Usa libSQL (`@libsql/client`), compatible con SQLite:
 *  - En producción (Vercel) se conecta a Turso con `TURSO_DATABASE_URL` y
 *    `TURSO_AUTH_TOKEN`.
 *  - Sin esas variables usa el archivo local `data/app.db` (desarrollo).
 *
 * Todas las consultas son asíncronas. `ready` es una promesa que se resuelve
 * cuando el esquema existe y el contenido inicial está sembrado; el servidor
 * la espera antes de atender peticiones.
 *
 * Tablas:
 *  - users:       cuentas del panel administrativo (contraseña con hash scrypt).
 *  - sessions:    sesiones activas (se guarda el hash SHA-256 del token, nunca el token).
 *  - portfolio:   una fila por sección del portafolio con su contenido en JSON.
 *  - messages:    solicitudes de entrevista enviadas desde el formulario público.
 *  - rate_limits: contadores de intentos por IP (sirven aunque haya varias instancias).
 *  - images:      imágenes de los proyectos subidas desde el panel (ya comprimidas).
 *  - pageviews, daily_stats, analytics_salts: estadísticas de visitas (ver analytics.js).
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
const defaults = require('./defaults');

function connect() {
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL.trim(),
      authToken: process.env.TURSO_AUTH_TOKEN?.trim()
    });
  }
  // Desarrollo: archivo local en data/ (carpeta ignorada por git).
  const dataDir = path.join(__dirname, '..', 'data');
  fs.mkdirSync(dataDir, { recursive: true });
  return createClient({ url: `file:${path.join(dataDir, 'app.db')}` });
}

const client = connect();

// Creación del esquema (idempotente: no hace nada si las tablas ya existen).
const SCHEMA = [
  `CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS portfolio (
    section    TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    mode       TEXT,
    duration   TEXT,
    message    TEXT NOT NULL DEFAULT '',
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  `CREATE TABLE IF NOT EXISTS rate_limits (
    key      TEXT PRIMARY KEY,
    count    INTEGER NOT NULL,
    reset_at INTEGER NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS images (
    id         TEXT PRIMARY KEY,       -- hash del contenido (evita duplicados)
    mime       TEXT NOT NULL,
    data       BLOB NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  // Una fila por página vista (detalle de los últimos 90 días).
  `CREATE TABLE IF NOT EXISTS pageviews (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    day        TEXT NOT NULL,
    visitor    TEXT NOT NULL,
    source     TEXT NOT NULL,
    device     TEXT NOT NULL,
    lang       TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`,
  'CREATE INDEX IF NOT EXISTS pageviews_day ON pageviews (day)',
  // Totales por día que se conservan cuando el detalle se borra.
  `CREATE TABLE IF NOT EXISTS daily_stats (
    day      TEXT PRIMARY KEY,
    views    INTEGER NOT NULL,
    visitors INTEGER NOT NULL
  )`,
  // Sal aleatoria del día para el hash de visitantes (solo se guarda la de hoy).
  `CREATE TABLE IF NOT EXISTS analytics_salts (
    day  TEXT PRIMARY KEY,
    salt TEXT NOT NULL
  )`
];

/** Ejecuta una consulta y devuelve el resultado completo de libSQL. */
const run = (sql, args = []) => client.execute({ sql, args });

/** Devuelve la primera fila (o `undefined`). */
const get = async (sql, args) => (await run(sql, args)).rows[0];

/** Devuelve todas las filas. */
const all = async (sql, args) => (await run(sql, args)).rows;

/** Ejecuta varias sentencias en una sola transacción. */
const batch = (stmts) => client.batch(stmts.map(([sql, args = []]) => ({ sql, args })), 'write');

async function init() {
  await client.execute('PRAGMA foreign_keys = ON');
  await client.batch(SCHEMA, 'write');
  // Migración: bases de datos creadas antes de que existiera `messages.message`.
  const cols = (await client.execute('PRAGMA table_info(messages)')).rows.map((r) => r.name);
  if (!cols.includes('message')) {
    await client.execute("ALTER TABLE messages ADD COLUMN message TEXT NOT NULL DEFAULT ''");
  }
  // Sembrar secciones que aún no existan (no sobrescribe ediciones previas)
  // y limpiar sesiones expiradas.
  await batch([
    ...Object.entries(defaults).map(([section, value]) =>
      ['INSERT OR IGNORE INTO portfolio (section, value) VALUES (?, ?)', [section, JSON.stringify(value)]]),
    ['DELETE FROM sessions WHERE expires_at < ?', [Date.now()]]
  ]);
}

const ready = init();

module.exports = { run, get, all, batch, ready, client };
