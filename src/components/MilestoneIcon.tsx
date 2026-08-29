import type { TimelineIcon } from '../content'

/**
 * Small line-art illustrations for the wedding-day timeline, drawn in the same
 * thin-stroke style as the rest of the site. All share a 48x48 box so they line
 * up along the route, and inherit colour from the surrounding text.
 */
export function MilestoneIcon({ icon }: { icon: TimelineIcon }) {
  return (
    <svg className="milestone-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      {SHAPES[icon]}
    </svg>
  )
}

const GLASS = 'M-7 -11 L7 -11 L0 -1 Z'

const SHAPES: Record<TimelineIcon, React.ReactNode> = {
  // An open archway to walk through.
  arrival: (
    <>
      <path d="M13 40 V22 A11 11 0 0 1 35 22 V40" />
      <path d="M7 40 H41" />
      <path d="M19 40 V27 A5 5 0 0 1 29 27 V40" opacity="0.45" />
    </>
  ),

  // Two rings, overlapping.
  ceremony: (
    <>
      <circle cx="19" cy="26" r="9" />
      <circle cx="30" cy="26" r="9" />
      <path d="M19 13 L21.5 17 L16.5 17 Z" />
    </>
  ),

  // A pair of glasses raised together.
  cocktails: (
    <>
      <g transform="translate(16 22) rotate(-14)">
        <path d={GLASS} />
        <path d="M0 -1 V9" />
        <path d="M-5 9 H5" />
      </g>
      <g transform="translate(33 22) rotate(14)">
        <path d={GLASS} />
        <path d="M0 -1 V9" />
        <path d="M-5 9 H5" />
      </g>
      <path d="M24 9 V13 M21 11 H27" opacity="0.5" />
    </>
  ),

  // A place setting.
  dinner: (
    <>
      <circle cx="24" cy="24" r="11" />
      <circle cx="24" cy="24" r="7" opacity="0.4" />
      <path d="M8 13 V25 M8 25 V35" />
      <path d="M5 13 V19 M11 13 V19" opacity="0.6" />
      <path d="M40 13 C43 17 43 21 40 24 V35" />
    </>
  ),

  // A note and a heart, for the first dance.
  dance: (
    <>
      <ellipse cx="17" cy="32" rx="5" ry="3.8" transform="rotate(-18 17 32)" />
      <path d="M21 31 V13" />
      <path d="M21 13 C27 14 30 17 30 21" />
      <path d="M36 26 C36 23 32 22 32 26 C32 22 28 23 28 26 C28 29 32 32 32 32 C32 32 36 29 36 26 Z" />
    </>
  ),

  // Confetti.
  party: (
    <>
      <path d="M24 10 L26 18 L34 20 L26 22 L24 30 L22 22 L14 20 L22 18 Z" />
      <path d="M36 30 L37.2 33.8 L41 35 L37.2 36.2 L36 40 L34.8 36.2 L31 35 L34.8 33.8 Z" />
      <path d="M12 30 L12.9 32.6 L15.5 33.5 L12.9 34.4 L12 37 L11.1 34.4 L8.5 33.5 L11.1 32.6 Z" />
    </>
  ),
}
