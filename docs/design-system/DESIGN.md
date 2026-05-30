# Design System: Soulstory

> Editorial-mystical brand system for a storytelling branding consultancy. Warm parchment canvas in dialogue with deep indigo void, anchored by a sans-humanist + classical-serif typographic pair, brand-tinted shadows, and the signature `(...)` glyph as recurring visual motif.

## 1. Visual Theme & Atmosphere

Soulstory's visual language is best understood as a *literary salon staged at twilight*. The brand operates at the intersection of two worlds: the rigor of strategic branding and the contemplative depth of mythic storytelling. Its system is built to feel less like a tech product and more like a well-bound book sitting on a thoughtful curator's desk.

The foundational gesture is the alternation between **Parchment** (`#FAF8F5`), a warm cream that evokes high-grade paper, and **Deep Indigo Void** (`#0C0B14`), a near-black with violet undertone that reads as nocturnal rather than digital. These are not "light mode" and "dark mode" in the conventional sense; they are **two narrative environments** that the brand inhabits with equal authority. Sections of any product, deck, or page can move between them like chapters in a book, and the brand identity holds either way.

The signature typographic pairing is **Mr Eaves Sans OT** (a humanist sans-serif with classical proportions, descended from John Baskerville via Zuzana Licko) for headlines, navigation, and UI text, paired with **Minion 3 Pro** (a Renaissance-style serif by Robert Slimbach) for editorial passages, taglines, and quoted matter. This dual-voice system mirrors the brand's thesis: Mr Eaves carries the strategic clarity, Minion carries the soulful editorial weight. Where most consultancies pick one and apologize for it, Soulstory uses both with deliberate role separation.

The chromatic system orbits around an **indigo-violet axis** (`#3D396E` to `#8E9FEE` to `#E1E4F6`) with a single **sky-blue accent** (`#8CC6FF`) reserved for moments of clarity, awakening, or transition. There are no warm reds, oranges, or greens in the system. Color saturation is restrained: the brightest violet is a soft lavender, never a saturated electric purple. This reads as quiet authority rather than flashy attention-grab.

The recurring visual element is the brand glyph: `(...)`. Two parenthesis arcs framing three dots. It encodes the brand thesis in a single mark: every story has an opening, a pause that holds suspense, and an unfinished continuation. This glyph appears as page mark, decorative ornament, section divider, breath indicator in editorial layouts, and ambient signature in the corner of cards and slides.

**Key Characteristics:**

- Dual-canvas system: Parchment `#FAF8F5` and Deep Indigo Void `#0C0B14`, alternated like book chapters
- Mr Eaves Sans OT for structural typography, Minion 3 Pro for editorial and quoted matter, never substituted for each other
- Indigo-violet primary palette (`#3D396E` / `#8E9FEE`), sky-blue secondary accent (`#8CC6FF`), no warm chromatic colors
- Brand-tinted shadows using `rgba(60, 57, 110, ...)`, never neutral gray drop shadows
- Whisper borders: `rgba(60, 57, 110, 0.10)` on light, `rgba(225, 228, 246, 0.08)` on dark
- Ring shadows for interactive states, drop shadows reserved for elevated content
- Generous body line-height (1.60 to 1.70) for editorial reading rhythm
- Border-radius scale running from 8px to 32px, never sharp, never pill
- Flat black-and-white organic illustrations as the primary supporting visual asset
- The `(...)` glyph as recurring brand mark across surfaces

## 2. Color Palette & Roles

### Primary Brand

- **Indigo Authority** (`#3D396E`): The core brand color. Used for primary brand moments, headers in light mode that need extra gravitas, and as the secondary CTA background. A deep violet-indigo, the visual equivalent of "the Magician at twilight."
- **Lavender Insight** (`#8E9FEE`): The interactive accent. Primary link color, hover states, focus rings, and the lighter brand voice on dark surfaces. Carries the brand without overwhelming a layout.
- **Sky Awakening** (`#8CC6FF`): The clarity accent. Reserved for moments of transition, attribution text on dark quote cards, link color on `#0C0B14` surfaces, and clarity-themed badges. The single "cool light" color in the system.

### Surface

- **Parchment Canvas** (`#FAF8F5`): The default light-mode page background. A warm cream with imperceptible yellow undertone. Never substitute pure white for this surface.
- **Warm Veil** (`#F1EFEC`): The secondary light surface for subtle separation, alternating section backgrounds, and muted card fills against Parchment.
- **Pure White** (`#FFFFFF`): Reserved exclusively for elevated cards on Parchment, button surfaces requiring maximum contrast, and image-heavy containers. Avoid as page background.
- **Mist Lavender** (`#E1E4F6`): Tinted surface for badge backgrounds, callout boxes, and atmospheric depth panels. The lightest member of the indigo family.

