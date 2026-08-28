import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { envelope, wedding } from '../content'
import { prefersReducedMotion } from '../lib/introSession'
import { PUPPY_MOUTH, type PuppyPose } from '../lib/puppyArt'
import { Puppy } from './Puppy'
import './EnvelopeIntro.css'

type Phase = 'delivering' | 'closed' | 'opening' | 'gone'

/** Total ms from click until the overlay unmounts. Keep in sync with the CSS. */
const OPEN_DURATION = 2100

/** How small the envelope is while the puppy carries it in its mouth. */
const CARRY_SCALE = 0.17

export function EnvelopeIntro({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>(() =>
    prefersReducedMotion() ? 'closed' : 'delivering',
  )
  const [pose, setPose] = useState<PuppyPose>('run')

  const puppyRef = useRef<HTMLDivElement>(null)
  const carryRef = useRef<HTMLDivElement>(null)
  const deliveryRef = useRef<gsap.core.Timeline | null>(null)

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  /**
   * Puppy delivery: run in carrying the envelope, drop it, glance at it, run
   * off. The envelope settles into the resting position the rest of the intro
   * already uses, so the handoff is seamless.
   */
  useEffect(() => {
    if (phase !== 'delivering') return

    const puppy = puppyRef.current
    const carry = carryRef.current
    if (!puppy || !carry) return

    const ctx = gsap.context(() => {
      const width = window.innerWidth
      const startX = -0.82 * width
      const slowX = -0.12 * width
      const exitX = 0.95 * width

      // Measure both elements at rest, then work out the offset that hangs the
      // shrunken envelope from the puppy's muzzle. Deriving it from real
      // geometry keeps the carry aligned at any screen size.
      const puppyBox = puppy.getBoundingClientRect()
      const carryBox = carry.getBoundingClientRect()
      const mouthX = puppyBox.left + puppyBox.width * PUPPY_MOUTH.x
      const mouthY = puppyBox.top + puppyBox.height * PUPPY_MOUTH.y
      // Nudge the card down and forward from the muzzle so it dangles from the
      // mouth rather than covering the puppy's head.
      const carryOffsetX =
        mouthX - (carryBox.left + carryBox.width / 2) + (carryBox.width * CARRY_SCALE) / 2
      const carryOffsetY =
        mouthY - (carryBox.top + carryBox.height / 2) + (carryBox.height * CARRY_SCALE) / 2

      gsap.set(puppy, { x: startX, y: 0 })
      gsap.set(carry, {
        x: startX + carryOffsetX,
        y: carryOffsetY,
        rotate: -12,
        scale: CARRY_SCALE,
      })

      // Where the card comes to rest on the ground, just in front of the paws.
      const groundY = carryOffsetY + puppyBox.height * 0.16

      const tl = gsap.timeline({ onComplete: () => setPhase('closed') })
      deliveryRef.current = tl

      // Run in, with a gentle gait bob shared by puppy and envelope.
      tl.to(puppy, { x: slowX, duration: 0.85, ease: 'power1.out' })
        .to(carry, { x: slowX + carryOffsetX, duration: 0.85, ease: 'power1.out' }, '<')
        .to(puppy, { y: -7, duration: 0.17, repeat: 4, yoyo: true, ease: 'sine.inOut' }, '<')
        .to(
          carry,
          { y: carryOffsetY - 7, duration: 0.17, repeat: 4, yoyo: true, ease: 'sine.inOut' },
          '<',
        )

      // Drop: the card falls the short distance to the ground and settles at a
      // slight angle, as a dropped card would.
      tl.call(() => setPose('look'))
        .to(puppy, { y: 0, duration: 0.18 })
        .to(carry, { y: groundY, rotate: -4, duration: 0.42, ease: 'bounce.out' }, '<')

      // Beat where the puppy looks at what it delivered.
      tl.to({}, { duration: 0.3 })

      // Off it goes, and the invitation grows into place as it leaves.
      tl.call(() => setPose('run'))
        .to(puppy, { x: exitX, duration: 0.7, ease: 'power1.in' })
        .to(puppy, { y: -6, duration: 0.16, repeat: 3, yoyo: true, ease: 'sine.inOut' }, '<')
        .to(
          carry,
          { x: 0, y: 0, rotate: 0, scale: 1, duration: 0.72, ease: 'power2.inOut' },
          '<+=0.12',
        )
    })

    return () => {
      deliveryRef.current = null
      ctx.revert()
    }
  }, [phase])

  function handleClick() {
    // A click during delivery skips ahead rather than opening the envelope.
    if (phase === 'delivering') {
      deliveryRef.current?.progress(1)
      return
    }
    if (phase !== 'closed') return

    setPhase('opening')
    window.setTimeout(
      () => {
        setPhase('gone')
        onFinish()
      },
      prefersReducedMotion() ? 200 : OPEN_DURATION,
    )
  }

  if (phase === 'gone') return null

  return (
    <div className={`envelope-intro is-${phase}`} role="dialog" aria-modal="true">
      <button
        type="button"
        className="envelope-intro__trigger"
        onClick={handleClick}
        aria-label={`${envelope.title} — ${envelope.hint}`}
      >
        <p className="envelope-intro__title script">{envelope.title}</p>

        <div className="envelope-scene">
          {phase === 'delivering' ? (
            <div className="intro-puppy" ref={puppyRef}>
              <Puppy pose={pose} />
            </div>
          ) : null}

          {/* Two wrappers: the carry is driven by GSAP during the delivery,
              while the wobble runs the CSS idle nudge. Keeping them separate
              stops the two from writing to the same transform. */}
          <div className="envelope-carry" ref={carryRef}>
            <div className="envelope-wobble">
              <div className="envelope">
                <div className="envelope__letter">
                  <p className="envelope__letter-names serif-caps">{envelope.initials}</p>
                  <span className="envelope__letter-rule" aria-hidden="true" />
                  <p className="envelope__letter-date sans-caps">{wedding.dateShort}</p>
                </div>

                <svg
                  className="envelope__body"
                  viewBox="0 0 320 210"
                  fill="none"
                  aria-hidden="true"
                >
                  <rect
                    x="1"
                    y="1"
                    width="318"
                    height="208"
                    rx="6"
                    fill="var(--color-white)"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <path
                    d="M1 208 L160 108 L319 208"
                    fill="var(--color-cream)"
                    stroke="currentColor"
                    strokeWidth="1.6"
                  />
                  <path d="M1 2 L128 92" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
                  <path d="M319 2 L192 92" stroke="currentColor" strokeWidth="1.2" opacity="0.55" />
                </svg>

                <svg
                  className="envelope__flap"
                  viewBox="0 0 320 122"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M1 2 L160 118 L319 2"
                    fill="var(--color-cream-dark)"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinejoin="round"
                  />
                </svg>

                <WaxSeal initials={envelope.initials} />
              </div>
            </div>
          </div>
        </div>

        <p className="envelope-intro__hint sans-caps">{envelope.hint}</p>
      </button>
    </div>
  )
}

/**
 * Poured-wax blob. Each half is filled with the crack edge included (so the two
 * pieces meet seamlessly) while the outline is stroked only along the outer arc,
 * keeping the crack invisible until the seal breaks.
 */
const WAX_ARC_LEFT =
  'M50 8 C36 8 26 12 21 22 C15 32 6 38 7 49 C8 61 12 71 19 79 C26 87 38 92 50 92'
const WAX_ARC_RIGHT =
  'M50 8 C63 7 74 11 79 20 C85 30 94 39 93 50 C92 62 87 70 80 78 C73 86 62 93 50 92'
const WAX_CRACK = ' L47 79 L53 67 L44 55 L52 43 L46 30 Z'

const WAX_HALVES = [
  { side: 'left', arc: WAX_ARC_LEFT, clip: 'waxClipLeft' },
  { side: 'right', arc: WAX_ARC_RIGHT, clip: 'waxClipRight' },
] as const

function WaxSeal({ initials }: { initials: string }) {
  return (
    <div className="envelope__seal" aria-hidden="true">
      <svg viewBox="0 0 100 100">
        <defs>
          <radialGradient id="waxFill" cx="38%" cy="30%" r="76%">
            <stop offset="0%" stopColor="#7d8c5d" />
            <stop offset="62%" stopColor="#697848" />
            <stop offset="100%" stopColor="#515d34" />
          </radialGradient>
          <filter id="waxGrain">
            <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" result="noise" />
            <feColorMatrix in="noise" type="saturate" values="0" />
          </filter>
          <filter id="waxEmboss" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.3" stdDeviation="0.9" floodColor="#222b12" floodOpacity="0.9" />
          </filter>
          {WAX_HALVES.map(({ side, arc, clip }) => (
            <clipPath key={side} id={clip}>
              <path d={arc + WAX_CRACK} />
            </clipPath>
          ))}
        </defs>

        {WAX_HALVES.map(({ side, arc, clip }) => (
          <g key={side} className={`envelope__seal-half envelope__seal-half--${side}`}>
            <path d={arc + WAX_CRACK} fill="url(#waxFill)" />

            <g clipPath={`url(#${clip})`}>
              {/* matte grain */}
              <rect
                width="100"
                height="100"
                filter="url(#waxGrain)"
                opacity="0.16"
                style={{ mixBlendMode: 'multiply' }}
              />
              {/* pressed rim: dark groove with a light lip above it */}
              <ellipse
                cx="50"
                cy="50"
                rx="31"
                ry="31"
                fill="none"
                stroke="#39441f"
                strokeWidth="3"
                strokeOpacity="0.3"
              />
              <ellipse
                cx="50"
                cy="49"
                rx="31"
                ry="31"
                fill="none"
                stroke="#b9c599"
                strokeWidth="1"
                strokeOpacity="0.28"
              />
              {/* soft shading, no gloss */}
              <ellipse cx="34" cy="30" rx="24" ry="17" fill="#d6dfb6" opacity="0.12" />
              <ellipse cx="64" cy="76" rx="24" ry="16" fill="#232c15" opacity="0.2" />
              <text
                className="envelope__seal-monogram"
                x="50"
                y="51"
                textAnchor="middle"
                dominantBaseline="central"
                filter="url(#waxEmboss)"
              >
                {initials}
              </text>
            </g>

            {/* uneven poured edge */}
            <path d={arc} fill="none" stroke="#3b4620" strokeWidth="1.6" strokeOpacity="0.45" />
          </g>
        ))}
      </svg>
    </div>
  )
}
