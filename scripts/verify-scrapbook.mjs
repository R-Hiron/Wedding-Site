import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.SITE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, detail = '') {
  results.push({ pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--force-device-scale-factor=1'],
})

/** Loads the home page with the envelope intro already dismissed. */
async function openHome(page, selector) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector(selector)
}

// The scrapbook is behind a visibility flag, so say so plainly rather than
// failing in a way that looks like a broken feature.
{
  const probe = await browser.newPage()
  await probe.goto(BASE, { waitUntil: 'domcontentloaded' })
  await probe.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
  await probe.goto(BASE, { waitUntil: 'networkidle0' })
  const present = await probe.$('.scrapbook')
  await probe.close()
  if (!present) {
    console.log('Scrapbook is hidden. Set visibility.showScrapbook to true to verify it.')
    await browser.close()
    process.exit(0)
  }
}

/** Moves to a fraction of the pinned book's scroll range. */
async function toProgress(page, fraction) {
  await page.evaluate((f) => {
    const spacer = document.querySelector('.scrapbook__stage').closest('.pin-spacer')
    const start = spacer.getBoundingClientRect().top + window.scrollY
    const range = spacer.offsetHeight - window.innerHeight
    window.scrollTo({ top: start + f * range, behavior: 'instant' })
  }, fraction)
  await new Promise((r) => setTimeout(r, 220))
}

/**
 * Which page is actually facing the reader. Only the outermost sheet of each
 * stack is visible, so a page counts as shown when its leaf is on top of its
 * side of the book.
 */
const bookState = (page) =>
  page.evaluate(() => {
    const leaves = [...document.querySelectorAll('.leaf')]
    const angles = leaves.map((el) => {
      const match = /rotateY\((-?[\d.]+)deg\)/.exec(el.style.transform || '')
      return match ? parseFloat(match[1]) : 0
    })

    const label = (leaf, face) => {
      const el = leaf.querySelector(`.leaf__face--${face} .sheet`)
      if (!el) return null
      if (el.classList.contains('sheet--blank')) return 'blank'
      if (el.classList.contains('sheet--closing')) return 'closing'
      return [...el.querySelectorAll('.polaroid__text')].map((n) => n.textContent).join(' | ')
    }

    const unturned = angles.findIndex((a) => a > -90)
    let turned = -1
    angles.forEach((a, i) => {
      if (a <= -90) turned = i
    })

    return {
      angles,
      right: unturned >= 0 ? label(leaves[unturned], 'front') : null,
      left: turned >= 0 ? label(leaves[turned], 'back') : null,
      turn: parseFloat(
        document.querySelector('.book__dot.is-current')?.getAttribute('aria-label') ?? '0',
      ),
      dots: document.querySelectorAll('.book__dot').length,
      prevDisabled: document.querySelector('.book__arrow:first-of-type')?.disabled,
      nextDisabled: document.querySelector('.book__controls .book__arrow:last-of-type')?.disabled,
      loadedImages: document.querySelectorAll('.polaroid__shot img').length,
      pendingImages: document.querySelectorAll('.polaroid__pending').length,
    }
  })

/**
 * The photos the site has been given, read from the page rather than hardcoded,
 * so this keeps working as the real photos replace the placeholders.
 */
const captionsInOrder = (page) =>
  page.evaluate(() => [...document.querySelectorAll('.polaroid__text')].map((n) => n.textContent))

// --- Desktop: the book as a spread -------------------------------------------
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 900 })
await openHome(page, '.book')

const spread = await page.evaluate(() => {
  const book = document.querySelector('.book')
  const cover = document.querySelector('.book__cover')
  const bookBox = book.getBoundingClientRect()
  const coverBox = cover?.getBoundingClientRect()
  const left = document.querySelector('.book__paper--left').getBoundingClientRect()
  const right = document.querySelector('.book__paper--right').getBoundingClientRect()
  return {
    spread: book.classList.contains('book--spread'),
    hasSpine: getComputedStyle(document.querySelector('.book__spine')).display !== 'none',
    pinned: !!document.querySelector('.scrapbook__stage').closest('.pin-spacer'),
    // The binding has to sit outside the pages on every side to read as a cover.
    bindingShows: coverBox
      ? coverBox.left < bookBox.left && coverBox.right > bookBox.right && coverBox.top < bookBox.top
      : false,
    gutter: Math.round(right.left - left.right),
    halvesMatch: Math.abs(left.width - right.width) < 1,
  }
})
check('wide screens show two facing pages', spread.spread)
check('the spread has a spine down the middle', spread.hasSpine)
check('the book is pinned so pages can turn on scroll', spread.pinned)
check('a leather binding wraps the outside of the pages', spread.bindingShows)
check('leather shows in the gutter between the pages', spread.gutter > 2, `${spread.gutter}px`)
check('the two page blocks are the same width', spread.halvesMatch)