### Dark Surface Hierarchy

- **Deep Indigo Void** (`#0C0B14`): The default dark-mode page background. Near-black with violet undertone. The contemplative, nocturnal canvas.
- **Elevated Void** (`#15131F`): One step up from the void. Card backgrounds, dropdowns, and elevated containers on dark.
- **Surface Indigo** (`#1F1B2E`): The lightest dark surface. Hover states, slightly elevated UI, code blocks on dark.

### Text Tokens (derived via opacity for warmth)

The text scale is built using the canvas color at calibrated opacities, rather than a separate gray scale. This keeps the palette unified and inherits the warmth of the canvas.

**On Light Surfaces (Parchment, Warm Veil, White, Mist):**

- **Text Primary**: `#0C0B14` (the void as ink)
- **Text Body**: `rgba(12, 11, 20, 0.78)`, used for paragraph body
- **Text Secondary**: `rgba(12, 11, 20, 0.62)`, used for descriptions and captions
- **Text Tertiary**: `rgba(12, 11, 20, 0.46)`, used for metadata and timestamps
- **Text Muted**: `rgba(12, 11, 20, 0.32)`, used for placeholders and disabled labels

**On Dark Surfaces (Void, Elevated, Surface Indigo):**

- **Text Primary**: `#FAF8F5` (parchment as light)
- **Text Body**: `rgba(250, 248, 245, 0.82)`
- **Text Secondary**: `rgba(250, 248, 245, 0.66)`
- **Text Tertiary**: `rgba(250, 248, 245, 0.48)`
- **Text Muted**: `rgba(250, 248, 245, 0.32)`

### Borders

- **Whisper Border (light)**: `1px solid rgba(60, 57, 110, 0.10)`. The default division line on Parchment surfaces. Indigo-tinted, barely visible.
- **Whisper Border (dark)**: `1px solid rgba(225, 228, 246, 0.08)`. The dark-surface counterpart, lavender-tinted.
- **Standard Border (light)**: `1px solid rgba(60, 57, 110, 0.18)`. For cards needing more presence, input fields, and prominent containers.
- **Standard Border (dark)**: `1px solid rgba(225, 228, 246, 0.14)`.
- **Active Border**: `1px solid #8E9FEE`. Focus and selected states on inputs and interactive cards.

### Shadow Colors

All Soulstory shadows are tinted with the brand indigo. Never use neutral gray or pure black for shadow color. The tint creates atmospheric depth that ties elevation to brand identity.

- **Shadow Indigo Soft**: `rgba(60, 57, 110, 0.04)`, ambient layer
- **Shadow Indigo Standard**: `rgba(60, 57, 110, 0.08)`, mid-elevation
- **Shadow Indigo Deep**: `rgba(60, 57, 110, 0.16)`, modal and floating panels
- **Shadow Black Trace**: `rgba(0, 0, 0, 0.04)`, secondary layer for compound shadows

### Status (used sparingly)

Soulstory does not have a saturated success/error/warning palette. When status is needed, use:

- **Success**: `#5C8B7A` (a muted sage-green, warm-cool)
- **Error**: `#9B4444` (a deep brick, warmer than alarm-red)
- **Warning**: `#9B7C44` (a deep amber, never bright yellow)
- **Info**: `#8CC6FF` (the existing Sky Awakening)

These are intentionally desaturated to preserve the editorial-mystical atmosphere. Never introduce neon greens, electric reds, or saturated yellows.

## 3. Typography Rules

### Font Family

- **Sans (structural)**: `Mr Eaves Sans OT`, with fallbacks: `Avenir Next, Avenir, Helvetica Neue, system-ui, Arial`
- **Serif (editorial)**: `Minion 3 Pro`, with fallbacks: `Minion Pro, Garamond, Georgia, serif`
- **Mono (code, optional)**: `JetBrains Mono`, with fallbacks: `ui-monospace, SF Mono, Menlo, monospace`

