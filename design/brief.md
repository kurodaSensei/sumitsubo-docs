# Design brief — Sumitsubo docs

## Business
- Offer: Sumitsubo (墨壺) — an opinionated AI framework for web design and development with Claude Code. 6 plugins, 9 commands, 33 skills. MIT, free, installed via the Claude Code plugin marketplace.
- Primary conversion or task: a senior developer or design engineer lands here, understands the thesis in under 30 seconds, and runs `/plugin marketplace add kurodaSensei/sumitsubo`.
- Secondary goals: serve as the day-to-day reference for the 42 commands/skills; stand as evidence of the author's design judgement (the site is itself a work sample).

## Audience
- Who: experienced web developers and design engineers already using Claude Code. Skeptical of AI tooling, allergic to marketing language, able to tell craft from template at a glance.
- Context of use: two distinct modes. **Discovery** — desktop, browsing from a link or a search result, deciding in seconds whether this is serious. **Reference** — desktop, second monitor, mid-task, needs one specific fact from a skill page fast. Mobile is a minority but non-trivial for discovery.
- What they compare us against: Nextra / Mintlify / Fumadocs / Docusaurus default docs sites, shadcn/ui docs, Vercel and Geist-styled dev tools, other Claude Code plugin collections.

## Brand traits (3–5 tensions, no single adjectives)
- **Precise but hand-made** — the ink line is a measuring instrument, but it is snapped by hand and the mark it leaves is never machine-perfect.
- **Opinionated but not dogmatic** — it dictates a quality bar, yet scales its own process down to nothing for trivial work (T0).
- **Traditional craft but current engineering** — an Edo-period carpenter's tool naming a 2026 AI workflow, with neither half used as decoration.
- **Dense but calm** — 42 reference pages of tables and code that must never feel oppressive.
- **Confident but unmarketed** — it has to persuade while refusing every persuasion tactic it tells you not to use.

## Content reality
- Copy: real and already written, in the framework repo. Terse technical register, heavy on tables, code fences and defined terms (T0/T1/T2, ~400-line slice budget, review receipts, context-free lenses, `ponytail:` comments). Reference pages are generated from the plugins' `SKILL.md` and command files at build time — a single source of truth, so the design must survive copy it does not control.
- Imagery: **none exists.** No photography, no product shots, no logo, no illustration. Anything visual must be made from type, rules, diagrams or code.
- Data density: high. Many 3–6 column tables; long code blocks; a 6 plugins × 33 skills matrix that wants to be shown whole.
- Languages: **bilingual EN/ES.** Spanish runs ~20% longer than English and needs full diacritic coverage (á é í ó ú ñ ü ¡ ¿). No layout may depend on a specific line count or a tight tabular column.

## Constraints
- Platform: Nuxt 4 (Vue 3, TypeScript), npm. `nuxt generate` available → prerendered static output is the default.
- Accessibility: WCAG 2.2 AA. This is also a sales argument — the framework ships an `a11y` skill that treats AA as an acceptance criterion, so the site must be unimpeachable: visible focus everywhere, real landmarks, keyboard-complete, reduced-motion honoured.
- Performance budget: LCP ≤ 2.5 s, INP ≤ 200 ms, CLS ≤ 0.1, initial JS ≤ 170 KB gzip. Same reason — the framework ships a `performance` skill with these exact numbers.
- Non-negotiable brand assets (brand-locked): none. There is no existing visual identity, only a name and a metaphor. Complete freedom.
- **The defining constraint:** Sumitsubo's central claim is "design that doesn't look like every other AI-generated site." If this site shows a centered hero with a pill badge and three icon cards, the product is refuted by its own homepage. Every slop tell is not just ugly here — it is a factual contradiction of the offer.

## References
- Likes (and why): the name itself. `Sumitsubo (墨壺) is the Japanese carpenter's ink line: it marks the true line before any cut is made. This framework does the same — direction first, then the work.` The metaphor is load-bearing and already written; the design should execute it rather than invent a new one.
- Competitors: Nextra, Mintlify, Fumadocs, Docusaurus, shadcn/ui docs, Astro Starlight.

## Anti-references

### Category clichés (dev-tool docs)
1. Left sidebar tree + right-hand TOC + Inter + a violet accent — the Nextra/Mintlify default, indistinguishable across hundreds of sites.
2. Dark-first landing with a terminal/code-block hero behind a gradient glow, and a one-line `npm install` with a copy button as the focal point.
3. The Vercel/Geist look: pure neutral greys, hairline borders, Geist or Inter throughout. Once a signal of taste, now the single most copied dev-tool skin.
4. Three feature cards, line icon in a tinted rounded square, below the hero.
5. A bento grid used to lay out the plugin list because there happen to be six of them.
6. "Trusted by" logo cloud, then FAQ accordion, then a full-width CTA band, then a four-column footer.

### AI-default tells this project is most at risk of
- **Inter or Geist as the entire identity.** Highest risk by far: it is a developer tool, and that is the reflex.
- Violet/purple or blue-to-teal accent; gradient text on the headline.
- Dark mode with a neon accent sold as "premium".
- Uniform 8–12 px radius plus a soft shadow on every surface.
- Centered hero: pill badge → oversized headline → subtitle → two buttons → screenshot.
- Copy tells: "Supercharge", "Unlock", "Seamless", "All-in-one", and reflex triplets ("Fast. Simple. Powerful.").
- Everything fading up on scroll; bouncy hover scales on cards.
- Generic line icons (sparkles, rocket, lightning) standing in for the absent imagery.

### Ledger exclusions
`ledger.mjs recent` → **ledger is empty.** Nothing to avoid. Note the consequence: this project *sets* the baseline, and whatever display face, accent hue, layout and signature are chosen here are excluded from the next six projects. A generic, reusable choice would be a waste of the slot.
