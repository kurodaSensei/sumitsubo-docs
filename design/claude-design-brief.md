# Claude Design brief — Sumitsubo docs

> Carries the approved direction into Claude Design, which cannot load Claude Code plugins. Every value below is copied exactly from `DESIGN.md` — do not paraphrase, do not substitute, do not "improve".
>
> **Step 1:** create a Design System in Claude Design from section 3 before designing any screen. **Step 2:** paste one screen prompt at a time from section 5. **Step 3:** check each result against section 4 and section 6 before continuing.

---

## 1. Context

- **Client:** Sumitsubo (墨壺) — an opinionated AI framework for web design and development with Claude Code. Free, MIT, v0.4.0, by Alfredo Rodríguez.
- **Audience:** experienced web developers and design engineers already using Claude Code. Skeptical of AI tooling, allergic to marketing language, able to tell craft from template at a glance.
- **Primary task:** understand the thesis in under 30 seconds and run `/plugin marketplace add <user>/sumitsubo`. Secondary: find one fact in one of 42 reference pages, fast.
- **Platform:** Nuxt 4, prerendered static. WCAG 2.2 AA. LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 170 KB gzip.
- **Content reality:** no photography, no logo, no illustration exists or will exist. Bilingual EN/ES — Spanish runs ~20% longer. Reference pages are generated from the framework repo at build time, so the design must survive copy it does not control: terse technical prose, 3–6 column tables, long code fences.

---

## 2. Direction — "Kumiko / La junta"

- **Concept:** *Kumiko* — Japanese joinery, wood joined without nails. Sumitsubo's claim is composition: six plugins that interlock, skills that compose. The site is built from offset modules that visibly fit into one another, and the joint is never hidden. The material is **oiled walnut, not a terminal**.
- **Brand tensions:** precise but hand-made · opinionated but not dogmatic · traditional craft but current engineering · dense but calm · confident but unmarketed.
- **Signature element:** **the chamfer and the seam.** Every top-level module has exactly **one** cut corner — top-right, 20 px — and sibling modules share a visible seam line that lands on the **same grid column in every section of the page**. The chamfer appears on modules and on the primary button only. Never on code blocks, tables, inputs, secondary buttons or badges. One cut per module, never two.
- **Motion personality:** modules slot home. 360 ms, expo-out, no overshoot — a joint seating, not a card bouncing.

---

## 3. Design system spec — use these exact values

### Typefaces

| Role | Family | Weights / axes | Used for |
|---|---|---|---|
| Display | **Bricolage Grotesque** (variable) | 500–700, `wdth` 85–100 | Manifesto, page titles |
| Body | **Spline Sans** (variable) | 300–600 | All prose, tables |
| UI / labels | **Martian Mono** (variable) | 500–600 at `wdth 100`, uppercase, tracking 0.08em | Metadata, plugin IDs, tier badges, section numbers |
| Code | **Martian Mono** (variable) | 400 at `wdth 75` | Code blocks, inline code |

Martian Mono is one family used at two widths — `wdth 100` for labels, `wdth 75` for code. Do not substitute a different mono for code.

### Type scale

| Token | Size | Line height | Tracking |
|---|---|---|---|
| display | `clamp(3.25rem, 9vw, 7.5rem)` | 0.92 | -0.03em |
| h1 | `clamp(2.25rem, 4.5vw, 3.25rem)` | 1.08 | -0.02em |
| h2 | `clamp(1.625rem, 2.6vw, 2rem)` | 1.18 | -0.01em |
| h3 | `1.3rem` | 1.3 | 0 |
| body | `1.0625rem` (17 px) | 1.65 | 0 |
| small | `0.9375rem` | 1.55 | 0 |
| label | `0.75rem` | 1.2 | 0.08em, uppercase |
| code | `0.9375rem` | 1.6 | 0 |

Display is a deliberate outlier. From h1 down the ratio is 1.25.

### Color — dark is the default theme

> The two colour tables below are **generated from `DESIGN.md`** — do not edit them by hand. Change the token in `DESIGN.md`, then run `node design/tokens.mjs`. `--check` fails if they have drifted; `--test` self-checks the conversion. The generator refuses to emit an out-of-gamut value, and refuses to emit two roles that resolve to the same colour in one theme — the defect that produced invisible 1.00:1 dividers in the first prototype.

