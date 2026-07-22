export type HomeArticle = {
  id: string;
  slug: string;
  title: string;
  imageUrl: string;
  imageAlt: string;
  category: string;
  region: string;
  leftPercentage: number;
  centerPercentage: number;
  rightPercentage: number;
  sourceName: string;
  publishedAt: string;
};

export const mockHomeArticles: HomeArticle[] = [
  {
    id: "1",
    slug: "trump-iran-revised-peace-proposal",
    title: "Trump Sends Iran Revised Peace Proposal With Tougher Terms: Report",
    imageUrl:
      "https://images.unsplash.com/photo-1529107386315-e1a2ed48a620?auto=format&fit=crop&w=800&q=80",
    imageAlt: "United States Capitol building at dusk",
    category: "Politics",
    region: "United States",
    leftPercentage: 20,
    centerPercentage: 31,
    rightPercentage: 49,
    sourceName: "Reuters",
    publishedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "2",
    slug: "iran-nuclear-program-threat",
    title: "Iran's Nuclear Program: A Growing Threat to Global Security",
    imageUrl:
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
    imageAlt: "International diplomatic meeting room",
    category: "World",
    region: "Middle East",
    leftPercentage: 20,
    centerPercentage: 32,
    rightPercentage: 48,
    sourceName: "BBC News",
    publishedAt: "2026-06-01T09:30:00.000Z",
  },
  {
    id: "3",
    slug: "trump-iran-proposal-terms",
    title:
      "Trump Sends Iran a Revised Proposal With Tougher Terms, Report Says",
    imageUrl:
      "https://images.unsplash.com/photo-1560256767-747785652e66?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Press briefing at the White House",
    category: "Politics",
    region: "United States",
    leftPercentage: 21,
    centerPercentage: 34,
    rightPercentage: 45,
    sourceName: "The Guardian",
    publishedAt: "2026-06-01T09:00:00.000Z",
  },
  {
    id: "4",
    slug: "world-cup-2026-opening-matches",
    title: "World Cup 2026 Opening Matches Draw Record Global Viewership",
    imageUrl:
      "https://images.unsplash.com/photo-1574629810360-7abe1a4c948f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Soccer stadium filled with fans",
    category: "Sports",
    region: "Global",
    leftPercentage: 28,
    centerPercentage: 44,
    rightPercentage: 28,
    sourceName: "ESPN",
    publishedAt: "2026-06-01T08:45:00.000Z",
  },
  {
    id: "5",
    slug: "ai-regulation-senate-hearing",
    title: "Senate Panel Opens Hearings on AI Regulation and Safety Standards",
    imageUrl:
      "https://images.unsplash.com/photo-1677442136019-21780ecad995?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Abstract artificial intelligence visualization",
    category: "Artificial Intelligence",
    region: "United States",
    leftPercentage: 35,
    centerPercentage: 40,
    rightPercentage: 25,
    sourceName: "NPR",
    publishedAt: "2026-06-01T08:15:00.000Z",
  },
  {
    id: "6",
    slug: "markets-inflation-data-mixed",
    title:
      "Markets Steady as Investors Weigh Inflation Data and Central Bank Signals",
    imageUrl:
      "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Stock market chart displayed on a screen",
    category: "Business & Markets",
    region: "Global",
    leftPercentage: 22,
    centerPercentage: 46,
    rightPercentage: 32,
    sourceName: "Financial Times",
    publishedAt: "2026-06-01T07:50:00.000Z",
  },
  {
    id: "7",
    slug: "extreme-weather-coastal-flooding",
    title:
      "Extreme Weather Forces Coastal Evacuations as Flood Warnings Expand",
    imageUrl:
      "https://images.unsplash.com/photo-1527482792272-50b221510856?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Storm clouds over a flooded coastal city",
    category: "Extreme Weather",
    region: "United States",
    leftPercentage: 30,
    centerPercentage: 38,
    rightPercentage: 32,
    sourceName: "AP News",
    publishedAt: "2026-06-01T07:20:00.000Z",
  },
  {
    id: "8",
    slug: "health-medicine-vaccine-rollout",
    title: "Health Officials Announce Expanded Vaccine Rollout for Flu Season",
    imageUrl:
      "https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Medical professional preparing a vaccine dose",
    category: "Health & Medicine",
    region: "United States",
    leftPercentage: 33,
    centerPercentage: 42,
    rightPercentage: 25,
    sourceName: "CNN",
    publishedAt: "2026-06-01T06:55:00.000Z",
  },
  {
    id: "9",
    slug: "social-media-platform-policy-changes",
    title: "Major Platforms Announce New Content Policy Changes Amid Scrutiny",
    imageUrl:
      "https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Social media apps on a smartphone screen",
    category: "Social Media",
    region: "Global",
    leftPercentage: 38,
    centerPercentage: 35,
    rightPercentage: 27,
    sourceName: "The Verge",
    publishedAt: "2026-06-01T06:30:00.000Z",
  },
  {
    id: "10",
    slug: "arsenal-fc-title-race",
    title: "Arsenal FC Closes Gap in Title Race After Late Victory",
    imageUrl:
      "https://images.unsplash.com/photo-1574629810360-7abe1a4c948f?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Soccer players celebrating a goal",
    category: "Soccer",
    region: "United Kingdom",
    leftPercentage: 26,
    centerPercentage: 48,
    rightPercentage: 26,
    sourceName: "Sky Sports",
    publishedAt: "2026-06-01T06:00:00.000Z",
  },
  {
    id: "11",
    slug: "ipl-finals-preview",
    title: "IPL Finals Preview: Key Matchups and Player Form Guide",
    imageUrl:
      "https://images.unsplash.com/photo-1531418841129-75b6b6454b33?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Cricket batsman playing a shot in a stadium",
    category: "IPL",
    region: "India",
    leftPercentage: 24,
    centerPercentage: 52,
    rightPercentage: 24,
    sourceName: "Cricinfo",
    publishedAt: "2026-06-01T05:30:00.000Z",
  },
  {
    id: "12",
    slug: "middle-east-ceasefire-talks",
    title: "Middle East Ceasefire Talks Resume With New Mediation Proposal",
    imageUrl:
      "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=800&q=80",
    imageAlt: "Flags of nations at an international summit",
    category: "World",
    region: "Middle East",
    leftPercentage: 25,
    centerPercentage: 36,
    rightPercentage: 39,
    sourceName: "Al Jazeera",
    publishedAt: "2026-06-01T05:00:00.000Z",
  },
];