await toProgress(page, 0)
const atStart = await bookState(page)
const allCaptions = await captionsInOrder(page)
check(
  'the book opens on the first photo in the list',
  atStart.right?.includes(allCaptions[0]),
  `${atStart.right} (expected to include "${allCaptions[0]}")`,
)
check('nothing has turned to the left yet', atStart.left === null, String(atStart.left))
check('previous is disabled on the first page', atStart.prevDisabled === true)
check('next is available on the first page', atStart.nextDisabled === false)

// Anything that needs actual image files is skipped when none have been
// processed yet, so this stays useful before the real photos arrive.
const hasImages = atStart.loadedImages + atStart.pendingImages > 0
if (!hasImages) {
  console.log('\nNo processed photos found — skipping image and lightbox checks.')
  console.log('Add photos to photos/ and run `npm run art:photos` to cover those.\n')
}

if (hasImages) {
  // Only nearby photos should have been given a src this early on.
  check(
    'photos load as the reader approaches rather than all at once',
    atStart.pendingImages > 0,
    `${atStart.loadedImages} loaded, ${atStart.pendingImages} waiting`,
  )
}

// --- Pages turn continuously with scroll -------------------------------------
const samples = []
for (let i = 0; i <= 20; i++) {
  await toProgress(page, i / 20)
  samples.push(await bookState(page))
}

const firstAngles = samples.map((s) => s.angles[0])
check(
  'the first sheet turns steadily rather than jumping',
  firstAngles.every((a, i) => i === 0 || a <= firstAngles[i - 1] + 0.5),
  `${firstAngles[0]}deg → ${firstAngles.at(-1)}deg`,
)
check('sheets turn a full half circle', firstAngles.at(-1) <= -179, `${firstAngles.at(-1)}deg`)

const partial = samples.some((s) => s.angles.some((a) => a < -5 && a > -175))
check('the turn is visible mid-flight, not snapped', partial)

// Turning back has to undo it, since the scroll position drives everything.
await toProgress(page, 0)
const returned = await bookState(page)
check('scrolling back closes the pages again', returned.angles.every((a) => a > -1), returned.angles.join(','))

// --- Every page is reachable --------------------------------------------------
const seen = new Set()
for (const s of samples) {
  if (s.right) seen.add(s.right)
  if (s.left) seen.add(s.left)
}
const unseen = allCaptions.filter((c) => ![...seen].some((label) => label?.includes(c)))
check('every photo becomes visible while scrolling through', unseen.length === 0, unseen.join(', '))
check('the book ends on the closing page', [...seen].includes('closing'))

// --- Controls ----------------------------------------------------------------
await toProgress(page, 0)
check('there is one dot per page turn', (await bookState(page)).dots >= 2)

await page.evaluate(() => document.querySelectorAll('.book__dot')[1].click())
await new Promise((r) => setTimeout(r, 900))
const afterDot = await bookState(page)
check('clicking a dot turns to that page', afterDot.angles[0] <= -179, afterDot.angles.join(','))

await page.evaluate(() => {
  const arrows = document.querySelectorAll('.book__controls .book__arrow')
  arrows[0].click()
})
await new Promise((r) => setTimeout(r, 900))
check('the back arrow returns to the previous page', (await bookState(page)).angles[0] > -1)

await toProgress(page, 1)
const atEnd = await bookState(page)
check('next is disabled on the last page', atEnd.nextDisabled === true)
if (hasImages) {
  check('all photos have loaded by the end', atEnd.pendingImages === 0)
}

// --- Pages stay inside their sheet -------------------------------------------
// Checked on the flat rendering, where no page is mid-turn and every page can be
// measured at once.
const flat = await browser.newPage()
await flat.setViewport({ width: 1280, height: 900 })
await flat.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await openHome(flat, '.scrapbook__flat')