<!-- tokens:oklch -->
| Role | Dark (default) | Light |
|---|---|---|
| surface | `oklch(0.19 0.015 55)` | `oklch(0.965 0.012 85)` |
| surface-sunk | `oklch(0.15 0.014 55)` | `oklch(0.895 0.016 82)` |
| surface-raised | `oklch(0.235 0.016 55)` | `oklch(0.99 0.008 85)` |
| surface-raised-2 | `oklch(0.28 0.017 55)` | `oklch(0.935 0.014 83)` |
| text | `oklch(0.93 0.015 80)` | `oklch(0.24 0.02 55)` |
| text-muted | `oklch(0.72 0.018 75)` | `oklch(0.44 0.022 58)` |
| **seam** (signature joint) | `oklch(0.52 0.08 135)` | `oklch(0.56 0.10 135)` |
| **divider** (rows, header, footer) | `oklch(0.40 0.018 58)` | `oklch(0.72 0.020 80)` |
| border (controls, data) | `oklch(0.58 0.018 58)` | `oklch(0.56 0.022 80)` |
| accent | `oklch(0.70 0.11 135)` | `oklch(0.46 0.12 135)` |
| accent-contrast | `oklch(0.17 0.02 120)` | `oklch(0.985 0.01 90)` |
| focus | `oklch(0.86 0.14 120)` | `oklch(0.40 0.11 135)` |
| warning | `oklch(0.78 0.13 75)` | `oklch(0.49 0.105 70)` |
| danger | `oklch(0.70 0.17 28)` | `oklch(0.48 0.18 28)` |
<!-- /tokens:oklch -->

Every surface is one warm hue family (55–85°) with chroma capped at 0.018 so warm dark never turns muddy. The accent is **moss green at 135°** — cool green against warm wood. There is no success color (the accent is the success color) and **no info color** (informational notes use text-muted with a divider). Three signal colors, not five.

**The four surfaces are an alternation, not a ranking.** `raised` and `raised-2` are the two interlocking siblings and must be distinguishable from each other and from `surface`. In dark they both sit above `surface`; in light they straddle it, one lighter and one darker — there is no room above `0.99`. Do not normalise this into a monotonic ramp.

**Three line tokens, three jobs — never substitute one for another.** `seam` is the signature joint between interlocking modules and is deliberately visible (moss, ≥2.3:1). `divider` is the quiet structural hairline for rows, the header and the footer (warm neutral, ≥1.5:1). `border` outlines controls and data (≥3:1). Draw the seam as a **solid color**, never as the accent at reduced opacity — a translucent line composites differently over each surface and its contrast cannot be verified.

sRGB hex equivalents, if Claude Design cannot take OKLCH — computed from the values above, every one verified inside the sRGB gamut. The OKLCH values remain authoritative; these are the conversion, not a reinterpretation:

<!-- tokens:hex -->
| Role | Dark hex | Light hex |
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
<!-- /tokens:hex -->

### Spacing

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128 · 192`
Section block: `clamp(4rem, 9vh, 8rem)` · gutter: `clamp(1rem, 4vw, 2.5rem)` · module padding: `clamp(1.5rem, 3vw, 2.5rem)`.
Module padding must be ≥ the 20 px chamfer so content never collides with the cut.

### Shape and depth

- **Chamfer, modules:** 20 px, top-right corner only.
- **Chamfer, primary button:** 8 px, top-right only. The only control that echoes the signature.
- **Radius everywhere else: 0.** Buttons, inputs, selects, tabs, code blocks, tables, figures.
- **Border:** 1 px hairline, on code blocks, tables and controls only.
- **Modules carry no border at all.**
- **No shadows anywhere.** Depth is tonal, read as a warmth shift. `surface-sunk` is the one true depth level; `raised` and `raised-2` are the interlocking siblings, not rungs on a ladder. There is no elevation token.

### Layout

12 columns. Modules interlock by alternating spans with a one-column overlap: `1–7`, then `6–12`, then `1–7`. The seam sits on the shared column edge and **must land on the same grid line in every section** — that repetition is what makes the joint read as a joint rather than a random stagger. Prose max width 68ch; wide 78rem; module grid 90rem; full bleed for the manifesto only. Below 48rem the interlock collapses to a stacked single column and seams become full-width horizontal rules — the chamfer stays, the offset does not.

### Motion

instant 100 ms · quick 180 ms · standard 280 ms · slot 360 ms.
Ease-enter `cubic-bezier(0.16, 1, 0.3, 1)` · ease-exit `cubic-bezier(0.7, 0, 0.84, 0)` · ease-move `cubic-bezier(0.4, 0, 0.2, 1)`.
Slot-home reveal: module translates 24 px along its interlock axis into place, 360 ms, ease-enter, opacity 0 → 1. **Landing page only, once per module, on first entry into the viewport.** Never on reference pages. Everything else uses 180 ms at most. No hover scaling, no scroll-linked animation.

### Icons and imagery

- No general icon set. Icons only in UI chrome — external-link, copy, theme, language, search — at 1.5 px stroke in a 20 px box, drawn to match Martian Mono's squareness.
- All figures are **orthographic line diagrams of joints**: how plugins, commands and skills interlock. 1.5 px stroke in seam and accent on surface-sunk. No perspective, no fills, no gradients. A technical drawing, not an illustration.

---

## 4. Do not use — explicit prohibitions

**Typography**
- No Inter. No Geist. No system-ui as the identity. No Roboto, no Open Sans, no Poppins.
- No font not listed in section 3.

**Color**
- No purple, no violet, no indigo. No blue-to-teal or teal-to-violet gradient. No gradient of any kind.
- No gradient text, no gradient headline, no gradient border.
- No neon accent on dark presented as "premium".
- No pure `#000` and no pure `#fff`.
- No cool grey or neutral slate surfaces — every surface is warm walnut.

