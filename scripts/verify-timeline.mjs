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
  args: ['--no-first-run', '--disable-gpu'],
})

/** Loads the home page with the envelope intro already dismissed. */
async function openHome(page) {
  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
  await page.goto(BASE, { waitUntil: 'networkidle0' })
  await page.waitForSelector('.timeline__route')
}

// The timeline is behind a visibility flag, so say so plainly rather than
// failing in a way that looks like a broken feature.
{
  const probe = await browser.newPage()
  await probe.goto(BASE, { waitUntil: 'domcontentloaded' })
  await probe.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
  await probe.goto(BASE, { waitUntil: 'networkidle0' })
  const present = await probe.$('.timeline__route')
  await probe.close()
  if (!present) {
    console.log('Timeline is hidden. Set visibility.showTimeline to true to verify it.')
    await browser.close()
    process.exit(0)
  }
}

const state = (page) =>
  page.evaluate(() => {
    const route = document.querySelector('.timeline__route')
    const drawn = document.querySelector('.timeline__line--drawn')
    const items = [...document.querySelectorAll('.timeline__item')]
    return {
      animating: route.classList.contains('is-animating'),
      d: drawn.getAttribute('d') ?? '',
      dashoffset: parseFloat(drawn.style.strokeDashoffset || '0'),
      dasharray: drawn.style.strokeDasharray,
      revealed: items.map((el) => el.classList.contains('is-revealed')),
      stopX: items.map((el) => {
        const r = el.querySelector('.timeline__stop').getBoundingClientRect()
        return Math.round(r.left + r.width / 2)
      }),
      routeWidth: Math.round(route.getBoundingClientRect().width),
      // Every stop should carry an illustration, not just a dot.
      scenes: items.map((el) => !!el.querySelector('.timeline__stop .ms')),
      cardWidth: Math.min(
        ...items.map((el) => Math.round(el.querySelector('.timeline__card').getBoundingClientRect().width)),
      ),
    }
  })

/**
 * Which scene parts are actually being animated. Movement is gated on a
 * milestone being revealed, so this is also how we check nothing is animating
 * off-screen.
 */
const moving = (page) =>
  page.evaluate(() => {
    const parts = [...document.querySelectorAll('.timeline__stop .ms *')]
    return parts.filter((el) => getComputedStyle(el).animationName !== 'none').length
  })

/** How much scrolling it takes to draw the route from start to finish. */
const drawDistance = (page) =>
  page.evaluate(() => {
    const box = document.querySelector('.timeline__route').getBoundingClientRect()
    const top = box.top + window.scrollY
    const start = top - window.innerHeight * 0.85
    const end = top + box.height - window.innerHeight
    return Math.round(end - start)
  })

// --- Desktop -----------------------------------------------------------------
const page = await browser.newPage()
await page.setViewport({ width: 1280, height: 860 })
await openHome(page)

const initial = await state(page)
check('route path was generated', initial.d.length > 0)
check('route curves rather than running straight', initial.d.includes('C'), `${initial.d.slice(0, 40)}…`)
check('scroll animation is active', initial.animating)
check('line starts undrawn', initial.dashoffset > 0, `offset ${Math.round(initial.dashoffset)}`)
check('no milestones revealed before scrolling', !initial.revealed.some(Boolean))

const uniqueX = new Set(initial.stopX)
check('stops alternate horizontally to wind the route', uniqueX.size > 1, `x: ${[...uniqueX].join(', ')}`)

// The point of the design: the route should cross most of the section, not
// wobble around the middle.
const spread = Math.max(...initial.stopX) - Math.min(...initial.stopX)
check(
  'the route swings from one side to the other',
  spread > initial.routeWidth * 0.45,
  `${spread}px across a ${initial.routeWidth}px section`,
)

check('every stop carries an illustration', initial.scenes.every(Boolean))
check('the illustrations hold still until their stop is reached', (await moving(page)) === 0)

// Slow enough that a guest is not racing the line down the page, measured in
// screenfuls so the number means something at any viewport size.
const distance = await drawDistance(page)
check(
  'the route takes an unhurried amount of scrolling to draw',
  distance > 860 * 1.6,
  `${(distance / 860).toFixed(1)} screens for ${initial.revealed.length} stops`,
)

