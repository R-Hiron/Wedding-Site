/** All guest-facing copy and section visibility. Edit here — not in components. */

export const couple = {
  partner1: 'Riley',
  partner2: 'Lexi',
  displayNames: 'Riley & Lexi',
  displayNamesCaps: 'RILEY AND LEXI',
} as const

/** Wedding day — October 2, 2027 (matches save-the-date 02.10.2027) */
export const wedding = {
  date: new Date('2027-10-02T15:00:00'),
  dateLabel: 'October 2, 2027',
  dateShort: '02.10.2027',
  /** Leave empty until venue is decided — Home will not show a location line. */
  location: '',
} as const

/**
 * Flip these when you're ready for guests to see each section.
 * Nav and routes respect these flags.
 */
export const visibility = {
  showVenue: false,
  showDetails: false,
  showWeddingParty: false,
  showRsvp: true,
  showFaq: true,
  /** Envelope intro overlay shown on every page load. */
  showEnvelopeIntro: true,
} as const

export const envelope = {
  title: 'You are invited',
  hint: 'Tap to open',
  /** Initials on the wax seal. */
  initials: 'R & L',
} as const

export const home = {
  eyebrow: 'The wedding of',
  welcomeTitle: 'You are invited',
  welcomeBody: `We're so glad you're here. This little corner of the internet is where you'll find everything you need for our wedding day — how to RSVP, answers to common questions, and (soon) all the details once we've locked them in.`,
  signOff: 'With all our love,',
  formalNote: '',
  countdownLabel: 'Our forever begins in',
} as const

export type FaqItem = { question: string; answer: string }

export type FaqSection = {
  title: string
  items: FaqItem[]
}

export const faq: FaqSection[] = [
  {
    title: 'General',
    items: [
      {
        question: 'When is the wedding?',
        answer:
          'Saturday, October 2, 2027 (02.10.2027). Ceremony time and the full schedule will be shared once details are finalized.',
      },
      {
        question: 'Where is the wedding?',
        answer:
          "We'll announce the venue here as soon as we've decided. Check back later — this page will update when we know!",
      },
    ],
  },
  {
    title: 'RSVP & invitations',
    items: [
      {
        question: 'How do I RSVP?',
        answer:
          'Please RSVP through this website using the RSVP page. It only takes a minute.',
      },
      {
        question: 'Can I bring a plus-one?',
        answer:
          'If your invitation includes a guest, you can note that on the RSVP form. When in doubt, ask us!',
      },
    ],
  },
  {
    title: 'Other',
    items: [
      {
        question: 'Who can I contact with questions?',
        answer:
          'Reach out to Riley or Lexi directly — we\'re happy to help. you can also Email us at landrwedding27@gmail.com and we will get back to you as soon as possible.',
      },
      {
        question: 'Can I take photos during the Ceremony?',
        answer:
          'We kindly as guests to refrain from taking photos during the Ceremony so everyone can remain fully present. Plenty of time for photos after the Ceremony.',
      }
    ],
  },
]

export const details = {
  title: 'Details',
  comingSoon:
    'The day-of schedule, attire, and logistics will appear here once everything is set.',
  schedule: [] as { time: string; event: string }[],
}

export const venue = {
  title: 'Venue',
  comingSoon:
    "We're still choosing the perfect spot. The address, map, and travel tips will live here soon.",
  name: '',
  address: '',
}

export type PartyMember = {
  name: string
  role: string
  bio: string
  photo?: string
}

export const weddingParty = {
  title: 'Wedding Party',
  comingSoon:
    'Meet the people standing with us — photos and introductions coming soon.',
  rightHand: [] as PartyMember[],
  bridesmaids: [] as PartyMember[],
  groomsmen: [] as PartyMember[],
}

export const rsvpCopy = {
  title: 'Kindly Respond',
  submitLabel: 'RSVP',
  successTitle: 'Thank you!',
  successBody:
    "We've received your response. We can't wait to celebrate with you — or we'll miss you if you can't make it.",
  errorBody:
    'Something went wrong sending your RSVP. Please try again in a moment, or message us directly.',
}