**Shape and depth**
- No rounded corners. No uniform 8–12 px radius. No `border-radius` on anything but the two chamfers.
- No drop shadows, no box shadows, no glows.
- No glassmorphism, no frosted cards, no backdrop blur, no blurry colored blobs.

**Layout**
- No centered hero. No pill badge above a headline. No `badge → giant headline → subtitle → two buttons → screenshot` stack.
- No three feature cards. No icon in a tinted rounded square.
- No bento grid — not for the six plugins, not for anything.
- No logo cloud. No "Trusted by". No fabricated testimonials. No invented statistics.
- No FAQ accordion followed by a full-width CTA band followed by a four-column footer.
- No left-sidebar-tree + right-hand-TOC default docs chrome.
- No identical section rhythm repeated eight times.

**Imagery**
- No stock photography. No people at laptops. No abstract 3D blobs. No mesh gradients.
- No decorative emoji. No sparkles, rockets or lightning bolts.
- No terminal screenshot behind a glow as the hero.

**Copy**
- Banned words: Unlock · Elevate · Seamless · Supercharge · Empower · Revolutionize · Next-generation · All-in-one · Effortlessly · "Your ultimate…" · "Say goodbye to…".
- No reflex triplets ("Fast. Simple. Powerful.").
- No button labelled "Get started". Buttons say what happens.
- No exclamation marks. No lorem ipsum — all copy below is real.

**Ledger**
- The design ledger was empty when this project was recorded, so there are no inherited exclusions. This project *sets* the baseline: Bricolage Grotesque, hue 135, the interlocking-module layout and the chamfer+seam signature are now reserved and must not reappear in the next six projects.

---

## 5. Screens

### Screen 1 — Landing (`/`) · mode: Persuade

**Purpose:** a skeptical senior developer understands the thesis and installs. One focal point: **the manifesto sentence**. The install command is the single action.

**Real copy — use verbatim:**

- Wordmark: `SUMITSUBO` · subtitle `墨壺`
- Manifesto (display type, full bleed, the focal point): **"It marks the true line before any cut is made."**
- Supporting paragraph directly below, body type, max 68ch: "Sumitsubo is the Japanese carpenter's ink line. This framework does the same — direction first, then the work. It encodes how a senior design engineer works: process that scales with the request, code quality without slop, accessibility and performance as acceptance criteria, and — above all — design that doesn't look like every other AI-generated site."
- Primary button: `Instalar el plugin` → below it, in code type: `/plugin marketplace add <user>/sumitsubo`
- Secondary link: `Ver los 33 skills`
- Metadata line in label type: `v0.4.0 · MIT · 6 PLUGINS · 9 COMANDOS · 33 SKILLS`

**Plugin modules — six, interlocking, real copy:**

| ID | Name | Description (verbatim) |
|---|---|---|
| 01 | `sumi` | Engineering core: adaptive workflow (trivial → delegated → feature file), line budgets, risk gates, context-free review lenses, HTML/CSS/JS/a11y/performance standards and safety hooks. |
| 02 | `sumi-design` | Anti-slop design direction: brief, anti-references, three divergent directions, cross-project repetition ledger, DESIGN.md tokens and motion rules. |
| 03 | `sumi-nuxt` | Nuxt 3/4 + Vue 3 + Firebase/Firestore stack pack: composables, SSR/hydration safety, data modeling, security rules, Tailwind. |
| 04 | `sumi-react` | React 19 + Next.js App Router stack pack: server/client boundaries, data fetching and caching, forms and actions, component architecture. |
| 05 | `sumi-shopify` | Shopify Online Store 2.0 stack pack: Liquid, sections, blocks, schemas, snippets, theme performance and CLI workflow. |
| 06 | `sumi-wordpress` | Native WordPress block themes (FSE, Gutenberg) with no build step: theme.json as the design system, HTML templates and PHP patterns, custom dynamic blocks. |