const layout = await flat.evaluate(() => {
  const pages = [...document.querySelectorAll('.sheet')]
  return pages.map((pageEl) => {
    const pageBox = pageEl.getBoundingClientRect()

    const place = (el) => {
      const box = el.getBoundingClientRect()
      return {
        inside:
          box.left >= pageBox.left - 1 &&
          box.right <= pageBox.right + 1 &&
          box.top >= pageBox.top - 1 &&
          box.bottom <= pageBox.bottom + 1,
        drawn: box.width > 4 && box.height > 4,
        quadrant:
          (box.top + box.height / 2 < pageBox.top + pageBox.height / 2 ? 'top' : 'bottom') +
          '-' +
          (box.left + box.width / 2 < pageBox.left + pageBox.width / 2 ? 'left' : 'right'),
      }
    }

    const prints = [...pageEl.querySelectorAll('.polaroid__inner')].map(place)
    const keepsakes = [...pageEl.querySelectorAll('.sheet__slot--keepsake .keepsake')].map(
      (el) => ({
        ...place(el),
        name: [...el.classList].find((c) => c.startsWith('keepsake--') && c !== 'keepsake--paper'),
      }),
    )

    return {
      count: prints.length,
      prints,
      keepsakes,
      quarters: pageEl.querySelectorAll('.sheet__slot').length,
    }
  })
})

const photoPages = layout.filter((p) => p.count > 0)
check(
  'no print spills outside its page',
  photoPages.every((p) => p.prints.every((print) => print.inside)),
)
check(
  'every photo in the list is on a page',
  photoPages.reduce((total, p) => total + p.count, 0) === allCaptions.length,
  `${photoPages.reduce((total, p) => total + p.count, 0)} of ${allCaptions.length}`,
)
check(
  'no page holds more photos than it should',
  photoPages.every((p) => p.count <= 2),
  photoPages.map((p) => p.count).join(','),
)

const opposite = { 'top-left': 'bottom-right', 'top-right': 'bottom-left' }
check(
  'photos sit in diagonally opposite quadrants',
  photoPages
    .filter((p) => p.count === 2)
    .every((p) => {
      const [a, b] = p.prints.map((print) => print.quadrant)
      return opposite[a] === b || opposite[b] === a
    }),
  photoPages.map((p) => p.prints.map((x) => x.quadrant).join('/')).join(' '),
)

// --- Keepsakes fill the corners with no photo in them ------------------------
check(
  'every page is divided into four quarters',
  photoPages.every((p) => p.quarters === 4),
  photoPages.map((p) => p.quarters).join(','),
)
check(
  'every quarter with no photo has a keepsake instead',
  photoPages.every((p) => p.keepsakes.length === p.quarters - p.count),
  photoPages.map((p) => `${p.count} photos + ${p.keepsakes.length} keepsakes`).join(', '),
)
check(
  'keepsakes are actually drawn, not collapsed',
  photoPages.every((p) => p.keepsakes.every((k) => k.drawn)),
)
check(
  'keepsakes stay inside their page',
  photoPages.every((p) => p.keepsakes.every((k) => k.inside)),
)
check(
  'no keepsake is repeated on the same page',
  photoPages.every((p) => new Set(p.keepsakes.map((k) => k.name)).size === p.keepsakes.length),
  photoPages.map((p) => p.keepsakes.map((k) => k.name?.replace('keepsake--', '')).join('+')).join(' | '),
)
// A page of two photos and two pen marks still reads as empty, so each page
// gets one keepsake on paper to give it some weight.
check(
  'every page has a keepsake with some substance to it',
  photoPages.every((p) =>
    p.keepsakes.some((k) => ['ticket', 'stamp', 'note'].includes(k.name?.replace('keepsake--', ''))),
  ),
)

