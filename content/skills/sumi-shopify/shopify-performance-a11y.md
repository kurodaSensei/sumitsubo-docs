---
title: "shopify-performance-a11y"
description: "Core Web Vitals and WCAG 2.2 AA for Shopify themes - LCP image priority and preload, lazy loading by section position, responsive sizes, font loading with font_face, CSS/JS loading, app script and app block bloat, CLS from images, app blocks and banners, INP on variant and cart interactions; e-commerce accessibility patterns for product cards, sale prices, variant pickers, galleries, filters, cart drawer dialogs, quantity steppers, and announcements. Use when building or auditing layout/theme.liquid, header, hero, product, collection, cart or search sections, snippets/*card*.liquid, snippets/*price*.liquid, facets, or when Lighthouse, CrUX, the Shopify web performance report, axe or a manual a11y review flags issues."
plugin: "sumi-shopify"
kind: "skill"
references: 1
source: "plugins/sumi-shopify/skills/shopify-performance-a11y/SKILL.md"
---

# Shopify Performance and Accessibility

Targets: LCP under 2.5 s, CLS under 0.1, INP under 200 ms at p75 on mobile; WCAG 2.2 AA. Generic methodology lives in `sumi:performance` and `sumi:a11y`; this skill covers what is specific to Shopify themes.

## LCP

The LCP element on most storefronts is the hero image or the first product image.

```liquid
{%- liquid
  assign is_above_fold = false
  if section.index != nil and section.index <= 2
    assign is_above_fold = true
  endif
-%}
{%- if is_above_fold -%}
  {{ image | image_url: width: 2400 | image_tag: widths: '750, 1100, 1500, 2000, 2400', sizes: '100vw', loading: 'eager', fetchpriority: 'high', preload: true, alt: image.alt }}
{%- else -%}
  {{ image | image_url: width: 2400 | image_tag: widths: '750, 1100, 1500, 2000, 2400', sizes: '100vw', loading: 'lazy', alt: image.alt }}
{%- endif -%}
```

- Exactly one or two high-priority images per page; `preload: true` on at most one (it adds a preload hint; overusing it competes with CSS).
- Never lazy-load the LCP image; never fade it in with JS or hide it behind a slider init.
- Hero sliders: render slide 1 as a normal eager image; later slides lazy. Prefer no autoplay.
- `sizes` must match CSS width; oversized `sizes` wastes bandwidth on mobile.
- Server time matters: heavy Liquid (nested loops, many `all_products` lookups) delays first byte. See `shopify-liquid`.
- Image `section.index` logic must fall back when nil (Section Rendering API, static sections). Check whether the platform now applies default lazy loading to `image_tag` and keep explicit values regardless (verify against shopify.dev).

## CLS

- `image_tag` outputs width/height; keep them, and set `aspect-ratio` on media wrappers for ratio settings (`adapt`, square, portrait).
- Reserve space for anything injected later: app blocks (reviews stars, installments), announcement bars, cookie banners (overlay, do not push), recommendations, predictive search panel.
- Fonts: `font_display: 'swap'` plus metric-compatible fallbacks; avoid late-loading icon fonts.
- No content inserted above existing content after load (geo banners, "free shipping" bars) without reserved height.

## Fonts and CSS

```liquid
{%- # In <head>, from settings -%}
<link rel="preconnect" href="https://fonts.shopifycdn.com" crossorigin>
{{ settings.type_body_font | font_url | preload_tag: as: 'font', type: 'font/woff2', crossorigin: true }}
{% style %}
  {{ settings.type_body_font | font_face: font_display: 'swap' }}
  {{ settings.type_body_font | font_modify: 'weight', 'bold' | font_face: font_display: 'swap' }}
{% endstyle %}
```