Lay these out as six interlocking modules — `1–7`, `6–12`, `1–7`, `6–12`, `1–7`, `6–12` — each with the top-right chamfer, each sharing a seam with its neighbour on the same grid line. Plugin ID in label type (Martian Mono, uppercase, tracked). **Not a bento grid. Not three cards in a row.**

**Required components:** Module, Seam, Divider, Button (primary + ghost), CompositionFigure, ThemeToggle, LangSwitch, CodeBlock (for the install line).

**The hero figure — CompositionFigure.** Two interlocking modules separated by the seam, replacing the screenshot the site does not have:

- **`SIEMPRE` / `ALWAYS`** — "En todos los proyectos, sea cual sea el stack." Rows: `01 sumi · 8 SKILLS` then its eight names; `02 sumi-design · 6 SKILLS` then its six.
- **`ELIGE UNO` / `PICK ONE`** — "La pieza que encaja con el stack del proyecto." Rows: `03 sumi-nuxt · 5`, `04 sumi-react · 5`, `05 sumi-shopify · 5`, `06 sumi-wordpress · 4`, each followed by its real skill names joined with ` · `.

Plugin names in Martian Mono `wdth 75` in accent; counts and group labels in label type; skill lists in Martian Mono `wdth 75` at `0.8125rem` in muted. Rows separated by `divider`.

**It must carry information.** The test: cover the heading and the labels — if what remains still tells you something you could not read faster from the surrounding text, it is a figure; if it only encodes a count already printed nearby, it is decoration wearing a chart's clothes, and that is the fake-dashboard tell this whole design exists to avoid.

This figure replaced a 6 × 33 matrix that failed the test. Do not reintroduce it: every skill belongs to exactly one plugin, so the relation is a **partition, not a many-to-many** — drawing it as a matrix can only ever produce a diagonal staircase that encodes the per-plugin count and nothing else. What the composition figure adds instead is the rule stated nowhere else on the site: core + direction always, one stack pack on top.

**States to show:** default; the slot-home reveal mid-flight on one module; copy-confirmed state on the install command; light theme.

**Breakpoints:** 375 (stacked, chamfer kept, offset dropped, seams horizontal), 768, 1280, 1600.

---

### Screen 2 — Reference index (`/reference`) · mode: Read

**Purpose:** find the right one of 42 pages in seconds. Focal point: **the search/filter field**, then the grouped list.

**Real copy:** heading `Referencia` · label line `9 COMANDOS · 33 SKILLS · 6 PLUGINS`. Groups in this order: `Comandos`, `sumi`, `sumi-design`, `sumi-nuxt`, `sumi-react`, `sumi-shopify`, `sumi-wordpress`.

Real entries — commands: `/sumi:init`, `/sumi:feature`, `/sumi:review`, `/sumi:ship`, `/sumi:models`, `/sumi:sync`, `/sumi-design:direction`, `/sumi-design:critique`, `/sumi-design:deps`.
Real entries — `sumi` skills: `workflow`, `code-quality`, `a11y`, `performance`, `css-architecture`, `html`, `js-ts`, `model-routing`.
Real entries — `sumi-nuxt` skills: `nuxt-architecture`, `nuxt-data-ssr`, `vue-components`, `firebase-firestore`, `tailwind-craft`.

**Required components:** Nav/Sidebar, search field, Module (one per group), Seam, Divider, TierBadge, Table. All seven groups render — the nine commands plus one per plugin — and a live counter reports matches against the total (`5 / 42`).

**States to show:** default; one filter term active; **empty state** ("Sin resultados para «xyz»" with a ghost button `Limpiar el filtro`); keyboard focus visible on a list item.

**No entrance animation on this screen.** Breakpoints: 375 (drawer nav), 1280.

---

### Screen 3 — Skill page (`/skills/sumi-workflow`) · mode: Read

**Purpose:** get one specific fact and leave. Focal point: **the first paragraph of body copy**, not the title.

