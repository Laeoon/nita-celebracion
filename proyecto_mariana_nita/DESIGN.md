---
name: Nocturne Gala
colors:
  surface: '#16111e'
  surface-dim: '#16111e'
  surface-bright: '#3c3745'
  surface-container-lowest: '#100c18'
  surface-container-low: '#1e1926'
  surface-container: '#221d2a'
  surface-container-high: '#2d2835'
  surface-container-highest: '#383240'
  on-surface: '#e8dff1'
  on-surface-variant: '#debec8'
  inverse-surface: '#e8dff1'
  inverse-on-surface: '#332e3c'
  outline: '#a68992'
  outline-variant: '#574048'
  surface-tint: '#ffb0cd'
  primary: '#ffb0cd'
  on-primary: '#640039'
  primary-container: '#f751a1'
  on-primary-container: '#570032'
  inverse-primary: '#b4136d'
  secondary: '#ffb779'
  on-secondary: '#4c2700'
  secondary-container: '#d47b17'
  on-secondary-container: '#422100'
  tertiary: '#ddb7ff'
  on-tertiary: '#490080'
  tertiary-container: '#b76dff'
  on-tertiary-container: '#400071'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#ffd9e4'
  primary-fixed-dim: '#ffb0cd'
  on-primary-fixed: '#3e0022'
  on-primary-fixed-variant: '#8c0053'
  secondary-fixed: '#ffdcc1'
  secondary-fixed-dim: '#ffb779'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6c3a00'
  tertiary-fixed: '#f0dbff'
  tertiary-fixed-dim: '#ddb7ff'
  on-tertiary-fixed: '#2c0051'
  on-tertiary-fixed-variant: '#6900b3'
  background: '#16111e'
  on-background: '#e8dff1'
  surface-variant: '#383240'
typography:
  display-hero:
    fontFamily: Syne
    fontSize: 56px
    fontWeight: '800'
    lineHeight: 60px
    letterSpacing: -0.03em
  display-hero-mobile:
    fontFamily: Syne
    fontSize: 34px
    fontWeight: '800'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Syne
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 38px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Syne
    fontSize: 26px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Syne
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  title-sm:
    fontFamily: Syne
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
    letterSpacing: 0.02em
  body-lg:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Space Grotesk
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: 0.04em
  label-sm:
    fontFamily: Space Grotesk
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
    letterSpacing: 0.08em
  counter-number:
    fontFamily: Space Grotesk
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
rounded:
  sm: 0.5rem
  DEFAULT: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-desktop: 3rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system expresses an avant-garde neon-gothic party identity crafted for an elevated Halloween birthday celebration. It blends high-fashion Parisian soirée luxury with electric midnight club culture. The emotional register is dramatic, bewitching, playful, and ultra-chic—avoiding cheap horror clichés in favor of luminous obsidian velvet, fine champagne-gold contours, and vibrant magenta-tangerine gradients.

The design movement converges **Glassmorphism** and **Tactile Party Glamour**:
- **Surfaces:** Smoked crystalline obsidian glass with ultra-fine metallic hairline strokes.
- **Atmosphere:** Deep violet void background illuminated by chromatic embers of neon magenta and warm glowing pumpkin gold.
- **Energy:** Sculptural silhouettes, fluid pill forms, and neon-rimmed interactive components that create a nocturnal, celebratory pulse.

## Colors

The palette establishes an obsidian and twilight velvet foundation accented by incandescent gradients and subtle precious metals.

### Color Tokens & Roles
- **Primary (`#ec4899` - Electric Magenta):** Commands primary party actions, high-voltage highlights, music active states, and radiant gradient transitions.
- **Secondary (`#ff9d3b` - Tangerine Gold):** Evokes festive pumpkin embers, celebration accents, countdown digits, and warm flame badges.
- **Tertiary (`#a855f7` - Amethyst Witchcraft):** Provides supernatural aura glows, soft pill-chip fills, and secondary controls.
- **Neutral Surface System:**
  - `canvas`: `#0c0814` (Deepest velvet black-purple).
  - `surface-base`: `#150f22` (Smoked glass container base).
  - `surface-elevated`: `#1f1633` with 70% opacity and subtle backdrop blur.
  - `border-luminous`: `rgba(255, 157, 59, 0.22)` (Champagne ember hairline border).
  - `text-primary`: `#fcfaf7` (Warm cream ivory for effortless contrast).
  - `text-secondary`: `#b3a4cb` (Muted lilac mist for metadata and subtitles).

## Typography

The type scale combines **Syne**—an avant-garde, sculptural display sans with eccentric editorial flair—with **Space Grotesk** for razor-sharp tech-chic body and utility styling.

- **Syne** anchors key moments: hero announcements, guest dedications, and celebratory headlines. It provides high-fashion drama without descending into Halloween kitsch.
- **Space Grotesk** provides utilitarian rhythm for time units, audio trackers, action chips, and body copy.
- Special treatment: Upper-case editorial micro-tags (`label-sm`) carry subtle letter-spacing for VIP badge titles and date signifiers.