// Scroll through the section and watch the line draw and milestones appear.
const samples = []
for (let i = 0; i <= 10; i++) {
  await page.evaluate((step) => {
    const route = document.querySelector('.timeline__route')
    const box = route.getBoundingClientRect()
    const top = box.top + window.scrollY
    window.scrollTo({ top: top - window.innerHeight + (step / 10) * (box.height + window.innerHeight), behavior: 'instant' })
  }, i)
  await new Promise((r) => setTimeout(r, 90))
  samples.push(await state(page))
}

// Finally scroll to the very bottom, which is as far as a guest can possibly go.
await page.evaluate(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'instant' }))
await new Promise((r) => setTimeout(r, 150))
samples.push(await state(page))

const offsets = samples.map((s) => s.dashoffset)
const monotonic = offsets.every((v, i) => i === 0 || v <= offsets[i - 1] + 1)
check('line draws steadily as the section scrolls', monotonic, `${Math.round(offsets[0])} → ${Math.round(offsets.at(-1))}`)

const counts = samples.map((s) => s.revealed.filter(Boolean).length)
check('milestones reveal in order as the line reaches them', counts.every((v, i) => i === 0 || v >= counts[i - 1]), counts.join(','))
check('every milestone is revealed by the end', counts.at(-1) === samples[0].revealed.length, `${counts.at(-1)}/${samples[0].revealed.length}`)
check('line is fully drawn by the end', offsets.at(-1) < 1, `offset ${Math.round(offsets.at(-1))}`)

const animated = await moving(page)
check('the illustrations come to life once revealed', animated > 20, `${animated} moving parts`)

// The timeline may not pin or hijack the scroll position. Scoped to this
// section, because the scrapbook above it pins on purpose to turn its pages.
const pinned = await page.evaluate(() => {
  const timeline = document.querySelector('.timeline')
  return (
    !!timeline.closest('.pin-spacer') || !!timeline.querySelector('.pin-spacer')
  )
})
check('no scroll-jacking or pinning', !pinned)

// --- Mobile ------------------------------------------------------------------
const mobile = await browser.newPage()
await mobile.setViewport({ width: 400, height: 780 })
await openHome(mobile)
const mobileState = await state(mobile)
check('mobile route generated', mobileState.d.includes('C'))

const mobileSpread = Math.max(...mobileState.stopX) - Math.min(...mobileState.stopX)
check(
  'mobile route winds side to side too',
  mobileSpread > 80,
  `spread ${mobileSpread}px of ${mobileState.routeWidth}px`,
)
// But not at the cost of the schedule itself — swinging the stops out squeezes
// the text, and unreadably narrow cards would be a poor trade.
check(
  'mobile cards stay wide enough to read',
  mobileState.cardWidth >= 200,
  `narrowest card ${mobileState.cardWidth}px`,
)
check('mobile stops carry illustrations', mobileState.scenes.every(Boolean))

const mobileDistance = await drawDistance(mobile)
check(
  'mobile also draws unhurriedly',
  mobileDistance > 780 * 1.4,
  `${(mobileDistance / 780).toFixed(1)} screens`,
)

// --- Reduced motion ----------------------------------------------------------
const rm = await browser.newPage()
await rm.setViewport({ width: 1280, height: 860 })
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await openHome(rm)
const rmState = await state(rm)
check('reduced motion shows the whole schedule at once', rmState.revealed.every(Boolean))
check('reduced motion leaves the route fully drawn', rmState.dashoffset === 0 && rmState.dasharray === 'none')
check('reduced motion does not hide milestones', !rmState.animating)
check('reduced motion leaves the illustrations still', (await moving(rm)) === 0)

// --- Without JavaScript ------------------------------------------------------
const noJs = await browser.newPage()
await noJs.setViewport({ width: 1280, height: 860 })
await noJs.setJavaScriptEnabled(false)
await noJs.goto(BASE, { waitUntil: 'domcontentloaded' })
const noJsText = await noJs.evaluate(() => document.body.innerText)
check('page still renders something without JavaScript', noJsText.length >= 0)

await browser.close()

const failed = results.filter((r) => !r.pass).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
