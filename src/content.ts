/** All guest-facing copy and section visibility. Edit here — not in components. */

export const couple = {
  partner1: 'Riley',
  partner2: 'Lexi',
  displayNames: 'Riley & Lexi',
  displayNamesCaps: 'RILEY AND LEXI',
} as const

/** Wedding day — October 9, 2027, ceremony at 2:00 pm Newfoundland time. */
export const wedding = {
  /** 2:00 pm NDT (Newfoundland is on daylight time in October). */
  date: new Date('2027-10-09T14:00:00-02:30'),
  dateLabel: 'October 9, 2027',
  dateShort: '09.10.2027',
  /** Shown under the date on the home page. Leave empty to hide the line. */
  location: "St. John's, Newfoundland",
} as const

/**
 * Flip these when you're ready for guests to see each section.
 * Nav and routes respect these flags.
 */
export const visibility = {
  showVenue: true,
  showDetails: true,
  showRsvp: true,
  showFaq: true,
  /** Envelope intro overlay shown on every page load. */
  showEnvelopeIntro: true,
  /**
   * Wedding-day timeline on the home page. Keep this off until the times in
   * `timeline.events` are real — the placeholders below are guesses.
   */
  showTimeline: true,
  /**
   * Relationship scrapbook on the home page. Keep this off until real photos
   * and captions are in place.
   */
  showScrapbook: true,
} as const

export const envelope = {
  title: 'You are invited',
  hint: 'Tap to open',
  /** Initials on the wax seal. */
  initials: 'R & L',
  /** Discreet control on the home page that replays the whole intro. */
  replayLabel: 'Replay invitation',
} as const

export const home = {
  eyebrow: 'The wedding of',
  welcomeTitle: 'You are invited',
  welcomeBody: `We're so glad you're here. This is where you'll find how to RSVP, answers to common questions, and the shape of the day.`,
  signOff: 'With all our love,',
  formalNote: '',
} as const

export type CountdownMilestone = {
  /** Applies when the days remaining are this number or fewer. */
  upToDays: number
  message: string
}

/**
 * Headline above the countdown clock. The wording changes as the wedding
 * approaches. Any message may include `{days}`, which is replaced with the
 * number of whole days remaining.
 */
export const countdown = {
  /** Used while further out than every milestone below. */
  defaultMessage: 'Our forever begins in',

  /**
   * Milestones are checked from the smallest `upToDays` upward, and the first
   * one that still covers the days remaining wins.
   */
  milestones: [
    { upToDays: 0, message: "Today's the day!" },
    { upToDays: 1, message: 'Tomorrow. ❤️' },
    { upToDays: 7, message: 'This week!' },
    { upToDays: 30, message: 'One month to go' },
    { upToDays: 180, message: "It's getting closer..." },
    { upToDays: 365, message: 'Less than a year to go' },
  ] satisfies CountdownMilestone[] as CountdownMilestone[],

  /**
   * Messages for one specific day only. These beat the milestone ranges, so a
   * landmark like day 100 reads correctly instead of being swallowed by the
   * "one month to go" style bands.
   */
  onExactDays: {
    100: '100 days until forever',
  } as Record<number, string>,

  /** Once the ceremony time has passed. */
  afterMessage: 'And so our forever begins.',
} as const

/** Which line-art illustration is drawn beside a timeline milestone. */
export type TimelineIcon =
  | 'arrival'
  | 'ceremony'
  | 'photos'
  | 'cocktails'
  | 'dinner'
  | 'dance'
  | 'party'

export type TimelineEvent = {
  /** Leave empty to show the milestone without a time. */
  time: string
  title: string
  description?: string
  icon: TimelineIcon
}

/**
 * The wedding-day schedule, shown on the home page as a winding illustrated
 * route. Hidden until `visibility.showTimeline` is turned on.
 *
 * Edit the times and wording here. The ceremony, reception start, and dinner
 * match what we know; arrival, photos, and the party time are still loose.
 */
export const timeline = {
  title: 'The Day Ahead',
  intro: 'Here is how the day will unfold, from the first hello to the last dance.',
  /** Optional caveat under the heading. Set to '' once the times are final. */
  note: 'Times are not final yet and may still shift a little.',

  events: [
    {
      time: '1:30 pm',
      title: 'Guests arrive',
      description: 'Come find a seat, sign the guest book, and say hello.',
      icon: 'arrival',
    },
    {
      time: '2:00 pm',
      title: 'Ceremony',
      description: 'The part where we say I do, at Pippy Park Courtyard.',
      icon: 'ceremony',
    },
    {
      time: '3:45 pm',
      title: 'Photos',
      description: 'Photos of the two of us, and anyone who wants to jump in.',
      icon: 'photos',
    },
    {
      time: '5:00 pm',
      title: 'Drinks and snacks',
      description: 'The reception starts at The Hub.',
      icon: 'cocktails',
    },
    {
      time: '6:00 pm',
      title: 'Dinner',
      description: 'Dinner is served around now.',
      icon: 'dinner',
    },
    {
      time: '8:00 pm',
      title: 'Let the party begin',
      description: 'Dancing and celebrating until 2:00 am.',
      icon: 'party',
    },
    
  ] satisfies TimelineEvent[] as TimelineEvent[],
} as const

