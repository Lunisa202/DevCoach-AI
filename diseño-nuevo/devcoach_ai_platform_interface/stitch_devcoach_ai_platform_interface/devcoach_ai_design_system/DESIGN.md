---
name: DevCoach AI Design System
colors:
  surface: '#031427'
  surface-dim: '#031427'
  surface-bright: '#2a3a4f'
  surface-container-lowest: '#000f21'
  surface-container-low: '#0b1c30'
  surface-container: '#102034'
  surface-container-high: '#1b2b3f'
  surface-container-highest: '#26364a'
  on-surface: '#d3e4fe'
  on-surface-variant: '#c7c4d8'
  inverse-surface: '#d3e4fe'
  inverse-on-surface: '#213145'
  outline: '#918fa1'
  outline-variant: '#464555'
  surface-tint: '#c3c0ff'
  primary: '#c3c0ff'
  on-primary: '#1d00a5'
  primary-container: '#4f46e5'
  on-primary-container: '#dad7ff'
  inverse-primary: '#4d44e3'
  secondary: '#d0bcff'
  on-secondary: '#3c0091'
  secondary-container: '#571bc1'
  on-secondary-container: '#c4abff'
  tertiary: '#bec6e0'
  on-tertiary: '#283044'
  tertiary-container: '#586076'
  on-tertiary-container: '#d4dbf5'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#e2dfff'
  primary-fixed-dim: '#c3c0ff'
  on-primary-fixed: '#0f0069'
  on-primary-fixed-variant: '#3323cc'
  secondary-fixed: '#e9ddff'
  secondary-fixed-dim: '#d0bcff'
  on-secondary-fixed: '#23005c'
  on-secondary-fixed-variant: '#5516be'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#031427'
  on-background: '#d3e4fe'
  surface-variant: '#26364a'
typography:
  display:
    fontFamily: Inter
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  code-snippet:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  2xl: 48px
  3xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 40px
---

## Brand & Style
The design system for this product is rooted in a "High-Fidelity Engineering" aesthetic. It targets a sophisticated audience of software developers and engineering leaders who value precision, speed, and clarity. The brand personality is authoritative yet supportive—acting as a high-performance co-pilot rather than a simple tool.

The visual style blends **Modern Corporate** efficiency with **Glassmorphism** accents. It draws heavy inspiration from the "linear" school of design: high-contrast typography, subtle micro-interactions, and a strict adherence to a systematic grid. The experience should feel instantaneous and "premium-monochromatic," using color only to indicate status or primary actions.

## Colors
The palette is centered on a deep Slate foundation to provide a restful environment for long coding sessions. 

- **Core Neutrals:** Use Slate-900 for primary backgrounds and Slate-800 for elevated surfaces in dark mode. In light mode, transition to Slate-50 and pure White respectively.
- **Accents:** Indigo-600 serves as the primary brand touchpoint. Use a linear gradient (Indigo-600 to Violet-500) at a 135-degree angle for primary call-to-action buttons and active progress states.
- **Functional Colors:** Amber, Emerald, and Red are reserved strictly for system feedback and code health status. They should be used with low-alpha backgrounds (e.g., 10% opacity) in their respective containers to maintain a sleek look.

## Typography
The system utilizes **Inter** for all UI elements to ensure maximum legibility and a neutral, systematic feel. 

- **Scale:** Use tight letter-spacing (-0.01em to -0.02em) for larger headlines to achieve that "refined" look typical of modern SaaS.
- **Hierarchy:** Maintain high contrast between headlines (Slate-50) and body text (Slate-400) in dark mode to guide the eye.
- **Monospace:** While not the primary UI font, **JetBrains Mono** must be used for all code blocks, diffs, and terminal outputs to maintain developer familiarity.

## Layout & Spacing
The layout follows a **Fluid Grid** logic with standardized gutters. 

- **Structure:** Use a 12-column grid for desktop views. Sidebars (e.g., File Explorers or Coaching Navigation) should be fixed at 240px or 280px, while the main content area remains fluid.
- **Rhythm:** An 8px linear scale governs all padding and margins. 
- **Adaptation:** On mobile, margins reduce to 16px, and multi-column layouts stack vertically. Complex code diffs should allow horizontal scrolling within their container rather than breaking the page width.

## Elevation & Depth
Depth is created through **Tonal Layers** and **Glassmorphism** rather than traditional heavy shadows.

- **Surface Tiers:** 
  - Level 0 (Background): Slate-900.
  - Level 1 (Cards/Sidebars): Slate-800 or Slate-900 with a 1px border of Slate-700.
  - Level 2 (Modals/Popovers): Slate-800 with a `shadow-lg` (0 10px 15px -3px rgba(0,0,0,0.5)).
- **Glassmorphism:** Use for overlays, navigation bars, and floating panels. Apply `backdrop-blur-md` with a background of `white/5` (Dark Mode) or `slate-900/5` (Light Mode).
- **Borders:** Use subtle 1px strokes (Slate-800) instead of shadows for secondary separation to keep the UI feeling "sharp."

## Shapes
The shape language is sophisticated and "soft-tech." 

- **Corners:** Use **12px (rounded-xl)** as the standard for cards and larger containers. Small components like buttons or input fields should use **8px (rounded-lg)**.
- **Consistent Enclosure:** Ensure that nested elements have a smaller border radius than their parent containers to maintain visual harmony (e.g., an 8px button inside a 12px card).

## Components
- **Buttons:** Primary buttons use the Indigo-to-Violet gradient with white text. Secondary buttons use a Slate-800 background with a 1px Slate-700 border. 
- **Input Fields:** Use a Slate-950 background with a 1px Slate-800 border. On focus, the border transitions to Indigo-600 with a subtle outer glow.
- **Chips:** Small, pill-shaped tags for "Language" or "Topic." Use low-saturation backgrounds (Slate-800) with Slate-300 text.
- **Lists:** Clean, borderless list items with 12px vertical padding. Use a subtle Slate-800 background on hover with 4px rounded corners.
- **Cards:** White (Light) or Slate-800 (Dark) with a 1px border. No shadows on base cards; use `shadow-lg` only for interactive/hover states.
- **Icons:** Use Lucide React icons with a 1.5px stroke width. Icons should always be monochrome (Slate-400) unless indicating a specific status (e.g., Emerald for "Success").