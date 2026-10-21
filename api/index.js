'use strict';

/**
 * Función de Vercel: atiende todas las rutas /api/* con la app Express.
 * vercel.json reescribe /api/(.*) hacia esta función; los archivos de
 * public/ los sirve Vercel directamente como estáticos.
 */
module.exports = require('../server/index');
