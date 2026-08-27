/**
 * Google Apps Script — RSVP → Sheet
 *
 * Setup:
 * 1. Create a Google Sheet with header row:
 *    Timestamp | Name | Attending | PlusOne | GuestNames | Dietary | Note
 * 2. Extensions → Apps Script → paste this file's contents into Code.gs
 * 3. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 4. Copy the Web app URL into your project's .env as VITE_RSVP_ENDPOINT
 * 5. Optional: set NOTIFY_EMAIL below to get an email on each RSVP
 *
 * Re-deploy after any script changes (Manage deployments → Edit → New version).
 */

const SHEET_NAME = 'RSVPs' // rename or use the first sheet if blank
const NOTIFY_EMAIL = 'landrwedding27@gmail.com' // e.g. 'you@example.com' — leave blank to skip email

function doOptions() {
  return jsonResponse_({ ok: true })
}

function doPost(e) {
  try {
    const raw = (e && e.postData && e.postData.contents) || '{}'
    const data = JSON.parse(raw)

    const name = String(data.name || '').trim()
    const attending = String(data.attending || '').trim()
    const plusOne = String(data.plusOne || '').trim()
    const guestNames = String(data.guestNames || '').trim()
    const dietary = String(data.dietary || '').trim()
    const note = String(data.note || '').trim()

    if (!name || !attending) {
      return jsonResponse_({ ok: false, error: 'Missing required fields' })
    }

    const sheet = getSheet_()
    sheet.appendRow([
      new Date().toISOString(),
      name,
      attending,
      plusOne,
      guestNames,
      dietary,
      note,
    ])

    if (NOTIFY_EMAIL) {
      MailApp.sendEmail({
        to: NOTIFY_EMAIL,
        subject: 'Wedding RSVP: ' + name,
        body:
          'Name: ' +
          name +
          '\nAttending: ' +
          attending +
          '\nPlus-one: ' +
          plusOne +
          '\nGuest(s): ' +
          guestNames +
          '\nDietary: ' +
          dietary +
          '\nNote: ' +
          note,
      })
    }

    return jsonResponse_({ ok: true })
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) })
  }
}

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet()
  let sheet = ss.getSheetByName(SHEET_NAME)
  if (!sheet) {
    sheet = ss.getSheets()[0]
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow([
      'Timestamp',
      'Name',
      'Attending',
      'PlusOne',
      'GuestNames',
      'Dietary',
      'Note',
    ])
  }
  return sheet
}

function jsonResponse_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON,
  )
}
