# OMDALA_THEME_SYSTEM.md

## OMDALA Official Theme System
## Design, Frontend, and Product Implementation Standard
## Version 1.0 — Final Brand Lock

---

## 1. PURPOSE

This file is the single source of truth for OMDALA's visual and design system.

It governs:
- color tokens
- gradient system
- typography
- spacing and shape
- component standards
- motion language
- surface language
- icon direction
- image direction
- copy tone
- page-level expression
- frontend implementation rules

This file applies to:
- omdala.com
- app.omdala.com
- all OMDALA-branded interfaces

No design or frontend decision should deviate from this file without explicit brand-level approval.

---

## 2. BRAND POSITION

OMDALA is the masterbrand and global operating layer.

OMDALA is:
- a global system brand
- a platform brand
- an infrastructure brand
- a product architecture brand

OMDALA is not:
- a local brand
- a tourism brand
- a community page
- a startup landing page
- a Web3 product
- a generic AI tool

Primary positioning statement:
> OMDALA is the global operating layer for real-world value, trust, and intelligent coordination.

Short version:
> OMDALA is the operating layer for a connected world.

Approved supporting lines:
- OMDALA activates people, places, and intelligence.
- OMDALA connects resources, trust, and action.
- OMDALA is where global coordination becomes structured and usable.

Approved taglines:
- The operating layer for real-world value.
- Activate people, places, and intelligence.
- A connected system for trust, coordination, and action.

**Preferred tagline:**
> The operating layer for real-world value.

---

## 3. BRAND ESSENCE

OMDALA must feel like:
- the Earth view from above
- a calm global operating system
- a civilization-scale interface
- a technology layer that quietly coordinates complexity

Core essence words:
- Global
- Intelligent
- Structured
- Calm
- Powerful
- Trustworthy
- Future-facing
- Systemic
- Human-centered
- Technology-enabled

OMDALA must feel like:
- global system
- planet-scale logic
- technology with clarity
- networked intelligence
- high-level architecture
- clean global trust
- cross-border coordination
- future infrastructure

OMDALA must never feel like:
- generic AI startup
- crypto dashboard
- developer toy
- bright SaaS template
- marketing-only site
- Web3 neon experiment

---

## 4. COLOR SYSTEM

### 4.1 Primary Color Tokens

```css
/* Space — global depth backgrounds */
--omdala-space-950: #040816;
--omdala-space-900: #08101F;
--omdala-space-850: #0B1326;
--omdala-space-800: #101C33;

/* Blue — technology and trust */
--omdala-blue-700: #153A72;
--omdala-blue-600: #1D5BBF;
--omdala-blue-500: #3D8BFF;
--omdala-blue-400: #6BB2FF;

/* Cyan — intelligence signal */
--omdala-cyan-500: #3DE7FF;
--omdala-cyan-400: #7EF2FF;

/* White — clarity */
--omdala-white-100: #F7FBFF;
--omdala-white-200: #DDE8F5;
--omdala-white-300: #BFCDE1;

/* Glow and accent */
--omdala-glow:   #63F5FF;
--omdala-accent: #6F8CFF;
```

### 4.2 Color Meaning

| Group | Meaning |
|-------|---------|
| Space | global depth, atmospheric foundation |
| Blue | technology, trust, intelligence |
| Cyan | intelligence signal, active connection |
| White | clarity, readability, interface precision |
| Glow / Accent | connected system energy, premium signal |

### 4.3 Color Rules

- OMDALA owns the blue-space-cyan identity.
- OMDALA must never adopt green as a primary identity color.
- Glow must be subtle, premium, restrained — never neon-cheap.
- Approved tone: deep navy, atmospheric blue, clean white, electric cyan, intelligent glow.

---

## 5. GRADIENT SYSTEM

### 5.1 Primary Background Gradient

```css
background: linear-gradient(
  135deg,
  #040816 0%,
  #08101F 30%,
  #153A72 65%,
  #3D8BFF 100%
);
```

Meaning: space → atmosphere → intelligence → activation

### 5.2 Secondary Glow Layer

```css
background: radial-gradient(
  circle at top right,
  rgba(99, 245, 255, 0.18),
  transparent 45%
);
```

Use for:
- hero background glow layer
- map node ambient glow
- hover and focus states
- section accent overlays

### 5.3 Gradient Rules

