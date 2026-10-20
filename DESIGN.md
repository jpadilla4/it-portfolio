---
name: Sleek Modern IT Portfolio & Operations
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f4'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2fd'
  on-surface: '#131b2e'
  on-surface-variant: '#3f4850'
  inverse-surface: '#283044'
  inverse-on-surface: '#eef0ff'
  outline: '#707881'
  outline-variant: '#bfc7d2'
  surface-tint: '#006398'
  primary: '#006194'
  on-primary: '#ffffff'
  primary-container: '#007bb9'
  on-primary-container: '#fdfcff'
  inverse-primary: '#93ccff'
  secondary: '#0051d5'
  on-secondary: '#ffffff'
  secondary-container: '#316bf3'
  on-secondary-container: '#fefcff'
  tertiary: '#00628d'
  on-tertiary: '#ffffff'
  tertiary-container: '#007cb1'
  on-tertiary-container: '#fcfcff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cce5ff'
  primary-fixed-dim: '#93ccff'
  on-primary-fixed: '#001d31'
  on-primary-fixed-variant: '#004b73'
  secondary-fixed: '#dbe1ff'
  secondary-fixed-dim: '#b4c5ff'
  on-secondary-fixed: '#00174b'
  on-secondary-fixed-variant: '#003ea8'
  tertiary-fixed: '#c9e6ff'
  tertiary-fixed-dim: '#89ceff'
  on-tertiary-fixed: '#001e2f'
  on-tertiary-fixed-variant: '#004c6e'
  background: '#faf8ff'
  on-background: '#131b2e'
  surface-variant: '#dae2fd'
typography:
  headline-xl:
    fontFamily: Geist
    fontSize: 36px
    fontWeight: '600'
    lineHeight: 44px
    letterSpacing: -0.025em
  headline-xl-mobile:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Geist
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Geist
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
    letterSpacing: -0.015em
  headline-md:
    fontFamily: Geist
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Geist
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
    letterSpacing: -0.005em
  body-md:
    fontFamily: Geist
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
    letterSpacing: 0em
  body-sm:
    fontFamily: Geist
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 18px
    letterSpacing: 0em
  label-lg:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '500'
    lineHeight: 18px
    letterSpacing: 0.02em
  label-md:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.03em
  label-sm:
    fontFamily: JetBrains Mono
    fontSize: 10px
    fontWeight: '500'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an ultra-clean, high-density, yet remarkably airy operational interface for technical leaders, IT directors, and infrastructure architects. The aesthetic synthesizes Swiss-inspired corporate minimalism with precision technical utility: crisp white fields, cool-toned slate neutral steps, deep charcoal typography, and an electric cobalt primary accent.

Visual weight is communicated through typographic contrast, subtle spatial division, and low-contrast surface demarcations rather than heavy containers or artificial ornamentation. The emotional response is one of total operational clarity, calm authority, and instant situational awareness. Every element serves an explicit data-driven purpose, prioritizing scanning efficiency, low cognitive load, and razor-sharp data legibility across large-scale IT estates.

## Colors

The palette is engineered for extreme clarity and technical precision in a default high-contrast light mode:

- **Primary (`#0284c7`)**: Precision technical cerulean used for active navigation indicators, operational primary actions, focus boundaries, and critical metric highlights.
- **Secondary (`#2563eb`)**: High-contrast royal cobalt utilized for secondary actions, interactive links, deep states, and system health accents.
- **Tertiary (`#0ea5e9`)**: Cyan-leaning sky blue reserved for telemetry indicators, live network pulses, and active status badging.
- **Neutral (`#0f172a`)**: Deep rich slate-black for foundational typography, providing absolute contrast ratios against crisp white surfaces.

### Surface and Tone Tiers
- **Canvas Base**: Pure Crisp White (`#ffffff`) for root canvas and high-focus work surfaces.
- **Subtle Surface**: Cool Slate Tint (`#f8fafc`) for structural backgrounds, table headers, and structural sidebars.
- **Container Surface**: Soft Neutral Gray (`#f1f5f9`) for input backings, inactive hover fields, and subtle segment dividers.
- **Hairline Borders**: Whispering Slate Border (`#e2e8f0`) applied at 1px thickness strictly for structural separation.
- **Muted Text**: Cool Mid-Slate (`#64748b`) for metric labels, secondary attributes, and metadata.

## Typography

Typography relies on a deliberate balance between **Geist** for clean, low-contrast structural text and **JetBrains Mono** for all operational telemetry, status codes, server identifiers, and tabular numbers.

- **Geist** provides an austere, highly legible geometric framework suited for executive dashboards and technical reports. Headings utilize tight negative letter-spacing for razor-sharp cohesion.
- **JetBrains Mono** is enforced across all metric tickers, port values, IP addresses, uptime percentages, and status tags to ensure alignment, scannability, and engineering credibility.
- For high-density operational views, use `body-sm` paired with `label-md` to preserve vertical real estate without sacrificing readability.

