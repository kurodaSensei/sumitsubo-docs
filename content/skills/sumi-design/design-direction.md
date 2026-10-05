---
title: "design-direction"
description: "The Sumitsubo creative-direction process that runs BEFORE any visual design or UI code — discovery brief, anti-references, ledger check, three genuinely divergent directions built on explicit axes, selection, and a DESIGN.md that every later screen must obey. Orchestrates Impeccable, Taste and Emil Kowalski skills when installed. Use when starting a new site, app, landing page or redesign, a brand-new section with its own look, or when the user asks for a new design, mockup or Claude Design prompt and no DESIGN.md exists. For small visual tweaks in a project that already has DESIGN.md, use design-tokens and anti-slop instead."
plugin: "sumi-design"
kind: "skill"
references: 1
source: "plugins/sumi-design/skills/design-direction/SKILL.md"
---

# Design Direction

Generic AI design is what happens when the model fills every unspecified decision with the statistical average. The cure is to leave nothing unspecified: decide the direction deliberately, in writing, before anything is drawn or coded. This process produces `DESIGN.md`; every later screen is built from it.

## Stage 0 — Companions

Installed automatically as dependencies of `sumi-design` (referenced from their upstream repos):
- **Impeccable** (`impeccable`): product context (`PRODUCT.md`), critique, audit, polish, anti-pattern detectors. Stages 1 and 6.
- **Taste** (`taste` = design-taste-frontend, plus style families `taste-minimalist`, `taste-brutalist`, `taste-soft`, `taste-redesign`): variance / motion / density dials and style references. Stage 3; `taste-redesign` for redesigns of existing sites.
- **Emil Kowalski** (`emil-design-eng`, `emil-review-animations`, `emil-animation-vocabulary`): motion craft and motion audits. Stage 6 and `sumi-design:motion`.
If any is missing (e.g. installed without dependencies), run `/sumi-design:deps`.

## Stage 1 — Discovery brief

Fill `${CLAUDE_PLUGIN_ROOT}/templates/brief.md` (save as `design/brief.md`). Ask only what you cannot infer from the repo, the client's existing site, or links the user gives. The brief must capture:
- Business, offer, audience (who, context of use, device mix), primary conversion or task.
- **Three to five brand traits as tensions**, not adjectives: "precise but warm", "luxurious but not exclusive". Single adjectives ("modern", "clean") are banned — they describe every site.
- Content reality: real copy length, real product photos or none, data density.
- Constraints: platform (Shopify theme settings, WordPress editor, app), a11y level, performance budget, existing brand assets that are non-negotiable.
If Impeccable is installed, write or update `PRODUCT.md` with the same facts (its `init`/`shape` flow) so its critiques have context.

## Stage 2 — Anti-references

Write down what this must NOT look like, in three lists:
1. **Category clichés**: what every competitor in this niche does (collect 3–5 competitor patterns if the user provides links or you can research them).
2. **AI-default tells**: from `sumi-design:anti-slop` — name the specific ones this project is most at risk of.
3. **Ledger exclusions**: run `node ${CLAUDE_PLUGIN_ROOT}/skills/design-ledger/scripts/ledger.mjs recent` and exclude display typefaces, accent hues and layout signatures used in recent projects.

## Stage 3 — Three divergent directions

Generate exactly three directions. Each is defined on the axes in `references/divergence-axes.md` (concept/metaphor, typography voice, color strategy, layout system, shape language, imagery, motion personality, density, copy voice). **Any two directions must differ on at least five axes**; renaming the same layout with a different palette is not a direction.

