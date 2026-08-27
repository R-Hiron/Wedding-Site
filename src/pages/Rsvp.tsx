import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { rsvpCopy } from '../content'
import './Rsvp.css'

type Attending = 'yes' | 'no' | ''
type PlusOne = 'yes' | 'no' | ''

type FormState = {
  name: string
  attending: Attending
  plusOne: PlusOne
  guestNames: string
  dietary: string
  note: string
  website: string // honeypot
}

const initial: FormState = {
  name: '',
  attending: '',
  plusOne: '',
  guestNames: '',
  dietary: '',
  note: '',
  website: '',
}

export function Rsvp() {
  const [form, setForm] = useState<FormState>(initial)
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  function validate(): boolean {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Please enter your full name.'
    if (!form.attending) next.attending = 'Please let us know if you can attend.'
    if (form.attending === 'yes' && !form.plusOne) {
      next.plusOne = 'Please tell us if you are bringing a guest.'
    }
    if (form.plusOne === 'yes' && !form.guestNames.trim()) {
      next.guestNames = 'Please include your guest’s name.'
    }
    if (form.attending === 'yes' && !form.dietary.trim()) {
      next.dietary = 'Please share dietary needs, or write “None”.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    // Honeypot filled → pretend success
    if (form.website.trim()) {
      setStatus('success')
      return
    }

    const endpoint = import.meta.env.VITE_RSVP_ENDPOINT as string | undefined
    if (!endpoint) {
      console.warn('VITE_RSVP_ENDPOINT is not set — simulating success for local preview.')
      setStatus('success')
      return
    }

    setStatus('submitting')
    try {
      const payload = {
        name: form.name.trim(),
        attending: form.attending === 'yes' ? 'Yes' : 'No',
        plusOne:
          form.attending === 'no'
            ? ''
            : form.plusOne === 'yes'
              ? 'Yes'
              : 'No',
        guestNames: form.plusOne === 'yes' ? form.guestNames.trim() : '',
        dietary: form.attending === 'yes' ? form.dietary.trim() : '',
        note: form.note.trim(),
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean }
      if (data.ok === false) throw new Error('Script reported failure')
      setStatus('success')
    } catch (err) {
      console.error(err)
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="rsvp page-inner">
        <div className="rsvp__result">
          <h1 className="rsvp__title script">{rsvpCopy.successTitle}</h1>
          <p className="rsvp__result-body">{rsvpCopy.successBody}</p>
          <Link to="/" className="rsvp__back sans-caps">
            ← Go back
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="rsvp page-inner">
      <h1 className="rsvp__title script">{rsvpCopy.title}</h1>

      <form className="rsvp-form" onSubmit={handleSubmit} noValidate>
        <label className="rsvp-form__field">
          <span className="rsvp-form__label sans-caps">Your full name*</span>
          <input
            type="text"
            name="name"
            autoComplete="name"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            aria-invalid={!!errors.name}
          />
          {errors.name ? <span className="rsvp-form__error">{errors.name}</span> : null}
        </label>

        <fieldset className="rsvp-form__fieldset">
          <legend className="rsvp-form__label sans-caps">Will you be attending?*</legend>
          <div className="rsvp-form__choices">
            <ChoiceButton
              selected={form.attending === 'yes'}
              onClick={() => update('attending', 'yes')}
              label="Yes, wouldn't miss it"
            />
            <ChoiceButton
              selected={form.attending === 'no'}
              onClick={() => {
                update('attending', 'no')
                update('plusOne', '')
                update('guestNames', '')
                update('dietary', '')
              }}
              label="Sorry, can't make it"
            />
          </div>
          {errors.attending ? (
            <span className="rsvp-form__error">{errors.attending}</span>
          ) : null}
        </fieldset>

        {form.attending === 'yes' ? (
          <>
            <fieldset className="rsvp-form__fieldset">
              <legend className="rsvp-form__label sans-caps">
                Will you be bringing a guest?*
              </legend>
              <div className="rsvp-form__choices">
                <ChoiceButton
                  selected={form.plusOne === 'yes'}
                  onClick={() => update('plusOne', 'yes')}
                  label="Yes"
                />
                <ChoiceButton
                  selected={form.plusOne === 'no'}
                  onClick={() => {
                    update('plusOne', 'no')
                    update('guestNames', '')
                  }}
                  label="No"
                />
              </div>
              {errors.plusOne ? (
                <span className="rsvp-form__error">{errors.plusOne}</span>
              ) : null}
            </fieldset>

            {form.plusOne === 'yes' ? (
              <label className="rsvp-form__field">
                <span className="rsvp-form__label sans-caps">Guest(s) name*</span>
                <input
                  type="text"
                  name="guestNames"
                  value={form.guestNames}
                  onChange={(e) => update('guestNames', e.target.value)}
                  aria-invalid={!!errors.guestNames}
                />
                {errors.guestNames ? (
                  <span className="rsvp-form__error">{errors.guestNames}</span>
                ) : null}
              </label>
            ) : null}

            <label className="rsvp-form__field">
              <span className="rsvp-form__label sans-caps">
                Dietary restrictions or allergies*
              </span>
              <textarea
                name="dietary"
                rows={3}
                value={form.dietary}
                onChange={(e) => update('dietary', e.target.value)}
                aria-invalid={!!errors.dietary}
                placeholder='e.g. Vegetarian, nut allergy, or "None"'
              />
              {errors.dietary ? (
                <span className="rsvp-form__error">{errors.dietary}</span>
              ) : null}
            </label>
          </>
        ) : null}

        <label className="rsvp-form__field">
          <span className="rsvp-form__label sans-caps">Note (optional)</span>
          <textarea
            name="note"
            rows={2}
            value={form.note}
            onChange={(e) => update('note', e.target.value)}
          />
        </label>

        {/* Honeypot */}
        <label className="hp-field" aria-hidden="true">
          Website
          <input
            type="text"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={form.website}
            onChange={(e) => update('website', e.target.value)}
          />
        </label>

        {status === 'error' ? (
          <p className="rsvp-form__banner rsvp-form__banner--error" role="alert">
            {rsvpCopy.errorBody}
          </p>
        ) : null}

        <button
          type="submit"
          className="rsvp-form__submit sans-caps"
          disabled={status === 'submitting'}
        >
          {status === 'submitting' ? 'Sending…' : rsvpCopy.submitLabel}
        </button>
      </form>

      <Link to="/" className="rsvp__back sans-caps">
        ← Go back
      </Link>
    </div>
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