The sans is the default UI voice. The serif is the editorial voice. The mono is a tertiary tool, used only for code, technical labels, and deliberate "manuscript metadata" moments.

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|----------------|-------|
| Display Hero | Mr Eaves Sans OT | 72px (4.50rem) | 400 | 1.05 | -1.8px | Maximum impact. Light weight as luxury, whispered authority |
| Display Large | Mr Eaves Sans OT | 56px (3.50rem) | 400 | 1.08 | -1.4px | Secondary hero, feature headlines |
| Display | Mr Eaves Sans OT | 44px (2.75rem) | 500 | 1.12 | -1.0px | Major section anchors |
| Heading 1 | Mr Eaves Sans OT | 36px (2.25rem) | 500 | 1.18 | -0.6px | Page titles, primary headings |
| Heading 2 | Mr Eaves Sans OT | 28px (1.75rem) | 500 | 1.25 | -0.4px | Sub-section headings |
| Heading 3 | Mr Eaves Sans OT | 22px (1.38rem) | 500 | 1.30 | -0.2px | Card titles, feature names |
| Heading 4 | Mr Eaves Sans OT | 18px (1.13rem) | 500 | 1.35 | normal | Inline section markers |
| Tagline (Italic) | Minion 3 Pro | 14px (0.88rem) | 400 italic | 1.45 | 0.2px | Eyebrow taglines above headlines (e.g. "Tagline example") |
| Body Large | Mr Eaves Sans OT | 18px (1.13rem) | 400 | 1.65 | normal | Introduction paragraphs, feature descriptions |
| Body | Mr Eaves Sans OT | 16px (1.00rem) | 400 | 1.60 | normal | Standard reading text |
| Body Medium | Mr Eaves Sans OT | 16px (1.00rem) | 500 | 1.50 | normal | Navigation, emphasized UI text |
| Body Small | Mr Eaves Sans OT | 15px (0.94rem) | 400 | 1.55 | normal | Compact body, secondary text |
| Editorial Body | Minion 3 Pro | 17px (1.06rem) | 400 | 1.70 | normal | Long-form passages, manifesto-style content |
| Pull Quote | Minion 3 Pro | 28px (1.75rem) | 400 | 1.30 | normal | Featured quotes, manifesto callouts |
| Pull Quote Sans | Mr Eaves Sans OT | 32px (2.00rem) | 400 | 1.20 | -0.4px | Sans variant for graphic quote cards (see Einstein card pattern) |
| Attribution (Italic) | Minion 3 Pro | 14px (0.88rem) | 400 italic | 1.45 | normal | Author lines, source citations on quote cards |
| Caption | Mr Eaves Sans OT | 14px (0.88rem) | 400 | 1.50 | normal | Image captions, helper text |
| Label | Mr Eaves Sans OT | 13px (0.81rem) | 500 | 1.40 | 0.1px | Form labels, badges |
| Button | Mr Eaves Sans OT | 15px (0.94rem) | 500 | 1.00 | normal | Primary button text |
| Overline | Mr Eaves Sans OT | 11px (0.69rem) | 500 | 1.40 | 0.6px | Uppercase eyebrow labels, category markers |
| Micro | Mr Eaves Sans OT | 12px (0.75rem) | 400 | 1.40 | 0.1px | Smallest functional text |

### Principles

- **Two voices, one document.** Mr Eaves Sans OT carries structure (titles, navigation, UI). Minion 3 Pro carries soul (taglines, pull quotes, editorial body). The two never substitute for each other. A heading is always sans, a tagline is always serif italic.
- **Light weight as authority.** Display sizes (44px and above) use weight 400 rather than the conventional 600 or 700. Soulstory's headlines whisper rather than shout. The light weight reads as confident depth, not weakness.
- **Negative letter-spacing at scale.** Display and heading sizes track tightly: -1.8px at 72px, easing back to normal at body sizes (16px). This compresses headlines into dense, deliberate blocks while preserving readable body.
- **Generous body line-height.** Body text uses 1.60 to 1.65, editorial body uses 1.70. This creates a reading rhythm closer to a book than a dashboard. Never reduce body line-height below 1.50.
- **Italic Minion as eyebrow signature.** The "Tagline example" pattern in Soulstory mockups uses Minion 3 Pro italic at 14px above sans headlines. This is a *signature pattern*: italic serif eyebrow plus light sans headline. Use it consistently for feature introductions.
- **Single weight per family.** Mr Eaves uses primarily 400 and 500 (display headlines stay at 400 for the whispered effect, secondary headings move to 500 for stability). Minion 3 Pro is used at 400 only, italic when tagline or attribution role requires it.

## 4. Component Stylings

### Buttons

**Primary CTA (Void)**

