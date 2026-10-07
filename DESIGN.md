# DESIGN.md — Sumitsubo docs

> Source of truth for every visual decision. Code uses these tokens only. Change this file first, then the code.

## 1. Direction

- **Concept:** *Kumiko* — Japanese joinery, wood joined without nails. Sumitsubo's claim is composition: six plugins that interlock, skills that compose. The site is built from offset modules that visibly fit into one another, and the joint is never hidden. The material is oiled walnut, not a terminal.
- **Brand tensions:** precise but hand-made · opinionated but not dogmatic · traditional craft but current engineering · dense but calm · confident but unmarketed.
- **Signature element (where it appears):** **the chamfer and the seam.** Every top-level module has exactly one cut corner (top-right, 20 px), and sibling modules share a visible seam line that lands on the same grid column across every section of the page. The chamfer appears only on modules — never on buttons, code blocks, tables or inputs. One cut per module, never two.
- **Motion personality:** modules slot home. 360 ms, expo-out, no overshoot — the feel of a joint seating, not a card bouncing.
- **Anti-references:** Nextra/Mintlify sidebar + Inter + violet · the Vercel/Geist neutral skin · terminal-hero-behind-a-glow · three icon cards · bento for the plugin list · logo cloud → FAQ → CTA band → four-column footer · Inter or Geist as an identity · gradient text · neon-on-dark as "premium" · uniform 8–12 px radius with a soft shadow · "Supercharge/Unlock/Seamless" · everything fading up on scroll.
- **Taste dials:** DESIGN_VARIANCE 8 · MOTION_INTENSITY 6 · VISUAL_DENSITY 4 (landing) / 6 (reference)

### Resolved tensions (decided here, not during implementation)

1. **Chamfers vs. code blocks.** The chamfer is role-scoped to top-level modules only. Modules are solid tonal fills with **no border** — depth comes from warmth shift, so `clip-path` cutting the border edge is a non-problem. Code blocks, tables and controls are radius 0 with a hairline border. This is why the depth model is tonal: it is what makes the chamfer cheap.
2. **Slow reveals vs. a reference site.** The slot-home reveal is **landing-only, once, on first view**. Reference pages have zero entrance animation — people arrive from a search result with one question and must not wait for choreography.
3. **Manifesto voice vs. ageing badly.** The manifesto is **exactly one sentence**, and it is the one already in the README: *"Marca la línea antes de cortar." / "It marks the true line before any cut is made."* Nothing else on the site is written in that register. Reference pages are plain-spoken expert.
4. **Dramatic 1.5 scale vs. 42 dense pages.** The ratio is satisfied by `--text-display` being a deliberate outlier. From `--text-h1` down the ratio is 1.25, so dense reference content stays readable.
5. **One mono, two jobs.** Martian Mono at `wdth 100` for labels and numerals, where its squareness is an asset; at `wdth 75` for code blocks, where it becomes readable. The variable axis replaces a fourth family.
6. **Spanish runs ~20% longer.** No module has a fixed height, and seam alignment is driven by the grid column, never by matching text length. Verify every layout in both languages.

## 2. Typography

| Role | Family (fallback stack) | Weights | Notes |
|---|---|---|---|
| Display | `'Bricolage Grotesque Variable', 'Trebuchet MS', sans-serif` | 600–700, `wdth` 85–90 | Crafted, non-neutral grotesque. Variable `wdth` absorbs Spanish expansion in headlines. |
| Body | `'Spline Sans Variable', 'Segoe UI', system-ui, sans-serif` | 300–600 | Humanist-grotesque workhorse. Carries all prose and tables. |
| UI / labels | `'Martian Mono Variable', ui-monospace, monospace` | 500–600, `wdth 100` | Uppercase, tracked. Metadata, plugin IDs, tier badges, section numbers. |
| Mono / numerals | `'Martian Mono Variable', ui-monospace, monospace` | 400, `wdth 75` | Code blocks and inline code. `font-variant-numeric: tabular-nums` on all tables and counts. |

All three are OFL and self-hosted. **The `latin` range alone is enough** — every Spanish diacritic (á é í ó ú ü ñ ¡ ¿) lives between U+00A1 and U+00FC, inside `U+0000-00FF`. `latin-ext` covers Polish, Czech and Turkish and is dead weight on a site that ships English and Spanish.

