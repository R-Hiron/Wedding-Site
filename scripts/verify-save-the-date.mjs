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

/** How much of the card the mask is currently letting through, roughly. */
const revealed = (page) =>
  page.evaluate(() => {
    const rect = (sel) => document.querySelector(sel)
    const art = rect('.stod__wipe--art')
    const script = rect('.stod__wipe--script')
    const rest = rect('.stod__wipe--rest')
    const corner = rect('.stod__wipe--corner')
    const op = (el) => (el ? Number(getComputedStyle(el).opacity) : -1)
    return {
      artHeight: art ? Number(art.getAttribute('height')) : -1,
      scriptWidth: script ? Number(script.getAttribute('width')) : -1,
      cornerOpacity: op(corner),
      restOpacity: op(rest),
      corners: [...document.querySelectorAll('.stod__wipe--corner')].map(op),
    }
  })

/** Everything open: the finished card, or the state when nothing animates. */
const isFullyOpen = (s) =>
  s.artHeight === 474 && s.scriptWidth === 502 && s.restOpacity === 1 && s.corners.every((o) => o === 1)

// --- The card draws itself on a first visit -----------------------------------
const page = await browser.newPage()
await page.setViewport({ width: 900, height: 1100 })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.stod__wipe--art')

const art = await page.evaluate(() => {
  const image = document.querySelector('.stod image')
  const svg = document.querySelector('.stod__svg')
  return {
    href: image?.getAttribute('href') ?? '',
    masked: image?.getAttribute('mask') ?? '',
    label: svg?.getAttribute('aria-label') ?? '',
    role: svg?.getAttribute('role') ?? '',
  }
})
check('the card uses the transparent artwork', art.href.endsWith('.webp'), art.href)
check('the artwork is revealed through a mask', art.masked.includes('stod-mask'))
check('the card is described for screen readers', art.role === 'img' && art.label.length > 20)

// Sample the whole sequence in the browser, so timings are not distorted by
// the cost of driving it from outside.
const series = await page.evaluate(
  () =>
    new Promise((resolve) => {
      const out = []
      const t0 = performance.now()
      const num = (sel, attr) => Number(document.querySelector(sel)?.getAttribute(attr) ?? -1)
      const op = (sel) => Number(getComputedStyle(document.querySelector(sel)).opacity)
      function read() {
        out.push({
          t: performance.now() - t0,
          artH: num('.stod__wipe--art', 'height'),
          scriptW: num('.stod__wipe--script', 'width'),
          corner: op('.stod__wipe--corner'),
          rest: op('.stod__wipe--rest'),
        })
        if (performance.now() - t0 < 4000) requestAnimationFrame(read)
        else resolve(out)
      }
      read()
    }),
)

const first = series[0]
check(
  'the card starts hidden',
  first.artH < 10 && first.scriptW < 10 && first.rest < 0.05,
  `art ${first.artH}, script ${first.scriptW}`,
)

const startOf = (key, threshold) => series.find((s) => s[key] > threshold)?.t ?? Infinity
const endOf = (key, target) => series.find((s) => s[key] >= target - 0.02)?.t ?? Infinity

const artStart = startOf('artH', 5)
const artEnd = endOf('artH', 474)
const cornerStart = startOf('corner', 0.05)
const scriptStart = startOf('scriptW', 5)
const scriptEnd = endOf('scriptW', 502)
const restStart = startOf('rest', 0.05)
const restEnd = endOf('rest', 1)

check('the illustration draws first', artStart < cornerStart, `${Math.round(artStart)}ms`)
check('the corners follow the illustration', cornerStart > artStart && cornerStart < scriptStart, `${Math.round(cornerStart)}ms`)
check('the handwritten line comes after the corners', scriptStart > cornerStart, `${Math.round(scriptStart)}ms`)
check('the remaining text comes last', restStart > scriptStart, `${Math.round(restStart)}ms`)

// The illustration must rise at a pace that can actually be watched.
const midArt = series.find((s) => s.artH > 200 && s.artH < 300)
check('the illustration is caught part-drawn', !!midArt, midArt ? `${Math.round(midArt.t)}ms` : 'never')
const midScript = series.find((s) => s.scriptW > 120 && s.scriptW < 400)
check('the handwriting is caught part-written', !!midScript, midScript ? `${Math.round(midScript.t)}ms` : 'never')

check('the whole card is drawn by the end', isFullyOpen(await revealed(page)))
check(
  'the sequence is brisk rather than tedious',
  restEnd < 3600,
  `${Math.round(restEnd)}ms total`,
)
check('nothing is left hidden', artEnd < Infinity && scriptEnd < Infinity && restEnd < Infinity)

// --- Later navigation in the same session should not redraw -------------------
await page.goto(`${BASE}faq`, { waitUntil: 'networkidle0' })
await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.waitForSelector('.stod__wipe--art')
await new Promise((r) => setTimeout(r, 350))
const second = await revealed(page)
check('the card does not redraw later in the same session', isFullyOpen(second), JSON.stringify(second))

// --- Replaying the invitation should redraw it --------------------------------
await page.evaluate(() => {
  const button = [...document.querySelectorAll('button')].find((b) =>
    /replay/i.test(b.textContent ?? ''),
  )
  button?.click()
})
await new Promise((r) => setTimeout(r, 400))
const introShowing = await page.$('.envelope-intro')
check('the replay control reopens the envelope', !!introShowing)

if (introShowing) {
  // Skip to the end of the intro by clicking through it.
  await page.waitForFunction(
    () => document.querySelector('.envelope-intro')?.classList.contains('is-closed'),
    { timeout: 9000 },
  )
  await page.click('.envelope-intro')
  await page.waitForFunction(() => !document.querySelector('.envelope-intro'), { timeout: 9000 })
  await new Promise((r) => setTimeout(r, 250))
  const afterReplay = await revealed(page)
  check(
    'the card redraws after a replay',
    afterReplay.artHeight < 474 || afterReplay.restOpacity < 1,
    JSON.stringify(afterReplay),
  )
}

// --- Reduced motion ----------------------------------------------------------
const rm = await browser.newPage()
await rm.setViewport({ width: 900, height: 1100 })
await rm.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
await rm.goto(BASE, { waitUntil: 'domcontentloaded' })
await rm.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
await rm.goto(BASE, { waitUntil: 'domcontentloaded' })
await rm.waitForSelector('.stod__wipe--art')
const rmState = await revealed(rm)
check('reduced motion shows the finished card straight away', isFullyOpen(rmState), JSON.stringify(rmState))

await browser.close()

const failed = results.filter((r) => !r.pass).length
console.log(`\n${results.length - failed}/${results.length} checks passed`)
process.exit(failed ? 1 : 0)
