import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrapbook } from '../content'
import type { ScrapbookPhoto } from '../content'
import { Keepsake } from './Keepsake'
import type { KeepsakeName } from './Keepsake'
import { scrapbookImages } from '../lib/scrapbookImages'
import { prefersReducedMotion } from '../lib/introSession'
import './Scrapbook.css'

gsap.registerPlugin(ScrollTrigger)

/** Frames occupy about a quarter of a page, so they never need a large file. */
const SIZES = '(min-width: 48rem) 24vw, 40vw'

/** Below this width there is no room for two facing pages. */
const SPREAD_QUERY = '(min-width: 48rem)'

/** How much scrolling each page turn takes, as a share of the viewport height. */
const SCROLL_PER_TURN = 0.85

type Page =
  | { kind: 'photos'; photos: ScrapbookPhoto[]; index: number }
  | { kind: 'closing' }
  | { kind: 'blank' }

/**
 * One sheet of paper in the book. Its front is the page you see on the right
 * before the turn, and its back is the page that ends up on the left after it.
 */
type Leaf = { front: Page | null; back: Page | null }

/**
 * Photos from the relationship, presented as a scrapbook whose pages turn as
 * the section is scrolled.
 *
 * Guests who prefer reduced motion get every page laid out down the screen
 * instead, so nothing is only reachable by animation.
 */
