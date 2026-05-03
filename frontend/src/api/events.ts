import { apiFetch } from './client'
import type {
  EventOut,
  MemberOut,
  RSVPOut,
  RSVPStatus,
  PollOut,
  PotluckItemOut,
  TaskOut,
  AnnouncementOut,
} from './types'

// ── Events ────────────────────────────────────────────────────────────────────
// Base URL already ends in /events, so paths here are relative to that.

export function getMyEvents(): Promise<EventOut[]> {
  return apiFetch('events', '')
}

export function getEvent(id: number): Promise<EventOut> {
  return apiFetch('events', `/${id}`)
}

export function createEvent(formData: FormData): Promise<EventOut> {
  return apiFetch('events', '', { method: 'POST', body: formData })
}

export function updateEvent(id: number, body: Partial<EventOut>): Promise<EventOut> {
  return apiFetch('events', `/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteEvent(id: number): Promise<void> {
  return apiFetch('events', `/${id}`, { method: 'DELETE' })
}

// ── Invite ────────────────────────────────────────────────────────────────────

export function regenerateInvite(eventId: number): Promise<EventOut> {
  return apiFetch('events', `/${eventId}/invite/regenerate`, { method: 'POST' })
}

export function revokeInvite(eventId: number): Promise<EventOut> {
  return apiFetch('events', `/${eventId}/invite/revoke`, { method: 'POST' })
}

export function joinViaInvite(token: string): Promise<MemberOut> {
  return apiFetch('events', `/join/${token}`, { method: 'POST' })
}

// ── Members ───────────────────────────────────────────────────────────────────

export function getMembers(eventId: number): Promise<MemberOut[]> {
  return apiFetch('events', `/${eventId}/members`)
}

export function updateMemberRole(
  eventId: number,
  userId: string,
  role: 'co_host' | 'attendee',
): Promise<MemberOut> {
  return apiFetch('events', `/${eventId}/members/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
}

export function removeMember(eventId: number, userId: string): Promise<void> {
  return apiFetch('events', `/${eventId}/members/${userId}`, { method: 'DELETE' })
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export function getRsvps(eventId: number): Promise<RSVPOut[]> {
  return apiFetch('events', `/${eventId}/rsvps`)
}

export function getMyRsvp(eventId: number): Promise<RSVPOut> {
  return apiFetch('events', `/${eventId}/rsvps/me`)
}

export function upsertRsvp(
  eventId: number,
  status: RSVPStatus,
  guestCount = 0,
): Promise<RSVPOut> {
  return apiFetch('events', `/${eventId}/rsvps`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, guest_count: guestCount }),
  })
}

// ── Polls ─────────────────────────────────────────────────────────────────────

export function getPolls(eventId: number): Promise<PollOut[]> {
  return apiFetch('events', `/${eventId}/polls`)
}

export function createPoll(
  eventId: number,
  body: {
    question: string
    options: { text: string; display_order: number }[]
    allow_multi_select?: boolean
    is_anonymous?: boolean
    closes_at?: string | null
  },
): Promise<PollOut> {
  return apiFetch('events', `/${eventId}/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function votePoll(
  eventId: number,
  pollId: number,
  optionIds: number[],
): Promise<PollOut> {
  return apiFetch('events', `/${eventId}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ option_ids: optionIds }),
  })
}

export function closePoll(eventId: number, pollId: number): Promise<PollOut> {
  return apiFetch('events', `/${eventId}/polls/${pollId}/close`, { method: 'POST' })
}

export function deletePoll(eventId: number, pollId: number): Promise<void> {
  return apiFetch('events', `/${eventId}/polls/${pollId}`, { method: 'DELETE' })
}

// ── Potluck ───────────────────────────────────────────────────────────────────

export function getPotluck(eventId: number): Promise<PotluckItemOut[]> {
  return apiFetch('events', `/${eventId}/potluck`)
}

export function createPotluckItem(
  eventId: number,
  body: { name: string; description?: string; quantity_needed?: number },
): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventId}/potluck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updatePotluckItem(
  eventId: number,
  itemId: number,
  body: { name?: string; description?: string; quantity_needed?: number },
): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventId}/potluck/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deletePotluckItem(eventId: number, itemId: number): Promise<void> {
  return apiFetch('events', `/${eventId}/potluck/${itemId}`, { method: 'DELETE' })
}

export function claimPotluckItem(eventId: number, itemId: number): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventId}/potluck/${itemId}/claim`, { method: 'POST' })
}

export function unclaimPotluckItem(eventId: number, itemId: number): Promise<void> {
  return apiFetch('events', `/${eventId}/potluck/${itemId}/claim`, { method: 'DELETE' })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function getTasks(eventId: number): Promise<TaskOut[]> {
  return apiFetch('events', `/${eventId}/tasks`)
}

export function createTask(
  eventId: number,
  body: { title: string; description?: string; assigned_to?: string; due_date?: string },
): Promise<TaskOut> {
  return apiFetch('events', `/${eventId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateTask(
  eventId: number,
  taskId: number,
  body: { title?: string; description?: string; assigned_to?: string; due_date?: string; is_completed?: boolean },
): Promise<TaskOut> {
  return apiFetch('events', `/${eventId}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteTask(eventId: number, taskId: number): Promise<void> {
  return apiFetch('events', `/${eventId}/tasks/${taskId}`, { method: 'DELETE' })
}

// ── Announcements ─────────────────────────────────────────────────────────────

export function getAnnouncements(eventId: number): Promise<AnnouncementOut[]> {
  return apiFetch('events', `/${eventId}/announcements`)
}

export function createAnnouncement(eventId: number, body: string): Promise<AnnouncementOut> {
  return apiFetch('events', `/${eventId}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
}

export function deleteAnnouncement(eventId: number, announcementId: number): Promise<void> {
  return apiFetch('events', `/${eventId}/announcements/${announcementId}`, {
    method: 'DELETE',
  })
}
