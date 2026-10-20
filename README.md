# Portafolio IT Support + Panel Administrativo

Portafolio profesional (estilo LinkedIn, enfocado en IT Support) basado en `screen.png` / `DESIGN.md`, con un panel para editar todas las secciones.

## Ejecutar

Requiere Node.js 22.13 o superior.

```bash
npm install
npm start
```

- Sitio público: http://localhost:3000
- Panel admin: http://localhost:3000/admin/

La primera vez, `/admin/` muestra **"Crear cuenta de administrador"**. Al crear esa cuenta, el registro se cierra. Después solo se puede iniciar sesión.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `server/index.js` | API Express (pública, auth, admin) y archivos estáticos |
| `server/auth.js` | Hash scrypt, sesiones por cookie httpOnly, CSRF por Origin, rate limit |
| `server/db.js` | SQLite (`node:sqlite`), archivo en `data/app.db` |
| `server/defaults.js` | Contenido inicial del portafolio |
| `public/index.html`, `public/js/portfolio.js` | Sitio público (se renderiza desde `/api/portfolio`) |
| `public/admin/`, `public/js/admin.js` | Panel administrativo |

## Notas

- Los datos y las cuentas viven en `data/` (ignorado por git). Para reiniciar todo, borra esa carpeta.
- En producción usa HTTPS y define `NODE_ENV=production` (activa la cookie `Secure`). Detrás de un proxy, define `TRUST_PROXY=1`.
- El puerto se cambia con la variable `PORT`.
