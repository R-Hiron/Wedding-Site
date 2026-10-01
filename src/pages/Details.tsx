import { details } from '../content'
import './GuestPage.css'

export function Details() {
  return (
    <div className="guest-page page-inner">
      <h1 className="guest-page__title script">{details.title}</h1>
      <p className="guest-page__intro">{details.intro}</p>
      <div className="guest-page__cards">
        {details.cards.map((card) => (
          <article key={card.title} className="guest-card">
            <h2 className="guest-card__title serif-caps">{card.title}</h2>
            <p className="guest-card__body">{card.body}</p>
          </article>
        ))}
      </div>
    </div>
  )
}
