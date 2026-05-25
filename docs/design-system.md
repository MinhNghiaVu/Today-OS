# Today OS — Design System

> Canonical reference for every UI decision. If a value isn't here, it doesn't go in the codebase. When a new pattern is needed, add it here in the **same commit** that uses it. `src/app.css` and this file must agree at all times.
>
> **Primary theme is dark.** Light theme is a recolor of the same tokens — never a parallel set.
>
> **Reference UIs:** ClickUp (density + sidebar), Linear (motion + keyboard), Things 3 (calm + hierarchy), Vercel dashboard (dark surfaces + restraint), Cron/Notion Calendar (date UI). When in doubt, match Linear's restraint, not Notion's maximalism.

---

## 1. Foundational principles

These come before any specific token. If a screen looks wrong, it's almost always violating one of these — not missing a token.

**Hierarchy through size, weight, and color — not boxes.** Three things on a page should never get equal visual weight. The primary action is bigger or more saturated; secondary is muted; tertiary is barely-there. ClickUp does this by giving the title room to breathe, the input a clear single purpose, and metadata its own row in `--text-secondary`. Boxes within boxes within boxes is the amateur tell.

**Whitespace is a feature.** When in doubt, add 4–8px more padding. Calm > dense. The exception is data tables and dense list views, which have their own density rules.

**Motion confirms causation.** When the user acts, the result animates in from a direction that makes the cause obvious. New todo? It fades down from the input. Removed todo? It collapses where it sat. Drawer opening from the right edge? It slides from the right edge, not from nowhere. Motion that doesn't reinforce cause-and-effect is decoration, and decoration is noise.

**One accent color, used sparingly.** The accent is for the *one* thing on the screen that matters most: the primary CTA and the active nav item. If everything is accented, nothing is. Most surfaces should be neutral grays, including focus rings.

**Borders are a last resort.** Prefer surface elevation (a slightly lighter background) over a 1px border to separate things. Use borders for inputs, cards in dense grids, and table rows — not for every container.

**Density follows content, not designer ego.** A note editor is sparse on purpose. A calendar grid is dense on purpose. Don't make the editor cramped to "match" the calendar, and don't blow up the calendar with 80px rows because the editor is airy.

**Industry practice:** Apple HIG, Material 3, Radix Themes, and shadcn/ui all converge on these tokens — neutral surfaces, one accent, 4/8px spacing grid, type ramp with limited weights, transitions on transform+opacity only. We are not innovating on primitives. We're applying them with discipline.

---

## 2. Color tokens

Declared in `src/app.css` under `:root` (dark, the default) and overridden under `[data-theme='light']`. Every token below has a value in **both** themes — no exceptions.

### Surfaces (background fills, layered from deep to shallow)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--bg` | `#191919` | `#fafafa` | App background. The deepest layer. |
| `--surface-1` | `#202020` | `#ffffff` | Cards, sidebars, primary panels |
| `--surface-2` | `#282828` | `#f4f4f5` | Inputs, nested cards, hover-on-bg |
| `--surface-3` | `#323232` | `#e9e9ec` | Active row, hover-on-card |
| `--surface-overlay` | `#2c2c2c` | `#ffffff` | Popovers, dropdowns, menus (with shadow-md) |
| `--surface-modal` | `#202020` | `#ffffff` | Modal sheets (with shadow-lg) |

Rule: never skip a surface level. A popover sits on `--surface-overlay`, which sits on `--surface-1`, which sits on `--bg`. Don't put `--surface-3` directly on `--bg`.

### Borders

| Token | Dark | Light | Use |
|---|---|---|---|
| `--border-subtle` | `#2e2e2e` | `#ececef` | Row dividers, low-emphasis separators |
| `--border-default` | `#3a3a3a` | `#dcdce0` | Inputs, cards, default boundaries |
| `--border-strong` | `#4e4e4e` | `#c4c4ca` | Hover state for default, emphasized cards |
| `--border-focus` | `var(--border-strong)` | same | Neutral focus rings |

### Text

| Token | Dark | Light | Use |
|---|---|---|---|
| `--text-primary` | `#ededef` | `#0a0a0b` | Headings, body, primary content |
| `--text-secondary` | `#a1a1aa` | `#52525b` | Metadata, descriptions, secondary labels |
| `--text-tertiary` | `#71717a` | `#8a8a92` | Section labels, placeholders, disabled |
| `--text-on-accent` | `#ffffff` | `#ffffff` | Text on accent-filled buttons/badges |
| `--text-disabled` | `#52525b` | `#a1a1aa` | Disabled UI text |