Axis ranges are declared as narrow as the design actually uses, because a variable font's file size scales with the span of its axes. Measured on the `latin` range:

| Family | Axes requested | Size |
|---|---|---|
| Bricolage Grotesque | `wdth` 85–90, `wght` 600–700 | **76.3 KB** |
| | *(`opsz` 12–96, `wdth` 85–100, `wght` 500–700 — the first draft of this table)* | *128.2 KB* |
| Spline Sans | `wght` 300–600 | 56.5 KB |
| Martian Mono | `wdth` 75–100, `wght` 400–600 | 37.4 KB |
| | | **170.2 KB total** |

Declaring `wdth` up to 100 and `opsz` at all cost 52 KB on the family that renders the LCP element, for widths and optical sizes no screen uses. Narrow the range before adding a weight.

Loading: preload **Spline Sans** and **Bricolage Grotesque** only (above the fold). Martian Mono loads `font-display: swap` — it carries labels and code, never the LCP element. Each family carries a metric-matched fallback so `swap` is a repaint, not a relayout:

| Family | Fallback | `size-adjust` | `ascent` / `descent` | Width error unadjusted |
|---|---|---|---|---|
| Bricolage Grotesque | Trebuchet MS | `100.07%` | `92.94%` / `26.98%` | 0.1% |
| Spline Sans | Arial | `98.25%` | `98.11%` / `24.02%` | 1.8% |
| Martian Mono | Courier New | `116.65%` | `85.73%` / `17.15%` | **14.3%** |

Measured with canvas `measureText` against the real faces at the weights the page paints, not copied from a generator. The fallbacks are the three families present on both macOS and Windows, so one set of numbers is correct on both. Martian Mono is why this is not optional: it sets the `h1` on 84 of the 88 routes and every row of the reference index, and Courier New runs 14% narrow against it — every one of those lines rewrapped on swap. Verified after: `shopify-theme-architecture` measures 273.01 px in the webfont and 272.97 px in the adjusted fallback, against 234.04 px unadjusted — **14.27% → 0.01%**.

Declare the faces with `local()` and no `url()`: on a system missing the named face the whole `@font-face` drops and the stack falls through to the plain names, so there is nothing to download and nothing to break.

Scale (fluid, display as outlier then ratio 1.25):

| Token | Size (clamp) | Line height | Tracking |
|---|---|---|---|
| `--text-display` | `clamp(3.25rem, 9vw, 7.5rem)` | 0.92 | -0.03em |
| `--text-h1` | `clamp(2.25rem, 4.5vw, 3.25rem)` | 1.08 | -0.02em |
| `--text-h2` | `clamp(1.625rem, 2.6vw, 2rem)` | 1.18 | -0.01em |
| `--text-h3` | `1.3rem` | 1.3 | 0 |
| `--text-body` | `1.0625rem` | 1.65 | 0 |
| `--text-small` | `0.9375rem` | 1.55 | 0 |
| `--text-label` | `0.75rem` | 1.2 | 0.08em, uppercase |
| `--text-code` | `0.9375rem` | 1.6 | 0 |
| `--text-meta` | `0.8125rem` | 1.7 | 0 |

`--text-meta` is the one size that exists for a face rather than a level: Martian Mono sets roughly 15% wider per character than Spline Sans at the same em, so a dense mono list — the skill names under a plugin figure — reads a size larger than the prose around it and wraps where the prose does not. It is **mono-only**; prose at this size fails the §2 floor.

## 3. Color

Primitives (OKLCH) — one warm hue family (55–85°) for every surface, one cool-green accent (135°). Chroma on surfaces is capped at 0.018 so warm dark never turns muddy.

