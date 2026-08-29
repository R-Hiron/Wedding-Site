import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { timeline } from '../content'
import { prefersReducedMotion } from '../lib/introSession'
import { MilestoneIcon } from './MilestoneIcon'
import './WeddingDayTimeline.css'

gsap.registerPlugin(ScrollTrigger)

type Point = { x: number; y: number }

/** Straight run added before the first and after the last milestone. */
const LEAD = 36

/**
 * Fraction of the scroll range by which the route has finished drawing. Leaving
 * headroom means the final milestone appears while it is still comfortably in
 * view, rather than only once the section has been scrolled fully past.
 */
const DRAWN_BY = 0.9

/**
 * The wedding-day schedule drawn as a winding illustrated route.
 *
 * The route is generated from the measured positions of the milestone dots
 * rather than a hand-drawn path, so it always joins the milestones exactly at
 * any width, and the length at which each milestone is reached can be measured
 * precisely enough to reveal it as the line arrives.
 *
 * Milestones are visible by default and only hidden once the scroll animation
 * is actually running, so the schedule stays readable without JavaScript, and
 * for anyone who prefers reduced motion.
 */
export function WeddingDayTimeline() {
  const routeRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const trackRef = useRef<SVGPathElement>(null)
  const drawnRef = useRef<SVGPathElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const route = routeRef.current
    const svg = svgRef.current
    const track = trackRef.current
    const drawn = drawnRef.current
    if (!route || !svg || !track || !drawn) return

    const items = itemRefs.current.filter((el): el is HTMLLIElement => el !== null)
    if (items.length === 0) return

    const reduceMotion = prefersReducedMotion()

    let trigger: ScrollTrigger | null = null

    function layout() {
      const routeBox = route!.getBoundingClientRect()
      const points: Point[] = items.map((item) => {
        const dot = item.querySelector('.timeline__dot')!.getBoundingClientRect()
        return {
          x: dot.left - routeBox.left + dot.width / 2,
          y: dot.top - routeBox.top + dot.height / 2,
        }
      })

      const { d, reachedAt, total } = buildRoute(points, svg!)
      track!.setAttribute('d', d)
      drawn!.setAttribute('d', d)

      trigger?.kill()

      if (reduceMotion) {
        // Show the finished route and every milestone, with nothing to scrub.
        drawn!.style.strokeDasharray = 'none'
        drawn!.style.strokeDashoffset = '0'
        route!.classList.remove('is-animating')
        items.forEach((item) => item.classList.add('is-revealed'))
        return
      }

      route!.classList.add('is-animating')
      drawn!.style.strokeDasharray = `${total}`
      drawn!.style.strokeDashoffset = `${total}`

      // Ending at the viewport bottom is always reachable. An end expressed
      // relative to the fold is not: this section sits last on the page, so the
      // document cannot always scroll far enough, which previously left the
      // route unfinished and the final milestone hidden.
      trigger = ScrollTrigger.create({
        trigger: route!,
        start: 'top 80%',
        end: 'bottom bottom',
        onUpdate: (self) => {
          const length = total * Math.min(1, self.progress / DRAWN_BY)
          drawn!.style.strokeDashoffset = `${total - length}`
          items.forEach((item, i) => {
            // Reveals are one-way. The line follows the scroll in both
            // directions, but schedule text that vanished when a guest scrolled
            // back up to re-read it would be actively unhelpful.
            if (length + 0.5 >= reachedAt[i]) item.classList.add('is-revealed')
          })
        },
      })
    }

    layout()

    // Text reflow changes the milestone positions, so the route is rebuilt
    // whenever the section's size changes.
    let frame = 0
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(layout)
    })
    observer.observe(route)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      trigger?.kill()
    }
  }, [])

  return (
    <section className="timeline">
      <h2 className="timeline__title script">{timeline.title}</h2>
      <p className="timeline__intro">{timeline.intro}</p>
      {timeline.note ? <p className="timeline__note sans-caps">{timeline.note}</p> : null}

      <div className="timeline__route" ref={routeRef}>
        <svg className="timeline__svg" ref={svgRef} aria-hidden="true">
          <path className="timeline__line timeline__line--track" ref={trackRef} />
          <path className="timeline__line timeline__line--drawn" ref={drawnRef} />
        </svg>

        <ol className="timeline__list">
          {timeline.events.map((event, i) => (
            <li
              key={event.title}
              className="timeline__item"
              data-side={i % 2 === 0 ? 'left' : 'right'}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
            >
              <span className="timeline__dot" aria-hidden="true" />
              <div className="timeline__card">
                <MilestoneIcon icon={event.icon} />
                {event.time ? <p className="timeline__time sans-caps">{event.time}</p> : null}
                <h3 className="timeline__event serif-caps">{event.title}</h3>
                {event.description ? (
                  <p className="timeline__desc">{event.description}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/**
 * Builds a smooth path through the milestone points and measures how far along
 * it each milestone sits.
 *
 * Control points are offset vertically only, which turns the alternating
 * milestone positions into gentle S-curves rather than corners.
 */
function buildRoute(points: Point[], svg: SVGSVGElement) {
  const first = points[0]
  const last = points[points.length - 1]

  // Measured with a throwaway path inside the live SVG, because a detached
  // element is not guaranteed to report geometry.
  const ruler = document.createElementNS('http://www.w3.org/2000/svg', 'path')
  ruler.setAttribute('visibility', 'hidden')
  svg.appendChild(ruler)

  const lengthOf = (d: string) => {
    ruler.setAttribute('d', d)
    return ruler.getTotalLength()
  }

  let d = `M ${first.x} ${first.y - LEAD} L ${first.x} ${first.y}`
  const reachedAt = [lengthOf(d)]

  for (let i = 1; i < points.length; i++) {
    const from = points[i - 1]
    const to = points[i]
    const bend = (to.y - from.y) * 0.5
    d += ` C ${from.x} ${from.y + bend}, ${to.x} ${to.y - bend}, ${to.x} ${to.y}`
    reachedAt.push(lengthOf(d))
  }

  d += ` L ${last.x} ${last.y + LEAD}`
  const total = lengthOf(d)

  ruler.remove()

  return { d, reachedAt, total }
}
