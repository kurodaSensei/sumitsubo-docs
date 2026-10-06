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

    observer = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && reveal(e.target)),
      { threshold: 0.12 }
    )
    targets.forEach((el) => observer!.observe(el))

    // If anything goes wrong — a mis-measured threshold, an element that never
    // intersects — content must still appear. Silence is worse than an
    // un-animated page.
    fallback = setTimeout(() => targets.forEach(reveal), 2500)
  })

  onBeforeUnmount(() => {
    observer?.disconnect()
    clearTimeout(fallback)
  })
}
