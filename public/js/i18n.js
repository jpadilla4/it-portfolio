/**
 * Internacionalización (ES / EN) del sitio público.
 *
 * Hay dos tipos de texto en la página:
 *  1. Contenido editable (perfil, experiencia, etc.): viene de la API como
 *     objetos `{ es, en }` y se resuelve con `I18N.tr()`.
 *  2. Textos fijos de la interfaz (menús, etiquetas, botones): se definen en
 *     el diccionario `UI` de este archivo y se resuelven con `I18N.t()`.
 *
 * El idioma elegido se guarda en localStorage y, si el visitante aún no ha
 * elegido, se detecta a partir del idioma del navegador.
 *
 * Expone el objeto global `window.I18N`.
 */
(() => {
  'use strict';

  /** Idiomas soportados. */
  const LANGS = ['es', 'en'];
  /** Clave de localStorage donde se recuerda la elección del visitante. */
  const STORAGE_KEY = 'portfolio_lang';

  /** Diccionario de textos fijos de la interfaz, por idioma. */
  const UI = {
    es: {
      'nav.profile': 'Perfil',
      'nav.experience': 'Experiencia',
      'nav.highlights': 'Resumen',
      'nav.contact': 'Contacto',
      'nav.projects': 'Proyectos',
      'nav.aria': 'Navegación principal',
      'nav.ariaMobile': 'Navegación móvil',
      'header.cv': 'CV (PDF)',
      'header.contact': 'Contactar',
      'header.admin': 'Modo Admin',
      'header.adminAria': 'Abrir panel administrativo',
      'header.menuOpen': 'Abrir menú',
      'header.menuClose': 'Cerrar menú',
      'header.home': 'Ir al inicio',
      'lang.aria': 'Cambiar idioma de la página',
      'lang.es': 'Español',
      'lang.en': 'Inglés',
      'hero.liveActive': 'En Funciones Activas',
      'hero.realTime': 'Tiempo Real',
      'hero.currentRole': 'Puesto Actual',
      'hero.since': 'Desde el {date}',
      'hero.years': 'Años',
      'hero.months': 'Meses',
      'hero.days': 'Días',
      'hero.hours': 'Horas',
      'hero.minutes': 'Minutos:',
      'hero.seconds': 'Segundos:',
      'hero.totalWeeks': 'Total de Semanas',
      'hero.inRole': 'En el cargo',
      'exp.currentBadge': 'PUESTO ACTUAL',
      'exp.elapsed': 'Tiempo transcurrido en el cargo:',
      'exp.calculating': 'Calculando...',
      'exp.counter': '{y} años, {mo} meses, {d} días ({h}h : {mi}m : {s}s)',
      'metrics.aria': 'Cifras profesionales',
      'experience.aria': 'Experiencia profesional',
      'projects.aria': 'Proyectos con inteligencia artificial',
      'projects.prev': 'Proyectos anteriores',
      'projects.next': 'Más proyectos',
      'projects.prevImage': 'Imagen anterior',
      'projects.nextImage': 'Imagen siguiente',
      'projects.open': 'Ver en grande',
      'projects.demo': 'Ver demo',
      'projects.code': 'Código',
      'projects.video': 'Video',
      'projects.close': 'Cerrar',
      'projects.imageOf': 'Imagen {n} de {total}',
      'training.aria': 'Certificaciones y formación',
      'contact.aria': 'Contacto',
      'profile.aria': 'Perfil profesional',
      'form.name': 'Nombre / Empresa',
      'form.namePh': 'p. ej. Sofía Valdés — CloudCorp',
      'form.email': 'Email Corporativo',
      'form.emailPh': 'reclutador@empresa.com',
      'form.mode': 'Modalidad',
      'form.duration': 'Duración',
      'form.submit': 'Enviar Solicitud',
      'form.error': 'No se pudo enviar la solicitud. Intenta de nuevo.',
      'footer.admin': 'Panel Admin',
      'load.error': 'No se pudo cargar el portafolio. Verifica que el servidor esté en ejecución.',
      'meta.description': 'Portafolio profesional de TI: experiencia, competencias, formación y contacto.'
    },
    en: {
      'nav.profile': 'Profile',
      'nav.experience': 'Experience',
      'nav.highlights': 'Highlights',
      'nav.contact': 'Contact',
      'nav.projects': 'Projects',
      'nav.aria': 'Main navigation',
      'nav.ariaMobile': 'Mobile navigation',
      'header.cv': 'Resume (PDF)',
      'header.contact': 'Contact',
      'header.admin': 'Admin Mode',
      'header.adminAria': 'Open admin panel',
      'header.menuOpen': 'Open menu',
      'header.menuClose': 'Close menu',
      'header.home': 'Go to top',
      'lang.aria': 'Change page language',
      'lang.es': 'Spanish',
      'lang.en': 'English',
      'hero.liveActive': 'Currently Active',
      'hero.realTime': 'Real Time',
      'hero.currentRole': 'Current Role',
      'hero.since': 'Since {date}',
      'hero.years': 'Years',
      'hero.months': 'Months',
      'hero.days': 'Days',
      'hero.hours': 'Hours',
      'hero.minutes': 'Minutes:',
      'hero.seconds': 'Seconds:',
      'hero.totalWeeks': 'Total Weeks',
      'hero.inRole': 'In the role',
      'exp.currentBadge': 'CURRENT ROLE',
      'exp.elapsed': 'Time in role:',
      'exp.calculating': 'Calculating...',
      'exp.counter': '{y} yrs, {mo} mos, {d} days ({h}h : {mi}m : {s}s)',
      'metrics.aria': 'Professional highlights',
      'experience.aria': 'Professional experience',
      'projects.aria': 'Artificial intelligence projects',
      'projects.prev': 'Previous projects',
      'projects.next': 'More projects',
      'projects.prevImage': 'Previous image',
      'projects.nextImage': 'Next image',
      'projects.open': 'View larger',
      'projects.demo': 'View demo',
      'projects.code': 'Code',
      'projects.video': 'Video',
      'projects.close': 'Close',
      'projects.imageOf': 'Image {n} of {total}',
      'training.aria': 'Certifications and education',
      'contact.aria': 'Contact',
      'profile.aria': 'Professional profile',
      'form.name': 'Name / Company',
      'form.namePh': 'e.g. Sofia Valdés — CloudCorp',
      'form.email': 'Work Email',
      'form.emailPh': 'recruiter@company.com',
      'form.mode': 'Work Mode',
      'form.duration': 'Duration',
      'form.submit': 'Send Request',
      'form.error': 'The request could not be sent. Please try again.',
      'footer.admin': 'Admin Panel',
      'load.error': 'The portfolio could not be loaded. Make sure the server is running.',
      'meta.description': 'Professional IT portfolio: experience, skills, education and contact.'
    }
  };

  /**
   * Detecta el idioma inicial: primero la elección guardada y, si no existe,
   * el idioma del navegador (inglés si empieza por "en"; español en otro caso).
   * @returns {'es'|'en'}
   */
  function detectLang() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (LANGS.includes(saved)) return saved;
    } catch {
      /* localStorage no disponible (modo privado, etc.) */
    }
    return String(navigator.language || 'es').toLowerCase().startsWith('en') ? 'en' : 'es';
  }

  /** Idioma activo actualmente. */
  let current = detectLang();

  /** Devuelve el idioma activo. */
  const getLang = () => current;

  /**
   * Cambia el idioma activo, lo recuerda y actualiza `<html lang>`.
   * No vuelve a pintar la página: quien llama debe re-renderizar.
   * @param {'es'|'en'} lang Idioma nuevo.
   */
  function setLang(lang) {
    if (!LANGS.includes(lang)) return;
    current = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* se ignora: el idioma simplemente no se recordará */
    }
    document.documentElement.lang = lang;
  }

  /**
   * Traduce un texto fijo de la interfaz.
   * @param {string} key Clave del diccionario `UI`.
   * @param {Object<string,string|number>} [vars] Valores para marcadores `{nombre}`.
   * @returns {string} Texto en el idioma activo (o la clave si no existe).
   */
  function t(key, vars) {
    const text = UI[current][key] ?? UI.es[key] ?? key;
    return vars ? text.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`)) : text;
  }

  /**
   * Resuelve un valor editable que puede ser texto simple o `{ es, en }`.
   * Si falta la traducción del idioma activo, usa la del otro idioma.
   * @param {string|{es:string,en:string}|null|undefined} value
   * @returns {string}
   */
  function tr(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value[current] || value[current === 'es' ? 'en' : 'es'] || '';
    }
    return value ?? '';
  }

  /**
   * Igual que {@link tr}, pero para listas de textos `{ es: [], en: [] }`.
   * Si la lista del idioma activo está vacía, usa la del otro idioma.
   * @param {string[]|{es:string[],en:string[]}|null|undefined} value
   * @returns {string[]}
   */
  function trList(value) {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    const own = value[current] || [];
    return own.length ? own : value[current === 'es' ? 'en' : 'es'] || [];
  }

  /** Código de localización para formatear fechas y números. */
  const locale = () => (current === 'en' ? 'en-US' : 'es-ES');

  /**
   * Aplica el idioma activo a los elementos estáticos del HTML marcados con:
   *  - `data-i18n="clave"`        → reemplaza el texto del elemento.
   *  - `data-i18n-aria="clave"`   → reemplaza `aria-label`.
   *  - `data-i18n-title="clave"`  → reemplaza `title`.
   */
  function applyStatic(root = document) {
    document.documentElement.lang = current;
    root.querySelectorAll('[data-i18n]').forEach((el) => { el.textContent = t(el.dataset.i18n); });
    root.querySelectorAll('[data-i18n-aria]').forEach((el) => { el.setAttribute('aria-label', t(el.dataset.i18nAria)); });
    root.querySelectorAll('[data-i18n-title]').forEach((el) => { el.setAttribute('title', t(el.dataset.i18nTitle)); });
  }

  window.I18N = { LANGS, getLang, setLang, t, tr, trList, locale, applyStatic };
})();
