import { useState } from 'react'
import type { ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { EnvelopeIntro } from './components/EnvelopeIntro'
import { Layout } from './components/Layout'
import { Home } from './pages/Home'
import { Faq } from './pages/Faq'
import { Rsvp } from './pages/Rsvp'
import { Details } from './pages/Details'
import { Venue } from './pages/Venue'
import { Party } from './pages/Party'
import { visibility } from './content'

function Gated({
  allowed,
  children,
}: {
  allowed: boolean
  children: ReactNode
}) {
  if (!allowed) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const [introDone, setIntroDone] = useState(!visibility.showEnvelopeIntro)

  return (
    <BrowserRouter>
      {!introDone ? <EnvelopeIntro onFinish={() => setIntroDone(true)} /> : null}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route
            path="faq"
            element={
              <Gated allowed={visibility.showFaq}>
                <Faq />
              </Gated>
            }
          />
          <Route
            path="rsvp"
            element={
              <Gated allowed={visibility.showRsvp}>
                <Rsvp />
              </Gated>
            }
          />
          <Route
            path="details"
            element={
              <Gated allowed={visibility.showDetails}>
                <Details />
              </Gated>
            }
          />
          <Route
            path="venue"
            element={
              <Gated allowed={visibility.showVenue}>
                <Venue />
              </Gated>
            }
          />
          <Route
            path="party"
            element={
              <Gated allowed={visibility.showWeddingParty}>
                <Party />
              </Gated>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
