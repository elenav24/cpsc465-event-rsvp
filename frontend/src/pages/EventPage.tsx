
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getEvent, getMembers, getMyRsvp, upsertRsvp, getRsvps,
  getPolls, createPoll, votePoll, closePoll, deletePoll,
  getPotluck, createPotluckItem, claimPotluckItem, unclaimPotluckItem, deletePotluckItem,
  getTasks, createTask, updateTask, deleteTask,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  regenerateInvite, updateEvent, revokeInvite,
  updateMemberRole, removeMember,
  getReminders, createReminder, deleteReminder,
} from '../api/events'
import { EventChatSocket } from '../api/chat'
import type {
  EventOut, MemberOut, RSVPOut, PollOut, PotluckItemOut,
  TaskOut, AnnouncementOut, RSVPStatus, ReminderOut,
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

// ── Chat Tab ──────────────────────────────────────────────────────────────────
function ChatTab({ eventId, myId, myName, token }: { eventId: string; myId: string; myName: string; token: string }) {
  const [messages, setMessages] = useState<WsMessage[]>([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<EventChatSocket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!token) return
    const socket = new EventChatSocket({
      eventId,
      token,
      senderId: myId,
      senderName: myName,
      onMessage: (msg) => setMessages(prev => [...prev, msg]),
      onHistory: (msgs) => setMessages(msgs),
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
    })
    socketRef.current = socket
    return () => socket.close()
  }, [eventId, token, myId, myName])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const send = () => {
    const text = input.trim()
    if (!text) return
    socketRef.current?.sendMessage(text)
    setInput('')
  }

  return (
    <div className="chat-panel">
      {!connected && (
        <div style={{ padding: '0.5rem 1rem', background: '#fffbe6', borderBottom: '1px solid #ffe58f', fontSize: '0.8rem', color: '#856404' }}>
          Connecting to chat...
        </div>
      )}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myId
          return (
            <div key={msg.id} className={`chat-msg${mine ? ' mine' : ''}`}>
              <div className="chat-bubble-avatar">{getInitials(msg.sender_name)}</div>
              <div className="chat-bubble">
                <div className="chat-bubble-name">{mine ? 'You' : msg.sender_name}</div>
                <div className="chat-bubble-text">{msg.content}</div>
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
      <div className="chat-input-row">
        <input
          className="chat-input"
          placeholder="Say something..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          maxLength={500}
        />
        <button className="btn-send" onClick={send} aria-label="Send message">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  )
}

// ── Polls Tab ─────────────────────────────────────────────────────────────────
function PollsTab({ eventUuid, myId, isHost }: { eventUuid: string; myId: string; isHost: boolean }) {
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

  const handleVote = async (pollId: number, optionId: number, multi: boolean, currentVotes: number[]) => {
    let ids: number[]
    if (multi) {
      ids = currentVotes.includes(optionId)
        ? currentVotes.filter(id => id !== optionId)
        : [...currentVotes, optionId]
    } else {
      ids = [optionId]
    }
    try {
      const updated = await votePoll(eventUuid, pollId, ids)
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Vote failed')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const validOptions = options.filter(o => o.trim())
    if (validOptions.length < 2) { setError('Need at least 2 options'); return }
    setSaving(true)
    try {
      const poll = await createPoll(eventUuid, {
        question,
        options: validOptions.map((text, i) => ({ text, display_order: i })),
        allow_multi_select: multiSelect,
        is_anonymous: isAnonymous,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      })
      setPolls(prev => [...prev, poll])
      setShowCreate(false)
      setQuestion('')
      setOptions(['', ''])
      setMultiSelect(false)
      setIsAnonymous(false)
      setClosesAt('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create poll')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = async (pollId: number) => {
    try {
      const updated = await closePoll(eventUuid, pollId)
      setPolls(prev => prev.map(p => p.id === pollId ? updated : p))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to close poll')
    }
  }

  const handleDelete = async (pollId: number) => {
    try {
      await deletePoll(eventUuid, pollId)
      setPolls(prev => prev.filter(p => p.id !== pollId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete poll')
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading polls...</div>

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6 }}>{error}</div>}

      {isHost && !showCreate && (
        <button
          onClick={() => setShowCreate(true)}
          style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}
        >
          + Create Poll
        </button>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 8, padding: '1rem' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: '0.75rem' }}>New Poll</div>
          <input
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
            placeholder="Question..."
            value={question}
            onChange={e => setQuestion(e.target.value)}
            required
          />
          {options.map((opt, i) => (
            <input
              key={i}
              style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
              placeholder={`Option ${i + 1}`}
              value={opt}
              onChange={e => setOptions(prev => prev.map((o, j) => j === i ? e.target.value : o))}
            />
          ))}
          <button type="button" onClick={() => setOptions(prev => [...prev, ''])} style={{ fontSize: '0.78rem', color: 'var(--pink)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '0.5rem' }}>
            + Add option
          </button>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={multiSelect} onChange={e => setMultiSelect(e.target.checked)} />
            Allow multiple selections
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', marginBottom: '0.5rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} />
            Anonymous voting (hide who voted for what)
          </label>
          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Auto-close at (optional)</label>
            <input
              type="datetime-local"
              value={closesAt}
              onChange={e => setClosesAt(e.target.value)}
              style={{ border: '1.5px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: '0.82rem', fontFamily: 'Albert Sans' }}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
              {saving ? 'Creating...' : 'Create'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
              Cancel
            </button>
          </div>
        </form>
      )}

      {polls.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No polls yet.{isHost ? ' Create one above!' : ''}
        </div>
      )}

      {polls.map(poll => {
        const myVotes = poll.votes.filter(v => v.voter_id === myId).map(v => v.option_id)
        const totalVotes = poll.options.reduce((s, o) => s + o.vote_count, 0)
        return (
          <div key={poll.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '1rem' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.5rem', color: 'var(--text-dark)' }}>
              {poll.question}
              {poll.is_closed && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#eee', borderRadius: 100, padding: '2px 8px', color: '#666' }}>Closed</span>}
              {poll.is_anonymous && <span style={{ marginLeft: 8, fontSize: '0.72rem', background: '#f0f0ff', borderRadius: 100, padding: '2px 8px', color: '#7F77DD' }}>Anonymous</span>}
            </div>
            {poll.closes_at && !poll.is_closed && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Closes: {new Date(poll.closes_at).toLocaleString()}
              </div>
            )}
            {poll.options.map(opt => {
              const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0
              const voted = myVotes.includes(opt.id)
              return (
                <div
                  key={opt.id}
                  onClick={() => !poll.is_closed && handleVote(poll.id, opt.id, poll.allow_multi_select, myVotes)}
                  style={{ padding: '7px 10px', marginBottom: 4, borderRadius: 6, border: `1.5px solid ${voted ? 'var(--pink)' : 'var(--border)'}`, background: voted ? 'var(--pink-bg)' : 'white', fontSize: '0.82rem', cursor: poll.is_closed ? 'default' : 'pointer', position: 'relative', overflow: 'hidden' }}
                >
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: voted ? 'rgba(208,99,149,0.12)' : 'rgba(0,0,0,0.04)', transition: 'width 0.3s' }} />
                  <span style={{ position: 'relative', zIndex: 1 }}>{opt.text}</span>
                  <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', color: 'var(--text-muted)', zIndex: 1 }}>{pct}%</span>
                </div>
              )
            })}
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{totalVotes} vote{totalVotes !== 1 ? 's' : ''}</div>
            {isHost && !poll.is_closed && (
              <div style={{ display: 'flex', gap: 8, marginTop: '0.5rem' }}>
                <button onClick={() => handleClose(poll.id)} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '3px 10px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Close poll</button>
                <button onClick={() => handleDelete(poll.id)} style={{ fontSize: '0.75rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '3px 10px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Delete</button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Potluck Tab ───────────────────────────────────────────────────────────────
function PotluckTab({ eventUuid, myId, isHost }: { eventUuid: string; myId: string; isHost: boolean }) {
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

  const handleClaim = async (itemId: number, hasClaim: boolean) => {
    try {
      if (hasClaim) {
        await unclaimPotluckItem(eventUuid, itemId)
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, claims: i.claims.filter(c => c.user_id !== myId), claims_count: i.claims_count - 1 } : i))
      } else {
        const updated = await claimPotluckItem(eventUuid, itemId)
        setItems(prev => prev.map(i => i.id === itemId ? updated : i))
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim()) return
    setSaving(true)
    try {
      const item = await createPotluckItem(eventUuid, { name: newName.trim(), quantity_needed: newQty })
      setItems(prev => [...prev, item])
      setShowCreate(false)
      setNewName('')
      setNewQty(1)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create item')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (itemId: number) => {
    try {
      await deletePotluckItem(eventUuid, itemId)
      setItems(prev => prev.filter(i => i.id !== itemId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete item')
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading potluck...</div>

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6 }}>{error}</div>}

      {isHost && !showCreate && (
        <button onClick={() => setShowCreate(true)} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
          + Add Item
        </button>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 8, padding: '1rem' }}>
          <input
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
            placeholder="Item name (e.g. Paper plates)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            required
          />
          <label style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Quantity needed</label>
          <input
            type="number"
            min={1}
            style={{ width: 80, border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.75rem', fontFamily: 'Albert Sans' }}
            value={newQty}
            onChange={e => setNewQty(Number(e.target.value))}
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Cancel</button>
          </div>
        </form>
      )}

      {items.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No potluck items yet.{isHost ? ' Add some above!' : ''}
        </div>
      )}

      {items.map(item => {
        const hasClaim = item.claims.some(c => c.user_id === myId)
        const full = item.claims_count >= item.quantity_needed
        return (
          <div key={item.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-dark)' }}>{item.name}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                {item.claims_count}/{item.quantity_needed} claimed
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              {isHost && (
                <button onClick={() => handleDelete(item.id)} style={{ fontSize: '0.72rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Remove</button>
              )}
              <button
                onClick={() => handleClaim(item.id, hasClaim)}
                disabled={!hasClaim && full}
                style={{ fontSize: '0.78rem', fontWeight: 600, background: hasClaim ? 'var(--pink)' : full ? '#eee' : 'var(--pink-bg)', color: hasClaim ? 'white' : full ? '#999' : 'var(--pink)', border: `1px solid ${hasClaim ? 'var(--pink)' : full ? '#ddd' : 'var(--pink-pale)'}`, borderRadius: 100, padding: '5px 12px', cursor: hasClaim || !full ? 'pointer' : 'not-allowed', fontFamily: 'Albert Sans' }}
              >
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
function TasksTab({ eventUuid, myId, isHost, members }: { eventUuid: string; myId: string; isHost: boolean; members: MemberOut[] }) {
  const [tasks, setTasks] = useState<TaskOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newAssignee, setNewAssignee] = useState('')
  const [newDueDate, setNewDueDate] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getTasks(eventUuid).then(setTasks).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])

  useEffect(() => { load() }, [load])

  const handleToggle = async (task: TaskOut) => {
    try {
      const updated = await updateTask(eventUuid, task.id, { is_completed: !task.is_completed })
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update task')
    }
  }

  const handleVolunteer = async (task: TaskOut) => {
    try {
      const updated = await updateTask(eventUuid, task.id, { assigned_to: myId })
      setTasks(prev => prev.map(t => t.id === task.id ? updated : t))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to volunteer')
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSaving(true)
    try {
      const task = await createTask(eventUuid, {
        title: newTitle.trim(),
        assigned_to: newAssignee || undefined,
        due_date: newDueDate || undefined,
      })
      setTasks(prev => [...prev, task])
      setShowCreate(false)
      setNewTitle('')
      setNewAssignee('')
      setNewDueDate('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(eventUuid, taskId)
      setTasks(prev => prev.filter(t => t.id !== taskId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete task')
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading tasks...</div>

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6 }}>{error}</div>}

      {isHost && !showCreate && (
        <button onClick={() => setShowCreate(true)} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '8px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
          + Add Task
        </button>
      )}

      {showCreate && (
        <form onSubmit={handleCreate} style={{ background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 8, padding: '1rem' }}>
          <input
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.5rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Assign to</label>
              <select
                value={newAssignee}
                onChange={e => setNewAssignee(e.target.value)}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: '0.82rem', fontFamily: 'Albert Sans', background: 'white', boxSizing: 'border-box' }}
              >
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.user_id === myId ? 'You' : (m.display_name || m.user_id.slice(0, 8))}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: 3 }}>Due date</label>
              <input
                type="date"
                value={newDueDate}
                onChange={e => setNewDueDate(e.target.value)}
                style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '7px 10px', fontSize: '0.82rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
              />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" disabled={saving} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '7px 16px', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
              {saving ? 'Adding...' : 'Add'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} style={{ background: 'none', border: '1px solid var(--border)', borderRadius: 100, padding: '7px 14px', fontSize: '0.82rem', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Cancel</button>
          </div>
        </form>
      )}

      {tasks.length === 0 && !showCreate && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No tasks yet.{isHost ? ' Add some above!' : ''}
        </div>
      )}

      {tasks.map(task => {
        const isAssignedToMe = task.assigned_to === myId
        const canToggle = isHost || isAssignedToMe
        const canVolunteer = !task.assigned_to && !isHost
        return (
          <div key={task.id} style={{ background: 'white', border: '1px solid var(--border)', borderRadius: 8, padding: '0.875rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
              type="checkbox"
              checked={task.is_completed}
              onChange={() => canToggle && handleToggle(task)}
              disabled={!canToggle}
              style={{ width: 16, height: 16, cursor: canToggle ? 'pointer' : 'default', flexShrink: 0 }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-dark)', textDecoration: task.is_completed ? 'line-through' : 'none', opacity: task.is_completed ? 0.6 : 1 }}>
                {task.title}
              </div>
              {task.assigned_to && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Assigned to: {isAssignedToMe ? 'You' : (members.find(m => m.user_id === task.assigned_to)?.display_name || task.assigned_to.slice(0, 8) + '...')}
                </div>
              )}
              {task.due_date && (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Due: {new Date(task.due_date).toLocaleDateString()}
                </div>
              )}
            </div>
            {canVolunteer && (
              <button onClick={() => handleVolunteer(task)} style={{ fontSize: '0.75rem', color: 'var(--pink)', background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 100, padding: '3px 10px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
                Volunteer
              </button>
            )}
            {isHost && (
              <button onClick={() => handleDelete(task.id)} style={{ fontSize: '0.72rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '3px 8px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
                Remove
              </button>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({ eventUuid, myId, isHost }: { eventUuid: string; myId: string; isHost: boolean }) {
  const [announcements, setAnnouncements] = useState<AnnouncementOut[]>([])
  const [loading, setLoading] = useState(true)
  const [body, setBody] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    getAnnouncements(eventUuid).then(setAnnouncements).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])

  useEffect(() => { load() }, [load])

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!body.trim()) return
    setSaving(true)
    try {
      const ann = await createAnnouncement(eventUuid, body.trim())
      setAnnouncements(prev => [ann, ...prev])
      setBody('')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to post announcement')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement(eventUuid, id)
      setAnnouncements(prev => prev.filter(a => a.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to delete')
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading...</div>

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6 }}>{error}</div>}

      {isHost && (
        <form onSubmit={handlePost} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 8, padding: '10px 12px', fontSize: '0.88rem', fontFamily: 'Albert Sans', resize: 'vertical', minHeight: 80, boxSizing: 'border-box', outline: 'none' }}
            placeholder="Post an announcement to all guests..."
            value={body}
            onChange={e => setBody(e.target.value)}
          />
          <button type="submit" disabled={saving || !body.trim()} style={{ alignSelf: 'flex-end', background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '8px 20px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'Albert Sans' }}>
            {saving ? 'Posting...' : 'Post Announcement'}
          </button>
        </form>
      )}

      {announcements.length === 0 && (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          No announcements yet.
        </div>
      )}

      {announcements.map(ann => (
        <div key={ann.id} style={{ background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 8, padding: '0.875rem' }}>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-dark)', lineHeight: 1.6 }}>{ann.body}</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {new Date(ann.created_at).toLocaleString()}
              {ann.sms_sent && <span style={{ marginLeft: 8, color: 'var(--pink)' }}>SMS sent</span>}
            </div>
            {(isHost || ann.author_id === myId) && (
              <button onClick={() => handleDelete(ann.id)} style={{ fontSize: '0.72rem', color: '#c00', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Albert Sans' }}>Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Reminders Tab ─────────────────────────────────────────────────────────────
const REMINDER_OPTIONS = [
  { label: '1 hour before', minutes: 60 },
  { label: '6 hours before', minutes: 360 },
  { label: '24 hours before', minutes: 1440 },
  { label: '1 week before', minutes: 10080 },
]

function RemindersTab({ eventUuid, hasStartDt }: { eventUuid: string; hasStartDt: boolean }) {
  const [reminders, setReminders] = useState<ReminderOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    getReminders(eventUuid).then(setReminders).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])

  const handleAdd = async (offsetMinutes: number) => {
    setAdding(true)
    setError(null)
    try {
      const reminder = await createReminder(eventUuid, offsetMinutes)
      setReminders(prev => [...prev, reminder])
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to set reminder')
    } finally {
      setAdding(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteReminder(eventUuid, id)
      setReminders(prev => prev.filter(r => r.id !== id))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove reminder')
    }
  }

  const activeOffsets = new Set(reminders.map(r => r.offset_minutes))

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading reminders...</div>

  return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-mid)', fontWeight: 600, marginBottom: '0.25rem' }}>
        🔔 Email Reminders
      </div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
        Get an email before the event starts. You'll receive reminders at the times you select below.
      </div>

      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6 }}>{error}</div>}

      {!hasStartDt && (
        <div style={{ fontSize: '0.82rem', color: '#856404', background: '#fffbe6', padding: '0.5rem 0.75rem', borderRadius: 6 }}>
          This event has no start date set — reminders can't be scheduled yet.
        </div>
      )}

      {hasStartDt && REMINDER_OPTIONS.map(opt => {
        const isActive = activeOffsets.has(opt.minutes)
        const reminder = reminders.find(r => r.offset_minutes === opt.minutes)
        return (
          <div key={opt.minutes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: isActive ? '#e6f9ee' : 'white', border: `1px solid ${isActive ? '#b7ebc8' : 'var(--border)'}`, borderRadius: 8 }}>
            <span style={{ fontSize: '0.85rem', color: isActive ? '#1a7a3c' : 'var(--text-mid)', fontWeight: isActive ? 600 : 400 }}>
              {isActive && '✓ '}{opt.label}
            </span>
            {isActive ? (
              <button onClick={() => handleDelete(reminder!.id)} style={{ fontSize: '0.72rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
                Remove
              </button>
            ) : (
              <button onClick={() => handleAdd(opt.minutes)} disabled={adding} style={{ fontSize: '0.72rem', color: 'var(--pink)', background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 100, padding: '2px 10px', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600 }}>
                {adding ? '...' : 'Set'}
              </button>
            )}
          </div>
        )
      })}

      {reminders.length > 0 && (
        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          You have {reminders.length} reminder{reminders.length > 1 ? 's' : ''} set.
        </div>
      )}
    </div>
  )
}

// ── Guests Tab ────────────────────────────────────────────────────────────────
function GuestsTab({ eventUuid, myId, isHost, hostId, rsvps }: { eventUuid: string; myId: string; isHost: boolean; hostId: string; rsvps: RSVPOut[] }) {
  const [members, setMembers] = useState<MemberOut[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getMembers(eventUuid).then(setMembers).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])

  const handlePromote = async (userId: string) => {
    try {
      const updated = await updateMemberRole(eventUuid, userId, 'co_host')
      setMembers(prev => prev.map(m => m.user_id === userId ? updated : m))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update role')
    }
  }

  const handleDemote = async (userId: string) => {
    try {
      const updated = await updateMemberRole(eventUuid, userId, 'attendee')
      setMembers(prev => prev.map(m => m.user_id === userId ? updated : m))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update role')
    }
  }

  const handleRemove = async (userId: string) => {
    try {
      await removeMember(eventUuid, userId)
      setMembers(prev => prev.filter(m => m.user_id !== userId))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to remove member')
    }
  }

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading guests...</div>

  const rsvpMap = Object.fromEntries(rsvps.map(r => [r.user_id, r]))
  // Only the original host can manage roles
  const isOriginalHost = myId === hostId

  return (
    <div style={{ padding: '1rem' }}>
      {error && <div style={{ color: '#c00', fontSize: '0.82rem', background: '#fff0f0', padding: '0.5rem', borderRadius: 6, marginBottom: '0.75rem' }}>{error}</div>}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        {members.length} member{members.length !== 1 ? 's' : ''}
      </div>
      {members.map(m => {
        const rsvp = rsvpMap[m.user_id]
        const rsvpStatus = rsvp?.status
        const isMe = m.user_id === myId
        const name = isMe ? 'You' : (m.display_name || m.user_id.slice(0, 8) + '…')
        const initials = isMe
          ? (m.display_name || 'Y').slice(0, 2).toUpperCase()
          : (m.display_name ? m.display_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : m.user_id.slice(0, 2).toUpperCase())
        const canManage = isOriginalHost && !isMe && m.role !== 'host'
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple-pale), var(--pink-pale))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--pink)', flexShrink: 0 }}>
              {initials}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {name}
              </div>
              <div style={{ fontSize: '0.72rem', color: m.role === 'host' ? 'var(--pink)' : m.role === 'co_host' ? '#7F77DD' : 'var(--text-muted)', textTransform: 'capitalize', fontWeight: m.role !== 'attendee' ? 600 : 400 }}>{m.role.replace('_', ' ')}</div>
            </div>
            {rsvpStatus && (
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: rsvpStatus === 'yes' ? '#e6f9ee' : rsvpStatus === 'no' ? '#fff0f0' : '#fffbe6', color: rsvpStatus === 'yes' ? '#1a7a3c' : rsvpStatus === 'no' ? '#c00' : '#856404', fontWeight: 600, flexShrink: 0 }}>
                {rsvpStatus === 'yes' ? 'Going' : rsvpStatus === 'no' ? 'Not going' : 'Maybe'}
                {rsvp?.guest_count > 0 && ` +${rsvp.guest_count}`}
              </span>
            )}
            {canManage && (
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {m.role === 'attendee' ? (
                  <button onClick={() => handlePromote(m.user_id)} title="Promote to co-host" style={{ fontSize: '0.68rem', color: '#7F77DD', background: '#EEEDFE', border: '1px solid #d8d5f7', borderRadius: 100, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600 }}>
                    ↑ Co-host
                  </button>
                ) : (
                  <button onClick={() => handleDemote(m.user_id)} title="Demote to attendee" style={{ fontSize: '0.68rem', color: 'var(--text-muted)', background: '#f5f5f5', border: '1px solid var(--border)', borderRadius: 100, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 500 }}>
                    ↓ Attendee
                  </button>
                )}
                <button onClick={() => handleRemove(m.user_id)} title="Remove member" style={{ fontSize: '0.68rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '2px 6px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
                  ✕
                </button>
              </div>
            )}
            {/* Non-host privileged users can remove themselves */}
            {isMe && m.role !== 'host' && isHost && !isOriginalHost && (
              <button onClick={() => handleRemove(m.user_id)} title="Leave event" style={{ fontSize: '0.68rem', color: '#c00', background: 'none', border: '1px solid #fcc', borderRadius: 100, padding: '2px 8px', cursor: 'pointer', fontFamily: 'Albert Sans' }}>
                Leave
              </button>
            )}
          </div>
        )
      })}
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
    e.preventDefault()
    if (!title.trim()) { setError('Title is required'); return }
    setSaving(true)
    setError(null)
    try {
      const body: Partial<EventOut> & Record<string, unknown> = { title: title.trim() }
      body.description = description || null
      body.location = location || null
      body.start_dt = startDate ? (startTime ? `${startDate}T${startTime}:00` : `${startDate}T00:00:00`) : null
      body.end_dt = endDate ? (endTime ? `${endDate}T${endTime}:00` : `${endDate}T23:59:00`) : null
      body.viewable_by_link = viewableByLink
      body.recurrence_rule = recurrenceRule || null
      body.recurrence_end_dt = recurrenceEndDate ? `${recurrenceEndDate}T23:59:00` : null
      const updated = await updateEvent(event.uuid, body as Partial<EventOut>)
      onSave(updated)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="edit-panel">
      <div className="edit-panel-header">
        <h3 style={{ margin: 0, fontFamily: "'Cantora One', cursive", fontSize: '1.2rem', color: 'var(--text-dark)' }}>Edit Event</h3>
        <button onClick={onCancel} className="edit-cancel-x" aria-label="Close edit panel">&times;</button>
      </div>
      {error && <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 6, padding: '0.5rem', marginBottom: '0.75rem', color: '#c00', fontSize: '0.82rem' }}>{error}</div>}
      <form onSubmit={handleSubmit} className="edit-form">
        <label className="edit-label">Title *</label>
        <input className="edit-input" value={title} onChange={e => setTitle(e.target.value)} required />

        <label className="edit-label">Description</label>
        <textarea className="edit-input edit-textarea" value={description} onChange={e => setDescription(e.target.value)} placeholder="Tell your guests what to expect..." />

        <label className="edit-label">Location</label>
        <input className="edit-input" value={location} onChange={e => setLocation(e.target.value)} placeholder="Address or venue" />

        <div className="edit-date-row">
          <div>
            <label className="edit-label">Start Date</label>
            <input className="edit-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div>
            <label className="edit-label">Start Time</label>
            <input className="edit-input" type="time" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
        </div>
        <div className="edit-date-row">
          <div>
            <label className="edit-label">End Date</label>
            <input className="edit-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
          <div>
            <label className="edit-label">End Time</label>
            <input className="edit-input" type="time" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
        </div>

        <label className="edit-label" style={{ marginTop: '0.5rem' }}>Repeat</label>
        <select className="edit-input" value={recurrenceRule} onChange={e => setRecurrenceRule(e.target.value)}>
          <option value="">Does not repeat</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
        {recurrenceRule && (
          <>
            <label className="edit-label">Repeat until</label>
            <input className="edit-input" type="date" value={recurrenceEndDate} onChange={e => setRecurrenceEndDate(e.target.value)} />
          </>
        )}

        <label className="edit-checkbox-label">
          <input type="checkbox" checked={viewableByLink} onChange={e => setViewableByLink(e.target.checked)} />
          <span>Viewable by anyone with the link</span>
        </label>

        <div className="edit-actions">
          <button type="button" onClick={onCancel} className="edit-btn-cancel">Cancel</button>
          <button type="submit" disabled={saving} className="edit-btn-save">{saving ? 'Saving...' : 'Save Changes'}</button>
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)
  const [editing, setEditing] = useState(false)
  const [guestCount, setGuestCount] = useState(0)

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
    ]).then(([ev, rsvp, allRsvps, allMembers]) => {
      setEvent(ev)
      setMyRsvp(rsvp)
      setRsvps(allRsvps as RSVPOut[])
      setEventMembers(allMembers as MemberOut[])
      if (rsvp) setGuestCount((rsvp as RSVPOut).guest_count)
    }).catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventUuid])

  const handleRsvp = async (status: RSVPStatus, guests?: number) => {
    setRsvpLoading(true)
    try {
      const gc = guests ?? guestCount
      const updated = await upsertRsvp(eventUuid, status, gc)
      setMyRsvp(updated)
      setGuestCount(updated.guest_count)
      setRsvps(prev => {
        const exists = prev.find(r => r.user_id === myId)
        if (exists) return prev.map(r => r.user_id === myId ? updated : r)
        return [...prev, updated]
      })
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'RSVP failed')
    } finally {
      setRsvpLoading(false)
    }
  }

  const handleCopyInvite = async () => {
    if (!event?.invite_token || !event.invite_active) return
    const url = `${window.location.origin}/join/${event.invite_token}`
    copyToClipboard(url)
    setInviteCopied(true)
    setTimeout(() => setInviteCopied(false), 2000)
  }

  const handleRegenerateInvite = async () => {
    if (!event) return
    try {
      const updated = await regenerateInvite(eventUuid)
      setEvent(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to regenerate invite')
    }
  }

  const handleRevokeInvite = async () => {
    if (!event) return
    try {
      const updated = await revokeInvite(eventUuid)
      setEvent(updated)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to revoke invite')
    }
  }

  const isHost = event?.host_id === myId || event?.host_id === myDbId

  const sidebarItems = [
    { key: 'chat', label: 'Event Chat', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { key: 'polls', label: 'Polls', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="10" width="4" height="11" rx="1" /><rect x="10" y="6" width="4" height="15" rx="1" /><rect x="17" y="2" width="4" height="19" rx="1" /></svg> },
    { key: 'potluck', label: 'Potluck', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeLinecap="round" /><path d="M8 12h8M12 8v8" strokeLinecap="round" /></svg> },
    { key: 'tasks', label: 'Tasks', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { key: 'announcements', label: 'Announcements', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { key: 'reminders', label: 'Reminders', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg> },
    { key: 'guests', label: 'Guest List', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="7" r="4" /><path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" /><path d="M16 3.13a4 4 0 010 7.75" /><path d="M21 21v-2a4 4 0 00-3-3.87" /></svg> },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', color: 'var(--text-muted)' }}>
      Loading event...
    </div>
  )

  if (error && !event) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
      <div style={{ color: '#c00' }}>{error}</div>
      <button onClick={() => navigate('/events')} style={{ background: 'var(--pink)', color: 'white', border: 'none', borderRadius: 100, padding: '10px 24px', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600 }}>Back to Events</button>
    </div>
  )


  if (!event) return null

  return (
    <div className="event-page">
      {/* Main — tabs are the focus */}
      <div className="event-main">
        <div className="main-header">
          <div className="event-cat-badge">🎉 Event</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1 className="event-title">{event.title}</h1>
            {isHost && !editing && (
              <button onClick={() => setEditing(true)} className="btn-edit-event" aria-label="Edit event">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Edit
              </button>
            )}
          </div>
          {event.location && (
            <div className="event-location">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A4.5 4.5 0 0113.5 6c0 3-4.5 8.5-4.5 8.5S4.5 9 4.5 6A4.5 4.5 0 018 1.5z" stroke="var(--text-muted)" strokeWidth="1.5" />
                <circle cx="8" cy="6" r="1.5" stroke="var(--text-muted)" strokeWidth="1.5" />
              </svg>
              {event.location}
            </div>
          )}
        </div>

        {editing && (
          <div style={{ padding: '0 1.5rem 1rem', overflowY: 'auto', flexShrink: 0, maxHeight: '60vh', borderBottom: '1px solid var(--border)', background: 'white' }}>
            <EditEventPanel
              event={event}
              onSave={(updated) => { setEvent(updated); setEditing(false) }}
              onCancel={() => setEditing(false)}
            />
          </div>
        )}

        {error && (
          <div style={{ margin: '0 1.5rem 1rem', background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '0.75rem', color: '#c00', fontSize: '0.85rem' }}>
            {error}
          </div>
        )}

        {/* Horizontal tab bar */}
        <div className="main-tabs">
          {sidebarItems.map((item) => (
            <button
              key={item.key}
              className={`main-tab${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              <span className="main-tab-icon">{item.icon}</span>
              <span className="main-tab-label">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="main-tab-content">
          {activeTab === 'chat' && (
            <ChatTab eventId={eventUuid} myId={myId} myName={myName} token={token} />
          )}
          {activeTab === 'polls' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <PollsTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'potluck' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <PotluckTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'tasks' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <TasksTab eventUuid={eventUuid} myId={myId} isHost={isHost} members={eventMembers} />
            </div>
          )}
          {activeTab === 'announcements' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <AnnouncementsTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'reminders' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <RemindersTab eventUuid={eventUuid} hasStartDt={!!event.start_dt} />
            </div>
          )}
          {activeTab === 'guests' && (
            <div style={{ overflowY: 'auto', flex: 1 }}>
              <GuestsTab eventUuid={eventUuid} myId={myId} isHost={isHost} hostId={String(event.host_id)} rsvps={rsvps} />
            </div>
          )}
        </div>
      </div>

      {/* Sidebar — event info & RSVP */}
      <div className="event-sidebar">
        {/* Flyer / hero */}
        <div className="sidebar-hero">
          {event.flyer_url ? (
            <img src={event.flyer_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div className="sidebar-hero-placeholder">
              <div className="sidebar-hero-date">
                {event.start_dt ? formatDate(event.start_dt) : 'Date TBD'}
              </div>
            </div>
          )}
        </div>

        <div className="sidebar-scroll">
          {/* RSVP */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Your RSVP</div>
            <div className="event-rsvp-row">
              {myRsvp?.status === 'yes' ? (
                <>
                  <span style={{ fontSize: '0.82rem', color: '#1a7a3c', fontWeight: 600 }}>You're going!</span>
                  <button className="btn-maybe" onClick={() => handleRsvp('maybe')} disabled={rsvpLoading}>Maybe</button>
                  <button className="btn-cantmake" onClick={() => handleRsvp('no')} disabled={rsvpLoading}>Can't make it</button>
                </>
              ) : myRsvp?.status === 'no' ? (
                <>
                  <span style={{ fontSize: '0.82rem', color: '#c00', fontWeight: 600 }}>Not going</span>
                  <button className="btn-going" onClick={() => handleRsvp('yes')} disabled={rsvpLoading}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    I'm Going!
                  </button>
                </>
              ) : (
                <>
                  <button className="btn-going" onClick={() => handleRsvp('yes')} disabled={rsvpLoading}>
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                      <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {rsvpLoading ? '...' : "I'm Going!"}
                  </button>
                  <button className="btn-maybe" onClick={() => handleRsvp('maybe')} disabled={rsvpLoading}>Maybe</button>
                  <button className="btn-cantmake" onClick={() => handleRsvp('no')} disabled={rsvpLoading}>No</button>
                </>
              )}
            </div>
            {(myRsvp?.status === 'yes' || myRsvp?.status === 'maybe') && (
              <div className="guest-count-row">
                <span className="guest-count-label">Bringing +1s?</span>
                <div className="guest-count-controls">
                  <button type="button" className="guest-count-btn"
                    onClick={() => { const n = Math.max(0, guestCount - 1); setGuestCount(n); handleRsvp(myRsvp!.status, n) }}
                    disabled={guestCount === 0 || rsvpLoading}>−</button>
                  <span className="guest-count-value">{guestCount}</span>
                  <button type="button" className="guest-count-btn"
                    onClick={() => { const n = guestCount + 1; setGuestCount(n); handleRsvp(myRsvp!.status, n) }}
                    disabled={rsvpLoading}>+</button>
                </div>
                {guestCount > 0 && <span className="guest-count-note">+{guestCount}</span>}
              </div>
            )}
          </div>

          {/* Attendance summary */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">Attendance</div>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
              {[
                { label: 'Going', status: 'yes', color: '#1a7a3c', bg: '#e6f9ee' },
                { label: 'Maybe', status: 'maybe', color: '#856404', bg: '#fffbe6' },
                { label: 'No', status: 'no', color: '#c00', bg: '#fff0f0' },
              ].map(({ label, status, color, bg }) => (
                <div key={status} style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 6, padding: '0.5rem 0.25rem' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{rsvps.filter(r => r.status === status).length}</div>
                  <div style={{ fontSize: '0.65rem', color, fontWeight: 600 }}>{label}</div>
                </div>
              ))}
            </div>
            {(() => {
              const totalGuests = rsvps.filter(r => r.status === 'yes').reduce((sum, r) => sum + r.guest_count, 0)
              const goingCount = rsvps.filter(r => r.status === 'yes').length
              return totalGuests > 0 ? (
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  Total: {goingCount + totalGuests} ({goingCount} + {totalGuests} guest{totalGuests > 1 ? 's' : ''})
                </div>
              ) : null
            })()}
          </div>

          {/* About */}
          <div className="sidebar-section">
            <div className="sidebar-section-title">About</div>
            <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-mid)', marginBottom: '0.75rem' }}>
              {event.description || 'No description provided.'}
            </div>
            {event.start_dt && (
              <div className="detail-row">
                <span className="detail-icon">📅</span>
                <div>
                  <div className="detail-val">{formatDate(event.start_dt)}{event.end_dt ? ` – ${formatDate(event.end_dt)}` : ''}</div>
                </div>
              </div>
            )}
            {event.recurrence_rule && (
              <div className="detail-row">
                <span className="detail-icon">🔁</span>
                <div>
                  <div className="detail-val">
                    {event.recurrence_rule.charAt(0) + event.recurrence_rule.slice(1).toLowerCase()}
                    {event.recurrence_end_dt ? ` until ${new Date(event.recurrence_end_dt).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            )}
            {event.viewable_by_link && (
              <div style={{ fontSize: '0.75rem', color: '#7F77DD', display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
                🔗 Viewable by anyone with the link
              </div>
            )}
          </div>

          {/* Invite link (host only) */}
          {isHost && (
            <div className="sidebar-section">
              <div className="sidebar-section-title">Invite Link</div>
              {event.invite_token && event.invite_active ? (
                <>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                    <input
                      readOnly
                      value={`${window.location.origin}/join/${event.invite_token}`}
                      style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '5px 8px', fontSize: '0.68rem', background: '#fafafa', color: 'var(--text-muted)', fontFamily: 'monospace', minWidth: 0 }}
                    />
                    <button onClick={handleCopyInvite} style={{ background: inviteCopied ? '#1a7a3c' : 'var(--pink)', color: 'white', border: 'none', borderRadius: 6, padding: '5px 10px', fontSize: '0.72rem', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {inviteCopied ? '✓ Copied' : 'Copy'}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleRegenerateInvite} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Albert Sans', padding: 0 }}>
                      Regenerate
                    </button>
                    <button onClick={handleRevokeInvite} style={{ fontSize: '0.72rem', color: '#c00', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Albert Sans', padding: 0 }}>
                      Revoke
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: '0.78rem', color: '#c00', marginBottom: 6 }}>Link is disabled.</div>
                  <button onClick={handleRegenerateInvite} style={{ fontSize: '0.75rem', color: 'var(--pink)', background: 'var(--pink-bg)', border: '1px solid var(--pink-pale)', borderRadius: 100, padding: '4px 12px', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600 }}>
                    Generate New Link
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        .event-page { display: flex; width: 100%; overflow: hidden; height: calc(100svh - var(--nav-height)); margin-top: var(--nav-height); }

        /* ── Main (left) ── */
        .event-main { flex: 1; display: flex; flex-direction: column; min-width: 0; overflow: hidden; height: 100%; }
        .main-header { padding: 1.25rem 1.5rem 0.75rem; border-bottom: 1px solid var(--border); flex-shrink: 0; background: white; }
        .event-cat-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--pink-bg); border: 1px solid var(--pink-pale); border-radius: 100px; padding: 3px 10px; font-size: 0.75rem; color: var(--pink); font-weight: 600; margin-bottom: 0.4rem; }
        .event-title { font-family: 'Anton', sans-serif; font-size: 1.8rem; margin: 0 0 2px; color: var(--text-dark); line-height: 1.1; }
        .event-location { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; color: var(--text-muted); margin-top: 4px; }

        /* Tab bar */
        .main-tabs { display: flex; gap: 0; padding: 0 1.5rem; border-bottom: 1px solid var(--border); overflow-x: auto; scrollbar-width: none; flex-shrink: 0; background: white; }
        .main-tabs::-webkit-scrollbar { display: none; }
        .main-tab { display: flex; align-items: center; gap: 6px; padding: 10px 14px; background: none; border: none; border-bottom: 2px solid transparent; font-family: 'Albert Sans', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); cursor: pointer; white-space: nowrap; transition: all 0.15s; margin-bottom: -1px; }
        .main-tab:hover { color: var(--text-dark); }
        .main-tab.active { color: var(--pink); border-bottom-color: var(--pink); font-weight: 600; }
        .main-tab-icon { display: flex; align-items: center; justify-content: center; }
        .main-tab-icon svg { width: 14px; height: 14px; }

        /* Tab content area — fills remaining height, each tab scrolls internally */
        .main-tab-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        .main-tab-content > div { flex: 1; overflow-y: auto; min-height: 0; }

        /* ── Sidebar (right) ── */
        .event-sidebar { width: 300px; flex-shrink: 0; background: white; border-left: 1px solid var(--border); display: flex; flex-direction: column; height: 100%; overflow: hidden; }
        .sidebar-hero { width: 100%; height: 150px; background: linear-gradient(135deg, var(--purple-pale) 0%, var(--pink-pale) 100%); flex-shrink: 0; overflow: hidden; }
        .sidebar-hero img { width: 100%; height: 100%; object-fit: cover; }
        .sidebar-hero-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
        .sidebar-hero-date { background: white; border-radius: 100px; padding: 5px 14px; font-size: 0.78rem; font-weight: 500; color: var(--text-mid); box-shadow: var(--shadow-sm); }
        .sidebar-scroll { flex: 1; overflow-y: auto; min-height: 0; }
        .sidebar-section { padding: 0.875rem 1.125rem; border-bottom: 1px solid var(--border); }
        .sidebar-section-title { font-size: 0.68rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 0.5rem; }

        /* RSVP buttons */
        .event-rsvp-row { display: flex; gap: 6px; align-items: center; flex-wrap: wrap; }
        .btn-going { display: flex; align-items: center; gap: 6px; background: var(--pink); color: white; border: none; border-radius: 100px; padding: 7px 14px; font-family: 'Albert Sans', sans-serif; font-size: 0.8rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-going:hover:not(:disabled) { background: #b04068; }
        .btn-going:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cantmake { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 6px 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
        .btn-cantmake:hover:not(:disabled) { border-color: #aaa; }
        .btn-cantmake:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-maybe { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 6px 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.8rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
        .btn-maybe:hover:not(:disabled) { border-color: var(--pink); color: var(--pink); }
        .btn-maybe:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Guest count */
        .guest-count-row { display: flex; align-items: center; gap: 8px; margin-top: 8px; flex-wrap: wrap; }
        .guest-count-label { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; }
        .guest-count-controls { display: flex; align-items: center; border: 1.5px solid var(--border); border-radius: 100px; overflow: hidden; }
        .guest-count-btn { width: 26px; height: 26px; border: none; background: white; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; color: var(--text-dark); transition: background 0.15s; }
        .guest-count-btn:hover:not(:disabled) { background: var(--pink-bg); }
        .guest-count-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .guest-count-value { width: 22px; text-align: center; font-size: 0.82rem; font-weight: 600; color: var(--text-dark); }
        .guest-count-note { font-size: 0.75rem; color: var(--pink); font-weight: 600; }

        /* Detail rows */
        .detail-row { display: flex; align-items: flex-start; gap: 8px; margin-bottom: 0.4rem; }
        .detail-icon { font-size: 0.95rem; flex-shrink: 0; margin-top: 1px; }
        .detail-val { font-size: 0.82rem; color: var(--text-mid); line-height: 1.5; }

        /* Edit button */
        .btn-edit-event { display: flex; align-items: center; gap: 6px; background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 5px 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.75rem; font-weight: 600; color: var(--text-mid); cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .btn-edit-event:hover { border-color: var(--pink); color: var(--pink); }

        /* Edit panel */
        .edit-panel { background: white; border: 1.5px solid var(--pink-pale); border-radius: var(--radius-lg); padding: 1.5rem; }
        .edit-panel-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1rem; }
        .edit-cancel-x { background: none; border: none; font-size: 1.5rem; color: var(--text-muted); cursor: pointer; line-height: 1; padding: 0 4px; }
        .edit-cancel-x:hover { color: var(--text-dark); }
        .edit-form { display: flex; flex-direction: column; gap: 0.5rem; }
        .edit-label { font-size: 0.82rem; font-weight: 600; color: var(--text-mid); margin-top: 0.25rem; }
        .edit-input { width: 100%; border: 1.5px solid var(--border); border-radius: 6px; padding: 9px 12px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; box-sizing: border-box; background: white; color: var(--text-dark); }
        .edit-input:focus { border-color: var(--pink); }
        .edit-textarea { resize: vertical; min-height: 80px; }
        .edit-date-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
        .edit-checkbox-label { display: flex; align-items: center; gap: 8px; font-size: 0.85rem; color: var(--text-mid); cursor: pointer; margin-top: 0.5rem; }
        .edit-actions { display: flex; gap: 8px; margin-top: 1rem; }
        .edit-btn-cancel { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 9px 20px; font-family: 'Albert Sans', sans-serif; font-size: 0.85rem; font-weight: 500; color: var(--text-mid); cursor: pointer; }
        .edit-btn-cancel:hover { border-color: #aaa; }
        .edit-btn-save { background: var(--pink); color: white; border: none; border-radius: 100px; padding: 9px 24px; font-family: 'Albert Sans', sans-serif; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .edit-btn-save:hover:not(:disabled) { background: #b04068; }
        .edit-btn-save:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Chat */
        .chat-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; min-height: 0; }
        .chat-messages { flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding: 1rem; }
        .chat-msg { display: flex; gap: 8px; align-items: flex-start; }
        .chat-msg.mine { flex-direction: row-reverse; }
        .chat-bubble-avatar { width: 28px; height: 28px; border-radius: 50%; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 700; color: var(--pink); flex-shrink: 0; }
        .chat-bubble { background: var(--pink-bg); border-radius: 14px; padding: 8px 12px; max-width: 80%; }
        .chat-msg.mine .chat-bubble { background: var(--pink); color: white; }
        .chat-bubble-name { font-size: 0.7rem; font-weight: 700; color: var(--pink); margin-bottom: 2px; }
        .chat-msg.mine .chat-bubble-name { color: rgba(255,255,255,0.8); }
        .chat-bubble-text { font-size: 0.85rem; line-height: 1.5; }
        .chat-input-row { display: flex; gap: 8px; padding: 0.75rem 1rem; border-top: 1px solid var(--border); flex-shrink: 0; }
        .chat-input { flex: 1; border: 1.5px solid var(--border); border-radius: 100px; padding: 9px 16px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; background: white; color: var(--text-dark); }
        .chat-input:focus { border-color: var(--pink); }
        .btn-send { background: var(--pink); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
        .btn-send:hover { background: #b04068; }

        @media (max-width: 900px) {
          .event-page { flex-direction: column; height: auto; overflow: visible; margin-top: var(--nav-height); }
          .event-sidebar { width: 100%; height: auto; flex-shrink: 0; border-left: none; border-bottom: 1px solid var(--border); }
          .sidebar-scroll { max-height: 60vh; }
          .event-main { height: calc(100svh - var(--nav-height)); flex-shrink: 0; }
        }
      `}</style>
    </div>
  )
}