- Background: `#0C0B14`
- Text: `#FAF8F5`
- Padding: `12px 24px`
- Radius: `10px`
- Font: Mr Eaves Sans OT 15px weight 500
- Hover: `#1F1B2E` background plus ring shadow `0 0 0 1px rgba(60, 57, 110, 0.18)`
- Use: Primary marketing CTA, "Start your story", "Book a consultation"

**Brand CTA (Indigo)**

- Background: `#3D396E`
- Text: `#FAF8F5`
- Padding: `12px 24px`
- Radius: `10px`
- Font: Mr Eaves Sans OT 15px weight 500
- Hover: `#2D2A52` background
- Use: Secondary primary CTA when Void is too heavy or for in-content CTAs

**Outline (Void on Light)**

- Background: transparent
- Text: `#0C0B14`
- Padding: `12px 24px`
- Radius: `10px`
- Border: `1px solid #0C0B14`
- Hover: background shifts to `rgba(12, 11, 20, 0.06)`
- Use: Secondary action, "Learn more", "View case studies"

**Outline (Parchment on Dark)**

- Background: transparent
- Text: `#FAF8F5`
- Padding: `12px 24px`
- Radius: `10px`
- Border: `1px solid #FAF8F5`
- Hover: background shifts to `rgba(250, 248, 245, 0.08)`
- Use: Secondary action on dark sections

**Ghost (Lavender Link)**

- Background: transparent
- Text: `#3D396E` (light) or `#8E9FEE` (dark)
- Padding: `8px 0px`
- Underline on hover
- Use: Tertiary text-link actions

### Cards & Containers

**Standard Card (Light)**

- Background: `#FFFFFF` or `#FAF8F5`
- Border: `1px solid rgba(60, 57, 110, 0.10)` (whisper)
- Radius: `12px` (compact), `16px` (standard), `20px` (featured)
- Shadow: multi-layer indigo-tinted (see Depth section)
- Padding: `24px` to `32px` internal

**Standard Card (Dark)**

- Background: `#15131F`
- Border: `1px solid rgba(225, 228, 246, 0.08)`
- Radius: same as light
- Shadow: minimal, depth comes from surface contrast

**Quote Card (Signature Pattern)**

This is a signature Soulstory layout, exemplified by the "Creativity is intelligence having fun" mockup.

- Background: `#0C0B14`
- Quote text: Mr Eaves Sans OT 32px weight 400, line-height 1.20, color `#FAF8F5`
- Attribution: Minion 3 Pro 14px italic, color `#8CC6FF`
- Padding: `48px 40px`, generous breathing room
- Radius: `12px` to `16px`
- Bottom-right corner: the `(...)` glyph in muted Parchment (`rgba(250, 248, 245, 0.6)`) at small size
- Use: Manifesto cards, social media quote posts, slide separators

**Featured Card (with Illustration)**

The mockup pattern with a flat illustration paired with tagline plus headline plus body plus dual CTAs.

- Background: `#FAF8F5` or `#FFFFFF`
- Layout: 50/50 horizontal split (illustration left, copy right) on desktop, stacked on mobile
- Illustration: flat black-and-white organic style, full-bleed within card
- Tagline: Minion 3 Pro 14px italic, color `#8E9FEE` or `#3D396E`
- Headline: Mr Eaves Sans OT 32px to 40px weight 500
- Body: Mr Eaves Sans OT 16px weight 400, line-height 1.60, color body token
- Dual CTAs: Primary Void plus Outline Void, side by side
- Radius: `16px` to `24px`

### Inputs & Forms

- Background: `#FFFFFF` (light) or `#15131F` (dark)
- Border: `1px solid rgba(60, 57, 110, 0.18)` (light) or `1px solid rgba(225, 228, 246, 0.14)` (dark)
- Radius: `10px`
- Padding: `12px 16px`
- Text: Mr Eaves Sans OT 16px weight 400
- Placeholder: text muted token
- Focus: border shifts to `#8E9FEE`, plus ring `0 0 0 3px rgba(142, 159, 238, 0.20)`
- Label: Mr Eaves Sans OT 13px weight 500, color text secondary, positioned above input with 8px spacing

### Navigation

- Sticky top nav, background `rgba(250, 248, 245, 0.85)` with `backdrop-filter: blur(12px)` for light, `rgba(12, 11, 20, 0.85)` blurred for dark
- Logo: SOULSTORY wordmark plus `(...)` glyph, left-aligned
- Links: Mr Eaves Sans OT 15px weight 500, text primary
- Hover: text shifts to `#3D396E` (light) or `#8E9FEE` (dark), no underline
- CTA: Primary or Brand button right-aligned
- Border-bottom: whisper border for separation
- Mobile: hamburger toggle, full-screen overlay with stacked links

