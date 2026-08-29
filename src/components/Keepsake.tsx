/**
 * Keepsakes tucked into the parts of a scrapbook page that have no photo.
 *
 * A real scrapbook is never just photos — there are pressed leaves, ticket
 * stubs, paper clips and pen marks in the gaps. These fill the same role, drawn
 * in the site's thin line art so they read as things stuck to the page rather
 * than as illustrations competing with the photographs.
 *
 * Three of them sit on a scrap of paper, which is what stops a page of two
 * photos from looking like two photos and a lot of nothing.
 */
export type KeepsakeName =
  | 'heart'
  | 'arrow'
  | 'sparkle'
  | 'sprig'
  | 'ticket'
  | 'stamp'
  | 'paw'
  | 'clip'
  | 'pin'
  | 'note'

/** The ones drawn as though pasted onto a scrap of paper. */
const ON_PAPER: KeepsakeName[] = ['ticket', 'stamp', 'note']

export function Keepsake({ name, lean = 0 }: { name: KeepsakeName; lean?: number }) {
  const paper = ON_PAPER.includes(name)

  return (
    <span
      className={`keepsake keepsake--${name}${paper ? ' keepsake--paper' : ''}`}
      data-lean={lean % 4}
      aria-hidden="true"
    >
      <svg viewBox={VIEW_BOXES[name]}>{SHAPES[name]}</svg>
    </span>
  )
}

const VIEW_BOXES: Record<KeepsakeName, string> = {
  heart: '0 0 40 36',
  arrow: '0 0 90 40',
  sparkle: '0 0 40 40',
  sprig: '0 0 60 92',
  ticket: '0 0 100 48',
  stamp: '0 0 72 84',
  paw: '0 0 60 62',
  clip: '0 0 40 92',
  pin: '0 0 52 72',
  note: '0 0 92 72',
}

const SHAPES: Record<KeepsakeName, React.ReactNode> = {
  heart: (
    <path d="M20 33 C10 26 3 20 3 13 C3 7 7 4 11 4 C15 4 18 6 20 10 C22 6 25 4 29 4 C33 4 37 7 37 13 C37 20 30 26 20 33 Z" />
  ),

  arrow: (
    <>
      <path d="M4 8 C24 2 58 4 82 24" />
      <path d="M82 24 L70 20 M82 24 L76 12" />
    </>
  ),

  sparkle: <path d="M20 4 L23 17 L36 20 L23 23 L20 36 L17 23 L4 20 L17 17 Z" />,

  // A pressed sprig, leaves alternating up the stem.
  sprig: (
    <>
      <path d="M30 90 C27 64 29 36 33 6" />
      <path d="M29 74 C17 72 10 63 13 54 C22 55 28 64 29 74 Z" />
      <path d="M30 62 C42 60 49 51 46 42 C37 43 31 52 30 62 Z" />
      <path d="M30 50 C19 48 13 40 16 32 C24 33 29 41 30 50 Z" />
      <path d="M31 38 C42 36 48 28 45 20 C37 21 32 29 31 38 Z" />
    </>
  ),

  // A ticket stub, torn along the perforation.
  ticket: (
    <>
      <rect x="8" y="8" width="84" height="32" rx="3" />
      <path className="k-perforated" d="M70 10 V38" />
      <path d="M18 20 H58" opacity="0.5" />
      <path d="M18 29 H46" opacity="0.5" />
      <path
        d="M81 20 L82.6 24 L86.6 25.6 L82.6 27.2 L81 31.2 L79.4 27.2 L75.4 25.6 L79.4 24 Z"
        opacity="0.5"
      />
    </>
  ),

  // A postage stamp, perforated all the way round.
  stamp: (
    <>
      <rect className="k-perforated" x="8" y="8" width="56" height="68" rx="1" />
      <rect x="16" y="16" width="40" height="52" opacity="0.45" />
      <path
        transform="translate(24 30) scale(0.62)"
        d="M20 33 C10 26 3 20 3 13 C3 7 7 4 11 4 C15 4 18 6 20 10 C22 6 25 4 29 4 C33 4 37 7 37 13 C37 20 30 26 20 33 Z"
      />
    </>
  ),

  // The puppy came through here.
  paw: (
    <>
      <ellipse cx="30" cy="42" rx="13" ry="11" />
      <ellipse cx="15" cy="26" rx="5" ry="6.5" />
      <ellipse cx="25" cy="18" rx="5" ry="6.5" />
      <ellipse cx="36" cy="18" rx="5" ry="6.5" />
      <ellipse cx="46" cy="26" rx="5" ry="6.5" />
    </>
  ),

  clip: <path d="M13 14 V72 A8 8 0 0 0 29 72 V24 A12 12 0 0 1 5 24 V64" />,

  pin: (
    <>
      <path d="M26 68 C26 68 7 44 7 27 A19 19 0 0 1 45 27 C45 44 26 68 26 68 Z" />
      <circle cx="26" cy="27" r="6.5" />
    </>
  ),

  // A note, with writing too small to read — which is the point.
  note: (
    <>
      <rect x="7" y="8" width="78" height="56" rx="2" />
      <path d="M17 24 C25 20 31 28 41 24 C49 21 57 27 69 23" opacity="0.55" />
      <path d="M17 36 C27 32 35 40 47 36 C55 33 61 39 71 35" opacity="0.55" />
      <path d="M17 48 C25 45 33 51 45 47" opacity="0.55" />
    </>
  ),
}
