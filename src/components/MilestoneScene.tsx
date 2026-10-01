import type { TimelineIcon } from '../content'
import './MilestoneScene.css'

/**
 * A cartoon scene for each stop on the wedding-day route.
 *
 * These sit in a wide panel, not a small circle, so each one has room for the
 * thing itself: guests under the arch, rings and a heart, a camera printing a
 * photo, glasses and a plate of bites, a steaming plate, lights and dancers.
 * They share a 128x96 box so they fill that panel the same way at any size.
 *
 * The movement lives in `MilestoneScene.css`, and only runs once a milestone has
 * been revealed — so nothing animates off-screen, and nothing animates at all
 * for a guest who prefers reduced motion.
 */
export function MilestoneScene({ icon }: { icon: TimelineIcon }) {
  return (
    <svg className="ms" viewBox="0 0 128 96" fill="none" aria-hidden="true">
      {SCENES[icon]}
    </svg>
  )
}

const SCENES: Record<TimelineIcon, React.ReactNode> = {
  // Guests arriving under an arch, waving, with petals coming down.
  arrival: (
    <>
      <path d="M30 86 V46 A34 32 0 0 1 98 46 V86" />
      <path d="M44 86 V52 A20 18 0 0 1 84 52 V86" opacity="0.28" />
      <g className="ms-person">
        <ellipse className="ms-blob" cx="20" cy="72" rx="8" ry="10" />
        <circle className="ms-blob" cx="20" cy="56" r="6.4" />
        <path className="ms-arm ms-arm--a" d="M14 66 Q6 58 10 50" />
        <path d="M26 66 Q34 72 32 80" />
      </g>
      <g className="ms-person">
        <ellipse className="ms-blob" cx="108" cy="72" rx="8" ry="10" />
        <circle className="ms-blob" cx="108" cy="56" r="6.4" />
        <path className="ms-arm ms-arm--b" d="M114 66 Q122 58 118 50" />
        <path d="M102 66 Q94 72 96 80" />
      </g>
      <ellipse className="ms-petal ms-petal--a" cx="50" cy="34" rx="4.4" ry="2.7" />
      <ellipse className="ms-petal ms-petal--b" cx="66" cy="26" rx="3.6" ry="2.2" />
      <ellipse className="ms-petal ms-petal--c" cx="82" cy="38" rx="3.2" ry="2" />
    </>
  ),

  // Rings settling together under the arch, a heart lifting off them.
  ceremony: (
    <>
      <path d="M36 82 V50 A28 26 0 0 1 92 50 V82" opacity="0.3" />
      <circle className="ms-ring ms-ring--left" cx="52" cy="60" r="16" />
      <circle className="ms-ring ms-ring--right" cx="76" cy="60" r="16" />
      <path
        className="ms-heart ms-blob"
        d="M64 33 C64 33 52 24 52 18 C52 13 57 12 64 18 C71 12 76 13 76 18 C76 24 64 33 64 33 Z"
      />
      <path
        className="ms-glint ms-glint--a"
        d="M104 16 L106.6 23.2 L114 25.8 L106.6 28.4 L104 35.6 L101.4 28.4 L94 25.8 L101.4 23.2 Z"
      />
      <path
        className="ms-glint ms-glint--b"
        d="M22 24 L23.6 28.4 L28 30 L23.6 31.6 L22 36 L20.4 31.6 L16 30 L20.4 28.4 Z"
      />
    </>
  ),

  // A camera finding its focus, printing a photo, flash going off.
  photos: (
    <>
      <g className="ms-polaroid">
        <rect className="ms-blob" x="50" y="54" width="28" height="28" rx="2.5" />
        <rect x="54" y="58" width="20" height="14" rx="1.5" />
      </g>
      <rect className="ms-solid" x="18" y="32" width="92" height="42" rx="8" />
      <path className="ms-solid" d="M46 32 L52 20 H76 L82 32 Z" />
      <circle cx="64" cy="52" r="15" />
      <circle className="ms-lens" cx="64" cy="52" r="8.5" />
      <circle cx="98" cy="42" r="2.5" opacity="0.55" />
      <path
        className="ms-flash ms-flash--a"
        d="M108 8 L110.8 16 L119 18.8 L110.8 21.6 L108 29.6 L105.2 21.6 L97 18.8 L105.2 16 Z"
      />
      <path
        className="ms-flash ms-flash--b"
        d="M16 12 L17.6 16.6 L22.2 18.2 L17.6 19.8 L16 24.4 L14.4 19.8 L9.8 18.2 L14.4 16.6 Z"
      />
    </>
  ),

  // Glasses leaning in for a clink, bites on a plate, bubbles rising.
  cocktails: (
    <>
      <path d="M12 86 H116" opacity="0.35" />
      <g className="ms-glass ms-glass--left">
        <path d="M18 36 L46 36 L32 56 Z" />
        <path d="M32 56 V74" />
        <path d="M23 74 H41" />
      </g>
      <g className="ms-glass ms-glass--right">
        <path d="M82 36 L110 36 L96 56 Z" />
        <path d="M96 56 V74" />
        <path d="M87 74 H105" />
      </g>
      <g className="ms-snack">
        <path d="M50 80 H78" />
        <ellipse className="ms-blob" cx="57" cy="75" rx="4.2" ry="2.6" />
        <ellipse className="ms-blob" cx="70" cy="74" rx="3.6" ry="2.3" />
      </g>
      <circle className="ms-bubble ms-bubble--a" cx="32" cy="28" r="2.3" />
      <circle className="ms-bubble ms-bubble--b" cx="64" cy="22" r="1.7" />
      <circle className="ms-bubble ms-bubble--c" cx="96" cy="28" r="2.1" />
    </>
  ),

  // A place setting, still steaming, with a candle.
  dinner: (
    <>
      <circle cx="56" cy="62" r="22" />
      <circle cx="56" cy="62" r="14" opacity="0.28" />
      <path d="M16 46 V82" />
      <path d="M10 32 V44 M16 32 V44 M22 32 V44" opacity="0.55" />
      <path d="M10 44 H22" opacity="0.55" />
      <path d="M100 32 V64" />
      <path d="M96 64 H104" />
      <path d="M100 64 V80" />
      <rect className="ms-blob" x="112" y="60" width="7" height="22" rx="1.5" />
      <path className="ms-flame" d="M115.5 58 C112 50 115.5 44 115.5 38 C115.5 44 119 50 115.5 58" />
      <path className="ms-steam ms-steam--a" d="M46 34 C40 26 52 22 46 14" />
      <path className="ms-steam ms-steam--b" d="M66 34 C60 26 72 22 66 14" />
    </>
  ),

  // A record turning, with the music coming off it.
  dance: (
    <>
      <g className="ms-record">
        <circle cx="48" cy="58" r="24" />
        <circle cx="48" cy="58" r="14" opacity="0.28" />
        <circle className="ms-blob" cx="48" cy="58" r="4" />
        <path d="M48 34 V44" opacity="0.45" />
      </g>
      <g className="ms-note ms-note--a">
        <path d="M86 28 V46" />
        <path d="M86 28 C94 30 97 34 97 40" />
        <ellipse cx="81" cy="48" rx="5" ry="3.6" />
      </g>
      <g className="ms-note ms-note--b">
        <path d="M108 14 V28" />
        <path d="M108 14 C114 16 116 18 116 22" />
        <ellipse cx="104" cy="30" rx="4" ry="3" />
      </g>
    </>
  ),

  // Lights overhead, two dancers, confetti coming down.
  party: (
    <>
      <path d="M6 22 Q64 48 122 22" />
      <g className="ms-bulbs">
        <g className="ms-bulb ms-bulb--a">
          <path d="M28 30 V35" opacity="0.6" />
          <circle className="ms-blob" cx="28" cy="40" r="4.2" />
        </g>
        <g className="ms-bulb ms-bulb--b">
          <path d="M46 36 V41" opacity="0.6" />
          <circle className="ms-blob" cx="46" cy="46" r="4.2" />
        </g>
        <g className="ms-bulb ms-bulb--c">
          <path d="M64 40 V45" opacity="0.6" />
          <circle className="ms-blob" cx="64" cy="50" r="4.2" />
        </g>
        <g className="ms-bulb ms-bulb--d">
          <path d="M82 36 V41" opacity="0.6" />
          <circle className="ms-blob" cx="82" cy="46" r="4.2" />
        </g>
        <g className="ms-bulb ms-bulb--e">
          <path d="M100 30 V35" opacity="0.6" />
          <circle className="ms-blob" cx="100" cy="40" r="4.2" />
        </g>
      </g>
      <g className="ms-dancer ms-dancer--a">
        <ellipse className="ms-blob" cx="34" cy="76" rx="8" ry="10" />
        <circle className="ms-blob" cx="34" cy="60" r="6" />
        <path d="M26 70 Q16 64 18 54" />
        <path d="M42 70 Q52 78 48 86" />
      </g>
      <g className="ms-dancer ms-dancer--b">
        <ellipse className="ms-blob" cx="94" cy="76" rx="8" ry="10" />
        <circle className="ms-blob" cx="94" cy="60" r="6" />
        <path d="M86 70 Q76 78 80 86" />
        <path d="M102 70 Q112 64 110 54" />
      </g>
      <rect className="ms-confetti ms-confetti--a" x="14" y="58" width="8" height="3.6" rx="1.4" />
      <rect className="ms-confetti ms-confetti--b" x="54" y="70" width="7" height="3.2" rx="1.3" />
      <rect className="ms-confetti ms-confetti--c" x="70" y="56" width="8" height="3.6" rx="1.4" />
      <rect className="ms-confetti ms-confetti--d" x="112" y="64" width="6" height="3" rx="1.2" />
    </>
  ),
}
