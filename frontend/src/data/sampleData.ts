export interface EventAttendee {
  initials: string;
}

export interface SampleEvent {
  id: number;
  title: string;
  date: string;
  status: "Hosting" | "Attending" | "Draft";
  host?: string;
  location: string;
  attendees: string[];
  count: number;
  potluck?: boolean;
  potluckItems?: string;
  emoji?: string;
}

export interface ChatMessage {
  id: number;
  user: string;
  text: string;
  mine: boolean;
  initials: string;
}

export const sampleEvents: SampleEvent[] = [
  {
    id: 1,
    title: "Summer Ending Potluck",
    date: "Oct 24, 2024 • 6:00 PM",
    status: "Hosting",
    location: "123 Maple St",
    attendees: ["JD", "MT", "SJ"],
    count: 12,
    potluck: true,
    potluckItems: "Paper plates, Ice",
  },
  {
    id: 2,
    title: "Sarah's Birthday Bash",
    date: "Tomorrow • 8:00 PM",
    status: "Attending",
    host: "Sarah M.",
    location: "456 Oak Ave",
    attendees: ["SJ", "MT", "JD"],
    count: 8,
    emoji: "🎂",
  },
];

export const sampleMessages: ChatMessage[] = [
  { id: 1, user: "Sarah J.", text: "So excited for this!! 🎉", mine: false, initials: "SJ" },
  { id: 2, user: "Mike T.", text: "I'll bring the potato salad!", mine: false, initials: "MT" },
  { id: 3, user: "You", text: "Can't wait to see everyone 🔥", mine: true, initials: "ME" },
  { id: 4, user: "Jess D.", text: "What time should we actually arrive?", mine: false, initials: "JD" },
];
