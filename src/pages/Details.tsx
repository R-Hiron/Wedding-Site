import { details } from '../content'
import './ComingSoon.css'

export function Details() {
  return (
    <div className="coming-soon page-inner">
      <h1 className="coming-soon__title script">{details.title}</h1>
      {details.schedule.length === 0 ? (
        <p className="coming-soon__body">{details.comingSoon}</p>
      ) : (
        <ul className="coming-soon__schedule">
          {details.schedule.map((item) => (
            <li key={item.time + item.event}>
              <span className="sans-caps">{item.time}</span>
              <span>{item.event}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
