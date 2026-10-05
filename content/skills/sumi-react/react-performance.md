---
title: "react-performance"
description: "Performance for React/Next.js apps against Core Web Vitals (LCP, INP, CLS) - client bundle discipline, small client boundaries, dynamic import, next/image, next/font, next/script and third-party cost, hydration cost, list virtualization, INP-friendly event handling (useTransition, yielding), measuring with React Profiler, Performance panel and web-vitals. Use when a page feels slow, Lighthouse/CrUX flags LCP/INP/CLS, bundles grow, adding images/fonts/analytics/embeds, rendering long lists, or reviewing *.tsx, next.config.*, app/**/layout.tsx and package.json dependency additions."
plugin: "sumi-react"
kind: "skill"
references: 1
source: "plugins/sumi-react/skills/react-performance/SKILL.md"
---

# React / Next.js performance

Targets (p75, mobile, field data): **LCP <= 2.5s, INP <= 200ms, CLS <= 0.1**. Framework-agnostic budgets and methodology live in `sumi:performance`; this skill covers the React/Next.js levers. Measurement recipes: `references/measuring.md`.

## Principles

1. **Measure first, in the field.** CrUX/RUM beats Lighthouse; Lighthouse beats intuition. Profile a production build (`next build && next start`), never `next dev`.
2. **The cheapest JS is the JS you never ship.** Server Components and HTML/CSS solutions first.
3. **Hydration is a cost per interactive island.** Fewer, smaller islands.
4. **Main thread is shared with the user.** Long tasks (> 50ms) kill INP.
5. **Reserve space for everything that loads late.** CLS is a layout contract.

## Bundle discipline

- Keep `'use client'` at leaves (`next-app-router`). A client boundary includes every module it imports.
- Before adding a dependency, check its cost (bundlephobia/pkg-size) and whether a platform API or 20 lines replace it. No moment.js, no full lodash, no icon packs imported as a whole.
- Import icons per-file (`lucide-react` named imports are fine with `optimizePackageImports`; verify defaults for your Next version).
- Heavy, below-the-fold or interaction-only widgets: `next/dynamic` (or `lazy`) with a sized fallback.

```tsx
const Chart = dynamic(() => import('./revenue-chart'), {
  loading: () => <div className="h-72" aria-hidden />,  // reserve height
});
```

- `ssr: false` only inside client components and only for browser-only libs (maps, editors). It removes content from the HTML - never use it for content that matters to LCP or SEO.
- Analyze with the bundle analyzer (Next 16 ships one for Turbopack - verify command; else `@next/bundle-analyzer`). Track First Load JS per route in CI.
- Do not serialize large props into client components: every prop is embedded in the RSC payload. Send DTOs, paginate.

## Images (next/image)

- Always `next/image` for content images. Provide `width`/`height` or `fill` + sized parent; this is what prevents CLS.
- LCP image: set `priority` (or `preload` / `fetchPriority="high"` depending on version - verify against current docs). Exactly one or two per page, never on everything.
- `sizes` is mandatory with `fill` or responsive layouts; wrong `sizes` ships desktop images to phones.
- Remote images: `images.remotePatterns` (not `domains`). Next 16 changed some defaults (`qualities`, cache TTL); configure explicitly if you rely on them.
- Decorative images: `alt=""`. Meaningful: descriptive alt (`sumi:a11y`).
- SVG icons inline or as components; do not route them through the image optimizer.

## Fonts (next/font)

- Self-host via `next/font/google` or `next/font/local` in the root layout; expose as CSS variables consumed by tokens in `DESIGN.md`.
- Variable fonts, subset to used scripts, at most 2 families. `display: 'swap'` (default) and rely on size-adjusted fallbacks to limit CLS.
- Never `<link>` Google Fonts manually or `@import` them in CSS.

## Third-party scripts

- Every third party justifies its cost. Audit tag managers quarterly.
- `next/script` strategies: `afterInteractive` (default, analytics), `lazyOnload` (chat widgets, low priority), `beforeInteractive` (only truly blocking consent/polyfill, root layout only). `worker` (Partytown) is experimental - verify.
- Prefer `@next/third-parties` for GTM/GA/YouTube/Maps embeds; use facades (click-to-load) for video and chat.
- Consent banners must not cause CLS (overlay, not push-down) and must not be the LCP element.

## Hydration cost

- Server-render static parts; interactive parts are small leaves. A static marketing section should hydrate nothing.
- Avoid hydration mismatches (Date/locale/random in render, `typeof window` branches). Fix the cause; `suppressHydrationWarning` only for known cases like theme class on `<html>`.
- Use `<Activity>` (React 19.2) to keep hidden tabs/panels' state without rendering them at high priority - verify stability for your version.
- Theming: set the theme class with a tiny inline script before paint to avoid flash, not a client effect.

## INP: responsive interactions

- Handlers do the minimum synchronously: update the visible state, defer the rest.
- `useTransition` / `startTransition` for expensive state updates (filtering large lists, tab switches) so input stays responsive.
- `useDeferredValue` for a derived expensive view of a fast-changing input.
- Break long work: yield with `await scheduler.yield()` (feature-detect, fall back to `setTimeout(0)`), or move to a Web Worker.
- Debounce network-bound inputs (search) ~200-300ms; do not debounce visual feedback.
- Avoid layout thrashing in handlers (reading layout after writing styles in loops).

```tsx
const [isPending, startTransition] = useTransition();
function onFilterChange(value: string) {
  setQuery(value);                              // urgent: input reflects keystroke
  startTransition(() => setFilter(value));      // non-urgent: heavy list re-render
}
```

