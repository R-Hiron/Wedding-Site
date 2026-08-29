/**
 * Google Apps Script — guest lookup and RSVP → Sheet
 *
 * The guest list lives here in the spreadsheet and never reaches the browser.
 * A guest types their name, and this script returns only that one person. It
 * also re-checks every reply against the list, so who is invited and who may
 * bring a guest cannot be talked around by editing the page.
 *
 * Setup:
 * 1. Create a Google Sheet with two tabs (this script adds the headers the
 *    first time it runs, so you can start with empty tabs):
 *
 *    "Invitations" — your guest list, one row per guest:
 *      Guest | AllowPlusOne | AlsoKnownAs
 *
 *      AllowPlusOne: "yes" for anyone who may bring a guest of their own.
 *      AlsoKnownAs: other names they might type, separated by commas —
 *      nicknames, maiden names, a middle name they usually include. Worth
 *      filling in for anyone who goes by something other than what you wrote.
 *
 *    "Responses" — filled in by this script, one row per reply:
 *      Timestamp | Guest | OnList | Attending | PlusOneName | Dietary | Note
 *
 * 2. Extensions → Apps Script → paste this file's contents into Code.gs
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL into your project's .env as VITE_RSVP_ENDPOINT
 * 5. Run Wedding → Check the guest list, to catch typos and duplicates
 * 6. Optional: set NOTIFY_EMAIL below to get an email on each reply
 *
 * Re-deploy after any script changes (Manage deployments → Edit → New version).
 */

const INVITATIONS_SHEET = 'Invitations'
const RESPONSES_SHEET = 'Responses'
const NOTIFY_EMAIL = 'landrwedding27@gmail.com' // leave blank to skip email

/** Caps, so a bad actor cannot fill the sheet with megabytes of text. */
const MAX_NAME = 80
const MAX_DIETARY = 300
const MAX_NOTE = 1000

/** Failed lookups allowed per minute across everyone, to slow name fishing. */
const FAILED_LOOKUP_LIMIT = 60

const INVITATION_HEADERS = ['Guest', 'AllowPlusOne', 'AlsoKnownAs']
const RESPONSE_HEADERS = [
  'Timestamp',
  'Guest',
  'OnList',
  'Attending',
  'PlusOneName',
  'Dietary',
  'Note',
]

// --- Web app ----------------------------------------------------------------

function doGet() {
  // Nothing to serve here. The guest list is deliberately not readable.
  return jsonResponse_({ ok: true })
}

function doOptions() {
  return jsonResponse_({ ok: true })
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}'
    const data = JSON.parse(raw)
    const action = String(data.action || '').trim()

    if (action === 'lookup') return handleLookup_(data)
    if (action === 'reply') return handleReply_(data)
    if (action === 'open-reply') return handleOpenReply_(data)

    return jsonResponse_({ ok: false, error: 'unknown-action' })
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) })
  }
}

// --- Looking yourself up ----------------------------------------------------

function handleLookup_(data) {
  const typed = flatten_(data.name)
  if (!typed) return jsonResponse_({ ok: false, error: 'not-found' })

  if (overFailedLookupLimit_()) {
    return jsonResponse_({ ok: false, error: 'busy' })
  }

  const match = matchGuest_(typed)
  if (match.status !== 'found') {
    countFailedLookup_()
    return jsonResponse_({ ok: false, error: match.status })
  }

  return jsonResponse_({
    ok: true,
    guest: {
      name: match.guest.name,
      allowPlusOne: match.guest.allowPlusOne,
      // Whatever they said last time, so they can amend rather than start over.
      reply: findReply_(match.guest.name),
    },
  })
}

/**
 * Which guest a typed name belongs to.
 *
 * Tried in order, and each step stops if it finds more than one person, because
 * showing somebody else's invitation is worse than asking again:
 *
 * 1. The whole name, including any nicknames in AlsoKnownAs.
 * 2. A first name on its own, when only one guest has it.
 * 3. A near miss, for a typo or a missing letter.
 *
 * Returns { status: 'found', guest } or { status: 'not-found' | 'ambiguous' }.
 */