Contrast: every primary text on every surface meets WCAG AA (4.5:1). Secondary text meets AA Large (3:1) at minimum. Test both themes.

### Accent (the one color that pops)

| Token | Dark | Light | Use |
|---|---|---|---|
| `--accent` | `#38bdf8` | `#0ea5e9` | Primary CTAs, active states |
| `--accent-hover` | `#0ea5e9` | `#0284c7` | Hover state for accent |
| `--accent-pressed` | `#0284c7` | `#0369a1` | Active/pressed |
| `--accent-soft` | `color-mix(in oklab, var(--accent) 14%, transparent)` | same | Tinted bg for badges, active rows, soft highlights |
| `--accent-soft-hover` | `color-mix(in oklab, var(--accent) 22%, transparent)` | same | Hover state for accent-soft surfaces |

Default accent is sky `#38bdf8`. Settings → Accent picker swaps `--accent`, `--accent-hover`, and `--accent-pressed` together (and recomputes `--accent-soft` because it's a `color-mix`). Pressed states must stay in the selected accent family, never fall back to danger red.

### Semantic

| Token | Dark | Light | Use |
|---|---|---|---|
| `--success` | `#10b981` | `#059669` | Confirmed, complete, positive deltas |
| `--success-soft` | `color-mix(in oklab, var(--success) 14%, transparent)` | same | Success badge bg |
| `--warning` | `#f59e0b` | `#d97706` | Approaching limits, slow operations |
| `--warning-soft` | `color-mix(in oklab, var(--warning) 14%, transparent)` | same | Warning badge bg |
| `--danger` | `#ef4444` | `#dc2626` | Destructive actions, errors, overdue |
| `--danger-soft` | `color-mix(in oklab, var(--danger) 14%, transparent)` | same | Danger badge/row bg |
| `--info` | `#3b82f6` | `#2563eb` | Neutral notifications, links |
| `--info-soft` | `color-mix(in oklab, var(--info) 14%, transparent)` | same | Info badge bg |

### Priority colors (todos)

| Priority | Color | Soft variant |
|---|---|---|
| Urgent | `--danger` | `--danger-soft` |
| High | `--warning` | `--warning-soft` |
| Medium | `--info` | `--info-soft` |
| Low | `--text-tertiary` | `color-mix(in oklab, var(--text-tertiary) 14%, transparent)` |
| None | `--text-tertiary` | (no badge — render as a 6px dot at `--border-strong`) |

### Habit colors

Habits get their own color from a palette of 8, stored on the row. Colors are tuned to be legible on both themes:

```
#6366f1 (indigo)   #8b5cf6 (violet)   #ec4899 (pink)
#10b981 (emerald)  #14b8a6 (teal)     #f59e0b (amber)
#ef4444 (red)      #3b82f6 (blue)
```

These are stored as raw hex on the habit row (it's user data, not a theme token).

---

## 3. Spacing scale

**Only these values, in pixels:** `4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96`. Maps to Tailwind `p-1, p-2, p-3, p-4, p-5, p-6, p-8, p-10, p-12, p-16, p-20, p-24`.

If a layout "needs" 18px or 28px, the layout is wrong, not the scale.

Common usages:
- Inline gap between an icon and label: **8** (`gap-2`)
- Padding inside a button: **12** horizontal, vertical from height (`px-3`)
- Padding inside a card: **16** or **24** (`p-4` or `p-6`)
- Gap between cards in a stack: **12** (`gap-3`)
- Gap between sections within a page: **32–48** (`gap-8` to `gap-12`)
- Page top padding (below page title): **32** (`pt-8`)
- Page horizontal padding: **24 / 32 / 40** at sm/md/lg (`px-6 sm:px-8 lg:px-10`)

Vertical rhythm inside lists: row height is fixed (see Density), and the gap between rows is `0` (with a 1px border) or `8px` (cards), never both.

---

## 4. Typography

**One typeface for UI: Inter** (variable, via `@fontsource-variable/inter`). One typeface for code: the system monospace stack (`ui-monospace, SFMono-Regular, ...`). Notes content renders in **Inter** at 15px / 1.6 — never mono. Mono is reserved for inline `<code>` and ` ``` ` blocks.

### Type ramp

| Role | Size | Line | Weight | Token |
|---|---|---|---|---|
| Section label | 11–12px | 1.4 | 500 | `--text-tertiary`, uppercase, tracking +0.04em |
| Metadata | 13px | 1.5 | 400 | `--text-secondary` |
| Body / UI | 14px | 1.5 | 400 | `--text-primary` |
| Body emphasis | 14px | 1.5 | 500 | `--text-primary` |
| Note prose | 15px | 1.6 | 400 | `--text-primary` |
| Card title | 15–16px | 1.3 | 600 | `--text-primary` |
| Subsection title | 18px | 1.3 | 600 | `--text-primary` |
| Page title | 24–30px | 1.2 | 600 | `--text-primary` |
| Hero / empty state | 36–48px | 1.1 | 600 | `--text-primary` |

Weights in use: **400, 500, 600**. That's it. No 700 in body/UI. No 300 — it muddies on dark backgrounds.

Line-height: tighter for headings (1.1–1.3), looser for body (1.5–1.6).

Letter-spacing: −0.01em on titles ≥24px, +0.04em on uppercase labels, default everywhere else.

No `text-xs` (10px) in production UI. If something needs to be smaller than 11px, redesign the layout.

---

## 5. Radius

Pixel values: `0, 4, 6, 8, 10, 12, 16, 20, 9999 (full)`. Tokens:

```
--radius-xs: 4px;   /* tags inside dense rows */
--radius-sm: 6px;   /* small inline elements */
--radius-md: 8px;   /* buttons, inputs, default */
--radius-lg: 12px;  /* cards, panels */
--radius-xl: 16px;  /* large cards, modals */
--radius-2xl: 20px; /* hero surfaces, sheets */
--radius-full: 9999px;
```

Inputs and buttons share **8px**. Cards are **12–16px**. Avatars and pills/badges are **full**. Don't mix radii within a component (e.g. a card with 12px corners shouldn't have 6px inputs inside it — use 8px).

---

## 6. Shadows

Shadows are restraint, not decoration. On dark backgrounds especially, a 1px inset top highlight (`box-shadow: inset 0 1px 0 rgba(255,255,255,0.04)`) reads better than a heavy drop shadow.

```
--shadow-sm:
  0 1px 2px rgba(0, 0, 0, 0.06),
  0 1px 1px rgba(0, 0, 0, 0.04);

--shadow-md:
  0 4px 8px -2px rgba(0, 0, 0, 0.10),
  0 2px 4px -1px rgba(0, 0, 0, 0.06);

--shadow-lg:
  0 12px 24px -6px rgba(0, 0, 0, 0.18),
  0 4px 8px -2px rgba(0, 0, 0, 0.08);

--shadow-popover:
  0 8px 16px -4px rgba(0, 0, 0, 0.20),
  0 0 0 1px var(--border-subtle);
```

Dark mode: increase opacities ~3×, and add the inset highlight to elevated surfaces. Light mode: keep opacities modest and skip the inset.

| Shadow | Use |
|---|---|
| `--shadow-sm` | Cards at rest |
| `--shadow-md` | Hovered cards, primary buttons (subtle) |
| `--shadow-popover` | Dropdowns, popovers, menus |
| `--shadow-lg` | Modals, sheets |

Never `shadow-2xl`. Never glowing accent shadows. Never multiple stacked drop shadows simulating glow.

---

## 7. Layout

### Page container

Every page has a max-width container with horizontal padding. **Never let content hug the top-left of the viewport** — that's the single biggest tell of an unfinished UI.

| Page type | Max width | Tailwind |
|---|---|---|
| Single column / forms / settings | 768px | `max-w-3xl` |
| Default app pages (todos, habits, notes) | 1024px | `max-w-5xl` |
| Data-heavy (calendar, dashboard) | 1280px | `max-w-7xl` |

Page padding: `px-6 sm:px-8 lg:px-10` and `py-8` (or `py-10` for hero pages).

Page-level structure (top to bottom):
1. **Page header** — title (24–30px / 600), optional subtitle (14px secondary), optional primary CTA on the right. 32px bottom margin.
2. **Filter / segmented row** (if applicable) — 16px below header.
3. **Content** — sections with 32–48px between them.
4. **Empty state** if no content — see §10.

### Sidebar

Fixed width 240–260px, `--surface-1` background, 1px right border (`--border-subtle`). Inside:

- **Brand mark** — top, 20px height, 16–20px page padding around it.
- **Collapse state** — desktop sidebar may collapse to a 56px icon rail. The logo is hidden in the rail, the collapse/expand control stays in the same sidebar header position, labels fade away, nav items keep their icon targets centered, and the account popover opens beside the rail instead of being clipped.
- **Nav section** — 8px padding, 2px gap between items. Section labels (uppercase, 11px) above grouped items if there are multiple groups.
- **Spacer** — `flex-1`, pushes the account block to the bottom.
- **Account block** — single button at the bottom (see Component specs §8.7).

### List densities

Pick one per surface; never mix.

| Density | Row height | Padding | Use |
|---|---|---|---|
| Compact | 32–36px | `px-3 py-1.5` | Sidebar nav, command palette items |
| Default | 44–52px | `px-4 py-3` | Todos, habits, notes list, settings rows |
| Comfortable | 60–72px | `px-4 py-4` | Calendar entries, recent activity, search results |
| Rich | 80–96px | `px-5 py-5` | Featured cards, large notification rows |

### Dividers

For lists: either 1px `--border-subtle` between rows **or** 8px gap between cards. **Never both.** Cards in a stack don't get borders between them; flat-list rows do.

---

## 8. Component specs

### 8.1 Buttons

| Size | Height | Padding | Font |
|---|---|---|---|
| xs | 24px | `px-2` | 12px / 500 |
| sm | 28px | `px-3` | 13px / 500 |
| md (default) | 36px | `px-4` | 14px / 500 |
| lg | 40px | `px-5` | 14px / 500 |

Radius **8px**. Icon-only buttons are square at the same heights.

Variants:

- **Primary** — `bg: --accent`, `color: --text-on-accent`. Hover: `--accent-hover`. Pressed: `--accent-pressed` + `translate-y-px`.
- **Secondary** — `bg: transparent`, `border: 1px solid --border-default`, `color: --text-primary`. Hover: `bg: --surface-2`, `border-color: --border-strong`.
- **Ghost** — `bg: transparent`, no border, `color: --text-primary`. Hover: `bg: --surface-2`.
- **Soft** — `bg: --surface-2`, no border, `color: --text-primary`. Hover: `bg: --surface-3`.
- **Destructive** — primary recipe with `--danger`/`--danger-hover`/`--danger-pressed`.
- **Link** — `color: --accent`, no bg, no border. Hover: underline.

Every button has a press state: `active:translate-y-px` (or `active:scale-[0.98]` for icon-only). Transition on `bg-color, border-color, color, transform` 120ms `--ease-out`. Never feels dead.

Disabled: 50% opacity, `cursor-not-allowed`, no hover, no press. Don't change the color — change the opacity.

### 8.2 Inputs (text, textarea, select)

Default height **36px** (matches `md` button). Padding `px-3`. Radius 8.

```
bg: --surface-2
border: 1px solid --border-default
color: --text-primary
placeholder color: --text-tertiary
```

States:
- **Hover:** `border-color: --border-strong`
- **Focus:** no extra input border or outline. Keep typing surfaces visually still while focused.
- **Error:** `border-color: --danger`, with a `--danger` helper text 4px below.
- **Disabled:** 50% opacity.

**Inputs never contain other controls.** No date pickers, dropdowns, priority badges, or submit buttons crammed inside a text input. The Add-Todo pattern keeps title, date, priority, and submit as separate controls; on wide desktop they may share one row, while narrower widths stack metadata below the title input.

Textarea: same recipe, vertical padding `py-2.5`, min-height by lines (e.g. `min-h-[80px]` for a description, `min-h-[200px]` for a body). Auto-grow if the content allows it.

Select: same recipe + a 16px chevron icon on the right at `--text-secondary`. On open, transitions to a popover (see §8.5).

### 8.3 Cards

```
bg: --surface-1
border: optional 1px --border-subtle (only in dense grids)
radius: --radius-lg (12px) or --radius-xl (16px)
padding: 16-24px (p-4 or p-6)
shadow: --shadow-sm at rest, --shadow-md on hover (only if interactive)
```

Hover (only for clickable cards): elevate to `--surface-2` **or** strengthen the border to `--border-strong`. Never both. Never shift size on hover — only color, border, shadow.

### 8.4 Badges & pills

Height 20–22px. `px-2`. Radius full. Font 12px / 500.

Recipe: `bg: --{semantic}-soft`, `color: --{semantic}`. E.g. a "High" priority badge is `bg: --warning-soft`, `color: --warning`.

For neutral badges: `bg: --surface-2`, `color: --text-secondary`.

Never an outlined-only badge — they read as an empty hole.

### 8.5 Popovers, dropdowns, menus

```
bg: --surface-overlay
radius: --radius-lg (12px)
padding: 6px (the panel) — items inside have their own px-3 py-2
shadow: --shadow-popover (which includes the 1px border ring)
min-width: 180px (menu) / variable (popover)
```

Menu items: 32–36px tall, `px-3`, 14px / 400, hover `bg: --surface-2`, active/selected `bg: --surface-3`. Icons (16px) go on the left with 8px gap; keyboard hints (e.g. ⌘K) go on the right at `--text-tertiary`.

Open animation: `fly={{ y: -4, duration: 180, easing: cubicOut }}` on the panel + `fade={{ duration: 140 }}` on the backdrop (if present). Closes faster: 120ms.

### 8.6 Modals & sheets

```
backdrop: rgba(0,0,0,0.5), with backdrop-blur-sm
panel: --surface-modal
radius: --radius-xl (16px)
padding: 24px
shadow: --shadow-lg
max-width: 480px (small), 640px (default), 800px (large)
```

Open: `fly={{ y: 16, duration: 240, easing: cubicOut }}` + scale `0.98 → 1`. Close: 160ms, in.

Esc closes. Click outside closes. Tab is trapped inside. Focus returns to the triggering element on close.

### 8.7 Sidebar account block

The thing your screenshot gets wrong. Replace `email + sign-out button` with a single button at the bottom of the sidebar:

```
[24px avatar][name (14px primary, truncate) + email (12px tertiary, truncate)] [16px chevron-up]
```

Click opens a popover (anchored upward) with:
- Full email
- "Settings" item (links to /settings, with ⌘, hint)
- 1px divider
- "Sign out" item in `--danger`

Settings stays as a top-level nav item too — power users want it one click away.

Active nav item = `bg: --surface-3`, `color: --text-primary`, with optional 16px lucide icon at the same color. Hover = `bg: --surface-2`. **No left-border accent stripes** — they read as dated 2018-era admin UI.

### 8.8 Form patterns

Labels above inputs, 12px gap. Label is 13px / 500 in `--text-primary`. Helper text is 12px in `--text-secondary`, 4px below the input. Error text replaces helper text in `--danger`.

Form sections separated by 32px and a 1px `--border-subtle`. Section heading: 18px / 600 with 8px below for the description.

Submit row: right-aligned, primary on the right, secondary (Cancel) immediately to its left, 12px gap.

### 8.9 Tabs / segmented controls

Pill-shaped track at `--surface-2`, 4px padding. Each tab is 28–32px tall, `px-3`, 13px / 500. Active tab: `bg: --surface-overlay` + `color: --text-primary` + `--shadow-sm`. Inactive: `color: --text-secondary`.

The active indicator's position **must animate** with `tweened` — never re-render in place with no transition.

### 8.10 Checkbox / radio / toggle

Checkbox: 18px square, radius 6, `border: 1px --border-strong`. Checked: `bg: --accent`, white check icon. Tick animation: spring scale (0.8 → 1.05 → 1) over 240ms with `--ease-spring`.

Toggle: 28px wide, 16px tall, radius full. Off: `bg: --surface-3`. On: `bg: --accent`. Knob 12px, animates with 180ms `--ease-spring`.

### 8.11 Icons

**Lucide only.** Stroke-width 2 (1.5 for ≥24px). Sizes 14 / 16 / 18 / 20 / 24. Icon-only buttons have a 32–36px hit target with the icon centered.

Icon color follows surrounding text by default (`color: currentColor`). Override only when the icon carries semantic meaning (a green check, a red X).

### 8.12 Empty states

Centered block at ~30% from the top of the content area:
- 40px muted icon (`--text-tertiary`)
- 16–18px title (600, `--text-primary`)
- 14px description (`--text-secondary`), max-width 320px
- One primary CTA, 12px below the description

Never show a blank screen. Even a one-line "No notes yet — press ⌘N to create one" is better than nothing.

### 8.13 Skeletons & loading

For lists and cards: render skeleton rows that match the real content's height, with `--surface-2` blocks at radius 6 where text would go. Animate with a 1.6s `--ease-in-out` opacity pulse from 1 → 0.6 → 1.

Never a full-page spinner on every load. Streaming load (SvelteKit `return { promise }`) is preferred — the page chrome appears instantly, content fills in.

### 8.14 Toasts

Bottom-right (or bottom-center on mobile). `--surface-overlay`, `--shadow-lg`, 12px radius, 12–16px padding. Auto-dismiss in 4s for success, 6s for error. Slide in from below: `fly={{ y: 12, duration: 240, easing: cubicOut }}`.

Stack downward, never overlap. Max 3 visible.

---

## 9. Motion

Every state change transitions. Transitions are short with directional easing. Never linear. Never longer than 300ms unless it's a deliberate page transition or drag physics.

### Durations

| Range | Use |
|---|---|
| 80–120ms | Hover, press, focus, color/bg changes, small toggles |
| 150–200ms | Small entries/exits (tooltip, dropdown, badge, toast) |
| 200–280ms | List item add/remove, drawer open, modal open |
| 280–400ms | Page transitions, large surfaces, multi-step UI |

### Easing curves

Declared once in `app.css`:

```css
--ease-out:    cubic-bezier(0.22, 1, 0.36, 1);     /* entries */
--ease-in:     cubic-bezier(0.4, 0, 1, 1);          /* exits */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);      /* in-place state changes */
--ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);   /* satisfying micro-interactions, sparingly */
```

- `--ease-out` for things appearing
- `--ease-in` for things disappearing
- `--ease-in-out` for things morphing in place
- `--ease-spring` reserved for: checkbox tick, toggle flip, success states. Don't put spring on everything — it gets cartoonish fast.

### What to animate

**Animate `transform` and `opacity` only.** Never `width`, `height`, `top`, `left` — they trigger layout.

- For collapse/expand: use the `grid-template-rows: 0fr → 1fr` trick (animates without layout thrash).
- For position changes in lists: use Svelte's `animate:flip`.
- For cross-fades (e.g. selected note in a master/detail view): `crossfade` from `svelte/transition`.

### Svelte motion primitives

These are the defaults. Don't roll your own.

```svelte
import { fly, fade, scale, crossfade } from 'svelte/transition';
import { flip } from 'svelte/animate';
import { cubicOut, cubicIn, backOut } from 'svelte/easing';
```

**List item add (the canonical pattern, used everywhere):**
```svelte
{#each items as item (item.id)}
  <li
    transition:fly={{ y: -8, duration: 220, easing: cubicOut }}
    animate:flip={{ duration: 220, easing: cubicOut }}
  >
    ...
  </li>
{/each}
```

The new row fades down from where the input is. Existing rows slide to make space. `flip` is what makes the existing rows move smoothly instead of snapping.

**List item remove:**
```svelte
out:fly={{ y: 4, duration: 160, easing: cubicIn }}
```

**Drawer / popover open:**
```svelte
transition:fly={{ y: -4, duration: 180, easing: cubicOut }}
<!-- backdrop -->
transition:fade={{ duration: 140 }}
```

**Modal open:**
```svelte
in:fly={{ y: 16, duration: 240, easing: cubicOut }}
out:fly={{ y: 8, duration: 160, easing: cubicIn }}
```

**Tab indicator** (segmented control underline / pill):
Use `tweened` writable for the indicator's `x` and `width`. 200ms `--ease-out`. Re-render at the new position is forbidden.

**Selected item highlight** (sidebar item → editor opens): `crossfade`.

**Checkbox tick:** scale `0.8 → 1.05 → 1` over 240ms with `--ease-spring`. Strike-through fades in over 160ms after the tick lands.

**Initial list mount:** stagger each row by 30–40ms, **capped at 6 items**. Beyond 6, render instantly — staggered mounts of 50 rows is a slideshow, not an app.

**Hover transitions on rows/buttons:** transition `bg-color, border-color, color, transform` 120ms `--ease-out` globally. No `transition: all` — pick the properties.

### Reduced motion

Respect it globally:

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Focus rings remain visible — never animate them away on focus.

---

## 10. Empty, error, and loading states

Every screen specs **all four** states before shipping:
1. Loading (skeleton or streamed)
2. Empty (no content yet)
3. Error (network failure, etc.)
4. Populated (the happy path)

If any of the four is "we'll do it later," it gets done now.

**Loading:** prefer skeleton rows over spinners. Match the populated layout's row heights.

**Empty:** see §8.12. Icon + title + description + CTA. Never blank.

**Error:** inline at the relevant level (form-level for form errors, page-level for load failures). Plain language: "Couldn't save — check your connection," not "Error 500." A retry button if the action is retryable.

**Populated:** the design above.

---

## 11. Accessibility (industry minimums, non-negotiable)

- **Keyboard:** every interactive element reachable by Tab. Tab order matches visual order. `Esc` closes overlays. `Enter` submits forms. Custom shortcuts (⌘K, ⌘N, etc.) documented in a help modal.
- **Focus rings:** keep buttons, links, tabs, and custom controls visibly focused (`outline: 2px solid var(--border-focus); outline-offset: 2px`). Text inputs and textareas do not add a focus border.
- **Screen readers:** every icon-only button has `aria-label`. Decorative icons are `aria-hidden="true"`. Dynamic content (toasts, errors) uses `aria-live="polite"` (or `assertive` for errors).
- **Contrast:** WCAG AA. Body text 4.5:1, large text 3:1. Test both themes.
- **Touch targets:** 36×36px minimum, 44×44px preferred for primary actions on touch devices.
- **Motion:** respect `prefers-reduced-motion` (see §9).
- **Forms:** every input has a `<label>` (or `aria-label`). Error messages associated with `aria-describedby`.
- **Color isn't the only signal.** A red dot for "overdue" is always paired with text or an icon. Color-blind users shouldn't lose meaning.

---

## 12. Industry practices we follow

- **Apple HIG:** clear hierarchy, deference (UI defers to content), depth (subtle layering with surfaces, not heavy shadows). Reduced motion respected. Hit targets ≥36px.
- **Material 3:** elevation via surface tints (we use `--surface-1/2/3/overlay`), motion durations and easing curves grounded in real research, semantic color tokens.
- **Radix Themes / shadcn/ui:** primitive composition, accessible defaults, neutral surfaces with one accent, focus-visible rings instead of always-on outlines.
- **Linear / Vercel / Things 3:** restraint over decoration, dense-but-calm lists, motion that confirms causation, keyboard-first interactions.
- **Refactoring UI (Wathan & Schoger):** size + weight + color for hierarchy, not boxes. Whitespace is a feature. Don't use gray scales as semantic communication. Limit your font weights.

What we explicitly **don't** copy:
- Notion's information density (too much chrome).
- Google's cluttered toolbars.
- Material 2's heavy drop shadows.
- 2018-era admin templates (left-border accent stripes, gradient buttons, full-page spinners).

---

## 13. Decision workflow

Before building or refactoring any screen:

1. **Open this file.** Confirm spacing, type, and color decisions match.
2. **Pick the layout.** Max-width, page padding, section gaps.
3. **Pick the components.** List density, button size, input pattern.
4. **Sketch state transitions.** What animates when the user acts? Add to the implementation plan, not after.
5. **Build the static state first.** Then layer animation. Never animation-first.
6. **Spec all four states.** Loading, empty, error, populated. None skipped.

If a design choice isn't covered here, you have two options:
- **Match an existing pattern** elsewhere in the app.
- **Add it to this file and `app.css` in the same commit** that uses it. Never inline a one-off.

---

## 14. What NOT to do (the canonical list)

- ❌ No metadata, badges, dropdowns, or buttons inside text inputs.
- ❌ No mono font outside `<code>` / ` ``` `. Note bodies are Inter, period.
- ❌ No raw Tailwind colors (`bg-red-500`, `text-gray-400`). Only `var(--token)`.
- ❌ No inline hex anywhere in `.svelte` components.
- ❌ No `text-xs` (10px) in production UI.
- ❌ No font-weight ≥ 700 in body/UI.
- ❌ No `shadow-2xl`, no neon glow shadows, no stacked drop shadows.
- ❌ No left-border accent stripes on active nav items.
- ❌ No `outline: none` without a focus-visible replacement.
- ❌ No animations on `width` / `height` / `top` / `left`.
- ❌ No `transition: all`.
- ❌ No screens that hug the top-left of the viewport.
- ❌ No empty pages. Always icon + title + description + CTA.
- ❌ No full-page spinners as the default loading state.
- ❌ No `<form>` posting that wipes the page — `use:enhance` always.
- ❌ No new design tokens added in a component without first updating this file + `app.css`.
- ❌ No "we'll polish it later." Polish is the work.
