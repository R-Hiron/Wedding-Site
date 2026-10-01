import { venue } from '../content'
import './GuestPage.css'

export function Venue() {
  return (
    <div className="guest-page page-inner">
      <h1 className="guest-page__title script">{venue.title}</h1>
      <p className="guest-page__intro">{venue.intro}</p>
      <div className="guest-page__cards">
        {venue.places.map((place) => (
          <article key={place.name} className="guest-card">
            <p className="guest-card__label sans-caps">{place.label}</p>
            <h2 className="guest-card__title serif-caps">{place.name}</h2>
            <p className="guest-card__when">{place.when}</p>
            <p className="guest-card__body">{place.address}</p>
            <a
              className="guest-card__link sans-caps"
              href={place.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              Open in maps
            </a>
          </article>
        ))}
      </div>
    </div>
  )
}