function matchGuest_(typed) {
  const guests = readGuests_()

  const whole = guests.filter(function (guest) {
    return guest.names.indexOf(typed) !== -1
  })
  const decided = decide_(whole)
  if (decided) return decided

  // Only when they typed a single word, so "John Smith" is never treated as a
  // search for everyone called John.
  if (typed.indexOf(' ') === -1) {
    const byFirstName = guests.filter(function (guest) {
      return guest.firstNames.indexOf(typed) !== -1
    })
    const decidedFirst = decide_(byFirstName)
    if (decidedFirst) return decidedFirst
  }

  const near = guests.filter(function (guest) {
    return guest.names.some(function (name) {
      return isNearMiss_(typed, name)
    })
  })
  const decidedNear = decide_(near)
  if (decidedNear) return decidedNear

  return { status: 'not-found' }
}

/**
 * One person is a match. Several rows for the same name are a duplicate in the
 * list rather than a real ambiguity, so the first of those is used.
 */
function decide_(candidates) {
  if (candidates.length === 0) return null

  const first = flatten_(candidates[0].name)
  for (let i = 1; i < candidates.length; i++) {
    if (flatten_(candidates[i].name) !== first) return { status: 'ambiguous' }
  }
  return { status: 'found', guest: candidates[0] }
}

/** Every guest on the list, with the names each of them can be found by. */
function readGuests_() {
  const sheet = getSheet_(INVITATIONS_SHEET, INVITATION_HEADERS)
  const rows = sheet.getDataRange().getValues()
  const guests = []

  for (let i = 1; i < rows.length; i++) {
    const name = String(rows[i][0] || '').trim()
    if (!name) continue

    const names = [flatten_(name)]
    const aliases = String(rows[i][2] || '').split(',')
    for (let a = 0; a < aliases.length; a++) {
      const alias = flatten_(aliases[a])
      if (alias && names.indexOf(alias) === -1) names.push(alias)
    }

    guests.push({
      row: i + 1,
      name: name,
      allowPlusOne: isYes_(rows[i][1]),
      names: names,
      firstNames: names.map(firstWord_),
    })
  }

  return guests
}

/** This guest's existing reply, shaped like the one the site sends. */
function findReply_(name) {
  const sheet = getSheet_(RESPONSES_SHEET, RESPONSE_HEADERS)
  const rows = sheet.getDataRange().getValues()
  const key = flatten_(name)

  // Last one wins, in case an older row was left behind.
  let reply = null
  for (let i = 1; i < rows.length; i++) {
    if (flatten_(rows[i][1]) !== key) continue
    reply = {
      attending: isYes_(rows[i][3]),
      plusOneName: String(rows[i][4] || '').trim(),
      dietary: String(rows[i][5] || '').trim(),
      note: String(rows[i][6] || '').trim(),
    }
  }

  return reply
}

// --- Replies ----------------------------------------------------------------

function handleReply_(data) {
  // Looked up again rather than trusted, so the reply lands against a real
  // guest and the plus-one rule is the one on the list.
  const match = matchGuest_(flatten_(data.name))
  if (match.status !== 'found') return jsonResponse_({ ok: false, error: 'not-found' })

  const guest = match.guest
  const attending = data.attending === true || isYes_(data.attending)
  const row = [
    new Date().toISOString(),
    guest.name,
    'yes',
    attending ? 'Yes' : 'No',
    // A plus-one only counts if this guest was allocated one and is coming.
    attending && guest.allowPlusOne ? trimTo_(data.plusOneName, MAX_NAME) : '',
    attending ? trimTo_(data.dietary, MAX_DIETARY) : '',
    trimTo_(data.note, MAX_NOTE),
  ]

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(20000)) return jsonResponse_({ ok: false, error: 'busy' })
  try {
    const sheet = getSheet_(RESPONSES_SHEET, RESPONSE_HEADERS)
    // Replacing rather than appending, so a guest who replies twice does not
    // show up as two conflicting answers.
    removeRowsForGuest_(sheet, guest.name)
    sheet.appendRow(row)
  } finally {
    lock.releaseLock()
  }

  notify_(guest.name, row)
  return jsonResponse_({ ok: true })
}

