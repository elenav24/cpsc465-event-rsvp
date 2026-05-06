import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { marked } from 'marked'
import {
  FiCalendar, FiRepeat, FiLink, FiMapPin, FiStar,
  FiCheck, FiX,
} from 'react-icons/fi'
import { BsStars } from 'react-icons/bs'
import { useParams, useNavigate } from 'react-router-dom'
import './EventPage.css'
import { useAuth } from '../auth/AuthContext'
import {
  getEvent, getMembers, getMyRsvp, upsertRsvp, getRsvps,
  getPolls, createPoll, votePoll, closePoll, deletePoll,
  getPotluck, createPotluckItem, claimPotluckItem, unclaimPotluckItem, deletePotluckItem,
  getTasks, createTask, updateTask, deleteTask,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  regenerateInvite, updateEvent, revokeInvite,
  askAi,
} from '../api/events'
import type { AiMessage } from '../api/events'
import { EventChatSocket } from '../api/chat'
import type { EventUpdate } from '../api/chat'
import type {
  EventOut, MemberOut, RSVPOut, PollOut, PotluckItemOut,
  TaskOut, AnnouncementOut, RSVPStatus
} from '../api/types'
import type { WsMessage } from '../api/chat'

function formatDate(dt: string | null): string {
  if (!dt) return 'Date TBD'
  const d = new Date(dt)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
    ' \u2022 ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

// ── Chat Panel (right column) ─────────────────────────────────────────────────
function ChatPanel({ eventId, myId, myName, token, onMessagesChange, onEventUpdate }: {
  eventId: string; myId: string; myName: string; token: string
  onMessagesChange?: (msgs: WsMessage[]) => void
  onEventUpdate?: (update: import('../api/chat').EventUpdate) => void
}) {
  const [messages, setMessages] = useState<WsMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<EventChatSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    const socket = new EventChatSocket({
      eventId, token, senderId: myId, senderName: myName,
      onMessage: (msg) => setMessages(prev => {
        const next = [...prev, msg]; onMessagesChange?.(next); return next
      }),
      onHistory: (msgs) => { setMessages(msgs); onMessagesChange?.(msgs) },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onEventUpdate,
    })
    socketRef.current = socket
    return () => socket.close()
  }, [eventId, token, myId, myName])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = () => {
    const text = input.trim(); if (!text) return
    socketRef.current?.sendMessage(text); setInput('')
  }

  return (
    <div className="ep-chat-panel">
      {!connected && (
        <div className="ep-chat-connecting">Connecting to chat…</div>
      )}
      <div className="ep-chat-messages">
        {messages.length === 0 && (
          <div className="ep-chat-empty">No messages yet. Start the conversation!</div>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myId
          return (
            <div key={msg.id} className={`ep-chat-msg${mine ? ' mine' : ''}`}>
              <div className="ep-chat-avatar">{getInitials(msg.sender_name)}</div>
              <div className="ep-chat-bubble">
                <div className="ep-chat-name">{mine ? 'You' : msg.sender_name}</div>
                <div className="ep-chat-text">{msg.content}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="ep-chat-input-row">
        <input
          className="ep-chat-input"
          placeholder="Chat with guests…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          maxLength={500}
        />
        <button className="ep-send-btn ep-send-btn--pink" onClick={send} aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Polls Tab ─────────────────────────────────────────────────────────────────
function PollsTab({ eventUuid, myId, isHost, version }: { eventUuid: string; myId: string; isHost: boolean; version: number }) {
  const [polls, setPolls] = useState<PollOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [multiSelect, setMultiSelect] = useState(false)
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [closesAt, setClosesAt] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getPolls(eventUuid).then(setPolls).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])
  useEffect(() => { load() }, [load])
  // Re-fetch when a remote update arrives
  useEffect(() => { if (version > 0) load() }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (pollId: number, optionId: number, multi: boolean, currentVotes: number[]) => {
    const ids = multi
      ? currentVotes.includes(optionId) ? currentVotes.filter(id => id !== optionId) : [...currentVotes, optionId]
      : [optionId]
    try {
      const updated = await votePoll(eventUuid, pollId, ids)
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p))
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Vote failed') }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) { setError('Need at least 2 options'); return }
    setSaving(true)
    try {
      const poll = await createPoll(eventUuid, {
        question, options: validOptions.map((text, i) => ({ text, display_order: i })),
        allow_multi_select: multiSelect, is_anonymous: isAnonymous,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      })
      setPolls(prev => [...prev, poll])
      setShowCreate(false); setQuestion(''); setOptions(['', ''])
      setMultiSelect(false); setIsAnonymous(false); setClosesAt('')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed to create poll') }
    finally { setSaving(false) }
  }

  const handleClose = async (pollId: number) => {
    try { const u = await closePoll(eventUuid, pollId); setPolls(prev => prev.map(p => p.id === pollId ? u : p)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }
  const handleDelete = async (pollId: number) => {
    try { await deletePoll(eventUuid, pollId); setPolls(prev => prev.filter(p => p.id !== pollId)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  if (loading) return <div className="ep-tab-loading">Loading polls…</div>

  return (
    <div className="ep-tab-body">
      {error && <div className="ep-tab-error">{error}</div>}
      {isHost && !showCreate && (
        <button className="ep-btn-primary" onClick={() => setShowCreate(true)}>+ Create Poll</button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="ep-create-form">
          <div className="ep-create-form-title">New Poll</div>
          <input className="ep-field" placeholder="Question…" value={question} onChange={e => setQuestion(e.target.value)} required />
          {options.map((opt, i) => (
            <input key={i} className="ep-field" placeholder={`Option ${i + 1}`} value={opt}
              onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))} />
          ))}
          <button type="button" className="ep-link-btn" onClick={() => setOptions(prev => [...prev, ''])}>+ Add option</button>
          <label className="ep-checkbox-label">
            <input type="checkbox" checked={multiSelect} onChange={e => setMultiSelect(e.target.checked)} />
            Allow multiple selections
          </label>
          <label className="ep-checkbox-label">
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            Anonymous voting
          </label>
          <div>
            <label className="ep-field-label">Auto-close at (optional)</label>
            <input type="datetime-local" value={closesAt} onChange={e => setClosesAt(e.target.value)} className="ep-field" style={{ width: 'auto' }} />
          </div>
          <div className="ep-form-actions">
            <button type="submit" disabled={saving} className="ep-btn-primary">{saving ? 'Creating…' : 'Create'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="ep-btn-ghost">Cancel</button>
          </div>
        </form>
      )}
      {polls.length === 0 && !showCreate && (
        <div className="ep-tab-empty">No polls yet.{isHost ? ' Create one above!' : ''}</div>
      )}
      {polls.map(poll => {
        const myVotes = poll.votes.filter(v => v.voter_id === myId).map(v => v.option_id)
        const totalVotes = poll.options.reduce((s, o) => s + o.vote_count, 0)
        return (
          <div key={poll.id} className="ep-card">
            <div className="ep-poll-question">
              {poll.question}
              {poll.is_closed && <span className="ep-badge ep-badge--gray">Closed</span>}
              {poll.is_anonymous && <span className="ep-badge ep-badge--purple">Anonymous</span>}
            </div>
            {poll.closes_at && !poll.is_closed && (
              <div className="ep-meta">Closes: {new Date(poll.closes_at).toLocaleString()}</div>
            )}
            {poll.options.map(opt => {
              const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0
              const voted = myVotes.includes(opt.id)
              return (
                <div key={opt.id} className={`ep-poll-option${voted ? ' voted' : ''}`}
                  onClick={() => !poll.is_closed && handleVote(poll.id, opt.id, poll.allow_multi_select, myVotes)}>
                  <div className="ep-poll-bar" style={{ width: `${pct}%` }} />
                  <span className="ep-poll-text">{opt.text}</span>
                  <span className="ep-poll-pct">{pct}%</span>
                </div>
              )
            })}
            <div className="ep-meta" style={{ marginTop: 6 }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
            {isHost && !poll.is_closed && (
              <div className="ep-row-actions">
                <button onClick={() => handleClose(poll.id)} className="ep-btn-ghost ep-btn-ghost--sm">Close poll</button>
                <button onClick={() => handleDelete(poll.id)} className="ep-btn-danger-ghost ep-btn-ghost--sm">Delete</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Potluck Tab ───────────────────────────────────────────────────────────────
function PotluckTab({ eventUuid, myId, isHost, version }: { eventUuid: string; myId: string; isHost: boolean; version: number }) {
  const [items, setItems] = useState<PotluckItemOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newName, setNewName] = useState('')
  const [newQty, setNewQty] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getPotluck(eventUuid).then(setItems).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (version > 0) load() }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = async (itemId: number, hasClaim: boolean) => {
    try {
      if (hasClaim) {
        await unclaimPotluckItem(eventUuid, itemId)
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, claims: i.claims.filter(c => c.user_id !== myId), claims_count: i.claims_count - 1 } : i))
      } else {
        const updated = await claimPotluckItem(eventUuid, itemId)
        setItems(prev => prev.map(i => i.id === itemId ? updated : i))
      }
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newName.trim()) return; setSaving(true)
    try {
      const item = await createPotluckItem(eventUuid, { name: newName.trim(), quantity_needed: newQty })
      setItems(prev => [...prev, item]); setShowCreate(false); setNewName(''); setNewQty(1)
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async (itemId: number) => {
    try { await deletePotluckItem(eventUuid, itemId); setItems(prev => prev.filter(i => i.id !== itemId)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  if (loading) return <div className="ep-tab-loading">Loading potluck…</div>

  return (
    <div className="ep-tab-body">
      {error && <div className="ep-tab-error">{error}</div>}
      {isHost && !showCreate && (
        <button className="ep-btn-primary" onClick={() => setShowCreate(true)}>+ Add Item</button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="ep-create-form">
          <input className="ep-field" placeholder="Item name (e.g. Paper plates)" value={newName}
            onChange={e => setNewName(e.target.value)} required />
          <label className="ep-field-label">Quantity needed</label>
          <input type="number" min={1} className="ep-field" style={{ width: 80 }} value={newQty}
            onChange={e => setNewQty(Number(e.target.value))} />
          <div className="ep-form-actions">
            <button type="submit" disabled={saving} className="ep-btn-primary">{saving ? 'Adding…' : 'Add'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="ep-btn-ghost">Cancel</button>
          </div>
        </form>
      )}
      {items.length === 0 && !showCreate && (
        <div className="ep-tab-empty">No potluck items yet.{isHost ? ' Add some above!' : ''}</div>
      )}
      {items.map(item => {
        const hasClaim = item.claims.some(c => c.user_id === myId)
        const full = item.claims_count >= item.quantity_needed
        return (
          <div key={item.id} className="ep-card ep-card--row">
            <div style={{ flex: 1 }}>
              <div className="ep-card-title">{item.name}</div>
              <div className="ep-meta">{item.claims_count}/{item.quantity_needed} claimed</div>
            </div>
            <div className="ep-row-actions">
              {isHost && (
                <button onClick={() => handleDelete(item.id)} className="ep-btn-danger-ghost ep-btn-ghost--sm">Remove</button>
              )}
              <button onClick={() => handleClaim(item.id, hasClaim)} disabled={!hasClaim && full}
                className={`ep-btn-claim${hasClaim ? ' claimed' : full ? ' full' : ''}`}>
                {hasClaim ? 'Unclaim' : full ? 'Full' : 'Claim'}
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({ eventUuid, myId, isHost, members, version, onTasksChange }: {
  eventUuid: string; myId: string; isHost: boolean; members: MemberOut[]
  version: number
  onTasksChange?: (tasks: TaskOut[]) => void
}) {
  const [tasks, setTasks] = useState<TaskOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getTasks(eventUuid).then(t => { setTasks(t); onTasksChange?.(t) }).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid]) // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [load])
  useEffect(() => { if (version > 0) load() }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (task: TaskOut) => {
    try { const u = await updateTask(eventUuid, task.id, { is_completed: !task.is_completed }); setTasks(prev => prev.map(t => t.id === task.id ? u : t)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }
  const handleVolunteer = async (task: TaskOut) => {
    try { const u = await updateTask(eventUuid, task.id, { assigned_to: myId }); setTasks(prev => prev.map(t => t.id === task.id ? u : t)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); if (!newTitle.trim()) return; setSaving(true)
    try {
      const task = await createTask(eventUuid, { title: newTitle.trim(), assigned_to: newAssignee || undefined, due_date: newDueDate || undefined })
      setTasks(prev => [...prev, task]); setShowCreate(false); setNewTitle(''); setNewAssignee(''); setNewDueDate('')
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }
  const handleDelete = async (taskId: number) => {
    try { await deleteTask(eventUuid, taskId); setTasks(prev => prev.filter(t => t.id !== taskId)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  if (loading) return <div className="ep-tab-loading">Loading tasks…</div>

  return (
    <div className="ep-tab-body">
      {error && <div className="ep-tab-error">{error}</div>}
      {isHost && !showCreate && (
        <button className="ep-btn-primary" onClick={() => setShowCreate(true)}>+ Add Task</button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="ep-create-form">
          <input className="ep-field" placeholder="Task title…" value={newTitle} onChange={e => setNewTitle(e.target.value)} required />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
            <div>
              <label className="ep-field-label">Assign to</label>
              <select className="ep-field" value={newAssignee} onChange={e => setNewAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>{m.user_id === myId ? 'You' : (m.display_name || m.user_id.slice(0, 8))}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="ep-field-label">Due date</label>
              <input type="date" className="ep-field" value={newDueDate} onChange={e => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div className="ep-form-actions">
            <button type="submit" disabled={saving} className="ep-btn-primary">{saving ? 'Adding…' : 'Add'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="ep-btn-ghost">Cancel</button>
          </div>
        </form>
      )}
      {tasks.length === 0 && !showCreate && (
        <div className="ep-tab-empty">No tasks yet.{isHost ? ' Add some above!' : ''}</div>
      )}
      {tasks.map(task => {
        const isAssignedToMe = task.assigned_to === myId
        const canToggle = isHost || isAssignedToMe
        const canVolunteer = !task.assigned_to && !isHost
        return (
          <div key={task.id} className="ep-card ep-card--row">
            <input type="checkbox" checked={task.is_completed} onChange={() => canToggle && handleToggle(task)}
              disabled={!canToggle} className="ep-checkbox" />
            <div style={{ flex: 1 }}>
              <div className="ep-card-title" style={{ textDecoration: task.is_completed ? 'line-through' : 'none', opacity: task.is_completed ? 0.55 : 1 }}>
                {task.title}
              </div>
              {task.assigned_to && (
                <div className="ep-meta">Assigned to: {isAssignedToMe ? 'You' : (members.find(m => m.user_id === task.assigned_to)?.display_name || task.assigned_to.slice(0, 8) + '…')}</div>
              )}
              {task.due_date && <div className="ep-meta">Due: {new Date(task.due_date).toLocaleDateString()}</div>}
            </div>
            <div className="ep-row-actions">
              {canVolunteer && (
                <button onClick={() => handleVolunteer(task)} className="ep-btn-ghost ep-btn-ghost--sm" style={{ color: 'var(--pink)' }}>Volunteer</button>
              )}
              {isHost && (
                <button onClick={() => handleDelete(task.id)} className="ep-btn-danger-ghost ep-btn-ghost--sm">Remove</button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({ eventUuid, myId, isHost, onNew, version }: { eventUuid: string; myId: string; isHost: boolean; onNew?: () => void; version: number }) {
  const [announcements, setAnnouncements] = useState<AnnouncementOut[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getAnnouncements(eventUuid).then(setAnnouncements).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])
  useEffect(() => { load() }, [load])
  useEffect(() => { if (version > 0) { load(); onNew?.() } }, [version]) // eslint-disable-line react-hooks/exhaustive-deps

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault(); if (!body.trim()) return; setSaving(true)
    try {
      const ann = await createAnnouncement(eventUuid, body.trim())
      setAnnouncements(prev => [ann, ...prev]); setBody(''); onNew?.()
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
    finally { setSaving(false) }
  }
  const handleDelete = async (id: number) => {
    try { await deleteAnnouncement(eventUuid, id); setAnnouncements(prev => prev.filter(a => a.id !== id)) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  if (loading) return <div className="ep-tab-loading">Loading…</div>

  return (
    <div className="ep-tab-body">
      {error && <div className="ep-tab-error">{error}</div>}
      {isHost && (
        <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea className="ep-field ep-textarea" placeholder="Post an announcement to all guests…"
            value={body} onChange={e => setBody(e.target.value)} />
          <button type="submit" disabled={saving || !body.trim()} className="ep-btn-primary" style={{ alignSelf: 'flex-end' }}>
            {saving ? 'Posting…' : 'Post Announcement'}
          </button>
        </form>
      )}
      {announcements.length === 0 && <div className="ep-tab-empty">No announcements yet.</div>}
      {announcements.map(ann => (
        <div key={ann.id} className="ep-card ep-card--announcement">
          <div className="ep-ann-body">{ann.body}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
            <div className="ep-meta">
              {new Date(ann.created_at).toLocaleString()}
              {ann.sms_sent && <span style={{ marginLeft: 8, color: 'var(--pink)' }}>SMS sent</span>}
            </div>
            {(isHost || ann.author_id === myId) && (
              <button onClick={() => handleDelete(ann.id)} className="ep-btn-danger-ghost" style={{ fontSize: '0.72rem', padding: '2px 0' }}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    marked.setOptions({ breaks: true })
    return marked.parse(content) as string
  }, [content])
  return <div className="ep-ai-markdown" dangerouslySetInnerHTML={{ __html: html }} />
}

// ── AI Tab ────────────────────────────────────────────────────────────────────
function AiTab({ eventUuid, messages, setMessages, chatMessages, rsvps, tasks }: {
  eventUuid: string
  messages: AiMessage[]
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>
  chatMessages: WsMessage[]
  rsvps: RSVPOut[]
  members: MemberOut[]
  tasks: TaskOut[]
}) {
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, loading])

  const goingCount = rsvps.filter(r => r.status === 'yes').length
  const totalGuests = rsvps.filter(r => r.status === 'yes').reduce((s, r) => s + r.guest_count, 0)
  const totalAttending = goingCount + totalGuests

  // Next action: first incomplete task, or a fallback
  const nextTask = tasks.find(t => !t.is_completed)
  const completedCount = tasks.filter(t => t.is_completed).length

  const send = async () => {
    const text = input.trim(); if (!text || loading) return
    setInput(''); setError(null)
    const contextPrefix = chatMessages.length > 0
      ? `[Recent event chat for context — ${chatMessages.length} messages from ${[...new Set(chatMessages.map(m => m.sender_name))].join(', ')}]\n\n`
      : ''
    const fullContent = contextPrefix ? `${contextPrefix}${text}` : text
    const next: AiMessage[] = [...messages, { role: 'user', content: fullContent }]
    setMessages([...messages, { role: 'user', content: text }])
    setLoading(true)
    try {
      const { reply } = await askAi(eventUuid, next)
      setMessages(prev => [...prev, { role: 'assistant', content: reply }])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setMessages(prev => prev.slice(0, -1))
    } finally { setLoading(false) }
  }

  return (
    <div className="ep-ai-panel">
      {/* COHOST AI BRAIN status card */}
      <div className="ep-ai-brain-card">
        <div className="ep-ai-brain-icon">
          <BsStars size={20} color="var(--pink)" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="ep-ai-brain-title">COHOST AI BRAIN</div>
          <div className="ep-ai-brain-sub">
            {messages.length === 0
              ? 'Ask me anything about this event — guests, logistics, or ideas.'
              : `${messages.filter(m => m.role === 'assistant').length} response${messages.filter(m => m.role === 'assistant').length !== 1 ? 's' : ''} in this session.`}
          </div>
        </div>
        <div className="ep-ai-brain-stats">
          <div className="ep-ai-stat">
            <div className="ep-ai-stat-label">ATTENDING</div>
            <div className="ep-ai-stat-val">{totalAttending} going</div>
          </div>
          <div className={`ep-ai-stat${nextTask ? ' ep-ai-stat--action' : ''}`}>
            <div className="ep-ai-stat-label">NEXT ACTION</div>
            <div className="ep-ai-stat-val">
              {nextTask ? nextTask.title : tasks.length > 0 ? `All ${completedCount} done ✓` : 'No tasks yet'}
            </div>
          </div>
        </div>      </div>

      {/* AI chat label */}
      <div className="ep-ai-chat-label">
        AI ASSISTANT CHAT
        <span className="ep-ai-chat-private">(Privately with Hosts)</span>
      </div>

      {/* Messages */}
      <div className="ep-ai-messages">
        {messages.length === 0 && !loading && (
          <div className="ep-ai-empty">
            <BsStars size={28} color="rgba(127,119,221,0.5)" />
            <div>Ask anything about this event —<br />guests, polls, tasks, or the chat.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`ep-ai-msg${msg.role === 'user' ? ' user' : ' assistant'}`}>
            <div className="ep-ai-msg-avatar">{msg.role === 'user' ? 'Me' : <BsStars size={11} />}</div>
            <div className="ep-ai-msg-bubble">
              {msg.role === 'assistant'
                ? <MarkdownContent content={msg.content} />
                : <div className="ep-ai-msg-text">{msg.content}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="ep-ai-msg assistant">
            <div className="ep-ai-msg-avatar"><BsStars size={11} /></div>
            <div className="ep-ai-msg-bubble">
              <div style={{ display: 'flex', gap: 4, padding: '2px 0' }}>
                <span className="ep-ai-dot" /><span className="ep-ai-dot" style={{ animationDelay: '0.2s' }} /><span className="ep-ai-dot" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
        {error && <div className="ep-ai-error">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="ep-ai-input-row">
        <input className="ep-ai-input" placeholder="Ask AI…" value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading} />
        <button className="ep-send-btn ep-send-btn--purple" onClick={send} disabled={loading} aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Edit Event Panel ──────────────────────────────────────────────────────────
function EditEventPanel({ event, onSave, onCancel }: { event: EventOut; onSave: (updated: EventOut) => void; onCancel: () => void }) {
  const [title, setTitle] = useState(event.title)
  const [description, setDescription] = useState(event.description ?? '')
  const [location, setLocation] = useState(event.location ?? '')
  const [startDate, setStartDate] = useState(event.start_dt ? event.start_dt.slice(0, 10) : '')
  const [startTime, setStartTime] = useState(event.start_dt ? event.start_dt.slice(11, 16) : '')
  const [endDate, setEndDate] = useState(event.end_dt ? event.end_dt.slice(0, 10) : '')
  const [endTime, setEndTime] = useState(event.end_dt ? event.end_dt.slice(11, 16) : '')
  const [viewableByLink, setViewableByLink] = useState(event.viewable_by_link ?? false)
  const [recurrenceRule, setRecurrenceRule] = useState(event.recurrence_rule ?? '')
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(event.recurrence_end_dt ? event.recurrence_end_dt.slice(0, 10) : '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); if (!title.trim()) { setError('Title is required'); return }
    setSaving(true); setError(null)
    try {
      const body: Partial<EventOut> & Record<string, unknown> = { title: title.trim() }
      body.description = description || null; body.location = location || null
      body.start_dt = startDate ? (startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`) : null
      body.end_dt = endDate ? (endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:00`) : null
      body.viewable_by_link = viewableByLink
      body.recurrence_rule = recurrenceRule || null
      body.recurrence_end_dt = recurrenceEndDate ? `${recurrenceEndDate}T23:59:00` : null
      const updated = await updateEvent(event.uuid, body as Partial<EventOut>)
      onSave(updated)
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Failed to save') }
    finally { setSaving(false) }
  }

  return (
    <div className="ep-edit-panel">
      <div className="ep-edit-header">
        <h3 className="ep-edit-title">Edit Event</h3>
        <button onClick={onCancel} className="ep-edit-close" aria-label="Close">&times;</button>
      </div>
      {error && <div className="ep-tab-error">{error}</div>}
      <form onSubmit={handleSubmit} className="ep-edit-form">
        <label className="ep-field-label">Title *</label>
        <input className="ep-field" value={title} onChange={e => setTitle(e.target.value)} required />
        <label className="ep-field-label">Description</label>
        <textarea className="ep-field ep-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell your guests what to expect…" />
        <label className="ep-field-label">Location</label>
        <input className="ep-field" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or venue" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div><label className="ep-field-label">Start Date</label><input className="ep-field" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
          <div><label className="ep-field-label">Start Time</label><input className="ep-field" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
          <div><label className="ep-field-label">End Date</label><input className="ep-field" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
          <div><label className="ep-field-label">End Time</label><input className="ep-field" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} /></div>
        </div>
        <label className="ep-field-label">Repeat</label>
        <select className="ep-field" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}>
          <option value="">Does not repeat</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
        {recurrenceRule && (
          <>
            <label className="ep-field-label">Repeat until</label>
            <input className="ep-field" type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} />
          </>
        )}
        <label className="ep-checkbox-label" style={{ marginTop: 4 }}>
          <input type="checkbox" checked={viewableByLink} onChange={e => setViewableByLink(e.target.checked)} />
          <span>Viewable by anyone with the link</span>
        </label>
        <div className="ep-form-actions" style={{ marginTop: 8 }}>
          <button type="button" onClick={onCancel} className="ep-btn-ghost">Cancel</button>
          <button type="submit" disabled={saving} className="ep-btn-primary">{saving ? 'Saving…' : 'Save Changes'}</button>
        </div>
      </form>
    </div>
  )
}

// ── Main EventPage ────────────────────────────────────────────────────────────
export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile, getToken } = useAuth()

  const [event, setEvent] = useState<EventOut | null>(null)
  const [myRsvp, setMyRsvp] = useState<RSVPOut | null>(null)
  const [rsvps, setRsvps] = useState<RSVPOut[]>([])
  const [eventMembers, setEventMembers] = useState<MemberOut[]>([])
  const [eventTasks, setEventTasks] = useState<TaskOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('polls')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [guestCount, setGuestCount] = useState(0)
  const [flyerOpen, setFlyerOpen] = useState(false)
  const [inviteLinkVisible, setInviteLinkVisible] = useState(false)
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([])
  const [liveChatMessages, setLiveChatMessages] = useState<WsMessage[]>([])
  const [unreadTabs, setUnreadTabs] = useState<Set<string>>(new Set())
  const [resourceVersions, setResourceVersions] = useState<Record<string, number>>({})

  const markRead = (tab: string) => setUnreadTabs(prev => { const s = new Set(prev); s.delete(tab); return s })
  const markUnread = (tab: string) => setUnreadTabs(prev => activeTab === tab ? prev : new Set([...prev, tab]))

  const eventUuid = id ?? ''
  const myId = profile?.cognito_sub ?? ''
  const myDbId = profile?.id ?? null
  const myName = profile?.display_name ?? profile?.email ?? 'Guest'
  const token = getToken() ?? ''

  useEffect(() => {
    if (!eventUuid) return
    Promise.all([
      getEvent(eventUuid),
      getMyRsvp(eventUuid).catch(() => null),
      getRsvps(eventUuid).catch(() => []),
      getMembers(eventUuid).catch(() => []),
      getTasks(eventUuid).catch(() => []),
    ]).then(([ev, rsvp, allRsvps, allMembers, allTasks]) => {
      setEvent(ev)
      setMyRsvp(rsvp)
      setRsvps(allRsvps as RSVPOut[])
      setEventMembers(allMembers as MemberOut[])
      setEventTasks(allTasks as TaskOut[])
      if (rsvp) setGuestCount((rsvp as RSVPOut).guest_count)
    }).catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventUuid])

  const handleRsvp = async (status: RSVPStatus, guests?: number) => {
    setRsvpLoading(true)
    try {
      const gc = guests ?? guestCount
      const updated = await upsertRsvp(eventUuid, status, gc)
      setMyRsvp(updated); setGuestCount(updated.guest_count)
      setRsvps(prev => {
        const exists = prev.find(r => r.user_id === myId)
        if (exists) return prev.map(r => r.user_id === myId ? updated : r)
        return [...prev, updated]
      })
    } catch (e: unknown) { setError(e instanceof Error ? e.message : 'RSVP failed') }
    finally { setRsvpLoading(false) }
  }

  const handleCopyInvite = async () => {
    if (!event?.invite_token || !event.invite_active) return
    copyToClipboard(`${window.location.origin}/join/${event.invite_token}`)
    setInviteCopied(true); setTimeout(() => setInviteCopied(false), 2000)
  }
  const handleRegenerateInvite = async () => {
    if (!event) return
    try { const u = await regenerateInvite(eventUuid); setEvent(u) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }
  const handleRevokeInvite = async () => {
    if (!event) return
    try { const u = await revokeInvite(eventUuid); setEvent(u) }
    catch (e: unknown) { setError(e instanceof Error ? e.message : 'Failed') }
  }

  // ── Real-time update handler ──────────────────────────────────────────────
  const handleEventUpdate = useCallback((update: EventUpdate) => {
    const { kind, action, data } = update

    if (kind === 'rsvp') {
      const rsvp = data as unknown as RSVPOut
      if (action === 'upsert') {
        setRsvps(prev => {
          const exists = prev.find(r => r.user_id === rsvp.user_id)
          return exists ? prev.map(r => r.user_id === rsvp.user_id ? rsvp : r) : [...prev, rsvp]
        })
        if (rsvp.user_id === myId) {
          setMyRsvp(rsvp)
          setGuestCount(rsvp.guest_count)
        }
      }
    }

    if (kind === 'event' && action === 'upsert') {
      setEvent(data as unknown as EventOut)
    }

    if (kind === 'member') {
      const member = data as unknown as MemberOut
      if (action === 'create') {
        setEventMembers(prev => prev.find(m => m.user_id === member.user_id) ? prev : [...prev, member])
      } else if (action === 'upsert') {
        setEventMembers(prev => prev.map(m => m.user_id === member.user_id ? member : m))
        if (member.display_name) {
          setLiveChatMessages(prev => prev.map(msg =>
            msg.sender_id === member.user_id
              ? { ...msg, sender_name: member.display_name! }
              : msg
          ))
        }
      } else if (action === 'delete') {
        const id = (data as unknown as { id: number }).id
        setEventMembers(prev => prev.filter(m => m.id !== id))
      }
    }

    // For polls/tasks/potluck/announcements: signal the active tab to refresh
    // We use a version counter per resource type — tabs watch it and re-fetch
    if (['poll', 'task', 'potluck', 'announcement'].includes(kind)) {
      setResourceVersions(prev => ({ ...prev, [kind]: (prev[kind] ?? 0) + 1 }))
    }
  }, [myId])

  const isHost = event?.host_id === myId || event?.host_id === myDbId

  const tabItems = [
    { key: 'polls', label: 'Polls', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="10" width="4" height="11" rx="1" /><rect x="10" y="6" width="4" height="15" rx="1" /><rect x="17" y="2" width="4" height="19" rx="1" />
      </svg>
    )},
    { key: 'tasks', label: 'Tasks', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
    { key: 'potluck', label: 'Potluck', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M18 8h1a4 4 0 010 8h-1" strokeLinecap="round" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" /><line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" /><line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" /><line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
      </svg>
    )},
    { key: 'announcements', label: 'Announce', icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    )},
    { key: 'ai', label: 'AI Assistant', icon: <BsStars size={13} /> },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Loading event…
    </div>
  )
  if (error && !event) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div style={{ color: '#c00' }}>{error}</div>
      <button onClick={() => navigate('/events')} className="ep-btn-primary">Back to Events</button>
    </div>
  )
  if (!event) return null

  const goingCount = rsvps.filter(r => r.status === 'yes').length
  const maybeCount = rsvps.filter(r => r.status === 'maybe').length
  const noCount = rsvps.filter(r => r.status === 'no').length

  return (
    <div className="ep-root">

      {/* ── LEFT SIDEBAR ── */}
      <div className="ep-sidebar">
        <div className="ep-sidebar-inner">

          {/* Event title + edit */}
          <div className="ep-sidebar-title-row">
            <h1 className="ep-sidebar-title">{event.title}</h1>
            {isHost && !editing && (
              <button onClick={() => setEditing(true)} className="ep-edit-btn" aria-label="Edit event">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* Flyer card */}
          <div
            className={`ep-flyer-card${event.flyer_url ? ' clickable' : ''}`}
            onClick={() => event.flyer_url && setFlyerOpen(true)}
          >
            {event.flyer_url ? (
              <>
                <img src={event.flyer_url} alt={event.title} className="ep-flyer-img" />
                <div className="ep-flyer-expand">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                    <path d="M1 1h4M1 1v4M13 1h-4M13 1v4M1 13h4M1 13v-4M13 13h-4M13 13v-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </div>
              </>
            ) : (
              <div className="ep-flyer-placeholder">
                <div className="ep-flyer-date-pill">
                  {event.start_dt ? formatDate(event.start_dt) : 'Date TBD'}
                </div>
              </div>
            )}
          </div>

          {/* Flyer lightbox */}
          {flyerOpen && event.flyer_url && (
            <div className="ep-lightbox" onClick={() => setFlyerOpen(false)}>
              <button className="ep-lightbox-close" onClick={() => setFlyerOpen(false)} aria-label="Close">✕</button>
              <img src={event.flyer_url} alt={event.title} className="ep-lightbox-img" onClick={e => e.stopPropagation()} />
            </div>
          )}

          {/* About card */}
          <div className="ep-info-card">
            <div className="ep-info-card-header ep-info-card-header--pink">
              <div className="ep-info-label ep-info-label--pink">ABOUT</div>
            </div>
            <div className="ep-info-card-body">
              <p className="ep-info-desc">{event.description || 'No description provided.'}</p>
              {event.start_dt && (
                <div className="ep-info-row">
                  <FiCalendar size={13} className="ep-info-icon" />
                  <span className="ep-info-val">{formatDate(event.start_dt)}{event.end_dt ? ` – ${formatDate(event.end_dt)}` : ''}</span>
                </div>
              )}
              {event.recurrence_rule && (
                <div className="ep-info-row">
                  <FiRepeat size={13} className="ep-info-icon" />
                  <span className="ep-info-val">
                    {event.recurrence_rule.charAt(0) + event.recurrence_rule.slice(1).toLowerCase()}
                    {event.recurrence_end_dt ? ` until ${new Date(event.recurrence_end_dt).toLocaleDateString()}` : ''}
                  </span>
                </div>
              )}
              {event.location && (
                <div className="ep-info-row">
                  <FiMapPin size={13} className="ep-info-icon" />
                  <span className="ep-info-val">{event.location}</span>
                </div>
              )}
              {event.viewable_by_link && (
                <div className="ep-info-row" style={{ color: 'var(--pink)' }}>
                  <FiLink size={13} className="ep-info-icon" style={{ color: 'var(--pink)' }} />
                  <span className="ep-info-val" style={{ color: 'var(--pink)' }}>Viewable by anyone with the link</span>
                </div>
              )}
            </div>
          </div>

          {/* RSVP + Attendance combined card */}
          <div className="ep-info-card">
            <div className="ep-info-card-header ep-info-card-header--green">
              <div className="ep-info-label ep-info-label--green">YOUR RSVP</div>
            </div>
            <div className="ep-info-card-body">
              <div className="ep-rsvp-row">
                {(['yes', 'maybe', 'no'] as RSVPStatus[]).map(status => {
                  const active = myRsvp?.status === status
                  const labels: Record<RSVPStatus, string> = { yes: 'Going', maybe: 'Maybe', no: 'No' }
                  return (
                    <button
                      key={status}
                      onClick={() => handleRsvp(status)}
                      disabled={rsvpLoading}
                      className={`ep-rsvp-btn ep-rsvp-btn--${status}${active ? ' active' : ''}`}
                    >
                      {labels[status]}
                    </button>
                  )
                })}
              </div>
              {(myRsvp?.status === 'yes' || myRsvp?.status === 'maybe') && (
                <div className="ep-guest-count-row">
                  <span className="ep-guest-count-label">Guests</span>
                  <div className="ep-guest-count-ctrl">
                    <button type="button" className="ep-guest-count-btn"
                      onClick={() => { const n = Math.max(0, guestCount - 1); setGuestCount(n); handleRsvp(myRsvp!.status, n) }}
                      disabled={guestCount === 0 || rsvpLoading}>−</button>
                    <span className="ep-guest-count-val">{guestCount}</span>
                    <button type="button" className="ep-guest-count-btn"
                      onClick={() => { const n = guestCount + 1; setGuestCount(n); handleRsvp(myRsvp!.status, n) }}
                      disabled={rsvpLoading}>+</button>
                  </div>
                </div>
              )}
              <div className="ep-attendance-row">
                <div className="ep-att-box ep-att-box--going">
                  <div className="ep-att-num">{goingCount}</div>
                  <div className="ep-att-lbl">GOING</div>
                </div>
                <div className="ep-att-box ep-att-box--maybe">
                  <div className="ep-att-num">{maybeCount}</div>
                  <div className="ep-att-lbl">MAYBE</div>
                </div>
                <div className="ep-att-box ep-att-box--no">
                  <div className="ep-att-num">{noCount}</div>
                  <div className="ep-att-lbl">NO</div>
                </div>
              </div>
            </div>
          </div>

          {/* Invite link card (host only) */}
          {isHost && (
            <div className="ep-info-card">
              <div className="ep-info-card-header ep-info-card-header--orange">
                <div className="ep-info-label ep-info-label--orange">INVITE LINK</div>
              </div>
              <div className="ep-info-card-body">
                {event.invite_token && event.invite_active ? (
                  <>
                    <div className="ep-invite-row">
                      <input
                        readOnly
                        type={inviteLinkVisible ? 'text' : 'password'}
                        value={`${window.location.origin}/join/${event.invite_token}`}
                        className="ep-invite-input"
                      />
                      <button onClick={() => setInviteLinkVisible(v => !v)} className="ep-invite-eye" title={inviteLinkVisible ? 'Hide' : 'Show'}>
                        {inviteLinkVisible ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" />
                            <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        )}
                      </button>
                      <button onClick={handleCopyInvite} className={`ep-invite-copy${inviteCopied ? ' copied' : ''}`}>
                        {inviteCopied ? <><FiCheck size={11} /> Copied</> : 'Copy'}
                      </button>
                    </div>
                    <div className="ep-invite-actions">
                      <button onClick={handleRegenerateInvite} className="ep-link-btn">Regenerate</button>
                      <button onClick={handleRevokeInvite} className="ep-link-btn ep-link-btn--danger">Disable</button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ep-meta" style={{ color: '#c00', marginBottom: 6 }}>Link is disabled.</div>
                    <button onClick={handleRegenerateInvite} className="ep-btn-ghost" style={{ fontSize: '0.78rem' }}>Generate New Link</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Guest list card */}
          <div className="ep-info-card">
            <div className="ep-info-card-header ep-info-card-header--rose">
              <div className="ep-info-label ep-info-label--rose">GUESTS ({eventMembers.length})</div>
            </div>
            <div className="ep-info-card-body">
              <div className="ep-guest-list">
                {eventMembers.slice(0, 8).map(m => {
                  const rsvp = rsvps.find(r => r.user_id === m.user_id)
                  const isMe = m.user_id === myId
                  const name = isMe ? 'You' : (m.display_name || m.user_id.slice(0, 8) + '…')
                  const initials = name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
                  return (
                    <div key={m.id} className="ep-guest-row">
                      <div className="ep-guest-avatar">{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="ep-guest-name">{name}</div>
                        <div className="ep-meta" style={{ color: m.role === 'host' ? 'var(--pink)' : m.role === 'co_host' ? 'var(--pink)' : 'var(--text-muted)' }}>
                          {m.role.replace('_', ' ')}
                        </div>
                      </div>
                      {rsvp && (
                        <span className={`ep-guest-rsvp ep-guest-rsvp--${rsvp.status}`}>
                          {rsvp.status === 'yes' ? <FiCheck size={10} /> : rsvp.status === 'no' ? <FiX size={10} /> : <FiStar size={10} />}
                          {rsvp.guest_count > 0 && ` +${rsvp.guest_count}`}
                        </span>
                      )}
                    </div>
                  )
                })}
                {eventMembers.length > 8 && (
                  <div className="ep-meta" style={{ marginTop: 4 }}>+{eventMembers.length - 8} more</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ── CENTER: TABS ── */}
      <div className="ep-main">

        {/* Edit panel overlay */}
        {editing && (
          <div className="ep-edit-overlay">
            <EditEventPanel
              event={event}
              onSave={(updated) => { setEvent(updated); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}

        {error && (
          <div className="ep-tab-error" style={{ margin: '0.75rem 1rem 0' }}>{error}</div>
        )}

        {/* Tab bar */}
        <div className="ep-tab-bar">
          {tabItems.map(item => (
            <button
              key={item.key}
              className={`ep-tab${activeTab === item.key ? ' active' : ''}`}
              onClick={() => { setActiveTab(item.key); markRead(item.key) }}
            >
              <span className="ep-tab-icon">{item.icon}</span>
              <span>{item.label}</span>
              {unreadTabs.has(item.key) && <span className="ep-tab-dot" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="ep-tab-content">
          {activeTab === 'polls' && <PollsTab eventUuid={eventUuid} myId={myId} isHost={isHost} version={resourceVersions['poll'] ?? 0} />}
          {activeTab === 'tasks' && <TasksTab eventUuid={eventUuid} myId={myId} isHost={isHost} members={eventMembers} version={resourceVersions['task'] ?? 0} onTasksChange={setEventTasks} />}
          {activeTab === 'potluck' && <PotluckTab eventUuid={eventUuid} myId={myId} isHost={isHost} version={resourceVersions['potluck'] ?? 0} />}
          {activeTab === 'announcements' && (
            <AnnouncementsTab eventUuid={eventUuid} myId={myId} isHost={isHost} onNew={() => markUnread('announcements')} version={resourceVersions['announcement'] ?? 0} />
          )}
          {activeTab === 'ai' && (
            <AiTab eventUuid={eventUuid} messages={aiMessages} setMessages={setAiMessages}
              chatMessages={liveChatMessages} rsvps={rsvps} members={eventMembers} tasks={eventTasks} />
          )}
        </div>
      </div>

      {/* ── RIGHT: COMMUNITY CHAT ── */}
      <div className="ep-chat-col">
        <div className="ep-chat-col-header">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>COMMUNITY CHAT</span>
          <span className="ep-live-dot" />
          <span className="ep-live-label">LIVE</span>
        </div>
        <ChatPanel eventId={eventUuid} myId={myId} myName={myName} token={token}
          onMessagesChange={(msgs) => { setLiveChatMessages(msgs); markUnread('chat') }}
          onEventUpdate={handleEventUpdate} />
      </div>

    </div>
  )
}