| Token | Value |
|---|---|
| `--walnut-900` | `oklch(0.15 0.014 55)` |
| `--walnut-800` | `oklch(0.19 0.015 55)` |
| `--walnut-700` | `oklch(0.235 0.016 55)` |
| `--walnut-600` | `oklch(0.28 0.017 55)` |
| `--walnut-400` | `oklch(0.58 0.018 58)` |
| `--walnut-500` | `oklch(0.40 0.018 58)` |
| `--walnut-200` | `oklch(0.72 0.018 75)` |
| `--kigaro-100` | `oklch(0.93 0.015 80)` |
| `--kigaro-200` | `oklch(0.99 0.008 85)` |
| `--kigaro-300` | `oklch(0.965 0.012 85)` |
| `--kigaro-350` | `oklch(0.935 0.014 83)` |
| `--kigaro-450` | `oklch(0.895 0.016 82)` |
| `--kigaro-500` | `oklch(0.72 0.020 80)` |
| `--kigaro-600` | `oklch(0.56 0.022 80)` |
| `--kigaro-700` | `oklch(0.44 0.022 58)` |
| `--kigaro-800` | `oklch(0.24 0.02 55)` |
| `--moss-300` | `oklch(0.86 0.14 120)` |
| `--moss-350` | `oklch(0.76 0.12 135)` |
| `--moss-400` | `oklch(0.70 0.11 135)` |
| `--moss-500` | `oklch(0.56 0.10 135)` |
| `--moss-550` | `oklch(0.52 0.08 135)` |
| `--moss-600` | `oklch(0.46 0.12 135)` |
| `--moss-700` | `oklch(0.40 0.11 135)` |
| `--moss-750` | `oklch(0.36 0.105 135)` |
| `--amber-400` | `oklch(0.78 0.13 75)` |
| `--amber-600` | `oklch(0.49 0.105 70)` |
| `--ember-400` | `oklch(0.70 0.17 28)` |
| `--ember-600` | `oklch(0.48 0.18 28)` |

Roles — **dark is the default theme**, light is the honest daylight companion:

| Role | Dark (default) | Light |
|---|---|---|
| `--color-surface` | `--walnut-800` | `--kigaro-300` |
| `--color-surface-sunk` | `--walnut-900` | `--kigaro-450` |
| `--color-surface-raised` | `--walnut-700` | `--kigaro-200` |
| `--color-surface-raised-2` | `--walnut-600` | `--kigaro-350` |
| `--color-text` | `--kigaro-100` | `--kigaro-800` |
| `--color-text-muted` | `--walnut-200` | `--kigaro-700` |
| `--color-seam` | `--moss-550` | `--moss-500` |
| `--color-divider` | `--walnut-500` | `--kigaro-500` |
| `--color-border` | `--walnut-400` | `--kigaro-600` |
| `--color-accent` | `--moss-400` | `--moss-600` |
| `--color-accent-hover` | `--moss-350` | `--moss-750` |
| `--color-accent-contrast` | `oklch(0.17 0.02 120)` | `oklch(0.985 0.01 90)` |
| `--color-focus` | `--moss-300` | `--moss-700` |
| `--color-warning` | `--amber-400` | `--amber-600` |
| `--color-danger` | `--ember-400` | `--ember-600` |

Two deliberate omissions: **`--color-success` is `--color-accent`** (moss already reads as affirmative; a second green would be indistinguishable), and there is **no `--color-info`** — informational notes use `--color-text-muted` with a divider. Three signal colors, not five.

### The four surfaces are not a depth ranking

`surface-raised` and `surface-raised-2` are **the two interlocking siblings**. The rule is that they must be distinguishable from each other and from `surface` — not that one is "higher". In dark they sit above `surface` (0.235, 0.28); in light they straddle it, one lighter and one darker (0.99, 0.935). That asymmetry is deliberate: in a light theme there is no room above `0.99`, so the second sibling reads by going down instead of up. Do not "fix" it into a monotonic ramp — that collapses the alternation the interlock depends on. `surface-sunk` is the only true depth level and is always the furthest from `surface`.

### Three line tokens, three jobs — never substitute one for another

| Token | Job | Floor |
|---|---|---|
| `--color-seam` | **The signature joint line** between interlocking modules. Moss-derived, deliberately visible — this is the element the whole direction is named for. | ≥2.3:1 on every surface |
| `--color-divider` | Structural hairlines: rows inside a module, the header and footer boundaries, list separators. Warm neutral, quiet but perceivable. | ≥1.5:1 on every surface |
| `--color-border` | Boundaries of controls and data: inputs, buttons, code blocks, tables. | ≥3:1 on every surface |