### Badges & Pills

- Background: `#E1E4F6` (light contexts) or `rgba(142, 159, 238, 0.14)` (dark contexts)
- Text: `#3D396E` (light) or `#8E9FEE` (dark)
- Padding: `4px 10px`
- Radius: `6px` (sharp pill, not fully round)
- Font: Mr Eaves Sans OT 13px weight 500, letter-spacing 0.1px
- Border: optional `1px solid rgba(60, 57, 110, 0.18)` for emphasis

### The `(...)` Glyph as Component

This is a Soulstory-specific component, with no direct equivalent in reference systems. Treat the brand glyph as a reusable design element with consistent rules.

- **Page mark**: bottom-right corner of cards and slides, color matched to canvas inverse at 60% opacity, size proportional to container (typically 24px to 48px)
- **Section divider**: centered between major sections, size 32px, color text tertiary, with 64px vertical breathing room above and below
- **Decorative ornament**: oversized at 120px+ as background watermark in hero sections, color at 8% opacity of the canvas inverse
- **Inline pause**: at body size, color matched to surrounding text, used as deliberate breath marker in long-form copy (use sparingly, never more than once per page)

### Image Treatment

- Border-radius: `16px` to `24px` for standard images, `0px` for full-bleed hero photography
- Photography: high-contrast B&W or moody indigo-toned color, never warm-saturated
- Illustrations: flat black-and-white organic line illustrations (the existing Soulstory library), placed on Parchment or Warm Veil backgrounds, never on dark surfaces
- The `(...)` glyph may be overlaid on dark photography in `#FAF8F5` color as brand mark

## 5. Layout Principles

### Spacing System

Base unit: **8px**. The scale is generous, favoring breathing room over density.

Scale: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 40px, 48px, 64px, 80px, 96px, 128px, 160px`

- Component internal padding: `16px` to `32px`
- Card padding: `24px` to `40px`
- Section vertical padding: `80px` to `120px` desktop, `48px` to `64px` mobile
- Inter-element gap (within a section): `16px` to `24px`
- Inter-section margin: `120px` to `160px` for major narrative breaks

### Grid & Container

- Max content width: **1200px**, centered with auto margins
- Outer page padding: `24px` mobile, `40px` tablet, `64px` desktop
- Grid: 12-column system, 24px gutter on desktop, 16px gutter on mobile
- Hero sections: single column centered, max-width 720px to 880px for headline plus body
- Feature grids: 2 or 3 columns desktop, 1 column mobile
- Editorial passages: max-width 680px (60ch to 70ch line length for optimal reading)

### Whitespace Philosophy

Soulstory follows an **editorial pacing** model, not a SaaS density model.

- Each section breathes like a magazine spread. Headlines have 32px to 48px breathing room above their associated body.
- The page reads as chapters, not as a feed. Section breaks are dramatic, not subtle.
- Light/dark alternation between sections creates the experience of moving between rooms in a contemplative space.
- Never compress whitespace to fit more content. If a layout feels cramped, remove content rather than reduce spacing.

### Border Radius Scale

- **Sharp** (`4px`): Inline badges, micro elements
- **Subtle** (`6px`): Small badges, pill tags
- **Comfortable** (`8px to 10px`): Buttons, inputs, small interactive surfaces
- **Standard** (`12px`): Cards, containers, dropdowns
- **Featured** (`16px to 20px`): Elevated cards, image containers, modals
- **Hero** (`24px to 32px`): Large image containers, hero cards, video embeds

Never use fully rounded (`9999px`) pills. The brand voice is editorial, not playful-tech. The radius scale stops at 32px deliberately.

### Section Rhythm

A typical Soulstory page or deck moves through this cadence:

1. **Parchment hero**: Headline plus tagline plus body plus CTA on `#FAF8F5`, with optional flat illustration to one side
2. **Void quote section**: Full-width `#0C0B14` band with a Pull Quote and `(...)` mark
3. **Parchment feature grid**: 2 or 3 cards on `#F1EFEC` or `#FAF8F5`
4. **Void manifesto section**: Editorial body in Minion 3 Pro on `#0C0B14`
5. **Parchment CTA close**: Final headline plus dual CTAs on `#FAF8F5`

