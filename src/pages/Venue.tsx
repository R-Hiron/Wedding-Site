import { venue } from '../content'
import './ComingSoon.css'

export function Venue() {
  return (
    <div className="coming-soon page-inner">
      <h1 className="coming-soon__title script">{venue.title}</h1>
      {venue.name ? (
        <>
          <p className="coming-soon__venue-name serif-caps">{venue.name}</p>
          <p className="coming-soon__body">{venue.address}</p>
        </>
      ) : (
        <p className="coming-soon__body">{venue.comingSoon}</p>
      )}
    </div>
  )
}
