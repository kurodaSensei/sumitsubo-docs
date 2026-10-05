---
title: "shopify-liquid"
description: "Shopify Liquid authoring - syntax and evaluation pitfalls, render vs include, LiquidDoc {% doc %} for snippets and blocks, whitespace control, the liquid tag, loop performance and pagination, metafields and metaobjects, responsive images with image_url and image_tag, money and translation filters. Use when writing or reviewing any .liquid file (sections/**/*.liquid, blocks/**/*.liquid, snippets/**/*.liquid, layout/*.liquid, templates/**/*.liquid), when output is wrong or blank, when a filter or object might not exist, or when a page renders slowly on the server."
plugin: "sumi-shopify"
kind: "skill"
references: 1
source: "plugins/sumi-shopify/skills/shopify-liquid/SKILL.md"
---

# Shopify Liquid

Liquid is a small, safe template language with Shopify-specific objects, tags and filters. Most AI errors here are invented APIs and logic that assumes a general-purpose language. If unsure a filter, object or property exists, check `references/liquid-quick-reference.md`, then verify against shopify.dev. Never guess.

## Syntax rules that bite

- No parentheses in conditions. `and`/`or` evaluate right to left. Nest `if` blocks or precompute booleans with `assign`.
- No ternary, no `!`, no `&&`. Use `unless`, `!=`, `and`.
- `contains` works on strings and arrays of strings only, not on arrays of objects. Use `where` / `has` / `find` for objects.
- Truthiness: only `nil` and `false` are falsy. `''`, `0`, `[]` are truthy. Test content with `!= blank`; test arrays with `.size > 0`.
- `| default:` replaces `false` too. For checkboxes use `| default: true, allow_false: true` or test `== false` explicitly.
- Integer math truncates: `{{ 7 | divided_by: 2 }}` is `3`. Use `2.0` for a float.
- Prices are integers in cents (subunits). Format with `money` filters; never divide by 100 manually.
- Loop helpers are `forloop.index`, `forloop.index0`, `forloop.first`, `forloop.last`, `forloop.length`. There is no `loop.index`, no `@index`.
- `for` has `limit:`, `offset:`, `reversed` and an `{% else %}` branch for empty arrays.
- Assigned variables in a section are global to that file; inside a snippet they stay local.

## render, not include

```liquid
{%- # DO: explicit inputs, isolated scope -%}
{% render 'product-card', product: product, show_vendor: section.settings.show_vendor %}
{% render 'product-card' for section.settings.collection.products as product %}

{%- # DON'T: include is deprecated and leaks scope -%}
{% include 'product-card' %}
```

A rendered snippet cannot see the caller's variables (except globals like `settings`, `request`, `shop`). Pass everything it needs. `render` cannot take a variable as the snippet name.

## Document snippets and blocks with LiquidDoc

```liquid
{% doc %}
  Renders a product price with sale and unit price states.

  @param {product} product - Product to price
  @param {boolean} [show_compare] - Show compare-at price when on sale. Default: true
  @param {string} [class] - Extra classes on the wrapper

  @example
  {% render 'price', product: product, show_compare: false %}
{% enddoc %}
```

Bracketed names are optional. Theme check and editors use this for autocomplete and argument validation. Give every optional param a documented default and apply it with `default`.

## Whitespace and multi-line logic

Use `{%- -%}` / `{{- -}}` around logic to keep HTML clean. Use `{% liquid %}` for blocks of assignments; inside it, one tag per line, no delimiters, `echo` for output.

```liquid
{%- liquid
  assign product = section.settings.product | default: product
  assign on_sale = false
  if product.compare_at_price > product.price
    assign on_sale = true
  endif
-%}
```

Inline comments: `{% # note %}`. Block comments: `{% comment %}...{% endcomment %}`.

## Escaping

- Plain-text settings and customer input: `{{ block.settings.heading | escape }}`.
- `richtext` / `inline_richtext` settings: output raw (already sanitized HTML).
- Values into attributes: `escape`. Values into inline JSON: `| json` (never hand-build JSON strings).

## Performance on the server

Liquid renders on every uncached request; slow Liquid means slow TTFB and worse LCP.

- Never nest loops over large collections (`for product in collection.products` inside `for collection in collections`). Precompute with `where`, `map`, `uniq`, or move the data to a metafield/metaobject.
- Iterating `collection.products` without `paginate` yields at most 50 items. Use `{% paginate collection.products by section.settings.per_page %}`; respect the platform's page-size cap (verify current maximum on shopify.dev).
- Use `limit:` on every loop that feeds a fixed-size UI (carousel of 8 renders 8, not 50).
- `all_products['handle']` is rate-limited per page (verify current limit); prefer a `product` or `product_list` setting.
- Avoid re-rendering the same snippet with identical inputs; `capture` once and output twice.
- Profile with `shopify theme profile` or the Theme Inspector (verify current tooling) before micro-optimizing.

