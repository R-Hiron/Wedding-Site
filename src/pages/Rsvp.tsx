import { useCallback, useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { rsvpCopy } from '../content'
import { lookupGuest, sendOpenReply, sendReply } from '../lib/rsvpApi'
import type { Guest } from '../lib/rsvpApi'
import './Rsvp.css'

/**
 * Guests find themselves on the list before replying, so the page moves through
 * three steps rather than showing one open form: look yourself up, answer, done.
 * Anyone the list cannot place can still reply, and we match them up by hand.
 */
type Step = 'lookup' | 'reply' | 'open' | 'done'

export function Rsvp() {
  const [searchParams] = useSearchParams()
  /** A guest can be linked straight to their reply, as /rsvp?name=Jane%20Smith. */
  const linkedName = searchParams.get('name') ?? ''

  const [step, setStep] = useState<Step>('lookup')
  const [guest, setGuest] = useState<Guest | null>(null)

  return (
    <div className="rsvp page-inner">
      <h1 className="rsvp__title script">
        {step === 'done' ? rsvpCopy.successTitle : rsvpCopy.title}
      </h1>

      {step === 'lookup' ? (
        <LookupStep
          linkedName={linkedName}
          onFound={(found) => {
            setGuest(found)
            setStep('reply')
          }}
          onWithoutLookup={() => setStep('open')}
        />
      ) : null}

      {step === 'reply' && guest ? (
        <ReplyStep
          guest={guest}
          onSent={() => setStep('done')}
          onStartOver={() => {
            setGuest(null)
            setStep('lookup')
          }}
        />
      ) : null}

      {step === 'open' ? (
        <OpenStep onSent={() => setStep('done')} onLookUp={() => setStep('lookup')} />
      ) : null}

      {step === 'done' ? (
        <div className="rsvp__result">
          <p className="rsvp__result-body">{rsvpCopy.successBody}</p>
        </div>
      ) : null}

      <Link to="/" className="rsvp__back sans-caps">
        {rsvpCopy.backLabel}
      </Link>
    </div>
  )
}

// --- Finding yourself --------------------------------------------------------

function LookupStep({
  linkedName,
  onFound,
  onWithoutLookup,
}: {
  linkedName: string
  onFound: (guest: Guest) => void
  onWithoutLookup: () => void
}) {
  const copy = rsvpCopy.lookup
  const [name, setName] = useState(linkedName)
  const [status, setStatus] = useState<'idle' | 'checking'>('idle')
  const [error, setError] = useState('')

  const look = useCallback(
    async (value: string) => {
      if (!value.trim()) {
        setError(copy.missing)
        return
      }

      setError('')
      setStatus('checking')
      const result = await lookupGuest(value)
      setStatus('idle')

      if (result.status === 'found') onFound(result.guest)
      else if (result.status === 'busy') setError(copy.busy)
      else if (result.status === 'ambiguous') setError(copy.ambiguous)
      else if (result.status === 'not-found') setError(copy.notFound)
      else setError(rsvpCopy.errorBody)
    },
    [copy, onFound],
  )

  // A name we linked them to should just work, without asking them to press a
  // button on a name they never typed.
  const tried = useRef(false)
  useEffect(() => {
    if (tried.current || !linkedName.trim()) return
    tried.current = true
    void look(linkedName)
  }, [linkedName, look])

  return (
    <>
      <form
        className="rsvp-form"
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          void look(name)
        }}
        noValidate
      >
        <p className="rsvp__intro">{copy.intro}</p>

        <label className="rsvp-form__field">
          <span className="rsvp-form__label sans-caps">{copy.label}</span>
          <input
            type="text"
            name="lookup"
            autoComplete="name"
            placeholder={copy.placeholder}
            value={name}
            onChange={(e) => {
              setName(e.target.value)
              setError('')
            }}
            aria-invalid={!!error}
          />
          {error ? (
            <span className="rsvp-form__error" role="alert">
              {error}
            </span>
          ) : null}
        </label>

        <button
          type="submit"
          className="rsvp-form__submit sans-caps"
          disabled={status === 'checking'}
        >
          {status === 'checking' ? copy.checkingLabel : copy.submitLabel}
        </button>
      </form>

      <div className="rsvp__aside">
        <h2 className="rsvp__aside-title sans-caps">{copy.noCodeLabel}</h2>
        <p className="rsvp__aside-body">{copy.noCodeBody}</p>
        <button type="button" className="rsvp__link sans-caps" onClick={onWithoutLookup}>
          {copy.noCodeCta}
        </button>
      </div>
    </>
  )
}