export type ScrapbookPhoto = {
  /**
   * Matches the source filename in `photos/`, without its extension. So
   * `photos/first-date.jpg` has the slug `first-date`. Slugs with no processed
   * image yet render as an empty frame.
   */
  slug: string
  /** Handwritten caption under the photo. */
  caption: string
  /** Shown small beside the caption. Any format you like. */
  date?: string
  /** Describes the photo for screen readers and if the image fails to load. */
  alt: string
}

/**
 * Photos from throughout our relationship, shown as a scrapbook.
 *
 * To add photos: drop the originals into `photos/`, run `npm run art:photos`,
 * then list them here by slug. Sizes and formats are handled by that script.
 */
export const scrapbook = {
  title: 'Our Story',
  intro: 'A few of our favourite moments on the way to this one.',
  /** Optional caveat under the heading. Set to '' when the photos are real. */
  note: '',
  /** Shown on the frames that have no photo behind them yet. */
  emptyLabel: 'Photo coming soon',

  /** How many photos sit on each page of the book. */
  perPage: 2,

  /** Hint that the book turns as you scroll, shown on the first page. */
  scrollHint: 'Keep scrolling to turn the page',

  /** The last page of the book, after all the photos. */
  closing: {
    line: 'and the next chapter starts',
    date: 'October 9, 2027',
  },

  /** Controls for guests who would rather click than scroll. */
  controls: {
    previous: 'Previous page',
    next: 'Next page',
  },

  photos: [
    {
      slug: 'Christmas_2019',
      caption: 'Christmas',
      date: 'December 25th, 2019',
      alt: 'Christmas photo of Riley and Lexi',
    },
    {
      slug: 'Covid_Highschool',
      caption: 'In Highschool during covid',
      date: 'June 23rd, 2021',
      alt: 'In Highschool during covid photo of Riley and Lexi',
    },
    {
      slug: 'The_Arches_230522',
      caption: 'The Arches',
      date: 'May 23rd, 2022',
      alt: 'The Arches photo of Riley and Lexi',
    },
    {
      slug: 'Grad_23',
      caption: 'Graduation',
      date: 'June 23rd, 2023',
      alt: 'Graduation photo of Riley and Lexi',
    },
    {
      slug: 'Lexis_18_24',
      caption: 'Lexis 19th Birthday',
      date: 'March 23th, 2024',
      alt: 'Lexis 18th Birthday photo of Riley and Lexi',
    },
    {
      slug: 'Kayaking',
      caption: 'Kayaking',
      date: 'July 9th, 2025',
      alt: 'Kayaking photo of Riley and Lexi',
    },
    {
      slug: 'Engaged_Photo',
      caption: 'ENGAGED!',
      date: 'August 22nd, 2026',
      alt: 'Engagement photo of Riley and Lexi',
    },
  ] satisfies ScrapbookPhoto[] as ScrapbookPhoto[],
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
          'Saturday, October 9, 2027. The ceremony is at 2:00 pm Newfoundland time, and the rest of the day is laid out on the home page.',
      },
      {
        question: 'Where is the wedding?',
        answer:
          'The ceremony is at Pippy Park Courtyard, 79 Nagles Place. The reception is at The Hub, 21 Merrymeeting Road. Both are in St. John\'s.',
      },
      {
        question: 'Are kids welcome?',
        answer: 'Yes. Kids are welcome for the whole day.',
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
          'Reach out to Riley or Lexi directly — we\'re happy to help. You can also email us at landrwedding27@gmail.com and we will get back to you as soon as possible.',
      },
      {
        question: 'Can I take photos during the Ceremony?',
        answer:
          'We kindly ask guests to refrain from taking photos during the Ceremony so everyone can remain fully present. Plenty of time for photos after the Ceremony.',
      }
    ],
  },
]

export type DetailCard = {
  title: string
  body: string
}