## Images

```liquid
{%- # DO: responsive, sized, explicit loading -%}
{{ section.settings.image
  | image_url: width: 2400
  | image_tag:
    widths: '480, 800, 1200, 1600, 2400',
    sizes: '(min-width: 990px) 50vw, 100vw',
    loading: 'lazy',
    class: 'media__img',
    alt: section.settings.image.alt
}}

{%- # DON'T: deprecated filter, no srcset, no dimensions, hardcoded alt -%}
<img src="{{ section.settings.image | img_url: 'master' }}" alt="image">
```

- `image_url` needs `width:` and/or `height:` (max 5760). `image_tag` emits `width`/`height` and a `srcset`, which prevents CLS.
- `sizes` must describe the real rendered width, or the browser downloads oversized files.
- Above-the-fold hero: `loading: 'eager', fetchpriority: 'high'` (optionally `preload: true` for one image). Everything else: lazy. See `shopify-performance-a11y`.
- Always guard: `{% if image != blank %}...{% else %}{{ 'image' | placeholder_svg_tag: 'placeholder' }}{% endif %}`.
- Alt text: `image.alt` from the media library; decorative images get `alt: ''`.

## Metafields and metaobjects

```liquid
{%- assign care = product.metafields.custom.care_instructions -%}
{% if care != blank %}
  <div class="rte">{{ care | metafield_tag }}</div>
{% endif %}

{%- # List and reference types: use .value -%}
{% for item in product.metafields.custom.features.value %}{{ item | escape }}{% endfor %}
{%- assign size_chart = product.metafields.custom.size_chart.value -%}
{{ size_chart.title.value }}

{%- # Metaobject entry by type and handle (global metaobjects object) -%}
{%- assign faq = metaobjects.faq_group['shipping'] -%}
```

Never invent a namespace/key. Ask for (or read from the store or existing code) the exact definition and type. Remember merchants can connect section settings to metafields as dynamic sources, so a setting value may be empty per resource: always guard.

## Translations

Every customer-facing string uses `| t`. Interpolate, do not concatenate. Use `count:` for plurals.

```liquid
{{ 'products.product.sold_out' | t }}
{{ 'cart.items_count' | t: count: cart.item_count }}
{%- # DON'T -%} <button>Add to cart</button>  {{ cart.item_count }} items
```

## AI slop tells

- Invented filters: `| format_money`, `| currency`, `| image_resize`, `| truncate_html`, `| json_parse`, `| to_string`, `| slugify` (Liquid has `handleize`).
- Invented objects or properties: `product.reviews`, `product.rating` without a metafield, `variant.stock`, `cart.subtotal` (it is `cart.total_price` / `cart.items_subtotal_price`), `forloop.count`.
- Deprecated APIs: `img_url`, `img_tag`, `product_img_url`, `include`. (`| within` for collection-aware product URLs: verify current guidance on shopify.dev before using it.)
- JavaScript-isms: `&&`, `||`, ternaries, `.length` (it is `.size`), `===`, `null` checks instead of `blank`.
- Hardcoded English strings, currency symbols, or `| divided_by: 100` on prices.
- `{% break %}` used outside a loop to "return" from a snippet.

## Done checklist

- [ ] Every filter, tag and object exists (quick reference or shopify.dev); no deprecated APIs.
- [ ] Snippets use `render` with explicit params and a `{% doc %}` header.
- [ ] Strings via `| t`; prices via `money*`; user text escaped.
- [ ] Loops bounded (`limit`, `paginate`); no nested loops over large arrays.
- [ ] Images via `image_url` + `image_tag` with `widths`, accurate `sizes`, loading strategy, alt.
- [ ] Metafield access guarded with `!= blank`; namespaces/keys confirmed, not guessed.
- [ ] `shopify theme check` clean for touched files.

Related: `shopify-theme-architecture`, `shopify-sections-blocks`, `sumi:performance`.

## Liquid Quick Reference (Shopify themes)

A curated list of what exists. Absence here does not prove absence on the platform, but anything not listed must be verified against shopify.dev before use. Items marked (newer) were added in recent years; confirm the store's theme context supports them.

### Tags

