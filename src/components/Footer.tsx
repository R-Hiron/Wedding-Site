import { couple, wedding } from '../content'
import './Footer.css'

export function Footer() {
  return (
    <footer className="site-footer">
      <p className="site-footer__names serif-caps">{couple.displayNamesCaps}</p>
      <p className="site-footer__date sans-caps">{wedding.dateShort}</p>
    </footer>
  )
}