These were one token in the first draft of this file, and that was a defect: `--color-seam` resolved to the same primitive as `--color-surface-raised-2`, so every divider drawn on an alternating module landed at **1.00:1 — literally invisible**. Any implementation that needs a fourth line token has found a gap in this file; add it here first.

Contrast (from `contrast.mjs`, verified 2026-10-04). **Every pair is measured against all four surface layers and the number shown is the worst of the four** — not a convenient one. Measuring against `surface` alone is how the `--color-danger` defect below survived the first pass.

| Pair | Dark (worst of 4) | Light (worst of 4) | Min |
|---|---|---|---|
| text on any surface | 11.91 | 12.06 | 4.5 |
| text-muted on any surface | 5.90 | 5.70 | 4.5 |
| accent on any surface | 5.69 | 4.98 | 4.5 |
| accent-contrast on accent | 7.41 | 6.54 | 4.5 |
| focus on any surface | 9.84 | 6.47 | 3 |
| border on any surface | 3.40 | 3.40 | 3 |
| seam on any surface | 2.74 | 3.27 | 2.3 |
| divider on any surface | 1.58 | 1.81 | 1.5 |
| warning on any surface | 7.19 | 4.68 | 4.5 |
| danger on any surface | 5.09 | 5.24 | 4.5 |

Every pair passes on every layer. Re-run `contrast.mjs` against all four surfaces before adding any new color pair.

**Every token is verified inside the sRGB gamut.** This is a separate check from contrast and it matters: an out-of-gamut OKLCH value is silently clipped by the browser, so the rendered color stops matching the spec and the contrast you verified was the clipped color's, not the token's. Two tokens were caught here — light `--color-focus` (chroma 0.14 → 0.11) and light `--color-warning` (`0.52 0.14 70` → `0.49 0.105 70`); at hue 70 the sRGB chroma ceiling falls as lightness drops, so both constraints had to be solved together. Check gamut on every new color, not just contrast.

**`--color-danger` was corrected after a prototype review**: at `oklch(0.65 0.17 28)` it measured **4.19:1 on dark `surface-raised-2`** — a fail hidden by only ever testing it against `surface`. Now `oklch(0.70 0.17 28)`, worst case 5.09:1.

sRGB equivalents, for tools that cannot take OKLCH — the conversion, not a reinterpretation:

| Role | Dark | Light |
|---|---|---|
| surface | `#19120D` | `#F7F3EB` |
| surface-sunk | `#100A06` | `#E2DCD1` |
| surface-raised | `#241C17` | `#FEFBF6` |
| surface-raised-2 | `#302721` | `#EEE9DF` |
| text | `#EDE7DD` | `#271D16` |
| text-muted | `#ABA398` | `#5C5047` |
| seam | `#557343` | `#5A8143` |
| divider | `#4F453E` | `#ABA397` |
| border | `#837870` | `#7B7366` |
| accent | `#80AE67` | `#386616` |
| accent-contrast | `#0E1107` | `#FDFAF3` |
| focus | `#C5DE70` | `#2B5409` |
| warning | `#E8AA4E` | `#865403` |
| danger | `#F66E60` | `#AC1B18` |

## 4. Spacing

Scale: `4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192` → `--space-1` … `--space-11`.

Layout: `--space-section-block: clamp(4rem, 9vh, 8rem)` · `--space-gutter: clamp(1rem, 4vw, 2.5rem)` · `--space-stack-sm: 0.75rem` · `--space-stack-md: 1.5rem` · `--space-stack-lg: 3rem` · `--space-module-pad: clamp(1.5rem, 3vw, 2.5rem)`.

Module padding must be ≥ `--chamfer-module` on the chamfered corner so content never collides with the cut.

## 5. Shape & depth

| Token | Value | Used for |
|---|---|---|
| `--chamfer-module` | `20px` | Top-right cut on top-level modules. The signature. |
| `--chamfer-control` | `8px` | Primary button only — the one control that echoes the signature. |
| `--radius-container` | `0` | Everything that is not a module. |
| `--radius-control` | `0` | Buttons, inputs, selects, tabs. |
| `--radius-media` | `0` | Diagrams, figures. |
| `--border-width` | `1px` | Hairline. Code blocks, tables, controls. Uses `--color-border`. |
| `--seam-width` | `2px` | The signature joint line between sibling modules. Uses `--color-seam`. Raised from 1 px after the prototype: at a 1 px hairline the joint reads as an incidental edge rather than the element the whole direction is named for. It is a **line weight, never a spacing value** — use `--space-*` for gaps. |
| `--divider-width` | `1px` | Rows, header and footer boundaries. Uses `--color-divider`. |
| `--elevation-1` | *none* | **No shadows anywhere.** Depth is tonal — see §3 on why the four surfaces are not a ranking. |

