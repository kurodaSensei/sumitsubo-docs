---
title: "shopify-theme-architecture"
description: "Online Store 2.0 theme structure and workflow - directory roles, JSON templates and alternate templates, section groups, the section vs theme block vs snippet decision, settings_schema.json, locales and schema translation keys, Shopify CLI (theme dev, push to unpublished themes, pull, theme check), and git workflow that survives customizer edits to JSON. Use when creating or reorganizing theme files, deciding where a component belongs, editing templates/*.json, sections/*-group.json, config/settings_schema.json, config/settings_data.json, locales/*.json, layout/theme.liquid, .shopifyignore, or when running shopify theme commands, deploying, or resolving JSON merge conflicts."
plugin: "sumi-shopify"
kind: "skill"
references: 1
source: "plugins/sumi-shopify/skills/shopify-theme-architecture/SKILL.md"
---

# Shopify Theme Architecture (OS 2.0)

Applies to any Online Store 2.0 theme: Dawn-derived, Horizon-style theme-block themes, or fully custom, with or without a bundler that emits into `assets/`. Detect which before writing code: read `layout/theme.liquid`, list `blocks/`, check `package.json` for a build step.

## Directory roles

| Path | Holds | Rules |
|---|---|---|
| `layout/` | `theme.liquid` (+ `password.liquid`, optional alt layouts) | Must output `{{ content_for_header }}` in `<head>` and `{{ content_for_layout }}` in `<body>`. Keep thin. |
| `templates/*.json` | Section composition per page type | JSON over `.liquid`. `customers/*`, `gift_card.liquid` stay Liquid where required. |
| `sections/*.liquid` | Merchant-placeable modules with `{% schema %}` | One job per section. |
| `sections/*-group.json` | Section groups (header, footer, overlays) | Rendered by `{% sections 'header-group' %}` in the layout. |
| `blocks/*.liquid` | Theme blocks, reusable across sections, nestable | Only in themes that adopt theme blocks. |
| `snippets/*.liquid` | Code-only partials via `{% render %}` | No schema, no merchant settings of their own. |
| `config/settings_schema.json` | Global theme settings definition | Source-controlled, edited by devs. |
| `config/settings_data.json` | Saved values for global settings | Written by the customizer. Treat as merchant data. |
| `locales/` | `*.default.json` storefront strings, `*.schema.json` editor strings | Every visible string lives here. |
| `assets/` | Flat directory (no subfolders) of CSS, JS, SVG, fonts | If a bundler emits here, edit the source, never the output. |

## Where does it belong?

