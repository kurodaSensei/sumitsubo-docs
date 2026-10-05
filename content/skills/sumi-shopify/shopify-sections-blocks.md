---
title: "shopify-sections-blocks"
description: "Building merchant-friendly sections and blocks - {% schema %} conventions (setting order, short sentence-case labels, info text, defaults, presets, visible_if, enabled_on/disabled_on, limit, max_blocks), section-local vs theme blocks (@theme, @app, static blocks, nesting, content_for), block.shopify_attributes, settings exposed as CSS custom properties, color schemes, and merchant-proof empty states. Use when creating or editing sections/**/*.liquid, blocks/**/*.liquid, a {% schema %} block, presets, or when a section misbehaves in the theme editor (blocks not selectable, settings not live-updating, broken layout with empty fields)."
plugin: "sumi-shopify"
kind: "skill"
references: 1
source: "plugins/sumi-shopify/skills/shopify-sections-blocks/SKILL.md"
---

# Shopify Sections and Blocks

The merchant is the primary user of a section's schema. A section is done when a non-developer can add it, fill it, break it with odd content, and still get a page that looks intentional.

## Anatomy of a section

```liquid
{%- liquid
  assign heading = section.settings.heading
  assign columns = section.settings.columns
-%}
{% style %}
  #shopify-section-{{ section.id }} {
    --section-pt: {{ section.settings.padding_top }}px;
    --section-pb: {{ section.settings.padding_bottom }}px;
    --grid-columns: {{ columns }};
  }
{% endstyle %}

<div class="feature-grid color-{{ section.settings.color_scheme }}">
  {%- if heading != blank -%}
    <h2 class="feature-grid__heading">{{ heading }}</h2>
  {%- endif -%}
  <ul class="feature-grid__list" role="list">
    {%- for block in section.blocks -%}
      <li class="feature-grid__item" {{ block.shopify_attributes }}>
        {%- render 'feature-item', block: block -%}
      </li>
    {%- else -%}
      {%- if request.design_mode -%}<li>{{ 'sections.feature_grid.empty' | t }}</li>{%- endif -%}
    {%- endfor -%}
  </ul>
</div>

{% schema %}
{
  "name": "t:sections.feature_grid.name",
  "tag": "section",
  "class": "section section--feature-grid",
  "max_blocks": 8,
  "disabled_on": { "groups": ["header", "footer"] },
  "settings": [
    { "type": "inline_richtext", "id": "heading", "label": "t:settings.heading", "default": "Why customers choose us" },
    { "type": "range", "id": "columns", "label": "t:settings.columns", "min": 1, "max": 4, "step": 1, "default": 3 },
    { "type": "color_scheme", "id": "color_scheme", "label": "t:settings.color_scheme", "default": "scheme-1" },
    { "type": "header", "content": "t:settings.padding" },
    { "type": "range", "id": "padding_top", "label": "t:settings.top", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 },
    { "type": "range", "id": "padding_bottom", "label": "t:settings.bottom", "min": 0, "max": 120, "step": 4, "unit": "px", "default": 48 }
  ],
  "blocks": [ { "type": "feature" } ],
  "presets": [ { "name": "t:sections.feature_grid.name", "blocks": [ { "type": "feature" }, { "type": "feature" }, { "type": "feature" } ] } ]
}
{% endschema %}
```

`inline_richtext` / `richtext` values are sanitized HTML: output raw. `text` / `textarea` values: `| escape`. Pick the type deliberately.

## Schema conventions

Setting order (top to bottom in the editor):
1. Content source: resource pickers (`product`, `collection`, `blog`, `page`, `*_list`, `metaobject`).
2. Content: heading, text, image, buttons.
3. Layout: columns, alignment, width, aspect ratio, media position.
4. Style: color scheme, typography choices.
5. Spacing: padding / margin, always last, under a `header`.

Labels and help:
- Sentence case, short (aim under 30 characters), noun phrases: "Products per row", "Show rating", "Overlay opacity". Not "How many products should be displayed in each row", not "Show Rating".
- Let the setting type carry meaning: "Subheading" not "Subheading text field"; checkbox labels state the on-state: "Show rating", not "Enable/disable rating".
- Use `info` for consequences or constraints ("Recommended: 1600 x 900 px", "Applies on desktop only"). Use `header` to group 4+ related settings.
- `select` for 2 to 5 short options that read as a segmented control; `radio` when options need longer labels.
- Ranges: sensible `min`/`max`/`step`, a `unit`, and a `default` inside range and on a step.

Defaults and presets:
- Every setting that affects layout has a `default`. Text defaults should read as real placeholder copy, not "Lorem ipsum" or "Heading".
- Every addable section has at least one `preset` with enough blocks to look finished when dropped in.
- Use `visible_if` to hide settings that do not apply: `"visible_if": "{{ section.settings.layout == 'split' }}"`. Not supported on resource pickers (verify current list).
- Restrict placement with `enabled_on` / `disabled_on` (`templates`, `groups`); use `limit` for one-per-page sections. Do not set both enabled_on and disabled_on.
- Reference: `references/schema-reference.md` for keys, all setting types and validation limits.

## Blocks

