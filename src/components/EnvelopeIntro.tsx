import { useEffect, useState } from 'react'
import { envelope, wedding } from '../content'
import './EnvelopeIntro.css'

type Phase = 'closed' | 'opening' | 'gone'

/** Total ms from click until the overlay unmounts. Keep in sync with the CSS. */
const OPEN_DURATION = 2100

export function EnvelopeIntro({ onFinish }: { onFinish: () => void }) {
  const [phase, setPhase] = useState<Phase>('closed')

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [])

  function open() {
    if (phase !== 'closed') return
    setPhase('opening')

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(
      () => {
        setPhase('gone')
        onFinish()
      },
      reduceMotion ? 200 : OPEN_DURATION,
    )
  }

  if (phase === 'gone') return null

  return (
    <div className={`envelope-intro is-${phase}`} role="dialog" aria-modal="true">
      <button
        type="button"
        className="envelope-intro__trigger"
        onClick={open}
        aria-label={`${envelope.title} — ${envelope.hint}`}
      >
        <p className="envelope-intro__title script">{envelope.title}</p>

        <div className="envelope-scene">
          <div className="envelope-wobble">
          <div className="envelope">
            <div className="envelope__letter">
              <p className="envelope__letter-names serif-caps">{envelope.initials}</p>
              <span className="envelope__letter-rule" aria-hidden="true" />
              <p className="envelope__letter-date sans-caps">{wedding.dateShort}</p>
            </div>

            <svg className="envelope__body" viewBox="0 0 320 210" fill="none" aria-hidden="true">
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

            <svg className="envelope__flap" viewBox="0 0 320 122" fill="none" aria-hidden="true">
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