/** A reply from someone the list could not place. */
function handleOpenReply_(data) {
  const name = trimTo_(data.name, MAX_NAME)
  if (!name) return jsonResponse_({ ok: false, error: 'missing-name' })

  const attending = data.attending === true || isYes_(data.attending)
  const row = [
    new Date().toISOString(),
    name,
    'no', // not matched to the list, so worth checking by hand
    attending ? 'Yes' : 'No',
    attending ? trimTo_(data.plusOneName, MAX_NAME) : '',
    attending ? trimTo_(data.dietary, MAX_DIETARY) : '',
    trimTo_(data.note, MAX_NOTE),
  ]

  const lock = LockService.getScriptLock()
  if (!lock.tryLock(20000)) return jsonResponse_({ ok: false, error: 'busy' })
  try {
    getSheet_(RESPONSES_SHEET, RESPONSE_HEADERS).appendRow(row)
  } finally {
    lock.releaseLock()
  }

  notify_(name + ' (not on the list)', row)
  return jsonResponse_({ ok: true })
}

function removeRowsForGuest_(sheet, name) {
  const rows = sheet.getDataRange().getValues()
  const key = flatten_(name)
  // Bottom up, so deleting a row does not shift the ones still to check. Only
  // rows matched to the list are replaced; unmatched ones are left for you.
  for (let i = rows.length - 1; i >= 1; i--) {
    if (flatten_(rows[i][1]) === key && isYes_(rows[i][2])) sheet.deleteRow(i + 1)
  }
}

function notify_(who, row) {
  if (!NOTIFY_EMAIL) return
  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: 'Wedding RSVP: ' + who,
    body:
      'Attending: ' + row[3] +
      (row[4] ? '\nBringing: ' + row[4] : '') +
      (row[5] ? '\nDietary: ' + row[5] : '') +
      (row[6] ? '\nNote: ' + row[6] : ''),
  })
}

// --- Checking the list ------------------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Wedding')
    .addItem('Check the guest list', 'checkGuestList')
    .addItem('Look up a name (no changes made)', 'previewLookup')
    .addToUi()
}

/**
 * Reports anything that would stop a guest finding themselves: the same name
 * twice, first names shared by several people who would then have to type a
 * surname, and near-identical names.
 */
function checkGuestList() {
  const guests = readGuests_()
  const problems = []

  if (guests.length === 0) {
    SpreadsheetApp.getUi().alert('The Invitations tab is empty.')
    return
  }

  const seen = {}
  const firstNames = {}
  for (let i = 0; i < guests.length; i++) {
    const key = flatten_(guests[i].name)
    if (seen[key]) {
      problems.push('"' + guests[i].name + '" is on the list more than once.')
    }
    seen[key] = true

    for (let n = 0; n < guests[i].names.length; n++) {
      for (let j = 0; j < guests.length; j++) {
        if (j === i) continue
        if (guests[j].names.indexOf(guests[i].names[n]) !== -1 && flatten_(guests[j].name) !== key) {
          problems.push(
            '"' + guests[i].names[n] + '" could be either ' +
              guests[i].name + ' or ' + guests[j].name + '.',
          )
        }
      }
    }

    for (let f = 0; f < guests[i].firstNames.length; f++) {
      const first = guests[i].firstNames[f]
      if (!firstNames[first]) firstNames[first] = []
      if (firstNames[first].indexOf(guests[i].name) === -1) firstNames[first].push(guests[i].name)
    }
  }

  Object.keys(firstNames).forEach(function (first) {
    if (firstNames[first].length > 1 && !seen[first]) {
      problems.push(
        'Several people are called "' + first + '" (' +
          firstNames[first].join(', ') +
          '), so they will each need to type their surname.',
      )
    }
  })

  for (let i = 0; i < guests.length; i++) {
    for (let j = i + 1; j < guests.length; j++) {
      if (isNearMiss_(guests[i].names[0], guests[j].names[0])) {
        problems.push(
          '"' + guests[i].name + '" and "' + guests[j].name + '" are nearly the same name.',
        )
      }
    }
  }

  SpreadsheetApp.getUi().alert(
    problems.length
      ? 'Worth a look:\n\n• ' + unique_(problems).join('\n• ')
      : 'The list looks good — ' + guests.length + ' guests, all findable by name.',
  )
}

