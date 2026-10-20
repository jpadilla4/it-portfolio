// Configuración de Tailwind compartida (sitio público y panel admin).
// Debe cargarse después del script CDN de Tailwind.
//
// Define la paleta del diseño base (DESIGN.md):
//  - brand:    azul cobalto para acciones y acentos.
//  - itblue:   azul cerúleo para detalles técnicos.
//  - graphite: escala de grises pizarra para texto, bordes y fondos.
// y las tipografías: Geist (texto, `font-sans`) y JetBrains Mono (datos, `font-mono`).
tailwind.config = {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a'
        },
        itblue: '#0284c7',
        graphite: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
          950: '#020617'
        }
      },
      fontFamily: {
        sans: ['Geist', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      }
    }
  }
};
