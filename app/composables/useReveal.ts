import { onBeforeUnmount, onMounted } from 'vue'

/**
 * The slot-home reveal of DESIGN.md §7: a module slides 24px along its
 * interlock axis into place, once, on first entry into the viewport.
 *
 * Landing page only. Reference pages get none of this — people arrive there
 * from a search result with one question and must not wait for choreography.
 *
 * The hidden starting state lives in CSS behind `@media (scripting: enabled)`,
 * not behind a class this sets. That matters: if the state were unconditional,
 * a reader with no JavaScript would get a blank page, and if it were applied by
 * JS the content would flash before hiding. A browser without `scripting`
 * support simply skips the animation and shows everything, which is the right
 * direction to fail in.
 */
export function useReveal() {
  let observer: IntersectionObserver | undefined
  let fallback: ReturnType<typeof setTimeout> | undefined

  function reveal(el: Element) {
    el.classList.add('is-revealed')
    observer?.unobserve(el)
  }

  onMounted(() => {
    const targets = [...document.querySelectorAll('[data-reveal]')]
    if (!targets.length) return

    // No IntersectionObserver: show everything rather than animate it.
    if (!('IntersectionObserver' in window)) {
      targets.forEach(reveal)
      return
    }

    // Anything already on screen is revealed synchronously, before the observer
    // exists. IntersectionObserver fires its first callback asynchronously even
    // for elements that already intersect, so above-the-fold modules spent at
    // least a frame at opacity 0 — and on a throttled CPU, many frames. There
    // is nothing to animate in for content the reader is already looking at.
    //
    // Found by Lighthouse: axe cannot compute contrast on transparent text, so
    // it reported color-contrast on 7 nodes of the landing whenever the audit
    // ran before the first callback. The score was the symptom; the invisible
    // first paint was the thing worth fixing.
    const pending = targets.filter((el) => {
      const r = el.getBoundingClientRect()
      const onScreen = r.top < window.innerHeight && r.bottom > 0
      if (onScreen) el.classList.add('is-revealed')
      return !onScreen
    })
    if (!pending.length) return

    observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
      { threshold: 0.12 }
    )
    pending.forEach((el) => observer!.observe(el))

    // If anything goes wrong — a mis-measured threshold, an element that never
    // intersects — content must still appear. Silence is worse than an
    // un-animated page.
    fallback = setTimeout(() => pending.forEach(reveal), 2500)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    clearTimeout(fallback)
  })
}