This light-dark-light-dark-light alternation is a signature pattern. Use it consciously.

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| Flat (Level 0) | No shadow, no border | Page background, inline text on canvas |
| Whisper (Level 1) | `1px solid rgba(60, 57, 110, 0.10)` only | Standard cards on Parchment |
| Soft Lift (Level 2) | Whisper border plus shadow `rgba(60, 57, 110, 0.04) 0px 4px 18px, rgba(60, 57, 110, 0.027) 0px 2px 7.85px, rgba(60, 57, 110, 0.02) 0px 0.8px 2.93px` | Featured cards, image containers |
| Elevated (Level 3) | Shadow `rgba(60, 57, 110, 0.08) 0px 14px 28px, rgba(60, 57, 110, 0.05) 0px 23px 52px, rgba(0, 0, 0, 0.04) 0px 7px 15px` | Dropdowns, popovers, hover states on featured cards |
| Floating (Level 4) | Shadow `rgba(60, 57, 110, 0.16) 0px 30px 60px -12px, rgba(60, 57, 110, 0.10) 0px 18px 36px -18px, rgba(0, 0, 0, 0.04) 0px 8px 17px` | Modals, dialogs, command palettes |
| Ring (Interactive) | `0 0 0 1px rgba(60, 57, 110, 0.18)` halo on hover, `0 0 0 3px rgba(142, 159, 238, 0.20)` for focus | Buttons, inputs, interactive cards |

**Shadow Philosophy.** Soulstory shadows are **always indigo-tinted**. The signature `rgba(60, 57, 110, ...)` carries the brand color into the elevation system itself. This is borrowed conceptually from Stripe's blue-tinted shadows but adapted to the indigo palette. The result is depth that feels native to the brand atmosphere rather than a generic gray gradient pasted onto a colorful surface.

On dark surfaces, shadows are de-emphasized. Depth comes from the surface hierarchy itself (`#0C0B14` to `#15131F` to `#1F1B2E`) rather than from shadow casting. When shadows are necessary on dark, use very low opacity (`rgba(0, 0, 0, 0.20)` to `0.30`) with large blur radii.

### Decorative Depth

- **Light/dark section alternation** is the most powerful depth device in the system. Moving from Parchment to Void creates more atmospheric shift than any shadow.
- **The `(...)` glyph at large scale** (120px+) at very low opacity (`6%` to `10%`) functions as a watermark behind hero content, adding mystical depth without clutter.
- **Whisper borders** create structure without weight. Use them aggressively to define content regions on Parchment without breaking the editorial calm.

## 7. Do's and Don'ts

### Do

- Use Parchment (`#FAF8F5`) as the default light background, never pure white as page-level
- Pair Mr Eaves Sans OT for structure with Minion 3 Pro italic for taglines and quoted matter
- Apply the italic-serif-tagline plus sans-headline pattern as a signature feature pattern
- Tint all shadows with `rgba(60, 57, 110, ...)`, the brand indigo
- Alternate Parchment and Void sections to create chapter-like reading rhythm
- Use weight 400 for display sizes (44px+) to achieve "whispered authority"
- Use the `(...)` glyph as page mark in card corners and as section divider
- Apply generous border-radius (12px to 32px) for editorial softness
- Use generous body line-height (1.60 to 1.70) for literary reading rhythm
- Reserve `#8CC6FF` Sky Awakening for clarity moments, attributions on dark, and informational accents
- Treat the flat black-and-white illustration library as the primary visual asset, paired with sans headlines

### Don't

- Don't use pure white (`#FFFFFF`) as a full page background. Always Parchment or Void.
- Don't introduce warm chromatic colors (orange, red, yellow, green saturated). The palette is exclusively cool-violet-indigo with parchment warmth.
- Don't use serif Minion 3 Pro for buttons, navigation, or UI labels. Serif is editorial only.
- Don't use sans Mr Eaves for taglines and attribution lines that follow the italic-serif pattern.
- Don't use neutral gray drop shadows. All shadows are indigo-tinted.
- Don't use fully rounded pills (`9999px` radius). The radius scale stops at 32px.
- Don't use weight 700+ on display headlines. Weight 400 is the brand voice at scale.
- Don't compress body line-height below 1.50. Editorial pacing requires breathing room.
- Don't place flat illustrations on dark surfaces. They're designed for Parchment.
- Don't use the brand glyph `(...)` more than once per page in inline body text. As decoration and page mark it can recur, as inline pause it must be rare.
- Don't apply gradients in the traditional sense. Soulstory has no gradient system. Depth comes from light-dark section alternation, surface hierarchy, and tinted shadows.
- Don't use cool-blue-grays anywhere. All neutrals derive from `#0C0B14` via opacity, preserving the violet undertone.

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| Mobile Small | <480px | Single column, compact display sizes (44px max), reduced padding |
| Mobile | 480px to 767px | Single column, hamburger nav, display 44px to 48px |
| Tablet | 768px to 1023px | 2-column grids, condensed nav, display 56px |
| Desktop | 1024px to 1439px | Full layout, 3-column feature grids, display 64px to 72px |
| Wide Desktop | >=1440px | Centered max-width container, generous outer margins, full hero scale |