// --- Replying ----------------------------------------------------------------

function ReplyStep({
  guest,
  onSent,
  onStartOver,
}: {
  guest: Guest
  onSent: () => void
  onStartOver: () => void
}) {
  const copy = rsvpCopy.reply
  const amending = guest.reply !== null

  /** Null until they say one way or the other, so nobody is assumed to attend. */
  const [attending, setAttending] = useState<boolean | null>(guest.reply?.attending ?? null)
  const [plusOneName, setPlusOneName] = useState(guest.reply?.plusOneName ?? '')
  const [dietary, setDietary] = useState(guest.reply?.dietary ?? '')
  const [note, setNote] = useState(guest.reply?.note ?? '')
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (attending === null) {
      setError(copy.unanswered)
      return
    }

    setStatus('sending')
    const result = await sendReply(guest.name, {
      attending,
      plusOneName: attending && guest.allowPlusOne ? plusOneName.trim() : '',
      dietary: attending ? dietary.trim() : '',
      note: note.trim(),
    })
    setStatus('idle')

    if (result === 'sent') onSent()
    else if (result === 'busy') setError(rsvpCopy.lookup.busy)
    else if (result === 'not-found') setError(rsvpCopy.lookup.notFound)
    else setError(rsvpCopy.errorBody)
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
      <div className="rsvp__found">
        <h2 className="rsvp__found-name script">
          {copy.welcome.replace('{name}', guest.name)}
        </h2>
        <p className="rsvp__intro">{amending ? copy.amendIntro : copy.intro}</p>
      </div>

      <div className="rsvp-form__choices rsvp-form__choices--pair">
        <ChoiceButton
          selected={attending === true}
          onClick={() => {
            setAttending(true)
            setError('')
          }}
          label={copy.attendingLabel}
        />
        <ChoiceButton
          selected={attending === false}
          onClick={() => {
            setAttending(false)
            setPlusOneName('')
            setDietary('')
            setError('')
          }}
          label={copy.notAttendingLabel}
        />
      </div>

      {attending ? (
        <>
          {guest.allowPlusOne ? (
            <label className="rsvp-form__field">
              <span className="rsvp-form__label sans-caps">{copy.plusOneLabel}</span>
              <input
                type="text"
                name="plusOne"
                value={plusOneName}
                onChange={(e) => setPlusOneName(e.target.value)}
              />
              <span className="rsvp-form__hint">{copy.plusOneHint}</span>
            </label>
          ) : null}

          <label className="rsvp-form__field">
            <span className="rsvp-form__label sans-caps">{copy.dietaryLabel}</span>
            <textarea
              name="dietary"
              rows={2}
              placeholder={copy.dietaryPlaceholder}
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
            />
          </label>
        </>
      ) : null}

      <label className="rsvp-form__field">
        <span className="rsvp-form__label sans-caps">{copy.noteLabel}</span>
        <textarea name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {error ? (
        <p className="rsvp-form__banner rsvp-form__banner--error" role="alert">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        className="rsvp-form__submit sans-caps"
        disabled={status === 'sending'}
      >
        {status === 'sending'
          ? copy.sendingLabel
          : amending
            ? copy.updateLabel
            : copy.submitLabel}
      </button>

      <button type="button" className="rsvp__link sans-caps" onClick={onStartOver}>
        {copy.startOver}
      </button>
    </form>
  )
}

// --- Replying when the list cannot place you ---------------------------------

function OpenStep({
  onSent,
  onLookUp,
}: {
  onSent: () => void
  onLookUp: () => void
}) {
  const copy = rsvpCopy.open
  const [name, setName] = useState('')
  const [attending, setAttending] = useState<boolean | null>(null)
  const [plusOneName, setPlusOneName] = useState('')
  const [dietary, setDietary] = useState('')
  const [note, setNote] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending'>('idle')
  const [errors, setErrors] = useState<{ name?: string; attending?: string; send?: string }>({})

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    const next: typeof errors = {}
    if (!name.trim()) next.name = copy.nameMissing
    if (attending === null) next.attending = copy.attendingMissing
    setErrors(next)
    if (next.name || next.attending) return

    // Filled in by a bot, since nobody can see the field. Say thank you and
    // send nothing.
    if (honeypot.trim()) {
      onSent()
      return
    }

    setStatus('sending')
    const result = await sendOpenReply({
      name: name.trim(),
      attending: attending === true,
      plusOneName: attending ? plusOneName.trim() : '',
      dietary: attending ? dietary.trim() : '',
      note: note.trim(),
    })
    setStatus('idle')

    if (result === 'sent') onSent()
    else setErrors({ send: result === 'busy' ? rsvpCopy.lookup.busy : rsvpCopy.errorBody })
  }

  return (
    <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
      <p className="rsvp__intro">{copy.intro}</p>

      <label className="rsvp-form__field">
        <span className="rsvp-form__label sans-caps">{copy.nameLabel}</span>
        <input
          type="text"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setErrors((prev) => ({ ...prev, name: undefined }))
          }}
          aria-invalid={!!errors.name}
        />
        {errors.name ? <span className="rsvp-form__error">{errors.name}</span> : null}
      </label>

      <fieldset className="rsvp-form__fieldset">
        <legend className="rsvp-form__label sans-caps">{copy.attendingLabel}</legend>
        <div className="rsvp-form__choices">
          <ChoiceButton
            selected={attending === true}
            onClick={() => {
              setAttending(true)
              setErrors((prev) => ({ ...prev, attending: undefined }))
            }}
            label={copy.attendingYes}
          />
          <ChoiceButton
            selected={attending === false}
            onClick={() => {
              setAttending(false)
              setPlusOneName('')
              setDietary('')
              setErrors((prev) => ({ ...prev, attending: undefined }))
            }}
            label={copy.attendingNo}
          />
        </div>
        {errors.attending ? (
          <span className="rsvp-form__error">{errors.attending}</span>
        ) : null}
      </fieldset>

      {attending ? (
        <>
          <label className="rsvp-form__field">
            <span className="rsvp-form__label sans-caps">{copy.plusOneLabel}</span>
            <input
              type="text"
              name="plusOne"
              placeholder={copy.plusOnePlaceholder}
              value={plusOneName}
              onChange={(e) => setPlusOneName(e.target.value)}
            />
          </label>

          <label className="rsvp-form__field">
            <span className="rsvp-form__label sans-caps">{copy.dietaryLabel}</span>
            <textarea
              name="dietary"
              rows={2}
              placeholder={copy.dietaryPlaceholder}
              value={dietary}
              onChange={(e) => setDietary(e.target.value)}
            />
          </label>
        </>
      ) : null}

      <label className="rsvp-form__field">
        <span className="rsvp-form__label sans-caps">{copy.noteLabel}</span>
        <textarea name="note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      </label>

      {/* Honeypot */}
      <label className="hp-field" aria-hidden="true">
        Website
        <input
          type="text"
          name="website"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </label>

      {errors.send ? (
        <p className="rsvp-form__banner rsvp-form__banner--error" role="alert">
          {errors.send}
        </p>
      ) : null}

      <button
        type="submit"
        className="rsvp-form__submit sans-caps"
        disabled={status === 'sending'}
      >
        {status === 'sending' ? rsvpCopy.reply.sendingLabel : copy.submitLabel}
      </button>

      <button type="button" className="rsvp__link sans-caps" onClick={onLookUp}>
        {copy.haveCode}
      </button>
    </form>
  )
}

function ChoiceButton({
  selected,
  onClick,
  label,
}: {
  selected: boolean
  onClick: () => void
  label: string
}) {
  return (
    <button
      type="button"
      className={`rsvp-choice${selected ? ' is-selected' : ''}`}
      onClick={onClick}
      aria-pressed={selected}
    >
      {label}
    </button>
  )
}
