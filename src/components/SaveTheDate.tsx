import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { home } from '../content'
import { useIntro } from '../lib/introContext'
import { hasDrawnCard, markCardDrawn, prefersReducedMotion } from '../lib/introSession'
import './SaveTheDate.css'

/** Natural size of the card artwork. */
const W = 731
const H = 1024

/**
 * Regions of the card, revealed in turn. Coordinates are in the artwork's own
 * pixels, so they can be nudged by eye against the image.
 */
const ART = { x: 88, y: 248, w: 562, h: 474 }
const SCRIPT = { x: 118, y: 108, w: 502, h: 152 }
const CORNERS = [
  { x: 0, y: 0, w: 152, h: 152 },
  { x: W - 152, y: 0, w: 152, h: 152 },
  { x: 0, y: H - 152, w: 152, h: 152 },
  { x: W - 152, y: H - 152, w: 152, h: 152 },
]

/**
 * The save-the-date, appearing as though it is being drawn onto the page.
 *
 * The artwork is a raster sketch of the couple's pets, so the lines cannot be
 * stroked on individually. Instead the card is revealed behind a mask made of
 * a few soft-edged wipes, timed so the illustration arrives first, then the
 * decorative corners, then the handwritten line, which wipes left to right the
 * way it would have been written.
 *
 * The mask is fully open by default, so the card is simply there if this never
 * gets a chance to run.
 */
export function SaveTheDate() {
  const rootRef = useRef<HTMLDivElement>(null)
  const { isOpen } = useIntro()
  /** Whether the envelope intro has been covering the page. */
  const wasCovered = useRef(isOpen)

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    if (isOpen) {
      wasCovered.current = true
      return
    }

    // The envelope has just cleared, or this is a fresh session with no intro.
    const justUncovered = wasCovered.current
    wasCovered.current = false
    if (!justUncovered && hasDrawnCard()) return
    if (prefersReducedMotion()) {
      markCardDrawn()
      return
    }

    const ctx = gsap.context(() => {
      const art = root.querySelector('.stod__wipe--art')
      const corners = root.querySelectorAll('.stod__wipe--corner')
      const script = root.querySelector('.stod__wipe--script')
      const rest = root.querySelector('.stod__wipe--rest')

      gsap.set([art, script], { attr: { width: 0 } })
      gsap.set(art, { attr: { y: ART.y + ART.h, height: 0, width: ART.w } })
      gsap.set([corners, rest], { opacity: 0 })

      /*
       * The session is marked once the drawing finishes rather than when it
       * starts. Marking up front means a torn-down-and-remounted effect — which
       * React does in development — sees the flag already set and skips the
       * animation entirely.
       */
      const tl = gsap.timeline({ delay: 0.25, onComplete: markCardDrawn })

      /*
       * The illustration grows upward, so the champagne tower builds itself.
       * Held at a steady rate deliberately: an eased reveal combined with the
       * mask's soft edge finishes the drawing so early that the rise is over
       * before it can be noticed.
       */
      tl.to(art, {
        attr: { y: ART.y, height: ART.h },
        duration: 1.25,
        ease: 'none',
      })
        .to(corners, { opacity: 1, duration: 0.45, stagger: 0.09, ease: 'none' }, '-=0.35')
        .to(script, { attr: { width: SCRIPT.w }, duration: 0.75, ease: 'power1.inOut' }, '-=0.25')
        // A full-canvas fade finishes the card, which brings in the remaining
        // text and guarantees nothing is left hidden by a misjudged region.
        .to(rest, { opacity: 1, duration: 0.5, ease: 'none' }, '-=0.1')
    }, root)

    return () => ctx.revert()
  }, [isOpen])

  return (
    <div className="stod" ref={rootRef}>
      <svg
        className="stod__svg"
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={home.artAlt}
      >
        <defs>
          {/* Soft leading edges, so a wipe reads as ink appearing rather than a
              hard rectangle sliding across. */}
          <linearGradient id="stod-soft-x" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.8" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>
          <linearGradient id="stod-soft-y" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0" stopColor="#fff" />
            <stop offset="0.88" stopColor="#fff" />
            <stop offset="1" stopColor="#000" />
          </linearGradient>

          <mask id="stod-mask">
            <rect
              className="stod__wipe stod__wipe--art"
              x={ART.x}
              y={ART.y}
              width={ART.w}
              height={ART.h}
              fill="url(#stod-soft-y)"
            />
            {CORNERS.map((corner, i) => (
              <rect
                key={i}
                className="stod__wipe stod__wipe--corner"
                x={corner.x}
                y={corner.y}
                width={corner.w}
                height={corner.h}
                fill="#fff"
              />
            ))}
            <rect
              className="stod__wipe stod__wipe--script"
              x={SCRIPT.x}
              y={SCRIPT.y}
              width={SCRIPT.w}
              height={SCRIPT.h}
              fill="url(#stod-soft-x)"
            />
            <rect
              className="stod__wipe stod__wipe--rest"
              x="0"
              y="0"
              width={W}
              height={H}
              fill="#fff"
            />
          </mask>
        </defs>

        <image
          href="/images/save-the-date.webp"
          x="0"
          y="0"
          width={W}
          height={H}
          mask="url(#stod-mask)"
        />
      </svg>
    </div>
  )
}