### Touch Targets

- Buttons: minimum `44x44px` tap target
- Navigation links: 16px to 24px spacing for thumb navigation
- Card surfaces: serve as full-area touch targets with cursor-pointer affordance
- Form inputs: 48px minimum height on mobile

### Collapsing Strategy

- **Hero typography**: 72px display scales to 56px tablet to 44px mobile, weight 400 maintained throughout
- **Navigation**: full horizontal becomes hamburger plus full-screen overlay
- **Featured cards (image-left, copy-right)**: stack vertically with image on top
- **3-column feature grids**: become 2-column on tablet, 1-column on mobile
- **Section vertical padding**: 120px desktop scales to 80px tablet to 48px mobile
- **Editorial passages**: maintain 60ch to 70ch line length, become full-width within mobile padding
- **Quote cards**: maintain 32px to 40px internal padding even at mobile scale

### Image Behavior

- Flat illustrations: scale proportionally, retain crisp lines, never apply blur or filter on resize
- The `(...)` glyph: retain proportional size relative to its container, never less than 16px even at smallest scale
- Photography: maintain aspect ratio, switch from horizontal to vertical crop on mobile via responsive image source where possible
- Hero illustrations may simplify on mobile (smaller scene, fewer elements) when the design system supports curated alternates

## 9. Agent Prompt Guide

### Quick Color Reference

- Primary CTA background: Void (`#0C0B14`)
- Secondary CTA background: Indigo Authority (`#3D396E`)
- Page background (light): Parchment (`#FAF8F5`)
- Page background (dark): Deep Indigo Void (`#0C0B14`)
- Card surface (light): Pure White (`#FFFFFF`) or Warm Veil (`#F1EFEC`)
- Card surface (dark): Elevated Void (`#15131F`)
- Primary text (light): `#0C0B14`
- Primary text (dark): `#FAF8F5`
- Body text (light): `rgba(12, 11, 20, 0.78)`
- Body text (dark): `rgba(250, 248, 245, 0.82)`
- Link / interactive: Lavender Insight (`#8E9FEE`)
- Brand emphasis: Indigo Authority (`#3D396E`)
- Clarity accent: Sky Awakening (`#8CC6FF`)
- Tinted surface: Mist Lavender (`#E1E4F6`)
- Whisper border (light): `1px solid rgba(60, 57, 110, 0.10)`
- Whisper border (dark): `1px solid rgba(225, 228, 246, 0.08)`

### Example Component Prompts

**Hero section (Parchment):**
> "Build a hero section on Parchment background (`#FAF8F5`). Above the headline, place an italic tagline in Minion 3 Pro 14px color `#3D396E`. The headline is Mr Eaves Sans OT at 64px weight 400, line-height 1.08, letter-spacing -1.4px, color `#0C0B14`. Below, a body paragraph in Mr Eaves Sans OT 18px weight 400, line-height 1.65, color `rgba(12, 11, 20, 0.78)`. Two CTA buttons side by side: Primary Void (background `#0C0B14`, text `#FAF8F5`, padding 12px 24px, radius 10px) and Outline Void (transparent, 1px solid `#0C0B14`, text `#0C0B14`)."

**Quote card (signature pattern):**
> "Create a quote card with Deep Indigo Void background (`#0C0B14`), padding 48px 40px, radius 16px. The quote text is Mr Eaves Sans OT 32px weight 400, line-height 1.20, color `#FAF8F5`. The attribution below is Minion 3 Pro 14px italic, color `#8CC6FF`, with 24px top margin. In the bottom-right corner, place the `(...)` brand glyph in Parchment color at 60% opacity, size 28px."