| Category | Tags |
|---|---|
| Output / vars | `{{ }}`, `assign`, `capture`, `echo` (inside `liquid`), `increment`, `decrement` |
| Control | `if` / `elsif` / `else`, `unless`, `case` / `when` (comma or `or` for multiple values) |
| Iteration | `for` (`limit`, `offset`, `reversed`, `range (1..n)`), `else` in `for`, `break`, `continue`, `cycle`, `tablerow`, `paginate` |
| Theme | `layout`, `section`, `sections` (groups), `content_for 'blocks'`, `content_for 'block'`, `render`, `schema`, `style`, `stylesheet`, `javascript`, `form`, `doc` |
| Other | `liquid`, `comment`, `# inline comment`, `raw` |
| Deprecated | `include` (use `render`) |

Notes:
- `{% stylesheet %}` / `{% javascript %}`: one per file, static content only (no Liquid inside), concatenated by Shopify into shared assets. Allowed in sections and blocks; snippet support exists in newer themes (verify). If the project bundles CSS/JS, follow the project instead.
- `{% style %}`: renders a `<style>` tag that can contain Liquid and live-updates in the editor. Use for per-instance custom properties.
- `{% form 'product', product %}`, `'cart'`, `'contact'`, `'customer_login'`, `'create_customer'`, `'customer'` (newsletter), `'localization'`, `'new_comment', article`, plus account forms. Use the tag; do not hand-roll form actions.
- `content_for 'blocks'` may appear once per file; `capture` it if it must be placed conditionally.

### Global objects

`settings`, `shop`, `request` (`design_mode`, `visual_preview_mode`, `page_type`, `locale`, `path`, `host`), `routes` (`root_url`, `cart_url`, `cart_add_url`, `cart_change_url`, `cart_update_url`, `search_url`, `predictive_search_url`, `account_url`, `collections_url`), `cart`, `customer` (nil when logged out), `localization` (`available_countries`, `available_languages`, `country`, `language`), `linklists`, `collections`, `pages`, `blogs`, `all_products` (rate-limited), `metaobjects`, `template` (`name`, `suffix`, `directory`), `theme`, `canonical_url`, `page_title`, `page_description`, `page_image`, `content_for_header`, `content_for_layout`, `section`, `block`, `predictive_search`, `recommendations`, `powered_by_link`, `additional_checkout_buttons`, `content_for_additional_checkout_buttons`.

### Page-scoped objects

