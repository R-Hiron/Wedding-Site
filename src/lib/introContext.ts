import { createContext, useContext } from 'react'

export type IntroControls = {
  /** Play the full puppy delivery and envelope intro again. */
  replay: () => void
}

export const IntroContext = createContext<IntroControls | null>(null)

export function useIntro(): IntroControls {
  const ctx = useContext(IntroContext)
  if (!ctx) throw new Error('useIntro must be used inside the intro provider')
  return ctx
}