// --- Reduced motion ----------------------------------------------------------
const rmState = await flat.evaluate(() => ({
  hasBook: !!document.querySelector('.book'),
  pinned: !!document.querySelector('.scrapbook .pin-spacer'),
  photos: document.querySelectorAll('.polaroid__shot img').length,
  // Frames that have an image behind them, as opposed to a placeholder.
  frames: document.querySelectorAll('button.polaroid__shot').length,
  visible: [...document.querySelectorAll('.polaroid__inner')].every(
    (el) => el.getBoundingClientRect().width > 0,
  ),
}))
check('reduced motion replaces the book with plain pages', !rmState.hasBook)
check('reduced motion does not pin the page', !rmState.pinned)
check('reduced motion pages are laid out, not collapsed', rmState.visible)
if (hasImages) {
  check(
    'reduced motion shows every photo at once',
    rmState.photos === rmState.frames,
    `${rmState.photos} of ${rmState.frames} frames filled`,
  )
}

// --- Lightbox ----------------------------------------------------------------
if (hasImages) {
await toProgress(page, 0)
await page.evaluate(() => {
  // The first frame with a photo behind it, since an empty frame is not a button.
  document.querySelector('.leaf__face--front button.polaroid__shot').click()
})
await new Promise((r) => setTimeout(r, 300))

const lightbox = () =>
  page.evaluate(() => {
    const dialog = document.querySelector('.lightbox')
    const img = dialog.querySelector('.lightbox__image')
    const src = img?.getAttribute('src') ?? ''

    // Which sizes exist for this photo, read off the frame's own srcset. A
    // small original is never upscaled, so the largest available size differs
    // from photo to photo and cannot be hardcoded.
    const slug = src.split('/').pop()?.replace(/-\d+\.webp$/, '') ?? ''
    const thumb = [...document.querySelectorAll('.polaroid__shot img')].find((el) =>
      el.getAttribute('src')?.includes(`/${slug}-`),
    )
    const widths = (thumb?.getAttribute('srcset') ?? '')
      .split(',')
      .map((part) => parseInt(part.trim().split(' ')[1], 10))
      .filter(Number.isFinite)

    return {
      open: dialog.open,
      modal: !!dialog.matches(':modal'),
      src,
      largest: widths.length ? Math.max(...widths) : null,
      fit: img ? getComputedStyle(img).objectFit : '',
      caption: dialog.querySelector('.lightbox__caption')?.innerText ?? '',
    }
  })

const opened = await lightbox()
check('tapping a photo opens the lightbox', opened.open && opened.modal)
check(
  'the lightbox shows the largest size that photo has',
  !!opened.largest && opened.src.includes(`-${opened.largest}.webp`),
  `${opened.src.split('/').pop()}, largest available ${opened.largest}`,
)
check('the lightbox shows the whole photo uncropped', opened.fit === 'contain', opened.fit)
check('the lightbox shows the caption', opened.caption.length > 0, opened.caption)

await page.keyboard.press('ArrowRight')
await new Promise((r) => setTimeout(r, 220))
check('arrow keys move between photos', (await lightbox()).src !== opened.src)

await page.keyboard.press('Escape')
await new Promise((r) => setTimeout(r, 260))
check('escape closes the lightbox', !(await lightbox()).open)
}

// --- Mobile: one page at a time ----------------------------------------------
const mobile = await browser.newPage()
await mobile.setViewport({ width: 400, height: 800 })
await openHome(mobile, '.book')

const mobileState = await mobile.evaluate(() => {
  const book = document.querySelector('.book')
  const first = document.querySelector('.leaf__face--front')
  return {
    single: book.classList.contains('book--single'),
    spineHidden: getComputedStyle(document.querySelector('.book__spine')).display === 'none',
    inside: book.getBoundingClientRect().left >= 0 && book.getBoundingClientRect().right <= 400,
    printsPerPage: first.querySelectorAll('.sheet__slot--photo').length,
    keepsakesPerPage: first.querySelectorAll('.sheet__slot--keepsake').length,
  }
})
check('phones show a single page', mobileState.single)
check('phones hide the spine', mobileState.spineHidden)
check('the book fits the phone screen', mobileState.inside)
check('phones still show two photos per page', mobileState.printsPerPage === 2)
check(
  'phones get the keepsakes too',
  mobileState.keepsakesPerPage === 2,
  `${mobileState.keepsakesPerPage} on the first page`,
)

await toProgress(mobile, 0.4)
const mobileTurned = await bookState(mobile)
check('phone pages turn on scroll', mobileTurned.angles.some((a) => a < -1), mobileTurned.angles.join(','))

await browser.close()

const failed = results.filter((r) => !r.pass).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