- Do not use gradients that feel neon or gaming-inspired.
- Glow layers must be applied with low opacity (0.12–0.22 max).
- Never stack two saturated gradients without a dark base layer underneath.

---

## 6. TYPOGRAPHY SYSTEM

### 6.1 UI and Body Fonts

```
Inter
SF Pro
Manrope
```

Use for:
- all UI text
- body copy
- menus and navigation
- forms and inputs
- dashboard and data interfaces
- cards and labels

### 6.2 Brand and Heading Fonts

```
Sora
Manrope
General Sans (if licensed and approved)
```

Use for:
- hero headings
- key headlines
- brand sections
- big statement blocks

### 6.3 Typography Tone

- clean
- global
- confident
- architectural
- calm

### 6.4 Typography Rules

- Do not use decorative serif fonts.
- Do not use playful or casual fonts.
- Do not use overly geometric techno fonts.
- Maintain wide tracking in large brand contexts for premium restraint.

---

## 7. SPACING AND SHAPE SYSTEM

### 7.1 Spacing Scale

```
4px
8px
12px
16px
20px
24px
32px
40px
48px
64px
96px
```

### 7.2 Border Radius Scale

```
12px
16px
20px
28px
999px  — pills only
```

### 7.3 Shape Character

- Rounded corners with controlled softness.
- More structured and precise than soft-cute.
- Slightly architectural and modular-grid feeling.
- Not sharp-edged. Not overly rounded.

---

## 8. SURFACE AND CARD SYSTEM

### 8.1 Card Standard

```css
background:      rgba(255, 255, 255, 0.05);
border:          1px solid rgba(255, 255, 255, 0.08);
backdrop-filter: blur(20px);
border-radius:   20px;
box-shadow:      0 20px 40px rgba(0, 0, 0, 0.22);
```

### 8.2 Surface Tone

OMDALA surfaces must feel like:
- future operating layer
- intelligence console
- planetary interface

Surface language keywords:
- glass-dark
- thin borders
- quiet glow
- rounded but precise
- deep contrast

### 8.3 Border Opacity Presets

```
0.06
0.08
0.12
```

### 8.4 Blur Presets

```
12px
20px
28px
```

---

## 9. SHADOW SYSTEM

```css
/* sm */
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);

/* md */
box-shadow: 0 8px 20px rgba(0, 0, 0, 0.16);

/* lg */
box-shadow: 0 16px 32px rgba(0, 0, 0, 0.20);

/* xl */
box-shadow: 0 24px 48px rgba(0, 0, 0, 0.26);
```

---

## 10. BUTTON SYSTEM

### 10.1 Primary Button

```css
.btn-omdala-primary {
  background:    linear-gradient(135deg, #153A72, #3D8BFF);
  color:         #F7FBFF;
  border-radius: 999px;
  font-family:   Inter, SF Pro, Manrope, sans-serif;
  font-weight:   500;
  transition:    all 250ms ease;
}

.btn-omdala-primary:hover {
  box-shadow: 0 0 20px rgba(99, 245, 255, 0.22);
  transform:  translateY(-1px);
}
```

### 10.2 Secondary Button

```css
.btn-omdala-secondary {
  background:    transparent;
  border:        1px solid rgba(255, 255, 255, 0.14);
  color:         #DDE8F5;
  border-radius: 999px;
  transition:    all 250ms ease;
}

.btn-omdala-secondary:hover {
  border-color: rgba(99, 245, 255, 0.35);
  color:        #F7FBFF;
}
```

### 10.3 Button Rules

- Hover must use subtle glow and lift — no aggressive shine.
- Never use bouncy or playful hover animation.
- All buttons must use 999px radius (pill shape) for primary actions.

---

## 11. MOTION SYSTEM

### 11.1 Transition Presets

```css
--transition-fast:   150ms ease;
--transition-base:   250ms ease;
--transition-slow:   400ms ease;
--transition-slower: 600ms ease;
```

### 11.2 Motion Principles

OMDALA motion must be:
- slow
- calm
- intentional
- breathing
- gliding
- layered

OMDALA motion must never be:
- flashy
- over-bouncy
- gaming UI style
- Web3 hyper-glow behavior
- TikTok-like

### 11.3 Approved Motion Patterns

- Subtle orbital movement
- Slow map and network pulses
- Global network glow breathing
- Field expansion on scroll
- Connection line reveals
- Node pulse (low opacity, low scale delta)
- Worldfield shimmer (very slow, 8–12 second loops)
- Slow gradient drift (radial layer shifting subtly)

