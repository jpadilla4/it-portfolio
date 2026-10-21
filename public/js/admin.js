/**
 * Panel de administración: inicio de sesión / registro y editor por secciones.
 *
 * Arquitectura:
 *  - Es una pequeña SPA sin framework. `SECTIONS` describe, en forma de
 *    esquema, qué campos tiene cada sección del portafolio; el editor se
 *    genera automáticamente a partir de ese esquema (campos, listas, etc.).
 *  - Los campos con `i18n: true` son textos bilingües `{ es, en }`: el editor
 *    muestra un campo para español y otro para inglés.
 *  - Todas las operaciones se hacen contra la API REST del servidor
 *    (`/api/auth/*` y `/api/admin/*`) usando la cookie de sesión.
 */
(() => {
  'use strict';

  /** Atajo para `document.getElementById`. */
  const $ = (id) => document.getElementById(id);

  /* ---------- Helpers ---------- */

  /**
   * Crea un elemento del DOM de forma declarativa.
   * @param {string} tag Nombre de la etiqueta.
   * @param {Object} [attrs] Atributos; las claves `on*` se registran como eventos,
   *   `class` asigna la clase, `value`/`checked` asignan propiedades y los valores
   *   `false`/`null` se omiten.
   * @param {...(Node|string|Array)} children Hijos (texto, nodos o arreglos de ellos).
   * @returns {HTMLElement}
   */
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v === false || v == null) continue;
      if (k === 'class') el.className = v;
      else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c.nodeType ? c : document.createTextNode(c));
    }
    return el;
  }

  /** Crea un icono de Material Symbols. */
  const icon = (name, cls = '') => h('span', { class: `material-symbols-outlined ${cls}` }, name);

  /**
   * Llama a la API en JSON. Si la sesión expiró (401) vuelve a la pantalla de acceso.
   * @param {string} method Método HTTP.
   * @param {string} url Ruta de la API.
   * @param {*} [body] Cuerpo a enviar como JSON.
   * @returns {Promise<*>} Respuesta ya convertida desde JSON.
   * @throws {Error} Con el mensaje que devuelva el servidor.
   */
  async function api(method, url, body) {
    const res = await fetch(url, {
      method,
      headers: body !== undefined ? { 'Content-Type': 'application/json' } : {},
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && !url.startsWith('/api/auth/')) {
      showAuth();
      throw new Error('Tu sesión expiró. Inicia sesión de nuevo.');
    }
    if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
    return data;
  }

  /**
   * Muestra un aviso temporal (4 s) en la esquina inferior.
   * @param {string} message Texto del aviso.
   * @param {'ok'|'error'} [type='ok'] Tipo (color e icono).
   */
  function toast(message, type = 'ok') {
    const styles = {
      ok: 'bg-graphite-900 text-white',
      error: 'bg-red-600 text-white'
    };
    const el = h(
      'div',
      { class: `pointer-events-auto fade-up flex items-center gap-2 px-4 py-2.5 rounded-lg shadow-lg text-sm max-w-sm ${styles[type]}` },
      icon(type === 'ok' ? 'check_circle' : 'error', 'text-[18px]'),
      h('span', {}, message)
    );
    $('toasts').append(el);
    setTimeout(() => el.remove(), 4000);
  }

  /**
   * Obtiene un texto legible de un valor que puede ser simple o `{ es, en }`.
   * Se usa para los títulos de los elementos de las listas.
   */
  const pick = (v) => (typeof v === 'string' ? v : v?.es || v?.en || '');

  /** Crea un texto bilingüe vacío (o con valores iniciales). */
  const bi = (es = '', en = '') => ({ es, en });

  /* ---------- Esquema de las secciones editables ---------- */

  /** Opciones de color de los indicadores, certificaciones e idiomas: [valor, etiqueta]. */
  const KPI_TONES = [['slate', 'Neutro'], ['emerald', 'Verde'], ['brand', 'Azul']];
  const CERT_TONES = [['brand', 'Azul'], ['sky', 'Celeste'], ['emerald', 'Verde'], ['slate', 'Gris']];
  const LANG_TONES = [['emerald', 'Verde'], ['brand', 'Azul'], ['slate', 'Gris']];

  /**
   * Definición de cada sección del editor.
   *
   * Propiedades de una sección: `key` (clave en la API), `label`, `icon`,
   * `desc` y `fields`; opcionalmente `validate(datos)`, que puede devolver
   * `{ error }` (bloquea el guardado), un texto de aviso o `null`.
   *
   * Propiedades de un campo: `key`, `label`, `type` (text, textarea, number,
   * datetime, color, select, checkbox, stringlist, images, list), `i18n` (texto
   * bilingüe), `span` (ocupa 2 columnas) y `hint` (ayuda). Los campos
   * `type: 'list'` llevan además `itemFields`, `itemTitle`, `itemLabel` y
   * `newItem` (plantilla del elemento nuevo).
   */
  const SECTIONS = [
    {
      key: 'profile', label: 'Perfil', icon: 'badge',
      desc: 'Cabecera del sitio y bloque principal (hero).',
      fields: [
        { key: 'name', label: 'Nombre completo' },
        { key: 'initials', label: 'Iniciales del logo', max: 3 },
        { key: 'headerTitle', label: 'Título corto (cabecera)', i18n: true },
        { key: 'availability', label: 'Estado / ubicación (cabecera)', i18n: true },
        { key: 'badgeTier', label: 'Insignia principal (no se traduce)' },
        { key: 'badgeYears', label: 'Insignia de experiencia', i18n: true },
        { key: 'headline', label: 'Titular (H1)', i18n: true, span: true },
        { key: 'bio', label: 'Resumen del perfil', type: 'textarea', rows: 4, i18n: true, span: true },
        { key: 'workMode', label: 'Modalidad / ubicación', i18n: true },
        { key: 'educationLine', label: 'Resumen de estudios', i18n: true },
        { key: 'languagesLine', label: 'Resumen de idiomas', i18n: true, span: true },
        { key: 'ctaPrimary', label: 'Texto botón principal', i18n: true },
        { key: 'ctaSecondary', label: 'Texto botón secundario', i18n: true },
        { key: 'highlightLabel', label: 'Etiqueta de la tarjeta destacada', i18n: true },
        { key: 'highlight', label: 'Valor de la tarjeta destacada', i18n: true },
        { key: 'highlightBadge', label: 'Insignia de la tarjeta destacada', i18n: true }
      ]
    },
    {
      key: 'metrics', label: 'Cifras', icon: 'analytics',
      desc: 'Indicadores clave del resumen profesional.',
      fields: [
        { key: 'title', label: 'Título de la sección', i18n: true, span: true },
        {
          key: 'kpis', label: 'Indicadores', type: 'list', itemLabel: 'Indicador',
          itemTitle: (i) => `${pick(i.label)}${i.value ? ' · ' + i.value : ''}`,
          newItem: { label: bi('Nuevo indicador', 'New metric'), value: '0', note: bi(), icon: 'analytics', tone: 'slate', trend: false },
          itemFields: [
            { key: 'label', label: 'Etiqueta', i18n: true },
            { key: 'value', label: 'Valor (no se traduce)' },
            { key: 'note', label: 'Descripción', i18n: true, span: true },
            { key: 'icon', label: 'Icono (Material Symbols)', hint: 'Ej.: timer, verified, thumb_up, school' },
            { key: 'tone', label: 'Color', type: 'select', options: KPI_TONES },
            { key: 'trend', label: 'Mostrar flecha de tendencia ↗', type: 'checkbox', span: true }
          ]
        }
      ]
    },
    {
      key: 'skills', label: 'Competencias', icon: 'psychology',
      desc: 'Competencias clave que se muestran como tarjetas bajo las cifras.',
      fields: [
        { key: 'title', label: 'Título', i18n: true, span: true },
        { key: 'subtitle', label: 'Subtítulo', i18n: true, span: true },
        { key: 'badge', label: 'Insignia', i18n: true },
        {
          key: 'items', label: 'Competencias', type: 'list', itemLabel: 'Competencia',
          itemTitle: (i) => pick(i.label),
          newItem: { label: bi('Nueva competencia', 'New skill'), detail: bi(), color: '#2563eb' },
          itemFields: [
            { key: 'label', label: 'Nombre', i18n: true },
            { key: 'detail', label: 'Detalle', i18n: true },
            { key: 'color', label: 'Color del punto', type: 'color' }
          ]
        }
      ]
    },
    {
      key: 'experience', label: 'Experiencia', icon: 'work_history',
      desc: 'Historial laboral. El puesto marcado como actual y con fecha de inicio activa el contador en tiempo real.',
      fields: [
        { key: 'title', label: 'Título de la sección', i18n: true, span: true },
        {
          key: 'items', label: 'Puestos', type: 'list', itemLabel: 'Puesto',
          itemTitle: (i) => `${pick(i.title)}${i.company ? ' — ' + i.company : ''}`,
          newItem: {
            period: bi(), title: bi('Nuevo puesto', 'New position'), company: '', meta: bi(), current: false,
            startDate: '', description: bi(), bullets: { es: [], en: [] }, tech: []
          },
          itemFields: [
            { key: 'title', label: 'Puesto', i18n: true },
            { key: 'company', label: 'Empresa (no se traduce)' },
            { key: 'period', label: 'Periodo (texto)', i18n: true, hint: 'Ej.: 2024 — PRESENTE' },
            { key: 'meta', label: 'Lugar / modalidad', i18n: true, hint: 'Ej.: Arecibo, PR' },
            { key: 'current', label: 'Es mi puesto actual', type: 'checkbox' },
            { key: 'startDate', label: 'Fecha y hora de inicio', type: 'datetime', hint: 'Solo para el puesto actual. Sin fecha, el contador se oculta.' },
            { key: 'description', label: 'Descripción', type: 'textarea', rows: 3, i18n: true, span: true },
            { key: 'bullets', label: 'Logros (uno por línea)', type: 'stringlist', rows: 5, i18n: true, span: true, hint: 'Usa **texto** para negrita.' },
            { key: 'tech', label: 'Tecnologías (una por línea, no se traducen)', type: 'stringlist', rows: 4, span: true }
          ]
        }
      ],
      validate: (d) => {
        const cur = d.items.filter((i) => i.current);
        if (cur.length > 1) return 'Aviso: hay varios puestos actuales; el contador usará el primero con fecha.';
        if (cur.length === 1 && !cur[0].startDate) return 'Guardado. Aviso: el puesto actual no tiene fecha de inicio, por eso no se muestra el contador.';
        return null;
      }
    },
    {
      key: 'projects', label: 'Proyectos IA', icon: 'smart_toy',
      desc: 'Carrusel de proyectos hechos con inteligencia artificial: galería de imágenes, video opcional, descripción y enlaces.',
      fields: [
        { key: 'badge', label: 'Etiqueta superior', i18n: true },
        { key: 'title', label: 'Título de la sección', i18n: true },
        { key: 'subtitle', label: 'Subtítulo', i18n: true, span: true },
        {
          key: 'items', label: 'Proyectos', type: 'list', itemLabel: 'Proyecto',
          itemTitle: (i) => pick(i.title),
          newItem: {
            title: bi('Nuevo proyecto', 'New project'), description: bi(), tech: [],
            demoUrl: '', codeUrl: '', videoUrl: '', images: []
          },
          itemFields: [
            { key: 'title', label: 'Nombre del proyecto', i18n: true, span: true },
            { key: 'description', label: 'Descripción', type: 'textarea', rows: 3, i18n: true, span: true, hint: 'Usa **texto** para negrita.' },
            { key: 'images', label: 'Imágenes (galería)', type: 'images', span: true, hint: 'JPG, PNG o WebP. Se reducen a 1600 px y se comprimen automáticamente. La primera es la portada.' },
            { key: 'videoUrl', label: 'Video (YouTube o Loom, opcional)', type: 'url', span: true, hint: 'Aparece como la última diapositiva de la galería.' },
            { key: 'demoUrl', label: 'Enlace "Ver demo" (opcional)', type: 'url' },
            { key: 'codeUrl', label: 'Enlace "Código" (opcional)', type: 'url' },
            { key: 'tech', label: 'Tecnologías (una por línea, no se traducen)', type: 'stringlist', rows: 3, span: true }
          ]
        }
      ],
      validate: (d) => {
        const bad = d.items.find((i) => i.videoUrl && !/youtu\.?be|loom\.com/i.test(i.videoUrl));
        return bad ? { error: `El video de "${pick(bad.title)}" debe ser un enlace de YouTube o Loom.` } : null;
      }
    },
    {
      key: 'certifications', label: 'Certificaciones', icon: 'workspace_premium',
      desc: 'Certificaciones oficiales.',
      fields: [
        { key: 'title', label: 'Título de la sección', i18n: true, span: true },
        {
          key: 'items', label: 'Certificaciones', type: 'list', itemLabel: 'Certificación',
          itemTitle: (i) => `${pick(i.issuer)} · ${pick(i.name)}`,
          newItem: { issuer: bi(), name: bi('Nueva certificación', 'New certification'), detail: bi(), tone: 'brand' },
          itemFields: [
            { key: 'issuer', label: 'Emisor', i18n: true },
            { key: 'name', label: 'Nombre', i18n: true },
            { key: 'detail', label: 'Detalle / ID', i18n: true },
            { key: 'tone', label: 'Color del emisor', type: 'select', options: CERT_TONES }
          ]
        }
      ]
    },
    {
      key: 'education', label: 'Formación', icon: 'school',
      desc: 'Formación académica e idiomas.',
      fields: [
        { key: 'title', label: 'Título de la sección', i18n: true, span: true },
        {
          key: 'degrees', label: 'Formación académica', type: 'list', itemLabel: 'Título',
          itemTitle: (i) => pick(i.title),
          newItem: { label: bi('GRADO', 'DEGREE'), title: bi('Nuevo título', 'New degree'), detail: bi() },
          itemFields: [
            { key: 'label', label: 'Etiqueta', i18n: true, hint: 'Ej.: MAESTRÍA' },
            { key: 'title', label: 'Titulación', i18n: true },
            { key: 'detail', label: 'Institución / detalle', i18n: true, span: true }
          ]
        },
        { key: 'languagesTitle', label: 'Título del bloque de idiomas', i18n: true, span: true },
        {
          key: 'languages', label: 'Idiomas', type: 'list', itemLabel: 'Idioma',
          itemTitle: (i) => `${pick(i.name)} · ${pick(i.level)}`,
          newItem: { name: bi('Nuevo idioma', 'New language'), level: bi(), tone: 'slate' },
          itemFields: [
            { key: 'name', label: 'Idioma', i18n: true },
            { key: 'level', label: 'Nivel', i18n: true },
            { key: 'tone', label: 'Color', type: 'select', options: LANG_TONES }
          ]
        }
      ]
    },
    {
      key: 'contact', label: 'Contacto', icon: 'contact_mail',
      desc: 'Bloque de contacto y datos para reclutadores.',
      fields: [
        { key: 'badge', label: 'Insignia', i18n: true, span: true },
        { key: 'heading', label: 'Titular', type: 'textarea', rows: 2, i18n: true, span: true },
        { key: 'description', label: 'Descripción', type: 'textarea', rows: 3, i18n: true, span: true, hint: 'Usa **texto** para negrita.' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'location', label: 'Ubicación' },
        { key: 'linkedin', label: 'LinkedIn (texto visible)', hint: 'Déjalo vacío para ocultarlo.' },
        { key: 'linkedinUrl', label: 'LinkedIn (URL completa)', type: 'url' },
        { key: 'github', label: 'GitHub (texto visible)', hint: 'Déjalo vacío para ocultarlo.' },
        { key: 'githubUrl', label: 'GitHub (URL completa)', type: 'url' },
        { key: 'formTitle', label: 'Título del formulario', i18n: true, span: true },
        { key: 'successMessage', label: 'Mensaje de éxito del formulario', i18n: true, span: true }
      ]
    },
    {
      key: 'footer', label: 'Pie de página', icon: 'bottom_navigation',
      desc: 'Texto del pie del sitio.',
      fields: [
        { key: 'brand', label: 'Marca' },
        { key: 'tagline', label: 'Lema', i18n: true }
      ]
    }
  ];

  /** Pestañas que no son secciones del portafolio. */
  const EXTRA_TABS = [
    { key: 'stats', label: 'Estadísticas', icon: 'monitoring' },
    { key: 'messages', label: 'Solicitudes', icon: 'inbox' },
    { key: 'account', label: 'Cuenta', icon: 'manage_accounts' }
  ];

  /* ---------- Estado ---------- */

  /** Estado global del panel. */
  const state = {
    portfolio: null, // contenido actual de todas las secciones (copia del servidor)
    user: null,      // usuario autenticado
    active: 'profile', // pestaña activa
    draft: null,     // copia editable de la sección activa
    dirty: false,    // ¿hay cambios sin guardar?
    unread: 0,       // solicitudes sin leer (para la insignia del menú)
    statsDays: 30    // periodo de la vista de estadísticas (7, 30 o 90 días)
  };

  /* ---------- Constructores de campos ---------- */

  /** Clases comunes de los campos de formulario. */
  const inputCls =
    'w-full text-sm rounded-lg border-graphite-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white py-2 px-3';

  /**
   * Envuelve un control con su etiqueta y su ayuda.
   * @param {Object} f Definición del campo.
   * @param {HTMLElement} control Control ya construido.
   */
  function fieldWrap(f, control) {
    return h(
      'div',
      { class: f.span ? 'sm:col-span-2' : '' },
      f.type === 'checkbox' ? null : h('label', { class: 'block text-xs font-mono text-graphite-600 mb-1' }, f.label),
      control,
      f.hint ? h('p', { class: 'text-[11px] text-graphite-400 mt-1' }, f.hint) : null
    );
  }

  /**
   * Construye el control de un campo y lo enlaza con `obj[f.key]`.
   * Cada cambio actualiza el objeto y avisa mediante `changed()`.
   *
   * Para campos bilingües (`f.i18n`) se construyen dos controles (ES y EN)
   * reutilizando esta misma función sobre `obj[f.key].es` y `obj[f.key].en`.
   *
   * @param {Object} f Definición del campo.
   * @param {Object} obj Objeto que contiene el valor.
   * @param {Function} changed Callback invocado tras cada cambio.
   * @returns {HTMLElement}
   */
  function buildControl(f, obj, changed) {
    // Campo bilingüe: una fila por idioma con su etiqueta ES / EN.
    if (f.i18n) {
      if (!obj[f.key] || typeof obj[f.key] !== 'object') obj[f.key] = bi();
      const wrap = h('div', { class: 'space-y-2' });
      for (const lang of ['es', 'en']) {
        wrap.append(
          h('div', { class: 'flex items-start gap-2' },
            h('span', { class: 'mt-2 shrink-0 w-7 text-center text-[10px] font-mono font-bold rounded bg-graphite-200 text-graphite-600 py-1' }, lang.toUpperCase()),
            h('div', { class: 'flex-1 min-w-0' }, buildControl({ ...f, key: lang, i18n: false }, obj[f.key], changed)))
        );
      }
      return wrap;
    }

    const set = (v) => { obj[f.key] = v; changed(); };
    switch (f.type) {
      case 'textarea':
        return h('textarea', { class: inputCls, rows: f.rows || 3, oninput: (e) => set(e.target.value) }, obj[f.key] ?? '');
      case 'stringlist':
        // Lista de textos: un elemento por línea.
        return h(
          'textarea',
          { class: inputCls + ' font-mono text-xs leading-relaxed', rows: f.rows || 4, oninput: (e) => set(e.target.value.split('\n')) },
          (obj[f.key] || []).join('\n')
        );
      case 'number':
        return h('input', {
          class: inputCls, type: 'number', min: f.min, max: f.max, step: f.step || '1', value: obj[f.key],
          oninput: (e) => set(e.target.value === '' ? 0 : Number(e.target.value))
        });
      case 'datetime':
        return h('input', {
          class: inputCls, type: 'datetime-local', value: obj[f.key] || '',
          oninput: (e) => set(e.target.value)
        });
      case 'color':
        return h('input', {
          class: 'h-10 w-full rounded-lg border border-graphite-300 bg-white p-1 cursor-pointer', type: 'color',
          value: obj[f.key] || '#2563eb', oninput: (e) => set(e.target.value)
        });
      case 'select':
        return h(
          'select',
          { class: inputCls, onchange: (e) => set(e.target.value) },
          f.options.map(([v, l]) => h('option', { value: v, selected: obj[f.key] === v }, l))
        );
      case 'images':
        return buildImages(obj, f.key, changed);
      case 'checkbox':
        return h(
          'label',
          { class: 'flex items-center gap-2.5 text-sm text-graphite-700 cursor-pointer select-none py-2' },
          h('input', {
            type: 'checkbox', class: 'rounded border-graphite-300 text-brand-600 focus:ring-brand-500 w-4 h-4',
            checked: !!obj[f.key], onchange: (e) => set(e.target.checked)
          }),
          f.label
        );
      default:
        return h('input', {
          class: inputCls, type: f.type || 'text', maxlength: f.max, value: obj[f.key] ?? '',
          oninput: (e) => set(e.target.value)
        });
    }
  }

  /**
   * Reduce una imagen a 1600 px como máximo y la comprime en WebP (o JPEG si
   * el navegador no sabe generar WebP).
   * @param {File} file Archivo elegido por el usuario.
   * @returns {Promise<string>} Imagen como data URL.
   */
  async function compressImage(file) {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const webp = canvas.toDataURL('image/webp', 0.82);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/jpeg', 0.85);
  }

  /**
   * Editor de la galería de un proyecto: miniaturas que se pueden reordenar o
   * quitar, y un botón para subir imágenes nuevas. Guarda los ids en `obj[key]`.
   */
  function buildImages(obj, key, changed) {
    if (!Array.isArray(obj[key])) obj[key] = [];
    const wrap = h('div', { class: 'space-y-2' });
    const status = h('p', { class: 'text-xs font-mono text-graphite-500 hidden' });
    const input = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', multiple: true, class: 'hidden' });

    const render = () => {
      const list = obj[key];
      const grid = h('div', { class: 'grid grid-cols-2 sm:grid-cols-4 gap-2' },
        list.map((id, i) => {
          const move = (dir) => () => {
            const j = i + dir;
            if (j < 0 || j >= list.length) return;
            [list[i], list[j]] = [list[j], list[i]];
            changed(); render();
          };
          const btn = (name, label, onclick, extra = '') => h('button', {
            type: 'button', 'aria-label': label, title: label, onclick,
            class: `w-7 h-7 rounded-md bg-white/90 hover:bg-white text-graphite-700 flex items-center justify-center shadow-sm ${extra}`
          }, icon(name, 'text-[16px]'));
          return h('div', { class: 'relative aspect-video rounded-lg overflow-hidden border border-graphite-200 bg-graphite-100' },
            h('img', { src: `/api/images/${id}`, alt: `Imagen ${i + 1}`, class: 'w-full h-full object-cover', loading: 'lazy' }),
            i === 0 ? h('span', { class: 'absolute top-1 left-1 px-1.5 py-0.5 rounded bg-brand-600 text-white text-[10px] font-mono' }, 'PORTADA') : null,
            h('div', { class: 'absolute bottom-1 right-1 flex gap-1' },
              i > 0 ? btn('arrow_back', 'Mover a la izquierda', move(-1)) : null,
              i < list.length - 1 ? btn('arrow_forward', 'Mover a la derecha', move(1)) : null,
              btn('delete', 'Quitar imagen', () => { list.splice(i, 1); changed(); render(); }, 'hover:!bg-red-50 hover:!text-red-600')));
        }));
      const add = h('button', {
        type: 'button',
        class: 'w-full py-2 rounded-lg border-2 border-dashed border-graphite-300 text-graphite-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 text-sm font-medium flex items-center justify-center gap-1.5',
        onclick: () => input.click()
      }, icon('add_photo_alternate', 'text-[18px]'), 'Subir imágenes');
      wrap.replaceChildren(list.length ? grid : h('p', { class: 'text-xs text-graphite-400' }, 'Sin imágenes: se mostrará un icono en su lugar.'), add, status, input);
    };

    input.addEventListener('change', async () => {
      const files = [...input.files];
      input.value = '';
      status.classList.remove('hidden');
      for (const [n, file] of files.entries()) {
        status.textContent = `Subiendo ${n + 1} de ${files.length}…`;
        try {
          const { id } = await api('POST', '/api/admin/images', { data: await compressImage(file) });
          if (!obj[key].includes(id)) obj[key].push(id);
          changed(); render();
        } catch (e) {
          toast(`${file.name}: ${e.message}`, 'error');
        }
      }
      status.classList.add('hidden');
    });

    render();
    return wrap;
  }

  /**
   * Construye la cuadrícula de campos de un objeto (sección o elemento de lista).
   * @param {Object[]} fields Definiciones de los campos.
   * @param {Object} obj Objeto editado.
   * @param {Function} changed Callback invocado tras cada cambio.
   */
  function renderFields(fields, obj, changed) {
    const grid = h('div', { class: 'grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4' });
    for (const f of fields) {
      if (f.type === 'list') grid.append(h('div', { class: 'sm:col-span-2' }, buildList(f, obj, changed)));
      else grid.append(fieldWrap(f, buildControl(f, obj, changed)));
    }
    return grid;
  }

  /**
   * Construye el editor de una lista de elementos: cada elemento es un
   * desplegable con sus campos y botones para subir, bajar y eliminar; al
   * final hay un botón para agregar elementos nuevos.
   * @param {Object} f Definición del campo de tipo `list`.
   * @param {Object} obj Objeto que contiene la lista en `obj[f.key]`.
   * @param {Function} changed Callback invocado tras cada cambio.
   */
  function buildList(f, obj, changed) {
    const wrap = h('div', { class: 'space-y-3' });

    /** Vuelve a dibujar toda la lista (tras agregar, mover o eliminar). */
    const render = () => {
      wrap.replaceChildren(
        h(
          'div',
          { class: 'flex items-center justify-between' },
          h('span', { class: 'text-xs font-mono font-bold uppercase tracking-wider text-graphite-700' }, `${f.label} (${obj[f.key].length})`)
        )
      );

      obj[f.key].forEach((item, i) => {
        const titleEl = h('span', { class: 'font-medium text-sm truncate' }, f.itemTitle(item) || `${f.itemLabel} ${i + 1}`);
        /** Devuelve el manejador que mueve el elemento `dir` posiciones (-1 sube, +1 baja). */
        const move = (dir) => (e) => {
          e.preventDefault();
          const j = i + dir;
          if (j < 0 || j >= obj[f.key].length) return;
          [obj[f.key][i], obj[f.key][j]] = [obj[f.key][j], obj[f.key][i]];
          changed();
          render();
        };
        /** Botón de icono pequeño para la cabecera de cada elemento. */
        const iconBtn = (name, label, onclick, extra = '') =>
          h('button', {
            type: 'button', 'aria-label': label, title: label, onclick,
            class: `p-1 rounded-md text-graphite-500 hover:bg-graphite-200/70 hover:text-graphite-900 ${extra}`
          }, icon(name, 'text-[18px]'));

        const card = h(
          'details',
          { class: 'group rounded-xl border border-graphite-200 bg-graphite-50/60 open:bg-white open:shadow-sm', open: obj[f.key].length <= 3 },
          h(
            'summary',
            { class: 'flex items-center gap-2 px-3 py-2.5 cursor-pointer list-none select-none [&::-webkit-details-marker]:hidden' },
            icon('expand_more', 'text-graphite-400 transition-transform group-open:rotate-180 text-[20px]'),
            titleEl,
            h('span', { class: 'ml-auto flex items-center gap-0.5 shrink-0' },
              iconBtn('arrow_upward', 'Subir', move(-1)),
              iconBtn('arrow_downward', 'Bajar', move(1)),
              iconBtn('delete', 'Eliminar', (e) => {
                e.preventDefault();
                if (!confirm('¿Eliminar este elemento?')) return;
                obj[f.key].splice(i, 1);
                changed();
                render();
              }, 'hover:!bg-red-50 hover:!text-red-600')
            )
          ),
          h(
            'div',
            { class: 'px-3 pb-4 pt-3 border-t border-graphite-100' },
            // Al editar un campo se actualiza también el título del desplegable.
            renderFields(f.itemFields, item, () => {
              titleEl.textContent = f.itemTitle(item) || `${f.itemLabel} ${i + 1}`;
              changed();
            })
          )
        );
        wrap.append(card);
      });

      wrap.append(
        h(
          'button',
          {
            type: 'button',
            class: 'w-full py-2.5 rounded-xl border-2 border-dashed border-graphite-300 text-graphite-600 hover:border-brand-500 hover:text-brand-600 hover:bg-brand-50/40 text-sm font-medium flex items-center justify-center gap-1.5 transition-colors',
            onclick: () => { obj[f.key].push(structuredClone(f.newItem)); changed(); render(); }
          },
          icon('add', 'text-[18px]'), `Agregar ${f.itemLabel.toLowerCase()}`
        )
      );
    };

    render();
    return wrap;
  }

  /* ---------- Vista: editor de sección ---------- */

  /**
   * Limpia el borrador antes de guardarlo: en las listas de textos (logros,
   * tecnologías) recorta cada línea y descarta las vacías.
   * @param {*} v Valor a limpiar (se recorre recursivamente).
   * @returns {*} Copia limpia.
   */
  function cleanDraft(v) {
    if (Array.isArray(v)) {
      const arr = v.map(cleanDraft);
      return arr.every((x) => typeof x === 'string') ? arr.map((s) => s.trim()).filter(Boolean) : arr;
    }
    if (v && typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, cleanDraft(x)]));
    return v;
  }

  /**
   * Dibuja el editor de una sección del portafolio con su barra de acciones
   * (guardar, descartar y restaurar valores originales).
   * @param {Object} section Definición de la sección (de `SECTIONS`).
   */
  function renderSection(section) {
    const panel = $('panel');
    // Se trabaja sobre una copia: nada cambia en el servidor hasta pulsar Guardar.
    state.draft = structuredClone(state.portfolio[section.key]);
    state.dirty = false;

    const dot = h('span', { class: 'hidden items-center gap-1.5 text-xs font-mono text-amber-600' }, h('span', { class: 'w-2 h-2 rounded-full bg-amber-500' }), 'Cambios sin guardar');
    const saveBtn = h('button', {
      type: 'button',
      class: 'px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium shadow-sm flex items-center gap-1.5',
      disabled: true
    }, icon('save', 'text-[18px]'), 'Guardar cambios');
    const discardBtn = h('button', {
      type: 'button', disabled: true,
      class: 'px-3.5 py-2 rounded-lg border border-graphite-200 bg-white hover:bg-graphite-50 disabled:opacity-50 text-graphite-700 text-sm font-medium'
    }, 'Descartar');

    /** Marca el formulario como modificado y habilita los botones. */
    const markDirty = () => {
      state.dirty = true;
      dot.classList.remove('hidden'); dot.classList.add('inline-flex');
      saveBtn.disabled = false; discardBtn.disabled = false;
    };

    discardBtn.addEventListener('click', () => renderSection(section));

    saveBtn.addEventListener('click', async () => {
      const payload = cleanDraft(state.draft);
      const check = section.validate ? section.validate(payload) : null;
      if (check && check.error) return toast(check.error, 'error');
      saveBtn.disabled = true;
      try {
        const res = await api('PUT', `/api/admin/portfolio/${section.key}`, payload);
        state.portfolio[section.key] = res.value;
        toast(check || 'Cambios guardados');
        renderSection(section);
      } catch (e) {
        toast(e.message, 'error');
        saveBtn.disabled = false;
      }
    });

    const resetBtn = h('button', {
      type: 'button',
      class: 'text-xs font-mono text-graphite-500 hover:text-red-600 underline underline-offset-2',
      onclick: async () => {
        if (!confirm('Se restaurará el contenido original de esta sección. ¿Continuar?')) return;
        try {
          const res = await api('POST', `/api/admin/portfolio/${section.key}/reset`);
          state.portfolio[section.key] = res.value;
          toast('Sección restaurada');
          renderSection(section);
        } catch (e) { toast(e.message, 'error'); }
      }
    }, 'Restaurar valores originales');

    panel.replaceChildren(
      h('div', { class: 'fade-up' },
        h('div', { class: 'mb-5' },
          h('h1', { class: 'text-2xl font-bold tracking-tight' }, section.label),
          h('p', { class: 'text-sm text-graphite-500 mt-1' }, section.desc),
          h('p', { class: 'text-xs text-graphite-400 mt-1 font-mono' }, 'Los campos con filas ES / EN se muestran según el idioma que elija el visitante.')),
        h('div', { class: 'bg-white rounded-2xl border border-graphite-200 p-4 sm:p-6 shadow-sm' },
          renderFields(section.fields, state.draft, markDirty))),
      // Barra fija inferior con las acciones de guardado. Va fuera de `.fade-up`:
      // la animación de `transform` convertiría a ese contenedor en la referencia
      // del `position: fixed` y la barra taparía el final del formulario.
      h('div', { class: 'fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-graphite-200' },
        h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-8 py-3 flex flex-wrap items-center justify-between gap-3 lg:pl-[calc(2rem+240px+2rem)]' },
          h('div', { class: 'flex items-center gap-3' }, resetBtn, dot),
          h('div', { class: 'flex items-center gap-2' }, discardBtn, saveBtn)))
    );
  }

  /* ---------- Vista: solicitudes ---------- */

  /** Dibuja la bandeja de solicitudes de entrevista recibidas por el formulario público. */
  async function renderMessages() {
    const panel = $('panel');
    panel.replaceChildren(h('div', { class: 'skeleton h-40' }));
    let rows;
    try { rows = await api('GET', '/api/admin/messages'); }
    catch (e) { return toast(e.message, 'error'); }
    state.unread = rows.filter((r) => !r.is_read).length;
    renderNav();

    // SQLite guarda la fecha en UTC como "YYYY-MM-DD HH:MM:SS".
    const fmt = (s) => new Date(s.replace(' ', 'T') + 'Z').toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' });
    const list = h('div', { class: 'space-y-3' });

    if (!rows.length) {
      list.append(h('div', { class: 'bg-white rounded-2xl border border-dashed border-graphite-300 p-10 text-center text-sm text-graphite-500' },
        icon('inbox', 'text-4xl text-graphite-300 block mb-2'), 'Aún no hay solicitudes de entrevista.'));
    }
    for (const m of rows) {
      const card = h('article', {
        class: `bg-white rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${m.is_read ? 'border-graphite-200' : 'border-brand-300 shadow-sm'}`
      },
        h('div', { class: 'min-w-0 flex-1' },
          h('div', { class: 'flex items-center gap-2' },
            !m.is_read && h('span', { class: 'w-2 h-2 rounded-full bg-brand-600 shrink-0' }),
            h('span', { class: 'font-bold text-sm truncate' }, m.name)),
          h('a', { href: `mailto:${m.email}`, class: 'text-xs font-mono text-brand-600 hover:underline break-all' }, m.email),
          h('div', { class: 'text-xs text-graphite-500 mt-1 font-mono' }, `${m.mode || '—'} · ${m.duration || '—'} · ${fmt(m.created_at)}`)),
        h('div', { class: 'flex items-center gap-2 shrink-0' },
          h('button', {
            type: 'button',
            class: 'px-3 py-1.5 rounded-lg border border-graphite-200 hover:bg-graphite-50 text-xs font-medium text-graphite-700',
            onclick: async () => { await api('PATCH', `/api/admin/messages/${m.id}`, { is_read: !m.is_read }); renderMessages(); }
          }, m.is_read ? 'Marcar no leída' : 'Marcar leída'),
          h('button', {
            type: 'button', 'aria-label': 'Eliminar',
            class: 'p-1.5 rounded-lg text-graphite-500 hover:bg-red-50 hover:text-red-600',
            onclick: async () => {
              if (!confirm('¿Eliminar esta solicitud?')) return;
              await api('DELETE', `/api/admin/messages/${m.id}`); renderMessages();
            }
          }, icon('delete', 'text-[20px]'))));
      list.append(card);
    }

    panel.replaceChildren(h('div', { class: 'fade-up' },
      h('div', { class: 'mb-5' },
        h('h1', { class: 'text-2xl font-bold tracking-tight' }, 'Solicitudes de entrevista'),
        h('p', { class: 'text-sm text-graphite-500 mt-1' }, 'Mensajes enviados desde el formulario del sitio público.')),
      list));
  }

  /* ---------- Vista: estadísticas ---------- */

  /** Dibuja las estadísticas de visitas del sitio público. */
  async function renderStats() {
    const panel = $('panel');
    panel.replaceChildren(h('div', { class: 'skeleton h-40' }));
    let s;
    try { s = await api('GET', `/api/admin/stats?days=${state.statsDays}`); }
    catch (e) { return toast(e.message, 'error'); }
    if (state.active !== 'stats') return; // se cambió de pestaña mientras cargaba

    const num = (n) => n.toLocaleString('es-ES');
    const dayLabel = (d, opts = { day: 'numeric', month: 'short' }) =>
      new Date(`${d}T12:00:00`).toLocaleDateString('es-ES', opts);

    /** Tarjeta de resumen con visitantes y visitas. */
    const kpi = (label, data, ic) => h('div', { class: 'bg-white rounded-2xl border border-graphite-200 p-4 shadow-sm' },
      h('div', { class: 'flex items-center gap-1.5 text-xs font-mono text-graphite-500 uppercase tracking-wider' }, icon(ic, 'text-[16px]'), label),
      h('div', { class: 'text-3xl font-bold tracking-tight mt-2' }, num(data.visitors)),
      h('div', { class: 'text-xs text-graphite-500 mt-0.5' }, `visitantes · ${num(data.views)} visitas`));

    // Selector de periodo.
    const periods = h('div', { class: 'inline-flex rounded-lg border border-graphite-200 bg-white p-0.5' },
      [7, 30, 90].map((d) => h('button', {
        type: 'button',
        'aria-pressed': d === state.statsDays ? 'true' : 'false',
        class: `px-3 py-1.5 rounded-md text-xs font-medium ${d === state.statsDays ? 'bg-brand-600 text-white' : 'text-graphite-600 hover:bg-graphite-50'}`,
        onclick: () => { state.statsDays = d; renderStats(); }
      }, `${d} días`)));

    // Gráfica de barras por día: visitas (claro) con visitantes (oscuro) delante.
    const max = Math.max(1, ...s.series.map((r) => r.views));
    const bars = h('div', { class: 'flex items-end gap-px sm:gap-0.5 h-40' },
      s.series.map((r) => h('div', {
        class: 'relative flex-1 h-full group',
        title: `${dayLabel(r.day, { weekday: 'short', day: 'numeric', month: 'short' })}: ${r.visitors} visitantes · ${r.views} visitas`
      },
        h('div', { class: 'absolute bottom-0 inset-x-0 rounded-t-sm bg-brand-200 group-hover:bg-brand-300', style: `height:${(r.views / max) * 100}%` }),
        h('div', { class: 'absolute bottom-0 inset-x-0 rounded-t-sm bg-brand-600', style: `height:${(r.visitors / max) * 100}%` }))));
    const mid = s.series[Math.floor(s.series.length / 2)];
    const axis = h('div', { class: 'flex justify-between text-[11px] font-mono text-graphite-400 mt-2' },
      h('span', {}, dayLabel(s.series[0].day)), h('span', {}, dayLabel(mid.day)), h('span', {}, 'Hoy'));
    const legend = h('div', { class: 'flex items-center gap-4 text-xs text-graphite-600' },
      h('span', { class: 'flex items-center gap-1.5' }, h('span', { class: 'w-2.5 h-2.5 rounded-sm bg-brand-600' }), 'Visitantes'),
      h('span', { class: 'flex items-center gap-1.5' }, h('span', { class: 'w-2.5 h-2.5 rounded-sm bg-brand-200' }), 'Visitas'));

    /** Tarjeta con un desglose en barras horizontales y porcentajes. */
    const breakdown = (title, ic, rows) => {
      const total = rows.reduce((n, r) => n + r.visitors, 0);
      return h('div', { class: 'bg-white rounded-2xl border border-graphite-200 p-4 sm:p-5 shadow-sm' },
        h('h2', { class: 'flex items-center gap-1.5 text-xs font-mono font-bold uppercase tracking-wider text-graphite-700 mb-3' }, icon(ic, 'text-[16px]'), title),
        rows.length
          ? h('ul', { class: 'space-y-2.5' }, rows.map((r) => {
            const pct = Math.round((r.visitors / total) * 100);
            return h('li', {},
              h('div', { class: 'flex justify-between gap-2 text-sm' },
                h('span', { class: 'truncate' }, r.label),
                h('span', { class: 'font-mono text-xs text-graphite-500 shrink-0' }, `${num(r.visitors)} · ${pct}%`)),
              h('div', { class: 'h-1.5 rounded-full bg-graphite-100 mt-1 overflow-hidden' },
                h('div', { class: 'h-full rounded-full bg-brand-600', style: `width:${pct}%` })));
          }))
          : h('p', { class: 'text-sm text-graphite-400' }, 'Sin datos todavía.'));
    };
    const langName = { es: 'Español', en: 'Inglés' };

    panel.replaceChildren(h('div', { class: 'fade-up space-y-4' },
      h('div', { class: 'flex flex-wrap items-end justify-between gap-3 mb-1' },
        h('div', {},
          h('h1', { class: 'text-2xl font-bold tracking-tight' }, 'Estadísticas'),
          h('p', { class: 'text-sm text-graphite-500 mt-1' }, 'Visitas al sitio público. No se cuentan bots ni tus visitas con sesión iniciada.')),
        periods),
      h('div', { class: 'grid grid-cols-1 sm:grid-cols-3 gap-3' },
        kpi('Hoy', s.today, 'today'),
        kpi(`Últimos ${s.days} días`, s.period, 'date_range'),
        kpi('Desde el inicio', s.allTime, 'all_inclusive')),
      h('div', { class: 'bg-white rounded-2xl border border-graphite-200 p-4 sm:p-5 shadow-sm' },
        h('div', { class: 'flex flex-wrap items-center justify-between gap-2 mb-4' },
          h('h2', { class: 'text-xs font-mono font-bold uppercase tracking-wider text-graphite-700' }, 'Por día'),
          legend),
        bars, axis),
      h('div', { class: 'grid grid-cols-1 md:grid-cols-3 gap-3' },
        breakdown('De dónde vienen', 'travel_explore', s.sources),
        breakdown('Dispositivo', 'devices', s.devices),
        breakdown('Idioma', 'translate', s.langs.map((r) => ({ ...r, label: langName[r.label] || r.label })))),
      h('p', { class: 'text-[11px] text-graphite-400 leading-relaxed' },
        'Sin cookies: cada visitante se cuenta con un código anónimo que cambia cada día, así que una persona que vuelve otro día cuenta de nuevo. ',
        'El detalle se borra a los 90 días; los totales diarios se conservan. ',
        'Consejo: comparte tu enlace con ?ref=linkedin (o ?ref=resume) para saber exactamente de dónde llegan.')));
  }

  /* ---------- Vista: cuenta ---------- */

  /** Dibuja la pantalla de cuenta (cambio de contraseña). */
  function renderAccount() {
    /** Campo de contraseña con su etiqueta. */
    const mk = (id, label, ac) => h('div', {},
      h('label', { for: id, class: 'block text-xs font-mono text-graphite-600 mb-1' }, label),
      h('input', { id, type: 'password', autocomplete: ac, required: true, maxlength: 200, class: inputCls }));
    const err = h('p', { class: 'hidden text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg p-2.5', role: 'alert' });

    const form = h('form', { class: 'space-y-4 max-w-md', novalidate: true,
      onsubmit: async (e) => {
        e.preventDefault();
        err.classList.add('hidden');
        const cur = $('pw-cur').value, nw = $('pw-new').value, cf = $('pw-conf').value;
        const fail = (m) => { err.textContent = m; err.classList.remove('hidden'); };
        if (nw.length < 8) return fail('La nueva contraseña debe tener al menos 8 caracteres.');
        if (nw !== cf) return fail('Las contraseñas nuevas no coinciden.');
        try {
          await api('POST', '/api/auth/password', { currentPassword: cur, newPassword: nw });
          form.reset();
          toast('Contraseña actualizada');
        } catch (ex) { fail(ex.message); }
      } },
      mk('pw-cur', 'Contraseña actual', 'current-password'),
      mk('pw-new', 'Nueva contraseña', 'new-password'),
      mk('pw-conf', 'Confirmar nueva contraseña', 'new-password'),
      err,
      h('button', { type: 'submit', class: 'px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium shadow-sm' }, 'Cambiar contraseña'));

    $('panel').replaceChildren(h('div', { class: 'fade-up' },
      h('div', { class: 'mb-5' },
        h('h1', { class: 'text-2xl font-bold tracking-tight' }, 'Cuenta'),
        h('p', { class: 'text-sm text-graphite-500 mt-1' }, `Sesión iniciada como ${state.user.username}.`)),
      h('div', { class: 'bg-white rounded-2xl border border-graphite-200 p-4 sm:p-6 shadow-sm' },
        h('h2', { class: 'text-xs font-mono font-bold uppercase tracking-wider text-graphite-700 mb-4' }, 'Cambiar contraseña'),
        form,
        h('p', { class: 'text-[11px] text-graphite-400 mt-4' }, 'Al cambiarla se cerrarán las demás sesiones abiertas.'))));
  }

  /* ---------- Navegación ---------- */

  /** Dibuja el menú de secciones (lateral en escritorio, horizontal en móvil). */
  function renderNav() {
    const nav = $('section-nav');
    /** Botón de una pestaña; la activa se resalta y "Solicitudes" muestra su contador. */
    const btn = (tab) => {
      const active = state.active === tab.key;
      return h('button', {
        type: 'button',
        'aria-current': active ? 'page' : false,
        class: `shrink-0 flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors text-left ${
          active ? 'bg-brand-600 text-white shadow-sm' : 'text-graphite-700 hover:bg-graphite-100 bg-white lg:bg-transparent border border-graphite-200 lg:border-transparent'
        }`,
        onclick: () => switchTab(tab.key)
      },
        icon(tab.icon, 'text-[18px]'), tab.label,
        tab.key === 'messages' && state.unread > 0
          ? h('span', { class: `ml-auto text-[10px] font-mono px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25' : 'bg-brand-600 text-white'}` }, state.unread)
          : null);
    };
    nav.replaceChildren(
      ...SECTIONS.map(btn),
      h('div', { class: 'hidden lg:block h-px bg-graphite-200 my-2' }),
      ...EXTRA_TABS.map(btn)
    );
  }

  /**
   * Cambia de pestaña, pidiendo confirmación si hay cambios sin guardar.
   * @param {string} key Clave de la pestaña destino.
   */
  function switchTab(key) {
    if (key === state.active && !state.dirty) return;
    if (state.dirty && !confirm('Tienes cambios sin guardar. ¿Descartarlos?')) return;
    state.dirty = false;
    state.active = key;
    renderNav();
    renderPanel();
    window.scrollTo({ top: 0 });
  }

  /** Dibuja el contenido de la pestaña activa. */
  function renderPanel() {
    const section = SECTIONS.find((s) => s.key === state.active);
    if (section) renderSection(section);
    else if (state.active === 'stats') renderStats();
    else if (state.active === 'messages') renderMessages();
    else renderAccount();
  }

  /* ---------- Autenticación ---------- */

  /** Modo de la pantalla de acceso: 'login' o 'register' (primera cuenta). */
  let authMode = 'login';

  /** Muestra la pantalla de acceso y oculta el panel. */
  function showAuth() {
    $('app-view').classList.add('hidden');
    $('auth-view').classList.remove('hidden');
    $('auth-view').classList.add('flex');
    document.title = 'Acceso | Panel de administración';
  }

  /**
   * Cambia la pantalla de acceso entre iniciar sesión y crear la primera cuenta.
   * @param {'login'|'register'} mode Modo deseado.
   */
  function setAuthMode(mode) {
    authMode = mode;
    const reg = mode === 'register';
    $('auth-title').textContent = reg ? 'Crear cuenta de administrador' : 'Iniciar sesión';
    $('auth-sub').textContent = reg
      ? 'Aún no existe ninguna cuenta. La primera será la administradora y el registro se cerrará después.'
      : 'Accede para editar el contenido de tu portafolio.';
    $('auth-submit').textContent = reg ? 'Crear cuenta y entrar' : 'Entrar';
    $('auth-confirm-wrap').classList.toggle('hidden', !reg);
    $('auth-hint').classList.toggle('hidden', !reg);
    $('auth-pass').autocomplete = reg ? 'new-password' : 'current-password';
  }

  /** Muestra (o limpia, si no hay texto) el mensaje de error del formulario de acceso. */
  function authError(msg) {
    const box = $('auth-error');
    box.classList.toggle('hidden', !msg);
    box.classList.toggle('flex', !!msg);
    box.lastElementChild.textContent = msg || '';
  }

  /**
   * Entra al panel: oculta el acceso, descarga el contenido y dibuja la
   * primera pestaña.
   * @param {{id:number, username:string}} user Usuario autenticado.
   */
  async function enterApp(user) {
    state.user = user;
    $('auth-view').classList.add('hidden');
    $('auth-view').classList.remove('flex');
    $('app-view').classList.remove('hidden');
    $('user-chip').lastElementChild.textContent = user.username;
    document.title = 'Panel de administración | Portafolio IT';

    try {
      state.portfolio = await (await fetch('/api/portfolio')).json();
      const msgs = await api('GET', '/api/admin/messages');
      state.unread = msgs.filter((m) => !m.is_read).length;
    } catch (e) {
      toast(e.message, 'error');
    }
    state.active = 'profile';
    renderNav();
    renderPanel();
  }

  /** Conecta el formulario de acceso, el botón de salir y el aviso de cambios sin guardar. */
  function initAuth() {
    // Mostrar / ocultar la contraseña.
    $('toggle-pass').addEventListener('click', () => {
      const p = $('auth-pass');
      const show = p.type === 'password';
      p.type = show ? 'text' : 'password';
      $('toggle-pass').firstElementChild.textContent = show ? 'visibility_off' : 'visibility';
    });

    // Envío del formulario: inicia sesión o crea la primera cuenta.
    $('auth-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      authError('');
      const username = $('auth-user').value.trim();
      const password = $('auth-pass').value;
      if (!username || !password) return authError('Completa usuario y contraseña.');
      if (authMode === 'register') {
        if (password.length < 8) return authError('La contraseña debe tener al menos 8 caracteres.');
        if (password !== $('auth-pass2').value) return authError('Las contraseñas no coinciden.');
      }
      const btn = $('auth-submit');
      btn.disabled = true;
      try {
        const res = await api('POST', authMode === 'register' ? '/api/auth/register' : '/api/auth/login', { username, password });
        $('auth-form').reset();
        await enterApp(res.user);
      } catch (ex) {
        authError(ex.message);
      } finally {
        btn.disabled = false;
      }
    });

    // Cerrar sesión.
    $('logout-btn').addEventListener('click', async () => {
      if (state.dirty && !confirm('Tienes cambios sin guardar. ¿Salir de todas formas?')) return;
      await api('POST', '/api/auth/logout').catch(() => {});
      state.dirty = false;
      setAuthMode('login');
      showAuth();
    });

    // Avisar si se intenta cerrar la pestaña con cambios sin guardar.
    window.addEventListener('beforeunload', (e) => {
      if (state.dirty) { e.preventDefault(); e.returnValue = ''; }
    });
  }

  /**
   * Punto de entrada: consulta el estado de la sesión y decide si mostrar
   * el panel, el inicio de sesión o el registro de la primera cuenta.
   */
  async function init() {
    initAuth();
    try {
      const s = await (await fetch('/api/auth/status')).json();
      if (s.user) return enterApp(s.user);
      setAuthMode(s.hasUsers ? 'login' : 'register');
    } catch {
      setAuthMode('login');
    }
    showAuth();
  }

  init();
})();
