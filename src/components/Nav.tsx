import { NavLink } from 'react-router-dom'
import { couple, visibility } from '../content'
import './Nav.css'

type NavItem = { to: string; label: string; end?: boolean }

function buildLinks(): NavItem[] {
  const links: NavItem[] = [{ to: '/', label: 'Home', end: true }]
  if (visibility.showVenue) links.push({ to: '/venue', label: 'Venue' })
  if (visibility.showDetails) links.push({ to: '/details', label: 'Details' })
  if (visibility.showWeddingParty) links.push({ to: '/party', label: 'Wedding Party' })
  if (visibility.showFaq) links.push({ to: '/faq', label: 'FAQ' })
  if (visibility.showRsvp) links.push({ to: '/rsvp', label: 'RSVP' })
  return links
}

export function Nav() {
  const links = buildLinks()

  return (
    <header className="site-nav">
      <div className="site-nav__inner">
        <NavLink to="/" className="site-nav__brand sans-caps" end>
          {couple.displayNames}
        </NavLink>
        <nav aria-label="Main">
          <ul className="site-nav__list">
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    `site-nav__link sans-caps${isActive ? ' is-active' : ''}${
                      link.to === '/rsvp' ? ' site-nav__link--rsvp' : ''
                    }`
                  }
                >
                  {link.label}
                  {link.to === '/rsvp' ? ' →' : ''}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  )
}
