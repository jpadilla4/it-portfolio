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

### Base de datos

- Con un archivo `.env` (ver `.env.example`) con `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`, usa la base de datos de **Turso**.
- Sin esas variables usa el archivo local `data/app.db`.

## Despliegue en Vercel

1. Importa el repositorio en Vercel (Framework: *Other*; `vercel.json` ya define la salida `public/` y la función `api/index.js`).
2. En **Settings → Environment Variables** añade `TURSO_DATABASE_URL` y `TURSO_AUTH_TOKEN`.
3. Despliega y crea enseguida la cuenta admin en `/admin/`.

### Aviso por correo de solicitudes (opcional)

Cada solicitud del formulario se guarda en el panel (**Solicitudes**). Para recibir además un correo:

1. Crea una cuenta gratuita en [Resend](https://resend.com) con el correo donde quieres recibir los avisos y genera una API key.
2. En Vercel añade la variable `RESEND_API_KEY`.
3. Opcional: `CONTACT_NOTIFY_EMAIL` (destinatario; por defecto el email de la sección Contacto) y `MAIL_FROM` (remitente; por defecto `onboarding@resend.dev`, que solo envía al correo de la cuenta de Resend).

El correo incluye los datos del formulario y, al responderlo, la respuesta va directamente al reclutador.

## Estructura

| Ruta | Contenido |
|------|-----------|
| `server/index.js` | API Express (pública, auth, admin) y archivos estáticos |
| `api/index.js`, `vercel.json` | Función y configuración de Vercel |
| `server/analytics.js` | Estadísticas de visitas anónimas (sin cookies) |
| `server/mailer.js` | Aviso por correo de solicitudes (Resend) |
| `server/auth.js` | Hash scrypt, sesiones por cookie httpOnly, CSRF por Origin, rate limit |
| `server/db.js` | libSQL: Turso en producción o `data/app.db` en local |
| `server/defaults.js` | Contenido inicial del portafolio |
| `public/index.html`, `public/js/portfolio.js` | Sitio público (se renderiza desde `/api/portfolio`) |
| `public/admin/`, `public/js/admin.js` | Panel administrativo |

## Notas

- En local, los datos y las cuentas viven en `data/` (ignorado por git). Para reiniciar todo, borra esa carpeta.
- En producción usa HTTPS y define `NODE_ENV=production` (activa la cookie `Secure`). Detrás de un proxy, define `TRUST_PROXY=1`. En Vercel ambas cosas son automáticas.
- El puerto se cambia con la variable `PORT`.
