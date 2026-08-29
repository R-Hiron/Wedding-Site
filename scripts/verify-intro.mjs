import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.SITE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, detail = '') {
  results.push({ name, pass, detail })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu'],
})

const page = await browser.newPage()
await page.setViewport({ width: 430, height: 800 })

const introVisible = () => page.$('.envelope-intro').then((el) => !!el)
const phase = () =>
  page.$eval('.envelope-intro', (el) => el.className).catch(() => 'none')

// --- First visit in a session: intro plays -----------------------------------
await page.goto(BASE, { waitUntil: 'networkidle0' })
check('intro shows on first visit', await introVisible())
check('intro starts by delivering', (await phase()).includes('is-delivering'), await phase())

// The puppy has to stay on screen long enough to actually be watched, so check
// the delivery is still running a good way in rather than flashing past.
await page.waitForSelector('.intro-puppy', { timeout: 5000 })
await new Promise((resolve) => setTimeout(resolve, 1400))
check(
  'puppy still on screen 1.4s into the delivery',
  (await phase()).includes('is-delivering'),
  await phase(),
)

// Delivery hands off to the tappable envelope on its own.
await page.waitForFunction(
  () => document.querySelector('.envelope-intro')?.classList.contains('is-closed'),
  { timeout: 8000 },
)
check('delivery finishes and envelope becomes tappable', true)

// Opening the envelope dismisses the overlay and reveals the site.
await page.click('.envelope-intro__trigger')
await page.waitForFunction(() => !document.querySelector('.envelope-intro'), { timeout: 8000 })
check('opening the envelope dismisses the intro', !(await introVisible()))
check('home page rendered underneath', !!(await page.$('.home-hero')))

const replay = await page.$('.home-hero__replay')
check('replay control present on home', !!replay)

// --- Body scroll must be released -------------------------------------------
const overflow = await page.evaluate(() => document.body.style.overflow)
check('body scroll released after intro', overflow !== 'hidden', `overflow="${overflow}"`)

// --- Same session, fresh navigation: intro must not replay -------------------
await page.goto(BASE, { waitUntil: 'networkidle0' })
check('intro skipped on second load in same session', !(await introVisible()))

// --- Replay control brings the full intro back -------------------------------
await page.click('.home-hero__replay')
await page.waitForSelector('.envelope-intro', { timeout: 5000 })
check('replay restarts the delivery', (await phase()).includes('is-delivering'), await phase())

// --- A new session shows it again --------------------------------------------
const fresh = await browser.createBrowserContext()
const freshPage = await fresh.newPage()
await freshPage.setViewport({ width: 430, height: 800 })
await freshPage.goto(BASE, { waitUntil: 'networkidle0' })
check('new browsing session shows intro again', !!(await freshPage.$('.envelope-intro')))
await fresh.close()

// --- Reduced motion skips straight to the envelope ---------------------------
const rmPage = await browser.newPage()
await rmPage.setViewport({ width: 430, height: 800 })
await rmPage.emulateMediaFeatures([
  { name: 'prefers-reduced-motion', value: 'reduce' },
])
await rmPage.goto(BASE, { waitUntil: 'networkidle0' })
const rmClass = await rmPage.$eval('.envelope-intro', (el) => el.className).catch(() => 'none')
check('reduced motion skips the delivery', rmClass.includes('is-closed'), rmClass)
check('reduced motion renders no puppy', !(await rmPage.$('.intro-puppy')))

await browser.close()

const failed = results.filter((r) => !r.pass)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)
