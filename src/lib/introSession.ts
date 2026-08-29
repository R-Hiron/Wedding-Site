const KEY = 'rl-invitation-seen'
const CARD_KEY = 'rl-card-drawn'

/**
 * Whether the envelope intro has already played in this browsing session.
 * Wrapped in try/catch because sessionStorage throws in some private modes.
 */
export function hasSeenIntro(): boolean {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

export function markIntroSeen(): void {
  try {
    window.sessionStorage.setItem(KEY, '1')
  } catch {
    // Nothing to do: the intro simply plays again next navigation.
  }
}

/**
 * Whether the save-the-date has already drawn itself this session, so it does
 * not redraw on every navigation back to the home page.
 */
export function hasDrawnCard(): boolean {
  try {
    return window.sessionStorage.getItem(CARD_KEY) === '1'
  } catch {
    return false
  }
}

export function markCardDrawn(): void {
  try {
    window.sessionStorage.setItem(CARD_KEY, '1')
  } catch {
    // Nothing to do: the card simply draws again next navigation.
  }
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
