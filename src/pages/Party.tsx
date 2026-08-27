import { weddingParty } from '../content'
import './ComingSoon.css'

export function Party() {
  const hasPeople =
    weddingParty.rightHand.length > 0 ||
    weddingParty.bridesmaids.length > 0 ||
    weddingParty.groomsmen.length > 0

  return (
    <div className="coming-soon page-inner">
      <h1 className="coming-soon__title script">{weddingParty.title}</h1>
      {hasPeople ? (
        <p className="coming-soon__body">Party bios will render here.</p>
      ) : (
        <p className="coming-soon__body">{weddingParty.comingSoon}</p>
      )}
    </div>
  )
}