export const details = {
  title: 'Details',
  intro: 'A few things that are settled. We will add the rest as we lock them in.',
  cards: [
    {
      title: 'Attire',
      body: 'Wear whatever you will feel comfortable celebrating in. We have not set a dress code, and we do not want anyone fussing over one.',
    },
    {
      title: 'Kids',
      body: 'Kids are welcome. We would love to have them with us for the day.',
    },
    {
      title: 'Gifts',
      body: 'If you would like to give a gift, you are welcome to, but please do not feel you have to. Having you there is the part that matters to us.',
    },
    {
      title: 'Getting there',
      body: 'Parking and travel notes will go here once we have sorted them out.',
    },
  ] satisfies DetailCard[] as DetailCard[],
}

export type VenuePlace = {
  label: string
  name: string
  address: string
  when: string
  /** Opens the address in the guest's maps app. */
  mapUrl: string
}

export const venue = {
  title: 'Venue',
  intro: 'The ceremony and the party are in two different spots, both in St. John\'s.',
  places: [
    {
      label: 'Ceremony',
      name: 'Pippy Park Courtyard',
      address: '79 Nagles Place',
      when: '2:00 pm Newfoundland time',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=79+Nagles+Place+St.+Johns+NL',
    },
    {
      label: 'Reception',
      name: 'The Hub',
      address: '21 Merrymeeting Road',
      when: '5:00 pm to 2:00 am, with dinner around 6:00 pm',
      mapUrl:
        'https://www.google.com/maps/search/?api=1&query=21+Merrymeeting+Road+St.+Johns+NL',
    },
  ] satisfies VenuePlace[] as VenuePlace[],
}

/**
 * Everything the RSVP page says.
 *
 * Guests find themselves by name first, so the page has three parts: the name
 * lookup, the reply itself, and a plain form for anyone the list cannot place.
 * The guest list lives in the Google Sheet, never here.
 */
export const rsvpCopy = {
  title: 'Kindly Respond',
  successTitle: 'Thank you!',
  successBody:
    "We've received your response. We can't wait to celebrate with you — or we'll miss you if you can't make it.",
  errorBody:
    'Something went wrong sending your RSVP. Please try again in a moment, or message us directly.',
  backLabel: '← Go back',

  /** Finding yourself on the list. */
  lookup: {
    intro: 'Enter your name and we’ll find you on our list.',
    label: 'Your name',
    placeholder: 'First and last name',
    submitLabel: 'Find me',
    checkingLabel: 'Looking…',
    missing: 'Please enter your name.',
    notFound:
      "We couldn't find that name on our list. Check the spelling, try the name we'd have written on the envelope — or reply below and we'll match you up.",
    /** When a name could be more than one guest. */
    ambiguous:
      'There’s more than one of you on our list! Please enter your first and last name.',
    busy: 'We’re a little busy just now. Please try again in a minute.',
    /** The way out for anyone the list cannot place. */
    noCodeLabel: 'Name not on the list?',
    noCodeBody:
      'We may have written it differently, or spelled it wrong. Reply here and we’ll sort it out.',
    noCodeCta: 'Reply without looking up',
  },

  /** Replying once they have been found. */
  reply: {
    /** `{name}` is replaced with the name on the list. */
    welcome: 'Hello, {name}',
    intro: 'Please let us know if you can join us.',
    /** Shown instead of the intro when they have already replied. */
    amendIntro: 'You’ve replied already — change anything you like and send it again.',
    submitLabel: 'Send my reply',
    updateLabel: 'Update my reply',
    sendingLabel: 'Sending…',
    attendingLabel: 'I can attend',
    notAttendingLabel: 'I can’t attend',
    unanswered: 'Please let us know if you can attend.',
    plusOneLabel: 'Name of the guest you’re bringing',
    plusOneHint: 'You’re welcome to bring a guest. Leave blank if you’d rather not.',
    dietaryLabel: 'Dietary needs or allergies',
    dietaryPlaceholder: 'e.g. Vegetarian, nut allergy, or “None”',
    noteLabel: 'Anything you’d like to tell us (optional)',
    startOver: 'This isn’t me',
  },

  /** The plain form, for guests the list could not place. */
  open: {
    intro:
      'Tell us who you are and we’ll match you up ourselves. If you’re bringing anyone, let us know below.',
    nameLabel: 'Your full name',
    nameMissing: 'Please enter your full name.',
    attendingLabel: 'Will you be attending?',
    attendingYes: "Yes, wouldn't miss it",
    attendingNo: "Sorry, can't make it",
    attendingMissing: 'Please let us know if you can attend.',
    plusOneLabel: 'Bringing anyone with you? (optional)',
    plusOnePlaceholder: 'Their name',
    dietaryLabel: 'Dietary needs or allergies',
    dietaryPlaceholder: 'e.g. Vegetarian, nut allergy, or “None”',
    noteLabel: 'Anything you’d like to tell us (optional)',
    submitLabel: 'Send my reply',
    haveCode: 'Look up my name instead',
  },
} as const