Chamfer implementation: `corner-shape: bevel` with `border-radius: 0 var(--chamfer-module) 0 0` where supported; otherwise `clip-path: polygon(0 0, calc(100% - var(--chamfer-module)) 0, 100% var(--chamfer-module), 100% 100%, 0 100%)`. Modules carry no border, so neither technique loses an edge.

**Never apply `clip-path` to an element that owns a focus ring** — `clip-path` clips the outline too, so the ring vanishes exactly when it matters. Two valid fixes: put the chamfer on a wrapper and the focus ring on the control inside, or drop the chamfer for the duration of the focus state (`:focus-visible { clip-path: none }`). The second is correct for the primary button, where the chamfer *is* the control.

## 6. Layout

- **Grid:** 12 columns, **no column gap**, inset from the viewport by `--space-gutter`. The interlock is the reason: consecutive modules share columns 6–7, and a column gap would put a strip of page background inside the overlap, which is the one place the two modules must actually touch. The gutter is the page's outer inset, not a gap between tracks. Modules interlock by alternating spans with a one-column overlap: `1–7` then `6–12` then `1–7`, so consecutive modules share column 6–7. **The seam is drawn in `--color-seam` at `--seam-width`, lives on the shared column edge, and must land on the same grid line in every section** — that repetition is what makes the joint read as a joint rather than a stagger. Draw it as a solid token, never as `--color-accent` at reduced opacity: a translucent line composites differently over each of the four surfaces, so its contrast becomes unpredictable and unverifiable.
- **Max widths:** prose `68ch` (`--measure-prose`) · wide `78rem` (`--measure-wide`) · module grid `90rem` (`--measure-grid`) · single controls and their empty states `44rem` (`--measure-control`) · the reference-page table of contents `16rem` (`--measure-toc`) · full bleed for the manifesto only. A search field wider than `--measure-control` reads as a page banner rather than a control, and its caret ends up far from the results it filters.
- **Breakpoints:** `48rem` (interlock collapses to a single stacked column, the seam becomes a full-width horizontal rule) · `64rem` · `90rem`. Below `48rem` the chamfer stays; the offset does not.
- **Container queries for:** skill/command cards, the plugin matrix, code blocks with line numbers, and the reference-page table of contents — all appear at more than one width and must size to their container, not the viewport.
- **The table of contents is a wide-screen affordance.** It appears beside the body at `60rem` of *container* width and is not rendered below that. It lists `h2` only: these pages run to 14 of them, and folding in the `h3`s makes the list taller than the column it has to sit in. It duplicates headings that are in the document either way, so a reader without it loses a shortcut, not content — which is why hiding it below the breakpoint beats pushing 14 links above the first paragraph on a phone.

## 7. Motion

| Token | Value |
|---|---|
| `--motion-instant` | `100ms` |
| `--motion-quick` | `180ms` |
| `--motion-standard` | `280ms` |
| `--motion-slot` | `360ms` |
| `--ease-enter` | `cubic-bezier(0.16, 1, 0.3, 1)` |
| `--ease-exit` | `cubic-bezier(0.7, 0, 0.84, 0)` |
| `--ease-move` | `cubic-bezier(0.4, 0, 0.2, 1)` |

The slot-home reveal: module translates `24px` along its interlock axis into place over `--motion-slot` with `--ease-enter`, opacity 0 → 1. **Landing page only, once per module, on first entry into the viewport.** Never on reference pages. Never re-triggered on scroll back.