Section-local blocks: defined in the section schema `blocks` array with `type`, `name`, `settings`. Rendered by iterating `section.blocks` and `case block.type`. Fine for themes without `blocks/`.

Theme blocks (files in `blocks/`):

```liquid
{% doc %}
  Group block: lays out child blocks in a row or column.
{% enddoc %}
<div class="group group--{{ block.settings.direction }}" style="--gap: {{ block.settings.gap }}px" {{ block.shopify_attributes }}>
  {% content_for 'blocks' %}
</div>
{% schema %}
{
  "name": "t:blocks.group.name",
  "blocks": [ { "type": "@theme" }, { "type": "@app" } ],
  "settings": [
    { "type": "select", "id": "direction", "label": "t:settings.direction", "options": [ { "value": "row", "label": "t:options.row" }, { "value": "column", "label": "t:options.column" } ], "default": "column" },
    { "type": "range", "id": "gap", "label": "t:settings.gap", "min": 0, "max": 64, "step": 4, "unit": "px", "default": 16 }
  ],
  "presets": [ { "name": "t:blocks.group.name" } ]
}
{% endschema %}
```

Rules:
- `{{ block.shopify_attributes }}` on the outermost element of every block, or the editor cannot select or highlight it. If the schema sets `"tag": null`, you own the wrapper and must output it yourself.
- `{% content_for 'blocks' %}` once per file. `capture` it if it must go in one of several branches.
- Static blocks: `{% content_for 'block', type: 'price', id: 'price' %}` for children the section always needs (merchant edits settings, cannot remove or reorder). IDs must be unique within the parent.
- Accept `@app` wherever an app might reasonably inject (product info, cart, footer). Merchants depend on app blocks.
- A block without a `presets` entry cannot be added by the merchant (it can still be static). Intentional internal blocks are often prefixed `_` by convention (verify the theme's convention).
- Limit nesting depth to what the design needs (group > item > leaf); deep trees confuse the editor.

## Settings to CSS

- Pass values as custom properties scoped to the instance (`{% style %}` with `#shopify-section-{{ section.id }}`, or an inline `style="--x: ..."` for one or two values). Static CSS consumes `var(--x, fallback)`.
- Discrete options become modifier classes (`media--left`), not inline property soup.
- Colors come from color schemes or global settings, never literals in markup. See `sumi:css-architecture`.
- `{% style %}` updates live in the editor; a static stylesheet with Liquid does not exist (`{% stylesheet %}` cannot contain Liquid).

## Merchant-proof rendering

- Guard every optional field: no empty `<h2>`, no button without label or link, no image wrapper without image.
- When a required resource is empty (no product chosen), render a tasteful placeholder in the editor only (`request.design_mode`) and nothing or a sensible fallback on the storefront.
- Handle long titles, 1 block vs max blocks, missing images, RTL, and translated strings that are 40% longer.
- Never let a setting break structure: heading level is a setting only if it is constrained (`select` of h2/h3), not free text.
- Editor events re-run your JS on section reload; see `shopify-storefront-js`.

## AI slop tells

- Monolith section with 40 settings covering five layouts; split into sections, blocks or presets.
- Hardcoded copy ("Shop now"), colors (`#ff0000`), or pixel values that should be settings or tokens.
- Labels in Title Case or full sentences; no defaults; ranges where `default` is outside `min`/`max`.
- `section.blocks` iterated without `block.shopify_attributes`; two `content_for 'blocks'` in one file.
- Mixing `@theme` with local block definitions; inventing setting types (`"type": "toggle"`, `"type": "slider"`, `"type": "image"`).
- No `presets`, so the section never shows in "Add section".
- Inline `<script>` per section instance or per block in a loop.

## Done checklist

- [ ] Schema validates (theme check), IDs are snake_case and stable, settings follow the order above.
- [ ] Labels short and sentence case; `info` where a constraint exists; translation keys if the theme uses them.
- [ ] Every layout-affecting setting has a valid default; presets render a finished-looking section.
- [ ] `visible_if`, `enabled_on`/`disabled_on`, `limit`, `max_blocks` set where they prevent misuse.
- [ ] `block.shopify_attributes` on every block root; blocks selectable and reorderable in the editor.
- [ ] Styling via custom properties and classes; no hardcoded colors or strings.
- [ ] Tested empty, minimal, maximal and long-content states in the editor.
- [ ] Semantics and a11y per `shopify-performance-a11y` and `sumi:a11y`.

Related: `shopify-liquid`, `shopify-theme-architecture`.

## Schema Reference

Condensed from the platform docs. Limits and newer keys change; verify against shopify.dev when a value matters.

### Section schema keys

| Key | Notes |
|---|---|
| `name` | Editor title. Required. Supports `t:` keys. |
| `tag` | Wrapper element (default `div`): `article`, `aside`, `div`, `footer`, `header`, `section`. |
| `class` | Extra classes on the `shopify-section` wrapper. |
| `limit` | Max instances per template / group (1 or 2). |
| `settings` | Array of settings (below). IDs unique within the section. |
| `blocks` | Local block definitions, or `@theme` / `@app` / specific theme block types. Not both local and `@theme`. |
| `max_blocks` | Cap on top-level blocks (platform max 50). |
| `presets` | Makes the section addable; each has `name`, optional `category`, `settings`, `blocks` (array or object + `block_order`). |
| `default` | Defaults for a section rendered statically with `{% section 'name' %}` (legacy pattern). |
| `enabled_on` / `disabled_on` | `{ "templates": [...], "groups": [...] }`. Use one, not both. Template values include `*`, `index`, `product`, `collection`, `list-collections`, `page`, `blog`, `article`, `search`, `cart`, `404`, `password`, `gift_card`, `metaobject`, `customers/*`. Groups: `header`, `footer`, `aside`, or custom group types (verify). |
| `locales` | Inline translations for portable sections; prefer theme locale files. |

### Theme block schema keys

| Key | Notes |
|---|---|
| `name` | Required. |
| `tag` | Any element name, or `null` for no wrapper (then output `block.shopify_attributes` yourself). |
| `class` | Added to the wrapper. |
| `settings` | Same setting types as sections. |
| `blocks` | Nested accepts: `@theme`, `@app`, or specific types. |
| `presets` | Required for the block to appear in the picker. Presets can include nested blocks and settings. |

Section-local block entries take `type`, `name`, `settings`, optional `limit` per type.

### Setting attributes (input settings)

`type`, `id`, `label` required. Optional: `default`, `info`, `placeholder` (text-like), `visible_if`.

`visible_if` syntax: `"{{ section.settings.layout == 'split' }}"` or `"{{ block.settings.show_button }}"`. It hides, it does not clear the value; your Liquid must still ignore irrelevant values. Not supported on resource pickers and `color_scheme_group` (verify).

### Setting types

Sidebar (no `id`): `header` (`content`, optional `info`), `paragraph` (`content`).

| Group | Types | Key extras / gotchas |
|---|---|---|
| Text | `text`, `textarea`, `inline_richtext`, `richtext`, `html`, `liquid` | `richtext` default must be wrapped in `<p>`; `inline_richtext` has no paragraphs; `html`/`liquid` are escape hatches, avoid for normal content. |
| Number | `number`, `range` | `range` needs `min`, `max`, `default`; `step` and `unit` optional; the platform caps the number of steps (verify, historically 101). |
| Choice | `checkbox`, `select`, `radio`, `text_alignment` | `select`/`radio` need `options: [{ value, label }]`; `select` options can have `group`. `checkbox` default must be boolean. |
| Media | `image_picker`, `video`, `video_url` | `video_url` needs `accept: ["youtube", "vimeo"]`. `image_picker` returns an image object; guard blank. |
| Color | `color`, `color_background`, `color_scheme`, `color_scheme_group` | `color` default must be a hex; `color_background` returns CSS gradient strings. Scheme groups live in settings_schema only. |
| Type | `font_picker` | `default` required, e.g. `assistant_n4`; load with `font_face`. |
| Navigation | `link_list`, `url` | `url` cannot have a non-empty default except `/collections` or `/collections/all` (verify). |
| Resources | `product`, `product_list`, `collection`, `collection_list`, `blog`, `page`, `article`, `article_list`, `metaobject`, `metaobject_list` | No `default`. Lists accept `limit` (max 50). Metaobject pickers need `metaobject_type`. |

There is no `toggle`, `slider`, `image`, `boolean`, `color_picker`, `dropdown`, `json` or `markdown` setting type.

### Presets with nested theme blocks

```json
"presets": [
  {
    "name": "t:blocks.card.presets.image_card",
    "category": "t:categories.layout",
    "settings": { "padding": 24 },
    "blocks": {
      "media": { "type": "image" },
      "body": {
        "type": "group",
        "blocks": {
          "title": { "type": "heading", "settings": { "text": "Card title" } },
          "cta":   { "type": "button" }
        },
        "block_order": ["title", "cta"]
      }
    },
    "block_order": ["media", "body"]
  }
]
```

Use the object form with `block_order` when you need stable IDs or must populate static blocks (add `"static": true` to entries that correspond to `content_for 'block'` calls; verify current syntax).

### Global settings file shape

```json
[
  { "name": "theme_info", "theme_name": "...", "theme_version": "1.0.0", "theme_author": "...", "theme_documentation_url": "...", "theme_support_url": "..." },
  { "name": "t:settings_schema.colors.name", "settings": [ { "type": "color_scheme_group", "id": "color_schemes", "definition": [ ... ], "role": { ... } } ] },
  { "name": "t:settings_schema.typography.name", "settings": [ { "type": "font_picker", "id": "type_body_font", "label": "t:settings.body_font", "default": "assistant_n4" } ] }
]
```

Access as `settings.<id>`; color schemes via `settings.color_schemes[scheme_id].settings.<role>`.

### Label style quick table

| Do | Don't |
|---|---|
| Products per row | How many products should be displayed in each row |
| Show rating | Show Rating / Enable or disable rating stars |
| Subheading | Subheading text field |
| Overlay opacity | Adjust the opacity of the dark overlay on the image |
| Desktop layout (with `info` for detail) | Layout (desktop only, mobile always stacks) |
