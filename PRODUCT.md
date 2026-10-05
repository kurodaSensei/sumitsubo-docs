# PRODUCT.md — Sumitsubo docs

> Durable product context. Visual decisions live in `DESIGN.md`; the discovery brief lives in `design/brief.md`.

## What this is

The documentation site for **Sumitsubo (墨壺)**, an opinionated AI framework for web design and development with Claude Code. Sumitsubo is free, MIT, by Alfredo Rodríguez, at version 0.4.0, and is installed through the Claude Code plugin marketplace.

In the framework's own words:

> Sumitsubo (墨壺) is the Japanese carpenter's ink line: it marks the true line before any cut is made. This framework does the same — direction first, then the work.

> An opinionated AI framework for web design and development with Claude Code. It encodes how a senior design engineer works: process that scales with the request, code quality without slop, accessibility and performance as acceptance criteria, and — above all — design that doesn't look like every other AI-generated site.

## What it documents

6 plugins · 9 commands · 33 skills — 42 reference pages in total.

| Plugin | Purpose | Commands | Skills |
|---|---|---|---|
| `sumi` | Engineering core: adaptive workflow (trivial → delegated → feature file), line budgets, risk gates, context-free review lenses, HTML/CSS/JS/a11y/performance standards and safety hooks | 6 | 8 |
| `sumi-design` | Anti-slop design direction: brief, anti-references, three divergent directions, cross-project repetition ledger, DESIGN.md tokens and motion rules | 3 | 6 |
| `sumi-nuxt` | Nuxt 3/4 + Vue 3 + Firebase/Firestore stack pack | — | 5 |
| `sumi-react` | React 19 + Next.js App Router stack pack | — | 5 |
| `sumi-shopify` | Shopify Online Store 2.0 stack pack | — | 5 |
| `sumi-wordpress` | Native WordPress block themes (FSE, Gutenberg), no build step | — | 4 |

Fourteen companion plugins (Impeccable, Ponytail, the Taste family, Emil Kowalski's, the Superpowers set) are referenced from upstream, not vendored, and are documented as dependencies rather than as owned surface.

## Who it is for

Experienced web developers and design engineers already using Claude Code. Skeptical of AI tooling, allergic to marketing language, able to tell craft from template at a glance. Two distinct usage modes:

- **Discovery** — desktop, arriving from a link or a search result, deciding in under 30 seconds whether this is serious. Mobile is a minority here but not negligible.
- **Reference** — desktop, second monitor, mid-task, needs one specific fact from one skill page fast.

## Success

- Primary: the visitor runs `/plugin marketplace add kurodaSensei/sumitsubo`.
- Secondary: the site becomes the author's own daily reference for the 42 pages.
- Tertiary: the site stands as evidence of the author's design judgement — it is itself a work sample.

## Surfaces and modes

| Surface | Mode | Visitor's success |
|---|---|---|
| Landing (`/`) | **Persuade** | Understands the thesis and installs. |
| Reference index (`/reference`) | **Read** | Finds the right one of 42 pages in seconds. |
| Skill page (`/skills/:id`) | **Read** | Gets one specific fact and leaves. |
| Command page (`/commands/:id`) | **Read** | Learns what the command does and what it writes. |

## Content truth

Reference content is **generated at build time from the framework repo's `SKILL.md` and command files** — a single source of truth that never drifts. The design must survive copy it does not control: terse technical register, 3–6 column tables, long code fences, defined terms (T0/T1/T2, the ~400-line slice budget, review receipts, context-free lenses, `ponytail:` comments).

There is **no photography, no product shots, no logo and no illustration**, and there will be none. Visual content is made from type, rules and orthographic joint diagrams.

The site is **bilingual EN/ES**. Spanish runs ~20% longer and needs full diacritic coverage. The framework's own files stay in English on purpose — models follow instructions better that way — while Claude always answers the user in their language.

## Constraints

- Nuxt 4 (Vue 3, TypeScript), npm, prerendered static via `nuxt generate`.
- WCAG 2.2 AA, and not as a formality: the framework ships an `a11y` skill that sells AA as an acceptance criterion, so a failure here refutes the product.
- LCP ≤ 2.5 s · INP ≤ 200 ms · CLS ≤ 0.1 · initial JS ≤ 170 KB gzip — the exact numbers from the framework's own `performance` skill, for the same reason.
- No existing brand assets. No logo, no palette, no typeface inherited. Nothing is brand-locked.

## The defining risk

Sumitsubo's central claim is "design that doesn't look like every other AI-generated site." A centered hero with a pill badge and three icon cards would not merely be ugly here — it would be a factual contradiction of the offer. Every anti-slop tell is a product bug on this site.
