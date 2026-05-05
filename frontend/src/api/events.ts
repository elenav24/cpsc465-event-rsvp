import { apiFetch } from './client'
import type {
  EventOut,
  MemberOut,
  JoinResult,
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

export function getEvent(uuid: string): Promise<EventOut> {
  return apiFetch('events', `/${uuid}`)
}

export function createEvent(formData: FormData): Promise<EventOut> {
  return apiFetch('events', '', { method: 'POST', body: formData })
}

export function updateEvent(uuid: string, body: Partial<EventOut>): Promise<EventOut> {
  return apiFetch('events', `/${uuid}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteEvent(uuid: string): Promise<void> {
  return apiFetch('events', `/${uuid}`, { method: 'DELETE' })
}

// ── Invite ────────────────────────────────────────────────────────────────────

export function regenerateInvite(eventUuid: string): Promise<EventOut> {
  return apiFetch('events', `/${eventUuid}/invite/regenerate`, { method: 'POST' })
}

export function revokeInvite(eventUuid: string): Promise<EventOut> {
  return apiFetch('events', `/${eventUuid}/invite/revoke`, { method: 'POST' })
}

export function joinViaInvite(token: string, displayName?: string): Promise<JoinResult> {
  const params = displayName ? `?display_name=${encodeURIComponent(displayName)}` : ''
  return apiFetch('events', `/join/${token}${params}`, { method: 'POST' })
}

// ── Members ───────────────────────────────────────────────────────────────────

export function getMembers(eventUuid: string): Promise<MemberOut[]> {
  return apiFetch('events', `/${eventUuid}/members`)
}

export function updateMemberRole(
  eventUuid: string,
  userId: string,
  role: 'co_host' | 'attendee',
): Promise<MemberOut> {
  return apiFetch('events', `/${eventUuid}/members/${userId}/role`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  })
}

export function removeMember(eventUuid: string, userId: string): Promise<void> {
  return apiFetch('events', `/${eventUuid}/members/${userId}`, { method: 'DELETE' })
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export function getRsvps(eventUuid: string): Promise<RSVPOut[]> {
  return apiFetch('events', `/${eventUuid}/rsvps`)
}

export function getMyRsvp(eventUuid: string): Promise<RSVPOut> {
  return apiFetch('events', `/${eventUuid}/rsvps/me`)
}

export function upsertRsvp(
  eventUuid: string,
  status: RSVPStatus,
  guestCount = 0,
): Promise<RSVPOut> {
  return apiFetch('events', `/${eventUuid}/rsvps`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, guest_count: guestCount }),
  })
}

// ── Polls ─────────────────────────────────────────────────────────────────────

export function getPolls(eventUuid: string): Promise<PollOut[]> {
  return apiFetch('events', `/${eventUuid}/polls`)
}

export function createPoll(
  eventUuid: string,
  body: {
    question: string
    options: { text: string; display_order: number }[]
    allow_multi_select?: boolean
    is_anonymous?: boolean
    closes_at?: string | null
  },
): Promise<PollOut> {
  return apiFetch('events', `/${eventUuid}/polls`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function votePoll(
  eventUuid: string,
  pollId: number,
  optionIds: number[],
): Promise<PollOut> {
  return apiFetch('events', `/${eventUuid}/polls/${pollId}/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ option_ids: optionIds }),
  })
}

export function closePoll(eventUuid: string, pollId: number): Promise<PollOut> {
  return apiFetch('events', `/${eventUuid}/polls/${pollId}/close`, { method: 'POST' })
}

export function deletePoll(eventUuid: string, pollId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/polls/${pollId}`, { method: 'DELETE' })
}

// ── Potluck ───────────────────────────────────────────────────────────────────

export function getPotluck(eventUuid: string): Promise<PotluckItemOut[]> {
  return apiFetch('events', `/${eventUuid}/potluck`)
}

export function createPotluckItem(
  eventUuid: string,
  body: { name: string; description?: string; quantity_needed?: number },
): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventUuid}/potluck`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updatePotluckItem(
  eventUuid: string,
  itemId: number,
  body: { name?: string; description?: string; quantity_needed?: number },
): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventUuid}/potluck/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deletePotluckItem(eventUuid: string, itemId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/potluck/${itemId}`, { method: 'DELETE' })
}

export function claimPotluckItem(eventUuid: string, itemId: number): Promise<PotluckItemOut> {
  return apiFetch('events', `/${eventUuid}/potluck/${itemId}/claim`, { method: 'POST' })
}

export function unclaimPotluckItem(eventUuid: string, itemId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/potluck/${itemId}/claim`, { method: 'DELETE' })
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export function getTasks(eventUuid: string): Promise<TaskOut[]> {
  return apiFetch('events', `/${eventUuid}/tasks`)
}

export function createTask(
  eventUuid: string,
  body: { title: string; description?: string; assigned_to?: string; due_date?: string },
): Promise<TaskOut> {
  return apiFetch('events', `/${eventUuid}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function updateTask(
  eventUuid: string,
  taskId: number,
  body: { title?: string; description?: string; assigned_to?: string; due_date?: string; is_completed?: boolean },
): Promise<TaskOut> {
  return apiFetch('events', `/${eventUuid}/tasks/${taskId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

export function deleteTask(eventUuid: string, taskId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/tasks/${taskId}`, { method: 'DELETE' })
}

// ── Announcements ─────────────────────────────────────────────────────────────

export function getAnnouncements(eventUuid: string): Promise<AnnouncementOut[]> {
  return apiFetch('events', `/${eventUuid}/announcements`)
}

export function createAnnouncement(eventUuid: string, body: string): Promise<AnnouncementOut> {
  return apiFetch('events', `/${eventUuid}/announcements`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ body }),
  })
}

export function deleteAnnouncement(eventUuid: string, announcementId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/announcements/${announcementId}`, {
    method: 'DELETE',
  })
}

// ── Reminders ─────────────────────────────────────────────────────────────────

export interface ReminderOut {
  id: number
  event_id: number
  user_id: string
  offset_minutes: number
  created_at: string
}

export function getReminders(eventUuid: string): Promise<ReminderOut[]> {
  return apiFetch('events', `/${eventUuid}/reminders`)
}

export function createReminder(eventUuid: string, offsetMinutes: number): Promise<ReminderOut> {
  return apiFetch('events', `/${eventUuid}/reminders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ offset_minutes: offsetMinutes }),
  })
}

export function deleteReminder(eventUuid: string, reminderId: number): Promise<void> {
  return apiFetch('events', `/${eventUuid}/reminders/${reminderId}`, { method: 'DELETE' })
}
