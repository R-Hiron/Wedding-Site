import type { TimelineIcon } from '../content'
import './MilestoneScene.css'

/**
 * A small illustrated scene for each stop on the wedding-day route.
 *
 * Each one is a little picture of the thing itself rather than a symbol for it:
 * petals drift through the arch, the rings settle together, the glasses clink,
 * dinner steams, the record turns, the lights twinkle. All are drawn in the same
 * thin-stroke line art as the rest of the site and share a 96x96 box so they sit
 * identically inside their medallion at any size.
 *
 * The movement lives in `MilestoneScene.css`, and only runs once a milestone has
 * been revealed — so nothing animates off-screen, and nothing animates at all
 * for a guest who prefers reduced motion.
 */
export function MilestoneScene({ icon }: { icon: TimelineIcon }) {
  return (
    <svg className="ms" viewBox="0 0 96 96" fill="none" aria-hidden="true">
      {SCENES[icon]}
    </svg>
  )
}

const SCENES: Record<TimelineIcon, React.ReactNode> = {
  // An open arch to walk through, with petals coming down.
  arrival: (
    <>
      <path d="M10 80 H86" opacity="0.5" />
      <path d="M22 80 V44 A26 26 0 0 1 74 44 V80" />
      <path d="M33 80 V49 A15 15 0 0 1 63 49 V80" opacity="0.3" />
      <ellipse className="ms-petal ms-petal--a" cx="35" cy="32" rx="3.6" ry="2.3" />
      <ellipse className="ms-petal ms-petal--b" cx="52" cy="26" rx="3.1" ry="2" />
      <ellipse className="ms-petal ms-petal--c" cx="62" cy="38" rx="2.8" ry="1.9" />
    </>
  ),

  // Two rings drifting together, with a glint off them.
  ceremony: (
    <>
      <circle className="ms-ring ms-ring--left" cx="40" cy="56" r="17" />
      <circle className="ms-ring ms-ring--right" cx="58" cy="56" r="17" />
      <path
        className="ms-glint ms-glint--a"
        d="M76 22 L78.4 29 L85 31.4 L78.4 33.8 L76 40.8 L73.6 33.8 L67 31.4 L73.6 29 Z"
      />
      <path
        className="ms-glint ms-glint--b"
        d="M21 30 L22.4 34 L26.4 35.4 L22.4 36.8 L21 40.8 L19.6 36.8 L15.6 35.4 L19.6 34 Z"
      />
    </>
  ),

  // A camera finding its focus, with the flash going off above it.
  photos: (
    <>
      <path d="M14 76 V41 A6 6 0 0 1 20 35 H33 L38 27 H58 L63 35 H76 A6 6 0 0 1 82 41 V70 A6 6 0 0 1 76 76 Z" />
      <circle cx="48" cy="56" r="14" />
      <circle className="ms-lens" cx="48" cy="56" r="8" opacity="0.3" />
      <circle cx="72" cy="44" r="2.2" opacity="0.55" />
      <path
        className="ms-flash ms-flash--a"
        d="M76 12 L78.6 19.4 L86 22 L78.6 24.6 L76 32 L73.4 24.6 L66 22 L73.4 19.4 Z"
      />
      <path
        className="ms-flash ms-flash--b"
        d="M20 16 L21.6 20.4 L26 22 L21.6 23.6 L20 28 L18.4 23.6 L14 22 L18.4 20.4 Z"
      />
    </>
  ),

  // A pair of glasses leaning in for a clink, bubbles rising off them.
  cocktails: (
    <>
      <path d="M12 84 H84" opacity="0.35" />
      <g className="ms-glass ms-glass--left">
        <path d="M23 40 L45 40 L34 57 Z" />
        <path d="M34 57 V74" />
        <path d="M26 74 H42" />
      </g>
      <g className="ms-glass ms-glass--right">
        <path d="M51 40 L73 40 L62 57 Z" />
        <path d="M62 57 V74" />
        <path d="M54 74 H70" />
      </g>
      <circle className="ms-bubble ms-bubble--a" cx="34" cy="32" r="2.1" />
      <circle className="ms-bubble ms-bubble--b" cx="48" cy="27" r="1.6" />
      <circle className="ms-bubble ms-bubble--c" cx="62" cy="31" r="1.9" />
    </>
  ),

  // A place setting, still steaming.
  dinner: (
    <>
      <circle cx="48" cy="60" r="21" />
      <circle cx="48" cy="60" r="14" opacity="0.3" />
      <path d="M14 46 V80" />
      <path d="M9 34 V44 M14 34 V44 M19 34 V44" opacity="0.55" />
      <path d="M9 44 H19" opacity="0.55" />
      <path d="M82 34 C88 40 88 47 82 51 V80" />
      <path className="ms-steam ms-steam--a" d="M40 34 C35 28 45 24 40 17" />
      <path className="ms-steam ms-steam--b" d="M56 34 C51 28 61 24 56 17" />
    </>
  ),

  // A record turning, with the music coming off it.
  dance: (
    <>
      <g className="ms-record">
        <circle cx="44" cy="58" r="21" />
        <circle cx="44" cy="58" r="13" opacity="0.3" />
        <circle cx="44" cy="58" r="3.4" />
        <path d="M44 37 V44" opacity="0.45" />
      </g>
      <g className="ms-note ms-note--a">
        <path d="M70 30 V44" />
        <path d="M70 30 C76 31 78 34 78 38" />
        <ellipse cx="66" cy="45" rx="4.4" ry="3.4" />
      </g>
      <g className="ms-note ms-note--b">
        <path d="M84 18 V29" />
        <path d="M84 18 C88 19 90 21 90 24" />
        <ellipse cx="81" cy="30" rx="3.4" ry="2.7" />
      </g>
    </>
  ),

  // Lights strung overhead, confetti coming down.
  party: (
    <>
      <path d="M8 26 Q48 48 88 26" />
      <g className="ms-bulbs">
        <g className="ms-bulb ms-bulb--a">
          <path d="M24 33 V37.5" opacity="0.6" />
          <circle cx="24" cy="43" r="4" />
        </g>
        <g className="ms-bulb ms-bulb--b">
          <path d="M36 36 V40.5" opacity="0.6" />
          <circle cx="36" cy="46" r="4" />
        </g>
        <g className="ms-bulb ms-bulb--c">
          <path d="M48 37 V41.5" opacity="0.6" />
          <circle cx="48" cy="47" r="4" />
        </g>
        <g className="ms-bulb ms-bulb--d">
          <path d="M60 36 V40.5" opacity="0.6" />
          <circle cx="60" cy="46" r="4" />
        </g>
        <g className="ms-bulb ms-bulb--e">
          <path d="M72 33 V37.5" opacity="0.6" />
          <circle cx="72" cy="43" r="4" />
        </g>
      </g>
      {/* Spread right across, so the confetti falls under the whole string. */}
      <rect className="ms-confetti ms-confetti--a" x="12" y="58" width="7" height="3.4" rx="1.4" />
      <rect className="ms-confetti ms-confetti--b" x="36" y="66" width="6" height="3" rx="1.3" />
      <rect className="ms-confetti ms-confetti--c" x="60" y="59" width="7" height="3.4" rx="1.4" />
      <rect className="ms-confetti ms-confetti--d" x="80" y="67" width="5.4" height="2.8" rx="1.2" />
    </>
  ),
}