Each direction contains:
- A name and a one-sentence concept grounded in the brand (a metaphor from the client's world, not from "tech").
- Type pairing with specific families (and why they fit), scale ratio, and one typographic signature move.
- Palette as roles (surface, text, muted, accent, signal) with OKLCH values, contrast-checked.
- Layout system and one signature composition for the hero or key screen.
- Taste dial settings (DESIGN_VARIANCE, MOTION_INTENSITY, VISUAL_DENSITY on 1–10) if Taste is installed.
- Motion personality in one line (e.g. "mechanical and precise: 120–180 ms, ease-out, no overshoot").
- Risks: what could go wrong with this direction for this audience.

Direction A should be the strongest fit for the brief; B should push one axis to an unexpected place; C should be the bold option the client would not have imagined. None may be "safe average".

Present them compactly (a table plus a short paragraph each). If the user wants visual previews, build one small static preview per direction (hero + one content block) — or hand the three directions to Claude Design via `sumi-design:claude-design-bridge`.

## Stage 4 — Select and refine

The user picks (or merges with explicit rules about which axes come from where). Resolve contradictions now, not during implementation.

## Stage 5 — DESIGN.md

Write `DESIGN.md` at the repo root from `${CLAUDE_PLUGIN_ROOT}/templates/DESIGN.md`, following `sumi-design:design-tokens`. Verify every text/background pair with `contrast.mjs`. Then record the project in the ledger (`ledger.mjs add …`).

## Stage 6 — Build, then critique

- Build screens from tokens only (`sumi:css-architecture`). Motion follows `sumi-design:motion` (and Emil's skills when installed).
- After each significant screen, run `/sumi-design:critique`: the `lens-design` agent plus Impeccable's `critique`/`audit` when available. Fix, then `polish`.
- Any new visual decision not covered by DESIGN.md is added to DESIGN.md first, then used.

## Rules

- Never start drawing or coding UI without a DESIGN.md (for small edits in an existing project, read the existing one).
- Never default: every font, color, radius and spacing choice must be traceable to the brief or DESIGN.md.
- Real content beats lorem ipsum; design with the client's actual copy and imagery or realistic stand-ins.
- Accessibility is part of the direction: contrast, focus styles, target sizes and reduced motion are defined in DESIGN.md, not retrofitted.

## Divergence axes

Directions are defined by choosing a position on each axis. Two directions must differ on ≥ 5 axes. The options listed are starting points, not a menu to pick the first item from.

| # | Axis | Range of positions (examples) |
|---|---|---|
| 1 | **Concept / metaphor** | Drawn from the client's world: a workshop, an archive, a field guide, a ticket stub, a lab notebook, a gallery wall label, a dashboard of a vehicle, a recipe card, a map |
| 2 | **Typography voice** | Grotesk neutral · humanist warm · geometric strict · neo-grotesk condensed · transitional serif · high-contrast didone · slab · mono-accented · display script used sparingly · variable-axis expressive |
| 3 | **Type scale & hierarchy** | Tight ratio (1.125) quiet · classic (1.25) · dramatic (1.5+) with oversized display · editorial mixed sizes · uniform size, hierarchy by weight/color only |
| 4 | **Color strategy** | Monochrome + one signal · tinted neutrals with earthy accent · duotone · high-saturation brand flood · dark-first · paper/ink · color by section (chaptered) · photographic palette pulled from imagery |
| 5 | **Layout system** | Strict 12-col grid · asymmetric editorial · modular bento (only if earned) · single column narrative · split screen · full-bleed sequences · overlapping layers · index/list-driven · canvas/spatial |
| 6 | **Shape language** | Sharp 0 radius · micro radius 2–4 · soft 12–20 · pill · mixed by role · organic/blob (rare) · cut corners · hairline borders instead of fills |
| 7 | **Depth model** | Flat with borders · tonal layering (no shadows) · single soft elevation · hard offset shadows · glass (only with a reason) · texture/grain |
| 8 | **Imagery** | Product photography on color · documentary/candid · illustration (custom, specified style) · typographic only · data visualization as hero · 3D/renders (specified) · archival/scans · none |
| 9 | **Motion personality** | Still (almost none) · mechanical precise · fluid springy · cinematic slow reveals · playful/elastic (sparingly) · scroll-narrative |
| 10 | **Density** | Spacious gallery · balanced · information-dense dashboard/catalog |
| 11 | **Copy voice** | Plain-spoken expert · warm conversational · terse technical · editorial/literary · bold manifesto · playful |
| 12 | **Signature element** | One memorable, ownable device: a recurring typographic treatment, a cursor, a grid overlay, a stamp, a section transition, a unique navigation pattern, a data motif |

### Fit checks for every direction

- Does the concept come from the brand's world, not from "SaaS" or "tech"?
- Could a competitor swap their logo in and use it unchanged? If yes, it is not a direction.
- Is the signature element ownable and repeatable across pages?
- Does it survive real content (long product names, no photos, translations, dense tables)?
- Contrast and focus visibility pass in all its themes?
- Can the platform implement it within budget (Shopify settings, WP editor, performance)?
