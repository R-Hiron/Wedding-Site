import puppeteer from 'puppeteer-core'

const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const BASE = process.env.SITE_URL ?? 'http://localhost:5173/'

const results = []
function check(name, pass, detail = '') {
  results.push({ pass })
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? ` — ${detail}` : ''}`)
}

/**
 * Stand-in for the Apps Script. Every POST that would leave the machine is
 * answered from here instead, so verifying this never touches the real sheet.
 *
 * Matching lives in the Apps Script, so this only needs to be right about the
 * shape of the answers: a guest who may bring somebody, one who may not, and
 * one who has already replied.
 */
const GUESTS = {
  'john smith': { name: 'John Smith', allowPlusOne: true, reply: null },
  john: { name: 'John Smith', allowPlusOne: true, reply: null },
  'jane smith': { name: 'Jane Smith', allowPlusOne: false, reply: null },
  'alex brown': {
    name: 'Alex Brown',
    allowPlusOne: true,
    reply: {
      attending: true,
      plusOneName: 'Robin Green',
      dietary: 'Vegetarian',
      note: 'Congratulations!',
    },
  },
}

/** A first name two different guests share. */
const AMBIGUOUS = ['sam']

const flatten = (value) =>
  String(value ?? '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-first-run', '--disable-gpu', '--force-device-scale-factor=1'],
})

/**
 * A page with the envelope intro dismissed and the endpoint stubbed. `sent`
 * collects every payload the page tried to send. `fail` makes the next reply
 * come back as a failure, for checking the error handling.
 */
async function openRsvp(path = 'rsvp') {
  const page = await browser.newPage()
  await page.setViewport({ width: 1100, height: 900 })
  const sent = []
  const state = { fail: false }

  await page.setRequestInterception(true)
  page.on('request', (request) => {
    const url = request.url()
    const local = url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')

    if (request.method() !== 'POST' || local) {
      void request.continue()
      return
    }

    let payload = {}
    try {
      payload = JSON.parse(request.postData() ?? '{}')
    } catch {
      payload = { unparseable: request.postData() }
    }
    sent.push(payload)

    const respond = (body) =>
      request.respond({
        status: 200,
        contentType: 'application/json',
        headers: { 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(body),
      })

    if (state.fail) {
      void respond({ ok: false, error: 'boom' })
      return
    }

    if (payload.action === 'lookup') {
      const typed = flatten(payload.name)
      if (AMBIGUOUS.includes(typed)) {
        void respond({ ok: false, error: 'ambiguous' })
        return
      }
      const guest = GUESTS[typed]
      void respond(guest ? { ok: true, guest } : { ok: false, error: 'not-found' })
      return
    }

    void respond({ ok: true })
  })

  await page.goto(BASE, { waitUntil: 'domcontentloaded' })
  await page.evaluate(() => sessionStorage.setItem('rl-invitation-seen', '1'))
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle0' })
  return { page, sent, state }
}

const text = (page, selector) =>
  page.$eval(selector, (el) => el.textContent.trim()).catch(() => null)

const value = (page, selector) =>
  page.$eval(selector, (el) => el.value).catch(() => null)

const pressed = (page) =>
  page.$$eval('.rsvp-form__choices .rsvp-choice', (els) =>
    els.map((el) => el.getAttribute('aria-pressed')),
  )

const settle = () => new Promise((r) => setTimeout(r, 260))

/** Finds a guest and lands on the reply step. */
async function findGuest(page, name) {
  await page.type('input[name="lookup"]', name)
  await page.click('.rsvp-form__submit')
  await settle()
}

// --- Nothing is known until a name is entered --------------------------------
{
  const { page, sent } = await openRsvp()
  check('the RSVP opens by asking for the guest’s name', !!(await page.$('input[name="lookup"]')))
  check('no reply form is shown before the guest is found', !(await page.$('.rsvp__found')))

  const shown = await page.evaluate(() => document.body.innerText)
  check('no guest names are on the page before a lookup', !shown.includes('John Smith'))

  // No search or suggestions, so the list cannot be browsed a letter at a time.
  const input = await page.$eval('input[name="lookup"]', (el) => ({
    list: el.getAttribute('list'),
    role: el.getAttribute('role'),
  }))
  check('the name field offers no suggestions from the list', !input.list && !input.role)

  // The whole point of looking up: the browser must never hold the guest list.
  const bundle = await page.evaluate(async () => {
    const sources = [...document.querySelectorAll('script[src]')].map((el) => el.src)
    const bodies = await Promise.all(
      sources.map((src) => fetch(src).then((r) => r.text()).catch(() => '')),
    )
    return bodies.join('\n')
  })
  check('the guest list is not in the page code', !bundle.includes('John Smith'))

  // Submitting nothing should not reach the endpoint at all.
  await page.click('.rsvp-form__submit')
  await settle()
  check('an empty name is refused without asking the server', sent.length === 0)
  check('it says the name is missing', !!(await text(page, '.rsvp-form__error')))
  await page.close()
}

// --- A name that is not on the list -----------------------------------------
{
  const { page, sent } = await openRsvp()
  await findGuest(page, 'Nobody Here')

  check('an unknown name is looked up', sent.length === 1 && sent[0].action === 'lookup')
  check(
    'it says the name is not on the list',
    (await text(page, '.rsvp-form__error'))?.includes("couldn't find"),
  )
  check('it stays on the lookup step', !(await page.$('.rsvp__found')))
  check('nothing is revealed about who is on the list', !(await page.$('.rsvp__found-name')))
  await page.close()
}

// --- Names are forgiving about spacing and case ------------------------------
{
  const { page, sent } = await openRsvp()
  await findGuest(page, '  john   SMITH  ')
  check('the name is sent without the surrounding spaces', sent[0]?.name === 'john   SMITH', sent[0]?.name)
  check('a miscased, misspaced name still finds the guest', !!(await page.$('.rsvp__found')))
  check(
    'the guest is greeted by the name on the list, not the one typed',
    (await text(page, '.rsvp__found-name'))?.includes('John Smith'),
    await text(page, '.rsvp__found-name'),
  )
  await page.close()
}

// --- A first name is enough when only one guest has it -----------------------
{
  const { page } = await openRsvp()
  await findGuest(page, 'John')
  check(
    'a first name on its own finds the guest',
    (await text(page, '.rsvp__found-name'))?.includes('John Smith'),
  )
  await page.close()
}

// --- A first name two people share ------------------------------------------
{
  const { page } = await openRsvp()
  await findGuest(page, 'Sam')
  check(
    'a shared first name asks for the surname instead of guessing',
    (await text(page, '.rsvp-form__error'))?.includes('first and last name'),
  )
  check('no reply form is shown for a shared name', !(await page.$('.rsvp__found')))
  await page.close()
}

// --- The reply form, for one person -----------------------------------------
{
  const { page } = await openRsvp()
  await findGuest(page, 'John Smith')

  check('only the one guest is asked about', !(await page.$('.rsvp-guest')))
  check('nothing is presumed about whether they are coming', (await pressed(page)).every((v) => v === 'false'))
  check('the dietary question waits until they say they are coming', !(await page.$('textarea[name="dietary"]')))
  check('the plus-one question waits too', !(await page.$('input[name="plusOne"]')))
  check('a note can be left either way', !!(await page.$('textarea[name="note"]')))
  await page.close()
}

// --- A guest who may bring somebody -----------------------------------------
{
  const { page, sent } = await openRsvp()
  await findGuest(page, 'John Smith')

  await page.click('.rsvp-form__submit')
  await settle()
  check('a reply with no answer is not sent', sent.length === 1)
  check(
    'it asks whether they can attend',
    (await text(page, '.rsvp-form__banner--error'))?.includes('can attend'),
  )

  await page.click('.rsvp-form__choices .rsvp-choice')
  await settle()
  check('saying yes asks who they are bringing', !!(await page.$('input[name="plusOne"]')))
  check('saying yes asks about dietary needs', !!(await page.$('textarea[name="dietary"]')))

  await page.type('input[name="plusOne"]', 'Robin Green')
  await page.type('textarea[name="dietary"]', 'Nut allergy')
  await page.type('textarea[name="note"]', 'See you there')
  await page.click('.rsvp-form__submit')
  await settle()

  const reply = sent.at(-1)
  check('the reply is sent', reply?.action === 'reply', JSON.stringify(reply))
  check('it is filed against the name on the list', reply?.name === 'John Smith')
  check('it records that they are attending', reply?.attending === true)
  check('the guest they are bringing is included', reply?.plusOneName === 'Robin Green')
  check('their dietary needs are included', reply?.dietary === 'Nut allergy')
  check('their note is included', reply?.note === 'See you there')
  check('the thank-you is shown', !!(await page.$('.rsvp__result-body')))
  await page.close()
}

// --- A guest who may not bring anybody --------------------------------------
{
  const { page, sent } = await openRsvp()
  await findGuest(page, 'Jane Smith')
  await page.click('.rsvp-form__choices .rsvp-choice')
  await settle()

  check('a guest with no plus-one is not asked who they are bringing', !(await page.$('input[name="plusOne"]')))
  check('they are still asked about dietary needs', !!(await page.$('textarea[name="dietary"]')))

  await page.click('.rsvp-form__submit')
  await settle()
  check('nothing is sent as a plus-one for them', sent.at(-1)?.plusOneName === '')
  await page.close()
}

// --- Changing your mind takes the extras with it ----------------------------
{
  const { page, sent } = await openRsvp()
  await findGuest(page, 'John Smith')

  await page.click('.rsvp-form__choices .rsvp-choice')
  await settle()
  await page.type('input[name="plusOne"]', 'Robin Green')
  await page.type('textarea[name="dietary"]', 'Vegetarian')
  // Changed their mind.
  await page.click('.rsvp-form__choices .rsvp-choice:nth-of-type(2)')
  await settle()
  check('saying no puts the extra questions away', !(await page.$('textarea[name="dietary"]')))

  await page.click('.rsvp-form__submit')
  await settle()
  const reply = sent.at(-1)
  check(
    'a guest who is not coming sends no plus-one or dietary',
    reply?.attending === false && reply.plusOneName === '' && reply.dietary === '',
    JSON.stringify(reply),
  )
  await page.close()
}

// --- Following a personalised link -------------------------------------------
{
  const { page, sent } = await openRsvp('rsvp?name=John%20Smith')
  await settle()
  check('a linked name goes straight to the reply', !!(await page.$('.rsvp__found')))
  check('the link is looked up once, not repeatedly', sent.length === 1, `${sent.length} requests`)
  check(
    'the linked guest is the one shown',
    (await text(page, '.rsvp__found-name'))?.includes('John Smith'),
  )
  await page.close()
}

// --- Changing an answer already given ----------------------------------------
{
  const { page, sent } = await openRsvp('rsvp?name=Alex%20Brown')
  await settle()

  check('a guest who has replied sees their previous answer', (await pressed(page)).join(',') === 'true,false')
  check('the guest they named is still there', (await value(page, 'input[name="plusOne"]')) === 'Robin Green')
  check('their dietary note is still there', (await value(page, 'textarea[name="dietary"]')) === 'Vegetarian')
  check('their note is still there', (await value(page, 'textarea[name="note"]')) === 'Congratulations!')
  check(
    'the button offers to update rather than send afresh',
    (await text(page, '.rsvp-form__submit'))?.toLowerCase().includes('update'),
  )

  await page.click('.rsvp-form__choices .rsvp-choice:nth-of-type(2)')
  await page.click('.rsvp-form__submit')
  await settle()
  const reply = sent.at(-1)
  check('the changed answer is what gets sent', reply?.attending === false, JSON.stringify(reply))
  check('their note is kept', reply?.note === 'Congratulations!')
  await page.close()
}

// --- Starting over ------------------------------------------------------------
{
  const { page } = await openRsvp()
  await findGuest(page, 'John Smith')
  await page.click('.rsvp__link')
  await settle()
  check('a guest who is not who we found can start again', !!(await page.$('input[name="lookup"]')))
  check('the previous guest is no longer shown', !(await page.$('.rsvp__found')))
  await page.close()
}

// --- Replying when the list cannot place you ---------------------------------
{
  const { page, sent } = await openRsvp()
  await page.click('.rsvp__aside .rsvp__link')
  await settle()
  check('there is a way to reply without being found', !!(await page.$('input[name="name"]')))

  await page.click('.rsvp-form__submit')
  await settle()
  check('the fallback still asks for a name and an answer', sent.length === 0)
  const errors = await page.$$eval('.rsvp-form__error', (els) => els.length)
  check('both missing answers are pointed out', errors === 2, `${errors} errors`)

  await page.type('input[name="name"]', 'Casey Reid')
  await page.click('.rsvp-form__fieldset .rsvp-choice')
  await settle()
  await page.type('textarea[name="dietary"]', 'Coeliac')
  await page.click('.rsvp-form__submit')
  await settle()

  const reply = sent.at(-1)
  check('the unmatched reply is sent separately', reply?.action === 'open-reply', JSON.stringify(reply))
  check('it carries the name they gave', reply?.name === 'Casey Reid')
  check('it records that they are coming', reply?.attending === true)
  check('the thank-you is shown for them too', !!(await page.$('.rsvp__result-body')))
  await page.close()
}

// --- Bots ---------------------------------------------------------------------
{
  const { page, sent } = await openRsvp()
  await page.click('.rsvp__aside .rsvp__link')
  await settle()
  await page.type('input[name="name"]', 'Definitely A Guest')
  await page.click('.rsvp-form__fieldset .rsvp-choice')
  await page.$eval('.hp-field input', (el) => {
    // React ignores a plain value assignment, so set it the way the browser does.
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
    setter.call(el, 'http://spam.example')
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await page.click('.rsvp-form__submit')
  await settle()
  check('a filled honeypot sends nothing', sent.length === 0)
  check('the bot is thanked anyway', !!(await page.$('.rsvp__result-body')))
  await page.close()
}

// --- When the script is having a bad day -------------------------------------
{
  const { page, state } = await openRsvp()
  await findGuest(page, 'John Smith')

  state.fail = true
  await page.click('.rsvp-form__choices .rsvp-choice')
  await settle()
  await page.type('textarea[name="dietary"]', 'None')
  await page.click('.rsvp-form__submit')
  await settle()

  check('a failure is reported rather than swallowed', !!(await page.$('.rsvp-form__banner--error')))
  check('the answers are still there to try again', !!(await page.$('.rsvp__found')))
  check('what they typed is not lost', (await value(page, 'textarea[name="dietary"]')) === 'None')
  check(
    'the submit button works again',
    !(await page.$eval('.rsvp-form__submit', (el) => el.disabled)),
  )
  await page.close()
}

await browser.close()

const failed = results.filter((r) => !r.pass).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