## Layout & Spacing

This design system uses a centered, card-centric fluid layout capped at a max-width of `480px` on mobile viewports and expandable up to `960px` for desktop galleries and media boards.

- **Rhythm & Grid:** Built on an 8pt modular grid. Outer canvas margins adjust from `1rem` on mobile to `3rem` on desktop screens.
- **Reflow Architecture:**
  - On mobile screens, cards stack vertically with persistent floating navigation docked at the top or bottom thumb zone.
  - The countdown matrix adapts from a 4-column inline cluster into a responsive flex bar.
  - Media cards and Polaroid galleries utilize fluid auto-fit grids spanning 1 column on mobile and 2–3 columns on tablet and desktop.

## Elevation & Depth

Visual hierarchy relies on translucent dark matter layering and chromatic neon halos rather than opaque shadows:

1. **Base Layer (Level 0):** Velvet background `#0c0814` with soft radial ambient gradients of `#ec4899` (top right, 12% opacity) and `#ff9d3b` (bottom left, 10% opacity).
2. **Glass Container Tier (Level 1):** Background `rgba(21, 15, 34, 0.75)` with `20px` backdrop blur, framed by a `1px` border of `rgba(255, 157, 59, 0.18)` and an inner rim light (`inset 0 1px 1px rgba(255, 255, 255, 0.08)`).
3. **Interactive Floating Pods (Level 2):** Floating navigation bars and music controls adopt `rgba(29, 20, 48, 0.90)`, bordered by `rgba(236, 72, 153, 0.35)` with an ambient drop-shadow: `0 12px 32px rgba(0, 0, 0, 0.55), 0 0 16px rgba(236, 72, 153, 0.20)`.
4. **Primary Action Aura (Level 3):** Glowing buttons feature dual cast shadows combining an orange-magenta bloom (`0 8px 24px rgba(236, 72, 153, 0.45)`) and a tight ember rim (`0 0 10px rgba(255, 157, 59, 0.5)`).

## Shapes

The shape hierarchy follows **Level 3 (Pill-shaped)**, creating smooth, organic, and hyper-curved silhouettes:

- **Buttons & Chips:** Full pill radius (`9999px` / `rounded-full`).
- **Cards & Primary Modules:** Generous `2rem` (`rounded-lg`) to `3rem` (`rounded-xl`) outer corners.
- **Countdown Pods & Inputs:** `1.25rem` smooth organic rectangles.
- **Floating Action Orbs:** Pure geometric circles for audio trigger icons, polaroid stamps, and sparkles.

## Components

### Buttons
- **Primary Hero Button:** Continuous horizontal gradient from Tangerine Gold (`#ff9d3b`) to Electric Magenta (`#ec4899`). Full pill radius (`9999px`), bold Syne text, pure white lettering, and a luminous ember shadow.
- **Secondary Ghost / Smoked Glass:** Dark violet fill (`rgba(40, 26, 64, 0.6)`), full pill radius, framed by an electric magenta or champagne gold stroke (`1px solid rgba(236, 72, 153, 0.4)`), with active states pulsing an inner glow.

### Countdown Modules
- Clustered inside a unified glass container or split into 4 equal pill-box cards.
- Background: Smoked obsidian glass (`rgba(16, 11, 26, 0.85)`).
- Value: Large `counter-number` in warm champagne-gold (`#ff9d3b`).
- Unit: Uppercase `label-sm` in muted amethyst mist (`#b3a4cb`).

### Chips & Filter Pills
- Highly curved pill buttons used for event categories and gallery filters.
- **Active State:** Solid gradient (`#ff9d3b` to `#ec4899`) or illuminated amethyst with glowing borders.
- **Inactive State:** Semi-transparent purple glass (`rgba(35, 23, 56, 0.7)`), fine golden border, subtle hover luminescence.
- Emoji accents and icons sit at `14px` optical alignment.

### Cards & Dedication Wall
- Amethyst glassmorphic surface (`#150f22` at 80% opacity) with a `1px` gradient border shifting from `rgba(255, 157, 59, 0.25)` to `rgba(236, 72, 153, 0.15)`.
- Avatars framed within concentric circular gradients resembling witchy party halos.
- Dedicated reaction pill badges (`¡Brutal! (19)`) anchored at the bottom right with warm tangerine highlight strokes.

### Audio Player & Interactive Controls
- Minimalist track scrubbing bar: `#322152` background track with an electric orange-to-magenta progress line and an amber circular thumb.
- Center circular play button with radiant multi-ring pulse effect on hover and active playback states.

### Form Inputs & Textareas
- Deep cavity background (`rgba(10, 7, 18, 0.8)`), inset soft shadow, framed by `1px solid rgba(255, 157, 59, 0.2)`.
- Focus state shifts border to vivid `#ec4899` with a soft 4px blur outer glow. Placeholder text set in muted lilac.