**A module that is on screen when the page paints does not reveal at all** — it never *enters* the viewport, so the rule does not apply to it, and the first interlock carries no `data-reveal` for that reason. This is not a detail. The start state is `opacity: 0` set in CSS at parse time and cleared only once the observer runs after hydration, so a module that begins above the fold is genuinely invisible from first paint until the JS lands — bounded only by the 2.5 s fallback, and long enough on a throttled phone that Lighthouse's axe pass reported `color-contrast` on it. Animate what arrives; never animate in the thing the reader is already looking at.

Everything else uses `--motion-quick` at most: hover/active on controls, theme toggle, language switch, disclosure. No hover scaling. No scroll-linked animation.

Reduced motion (`prefers-reduced-motion: reduce`): slot reveals become opacity-only at `--motion-instant`, all transforms are dropped, and the theme/language transitions become instant. Honoured, not faked — the hook is a media query in CSS, not a JS flag.

## 8. Iconography & imagery

- **Icons:** no general icon set. Icons are permitted only where they aid scanning in UI chrome (external-link, copy, theme, language, search) — 1.5 px stroke, 20 px box, drawn to match Martian Mono's squareness. No decorative icons. No emoji. Never an icon in a tinted rounded square.
- **Imagery:** there is no photography and there will be none. The visual content is **joint diagrams**: line drawings of how plugins, commands and skills interlock, drawn in `--color-seam` and `--color-accent` on `--color-surface-sunk`, 1.5 px stroke, authored as inline SVG so they theme and scale for free.
- **The composition figure** is the hero of the landing page and replaces the screenshot the site does not have. It states the one rule written nowhere else: `sumi` and `sumi-design` ship in every project, and exactly one stack pack fits on top. Each row carries its plugin's real skill names, so the figure doubles as the wall chart of the framework's whole surface.
- **Illustration style:** orthographic, no perspective, no fills, no gradients. A technical drawing, not an illustration.

## 9. Accessibility rules

- **Focus ring:** `2px solid var(--color-focus)` at `2px` offset, on every focusable element, in both themes. Never removed, never replaced by a color change alone. Verified ≥3:1 on all four surface layers. Watch for `clip-path` clipping it — see §5.
- **Inset focus:** a full-bleed row has no room outside itself for a ring, so it draws the ring inward with `outline-offset: calc(var(--focus-width) * -1)`. Derived, never written as a literal `-2px`: the two must move together or the ring detaches from the edge the moment the width changes.
- **Minimum target:** 24×24 CSS px (WCAG 2.2 AA `2.5.8`); 44×44 for the mobile nav, theme toggle and language switch.
- **Contrast minimums:** as section 3. New pairs go through `contrast.mjs` **against all four surface layers**, not just `surface`, before they ship. Checking one layer is what let a 4.19:1 `danger` ship into a prototype.
- **Motion limits:** as section 7.
- **Non-color cues:** tier badges (T0/T1/T2) and signal states carry a label or a shape, never color alone — the three signal colors are not distinguishable to every reader.
- **Language:** `lang` set correctly per page and switched with the content; the language switch is a real link to the translated URL, not a JS toggle, so it works without script and is crawlable.
- **Landmarks:** real `header`/`nav`/`main`/`aside`/`footer`, one `h1` per page, heading levels never skipped (the reference pages are generated — the generator must be verified, not trusted).
- **Skip link** to `main`, visible on focus.

## 10. Components