## Layout & Spacing

The system implements a structured 12-column fluid grid system pinned to a fixed or collapsible 240px utility rail for global infrastructure management.

- **Desktop (1280px+)**: 12-column fluid grid with `2rem` (`margin`) outer boundaries and `1.25rem` (`gutter`) column gaps. Generous padding (`space-lg` to `space-xl`) isolates major metric groupings, keeping complex operations scanning frictionless.
- **Tablet (768px - 1279px)**: 8-column layout with `1.5rem` outer margins. Operations sidebars collapse to an icon rail (64px width); dual-column operational cards collapse to single-width containers.
- **Mobile (< 768px)**: 4-column layout with `1rem` (`margin-mobile`) and `0.75rem` (`gutter-mobile`). Tabular operational datasets transform into vertically stacked card lists.
- **Density Grid Rules**: Metric groups, operational status panels, and data tables use strict multiples of 4px/8px internal spacing to maintain mathematical alignment.

## Elevation & Depth

This system intentionally rejects heavy, drop shadows and fuzzy ambient light in favor of a crisp architectural approach:

- **Low-Contrast Outlines**: Depth is primarily articulated through razor-thin `1px` borders (`#e2e8f0`) separating pure white cards (`#ffffff`) from the cool canvas slate (`#f8fafc`).
- **Tonal Layering**: Nested panels and secondary groupings shift to a slightly deeper surface tone (`#f1f5f9`) rather than elevating with shadow.
- **Precision Micro-Shadows**: Overlays, dropdown menus, and modal dialogs use an ultra-diffused, sharp elevation profile: `0 4px 16px -2px rgba(15, 23, 42, 0.05), 0 1px 3px 0 rgba(15, 23, 42, 0.03)` wrapped in a 1px slate border (`#cbd5e1`).
- **Interactive Focus Elevation**: Hover states do not lift cards in z-space; instead, they shift border color to the primary blue (`#0284c7`) or neutral slate (`#94a3b8`) for instant, distraction-free feedback.

## Shapes

The shape architecture is calibrated to **Soft (Level 1)**, reflecting an engineered, high-precision instrument:

- Standard elements (buttons, inputs, status badges, metric tiles) utilize a subtle `0.25rem` (4px) border radius.
- Cards, data table containers, and modal dialogs step up to `0.5rem` (8px, `rounded-lg`).
- Fully rounded pill shapes are prohibited with the single exception of live ping indicators and operational heartbeat dots (which use standard circular avatars/dots).
- This conservative curvature reinforces square alignment, crisp tabular edges, and professional IT dashboard efficiency.

## Components

### Buttons
- **Primary**: Solid background in Primary Blue (`#0284c7`), text in pure white (`#ffffff`), 4px border radius. Hover state darkens to `#0369a1`. Active state applies an inset ring.
- **Secondary / Outline**: Crisp white background, 1px border (`#e2e8f0`), text in Slate-Black (`#0f172a`). Hover shifts background to `#f8fafc` and border to `#cbd5e1`.
- **Ghost**: Transparent background, text in `#64748b`, hover in `#f1f5f9` with text in `#0f172a`.

### Cards & Data Tiles
- Flat pure white surface (`#ffffff`) bounded by a 1px border (`#e2e8f0`).
- Internal padding is consistent at `1.25rem` (`space-lg`). Header zones are separated from card bodies by a clean 1px hairline divider with metric titles set in `label-md` uppercase.

### Tables & Tabular Layouts
- Full-bleed within card containers. Headers use `#f8fafc` background, uppercase `label-sm` tracking with muted text (`#64748b`), and bottom 1px border.
- Rows use 44px vertical height, monospaced tabular numerals (`JetBrains Mono`), and alternating transparent-to-`#fafafa` hover fills for immediate row tracking.

### Form Inputs & Selects
- Inputs feature a crisp white background with a 1px border (`#cbd5e1`), 4px radius, and standard padding of `8px 12px`.
- Focus state eliminates glowing rings, instead applying an exact `1px` solid Primary Blue (`#0284c7`) border with a subtle 2px outer tint (`#e0f2fe`).

### Status Badges & Telemetry Chips
- Compact, un-padded height (20px-24px), font set in `label-sm`.
- Built with tinted surface fills and matched border accents:
  - *Operational / Healthy*: Tint `#f0fdf4`, border `#bbf7d0`, text `#15803d`.
  - *Degraded / In-Progress*: Tint `#eff6ff`, border `#bfdbfe`, text `#1d4ed8`.
  - *Warning / Attention*: Tint `#fffbeb`, border `#fde68a`, text `#b45309`.
  - *Critical / Incident*: Tint `#fef2f2`, border `#fecaca`, text `#b91c1c`.

### Checkboxes & Radios
- Sharp 4px radius for checkboxes, standard circular geometry for radio controls.
- Hairline slate border (`#cbd5e1`) that transitions to solid `#0284c7` when checked, displaying a crisp white micro-glyph.