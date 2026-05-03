// ─── Types ───────────────────────────────────────────────────

export interface RsvpCounts {
  yes: number
  no: number
  maybe: number
}

export interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  coverImage: string | null
  hostId: string
  hostName: string
  hostAvatar: string | null
  category: string
  isPublic: boolean
  maxAttendees: number
  rsvpCounts: RsvpCounts
  tags: string[]
  createdAt: string
}

export interface ChatMessage {
  id: string
  userId: string
  userName: string
  text: string
  timestamp: string
}

export interface PotluckItem {
  id: string
  name: string
  category: string
  claimedBy: string | null
  claimedById: string | null
}

export interface PollOption {
  id: string
  text: string
  votes: number
}

export interface Poll {
  id: string
  question: string
  options: PollOption[]
  multiSelect: boolean
  endsAt: string
}

export interface MockUser {
  id: string
  name: string
  email: string
}

// ─── Sample Events ───────────────────────────────────────────

export const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'Summer Rooftop Cookout',
    description:
      'Join us for an epic rooftop cookout with grilled food, cold drinks, and great vibes. Bring your appetite and your best playlist suggestions!',
    date: '2026-07-12',
    time: '4:00 PM',
    location: 'The Rooftop at 5th & Main, Austin TX',
    coverImage: null,
    hostId: 'user-1',
    hostName: 'Jordan Lee',
    hostAvatar: null,
    category: 'Social',
    isPublic: true,
    maxAttendees: 40,
    rsvpCounts: { yes: 18, no: 3, maybe: 7 },
    tags: ['cookout', 'rooftop', 'summer'],
    createdAt: '2026-06-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Movie Night: Sci-Fi Marathon',
    description:
      "Three classic sci-fi films back to back. We're voting on the lineup — cast your vote! Popcorn and snacks provided, bring a blanket.",
    date: '2026-07-19',
    time: '7:00 PM',
    location: '42 Elm Street, Brooklyn NY',
    coverImage: null,
    hostId: 'user-2',
    hostName: 'Sam Rivera',
    hostAvatar: null,
    category: 'Entertainment',
    isPublic: true,
    maxAttendees: 20,
    rsvpCounts: { yes: 12, no: 1, maybe: 4 },
    tags: ['movies', 'sci-fi', 'indoor'],
    createdAt: '2026-06-10T14:00:00Z',
  },
  {
    id: '3',
    title: 'Friendsgiving Potluck',
    description:
      "Our annual Friendsgiving! Sign up for a dish to bring. We'll have a full potluck spread — mains, sides, and desserts. All are welcome.",
    date: '2026-11-21',
    time: '2:00 PM',
    location: '88 Oak Ave, Chicago IL',
    coverImage: null,
    hostId: 'user-3',
    hostName: 'Alex Kim',
    hostAvatar: null,
    category: 'Food & Drink',
    isPublic: false,
    maxAttendees: 30,
    rsvpCounts: { yes: 22, no: 2, maybe: 5 },
    tags: ['potluck', 'thanksgiving', 'food'],
    createdAt: '2026-10-01T09:00:00Z',
  },
  {
    id: '4',
    title: 'Hiking Trip: Blue Ridge Trail',
    description:
      "A moderate 8-mile hike through the Blue Ridge Mountains. We'll carpool from the city. Bring water, snacks, and good shoes!",
    date: '2026-08-02',
    time: '7:30 AM',
    location: 'Blue Ridge Parkway Trailhead, VA',
    coverImage: null,
    hostId: 'user-1',
    hostName: 'Jordan Lee',
    hostAvatar: null,
    category: 'Outdoors',
    isPublic: true,
    maxAttendees: 15,
    rsvpCounts: { yes: 9, no: 0, maybe: 3 },
    tags: ['hiking', 'outdoors', 'nature'],
    createdAt: '2026-06-20T11:00:00Z',
  },
  {
    id: '5',
    title: 'Game Night Extravaganza',
    description:
      "Board games, card games, and video games all night long. We've got Catan, Codenames, and more. Bring your favorite game to add to the mix!",
    date: '2026-07-25',
    time: '6:00 PM',
    location: '15 Pine Street, Seattle WA',
    coverImage: null,
    hostId: 'user-4',
    hostName: 'Taylor Nguyen',
    hostAvatar: null,
    category: 'Social',
    isPublic: true,
    maxAttendees: 25,
    rsvpCounts: { yes: 14, no: 2, maybe: 6 },
    tags: ['games', 'board games', 'fun'],
    createdAt: '2026-06-15T16:00:00Z',
  },
  {
    id: '6',
    title: "Backyard Birthday Bash",
    description:
      "Celebrating Casey's 30th! Come ready to party. There will be a DJ, lawn games, and a taco bar. RSVP so we have enough food!",
    date: '2026-08-15',
    time: '5:00 PM',
    location: '200 Maple Drive, Denver CO',
    coverImage: null,
    hostId: 'user-5',
    hostName: 'Casey Morgan',
    hostAvatar: null,
    category: 'Celebration',
    isPublic: false,
    maxAttendees: 60,
    rsvpCounts: { yes: 35, no: 5, maybe: 10 },
    tags: ['birthday', 'party', 'celebration'],
    createdAt: '2026-07-01T12:00:00Z',
  },
]