| Need | Use |
|---|---|
| Full-width page module the merchant adds, removes, reorders | Section |
| Repeatable or rearrangeable content inside one section only | Section-local block (defined in that section's schema) |
| Component reused across many sections, possibly nested (heading, button, image, group) | Theme block in `blocks/` |
| Fixed child a section always renders, still editable | Static block: `{% content_for 'block', type: 'x', id: 'y' %}` |
| Markup reused by code, no merchant settings (price, icon, product card internals) | Snippet |
| Site-wide token (colors, type scale, radius, spacing) | `settings_schema.json` |
| Header, announcement bar, footer | Section group |
| Per-product or per-page structured data | Metafield or metaobject, not a section setting |

Rules: a section either accepts theme blocks (`@theme`) or defines local blocks; do not mix both in one schema. If the theme has no `blocks/` folder, do not introduce theme blocks without asking: it changes the authoring model for every section.

## JSON templates

- `sections` map: arbitrary unique IDs to `{ "type", "settings", "blocks", "block_order" }`. `order` lists section IDs top to bottom.
- `block_order` must list every block ID present; omitted blocks are dropped or reordered unexpectedly.
- Alternate templates: `product.preorder.json`, `page.contact.json`. Merchant assigns them per resource in admin. Create one only when layout genuinely differs; prefer settings or metafield-driven conditionals for small variations.
- Templates hold defaults and saved merchant edits at once. After the theme is live, the customizer owns them (see git workflow).
- Section `"disabled": true` hides without deleting; keep it rather than removing merchant content.

## Global settings (`config/settings_schema.json`)

- First entry is `theme_info` (name, version, author, docs and support URLs). Use the owner's or client's details, never a placeholder company.
- Group into categories merchants recognize: Logo and favicon, Colors / color schemes, Typography, Layout, Buttons, Product cards, Cart, Social media.
- Prefer `color_scheme_group` + per-section `color_scheme` over a dozen loose color pickers when the theme supports schemes.
- Read in Liquid as `settings.<id>`. Expose them to CSS once (a `css-variables` snippet or `{% style %}` in the layout), then consume custom properties everywhere. See `sumi:css-architecture`.
- Never rename or remove an existing setting ID on a live theme without a migration: saved values in `settings_data.json` and templates silently orphan.

## Locales

- Storefront strings: `{{ 'products.product.add_to_cart' | t }}`, keys in `locales/en.default.json` (or the store's default language file).
- Editor strings: `"label": "t:settings.heading"` resolving in `locales/en.default.schema.json`. Use translation keys for schema text in themes meant for multiple languages or the Theme Store; plain sentence-case strings are acceptable in a single-language custom theme if the existing code does that. Match the codebase.
- Keys are snake_case, grouped by feature, shallow (2 to 3 levels). Interpolate, never concatenate: `'cart.items_count' | t: count: cart.item_count` with `one`/`other` plural keys.
- Add keys to the default locale; flag missing keys in other locales instead of machine-translating silently.

## Shopify CLI workflow (summary)

```bash
shopify theme dev --store my-store            # local preview with hot reload, uses a dev theme
shopify theme check                           # lint Liquid, JSON, schema, a11y and perf rules
shopify theme push --unpublished              # new unpublished theme for review
shopify theme push --theme <id>               # update a known unpublished/staging theme
shopify theme pull --theme <id> --only 'templates/*.json' --only 'sections/*-group.json' --only config/settings_data.json
shopify theme share                           # throwaway preview link
```

Non-negotiables:
- Never push to the live (published) theme. Never use `--allow-live` unless the owner explicitly asks for that exact command in this session.
- Before every push to a theme the merchant may have edited, pull its JSON first or push with `--nodelete` plus `--ignore` for JSON files, so customizer edits are not overwritten.
- Run `shopify theme check` before pushing; fix errors, justify any disabled check in `.theme-check.yml`.
- Full flags, `.shopifyignore`, GitHub integration and conflict resolution: `references/cli-git-workflow.md`.

## AI slop tells (reject in review)

- A `.liquid` template created where a JSON template works.
- A giant monolith section (hero + features + testimonials + newsletter) instead of composable sections or blocks.
- New global settings for one-off section concerns, or section settings duplicating global tokens.
- Snippet with its own `{% schema %}`; section with no `presets` that the merchant cannot add.
- Files placed in `assets/subfolder/` (not supported) or edits to bundler output.
- `theme_info` with an invented author, or setting IDs renamed for "consistency" on a live theme.
- Customizer JSON (`settings_data.json`, templates) overwritten from a stale local copy.

## Done checklist

- [ ] Component sits at the right level (section / block / static block / snippet) per the table above.
- [ ] Templates are JSON; `order` and `block_order` reference only existing IDs.
- [ ] New sections have `presets` (if addable) and `enabled_on`/`disabled_on` where placement matters.
- [ ] All visible and editor strings resolve through locales (or match the theme's existing single-language convention).
- [ ] No setting ID removed or renamed without migration notes.
- [ ] `shopify theme check` passes; preview via `theme dev` or an unpublished theme, never live.
- [ ] Remote JSON pulled before push; diff of `templates/` and `config/settings_data.json` reviewed.

Related: `shopify-liquid`, `shopify-sections-blocks`, `shopify-storefront-js`, `shopify-performance-a11y`.

## Shopify CLI and Git Workflow

Flags change between CLI releases. Confirm with `shopify theme <command> --help` and verify against shopify.dev when in doubt.

### Environments

| Theme | Purpose | Who writes |
|---|---|---|
| Development theme | Created by `shopify theme dev`, tied to your CLI session | You, automatically |
| Unpublished staging / QA theme | Client review, QA, a11y and perf audits | You via `push --theme <id>` |
| Live (published) theme | Customers | Merchant via customizer; code only through an agreed release step |

Optional `shopify.theme.toml` defines named environments (store, theme id, ignore lists) so commands become `shopify theme push -e staging`. Never commit tokens or passwords; use the CLI login or environment variables.

### Command reference

```bash
shopify theme list --store my-store                 # ids, roles (live, unpublished, development)
shopify theme dev --store my-store                  # hot reload preview on 127.0.0.1:9292
shopify theme dev --theme-editor-sync               # two-way sync of JSON edited in the editor during dev
shopify theme check                                 # lint; --auto-correct for safe fixes; -o json for CI
shopify theme push --unpublished --json             # create a new unpublished theme, print its id
shopify theme push --theme 123456789 --nodelete     # update without deleting remote-only files
shopify theme push --theme 123456789 --ignore 'templates/*.json' --ignore 'config/settings_data.json'
shopify theme pull --theme 123456789 --only 'templates/*.json' --only 'sections/*.json' --only 'config/settings_data.json'
shopify theme package                               # zip for upload or handoff
shopify theme profile --url /products/handle        # Liquid render profiling (newer CLI; verify availability)
shopify theme console                               # Liquid REPL against store data (verify availability)
```

Hard rules:
- No `--allow-live`, no `shopify theme publish` unless the owner explicitly requests it in the current session.
- `--nodelete` on any push to a shared theme.
- Never `push` a JSON template or `settings_data.json` from a stale local copy to a theme the merchant edits.

### `.shopifyignore`

Same glob syntax as `.gitignore`, applied to push, pull and dev. Typical entries:

```
node_modules/
src/
*.md
package*.json
.github/
## Optional, when merchants own content on the target theme:
## config/settings_data.json
## templates/*.json
```

### Git workflow

1. `main` mirrors what is (or will be) live. Feature branches per change.
2. Customizer edits happen on the store, not in git. Before branching or pushing, pull JSON from the theme being edited and commit it as its own commit (`chore: sync customizer JSON`) so code diffs stay readable.
3. Shopify's GitHub integration (Online Store > Themes > Add theme > Connect from GitHub) binds a branch to a theme and commits customizer changes back to that branch. If used, never force-push that branch, and expect bot commits; rebase feature branches on it often.
4. Release: merge to the connected branch or push to a fresh unpublished theme, QA, then the merchant (or owner) publishes. Keep the previous live theme as rollback; do not delete it.

### Resolving JSON conflicts

- Templates and `settings_data.json` are data. On conflict, take the remote (merchant) side, then reapply only your structural change (new section entry, new key in `order`).
- Shopify may rewrite JSON on save (key order, a generated header comment). Do not fight formatting; diff semantically.
- When you add a new section to a template that merchants edit, add it to both the section map and `order`, with defaults that render cleanly.
- Removing a section type or block type that templates reference breaks those templates in the editor. Search `templates/` and `sections/*.json` for the type before deleting a file.

### Theme check

- Run locally and in CI (`shopify theme check -o json` or the Theme Check GitHub Action; verify current action name).
- Treat errors as blockers: missing templates, unknown filters/objects, invalid schema JSON, missing translation keys, `img_url` and other deprecated filters, parser-blocking scripts, images without width/height.
- Disabling a check requires a comment with the reason, scoped to a file or line (`{% # theme-check-disable CheckName %}` ... `{% # theme-check-enable CheckName %}`), not global.

### Before handing a preview to a client

- Unpublished theme pushed with current JSON from live (or explicit agreement that preview content differs).
- Theme check clean, Lighthouse/a11y spot check on home, collection, product, cart.
- Preview link via `theme share` or the admin preview URL; note it expires with the dev theme.
