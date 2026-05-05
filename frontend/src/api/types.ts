/**
 * TypeScript types mirroring the backend Pydantic schemas.
 */

// ── Events ────────────────────────────────────────────────────────────────────

export interface EventOut {
  id: number
  uuid: string
  title: string
  /** monolith uses integer DB id; services use cognito sub string — accept both */
  host_id: number | string
  description: string | null
  location: string | null
  flyer_url: string | null
  start_dt: string | null
  end_dt: string | null
  // fields only present on the new events service:
  recurrence_rule?: string | null
  recurrence_end_dt?: string | null
  parent_event_id?: number | null
  invite_token?: string | null
  invite_active?: boolean
  viewable_by_link?: boolean
  created_at: string
}

export interface MemberOut {
  id: number
  event_id: number
  user_id: string
  role: 'host' | 'co_host' | 'attendee'
  display_name: string | null
  joined_at: string
}

export interface JoinResult {
  id: number
  event_id: number
  event_uuid: string
  user_id: string
  role: 'host' | 'co_host' | 'attendee'
  joined_at: string
}

// ── RSVPs ─────────────────────────────────────────────────────────────────────

export type RSVPStatus = 'yes' | 'no' | 'maybe'

export interface RSVPOut {
  id: number
  event_id: number
  user_id: string
  status: RSVPStatus
  guest_count: number
  updated_at: string
}

// ── Polls ─────────────────────────────────────────────────────────────────────

export interface PollOptionOut {
  id: number
  text: string
  display_order: number
  vote_count: number
}

export interface PollVoteOut {
  option_id: number
  voter_id: string | null
}

export interface PollOut {
  id: number
  event_id: number
  created_by: string
  question: string
  allow_multi_select: boolean
  is_anonymous: boolean
  is_closed: boolean
  closes_at: string | null
  created_at: string
  options: PollOptionOut[]
  votes: PollVoteOut[]
}

// ── Potluck ───────────────────────────────────────────────────────────────────

export interface PotluckClaimOut {
  id: number
  item_id: number
  user_id: string
  claimed_at: string
}

export interface PotluckItemOut {
  id: number
  event_id: number
  created_by: string
  name: string
  description: string | null
  quantity_needed: number
  claims_count: number
  claims: PotluckClaimOut[]
  created_at: string
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export interface TaskOut {
  id: number
  event_id: number
  created_by: string
  title: string
  description: string | null
  assigned_to: string | null
  due_date: string | null
  is_completed: boolean
  created_at: string
}

// ── Announcements ─────────────────────────────────────────────────────────────

export interface AnnouncementOut {
  id: number
  event_id: number
  author_id: string
  body: string
  sms_sent: boolean
  created_at: string
}

// ── Users ─────────────────────────────────────────────────────────────────────

export interface UserOut {
  id: number
  cognito_sub: string
  email: string | null
  display_name: string | null
  phone_number: string | null
  sms_opted_in: boolean
  created_at: string
}
