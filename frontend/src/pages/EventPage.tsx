
import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import {
  getEvent, getMembers, getMyRsvp, upsertRsvp, getRsvps,
  getPolls, createPoll, votePoll, closePoll, deletePoll,
  getPotluck, createPotluckItem, claimPotluckItem, unclaimPotluckItem, deletePotluckItem,
  getTasks, createTask, updateTask, deleteTask,
  getAnnouncements, createAnnouncement, deleteAnnouncement,
  regenerateInvite,
} from '../api/events'
import { EventChatSocket } from '../api/chat'
import type {
  EventOut, MemberOut, RSVPOut, PollOut, PotluckItemOut,
  TaskOut, AnnouncementOut, RSVPStatus,
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
      })
      setPolls(prev => [...prev, poll])
      setShowCreate(false)
      setQuestion('')
      setOptions(['', ''])
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', marginBottom: '0.75rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={multiSelect} onChange={e => setMultiSelect(e.target.checked)} />
            Allow multiple selections
          </label>
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
            </div>
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
function TasksTab({ eventUuid, myId, isHost }: { eventUuid: string; myId: string; isHost: boolean }) {
  const [tasks, setTasks] = useState<TaskOut[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
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
      const task = await createTask(eventUuid, { title: newTitle.trim() })
      setTasks(prev => [...prev, task])
      setShowCreate(false)
      setNewTitle('')
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
            style={{ width: '100%', border: '1.5px solid var(--border)', borderRadius: 6, padding: '8px 10px', fontSize: '0.85rem', marginBottom: '0.75rem', fontFamily: 'Albert Sans', boxSizing: 'border-box' }}
            placeholder="Task title..."
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
          />
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
                  Assigned to: {isAssignedToMe ? 'You' : task.assigned_to.slice(0, 8) + '...'}
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

// ── Guests Tab ────────────────────────────────────────────────────────────────
function GuestsTab({ eventUuid, myId, isHost: _isHost, rsvps }: { eventUuid: string; myId: string; isHost: boolean; rsvps: RSVPOut[] }) {
  const [members, setMembers] = useState<MemberOut[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMembers(eventUuid).then(setMembers).catch(() => {}).finally(() => setLoading(false))
  }, [eventUuid])

  if (loading) return <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.88rem' }}>Loading guests...</div>

  const rsvpMap = Object.fromEntries(rsvps.map(r => [r.user_id, r.status]))

  return (
    <div style={{ padding: '1rem' }}>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
        {members.length} member{members.length !== 1 ? 's' : ''}
      </div>
      {members.map(m => {
        const rsvpStatus = rsvpMap[m.user_id]
        const isMe = m.user_id === myId
        return (
          <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--purple-pale), var(--pink-pale))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--pink)', flexShrink: 0 }}>
              {m.user_id.slice(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-dark)' }}>
                {isMe ? 'You' : m.user_id.slice(0, 12) + '...'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>{m.role.replace('_', ' ')}</div>
            </div>
            {rsvpStatus && (
              <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 100, background: rsvpStatus === 'yes' ? '#e6f9ee' : rsvpStatus === 'no' ? '#fff0f0' : '#fffbe6', color: rsvpStatus === 'yes' ? '#1a7a3c' : rsvpStatus === 'no' ? '#c00' : '#856404', fontWeight: 600 }}>
                {rsvpStatus === 'yes' ? 'Going' : rsvpStatus === 'no' ? 'Not going' : 'Maybe'}
              </span>
            )}
          </div>
        )
      })}
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
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('chat')
  const [rsvpLoading, setRsvpLoading] = useState(false)
  const [inviteCopied, setInviteCopied] = useState(false)

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
    ]).then(([ev, rsvp, allRsvps]) => {
      setEvent(ev)
      setMyRsvp(rsvp)
      setRsvps(allRsvps as RSVPOut[])
    }).catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [eventUuid])

  const handleRsvp = async (status: RSVPStatus) => {
    setRsvpLoading(true)
    try {
      const updated = await upsertRsvp(eventUuid, status)
      setMyRsvp(updated)
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

  const isHost = event?.host_id === myId || event?.host_id === myDbId

  const sidebarItems = [
    { key: 'chat', label: 'Event Chat', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { key: 'polls', label: 'Polls', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="10" width="4" height="11" rx="1" /><rect x="10" y="6" width="4" height="15" rx="1" /><rect x="17" y="2" width="4" height="19" rx="1" /></svg> },
    { key: 'potluck', label: 'Potluck', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeLinecap="round" /><path d="M8 12h8M12 8v8" strokeLinecap="round" /></svg> },
    { key: 'tasks', label: 'Tasks', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" /></svg> },
    { key: 'announcements', label: 'Announcements', icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" /></svg> },
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
      <div className="event-main">
        {/* Hero */}
        <div className="event-hero">
          {event.flyer_url ? (
            <img src={event.flyer_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <>
              <div className="event-hero-badge">
                {event.start_dt ? formatDate(event.start_dt) : 'Date TBD'}
              </div>
              <div className="event-hero-text">
                Events are <span>better</span> when everyone plays a part
              </div>
            </>
          )}
        </div>

        {/* Content */}
        <div className="event-content">
          {error && (
            <div style={{ background: '#fff0f0', border: '1px solid #fcc', borderRadius: 8, padding: '0.75rem', marginBottom: '1rem', color: '#c00', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}

          <div className="event-cat-badge">🎉 Event</div>
          <h1 className="event-title">{event.title}</h1>
          {event.location && (
            <div className="event-location">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1.5A4.5 4.5 0 0113.5 6c0 3-4.5 8.5-4.5 8.5S4.5 9 4.5 6A4.5 4.5 0 018 1.5z" stroke="var(--text-muted)" strokeWidth="1.5" />
                <circle cx="8" cy="6" r="1.5" stroke="var(--text-muted)" strokeWidth="1.5" />
              </svg>
              {event.location}
            </div>
          )}

          {/* RSVP row */}
          <div className="event-rsvp-row">
            {myRsvp?.status === 'yes' ? (
              <>
                <span style={{ fontSize: '0.88rem', color: '#1a7a3c', fontWeight: 600 }}>You're going!</span>
                <button className="btn-cantmake" onClick={() => handleRsvp('no')} disabled={rsvpLoading}>
                  Can't Make It
                </button>
                <button className="btn-maybe" onClick={() => handleRsvp('maybe')} disabled={rsvpLoading}>
                  Maybe
                </button>
              </>
            ) : myRsvp?.status === 'no' ? (
              <>
                <span style={{ fontSize: '0.88rem', color: '#c00', fontWeight: 600 }}>Not going</span>
                <button className="btn-going" onClick={() => handleRsvp('yes')} disabled={rsvpLoading}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  I'm Going!
                </button>
              </>
            ) : (
              <>
                <button className="btn-cantmake" onClick={() => handleRsvp('no')} disabled={rsvpLoading}>
                  Can't Make It
                </button>
                <button className="btn-maybe" onClick={() => handleRsvp('maybe')} disabled={rsvpLoading}>
                  Maybe
                </button>
                <button className="btn-going" onClick={() => handleRsvp('yes')} disabled={rsvpLoading}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="white" strokeWidth="1.5" />
                    <path d="M5 8l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {rsvpLoading ? 'Saving...' : "I'm Going!"}
                </button>
              </>
            )}
          </div>

          <div className="event-info-grid">
            <div className="info-card">
              <div className="info-card-title">About the Event</div>
              <div className="info-card-content">
                {event.description || 'No description provided.'}
              </div>
              {event.start_dt && (
                <div style={{ marginTop: '1rem' }}>
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <div>
                      <div className="detail-label">Date & Time</div>
                      <div className="detail-val">{formatDate(event.start_dt)}{event.end_dt ? ` – ${formatDate(event.end_dt)}` : ''}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="info-card">
              <div className="info-card-title">RSVP Summary</div>
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                {[
                  { label: 'Going', status: 'yes', color: '#1a7a3c', bg: '#e6f9ee' },
                  { label: 'Maybe', status: 'maybe', color: '#856404', bg: '#fffbe6' },
                  { label: 'No', status: 'no', color: '#c00', bg: '#fff0f0' },
                ].map(({ label, status, color, bg }) => (
                  <div key={status} style={{ flex: 1, textAlign: 'center', background: bg, borderRadius: 8, padding: '0.75rem 0.5rem' }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 700, color }}>{rsvps.filter(r => r.status === status).length}</div>
                    <div style={{ fontSize: '0.72rem', color, fontWeight: 600 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Invite link (host only) */}
              {isHost && event.invite_token && event.invite_active && (
                <div style={{ marginTop: '0.75rem' }}>
                  <div className="info-card-title">Invite Link</div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      readOnly
                      value={`${window.location.origin}/join/${event.invite_token}`}
                      style={{ flex: 1, border: '1px solid var(--border)', borderRadius: 6, padding: '6px 10px', fontSize: '0.75rem', background: '#fafafa', color: 'var(--text-muted)', fontFamily: 'monospace' }}
                    />
                    <button onClick={handleCopyInvite} style={{ background: inviteCopied ? '#1a7a3c' : 'var(--pink)', color: 'white', border: 'none', borderRadius: 6, padding: '6px 12px', fontSize: '0.78rem', cursor: 'pointer', fontFamily: 'Albert Sans', fontWeight: 600, whiteSpace: 'nowrap' }}>
                      {inviteCopied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <button onClick={handleRegenerateInvite} style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontFamily: 'Albert Sans' }}>
                    Regenerate link
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      <div className="event-sidebar">
        <div className="sidebar-top">
          <div className="sidebar-lounge">
            <div className="lounge-avatar">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <circle cx="9" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5" />
                <path d="M3 15c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <div className="lounge-name">Event Lounge</div>
              <div className="lounge-sub">Collaborate with guests</div>
            </div>
          </div>
        </div>

        <div className="sidebar-nav">
          {sidebarItems.map((item) => (
            <div
              key={item.key}
              className={`sidebar-item${activeTab === item.key ? ' active' : ''}`}
              onClick={() => setActiveTab(item.key)}
            >
              {item.icon} {item.label}
            </div>
          ))}
        </div>

        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'chat' && (
            <ChatTab eventId={eventUuid} myId={myId} myName={myName} token={token} />
          )}
          {activeTab === 'polls' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <PollsTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'potluck' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <PotluckTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'tasks' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <TasksTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'announcements' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <AnnouncementsTab eventUuid={eventUuid} myId={myId} isHost={isHost} />
            </div>
          )}
          {activeTab === 'guests' && (
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <GuestsTab eventUuid={eventUuid} myId={myId} isHost={isHost} rsvps={rsvps} />
            </div>
          )}
        </div>

        {isHost && (
          <div className="sidebar-bottom">
            <button className="btn-cohost" onClick={handleCopyInvite}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="6" cy="6" r="3" stroke="var(--pink)" strokeWidth="1.5" />
                <path d="M2 14c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
                <path d="M13 6v4M11 8h4" stroke="var(--pink)" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {inviteCopied ? 'Link Copied!' : 'Copy Invite Link'}
            </button>
          </div>
        )}
      </div>

      <style>{`
        .event-page { display: flex; min-height: 100vh; padding-top: var(--nav-height); width: 100%; }
        .event-main { flex: 1; overflow-y: auto; }
        .event-hero { width: 100%; height: 280px; background: linear-gradient(135deg, var(--purple-pale) 0%, var(--pink-pale) 100%); display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
        .event-hero-badge { position: absolute; top: 20px; left: 24px; background: white; border-radius: 100px; padding: 5px 14px; font-size: 0.8rem; display: flex; align-items: center; gap: 6px; box-shadow: var(--shadow-sm); font-weight: 500; }
        .event-hero-text { font-family: 'Anton', sans-serif; font-size: 2rem; text-align: center; color: var(--text-dark); max-width: 60%; line-height: 1.2; }
        .event-hero-text span { color: var(--pink); }
        .event-content { padding: 2rem 2.5rem; }
        .event-cat-badge { display: inline-flex; align-items: center; gap: 6px; background: var(--pink-bg); border: 1px solid var(--pink-pale); border-radius: 100px; padding: 5px 14px; font-size: 0.82rem; color: var(--pink); font-weight: 600; margin-bottom: 0.75rem; }
        .event-title { font-family: 'Anton', sans-serif; font-size: 2.2rem; margin-bottom: 4px; color: var(--text-dark); }
        .event-location { display: flex; align-items: center; gap: 6px; font-size: 0.9rem; color: var(--text-muted); margin-bottom: 1.5rem; }
        .event-rsvp-row { display: flex; gap: 1rem; align-items: center; margin-bottom: 2rem; padding-bottom: 2rem; border-bottom: 1px solid var(--border); flex-wrap: wrap; }
        .btn-going { display: flex; align-items: center; gap: 8px; background: var(--pink); color: white; border: none; border-radius: 100px; padding: 12px 28px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .btn-going:hover:not(:disabled) { background: #b04068; }
        .btn-going:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-cantmake { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 11px 24px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
        .btn-cantmake:hover:not(:disabled) { border-color: #aaa; }
        .btn-cantmake:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn-maybe { background: none; border: 1.5px solid var(--border); border-radius: 100px; padding: 11px 24px; font-family: 'Albert Sans', sans-serif; font-size: 0.92rem; font-weight: 500; color: var(--text-mid); cursor: pointer; transition: all 0.2s; }
        .btn-maybe:hover:not(:disabled) { border-color: var(--pink); color: var(--pink); }
        .btn-maybe:disabled { opacity: 0.6; cursor: not-allowed; }
        .event-info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
        .info-card { background: white; border-radius: var(--radius); border: 1px solid var(--border); padding: 1.25rem; }
        .info-card-title { font-size: 0.82rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 0.75rem; }
        .info-card-content { font-size: 0.95rem; line-height: 1.7; color: var(--text-mid); }
        .detail-row { display: flex; align-items: flex-start; gap: 10px; margin-bottom: 0.75rem; }
        .detail-icon { font-size: 1.1rem; margin-top: 1px; flex-shrink: 0; }
        .detail-label { font-size: 0.82rem; font-weight: 700; color: var(--text-muted); }
        .detail-val { font-size: 0.88rem; color: var(--text-mid); }
        .event-sidebar { width: 280px; background: white; border-left: 1px solid var(--border); display: flex; flex-direction: column; height: calc(100vh - var(--nav-height)); position: sticky; top: var(--nav-height); }
        .sidebar-top { padding: 1.25rem; border-bottom: 1px solid var(--border); }
        .sidebar-lounge { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: var(--radius-sm); cursor: pointer; background: var(--pink-bg); }
        .lounge-avatar { width: 34px; height: 34px; border-radius: 50%; background: linear-gradient(135deg, var(--purple-pale), var(--pink-pale)); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .lounge-name { font-weight: 700; font-size: 0.9rem; color: var(--pink); }
        .lounge-sub { font-size: 0.75rem; color: var(--text-muted); }
        .sidebar-nav { display: flex; flex-direction: column; padding: 0.75rem; gap: 2px; }
        .sidebar-item { display: flex; align-items: center; gap: 10px; padding: 8px 12px; border-radius: var(--radius-sm); cursor: pointer; font-size: 0.82rem; font-weight: 500; color: var(--text-mid); transition: all 0.15s; }
        .sidebar-item svg { width: 16px; height: 16px; flex-shrink: 0; }
        .sidebar-item:hover, .sidebar-item.active { background: var(--pink-bg); color: var(--pink); }
        .sidebar-bottom { padding: 1rem; border-top: 1px solid var(--border); }
        .btn-cohost { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; background: var(--pink-bg); border: 1.5px solid var(--pink-pale); border-radius: var(--radius-sm); padding: 11px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; font-weight: 600; color: var(--pink); cursor: pointer; transition: all 0.2s; }
        .btn-cohost:hover { background: var(--pink-pale); }
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
        .chat-input-row { display: flex; gap: 8px; padding: 0.75rem 1rem; border-top: 1px solid var(--border); }
        .chat-input { flex: 1; border: 1.5px solid var(--border); border-radius: 100px; padding: 9px 16px; font-family: 'Albert Sans', sans-serif; font-size: 0.88rem; outline: none; transition: border-color 0.2s; background: white; color: var(--text-dark); }
        .chat-input:focus { border-color: var(--pink); }
        .btn-send { background: var(--pink); color: white; border: none; border-radius: 50%; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; transition: background 0.2s; }
        .btn-send:hover { background: #b04068; }
        @media (max-width: 768px) {
          .event-page { flex-direction: column; }
          .event-sidebar { width: 100%; height: auto; position: static; border-left: none; border-top: 1px solid var(--border); }
          .event-info-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  )
}
