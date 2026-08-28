export type CountdownMessageConfig = {
  defaultMessage: string
  milestones: readonly { upToDays: number; message: string }[]
  onExactDays: Record<number, string>
  afterMessage: string
}

/**
 * Picks the countdown headline for a given distance from the wedding.
 *
 * Kept free of imports so it stays a pure function of its inputs.
 *
 * @param config Milestone wording, normally the `countdown` block from content.
 * @param daysRemaining Whole days left, floored. Zero on the wedding day itself.
 * @param isPast True once the ceremony time has passed.
 */
export function resolveCountdownMessage(
  config: CountdownMessageConfig,
  daysRemaining: number,
  isPast: boolean,
): string {
  if (isPast) return config.afterMessage

  const days = Math.max(0, Math.floor(daysRemaining))

  const exact = config.onExactDays[days]
  if (exact) return withDays(exact, days)

  const milestone = [...config.milestones]
    .sort((a, b) => a.upToDays - b.upToDays)
    .find((m) => days <= m.upToDays)

  return withDays(milestone?.message ?? config.defaultMessage, days)
}

function withDays(message: string, days: number): string {
  return message.replace('{days}', String(days))
}
