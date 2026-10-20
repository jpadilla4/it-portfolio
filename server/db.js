'use strict';

/**
 * Capa de base de datos.
 *
 * Usa el módulo nativo `node:sqlite` (incluido en Node 22.13+), por lo que no
 * hace falta compilar ninguna dependencia nativa. El archivo de la base de
 * datos se crea en `data/app.db` (carpeta ignorada por git).
 *
 * Tablas:
 *  - users:     cuentas del panel administrativo (contraseña con hash scrypt).
 *  - sessions:  sesiones activas (se guarda el hash SHA-256 del token, nunca el token).
 *  - portfolio: una fila por sección del portafolio con su contenido en JSON.
 *  - messages:  solicitudes de entrevista enviadas desde el formulario público.
 */

const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const defaults = require('./defaults');

// Carpeta donde vive el archivo SQLite; se crea si no existe.
const dataDir = path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

const db = new DatabaseSync(path.join(dataDir, 'app.db'));
// WAL mejora la concurrencia de lectura/escritura; foreign_keys activa los ON DELETE CASCADE.
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

// Creación del esquema (idempotente: no hace nada si las tablas ya existen).
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS portfolio (
    section    TEXT PRIMARY KEY,
    value      TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS messages (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL,
    mode       TEXT,
    duration   TEXT,
    is_read    INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// Sembrar secciones que aún no existan (no sobrescribe ediciones previas).
const seed = db.prepare('INSERT OR IGNORE INTO portfolio (section, value) VALUES (?, ?)');
for (const [section, value] of Object.entries(defaults)) {
  seed.run(section, JSON.stringify(value));
}

// Limpiar sesiones expiradas al arrancar.
db.prepare('DELETE FROM sessions WHERE expires_at < ?').run(Date.now());

module.exports = db;