**Featured card with illustration:**
> "Design a 50/50 horizontal card on Pure White background (`#FFFFFF`), 1px solid border `rgba(60, 57, 110, 0.10)`, radius 20px, padding 32px. Left half holds a flat black-and-white organic line illustration. Right half stacks: italic tagline in Minion 3 Pro 14px color `#8E9FEE`, headline in Mr Eaves Sans OT 32px weight 500, body in Mr Eaves Sans OT 16px line-height 1.60 color `rgba(12, 11, 20, 0.78)`, two CTAs (Primary Void plus Outline Void). Apply Soft Lift shadow: `rgba(60, 57, 110, 0.04) 0px 4px 18px, rgba(60, 57, 110, 0.027) 0px 2px 7.85px`."

**Dark editorial section:**
> "Build a full-width section on Deep Indigo Void (`#0C0B14`), vertical padding 120px. Center an editorial passage at max-width 680px. Use Minion 3 Pro 17px weight 400, line-height 1.70, color `rgba(250, 248, 245, 0.82)`. Above the passage, an Overline label in Mr Eaves Sans OT 11px weight 500, uppercase, letter-spacing 0.6px, color `#8CC6FF`. After the passage, place the `(...)` glyph centered, color `rgba(250, 248, 245, 0.4)`, size 32px, with 64px top margin."

**Navigation bar:**
> "Sticky top navigation, background `rgba(250, 248, 245, 0.85)` with backdrop-filter blur(12px), border-bottom `1px solid rgba(60, 57, 110, 0.10)`. Left: SOULSTORY wordmark in Mr Eaves Sans OT 18px weight 500 with `(...)` glyph beside it. Center: nav links in Mr Eaves Sans OT 15px weight 500, color `#0C0B14`, with 32px spacing. Right: Primary Void CTA button. Hover state on links: color shifts to `#3D396E`, no underline."

**Input field:**
> "Form input on Parchment context. Label above in Mr Eaves Sans OT 13px weight 500 letter-spacing 0.1px color `rgba(12, 11, 20, 0.62)`, with 8px bottom margin. Input field: background `#FFFFFF`, border `1px solid rgba(60, 57, 110, 0.18)`, radius 10px, padding 12px 16px, text Mr Eaves Sans OT 16px weight 400 color `#0C0B14`, placeholder color `rgba(12, 11, 20, 0.32)`. Focus state: border shifts to `#8E9FEE` plus ring `0 0 0 3px rgba(142, 159, 238, 0.20)`."

### Iteration Guide

1. **Start with the canvas decision.** Every layout begins by choosing Parchment or Void. The wrong canvas can't be fixed by token tweaks.
2. **Apply the typographic pair correctly.** Sans for structure, italic serif for tagline and attribution. Never substitute one for the other.
3. **Use weight 400 at display scale.** If a headline feels weak, the answer is rarely "make it bolder." It's almost always "make it bigger" or "tighten letter-spacing further."
4. **Tint shadows with indigo.** Replace any `rgba(0, 0, 0, ...)` shadow proposed by an LLM with `rgba(60, 57, 110, ...)` at the same opacity.
5. **Reach for whisper borders before drop shadows.** A `1px solid rgba(60, 57, 110, 0.10)` will solve most container needs. Save shadows for actual elevation.
6. **Place the `(...)` glyph deliberately.** Bottom-right of cards, centered as section divider, large at low opacity as watermark. Never random.
7. **Alternate light and dark sections** for narrative pacing across a page or deck. Two consecutive Parchment sections feel monotone; two consecutive Void sections feel oppressive.
8. **Use Sky Awakening (`#8CC6FF`) sparingly.** It's the clarity moment, not a routine accent. Default to Lavender Insight (`#8E9FEE`) for interactive states.
9. **Keep illustration on Parchment.** The flat B&W library is calibrated for warm light contexts. On Void, lead with photography or geometric layouts instead.
10. **Body text always at 1.60+ line-height.** Editorial pacing is a non-negotiable brand commitment.

### Voice & Microcopy Notes

While this document focuses on visual design, the brand voice has three guidelines that affect on-screen copy and should inform agent output:

- **Quiet authority over loud sales.** Headlines whisper, never shout. "Tell stories that lead markets." rather than "EXPLODE YOUR BRAND NOW."
- **Editorial cadence.** Sentences breathe. Use periods generously. Avoid exclamation marks except in the rarest of cases.
- **Mythic without mystic-jargon.** The brand inherits the Magician archetype but never uses esoteric terminology in marketing surfaces. "Decode your brand's soul" is on-brand. "Unlock your chakras through storytelling" is not.

---

*This DESIGN.md documents the Soulstory visual system as implemented across the brand's identity assets, web surfaces, decks, and social content. It is the source of truth for any AI agent generating UI on behalf of the Soulstory brand. When in doubt, default to editorial restraint over decorative complexity.*