---

## 12. BACKGROUND TREATMENT

Main background concept: deep-space system layer

Use:
- dark blue-black gradients
- subtle atmospheric depth (no literal stars)
- data field glow
- map-like ambient signal overlays

Do not use:
- space cliché with stars everywhere
- sci-fi noise textures
- generic tech wallpaper patterns
- bright or saturated backgrounds

---

## 13. ICON SYSTEM

### 13.1 Icon Principles

Icons must express:
- node
- connection
- flow
- trust
- place
- signal
- network
- action

Icons must be:
- clean line-based
- softly rounded
- slightly organic (not sharp cyberpunk)
- not childish
- not corporate-generic

### 13.2 OMDALA Icon Tone

- More abstract
- More networked
- More system-like
- More orbital or global graph
- Consistent stroke weight across all icons

---

## 14. LOGO DIRECTION

### 14.1 Concept

OMDALA logo must represent:
- global field
- networked intelligence
- systemic coordination
- planet-scale presence

Do not use:
- generic globe icon
- generic AI spark icon
- generic circuit board icon
- orbit clichés

Preferred concept:
- central field or orbital-node structure symbolizing interconnected systems around a coherent core

Possible geometry:
- circle + orbit lines
- multi-node halo
- global ring structure
- subtle network sphere

### 14.2 Wordmark

```
OMDALA
```

- Uppercase preferred for primary lockup.
- Clean sans-serif.
- Wide spacing.
- Premium restraint.
- No decorative treatments.

---

## 15. IMAGE DIRECTION

### 15.1 Approved Imagery

Use:
- global maps and abstract systems
- intelligent nodes and connected geographies
- premium macro interfaces
- humanity + infrastructure themes
- data + place + people relationships

### 15.2 Forbidden Imagery

Avoid:
- stock startup meetings
- random laptops with code
- generic coders on dark screens
- smiling office clichés
- AI-cliché robot imagery
- sci-fi fantasy renders

---

## 16. NAVIGATION SYSTEM

### 16.1 Tone

- global
- architectural
- clear
- system-wide

### 16.2 Suggested Primary Navigation

```
What is OMDALA
How it Works
For Experts
For Hosts
For Communities
Trust
OMDALAT
Docs
Enter App
```

### 16.3 Navigation Rules

- Navigation must feel like entering a system, not a marketing site.
- Items must be precise and purposeful.
- No playful or casual naming.

---

## 17. COPY AND VOICE SYSTEM

### 17.1 Voice Attributes

- clear
- elevated
- global
- calm
- precise
- strategic
- confident
- not noisy

### 17.2 Approved Copy Examples

```
The operating layer for real-world value.
A connected system for people, places, and trust.
Coordinate resources. Build trust. Create outcomes.
Intelligent coordination at planetary scale.
Where global systems become structured and usable.
```

### 17.3 Content Must Answer

- What is the system
- How it works
- Why it matters globally
- Why this is different
- How trust and coordination work
- Where to enter

Rule: OMDALA content = explanation. Establish the system, define its logic, prove its value.

---

## 18. PAGE-LEVEL EXPRESSION

### 18.1 omdala.com Homepage

Must feel like:
- global interface
- system architecture
- future operating layer

Hero visual direction:
- network field
- planetary logic
- orchestration glow
- calm intelligence

Key sections:
1. Hero — global system statement + primary CTA
2. What OMDALA is — system explanation
3. How it works — coordination and trust logic
4. Who it serves — Experts, Hosts, Communities
5. OMDALAT — first proof node (link out)
6. Trust architecture — verification and credibility layer
7. Enter — app CTA

### 18.2 app.omdala.com

Must feel like:
- control layer
- global dashboard
- structured intelligence
- resource coordination engine

---

## 19. DARK MODE RULE

Primary mode: **dark-first**

Reason:
- global
- premium
- infrastructure
- atmospheric

Light mode is allowed as a future extension but dark is the primary identity.
All components and tokens must be designed dark-first.

---

## 20. DESIGN TOKEN FOUNDATION

### 20.1 Semantic Tokens