export function Scrapbook() {
  const [flat] = useState(prefersReducedMotion)
  const [twoUp, setTwoUp] = useState(
    () => typeof window !== 'undefined' && window.matchMedia(SPREAD_QUERY).matches,
  )

  useEffect(() => {
    const query = window.matchMedia(SPREAD_QUERY)
    const onChange = () => setTwoUp(query.matches)
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  const pages = useMemo(() => buildPages(), [])
  const leaves = useMemo(() => buildLeaves(pages, twoUp), [pages, twoUp])

  const [openSlug, setOpenSlug] = useState<string | null>(null)
  const openable = useMemo(
    () => scrapbook.photos.filter((photo) => photo.slug in scrapbookImages),
    [],
  )

  return (
    <section className={`scrapbook${flat ? ' scrapbook--flat' : ''}`}>
      <h2 className="scrapbook__title script">{scrapbook.title}</h2>
      <p className="scrapbook__intro">{scrapbook.intro}</p>
      {scrapbook.note ? <p className="scrapbook__note sans-caps">{scrapbook.note}</p> : null}

      {flat ? (
        <FlatPages pages={pages} onOpen={setOpenSlug} />
      ) : (
        <Book leaves={leaves} twoUp={twoUp} onOpen={setOpenSlug} />
      )}

      <Lightbox photos={openable} openSlug={openSlug} onChange={setOpenSlug} />
    </section>
  )
}

/** The scroll-driven book. */
function Book({
  leaves,
  twoUp,
  onOpen,
}: {
  leaves: Leaf[]
  twoUp: boolean
  onOpen: (slug: string) => void
}) {
  const stageRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<ScrollTrigger | null>(null)

  /**
   * A single-page book shows the front of every leaf, so the last turn would
   * only reveal a blank back. A spread needs one extra turn to bring the final
   * leaf's back page over to the left.
   */
  const maxTurn = twoUp ? leaves.length : leaves.length - 1

  const [turn, setTurn] = useState(0)
  /**
   * Photos are only given a src once the reader has come close to them, and
   * this only ever grows, so turning back does not re-fetch anything.
   */
  const [loadThrough, setLoadThrough] = useState(0)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const leafEls = gsap.utils.toArray<HTMLElement>('.leaf', stage)
    let reached = 0
    let shown = 0

    function paint(turnValue: number) {
      leafEls.forEach((el, i) => {
        const progress = Math.min(1, Math.max(0, turnValue - i))
        el.style.transform = `rotateY(${-180 * progress}deg)`
        // Past halfway the sheet belongs to the left-hand stack, where the most
        // recently turned page has to sit on top.
        el.style.zIndex = String(progress > 0.5 ? i + 1 : leafEls.length - i)
      })
    }

    paint(0)

    const trigger = ScrollTrigger.create({
      trigger: stage,
      start: 'top top',
      end: () => `+=${Math.max(1, maxTurn) * window.innerHeight * SCROLL_PER_TURN}`,
      pin: true,
      pinSpacing: true,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const turnValue = self.progress * maxTurn
        paint(turnValue)

        const need = Math.ceil(turnValue) + 1
        if (need > reached) {
          reached = need
          setLoadThrough(need)
        }

        const rounded = Math.round(turnValue)
        if (rounded !== shown) {
          shown = rounded
          setTurn(rounded)
        }
      },
    })

    triggerRef.current = trigger

    return () => {
      trigger.kill()
      triggerRef.current = null
    }
  }, [leaves, maxTurn])

  /** Scrolling is the source of truth, so the controls move the scroll position. */
  const goTo = useCallback(
    (target: number) => {
      const trigger = triggerRef.current
      if (!trigger) return
      const clamped = Math.min(maxTurn, Math.max(0, target))
      const top = trigger.start + (clamped / maxTurn) * (trigger.end - trigger.start)
      window.scrollTo({ top, behavior: 'smooth' })
    },
    [maxTurn],
  )

  return (
    <div className="scrapbook__stage" ref={stageRef}>
      <div className={`book ${twoUp ? 'book--spread' : 'book--single'}`}>
        <div className="book__cover leather" aria-hidden="true" />
        <div className="book__paper book__paper--left" aria-hidden="true" />
        <div className="book__paper book__paper--right" aria-hidden="true" />

        {leaves.map((leaf, i) => (
          <div className="leaf" key={i}>
            <div className="leaf__face leaf__face--front">
              <PageFace page={leaf.front} onOpen={onOpen} withImages={i <= loadThrough} />
            </div>
            <div className="leaf__face leaf__face--back">
              <PageFace page={leaf.back} onOpen={onOpen} withImages={i <= loadThrough} />
            </div>
          </div>
        ))}

        <div className="book__spine" aria-hidden="true" />
      </div>

      <div className="book__controls">
        <button
          type="button"
          className="book__arrow"
          onClick={() => goTo(turn - 1)}
          disabled={turn <= 0}
          aria-label={scrapbook.controls.previous}
        >
          ‹
        </button>

        <ol className="book__dots">
          {Array.from({ length: maxTurn + 1 }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={`book__dot${i === turn ? ' is-current' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Page ${i + 1} of ${maxTurn + 1}`}
                aria-current={i === turn ? 'true' : undefined}
              />
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="book__arrow"
          onClick={() => goTo(turn + 1)}
          disabled={turn >= maxTurn}
          aria-label={scrapbook.controls.next}
        >
          ›
        </button>
      </div>

      {turn === 0 ? <p className="book__hint sans-caps">{scrapbook.scrollHint}</p> : null}
    </div>
  )
}

/** Every page down the screen, for reduced motion. */
function FlatPages({ pages, onOpen }: { pages: Page[]; onOpen: (slug: string) => void }) {
  return (
    <div className="scrapbook__flat">
      {pages.map((page, i) => (
        <div className="flat-page" key={i}>
          <PageFace page={page} onOpen={onOpen} withImages />
        </div>
      ))}
    </div>
  )
}

function PageFace({
  page,
  onOpen,
  withImages,
}: {
  page: Page | null
  onOpen: (slug: string) => void
  withImages: boolean
}) {
  // A leaf can have nothing on its back, and that face is never read.
  if (!page) return <div className="sheet sheet--blank" />

  // This sheet only exists to make the pages pair up, so it carries keepsakes
  // and nothing a guest would be sorry to miss.
  if (page.kind === 'blank') {
    return (
      <div className="sheet sheet--blank">
        <span className="sheet__scrap sheet__scrap--a">
          <Keepsake name="sprig" lean={1} />
        </span>
        <span className="sheet__scrap sheet__scrap--b">
          <Keepsake name="ticket" lean={2} />
        </span>
        <span className="sheet__scrap sheet__scrap--c">
          <Keepsake name="paw" lean={0} />
        </span>
        <span className="sheet__scrap sheet__scrap--d">
          <Keepsake name="stamp" lean={3} />
        </span>
        <span className="sheet__scrap sheet__scrap--e">
          <Keepsake name="sparkle" lean={1} />
        </span>
      </div>
    )
  }

  if (page.kind === 'closing') {
    return (
      <div className="sheet sheet--closing">
        <span className="sheet__flourish sheet__flourish--left">
          <Keepsake name="sprig" lean={0} />
        </span>
        <span className="sheet__flourish sheet__flourish--right">
          <Keepsake name="sprig" lean={2} />
        </span>
        <Keepsake name="heart" />
        <p className="sheet__closing-line hand">{scrapbook.closing.line}</p>
        <p className="sheet__closing-date script">{scrapbook.closing.date}</p>
      </div>
    )
  }

  return (
    <div className="sheet">
      <div className="sheet__slots">
        {pageCells(page).map((cell, i) =>
          cell.kind === 'photo' ? (
            <div className="sheet__slot sheet__slot--photo" key={cell.photo.slug}>
              <Polaroid
                photo={cell.photo}
                tilt={cell.tilt}
                withImage={withImages}
                onOpen={() => onOpen(cell.photo.slug)}
              />
            </div>
          ) : (
            <div className="sheet__slot sheet__slot--keepsake" key={`keepsake-${i}`}>
              <Keepsake name={cell.name} lean={i} />
            </div>
          ),
        )}
      </div>
    </div>
  )
}

type Cell =
  | { kind: 'photo'; photo: ScrapbookPhoto; tilt: number }
  | { kind: 'keepsake'; name: KeepsakeName }

/** The ones on paper, which carry enough weight to anchor a corner. */
const PASTED: KeepsakeName[] = ['ticket', 'stamp', 'note']

/** Pen marks, for the corners that only want a light touch. */
const DRAWN: KeepsakeName[] = ['sprig', 'paw', 'arrow', 'pin', 'sparkle', 'heart']

/**
 * The first keepsake on a page is always one on paper, so every page has
 * something with substance on it; the rest are pen marks, which would look thin
 * on their own. Both lists are walked by page number, so no two pages in a row
 * repeat themselves and the choice is the same on every render.
 */
function keepsakeFor(page: number, nth: number): KeepsakeName {
  return nth === 0
    ? PASTED[page % PASTED.length]
    : DRAWN[(page * 2 + nth - 1) % DRAWN.length]
}

/**
 * The four quarters of a page, in reading order: top-left, top-right,
 * bottom-left, bottom-right.
 *
 * Photos take a diagonal pair, alternating which diagonal from page to page.
 * Keepsakes fill whatever is left over — both of the other corners, and any
 * photo slot that has no photo, which is what keeps a last page holding a single
 * photo from sitting three-quarters empty.
 */
function pageCells(page: { photos: ScrapbookPhoto[]; index: number }): Cell[] {
  const onMainDiagonal = page.index % 2 === 0
  const photoQuadrants = onMainDiagonal ? [0, 3] : [1, 2]

  let placed = 0
  let filled = 0

  return [0, 1, 2, 3].map((quadrant): Cell => {
    const photo = photoQuadrants.includes(quadrant) ? page.photos[placed] : undefined

    if (photo) {
      const tilt = (page.index * scrapbook.perPage + placed) % 4
      placed += 1
      return { kind: 'photo', photo, tilt }
    }

    return { kind: 'keepsake', name: keepsakeFor(page.index, filled++) }
  })
}

function Polaroid({
  photo,
  tilt,
  withImage,
  onOpen,
}: {
  photo: ScrapbookPhoto
  tilt: number
  withImage: boolean
  onOpen: () => void
}) {
  const image = scrapbookImages[photo.slug]

  return (
    <figure className="polaroid" data-tilt={tilt}>
      <div className="polaroid__inner">
        {image ? (
          <button type="button" className="polaroid__shot" onClick={onOpen}>
            {withImage ? (
              <img
                src={`/images/scrapbook/${photo.slug}-${image.widths[0]}.webp`}
                srcSet={image.widths
                  .map((w) => `/images/scrapbook/${photo.slug}-${w}.webp ${w}w`)
                  .join(', ')}
                sizes={SIZES}
                width={image.width}
                height={image.height}
                alt={photo.alt}
                loading="lazy"
                decoding="async"
              />
            ) : (
              <span className="polaroid__pending" />
            )}
          </button>
        ) : (
          <div className="polaroid__shot polaroid__shot--empty" aria-hidden="true">
            <span className="sans-caps">{scrapbook.emptyLabel}</span>
          </div>
        )}

        <figcaption className="polaroid__caption">
          <span className="polaroid__text hand">{photo.caption}</span>
          {photo.date ? <span className="polaroid__date hand">{photo.date}</span> : null}
        </figcaption>
      </div>
    </figure>
  )
}

/**
 * Larger view of a photo. Built on a native dialog so focus trapping, the
 * backdrop and dismissing with Escape come from the browser rather than being
 * reimplemented.
 */
function Lightbox({
  photos,
  openSlug,
  onChange,
}: {
  photos: ScrapbookPhoto[]
  openSlug: string | null
  onChange: (slug: string | null) => void
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const index = photos.findIndex((p) => p.slug === openSlug)
  const photo = index >= 0 ? photos[index] : null

  const step = useCallback(
    (by: number) => {
      if (photos.length === 0 || index < 0) return
      const next = (index + by + photos.length) % photos.length
      onChange(photos[next].slug)
    },
    [index, photos, onChange],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (photo && !dialog.open) dialog.showModal()
    if (!photo && dialog.open) dialog.close()
  }, [photo])

  useEffect(() => {
    if (!photo) return

    function onKey(event: KeyboardEvent) {
      if (event.key === 'ArrowRight') step(1)
      if (event.key === 'ArrowLeft') step(-1)
    }

    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photo, step])

  const image = photo ? scrapbookImages[photo.slug] : undefined

  return (
    <dialog
      className="lightbox"
      ref={dialogRef}
      onClose={() => onChange(null)}
      // A click landing on the dialog itself is a click on the backdrop, since
      // the content sits in a child element.
      onClick={(event) => {
        if (event.target === dialogRef.current) onChange(null)
      }}
    >
      {photo && image ? (
        <figure className="lightbox__figure">
          <img
            className="lightbox__image"
            src={`/images/scrapbook/${photo.slug}-${image.widths.at(-1)}.webp`}
            width={image.width}
            height={image.height}
            alt={photo.alt}
          />
          <figcaption className="lightbox__caption hand">
            {photo.caption}
            {photo.date ? <span className="lightbox__date"> · {photo.date}</span> : null}
          </figcaption>
        </figure>
      ) : null}

      <button
        type="button"
        className="lightbox__button lightbox__button--close"
        onClick={() => onChange(null)}
        aria-label="Close photo"
      >
        ×
      </button>

      {photos.length > 1 ? (
        <>
          <button
            type="button"
            className="lightbox__button lightbox__button--prev"
            onClick={() => step(-1)}
            aria-label="Previous photo"
          >
            ‹
          </button>
          <button
            type="button"
            className="lightbox__button lightbox__button--next"
            onClick={() => step(1)}
            aria-label="Next photo"
          >
            ›
          </button>
        </>
      ) : null}
    </dialog>
  )
}

/**
 * Splits the photos into pages, then makes sure the closing page is both last
 * and on the back of a leaf, so a spread never ends on a blank sheet.
 */
function buildPages(): Page[] {
  const pages: Page[] = []

  for (let i = 0; i < scrapbook.photos.length; i += scrapbook.perPage) {
    pages.push({
      kind: 'photos',
      photos: scrapbook.photos.slice(i, i + scrapbook.perPage),
      index: pages.length,
    })
  }

  if ((pages.length + 1) % 2 !== 0) pages.push({ kind: 'blank' })
  pages.push({ kind: 'closing' })

  return pages
}

function buildLeaves(pages: Page[], twoUp: boolean): Leaf[] {
  if (!twoUp) return pages.map((page) => ({ front: page, back: null }))

  const leaves: Leaf[] = []
  for (let i = 0; i < pages.length; i += 2) {
    leaves.push({ front: pages[i], back: pages[i + 1] ?? null })
  }
  return leaves
}
