import { createContext, useContext } from 'react'

export type IntroControls = {
  /** Play the full puppy delivery and envelope intro again. */
  replay: () => void
  /**
   * True while the envelope intro is covering the page. The save-the-date waits
   * on this so it starts drawing as the envelope clears rather than behind it.
   */
  isOpen: boolean
}

export const IntroContext = createContext<IntroControls | null>(null)

export function useIntro(): IntroControls {
  const ctx = useContext(IntroContext)
  if (!ctx) throw new Error('useIntro must be used inside the intro provider')
  return ctx
}
