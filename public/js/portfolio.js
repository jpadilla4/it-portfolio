/**
 * Renderizado del portafolio público.
 *
 * Flujo:
 *  1. `init()` descarga todo el contenido desde `/api/portfolio`.
 *  2. `renderAll()` pinta cada sección en el idioma activo (ver `i18n.js`).
 *  3. Al pulsar el selector ES/EN se cambia el idioma y se vuelve a pintar
 *     todo sin recargar la página ni volver a consultar la API.
 *
 * Seguridad: todo texto proveniente de la API se escapa con `esc()` antes de
 * insertarse en el HTML; el único formato permitido es **negrita** (`rich()`).
 */
(() => {
  'use strict';

  const { t, tr, trList } = window.I18N;

  /* ---------- Utilidades ---------- */

  /**
   * Escapa caracteres especiales de HTML para evitar inyección (XSS).
   * @param {*} v Valor a escapar.
   * @returns {string} Texto seguro para insertar en HTML.
   */
  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /** Escapa y permite **negrita** como único formato. */
  const rich = (v) => esc(v).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

  /** Acepta solo URLs http(s); cualquier otra cosa se convierte en `#`. */
  const safeUrl = (u) => (/^https?:\/\//i.test(String(u).trim()) ? esc(String(u).trim()) : '#');

  /** Atajo para `document.getElementById`. */
  const $ = (id) => document.getElementById(id);

  /** Rellena con ceros a la izquierda hasta 2 dígitos. */
  const pad = (n) => String(n).padStart(2, '0');

  /** Estilos de los indicadores (KPIs) según su tono. */
  const KPI_TONES = {
    slate: { value: 'text-graphite-900', icon: 'bg-graphite-100 text-graphite-700' },
    emerald: { value: 'text-emerald-600', icon: 'bg-emerald-50 text-emerald-600' },
    brand: { value: 'text-brand-600', icon: 'bg-brand-50 text-brand-600' }
  };
  /** Color del emisor de cada certificación según su tono. */
  const CERT_TONES = {
    brand: 'text-brand-600',
    sky: 'text-itblue',
    emerald: 'text-emerald-600',
    slate: 'text-graphite-600'
  };
  /** Estilos de la etiqueta de nivel de cada idioma. */
  const LANG_TONES = {
    emerald: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    brand: 'bg-brand-50 text-brand-700 border border-brand-200',
    slate: 'bg-graphite-200 text-graphite-800'
  };

  /** Contenido completo del portafolio (cargado desde la API). */
  let data = null;
  /** Fecha de inicio del puesto actual (para el contador), o `null`. */
  let clockStart = null;

  /* ---------- Cabecera y pie ---------- */

  /**
   * Pinta la cabecera, el pie y los metadatos del documento (título y descripción).
   * @param {Object} p Sección `profile`.
   * @param {Object} f Sección `footer`.
   */
  function renderChrome(p, f) {
    $('header-initials').textContent = p.initials;
    $('header-name').textContent = p.name;
    $('header-title').textContent = tr(p.headerTitle);
    $('header-availability').textContent = tr(p.availability);
    $('footer-brand').textContent = f.brand;
    $('footer-tagline').textContent = tr(f.tagline);
    document.title = `${p.name} | ${tr(p.headerTitle)}`;
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.content = tr(p.bio).slice(0, 155) || t('meta.description');
  }

  /* ---------- Hero ---------- */

  /**
   * Pinta el bloque principal: presentación, botones y tarjetas laterales.
   * @param {Object} p Sección `profile`.
   * @param {Object|null} current Puesto actual con fecha de inicio (activa el
   *   contador en tiempo real) o `null` para ocultar esa tarjeta.
   */
  function renderHero(p, current) {
    /** Pequeña "píldora" con icono (modalidad, estudios, idiomas). */
    const chip = (icon, text) =>
      text
        ? `<div class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-graphite-50 border border-graphite-200/70">
             <span class="material-symbols-outlined text-[16px] text-brand-600">${icon}</span>
             <span>${esc(text)}</span>
           </div>`
        : '';

    // Tarjeta del contador en tiempo real (solo si el puesto actual tiene fecha de inicio).
    const clockCard = current
      ? `<div class="rounded-xl border border-graphite-200 bg-graphite-50/70 p-5 sm:p-6 shadow-sm">
          <div class="flex items-center justify-between gap-2 pb-4 border-b border-graphite-200/80">
            <div class="flex items-center gap-2">
              <span class="relative flex h-2.5 w-2.5">
                <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span class="text-xs font-mono font-semibold uppercase tracking-wider text-emerald-700">${esc(t('hero.liveActive'))}</span>
            </div>
            <span class="text-[11px] font-mono text-graphite-400 uppercase">${esc(t('hero.realTime'))}</span>
          </div>
          <div class="py-4">
            <div class="text-xs font-mono text-graphite-500 uppercase tracking-wider">${esc(t('hero.currentRole'))}</div>
            <div class="font-bold text-base text-graphite-900 mt-0.5">${esc(tr(current.title))}</div>
            <div class="text-xs text-graphite-500 flex flex-wrap items-center gap-x-1.5 mt-0.5">
              <span class="font-medium text-graphite-700">${esc(current.company)}</span>
              <span class="text-graphite-300">·</span>
              <span>${esc(sinceText(current.startDate))}</span>
            </div>
          </div>
          <div class="grid grid-cols-4 gap-2 pt-2 text-center font-mono">
            ${[['years', 'hero.years'], ['months', 'hero.months'], ['days', 'hero.days'], ['hours', 'hero.hours']]
              .map(
                ([k, label]) => `<div class="bg-white rounded-lg p-2 sm:p-2.5 border border-graphite-200/80">
                  <div class="text-xl sm:text-2xl font-bold text-brand-600" id="clock-${k}">0</div>
                  <div class="text-[10px] uppercase text-graphite-500 tracking-wider font-sans font-medium">${esc(t(label))}</div>
                </div>`
              )
              .join('')}
          </div>
          <div class="grid grid-cols-2 gap-2 mt-2 font-mono">
            <div class="bg-white rounded-lg py-2 px-3 border border-graphite-200/80 flex items-center justify-between">
              <span class="text-[11px] text-graphite-500 uppercase font-sans">${esc(t('hero.minutes'))}</span>
              <span class="text-base font-bold text-graphite-900" id="clock-minutes">00</span>
            </div>
            <div class="bg-white rounded-lg py-2 px-3 border border-graphite-200/80 flex items-center justify-between">
              <span class="text-[11px] text-graphite-500 uppercase font-sans">${esc(t('hero.seconds'))}</span>
              <span class="text-base font-bold text-emerald-600" id="clock-seconds">00</span>
            </div>
          </div>
          <div class="mt-4 pt-3 border-t border-graphite-200/70 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-graphite-500">
            <span>${esc(t('hero.totalWeeks'))}: <strong class="text-graphite-800" id="clock-weeks">0</strong></span>
            <span class="text-[11px] text-brand-600 bg-brand-50 px-2 py-0.5 rounded font-medium">${esc(t('hero.inRole'))}</span>
          </div>
        </div>`
      : '';

    $('perfil').innerHTML = `
      <div class="bg-white rounded-2xl border border-graphite-200/90 p-5 sm:p-10 shadow-sm fade-up">
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div class="lg:col-span-7 space-y-5 min-w-0">
            <div class="flex flex-wrap items-center gap-2 font-mono text-xs">
              ${p.badgeTier ? `<span class="px-2.5 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200/60 font-medium">${esc(p.badgeTier)}</span>` : ''}
              ${tr(p.badgeYears) ? `<span class="px-2.5 py-1 rounded bg-graphite-100 text-graphite-600 border border-graphite-200">${esc(tr(p.badgeYears))}</span>` : ''}
            </div>
            <h1 class="text-3xl sm:text-4xl lg:text-[42px] font-bold tracking-tight text-graphite-950 leading-[1.15] break-words">${esc(tr(p.headline))}</h1>
            <p class="text-base sm:text-lg text-graphite-600 leading-relaxed">${esc(tr(p.bio))}</p>
            <div class="flex flex-wrap items-center gap-2 pt-1 font-mono text-xs text-graphite-600">
              ${chip('place', tr(p.workMode))}${chip('school', tr(p.educationLine))}${chip('translate', tr(p.languagesLine))}
            </div>
            <div class="flex flex-wrap items-center gap-3 pt-2">
              <a href="#contacto" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium text-sm transition-all shadow-sm">
                <span>${esc(tr(p.ctaPrimary))}</span>
                <span class="material-symbols-outlined text-[18px]">calendar_today</span>
              </a>
              <a href="#experiencia" class="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-graphite-100 hover:bg-graphite-200/80 text-graphite-800 font-medium text-sm transition-all">
                <span>${esc(tr(p.ctaSecondary))}</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </a>
            </div>
          </div>
          <div class="lg:col-span-5 flex flex-col gap-4 min-w-0">
            ${clockCard}
            <div class="p-4 rounded-xl border border-graphite-200 bg-white flex items-center justify-between gap-3">
              <div class="flex items-center gap-3 min-w-0">
                <div class="w-10 h-10 shrink-0 rounded-lg bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-600">
                  <span class="material-symbols-outlined text-[20px]">local_police</span>
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-mono text-graphite-500 uppercase truncate">${esc(tr(p.highlightLabel))}</div>
                  <div class="text-base font-bold text-graphite-900">${esc(tr(p.highlight))}</div>
                </div>
              </div>
              ${tr(p.highlightBadge) ? `<span class="shrink-0 text-xs font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">${esc(tr(p.highlightBadge))}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }

  /* ---------- Cifras + competencias ---------- */

  /**
   * Pinta los indicadores (KPIs) y el bloque de competencias clave.
   * @param {Object} m Sección `metrics`.
   * @param {Object} s Sección `skills`.
   */
  function renderMetrics(m, s) {
    const kpis = m.kpis
      .map((k) => {
        const tone = KPI_TONES[k.tone] || KPI_TONES.slate;
        return `<div class="bg-white p-5 sm:p-6 rounded-xl border border-graphite-200 hover:border-brand-300 transition-colors">
          <div class="flex items-center justify-between gap-2 text-graphite-500 mb-3">
            <span class="text-xs font-mono uppercase tracking-wider">${esc(tr(k.label))}</span>
            <span class="w-8 h-8 shrink-0 rounded-lg ${tone.icon} flex items-center justify-center">
              <span class="material-symbols-outlined text-[18px]">${esc(k.icon)}</span>
            </span>
          </div>
          <div class="text-3xl font-mono font-bold tracking-tight ${tone.value}">${esc(k.value)}</div>
          <div class="mt-2 flex items-center gap-1.5 text-xs ${k.trend ? 'text-emerald-600 font-medium' : 'text-graphite-500'}">
            ${k.trend ? '<span class="material-symbols-outlined text-[14px]">trending_up</span>' : ''}
            <span>${esc(tr(k.note))}</span>
          </div>
        </div>`;
      })
      .join('');

    const skills = s.items
      .map(
        (i) => `<div class="p-3.5 rounded-lg bg-graphite-50 border border-graphite-200/80 min-w-0">
          <div class="flex items-center gap-2 mb-1">
            <span class="w-2.5 h-2.5 shrink-0 rounded-full" style="background:${esc(i.color)}"></span>
            <span class="text-xs font-mono text-graphite-800 font-semibold">${esc(tr(i.label))}</span>
          </div>
          <div class="text-xs text-graphite-500 pl-[18px]">${esc(tr(i.detail))}</div>
        </div>`
      )
      .join('');

    $('metricas').innerHTML = `
      <div class="pb-2 border-b border-graphite-200">
        <h2 class="text-2xl font-bold tracking-tight text-graphite-900">${esc(tr(m.title))}</h2>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">${kpis}</div>
      <div class="bg-white rounded-xl border border-graphite-200 p-5 sm:p-6 space-y-5 print-avoid">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 class="font-bold text-base text-graphite-900">${esc(tr(s.title))}</h3>
            <p class="text-xs text-graphite-500">${esc(tr(s.subtitle))}</p>
          </div>
          ${tr(s.badge) ? `<span class="self-start text-xs font-mono text-brand-600 bg-brand-50 px-2.5 py-1 rounded border border-brand-100">${esc(tr(s.badge))}</span>` : ''}
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">${skills}</div>
      </div>`;
  }

  /* ---------- Experiencia ---------- */

  /**
   * Pinta la línea de experiencia profesional. El puesto marcado como actual
   * se resalta y, si tiene fecha de inicio, muestra el contador en línea.
   * @param {Object} e Sección `experience`.
   */
  function renderExperience(e) {
    const items = e.items
      .map((x) => {
        const cur = x.current;
        const checkTone = cur ? 'text-brand-600' : 'text-graphite-400';
        const bullets = trList(x.bullets).filter((b) => b.trim());
        return `<article class="relative overflow-hidden bg-white rounded-xl p-5 sm:p-8 transition-colors print-avoid ${
          cur ? 'border-2 border-brand-200' : 'border border-graphite-200 hover:border-graphite-300'
        }">
          ${
            cur
              ? `<div class="absolute top-0 right-0 px-3 py-1 bg-brand-50 border-b border-l border-brand-200 text-brand-700 text-xs font-mono font-semibold rounded-bl-lg flex items-center gap-1.5">
                  <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span> ${esc(t('exp.currentBadge'))}
                </div>`
              : ''
          }
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 ${cur ? 'pt-4 lg:pt-0' : ''}">
            <div class="lg:col-span-4 space-y-1.5 min-w-0">
              <div class="text-xs font-mono font-semibold ${cur ? 'text-brand-600' : 'text-graphite-500'}">${esc(tr(x.period))}</div>
              <h3 class="${cur ? 'text-xl' : 'text-lg'} font-bold text-graphite-900">${esc(tr(x.title))}</h3>
              <div class="text-sm font-medium text-graphite-700">${esc(x.company)}</div>
              <div class="text-xs text-graphite-500 font-mono">${esc(tr(x.meta))}</div>
              ${
                cur && x.startDate
                  ? `<div class="mt-4 p-3 bg-brand-50/50 rounded-lg border border-brand-100 text-xs font-mono text-brand-900">
                      <div class="text-[11px] text-brand-700 uppercase font-semibold">${esc(t('exp.elapsed'))}</div>
                      <div class="mt-1 font-bold text-graphite-900" id="experience-inline-counter">${esc(t('exp.calculating'))}</div>
                    </div>`
                  : ''
              }
            </div>
            <div class="lg:col-span-8 space-y-4 min-w-0">
              <p class="text-sm sm:text-base text-graphite-700 leading-relaxed">${esc(tr(x.description))}</p>
              <ul class="space-y-2 text-sm text-graphite-600">
                ${bullets
                  .map(
                    (b) => `<li class="flex items-start gap-2">
                      <span class="material-symbols-outlined ${checkTone} text-base mt-0.5">check_circle</span>
                      <span>${rich(b)}</span>
                    </li>`
                  )
                  .join('')}
              </ul>
              <div class="flex flex-wrap gap-1.5 pt-1 font-mono text-xs text-graphite-600">
                ${x.tech
                  .filter((tech) => tech.trim())
                  .map((tech) => `<span class="px-2 py-0.5 rounded bg-graphite-100">${esc(tech)}</span>`)
                  .join('')}
              </div>
            </div>
          </div>
        </article>`;
      })
      .join('');

    $('experiencia').innerHTML = `
      <div class="pb-2 border-b border-graphite-200">
        <h2 class="text-2xl font-bold tracking-tight text-graphite-900">${esc(tr(e.title))}</h2>
      </div>
      <div class="space-y-4">${items}</div>`;
  }

  /* ---------- Certificaciones y formación ---------- */

  /**
   * Pinta las tarjetas de certificaciones, formación académica e idiomas.
   * @param {Object} c Sección `certifications`.
   * @param {Object} ed Sección `education`.
   */
  function renderTraining(c, ed) {
    const certs = c.items
      .map(
        (i) => `<div class="p-3 rounded-lg bg-graphite-50 border border-graphite-200/70 text-xs min-w-0">
          <span class="font-mono font-semibold ${CERT_TONES[i.tone] || CERT_TONES.brand}">${esc(tr(i.issuer))}</span>
          <div class="font-bold text-graphite-900 mt-0.5">${esc(tr(i.name))}</div>
          <div class="font-mono text-[11px] text-graphite-500 mt-1 break-words">${esc(tr(i.detail))}</div>
        </div>`
      )
      .join('');

    const degrees = ed.degrees
      .map(
        (d) => `<div class="p-3.5 rounded-lg bg-graphite-50 border border-graphite-200/70 space-y-1">
          <div class="text-xs font-mono text-brand-600 font-semibold">${esc(tr(d.label))}</div>
          <div class="font-bold text-sm text-graphite-900">${esc(tr(d.title))}</div>
          <div class="text-xs text-graphite-600">${esc(tr(d.detail))}</div>
        </div>`
      )
      .join('');
    const langs = ed.languages
      .map(
        (l) => `<div class="flex items-center justify-between gap-3 text-xs">
          <span class="text-graphite-800 font-medium">${esc(tr(l.name))}</span>
          <span class="px-2 py-0.5 rounded font-mono font-semibold text-right ${LANG_TONES[l.tone] || LANG_TONES.slate}">${esc(tr(l.level))}</span>
        </div>`
      )
      .join('');

    $('formacion').innerHTML = `
      <div class="bg-white rounded-xl border border-graphite-200 p-5 sm:p-6 space-y-4 print-avoid">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-brand-600">workspace_premium</span>
          <h3 class="font-bold text-base text-graphite-900">${esc(tr(c.title))}</h3>
        </div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">${certs}</div>
      </div>
      <div class="bg-white rounded-xl border border-graphite-200 p-5 sm:p-6 space-y-4 print-avoid">
        <div class="flex items-center gap-2">
          <span class="material-symbols-outlined text-brand-600">school</span>
          <h3 class="font-bold text-base text-graphite-900">${esc(tr(ed.title))}</h3>
        </div>
        ${degrees}
        <div class="p-3.5 rounded-lg bg-graphite-50 border border-graphite-200/70 space-y-2">
          <div class="text-xs font-mono text-graphite-500 uppercase tracking-wider">${esc(tr(ed.languagesTitle))}</div>
          ${langs}
        </div>
      </div>`;
  }

  /* ---------- Contacto ---------- */

  /**
   * Pinta el bloque de contacto y el formulario de solicitud de entrevista.
   * Conserva lo que el visitante ya haya escrito en el formulario, para que
   * cambiar de idioma no le haga perder los datos.
   * @param {Object} c Sección `contact`.
   */
  function renderContact(c) {
    // Guardar valores actuales del formulario (si ya existía) para restaurarlos.
    const prev = ['cf-name', 'cf-email', 'cf-mode', 'cf-duration'].map((id) => $(id)?.value);
    const prevModeIdx = $('cf-mode')?.selectedIndex ?? 0;
    const prevDurIdx = $('cf-duration')?.selectedIndex ?? 0;

    const linkCls =
      'p-3 rounded-lg border border-graphite-200 bg-graphite-50 hover:bg-brand-50 hover:border-brand-200 transition-colors flex items-center gap-2 text-graphite-700 min-w-0';
    const staticCls =
      'p-3 rounded-lg border border-graphite-200 bg-graphite-50 flex items-center gap-2 text-graphite-700 min-w-0';
    const inputCls =
      'w-full text-xs rounded-lg border-graphite-300 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 bg-white py-2 px-3';

    // Opciones del formulario: [español, inglés]. Se envía el texto visible.
    const modes = [['Remoto Total', 'Fully Remote'], ['Híbrido', 'Hybrid'], ['Presencial', 'On-site']];
    const durations = [['15 min (Intro)', '15 min (Intro)'], ['30 min (Técnica)', '30 min (Technical)'], ['45 min (Panel)', '45 min (Panel)']];
    const lang = window.I18N.getLang();
    const opts = (list, selected) =>
      list.map((o, i) => `<option${i === selected ? ' selected' : ''}>${esc(o[lang === 'en' ? 1 : 0])}</option>`).join('');

    // Teléfono: solo dígitos y "+" para el enlace tel:.
    const telHref = esc(String(c.phone).replace(/[^+\d]/g, ''));

    $('contacto').innerHTML = `
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div class="lg:col-span-7 space-y-4 min-w-0">
          ${
            tr(c.badge)
              ? `<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-mono text-xs font-medium border border-emerald-200">
                  <span class="w-2 h-2 rounded-full bg-emerald-500"></span> ${esc(tr(c.badge))}
                </div>`
              : ''
          }
          <h2 class="text-2xl sm:text-3xl font-bold tracking-tight text-graphite-950">${esc(tr(c.heading))}</h2>
          <p class="text-graphite-600 text-sm sm:text-base leading-relaxed">${rich(tr(c.description))}</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 font-mono text-xs">
            <a class="${linkCls}" href="mailto:${esc(c.email)}">
              <span class="material-symbols-outlined text-brand-600 text-[18px]">mail</span>
              <span class="truncate">${esc(c.email)}</span>
            </a>
            <a class="${linkCls}" href="tel:${telHref}">
              <span class="material-symbols-outlined text-brand-600 text-[18px]">phone</span>
              <span class="truncate">${esc(c.phone)}</span>
            </a>
            ${
              c.linkedin
                ? `<a class="${linkCls}" href="${safeUrl(c.linkedinUrl)}" target="_blank" rel="noopener noreferrer">
                    <span class="material-symbols-outlined text-brand-600 text-[18px]">link</span>
                    <span class="truncate">${esc(c.linkedin)}</span>
                  </a>`
                : ''
            }
            ${
              c.github
                ? `<a class="${linkCls}" href="${safeUrl(c.githubUrl)}" target="_blank" rel="noopener noreferrer">
                    <span class="material-symbols-outlined text-brand-600 text-[18px]">terminal</span>
                    <span class="truncate">${esc(c.github)}</span>
                  </a>`
                : ''
            }
            ${
              c.location
                ? `<div class="${staticCls}">
                    <span class="material-symbols-outlined text-brand-600 text-[18px]">place</span>
                    <span class="truncate">${esc(c.location)}</span>
                  </div>`
                : ''
            }
          </div>
        </div>
        <div class="lg:col-span-5 bg-graphite-50 rounded-xl p-5 sm:p-6 border border-graphite-200/90 space-y-4">
          <div class="pb-2 border-b border-graphite-200">
            <h3 class="font-bold text-sm text-graphite-900">${esc(tr(c.formTitle))}</h3>
          </div>
          <form id="contact-form" class="space-y-3 text-xs" novalidate>
            <div>
              <label class="block font-mono text-graphite-600 mb-1" for="cf-name">${esc(t('form.name'))}</label>
              <input id="cf-name" name="name" class="${inputCls}" placeholder="${esc(t('form.namePh'))}" required maxlength="120" type="text" autocomplete="name">
            </div>
            <div>
              <label class="block font-mono text-graphite-600 mb-1" for="cf-email">${esc(t('form.email'))}</label>
              <input id="cf-email" name="email" class="${inputCls}" placeholder="${esc(t('form.emailPh'))}" required maxlength="160" type="email" autocomplete="email">
            </div>
            <div class="grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
              <div>
                <label class="block font-mono text-graphite-600 mb-1" for="cf-mode">${esc(t('form.mode'))}</label>
                <select id="cf-mode" name="mode" class="${inputCls}">${opts(modes, prevModeIdx)}</select>
              </div>
              <div>
                <label class="block font-mono text-graphite-600 mb-1" for="cf-duration">${esc(t('form.duration'))}</label>
                <select id="cf-duration" name="duration" class="${inputCls}">${opts(durations, prevDurIdx)}</select>
              </div>
            </div>
            <button type="submit" id="cf-submit" class="w-full py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-medium text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 mt-2">
              <span>${esc(t('form.submit'))}</span>
              <span class="material-symbols-outlined text-[16px]">send</span>
            </button>
          </form>
          <div id="cf-feedback" role="status" class="hidden p-3 rounded-lg text-xs font-mono flex items-center gap-2"></div>
        </div>
      </div>`;

    // Restaurar lo escrito antes del cambio de idioma.
    if (prev[0]) $('cf-name').value = prev[0];
    if (prev[1]) $('cf-email').value = prev[1];

    $('contact-form').addEventListener('submit', (ev) => submitContact(ev, c));
  }

  /**
   * Envía el formulario de contacto a la API y muestra el resultado.
   * @param {SubmitEvent} ev Evento de envío del formulario.
   * @param {Object} c Sección `contact` (para el mensaje de éxito).
   */
  async function submitContact(ev, c) {
    ev.preventDefault();
    const form = ev.currentTarget;
    const fb = $('cf-feedback');
    const btn = $('cf-submit');
    /** Muestra un mensaje de éxito (verde) o error (rojo) bajo el formulario. */
    const show = (ok, text) => {
      fb.className = `p-3 rounded-lg text-xs font-mono flex items-center gap-2 border ${
        ok ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
      }`;
      fb.innerHTML = `<span class="material-symbols-outlined text-[16px]">${ok ? 'check_circle' : 'error'}</span><span></span>`;
      fb.lastElementChild.textContent = text;
    };
    if (!form.reportValidity()) return;
    btn.disabled = true;
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!res.ok) throw new Error(t('form.error'));
      show(true, tr(c.successMessage));
      form.reset();
    } catch (err) {
      show(false, err.message || t('form.error'));
    } finally {
      btn.disabled = false;
      setTimeout(() => fb.classList.add('hidden'), 8000);
    }
  }

  /* ---------- Contador en tiempo real ---------- */

  /**
   * Texto "Desde el <fecha>" con la fecha formateada según el idioma activo.
   * @param {string} iso Fecha ISO de inicio.
   * @returns {string} Texto listo para mostrar (vacío si la fecha no es válida).
   */
  function sinceText(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return '';
    const date = d.toLocaleDateString(window.I18N.locale(), { year: 'numeric', month: 'short', day: 'numeric' });
    return t('hero.since', { date });
  }

  /**
   * Calcula la diferencia entre dos fechas con aritmética de calendario
   * (años, meses y días reales, no aproximados).
   * @param {Date} start Fecha de inicio.
   * @param {Date} now Fecha actual.
   * @returns {{y:number, mo:number, d:number, h:number, mi:number, s:number}}
   */
  function diffParts(start, now) {
    let y = now.getFullYear() - start.getFullYear();
    let mo = now.getMonth() - start.getMonth();
    let d = now.getDate() - start.getDate();
    let h = now.getHours() - start.getHours();
    let mi = now.getMinutes() - start.getMinutes();
    let s = now.getSeconds() - start.getSeconds();
    // Propagar los "préstamos" de cada unidad hacia la siguiente mayor.
    if (s < 0) { s += 60; mi--; }
    if (mi < 0) { mi += 60; h--; }
    if (h < 0) { h += 24; d--; }
    if (d < 0) { d += new Date(now.getFullYear(), now.getMonth(), 0).getDate(); mo--; }
    if (mo < 0) { mo += 12; y--; }
    return { y, mo, d, h, mi, s };
  }

  /** Actualiza (cada segundo) los contadores del hero y del puesto actual. */
  function tick() {
    if (!clockStart) return;
    const now = new Date();
    if (now < clockStart) return;
    const parts = diffParts(clockStart, now);
    const set = (id, v) => { const el = $(id); if (el) el.textContent = v; };
    set('clock-years', parts.y);
    set('clock-months', parts.mo);
    set('clock-days', parts.d);
    set('clock-hours', pad(parts.h));
    set('clock-minutes', pad(parts.mi));
    set('clock-seconds', pad(parts.s));
    set('clock-weeks', Math.floor((now - clockStart) / 604800000).toLocaleString(window.I18N.locale()));
    set(
      'experience-inline-counter',
      t('exp.counter', { y: parts.y, mo: parts.mo, d: parts.d, h: pad(parts.h), mi: pad(parts.mi), s: pad(parts.s) })
    );
  }

  /* ---------- Menú móvil ---------- */

  /** Activa el botón hamburguesa del menú móvil/tableta. */
  function initMenu() {
    const btn = $('menu-btn');
    const menu = $('mobile-menu');
    /** Cierra el menú y restaura el icono y la etiqueta accesible. */
    const close = () => {
      menu.classList.add('hidden');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', t('header.menuOpen'));
      $('menu-icon').textContent = 'menu';
    };
    btn.addEventListener('click', () => {
      const open = menu.classList.toggle('hidden') === false;
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', t(open ? 'header.menuClose' : 'header.menuOpen'));
      $('menu-icon').textContent = open ? 'close' : 'menu';
    });
    // Cerrar al elegir un enlace o al pasar a pantalla ancha.
    menu.addEventListener('click', (e) => { if (e.target.closest('a,button')) close(); });
    window.addEventListener('resize', () => { if (window.innerWidth >= 1024) close(); });
  }

  /* ---------- Idioma ---------- */

  /** Marca visualmente el botón del idioma activo en el selector ES/EN. */
  function paintLangSwitch() {
    const active = window.I18N.getLang();
    document.querySelectorAll('#lang-switch .lang-btn').forEach((b) => {
      const on = b.dataset.lang === active;
      b.setAttribute('aria-pressed', String(on));
      b.classList.toggle('bg-graphite-900', on);
      b.classList.toggle('text-white', on);
      b.classList.toggle('text-graphite-500', !on);
      b.classList.toggle('hover:bg-graphite-100', !on);
    });
  }

  /** Conecta los botones ES/EN: cambian el idioma y repintan toda la página. */
  function initLangSwitch() {
    document.querySelectorAll('#lang-switch .lang-btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (b.dataset.lang === window.I18N.getLang()) return;
        window.I18N.setLang(b.dataset.lang);
        renderAll();
      });
    });
  }

  /**
   * Pinta toda la página en el idioma activo: textos estáticos del HTML,
   * cabecera/pie y todas las secciones dinámicas.
   */
  function renderAll() {
    window.I18N.applyStatic();
    paintLangSwitch();
    if (!data) return;

    // El contador solo se activa si el puesto actual tiene fecha de inicio válida.
    const current = data.experience.items.find((i) => i.current && i.startDate) || null;
    clockStart = current ? new Date(current.startDate) : null;
    if (clockStart && isNaN(clockStart)) clockStart = null;

    renderChrome(data.profile, data.footer);
    renderHero(data.profile, clockStart ? current : null);
    renderMetrics(data.metrics, data.skills);
    renderExperience(data.experience);
    renderTraining(data.certifications, data.education);
    renderContact(data.contact);
    tick();
  }

  /* ---------- Arranque ---------- */

  /** Punto de entrada: descarga el contenido, lo pinta y arranca el reloj. */
  async function init() {
    initMenu();
    initLangSwitch();
    window.I18N.applyStatic();
    paintLangSwitch();
    try {
      const res = await fetch('/api/portfolio');
      if (!res.ok) throw new Error();
      data = await res.json();
    } catch {
      $('perfil').innerHTML = `<div class="bg-white rounded-2xl border border-red-200 p-8 text-center text-sm text-red-700">
        ${esc(t('load.error'))}</div>`;
      return;
    }
    renderAll();
    setInterval(tick, 1000);
  }

  init();
})();
