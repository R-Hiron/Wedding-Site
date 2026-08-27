import { Link } from 'react-router-dom'
import { couple, wedding, home, visibility } from '../content'
import { Countdown } from '../components/Countdown'
import { FloralCorners } from '../components/FloralCorners'
import './Home.css'

export function Home() {
  return (
    <div className="home">
      <section className="home-hero">
        <FloralCorners />
        <p className="home-hero__eyebrow sans-caps">{home.eyebrow}</p>
        <h1 className="home-hero__names script">{couple.displayNames}</h1>
        <p className="home-hero__date serif-caps">{wedding.dateLabel}</p>
        {wedding.location ? (
          <p className="home-hero__location sans-caps">{wedding.location}</p>
        ) : null}
        <img
          className="home-hero__art"
          src="/images/save-the-date.png"
          alt="Line drawing of Riley and Lexi's pets around a champagne tower — save the date"
        />
        <p className="home-hero__formal sans-caps">{home.formalNote}</p>
      </section>

      <section className="home-welcome">
        <FloralCorners className="home-welcome__corners" />
        <h2 className="home-welcome__title script">{home.welcomeTitle}</h2>
        <p className="home-welcome__body">{home.welcomeBody}</p>
        <p className="home-welcome__signoff script">
          {home.signOff}
          <br />
          {couple.partner1} and {couple.partner2}
        </p>
        {visibility.showRsvp ? (
          <Link to="/rsvp" className="home-welcome__cta sans-caps">
            RSVP →
          </Link>
        ) : null}
      </section>

      <Countdown />
    </div>
  )
}
