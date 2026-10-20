'use strict';

/**
 * Contenido inicial del portafolio, extraído del resume de Jonathan L. Padilla
 * (doc-resume-jonathan/Resume_Jonathan_Padilla 2026 Update.pdf).
 *
 * Estructura:
 *  - Cada clave de primer nivel es una "sección" editable desde el panel admin.
 *  - Los textos traducibles son objetos `{ es, en }` (ver helper `t`).
 *  - Los datos que no dependen del idioma (correo, URLs, fechas, colores,
 *    iconos) son valores simples compartidos por ambos idiomas.
 *
 * IMPORTANTE: solo se incluyen datos que aparecen en el resume. No se inventan
 * métricas. Lo que falte (certificaciones, fecha exacta de inicio del cargo
 * actual, GitHub) se completa luego desde el panel de administración.
 */

/**
 * Crea un texto bilingüe.
 * @param {string} es Texto en español.
 * @param {string} en Texto en inglés.
 * @returns {{es: string, en: string}}
 */
const t = (es, en) => ({ es, en });

/**
 * Crea una lista de textos bilingüe (p. ej. los logros de un puesto).
 * @param {string[]} es Líneas en español.
 * @param {string[]} en Líneas en inglés.
 * @returns {{es: string[], en: string[]}}
 */
const tl = (es, en) => ({ es, en });