- Preload only the one or two font files used above the fold; guard `font_modify` results (nil when the weight does not exist).
- Critical CSS small and in `<head>`; section-specific CSS loaded with its section (`{% stylesheet %}`, a per-section asset, or the bundler's split) rather than one giant file.
- Prefer system fonts when the brand allows.

## JavaScript and apps

- All theme scripts `defer` or `type="module"`. No render-blocking third-party scripts in `<head>` besides what `content_for_header` injects (which you cannot edit).
- Audit apps: uninstalled apps often leave snippets, `{% render 'app-x' %}` calls, and script tags in `theme.liquid`. Remove leftovers with the merchant's agreement.
- Prefer app embeds and app blocks (removable from the editor) over pasted script tags. Load chat widgets, reviews and UGC on interaction or idle.
- Do not ship a slider library for one carousel; CSS scroll-snap plus a small component is enough.
- INP: variant change and add-to-cart handlers must be short; yield (`await` a microtask/`scheduler.yield` where available) before heavy DOM work, avoid layout thrash, debounce input.
- Measure with field data (CrUX, Shopify's web performance report in admin) plus Lighthouse on mobile for home, collection, product, cart. Compare against the theme baseline before blaming code.

## Accessibility patterns (summary)

Full markup in `references/ecommerce-a11y-patterns.md`.

- Product card: one link (product title) is the tab stop; a pseudo-element stretches its hit area over the card. Secondary actions (quick add) are real buttons with names including the product title; never `tabindex="-1"` on something sighted keyboard users can see.
- Price: sale and regular prices labelled in text for screen readers ("Regular price", "Sale price") via translations; "Sold out" and "Sale" badges are text, not color alone.
- Variant picker: each option is a `<fieldset>` + `<legend>`, values are native radio inputs (visually styled as buttons or swatches); unavailable values stay focusable and are announced ("Sold out" / "Unavailable"), swatches have text names.
- Gallery: thumbnails are buttons with `aria-current` / pressed state; main media change announced politely; zoom/lightbox is a modal dialog; video has controls and no autoplay with sound; 3D/AR via Shopify's model viewer buttons.
- Filters: disclosure buttons (`aria-expanded`) wrapping `<fieldset>` groups; price range has labelled inputs; result count in a polite live region; applied filters removable via buttons with names ("Remove filter: Red").
- Cart drawer: native `<dialog>` opened with `showModal()`, labelled heading, close button first, focus returns to trigger, `Escape` closes. Line item quantity steppers have labelled buttons ("Increase quantity for X") and a labelled input; remove buttons include the product name.
- Announcements: one polite live region for cart and filter updates, created at page load (not injected with content).
- WCAG 2.2 specifics: focus not obscured by sticky headers or drawers (2.4.11, use `scroll-padding-top`), target size at least 24 x 24 CSS px for swatches, steppers and close buttons (2.5.8), slider/carousel and range filters operable without dragging (2.5.7), consistent help placement (3.2.6).
- Motion: honor `prefers-reduced-motion` for marquees, parallax, autoplay; any autoplay has a visible pause control.
- Language: `<html lang="{{ request.locale.iso_code }}">`; skip link to `#MainContent`; one `h1` per page (product title on PDP, collection title on PLP).

## AI slop tells

- `loading="lazy"` on the hero, or `fetchpriority="high"` on every image.
- `| img_url` or raw `<img src>` without width/height/srcset; `sizes="100vw"` on a 4-column grid card.
- Google Fonts `<link>` added beside the theme's `font_picker` settings; render-blocking `script_tag` in `<head>`.
- Variant buttons as `<div onclick>` or `<button>` lists with no group semantics; swatches with only a background color.
- Product cards where image, title, price and button are four separate links to the same URL.
- Cart drawer built from a `<div>` with no focus management; `aria-live` regions injected together with their content.
- `aria-label` on everything, or ARIA roles overriding native semantics (`role="button"` on `<a href>`).

## Done checklist

- [ ] LCP image eager + `fetchpriority="high"`, not lazy; all other images lazy with accurate `sizes`.
- [ ] No layout shift from images, app blocks, banners or fonts (CLS under 0.1 on key templates).
- [ ] Scripts deferred; leftover app code removed; no duplicate libraries; INP verified on variant change and add to cart.
- [ ] Fonts from theme settings with `swap`; at most two font preloads.
- [ ] Product card, price, variant picker, gallery, filters and cart drawer match the patterns reference.
- [ ] Keyboard-only pass: visible focus, logical order, no traps, focus not obscured, Escape closes overlays.
- [ ] Screen reader spot check (VoiceOver or NVDA) of add to cart and filtering announcements.
- [ ] axe/Lighthouse a11y clean on home, collection, product, cart, search; contrast checked for every color scheme.

Related: `shopify-liquid`, `shopify-storefront-js`, `sumi:performance`, `sumi:a11y`, `sumi:css-architecture`.

## E-commerce Accessibility Patterns (WCAG 2.2 AA)

Markup sketches in Liquid. All visible strings come from locales; translation keys here are illustrative, reuse the theme's existing keys when present. `visually-hidden` is the theme's screen-reader-only utility class.

### Product card

One tab stop for navigation; the whole card is clickable via a stretched link.

```liquid
<article class="card" aria-labelledby="CardTitle-{{ section.id }}-{{ product.id }}">
  <div class="card__media">
    {%- if product.featured_media -%}
      {{ product.featured_media | image_url: width: 900 | image_tag: widths: '300, 450, 600, 900', sizes: '(min-width: 990px) 25vw, 50vw', loading: 'lazy', alt: '' }}
    {%- endif -%}
  </div>
  <h3 class="card__title">
    <a href="{{ product.url }}" id="CardTitle-{{ section.id }}-{{ product.id }}" class="card__link">{{ product.title | escape }}</a>
  </h3>
  {% render 'price', product: product %}
  {%- unless product.available -%}<span class="badge">{{ 'products.product.sold_out' | t }}</span>{%- endunless -%}
  {%- if show_quick_add and product.available -%}
    <button type="button" class="card__quick-add" aria-describedby="CardTitle-{{ section.id }}-{{ product.id }}">
      {{ 'products.product.quick_add' | t }}
    </button>
  {%- endif -%}
</article>
```

```css
.card { position: relative; }
.card__link::after { content: ""; position: absolute; inset: 0; }
.card__quick-add { position: relative; z-index: 1; } /* sits above the stretched link */
```

- Image `alt=""` because the title link names the card; avoid announcing the title twice.
- Card heading level fits the page outline (usually `h3` under a section `h2`). Make it a snippet param if reused in different contexts.
- Quick add visible on focus as well as hover (`:focus-within`), never hover-only.
- Badges and "Sold out" are text; color is decoration.

### Price

```liquid
{%- liquid
  assign on_sale = false
  if product.compare_at_price > product.price
    assign on_sale = true
  endif
-%}
<div class="price{% if on_sale %} price--on-sale{% endif %}">
  {%- if on_sale -%}
    <span class="visually-hidden">{{ 'products.product.price.sale_price' | t }}</span>
    <span class="price__sale">{{ product.price | money }}</span>
    <span class="visually-hidden">{{ 'products.product.price.regular_price' | t }}</span>
    <s class="price__compare">{{ product.compare_at_price | money }}</s>
  {%- else -%}
    <span class="visually-hidden">{{ 'products.product.price.regular_price' | t }}</span>
    <span>{{ product.price | money }}</span>
  {%- endif -%}
</div>
```

- Price ranges: a "From {{ price }}" translation key with interpolation (`'products.product.price.from_price_html' | t: price: ...`), never string concatenation.
- `<s>` is not announced as strikethrough by most screen readers; the hidden labels carry the meaning.
- Unit prices: label with the translated "Unit price" and use `unit_price_with_measurement`.
- When price updates on variant change, the region is not itself live; announce through the shared live region only if the change is not obvious from the control the user just operated.

### Variant picker

```liquid
{%- for option in product.options_with_values -%}
  <fieldset class="variant-picker__option">
    <legend>{{ option.name | escape }}{% if option.values.size > 1 %}: <span data-selected-value>{{ option.selected_value | escape }}</span>{% endif %}</legend>
    {%- for value in option.values -%}
      <input type="radio" class="visually-hidden" id="{{ section.id }}-{{ option.position }}-{{ forloop.index0 }}"
        name="{{ option.name | escape }}-{{ section.id }}" value="{{ value | escape }}"
        {% if option.selected_value == value %}checked{% endif %}>
      <label for="{{ section.id }}-{{ option.position }}-{{ forloop.index0 }}">
        {{ value | escape }}
        {%- comment -%} if this value has no available variant in the current combination, append a visually-hidden translated "Sold out" / "Unavailable" {%- endcomment -%}
      </label>
    {%- endfor -%}
  </fieldset>
{%- endfor -%}
```

- Native radios give arrow-key navigation and a single tab stop per group for free. Do not reimplement with `role="radiogroup"` on divs.
- Visually hidden inputs must still show focus: style `input:focus-visible + label`.
- Swatches: label contains the value name as text (visually hidden is fine), swatch color/image is decoration. Target size 24 x 24 CSS px minimum, 44 recommended.
- Unavailable combinations: keep focusable and selectable (so users can learn it is sold out), mark with text, disable the add-to-cart button with a visible reason.
- Dropdown alternative: `<select>` with `<label>` is fully acceptable and often better for long option lists.
- Newer themes can read availability from `product_option_value` objects (`value.available`, `value.swatch`); verify on shopify.dev before relying on them.

### Product gallery

- Wrap in a labelled region (`<section aria-label="{{ 'products.product.media.gallery_label' | t }}">` or a heading).
- Thumbnails: `<button aria-label="{{ 'products.product.media.load_image' | t: index: forloop.index }}" aria-current="true|false">` with `alt=""` on the thumbnail image. Prefer `aria-current` or `aria-pressed`, not both.
- Main images keep meaningful `alt` (media alt from admin; fall back to product title only if the image is the primary product shot).
- Carousel on mobile: scroll-snap list with previous/next buttons and a position indicator ("2 of 6" as text). Swipe is never the only way (2.5.7).
- Zoom/lightbox: modal `<dialog>`, focus to the close button, Escape closes, return focus to the opening image button.
- Video: `controls`, captions where provided, no autoplay with sound; autoplaying muted loops get a pause button.

### Collection filters (facets)

```liquid
<form id="FacetFiltersForm" action="{{ collection.url }}" method="get">
  {%- for filter in collection.filters -%}
    <details class="facet" {% if filter.active_values.size > 0 %}open{% endif %}>
      <summary>{{ filter.label | escape }}{% if filter.active_values.size > 0 %} ({{ filter.active_values.size }}){% endif %}</summary>
      {%- case filter.type -%}
        {%- when 'list', 'boolean' -%}
          <fieldset>
            <legend class="visually-hidden">{{ filter.label | escape }}</legend>
            {%- for value in filter.values -%}
              <label>
                <input type="checkbox" name="{{ value.param_name }}" value="{{ value.value }}" {% if value.active %}checked{% endif %} {% if value.count == 0 and value.active == false %}disabled{% endif %}>
                {{ value.label | escape }} <span class="facet__count">({{ value.count }})</span>
              </label>
            {%- endfor -%}
          </fieldset>
        {%- when 'price_range' -%}
          <fieldset>
            <legend class="visually-hidden">{{ filter.label | escape }}</legend>
            <label for="Price-GTE">{{ 'collections.filters.from' | t }}</label>
            <input id="Price-GTE" type="text" inputmode="decimal" name="{{ filter.min_value.param_name }}" value="{{ filter.min_value.value | money_without_currency | remove: ',' }}">
            <label for="Price-LTE">{{ 'collections.filters.to' | t }}</label>
            <input id="Price-LTE" type="text" inputmode="decimal" name="{{ filter.max_value.param_name }}" value="{{ filter.max_value.value | money_without_currency | remove: ',' }}">
          </fieldset>
          {%- comment -%} money_without_currency formats per locale ("1,234.56" / "12,50"): normalize separators for your store's format before submitting. {%- endcomment -%}
      {%- endcase -%}
    </details>
  {%- endfor -%}
  <noscript><button type="submit">{{ 'collections.filters.apply' | t }}</button></noscript>
</form>
<p class="visually-hidden" role="status" aria-live="polite" id="ProductCount">{{ 'collections.products_count' | t: count: collection.products_count }}</p>
```

- `<details>/<summary>` is a native disclosure; a custom `button[aria-expanded][aria-controls]` is the alternative when animation or layout requires it.
- Mobile filter drawer is a modal dialog with an apply/close button and a visible result count.
- Active filters list: buttons or links named "Remove filter: {{ label }}", plus "Clear all".
- After async update: keep focus on the control the user changed; update the count region text (do not recreate the region).
- Sort `<select>` has a visible label. Swatch filter values (when available) still have text labels. Verify `filter.type` values and swatch support on shopify.dev.

### Cart drawer

```html
<dialog id="CartDrawer" class="cart-drawer" aria-labelledby="CartDrawerTitle">
  <div class="cart-drawer__header">
    <h2 id="CartDrawerTitle">{{ 'cart.title' | t }}</h2>
    <button type="button" class="cart-drawer__close" aria-label="{{ 'general.close' | t }}" data-close>...</button>
  </div>
  <!-- line items, subtotal, checkout button -->
</dialog>
```

- `dialog.showModal()` provides focus containment, inert background and Escape handling; still restore focus to the trigger on `close`.
- Trigger (cart icon) is a link to `/cart` that JS upgrades to open the drawer; it has an accessible name including the count ("Cart, 3 items") via translations.
- Line item: product link, variant details as text, quantity stepper (labelled input plus "Decrease/Increase quantity for {{ title }}" buttons), remove button "Remove {{ title }}", line price. Errors per line in text, linked via `aria-describedby`.
- Empty state: heading plus a link to continue shopping; focus lands on the heading.
- Checkout button is a real `<button name="checkout">` in the cart form or a link to `/checkout`; do not hijack it.

### Live region

```html
<div id="A11yAnnouncer" class="visually-hidden" aria-live="polite" aria-atomic="true"></div>
```

```js
export function announce(message) {
  const region = document.getElementById('A11yAnnouncer');
  region.textContent = '';
  requestAnimationFrame(() => { region.textContent = message; });
}
```

Render once in `theme.liquid`. Use for: item added, quantity updated, filter result count, search result count, form errors not adjacent to focus. Use `role="alert"` only for blocking errors.

### Header and navigation

- Skip link first in `<body>`, targets `<main id="MainContent" tabindex="-1">`.
- Mega menu: disclosure buttons (`aria-expanded`) for top-level items with submenus, not `role="menu"`; Escape closes and returns focus; hover-intent delay and no hover-only opening.
- Sticky header: set `scroll-padding-top` equal to header height so focused elements are not hidden (2.4.11).
- Localization selectors (country, language) use `{% form 'localization' %}` with labelled controls.

### Forms (newsletter, contact, account)

- Visible `<label>` for every field; placeholder is not a label. `autocomplete` tokens (`email`, `given-name`, `tel`).
- Errors from `form.errors` rendered next to fields, linked with `aria-describedby`, summary with links on submit; focus moves to the summary.
- Success messages (`form.posted_successfully?`) in a status region and focused or announced.
- Do not require re-entering information already provided in the same flow (3.3.7).
