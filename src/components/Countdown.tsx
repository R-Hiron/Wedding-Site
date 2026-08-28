import { useEffect, useState } from 'react'
import { countdown, wedding } from '../content'
import { resolveCountdownMessage } from '../lib/countdownMessage'
import './Countdown.css'

type Remaining = {
  days: number
  hours: number
  minutes: number
  seconds: number
  done: boolean
}

function getRemaining(target: Date): Remaining {
  const diff = target.getTime() - Date.now()
  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true }
  }
  const seconds = Math.floor(diff / 1000)
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    done: false,
  }
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function Countdown() {
  const [remaining, setRemaining] = useState(() => getRemaining(wedding.date))

  useEffect(() => {
    const id = window.setInterval(() => {
      setRemaining(getRemaining(wedding.date))
    }, 1000)
    return () => window.clearInterval(id)
  }, [])

  const message = resolveCountdownMessage(countdown, remaining.days, remaining.done)

  if (remaining.done) {
    return (
      <section className="countdown" aria-live="polite">
        <p className="countdown__label script">{message}</p>
      </section>
    )
  }

  const units = [
    { label: 'Days', value: remaining.days },
    { label: 'Hours', value: remaining.hours },
    { label: 'Minutes', value: remaining.minutes },
    { label: 'Seconds', value: remaining.seconds },
  ]

  return (
    <section className="countdown" aria-live="polite">
      <p className="countdown__label script">{message}</p>
      <div className="countdown__grid">
        {units.map((unit, i) => (
          <div key={unit.label} className="countdown__unit">
            {i > 0 && (
              <span className="countdown__sep" aria-hidden="true">
                :
              </span>
            )}
            <div className="countdown__block">
              <span className="countdown__value">
                {unit.label === 'Days' ? unit.value : pad(unit.value)}
              </span>
              <span className="countdown__unit-label sans-caps">{unit.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