module.exports = {
  /* ---------------- Perfil: cabecera y bloque principal (hero) ---------------- */
  profile: {
    name: 'Jonathan L. Padilla',
    initials: 'JP',
    headerTitle: t('Técnico Especialista en TI', 'IT Specialist Technician'),
    availability: t('Puerto Rico · ES / EN', 'Puerto Rico · ES / EN'),
    badgeTier: 'IT SPECIALIST · CYBERSECURITY',
    badgeYears: t('2+ AÑOS DE EXPERIENCIA', '2+ YEARS OF EXPERIENCE'),
    headline: t(
      'Técnico Especialista en TI & Ciberseguridad',
      'IT Specialist Technician & Cybersecurity'
    ),
    bio: t(
      'Técnico Especialista en TI orientado a resultados, con experiencia práctica en entornos gubernamentales y corporativos. Dominio de Active Directory, infraestructura de red, imágenes de sistemas y soporte a usuarios finales en entornos Windows. Actualmente cursa una Maestría en Ciberseguridad mientras lidera las operaciones de tecnología de la Región Norte de la Policía de Puerto Rico. Comprometido con asegurar sistemas, agilizar los flujos de trabajo de TI y potenciar a los equipos mediante la tecnología.',
      "Results-driven IT Specialist Technician with hands-on experience in government and corporate environments. Skilled in Active Directory, network infrastructure, system imaging, and end-user support across Windows environments. Currently pursuing a Master's in Cybersecurity while leading technology operations for the Puerto Rico Police Bureau's Northern Region. Committed to securing systems, streamlining IT workflows, and empowering teams through technology."
    ),
    workMode: t('Puerto Rico', 'Puerto Rico'),
    educationLine: t(
      'M.S. Ciberseguridad (2026) · B.S. Ciencias de la Computación (2024)',
      'M.S. Cybersecurity (2026) · B.S. Computer Science (2024)'
    ),
    languagesLine: t('Español', 'Spanish'),
    ctaPrimary: t('Agendar Entrevista', 'Schedule an Interview'),
    ctaSecondary: t('Ver Experiencia', 'View Experience'),
    highlightLabel: t('Alcance Regional', 'Regional Coverage'),
    highlight: t('15 Precintos y Estaciones', '15 Precincts & Stations'),
    highlightBadge: t('Región de Arecibo', 'Arecibo Region')
  },

  /* ---------------- Cifras reales extraídas del resume ---------------- */
  metrics: {
    title: t('Resumen Profesional en Cifras', 'Professional Snapshot'),
    kpis: [
      {
        label: t('Precintos y Estaciones', 'Precincts & Stations'),
        value: '15',
        note: t('Soporte TI de Quebradillas a Morovis y Ciales', 'IT support from Quebradillas to Morovis and Ciales'),
        icon: 'local_police',
        tone: 'brand',
        trend: false
      },
      {
        label: t('GPA de Maestría', 'Master’s GPA'),
        value: '4.00',
        note: t('M.S. en Ciberseguridad · UAGM Cupey', 'M.S. in Cybersecurity · UAGM Cupey'),
        icon: 'school',
        tone: 'emerald',
        trend: false
      },
      {
        label: t('Posiciones Técnicas', 'Technical Roles'),
        value: '3',
        note: t('Gobierno, salud y telecomunicaciones', 'Government, healthcare and telecom'),
        icon: 'work',
        tone: 'slate',
        trend: false
      },
      {
        label: t('Idiomas', 'Languages'),
        value: 'ES / EN',
        note: t('Comunicación técnica bilingüe', 'Bilingual technical communication'),
        icon: 'translate',
        tone: 'slate',
        trend: false
      }
    ]
  },

  /* ---------------- Competencias clave (Core Competencies del resume) ---------------- */
  skills: {
    title: t('Competencias Clave', 'Core Competencies'),
    subtitle: t(
      'Habilidades técnicas aplicadas en entornos gubernamentales y corporativos',
      'Technical skills applied in government and corporate environments'
    ),
    badge: t('Según mi resume', 'From my resume'),
    items: [
      {
        label: t('Active Directory & MFA', 'Active Directory & MFA Admin'),
        detail: t('Cuentas de usuario, control de acceso y Microsoft Authenticator', 'User accounts, access control and Microsoft Authenticator'),
        color: '#2563eb'
      },
      {
        label: t('Cableado de Red (TIA/EIA-568B)', 'Network Cabling (TIA/EIA-568B)'),
        detail: t('Infraestructura de red cableada', 'Wired network infrastructure'),
        color: '#0284c7'
      },
      {
        label: t('Imágenes y Despliegue de Sistemas', 'System Imaging & Deployment'),
        detail: t('Imágenes estandarizadas en estaciones de trabajo', 'Standardized images across workstations'),
        color: '#10b981'
      },
      {
        label: t('Administración de Microsoft 365', 'Microsoft 365 Administration'),
        detail: t('Gestión de la plataforma y sus usuarios', 'Platform and user management'),
        color: '#6366f1'
      },
      {
        label: t('TCP/IP, DNS, DHCP', 'TCP/IP, DNS, DHCP Configuration'),
        detail: t('Configuración de servicios de red', 'Network services configuration'),
        color: '#f43f5e'
      },
      {
        label: t('Inventario', 'Inventory'),
        detail: t('Control de activos y documentación', 'Asset control and documentation'),
        color: '#f59e0b'
      },
      {
        label: t('Soporte Windows', 'Windows OS Troubleshooting'),
        detail: t('Diagnóstico y resolución de incidentes', 'Incident diagnosis and resolution'),
        color: '#2563eb'
      },
      {
        label: t('Reparación de Hardware', 'Hardware Repair'),
        detail: t('Reparación y mantenimiento de equipos', 'Equipment repair and maintenance'),
        color: '#0284c7'
      },
      {
        label: t('Help Desk & Capacitación', 'Help Desk & End-User Training'),
        detail: t('Soporte y entrenamiento a usuarios finales', 'End-user support and training'),
        color: '#10b981'
      }
    ]
  },

  /* ---------------- Experiencia profesional ---------------- */
  experience: {
    title: t('Experiencia Profesional', 'Professional Experience'),
    items: [
      {
        period: t('2024 — PRESENTE', '2024 — PRESENT'),
        title: t('Técnico de Sistemas de Información', 'Information Systems Technician'),
        company: 'Policía de Puerto Rico, Comandancia de Arecibo',
        meta: t('Arecibo, PR · 15 precintos, distritos y estaciones', 'Arecibo, PR · 15 precincts, districts and stations'),
        current: true,
        // Fecha exacta de inicio pendiente: al completarla en el panel admin
        // se activa el contador de tiempo en el cargo.
        startDate: '',
        description: t(
          'Técnico de sistemas líder de la Región de Arecibo, cubriendo 15 precintos, distritos y estaciones en la ruta de Quebradillas a Morovis y Ciales, garantizando soporte de TI y estándares tecnológicos consistentes en toda la zona.',
          'Lead systems technician for the Arecibo Region, covering 15 precincts, districts, and stations along the route from Quebradillas through Morovis and Ciales, ensuring consistent IT support and technology standards across the entire zone.'
        ),
        bullets: tl(
          [
            'Gestiono el inventario tecnológico regional de principio a fin: creación de recibos, organización de registros de equipos y documentación y control de activos precisos.',
            'Actúo como enlace principal entre los usuarios finales y otros técnicos, coordinando solicitudes y verificando que el trabajo completado cumpla los estándares operativos y técnicos.',
            'Viajo al Cuartel General de la Policía para solicitar equipo y recursos tecnológicos, manteniendo la tecnología de la región al día.',
            'Despliego imágenes de sistema estandarizadas en las estaciones de trabajo, reduciendo el tiempo de configuración y asegurando consistencia en toda la región.',
            'Administro cuentas de usuario de **Active Directory** y **Microsoft MFA Authenticator**, aplicando controles de acceso y el cumplimiento de políticas de ciberseguridad.'
          ],
          [
            'Manage the regional technology inventory end to end, including creating receipts, organizing equipment records, and maintaining accurate documentation and asset control.',
            'Serve as the primary liaison between end users and other technicians, coordinating requests and verifying that completed work meets operational and technical standards.',
            'Travel to Police Headquarters (Cuartel General) to request technology equipment and resources, keeping the region’s technology up to date.',
            'Deploy standardized system images across workstations, reducing setup time and ensuring configuration consistency region wide.',
            'Administer **Active Directory** user accounts and **Microsoft MFA Authenticator**, enforcing access controls and cybersecurity policy compliance.'
          ]
        ),
        tech: ['Active Directory', 'Microsoft MFA Authenticator', 'System Imaging', 'Asset Inventory']
      },
      {
        period: t('JUL 2024 — NOV 2024', 'JUL 2024 — NOV 2024'),
        title: t('Técnico de Help Desk – Nivel I', 'Help Desk Technician – Tier I'),
        company: 'Telemedik',
        meta: t('Guaynabo, PR', 'Guaynabo, PR'),
        current: false,
        startDate: '',
        description: t(
          'Soporte técnico de primer nivel (Tier I) para personal del sector salud.',
          'First-level (Tier I) technical support for healthcare personnel.'
        ),
        bullets: tl(
          [
            'Aprovisioné y administré cuentas de usuario de Active Directory, configurando el acceso basado en roles para el personal de salud.',
            'Brindé soporte técnico remoto por teléfono en problemas de software, hardware y conectividad, manteniendo altos niveles de satisfacción del cliente.',
            'Desplegué imágenes de sistema estandarizadas en múltiples estaciones de trabajo, agilizando la incorporación y reduciendo la carga operativa de TI.',
            'Registré y documenté tickets de soporte, lo que permitió analizar tendencias y asegurar la resolución oportuna según los estándares de SLA.',
            'Capacité al personal de TI entrante en procedimientos del departamento, mejores prácticas y protocolos de ticketing, acelerando su integración al equipo.'
          ],
          [
            'Provisioned and managed Active Directory user accounts, configuring appropriate role-based access for healthcare personnel.',
            'Delivered remote technical support via phone for software, hardware, and connectivity issues, maintaining high customer satisfaction scores.',
            'Deployed standardized system images across multiple workstations, streamlining onboarding and reducing IT overhead.',
            'Tracked and documented support tickets, enabling trend analysis and ensuring timely incident resolution per SLA standards.',
            'Trained incoming IT staff in department procedures, best practices, and ticketing protocols, accelerating team ramp-up time.'
          ]
        ),
        tech: ['Active Directory', 'Ticketing / SLA', 'Remote Support', 'System Imaging']
      },
      {
        period: t('FEB 2024 — MAY 2024', 'FEB 2024 — MAY 2024'),
        title: t('Técnico de Servicio en Campo B2B', 'B2B Field Service Technician'),
        company: 'Liberty Business Puerto Rico',
        meta: t('Cupey, PR', 'Cupey, PR'),
        current: false,
        startDate: '',
        description: t(
          'Soporte a clientes corporativos y empresariales durante una migración mayor de operador (de AT&T a Liberty PR), asegurando la continuidad del servicio de las cuentas de negocio.',
          'Supported corporate and enterprise clients during a major carrier migration (AT&T to Liberty PR), ensuring seamless service continuity for business accounts.'
        ),
        bullets: tl(
          [
            'Realicé desbloqueos de dispositivos móviles, cambios de plan, reemplazos de SIM y actualizaciones de equipos según los requerimientos de cada cliente.'
          ],
          [
            'Performed mobile device unlocks, plan changes, SIM replacements, and equipment upgrades per client requirements.'
          ]
        ),
        tech: ['Mobile Devices', 'SIM Provisioning', 'Carrier Migration']
      }
    ]
  },

  /* ---------------- Certificaciones (el resume no las lista aún) ---------------- */
  certifications: {
    title: t('Certificaciones', 'Certifications'),
    items: [
      {
        issuer: t('EN PROGRESO', 'IN PROGRESS'),
        name: t('Certificaciones por añadir', 'Certifications to be added'),
        detail: t('Pendiente de actualizar', 'Pending update'),
        tone: 'slate'
      }
    ]
  },

  /* ---------------- Educación e idiomas ---------------- */
  education: {
    title: t('Formación Académica & Idiomas', 'Education & Languages'),
    degrees: [
      {
        label: t('MAESTRÍA', 'MASTER’S DEGREE'),
        title: t('Maestría en Ciencias en Ciberseguridad', 'Master of Science in Cybersecurity'),
        detail: t(
          'Universidad Ana G. Méndez – Cupey · GPA: 4.00 · 2026',
          'Universidad Ana G. Méndez – Cupey · GPA: 4.00 · 2026'
        )
      },
      {
        label: t('BACHILLERATO', 'BACHELOR’S DEGREE'),
        title: t('Bachillerato en Ciencias en Ciencias de la Computación', 'Bachelor of Science in Computer Science'),
        detail: t(
          'Universidad Interamericana de Puerto Rico – Arecibo · GPA: 3.24 · 2024',
          'Universidad Interamericana de Puerto Rico – Arecibo · GPA: 3.24 · 2024'
        )
      }
    ],
    languagesTitle: t('Competencia Lingüística', 'Language Proficiency'),
    languages: [
      { name: t('Español', 'Spanish'), level: t('Bilingüe', 'Bilingual'), tone: 'emerald' },
      { name: t('Inglés', 'English'), level: t('Bilingüe', 'Bilingual'), tone: 'emerald' }
    ]
  },

  /* ---------------- Contacto ---------------- */
  contact: {
    badge: t('Contacto Profesional', 'Professional Contact'),
    heading: t(
      '¿Buscas un especialista en TI y ciberseguridad para tu equipo?',
      'Looking for an IT & cybersecurity specialist for your team?'
    ),
    description: t(
      'Experiencia práctica en entornos gubernamentales y corporativos: **Active Directory, infraestructura de red, imágenes de sistemas y soporte a usuarios finales**. Escríbeme y conversemos.',
      'Hands-on experience in government and corporate environments: **Active Directory, network infrastructure, system imaging, and end-user support**. Reach out and let’s talk.'
    ),
    email: 'padilla.jonathan80@yahoo.com',
    phone: '(787) 244-5306',
    location: 'Puerto Rico',
    linkedin: 'linkedin.com/in/jonathanlpadillagonzalez',
    linkedinUrl: 'https://www.linkedin.com/in/jonathanlpadillagonzalez',
    github: '',
    githubUrl: '',
    formTitle: t('Solicitar Entrevista Rápida', 'Request a Quick Interview'),
    successMessage: t(
      'Solicitud recibida. Me comunicaré contigo lo antes posible.',
      'Request received. I will get back to you as soon as possible.'
    )
  },

  /* ---------------- Pie de página ---------------- */
  footer: {
    brand: 'JONATHAN L. PADILLA',
    tagline: t('PORTAFOLIO PROFESIONAL DE TI', 'IT PROFESSIONAL PORTFOLIO')
  }
};
