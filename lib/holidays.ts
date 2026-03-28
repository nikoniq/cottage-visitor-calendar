export type HolidayItem = {
  id?: string;
  name: string;
  dateRange: string;
  link: string;
  description?: string;
  emoji?: string;
};

export const HOLIDAYS_2026: HolidayItem[] = [
  {
    name: 'SailGP Bermuda',
    dateRange: 'May 9–10, 2026',
    link: 'https://sailgp.com/races/2026/bermuda-sail-grand-prix/overview',
    emoji: '⛵',
    description:
      'SailGP brings elite national teams and high-speed racing to Bermuda waters. It is a lively weekend with strong visitor buzz and packed waterfront spots. Great for guests who enjoy sport and atmosphere. Plan transport and dining early for the best experience.',
  },
  {
    name: 'Bermuda Digital Finance Forum',
    dateRange: 'May 11–14, 2026',
    link: 'https://www.digitalfinanceforum.com/',
    emoji: '💼',
    description:
      'A business-focused week centered on fintech, digital assets, and global policy voices. Hotels, meeting venues, and weekday dining can be busier than usual. Ideal for guests combining business and leisure. Check agenda updates and event access details before arrival.',
  },
  {
    name: 'Bermuda Day Weekend',
    dateRange: 'May 22–24, 2026',
    link: 'https://www.gotobermuda.com/our-island/festivals-holidays/bermuda-day',
    emoji: '🎉',
    description:
      'Bermuda Day weekend celebrates local culture with parade energy and island pride. Streets can be active and community events run through the weekend. A perfect stay window for guests seeking local flavor. Expect high demand around key event areas.',
  },
  {
    name: 'Bermuda Carnival',
    dateRange: 'June 11–15, 2026',
    link: 'https://carnivalinbermuda.com/',
    emoji: '🎭',
    description:
      'Carnival week is colorful, social, and music-led, with multiple events and parties. Visitor traffic rises and many venues operate at full capacity. Best for guests who want a festive and energetic holiday atmosphere. Review event schedules and ticket requirements in advance.',
  },
  {
    name: 'Cup Match',
    dateRange: 'July 29–August 3, 2026',
    link: 'https://www.gotobermuda.com/plan/inspiration/itinerary/the-ultimate-bermuda-cup-match-itinerary-guide',
    emoji: '🏏',
    description:
      'Cup Match is one of Bermuda’s signature summer traditions, mixing cricket, culture, and celebrations. It often creates one of the busiest travel periods of the season. Excellent for guests wanting iconic local experiences. Book dining and activity plans early.',
  },
];