**Real copy — verbatim:**
- Title: `workflow`
- Label line: `SKILL · SUMI · v0.4.0`
- Description: "The Sumitsubo adaptive workflow — how to scale process to the size and uncertainty of a request. Tiers (direct, delegated, feature file), refuting uncertainty before acting, the single feature file with acceptance criteria and evidence, the ~400-line budget per slice, pre-commit risk assessment and chained PRs."
- A real 3-column table with headers `Tier · Cuándo · Qué produce` and rows `T0 / cambio trivial, sin incertidumbre / el cambio, directo`, `T1 / tarea acotada, delegable / un brief y una slice verificada`, `T2 / feature con incertidumbre real / un feature file en .sumi/tasks/`.
- A code block, filename `.sumi/config.json`, showing `"lineBudget": 400` in context.
- An inline-code term in running prose: `ponytail:`.

**This is the page that proves the design survives generated content.** Show it with: a long heading that wraps to two lines, a table that overflows horizontally, a 20-line code block, and the Spanish version where every string is ~20% longer.

**Required components:** Module, Table, CodeBlock (with filename and copy button), TierBadge, breadcrumb, prev/next, on-page TOC.

**States to show:** default; table overflowing in its focusable scroll container; code block copy-confirmed; light theme; Spanish.

**No entrance animation.** Breakpoints: 375, 1280.

---

### Screen 4 — Command page (`/commands/sumi-feature`) · mode: Read

**Purpose:** learn what the command does and, critically, **what it writes to disk**. Focal point: the invocation line.

**Real copy — verbatim:**
- Title: `/sumi:feature`
- Invocation, code type: `/sumi:feature <idea>`
- Label line: `COMANDO · SUMI · T2`
- Description: "Start (or resume) a T2 feature — explore, refute uncertainty, ask the decision-level questions, forecast lines and slices, and write the single feature file in .sumi/tasks/."
- A spec block in label type with fields `TIER T2 · PLUGIN sumi · ESCRIBE .sumi/tasks/<slug>.md · LEE .sumi/config.json, CLAUDE.md`.

**Required components:** Module, CodeBlock, TierBadge, Table, Seam.

**States to show:** default; light theme. Breakpoints: 375, 1280.

---

## 6. Acceptance — check every screen against this

- **Every value comes from section 3.** Point to the token for every font, color, size, space and radius. A value that is not in section 3 is a bug — add it to `DESIGN.md` first, then use it.
- **Contrast, measured against all four surface layers — not just `surface`.** Report the worst of the four. Text ≥ 4.5:1 · muted text ≥ 4.5:1 · accent and signal colors ≥ 4.5:1 · accent-contrast on accent ≥ 4.5:1 · focus ring ≥ 3:1 · border ≥ 3:1 · seam ≥ 2.3:1 · divider ≥ 1.5:1. All pairs in section 3 are already verified this way; new pairs are not. Checking a single layer is how a 4.19:1 `danger` reached a prototype unnoticed.
- **No invented content.** Reference pages are generated from the framework repo. Placeholder code bodies, invented config keys and made-up prose must be marked as such and must never survive into an implementation.
- **Nothing omitted silently.** If a screen states a count ("33 skills", "the 42 pages"), the screen must contain that many items or say plainly which are missing and why. On-screen numbers may not contradict on-screen content.
- **sRGB gamut:** every color in section 3 is verified in gamut. Any new OKLCH value must be checked too — an out-of-gamut value is silently clipped by the browser, so the rendered color stops matching the spec and the contrast you measured was the clipped color's. Contrast and gamut are two separate checks.
- **Focus:** a 2 px solid focus ring in the focus color at 2 px offset, visible on **every** focusable element, in both themes. Never removed, never signalled by color change alone. Do not put a `clip-path` chamfer on an element that owns a focus ring — chamfer the module wrapper, ring the control inside.
- **Targets:** ≥ 24×24 px; 44×44 for mobile nav, theme toggle and language switch.
- **Non-color cues:** tier badges and signal states always carry a label or shape. Color alone is never the signal.
- **Motion:** slot reveal on the landing page only, once per module. Reduced motion → opacity-only at 100 ms, all transforms dropped.
- **Signature present and correct:** exactly one chamfer per module, top-right, 20 px. Seams align to the same grid line in every section. If you cannot point to the seam alignment, the signature is not there.
- **Both languages:** no module has a fixed height; seam alignment is driven by the grid column, never by matching text length. Verify every screen in Spanish, where strings are ~20% longer.
- **The anti-slop self-test:** could this be a template for a company in another industry? Name the signature element. Read the headline with a competitor's name — is it still true? Squint: one focal point per view? Keyboard through it: focus visible everywhere?