// ─── Sample Chat Messages ────────────────────────────────────

export const sampleMessages: Record<string, ChatMessage[]> = {
  '1': [
    {
      id: 'm1',
      userId: 'user-2',
      userName: 'Sam Rivera',
      text: "So excited for this! Should I bring anything specific?",
      timestamp: '2026-07-10T14:22:00Z',
    },
    {
      id: 'm2',
      userId: 'user-1',
      userName: 'Jordan Lee',
      text: "Just bring yourself and good vibes! We've got the food covered 🎉",
      timestamp: '2026-07-10T14:35:00Z',
    },
    {
      id: 'm3',
      userId: 'user-3',
      userName: 'Alex Kim',
      text: "Can't wait! Is there parking nearby?",
      timestamp: '2026-07-10T15:00:00Z',
    },
    {
      id: 'm4',
      userId: 'user-1',
      userName: 'Jordan Lee',
      text: "There's a garage on 4th St, about a 2 min walk. Street parking is also free after 6pm!",
      timestamp: '2026-07-10T15:10:00Z',
    },
  ],
  '2': [
    {
      id: 'm5',
      userId: 'user-4',
      userName: 'Taylor Nguyen',
      text: 'I voted for Blade Runner 2049 — classic choice',
      timestamp: '2026-07-15T20:00:00Z',
    },
    {
      id: 'm6',
      userId: 'user-2',
      userName: 'Sam Rivera',
      text: 'Interstellar has to be on the list!',
      timestamp: '2026-07-15T20:15:00Z',
    },
  ],
}

// ─── Sample Potluck Items ────────────────────────────────────

export const samplePotluckItems: PotluckItem[] = [
  { id: 'p1', name: 'Turkey', category: 'Main', claimedBy: 'Alex Kim', claimedById: 'user-3' },
  { id: 'p2', name: 'Mashed Potatoes', category: 'Side', claimedBy: null, claimedById: null },
  { id: 'p3', name: 'Green Bean Casserole', category: 'Side', claimedBy: 'Sam Rivera', claimedById: 'user-2' },
  { id: 'p4', name: 'Cranberry Sauce', category: 'Side', claimedBy: null, claimedById: null },
  { id: 'p5', name: 'Pumpkin Pie', category: 'Dessert', claimedBy: 'Taylor Nguyen', claimedById: 'user-4' },
  { id: 'p6', name: 'Apple Cider', category: 'Drinks', claimedBy: null, claimedById: null },
]

// ─── Sample Poll ─────────────────────────────────────────────

export const samplePoll: Poll = {
  id: 'poll-1',
  question: 'Which movies should we watch?',
  options: [
    { id: 'o1', text: 'Blade Runner 2049', votes: 8 },
    { id: 'o2', text: 'Interstellar', votes: 11 },
    { id: 'o3', text: 'Arrival', votes: 6 },
    { id: 'o4', text: 'The Martian', votes: 4 },
  ],
  multiSelect: true,
  endsAt: '2026-07-17T23:59:00Z',
}

// ─── Event Categories ────────────────────────────────────────

export const eventCategories: string[] = [
  'Social',
  'Food & Drink',
  'Entertainment',
  'Outdoors',
  'Sports',
  'Arts & Culture',
  'Celebration',
  'Education',
  'Other',
]

// ─── Current User (mock) ─────────────────────────────────────

export const mockCurrentUser: MockUser = {
  id: 'user-me',
  name: 'You',
  email: 'you@example.com',
}