## Long lists

- Paginate or "load more" server-side first. Virtualize client lists > ~200 rows with complex items (`@tanstack/react-virtual`).
- Virtualized lists must keep accessibility: real list semantics, keyboard reachability, `aria-rowcount`/`aria-rowindex` for grids. If that is not achievable, paginate instead.
- `content-visibility: auto` with `contain-intrinsic-size` is a cheap CSS alternative for long static sections.

## Rendering cost

- With React Compiler, unnecessary re-renders are mostly handled. Without it, fix structure first (colocate state, split context, pass `children`) before `memo`.
- Do not create context values inline that change every render for high-fanout providers (compiler handles this when on; verify).
- Animate `transform`/`opacity` only; respect `prefers-reduced-motion`.

## Caching as performance

- Static shell + streamed dynamic holes (Cache Components) gives fast TTFB/LCP. See `next-data-caching`.
- Do not make a whole route dynamic because one widget reads cookies; isolate it behind Suspense.

## AI slop tells

- `'use client'` on layouts/pages, inflating every route's JS.
- `<img>` tags with no dimensions; `priority` on every image; missing `sizes` with `fill`.
- Google Fonts via `<link>`; five font weights loaded "just in case".
- Analytics, chat, heatmaps all `beforeInteractive`.
- `useMemo` everywhere as "optimization" with no profile; meanwhile a 3,000-row list renders unvirtualized.
- `dynamic(..., { ssr: false })` on above-the-fold content.
- Spinners that replace content and shift layout instead of sized skeletons.
- Performance claims backed only by `next dev` timings.

## Done checklist

- [ ] Field or lab numbers recorded before and after (LCP, INP, CLS, First Load JS per route).
- [ ] LCP element identified; preloaded/prioritized; served from HTML (not client-rendered).
- [ ] All images sized with correct `sizes`; fonts via `next/font`; no layout shift from late content.
- [ ] New dependencies justified by size; heavy widgets dynamically imported with sized fallbacks.
- [ ] Third-party scripts use the least aggressive strategy that works.
- [ ] Expensive updates wrapped in transitions; no long tasks > 50ms in key interactions.
- [ ] Long lists paginated or virtualized with accessible semantics.
- [ ] Cross-checked with `sumi:performance`.

## Measuring React/Next.js performance

### 1. Field data (source of truth)

- CrUX (PageSpeed Insights, CrUX dashboard / BigQuery) for public sites with traffic.
- RUM for everything else: report Web Vitals from the app.

```tsx
// app/_components/web-vitals.tsx
'use client';
import { useReportWebVitals } from 'next/web-vitals';

export function WebVitals() {
  useReportWebVitals((metric) => {
    // metric: { name: 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB', value, rating, id, navigationType }
    const body = JSON.stringify({ ...metric, path: location.pathname });
    navigator.sendBeacon?.('/api/vitals', body) || fetch('/api/vitals', { body, method: 'POST', keepalive: true });
  });
  return null;
}
```

Render `<WebVitals />` once in the root layout. For attribution (which element is LCP, which interaction is slow), use the `web-vitals` package `attribution` build directly and send `attribution.interactionTarget`, `attribution.lcpEntry` selectors.

Vercel Speed Insights or any RUM vendor is fine; the point is p75 field numbers per route.

### 2. Lab: Lighthouse / Chrome DevTools

- Always on a production build: `next build && next start`.
- Mobile emulation with CPU 4x throttling for representative INP/TBT.
- Performance panel: record an interaction, look for long tasks, "Recalculate style"/"Layout" chains, and which React work (Components track in React DevTools-enabled builds) dominates.
- Performance panel "Live metrics" shows LCP/INP/CLS as you interact - fast feedback loop.

### 3. React Profiler

- React DevTools Profiler: record, inspect commits, "Why did this render?" (enable in settings).
- Profile in a profiling build when measuring precise timings; dev builds are slower and double-render in Strict Mode.
- Programmatic: `<Profiler id="ProjectTable" onRender={(id, phase, actualDuration) => ...}>` around a suspect subtree; log only `actualDuration` > 16ms.
- React 19.2 adds React Performance Tracks in the Chrome Performance panel (Scheduler and Components tracks) - verify availability in your DevTools version.

### 4. Bundles

- Next 16 Turbopack bundle analyzer (experimental at time of writing - verify command) or `@next/bundle-analyzer` with webpack.
- Look for: duplicated libraries, whole-library imports, server-only libs leaking into client chunks (add `server-only` to catch them at build), large JSON imported into client code.
- Record First Load JS per route from `next build` output; fail CI on regressions beyond an agreed budget.

### 5. Interpreting

| Symptom | Likely cause | First lever |
|---|---|---|
| High LCP, low TTFB | LCP image not prioritized, client-rendered hero, font blocking | `priority`/preload, render hero on server, `next/font` |
| High LCP, high TTFB | Dynamic route blocking on slow data | Cache shell, stream slow parts with Suspense |
| High INP | Long tasks in handlers, large re-renders, third-party scripts | Transitions, yield, split state, defer scripts |
| High CLS | Unsized media, late banners, font swap, skeleton mismatch | Dimensions, overlays, size-adjusted fonts, faithful skeletons |
| Large First Load JS | Client boundary too high, heavy deps | Push `'use client'` down, dynamic import, replace deps |

### 6. Report format

When reporting a perf change, include: route, device profile, metric before -> after, method (field/lab), and the change that caused it. No unmeasured claims.
