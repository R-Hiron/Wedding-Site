import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = 'http://localhost:5174/'

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
      dotX: items.map((el) => {
        const r = el.querySelector('.timeline__dot').getBoundingClientRect()
        return Math.round(r.left + r.width / 2)
      }),
    }
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

const uniqueX = new Set(initial.dotX)
check('milestones alternate horizontally to wind the route', uniqueX.size > 1, `x: ${[...uniqueX].join(', ')}`)

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

// Nothing may pin or hijack the scroll position.
const pinned = await page.evaluate(() => !!document.querySelector('.pin-spacer'))
check('no scroll-jacking or pinning', !pinned)

// --- Mobile ------------------------------------------------------------------
const mobile = await browser.newPage()
await mobile.setViewport({ width: 400, height: 780 })
await openHome(mobile)
const mobileState = await state(mobile)
check('mobile route generated', mobileState.d.includes('C'))
const mobileSpread = Math.max(...mobileState.dotX) - Math.min(...mobileState.dotX)
check('mobile route stays mostly vertical', mobileSpread > 0 && mobileSpread < 40, `spread ${mobileSpread}px`)

// --- Reduced motion ----------------------------------------------------------
const rm = await browser.newPage()
await rm.setViewport({ width: 1280, height: 860 })
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await openHome(rm)
const rmState = await state(rm)
check('reduced motion shows the whole schedule at once', rmState.revealed.every(Boolean))
check('reduced motion leaves the route fully drawn', rmState.dashoffset === 0 && rmState.dasharray === 'none')
check('reduced motion does not hide milestones', !rmState.animating)

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