/** Read-only check that a name finds the guest you expect. */
function previewLookup() {
  const ui = SpreadsheetApp.getUi()
  const answer = ui.prompt('Which name?', 'As a guest would type it', ui.ButtonSet.OK_CANCEL)
  if (answer.getSelectedButton() !== ui.Button.OK) return

  const match = matchGuest_(flatten_(answer.getResponseText()))
  if (match.status === 'ambiguous') {
    ui.alert('That could be more than one person, so they would be asked for their full name.')
    return
  }
  if (match.status !== 'found') {
    ui.alert('Nobody on the list matches that.')
    return
  }

  const reply = findReply_(match.guest.name)
  ui.alert(
    match.guest.name +
      (match.guest.allowPlusOne ? '\nMay bring a guest.' : '') +
      '\n\n' +
      (reply ? 'Replied: ' + (reply.attending ? 'attending' : 'not attending') : 'Has not replied yet.'),
  )
}

// --- Helpers ----------------------------------------------------------------

/**
 * Names are compared with case, spacing, punctuation and accents thrown away,
 * so "O'Neill", "oneill" and "O Neill" all match.
 */
function flatten_(value) {
  return String(value == null ? '' : value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function firstWord_(value) {
  return String(value || '').split(' ')[0]
}

function unique_(values) {
  const out = []
  for (let i = 0; i < values.length; i++) {
    if (out.indexOf(values[i]) === -1) out.push(values[i])
  }
  return out
}

/** Close enough to be a typo rather than a different person. */
function isNearMiss_(a, b) {
  if (!a || !b || a === b) return false
  const allowed = Math.min(a.length, b.length) >= 6 ? 2 : 1
  if (Math.abs(a.length - b.length) > allowed) return false
  return editDistance_(a, b, allowed) <= allowed
}

/** Levenshtein distance, giving up once it passes `limit`. */
function editDistance_(a, b, limit) {
  let previous = []
  for (let j = 0; j <= b.length; j++) previous[j] = j

  for (let i = 1; i <= a.length; i++) {
    const current = [i]
    let best = i
    for (let j = 1; j <= b.length; j++) {
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + (a.charAt(i - 1) === b.charAt(j - 1) ? 0 : 1),
      )
      if (current[j] < best) best = current[j]
    }
    if (best > limit) return limit + 1
    previous = current
  }

  return previous[b.length]
}

function isYes_(value) {
  if (value === true) return true
  return /^(yes|y|true|1)$/i.test(String(value == null ? '' : value).trim())
}

function trimTo_(value, limit) {
  return String(value == null ? '' : value)
    .trim()
    .slice(0, limit)
}

function overFailedLookupLimit_() {
  const cache = CacheService.getScriptCache()
  return Number(cache.get('failed-lookups') || 0) >= FAILED_LOOKUP_LIMIT
}

function countFailedLookup_() {
  const cache = CacheService.getScriptCache()
  const next = Number(cache.get('failed-lookups') || 0) + 1
  cache.put('failed-lookups', String(next), 60)
}

function getSheet_(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(name)
  if (!sheet) sheet = ss.insertSheet(name)
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers)
    sheet.setFrozenRows(1)
  }
  return sheet
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
