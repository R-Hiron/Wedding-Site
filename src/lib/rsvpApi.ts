/**
 * Talking to the Apps Script web app behind the RSVP.
 *
 * One endpoint handles everything, and requests are sent as `text/plain` on
 * purpose: it keeps them simple CORS requests, which Apps Script can answer
 * without a preflight it has no way to respond to.
 *
 * The guest list stays in the spreadsheet. A lookup returns one guest and
 * nothing else, and the script looks the name up again when the reply arrives,
 * so nothing here is trusted to enforce who is invited or who may bring a guest.
 */

export type Reply = {
  attending: boolean
  /** Only meaningful for a guest whose invitation allows a plus-one. */
  plusOneName: string
  dietary: string
  note: string
}

export type Guest = {
  /** The name as it is written on the list, not as it was typed. */
  name: string
  allowPlusOne: boolean
  /** What they said last time, so they can amend it. */
  reply: Reply | null
}

export type LookupResult =
  | { status: 'found'; guest: Guest }
  | { status: 'not-found' }
  /** The name could be more than one guest, so more of it is needed. */
  | { status: 'ambiguous' }
  | { status: 'busy' }
  | { status: 'error' }

export type SendResult = 'sent' | 'not-found' | 'busy' | 'error'

const endpoint = import.meta.env.VITE_RSVP_ENDPOINT as string | undefined

export async function lookupGuest(name: string): Promise<LookupResult> {
  if (!endpoint) return offlineLookup(name)

  const body = await post({ action: 'lookup', name: name.trim() })
  if (!body) return { status: 'error' }
  if (body.ok && body.guest) return { status: 'found', guest: body.guest }
  if (body.error === 'busy') return { status: 'busy' }
  if (body.error === 'ambiguous') return { status: 'ambiguous' }
  if (body.error === 'not-found') return { status: 'not-found' }
  return { status: 'error' }
}

export async function sendReply(name: string, reply: Reply): Promise<SendResult> {
  if (!endpoint) return offlineSend()
  return toSendResult(await post({ action: 'reply', name, ...reply }))
}

/** A reply from a guest the list could not place. */
export async function sendOpenReply(reply: {
  name: string
  attending: boolean
  plusOneName: string
  dietary: string
  note: string
}): Promise<SendResult> {
  if (!endpoint) return offlineSend()
  return toSendResult(await post({ action: 'open-reply', ...reply }))
}

type ScriptResponse = {
  ok?: boolean
  error?: string
  guest?: Guest
}

async function post(payload: unknown): Promise<ScriptResponse | null> {
  try {
    const res = await fetch(endpoint as string, {
      method: 'POST',
      mode: 'cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    return (await res.json()) as ScriptResponse
  } catch (err) {
    console.error(err)
    return null
  }
}

function toSendResult(body: ScriptResponse | null): SendResult {
  if (!body) return 'error'
  if (body.ok) return 'sent'
  if (body.error === 'busy') return 'busy'
  if (body.error === 'not-found') return 'not-found'
  return 'error'
}

// --- Without an endpoint ----------------------------------------------------
// So the page can be worked on locally before the Apps Script is deployed.
// Nothing is saved.

const OFFLINE_WARNING =
  'VITE_RSVP_ENDPOINT is not set — using a made-up guest. Nothing is being saved.'

function offlineLookup(name: string): LookupResult {
  console.warn(OFFLINE_WARNING)
  const typed = name.trim()
  if (typed.length < 2) return { status: 'not-found' }
  return { status: 'found', guest: { name: typed, allowPlusOne: true, reply: null } }
}

function offlineSend(): SendResult {
  console.warn(OFFLINE_WARNING)
  return 'sent'
}
