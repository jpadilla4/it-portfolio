'use strict';

/**
 * Aviso por correo de las solicitudes de entrevista, usando la API de Resend
 * (https://resend.com). Es opcional: sin `RESEND_API_KEY` no se envía nada y
 * la solicitud solo queda guardada en el panel.
 *
 * Variables de entorno:
 *  - RESEND_API_KEY:       clave de la API de Resend.
 *  - CONTACT_NOTIFY_EMAIL: destinatario (por defecto, el email de la sección Contacto).
 *  - MAIL_FROM:            remitente (por defecto el de pruebas de Resend, que solo
 *                          puede enviar al correo con el que se creó la cuenta).
 */

/** Escapa texto para insertarlo en el HTML del correo. */
const esc = (v) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Envía el aviso de una solicitud nueva.
 * @param {{name:string, email:string, mode:string, duration:string, message:string}} data Solicitud ya validada.
 * @param {string} fallbackTo Destinatario si no hay CONTACT_NOTIFY_EMAIL.
 * @param {string} [adminUrl] Enlace al panel para ver la solicitud.
 * @returns {Promise<boolean>} `true` si Resend aceptó el correo.
 */
async function sendContactEmail(data, fallbackTo, adminUrl) {
  const key = process.env.RESEND_API_KEY?.trim();
  const to = (process.env.CONTACT_NOTIFY_EMAIL || fallbackTo || '').trim();
  if (!key || !to) return false;

  const rows = [
    ['Nombre / Empresa', data.name],
    ['Email', data.email],
    ['Modalidad', data.mode || '—'],
    ['Duración', data.duration || '—']
  ];
  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;color:#0f172a">
      <h2 style="margin:0 0 12px;font-size:18px">Nueva solicitud de entrevista</h2>
      <table style="border-collapse:collapse;width:100%;font-size:14px">
        ${rows.map(([k, v]) => `<tr><td style="padding:6px 8px;color:#64748b;width:150px">${esc(k)}</td><td style="padding:6px 8px">${esc(v)}</td></tr>`).join('')}
      </table>
      <h3 style="margin:16px 0 6px;font-size:14px;color:#64748b">Sobre la empresa y la plaza</h3>
      <div style="white-space:pre-wrap;font-size:14px;line-height:1.5;background:#f1f5f9;border-radius:8px;padding:12px">${esc(data.message)}</div>
      <p style="font-size:12px;color:#64748b;margin-top:16px">Responde a este correo para contestarle directamente.${
        adminUrl ? ` También puedes verla en el <a href="${esc(adminUrl)}">panel de administración</a>.` : ''
      }</p>
    </div>`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), '', 'Sobre la empresa y la plaza:', data.message].join('\n');

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || 'Portafolio <onboarding@resend.dev>',
      to: [to],
      reply_to: data.email,
      subject: `Solicitud de entrevista: ${data.name}`.slice(0, 150),
      html,
      text
    }),
    signal: AbortSignal.timeout(8000)
  });
  if (!res.ok) {
    console.error('Resend respondió', res.status, (await res.text()).slice(0, 300));
    return false;
  }
  return true;
}

module.exports = { sendContactEmail };
