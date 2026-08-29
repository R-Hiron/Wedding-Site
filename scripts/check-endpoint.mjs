import puppeteer from 'puppeteer-core'

/**
 * Checks the deployed Apps Script answers the site.
 *
 * Only performs lookups, which read the sheet and write nothing. Run with a
 * name from your list to confirm a real guest is found:
 *
 *   node scripts/check-endpoint.mjs "Jane Smith"
 */

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.SITE_URL ?? 'http://localhost:5173/'

const name = process.argv[2] ?? 'Zzqx Nobodyhere'

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu'],
})

const page = await browser.newPage()
page.on('console', (msg) => {
  if (msg.type() === 'error' || msg.type() === 'warning') console.log(`  browser: ${msg.text()}`)
})

await page.goto(BASE, { waitUntil: 'domcontentloaded' })
await page.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
await page.goto(`${BASE}rsvp`, { waitUntil: 'networkidle0' })

const endpointReached = await page.evaluate(() => {
  // Set at build time, so this proves the page was served with it.
  return !!import.meta.env?.VITE_RSVP_ENDPOINT
}).catch(() => null)

let status = null
page.on('response', async (res) => {
  if (res.request().method() === 'POST' && !res.url().startsWith('http://localhost')) {
    status = res.status()
  }
})

console.log(`Looking up "${name}"…`)
await page.type('input[name="lookup"]', name)
await page.click('.rsvp-form__submit')
await new Promise((r) => setTimeout(r, 6000))

const found = await page.$('.rsvp__found')
const greeting = await page
  .$eval('.rsvp__found-name', (el) => el.textContent.trim())
  .catch(() => null)
const message = await page.$eval('.rsvp-form__error', (el) => el.textContent.trim()).catch(() => null)

console.log('')
console.log('endpoint in the page:', endpointReached === false ? 'MISSING' : 'yes')
console.log('HTTP status         :', status ?? 'no request seen')
console.log('guest found         :', found ? 'yes' : 'no')
if (greeting) console.log('greeted as          :', greeting)
if (message) console.log('message on the page :', message)

await browser.close()