```css
:root {
  /* Backgrounds */
  --omdala-bg-primary:    #040816;
  --omdala-bg-secondary:  #08101F;
  --omdala-bg-tertiary:   #0B1326;
  --omdala-bg-elevated:   #101C33;

  /* Text */
  --omdala-text-primary:   #F7FBFF;
  --omdala-text-secondary: #DDE8F5;
  --omdala-text-muted:     #BFCDE1;

  /* Accents */
  --omdala-accent-primary: #3D8BFF;
  --omdala-accent-glow:    #63F5FF;
  --omdala-accent-soft:    #6F8CFF;

  /* Borders */
  --omdala-border-subtle:  rgba(255, 255, 255, 0.06);
  --omdala-border-default: rgba(255, 255, 255, 0.08);
  --omdala-border-strong:  rgba(255, 255, 255, 0.12);

  /* Radius */
  --omdala-radius-sm:   12px;
  --omdala-radius-md:   16px;
  --omdala-radius-lg:   20px;
  --omdala-radius-xl:   28px;
  --omdala-radius-pill: 999px;

  /* Blur */
  --omdala-blur-sm: 12px;
  --omdala-blur-md: 20px;
  --omdala-blur-lg: 28px;

  /* Transitions */
  --omdala-transition-fast:   150ms ease;
  --omdala-transition-base:   250ms ease;
  --omdala-transition-slow:   400ms ease;
  --omdala-transition-slower: 600ms ease;
}
```

### 20.2 Theme Scope

```css
.theme-omdala {
  /* Apply all OMDALA tokens here */
  color-scheme: dark;
  background:   var(--omdala-bg-primary);
  color:        var(--omdala-text-primary);
}
```

---

## 21. FRONTEND IMPLEMENTATION RULES

### 21.1 File Structure

```
tokens.css          — shared spacing, radius, blur, transition
theme-omdala.css    — OMDALA-specific color and semantic tokens
theme-omdalat.css   — OMDALAT-specific tokens (separate file)
```

### 21.2 Developer Rules

DEV must:
- implement design tokens first before any component
- use semantic token names, never hardcode raw hex in components
- respect the masterbrand hierarchy — OMDALA is the global layer
- reuse the shared component family
- keep motion subtle and within the approved presets
- maintain typography consistency using the defined font stack
- use the shared spacing scale only
- keep dark-first as the default rendering mode

DEV must not:
- pick random colors outside the token system
- copy public UI kits and apply them directly
- add visual effects (glow, blur, animation) outside this specification
- introduce new naming styles or token names
- use inconsistent border-radius values
- invent off-brand gradients
- use clipart-style or generic icons
- use generic AI imagery or sci-fi clichés

---

## 22. COMPONENT FAMILY CHECKLIST

The following components must exist in the OMDALA design system:

- [ ] Buttons (primary, secondary, ghost)
- [ ] Cards (default, elevated, glass)
- [ ] Navigation bar
- [ ] Tabs
- [ ] Inputs and forms
- [ ] Modals and overlays
- [ ] Badges and status chips
- [ ] Node cards
- [ ] Trust indicators
- [ ] Map layer components
- [ ] Hero section pattern
- [ ] Section dividers

All components must:
- use tokens, not hardcoded values
- support dark mode as primary
- follow the motion system presets
- maintain consistent radius and spacing

---

## 23. FIGMA STRUCTURE CONVENTION

Design team naming in Figma:

```
Brand / OMDALA / Colors
Brand / OMDALA / Typography
Brand / OMDALA / Logo
Brand / OMDALA / Motion
Shared / Components / Buttons
Shared / Components / Cards
Shared / Components / Nav
Shared / Tokens / Spacing
Shared / Tokens / Radius
Shared / Tokens / Shadows
```

Figma pages to create:
- OMDALA Foundation
- Shared Component Library
- Global Token Sheet
- Type Ramp
- Button System
- Card System
- Nav System
- Hero Patterns
- Map Patterns
- Motion Notes

---

## 24. FINAL DIRECTIVE

Build OMDALA as the global brand system.

Its visual language must express:
- planetary scale
- deep technology
- system trust
- calm power
- connected infrastructure

OMDALA must always feel like:
- the operating layer above complexity
- a system that coordinates at global scale
- calm, intelligent, trustworthy infrastructure

This file is the final brand lock for OMDALA.

No visual, theme, or component direction should move outside this system without explicit brand-level approval.

---

*OMDALA_THEME_SYSTEM.md — Version 1.0*
*Status: Final Brand Lock*