| Component | Variants | Tokens used | Notes |
|---|---|---|---|
| Module | raised, raised-2, sunk | `--chamfer-module`, `--color-surface-raised` / `-raised-2`, `--space-module-pad` | The chamfered container. No border, no shadow. One cut corner, top-right. Siblings alternate `raised` / `raised-2`. |
| Seam | vertical, horizontal | `--color-seam`, `--seam-width` | The signature joint between sibling modules. Solid token, never accent-at-opacity. Must align to the same grid line in every section. |
| Divider | row, boundary | `--color-divider`, `--divider-width` | Rows inside a module, header and footer boundaries. Must stay perceivable on all four surfaces — this is the pair that failed at 1.00:1 before the token split. |
| Button | primary, secondary, ghost | `--color-accent`, `--color-accent-contrast`, `--chamfer-control` (primary only), `--radius-control` | Labels say what happens (`Instalar el plugin`, `Ver los 33 skills`), never "Get started". Primary drops its chamfer on `:focus-visible` so the ring is not clipped. |
| CodeBlock | with/without copy, with/without filename | `--color-surface-sunk`, `--color-border`, `--text-code`, Martian Mono `wdth 75` | Radius 0, hairline border, no chamfer. Copy button is a real `button` with an `aria-live` confirmation, and **copies the entire block** — not the highlighted line. |
| Table | data, spec | `--color-border`, `--color-divider`, `tabular-nums` | Border around the table, dividers between rows. Scrolls in a focusable container with an accessible name when it overflows. |
| TierBadge | T0, T1, T2 | `--text-label`, `--color-accent`/`--color-warning`/`--color-text-muted` | Label text always present; color is secondary. |
| CompositionFigure | always, pick-one | `--color-seam`, `--color-divider`, `--color-accent`, container query | The landing hero figure: two interlocking modules, `ALWAYS` (core + direction) and `PICK ONE` (the four stack packs), each row listing its plugin's real skill names. Replaced a 6 × 33 matrix — see the rule below. |
| LangSwitch | — | `--text-label`, `--color-border` | Real links to the translated route. 44×44 touch target. |
| ThemeToggle | — | `--text-label`, `--color-border` | Respects `prefers-color-scheme` on first visit, then persists the choice. |
| Nav / Sidebar | desktop, drawer | `--color-divider`, `--text-label` | Reference navigation. No entrance animation. Current page marked with `aria-current`. |

### Figures carry information or they do not ship

A figure must answer the question its own heading asks. The test: cover the heading and the labels — if what remains still tells you something you could not read faster from the surrounding text, it is a figure. If it only encodes a count already printed nearby, it is decoration wearing a chart's clothes, and that is the `fake KPI dashboard` tell this design exists to avoid.

This rule retired the original hero. A 6 × 33 matrix whose columns were numbered `1…33` encoded nothing but each plugin's skill count, which every plugin card already states — and it was the wrong *shape* besides: every skill belongs to exactly one plugin, so the relation is a partition, not the many-to-many a matrix is for. Drawing a partition as a matrix can only ever produce a diagonal staircase. `CompositionFigure` replaced it.

Any visual decision not covered above is added to this file **first**, then used.

## Changelog

- 2026-10-04 Direction approved: **C — Kumiko / La junta**. Brief at `design/brief.md`. All contrast pairs verified with `contrast.mjs`; all tokens verified inside the sRGB gamut. Light `--color-focus` and `--color-warning` corrected after the gamut check. Recorded in the design ledger. Claude Design package at `design/claude-design-brief.md`.
- 2026-10-04 **Revised after the first prototype** (`Prototipo Sumitsubo Docs`). The prototype was faithful to this file, which is how it exposed five defects *in this file*:
  1. `--color-seam` resolved to the same primitive as `--color-surface-raised-2`, so dividers on alternating modules rendered at **1.00:1 — invisible**. One overloaded token is now three: `--color-seam` (signature joint, ≥2.3:1), `--color-divider` (new, structural hairlines, ≥1.5:1), `--color-border` (controls and data, ≥3:1).
  2. The light theme had only **three** distinct surfaces — `surface-sunk` and `surface-raised-2` were both `--kigaro-400`. Split into `--kigaro-450` (sunk) and `--kigaro-350` (raised-2); added the rule that the two raised siblings are an alternation, not a ranking.
  3. The seam was unimplementable as specified, so the prototype drew it as `--color-accent` at `opacity: 0.55`. Intent kept, method rejected: the seam is now a solid token in both themes, because a translucent line composites differently over each surface and cannot be verified.
  4. `--color-danger` measured **4.19:1 on dark `surface-raised-2`** — a fail that survived because the first pass only tested it against `surface`. Now `oklch(0.70 0.17 28)`, worst case 5.09:1. The whole contrast table is now reported as worst-of-four-surfaces.
  5. Added the rule that a figure must answer the question its heading asks, after the hero `PluginMatrix` shipped as a 6 × 33 grid of unnamed indices that encoded only a count already printed on every plugin card.
- 2026-10-05 `PluginMatrix` retired and replaced by `CompositionFigure` (§8, §10). The second prototype build also moved every count in the UI to derive from one skills map, which removed a contradiction where the matrix credited `sumi-design` with 6 skills while the reference index listed none.