| Template | Objects |
|---|---|
| product | `product` |
| collection | `collection`, `current_tags` |
| list-collections | `collections` |
| blog / article | `blog`, `article`, `current_tags` |
| page | `page` |
| search | `search` (`results`, `terms`, `results_count`, `filters`, `types`) |
| cart | `cart` |
| customers/* | `customer`, `order`, `form` objects as applicable |
| metaobject | `metaobject` |

### Commonly used properties

- product: `id`, `title`, `handle`, `url`, `vendor`, `type`, `tags`, `description`, `price`, `price_min`, `price_max`, `price_varies`, `compare_at_price`, `compare_at_price_min`, `available`, `featured_media`, `featured_image`, `media`, `images`, `options`, `options_with_values`, `options_by_name`, `variants`, `selected_variant`, `selected_or_first_available_variant`, `first_available_variant`, `has_only_default_variant`, `requires_selling_plan`, `selling_plan_groups`, `metafields`, `quantity_price_breaks_configured?`.
- variant: `id`, `title`, `price`, `compare_at_price`, `available`, `sku`, `barcode`, `option1..3`, `options`, `featured_media`, `inventory_quantity` (only when tracked and exposed; do not promise stock counts), `inventory_management`, `inventory_policy`, `url`, `unit_price`, `unit_price_measurement`, `quantity_rule`, `metafields`.
- product_option: `name`, `position`, `values`, `selected_value`. product_option_value (newer): `name`, `available`, `selected`, `swatch`, `variant`, `product_url`, `id`.
- collection: `id`, `title`, `handle`, `url`, `description`, `image`, `featured_image`, `products`, `products_count`, `all_products_count`, `filters`, `sort_by`, `sort_options`, `default_sort_by`, `metafields`.
- cart: `item_count`, `items`, `total_price`, `items_subtotal_price`, `original_total_price`, `total_discount`, `cart_level_discount_applications`, `note`, `attributes`, `requires_shipping`, `currency`, `empty?`, `checkout_charge_amount`.
- line_item: `key`, `id`, `variant_id`, `product`, `variant`, `title`, `quantity`, `final_price`, `final_line_price`, `original_line_price`, `line_level_discount_allocations`, `properties`, `selling_plan_allocation`, `url`, `image`, `unit_price`.
- image / media: `src`, `alt`, `width`, `height`, `aspect_ratio`, `id`, `media_type` (`image`, `video`, `external_video`, `model`), `preview_image`, `presentation` (focal point).
- section: `id`, `settings`, `blocks`, `index` (1-based position; may be nil, e.g. when rendered via Section Rendering API), `index0`, `location` (template or group name).
- block: `id`, `type`, `settings`, `shopify_attributes`.
- metafield: `value`, `type`, `list?`. Reference types expose the referenced object via `.value`.

### Filters

#### Media
- `image_url: width:, height:, crop:, format:` (format: `pjpg`, `jpg`, `webp`; Shopify negotiates modern formats automatically)
- `image_tag: widths:, sizes:, loading:, fetchpriority:, preload:, alt:, class:, width:, height:`
- `placeholder_svg_tag` (e.g. `'product-1'`, `'collection-1'`, `'image'`, `'lifestyle-1'`)
- `media_tag`, `video_tag: autoplay:, loop:, muted:, controls:, image_size:`, `external_video_tag`, `external_video_url: autoplay:, loop:`, `model_viewer_tag`
- Deprecated: `img_url`, `img_tag`, `product_img_url`, `collection_img_url`, `article_img_url`

#### Assets, URLs and HTML
- `asset_url`, `asset_img_url` (prefer `asset_url` + `image_tag` or inline SVG), `file_url`, `file_img_url`, `shopify_asset_url`, `global_asset_url`
- `inline_asset_content` (inline an SVG from assets/)
- `stylesheet_tag` (render-blocking by design), `script_tag` (no `defer`; write `<script src="{{ 'x.js' | asset_url }}" defer></script>` instead), `preload_tag: as:`
- `link_to`, `url_for_type`, `url_for_vendor`, `link_to_tag`, `link_to_add_tag`, `link_to_remove_tag`, `highlight_active_tag`, `sort_by`
- `time_tag: format:`, `highlight: search.terms`, `default_pagination`, `default_errors`
- `payment_type_svg_tag`, `payment_button`, `payment_terms`

#### Money
- `money`, `money_with_currency`, `money_without_currency`, `money_without_trailing_zeros`. Format comes from store settings; never hardcode symbols.

#### Localization and content
- `t` (alias `translate`) with named interpolation and `count:` plurals
- `format_address`, `metafield_tag`, `metafield_text`, `structured_data` (product/article JSON-LD), `weight_with_unit`, `unit_price_with_measurement`
- `customer_login_link`, `customer_logout_link`, `customer_register_link`, `login_button`, `avatar`

#### Fonts and color
- `font_face: font_display: 'swap'`, `font_url`, `font_modify: 'weight', 'bold'` (returns nil when the variant does not exist; guard it)
- `color_to_rgb`, `color_to_hsl`, `color_to_hex`, `color_to_oklch` (newer), `color_modify: 'alpha', 0.5`, `color_lighten`, `color_darken`, `color_saturate`, `color_desaturate`, `color_mix`, `color_brightness`, `color_contrast`, `color_difference`, `brightness_difference`, `color_extract`

#### Array
- `where: 'prop', value`, `map`, `first`, `last`, `size`, `join`, `sort`, `sort_natural`, `uniq`, `reverse`, `compact`, `concat`, `sum`
- (newer) `find: 'prop', value`, `find_index`, `has: 'prop', value`, `reject: 'prop', value`

#### String
- `append`, `prepend`, `replace`, `replace_first`, `replace_last`, `remove`, `remove_first`, `remove_last`, `split`, `strip`, `lstrip`, `rstrip`, `strip_html`, `strip_newlines`, `newline_to_br`, `truncate`, `truncatewords`, `upcase`, `downcase`, `capitalize`, `handleize` (alias `handle`), `camelize`, `pluralize`, `escape`, `escape_once`, `url_encode`, `url_decode`, `url_escape`, `url_param_escape`, `slice`, `base64_encode`/`decode`, `md5`, `sha1`, `sha256`, `hmac_sha1`, `hmac_sha256`, `json`

#### Math and other
- `plus`, `minus`, `times`, `divided_by`, `modulo`, `abs`, `ceil`, `floor`, `round`, `at_least`, `at_most`
- `date: format` (strftime, or `format: 'abbreviated_date'` locale formats), `default: value, allow_false: true`

### Does not exist (frequent hallucinations)

`format_money`, `currency`, `money_format`, `image_resize`, `resize`, `img_src`, `truncate_html`, `json_parse`, `parse_json`, `to_string`, `to_number`, `slugify`, `titleize`, `length` (use `size`), `filter`, `includes`, `contains` as a filter, `product.reviews`, `product.rating`, `product.stock`, `variant.stock`, `cart.subtotal`, `loop.index`, `forloop.count`.
