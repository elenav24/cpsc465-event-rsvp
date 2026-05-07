import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { marked } from "marked";
import {
  FiCalendar,
  FiRepeat,
  FiLink,
  FiMapPin,
  FiStar,
  FiCheck,
  FiX,
} from "react-icons/fi";
import { BsStars } from "react-icons/bs";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useAuth } from "../auth/AuthContext";
import {
  getEvent,
  getMembers,
  getMyRsvp,
  upsertRsvp,
  getRsvps,
  getPolls,
  createPoll,
  votePoll,
  closePoll,
  deletePoll,
  getPotluck,
  createPotluckItem,
  claimPotluckItem,
  unclaimPotluckItem,
  deletePotluckItem,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getAnnouncements,
  createAnnouncement,
  deleteAnnouncement,
  regenerateInvite,
  updateEvent,
  revokeInvite,
  updateMemberRole,
  removeMember,
  askAi,
} from "../api/events";
import type { AiMessage } from "../api/events";
import { EventChatSocket } from "../api/chat";
import type { EventUpdate } from "../api/chat";
import type {
  EventOut,
  MemberOut,
  RSVPOut,
  PollOut,
  PotluckItemOut,
  TaskOut,
  AnnouncementOut,
  RSVPStatus,
} from "../api/types";
import type { WsMessage } from "../api/chat";

function formatDate(dt: string | null): string {
  if (!dt) return "Date TBD";
  const d = new Date(dt);
  return (
    d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }) +
    " \u2022 " +
    d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })
  );
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function copyToClipboard(text: string) {
  navigator.clipboard.writeText(text).catch(() => {});
}

// ── Chat Panel (right column) ─────────────────────────────────────────────────
function ChatPanel({
  eventId,
  myId,
  myName,
  token,
  onMessagesChange,
  onEventUpdate,
}: {
  eventId: string;
  myId: string;
  myName: string;
  token: string;
  onMessagesChange?: (msgs: WsMessage[]) => void;
  onEventUpdate?: (update: import("../api/chat").EventUpdate) => void;
}) {
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [input, setInput] = useState("");
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<EventChatSocket | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    const socket = new EventChatSocket({
      eventId,
      token,
      senderId: myId,
      senderName: myName,
      onMessage: (msg) =>
        setMessages((prev) => {
          const next = [...prev, msg];
          onMessagesChange?.(next);
          return next;
        }),
      onHistory: (msgs) => {
        setMessages(msgs);
        onMessagesChange?.(msgs);
      },
      onConnect: () => setConnected(true),
      onDisconnect: () => setConnected(false),
      onEventUpdate,
    });
    socketRef.current = socket;
    return () => socket.close();
  }, [eventId, token, myId, myName]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    socketRef.current?.sendMessage(text);
    setInput("");
  };

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {!connected && (
        <div className="px-3 py-1.5 bg-[#fffbe6] border-b border-[#ffe58f] text-[0.75rem] text-[#856404]">Connecting to chat…</div>
      )}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 p-3">
        {messages.length === 0 && (
          <div className="text-center py-8 px-4 text-text-muted text-[0.82rem]">
            No messages yet. Start the conversation!
          </div>
        )}
        {messages.map((msg) => {
          const mine = msg.sender_id === myId;
          return (
            <div key={msg.id} className={`flex gap-[7px] items-start${mine ? " flex-row-reverse" : ""}`}>
              <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#fce7f3] to-[#fda4af] flex items-center justify-center text-[0.6rem] font-bold text-[#be185d] flex-shrink-0">
                {getInitials(msg.sender_name)}
              </div>
              <div className={`rounded-xl px-[11px] py-[7px] max-w-[80%]${mine ? " bg-pink text-white" : " bg-pink-bg"}`}>
                <div className={`text-[0.65rem] font-bold mb-0.5${mine ? " text-white/75" : " text-pink"}`}>
                  {mine ? "You" : msg.sender_name}
                </div>
                <div className="text-[0.82rem] leading-[1.5]">{msg.content}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-[7px] p-[10px_12px] border-t border-border flex-shrink-0">
        <input
          className="flex-1 border-[1.5px] border-border rounded-full px-[14px] py-2 font-sans text-[0.82rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark focus:border-pink"
          placeholder="Chat with guests…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          maxLength={500}
        />
        <button
          className="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer flex-shrink-0 bg-pink text-white hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={send}
          aria-label="Send"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Polls Tab ─────────────────────────────────────────────────────────────────
function PollsTab({
  eventUuid,
  myId,
  isHost,
  version,
}: {
  eventUuid: string;
  myId: string;
  isHost: boolean;
  version: number;
}) {
  const [polls, setPolls] = useState<PollOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [multiSelect, setMultiSelect] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [closesAt, setClosesAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getPolls(eventUuid)
      .then(setPolls)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventUuid]);
  useEffect(() => {
    load();
  }, [load]);
  // Re-fetch when a remote update arrives
  useEffect(() => {
    if (version > 0) load();
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleVote = async (
    pollId: number,
    optionId: number,
    multi: boolean,
    currentVotes: number[],
  ) => {
    const ids = multi
      ? currentVotes.includes(optionId)
        ? currentVotes.filter((id) => id !== optionId)
        : [...currentVotes, optionId]
      : [optionId];
    try {
      const updated = await votePoll(eventUuid, pollId, ids);
      setPolls((prev) => prev.map((p) => (p.id === pollId ? updated : p)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Vote failed");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.filter((o) => o.trim());
    if (validOptions.length < 2) {
      setError("Need at least 2 options");
      return;
    }
    setSaving(true);
    try {
      const poll = await createPoll(eventUuid, {
        question,
        options: validOptions.map((text, i) => ({ text, display_order: i })),
        allow_multi_select: multiSelect,
        is_anonymous: isAnonymous,
        closes_at: closesAt ? new Date(closesAt).toISOString() : null,
      });
      setPolls((prev) => [...prev, poll]);
      setShowCreate(false);
      setQuestion("");
      setOptions(["", ""]);
      setMultiSelect(false);
      setIsAnonymous(false);
      setClosesAt("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create poll");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async (pollId: number) => {
    try {
      const u = await closePoll(eventUuid, pollId);
      setPolls((prev) => prev.map((p) => (p.id === pollId ? u : p)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };
  const handleDelete = async (pollId: number) => {
    try {
      await deletePoll(eventUuid, pollId);
      setPolls((prev) => prev.filter((p) => p.id !== pollId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <div className="p-4 text-text-muted text-[0.85rem]">Loading polls…</div>;

  return (
    <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1">
      {error && <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md">{error}</div>}
      {isHost && !showCreate && (
        <button className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60 self-start" onClick={() => setShowCreate(true)}>
          + Create Poll
        </button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-pink-bg border border-pink-pale rounded-[10px] p-[14px] flex flex-col gap-1.5">
          <div className="font-bold text-[0.85rem] mb-1">New Poll</div>
          <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" placeholder="Question…" value={question} onChange={(e) => setQuestion(e.target.value)} required />
          {options.map((opt, i) => (
            <input key={i} className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" placeholder={`Option ${i + 1}`} value={opt} onChange={(e) => setOptions((prev) => prev.map((o, j) => (j === i ? e.target.value : o)))} />
          ))}
          <button type="button" className="text-[0.72rem] text-text-muted bg-none border-none cursor-pointer underline self-start p-0" onClick={() => setOptions((prev) => [...prev, ""])}>+ Add option</button>
          <label className="flex items-center gap-1.5 text-[0.78rem] cursor-pointer text-text-mid"><input type="checkbox" checked={multiSelect} onChange={(e) => setMultiSelect(e.target.checked)} className="w-4 h-4 cursor-pointer" />Allow multiple selections</label>
          <label className="flex items-center gap-1.5 text-[0.78rem] cursor-pointer text-text-mid"><input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="w-4 h-4 cursor-pointer" />Anonymous voting</label>
          <div>
            <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Auto-close at (optional)</label>
            <input type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} className="border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark w-auto" />
          </div>
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={saving} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60">{saving ? "Creating…" : "Create"}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-none border border-border rounded-full px-[14px] py-[7px] font-sans text-[0.8rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Cancel</button>
          </div>
        </form>
      )}
      {polls.length === 0 && !showCreate && (
        <div className="text-center py-8 text-text-muted text-[0.82rem]">No polls yet.{isHost ? " Create one above!" : ""}</div>
      )}
      {polls.map((poll) => {
        const myVotes = poll.votes.filter((v) => v.voter_id === myId).map((v) => v.option_id);
        const totalVotes = poll.options.reduce((s, o) => s + o.vote_count, 0);
        return (
          <div key={poll.id} className="bg-white border border-border rounded-[10px] px-[14px] py-3">
            <div className="font-bold text-[0.88rem] mb-2 text-text-dark">
              {poll.question}
              {poll.is_closed && <span className="ml-2 text-[0.68rem] bg-[#eee] text-[#666] rounded-full px-2 py-0.5 font-semibold">Closed</span>}
              {poll.is_anonymous && <span className="ml-2 text-[0.68rem] bg-pink-bg text-pink rounded-full px-2 py-0.5 font-semibold">Anonymous</span>}
            </div>
            {poll.closes_at && !poll.is_closed && (
              <div className="text-[0.72rem] text-text-muted mb-1">Closes: {new Date(poll.closes_at).toLocaleString()}</div>
            )}
            {poll.options.map((opt) => {
              const pct = totalVotes > 0 ? Math.round((opt.vote_count / totalVotes) * 100) : 0;
              const voted = myVotes.includes(opt.id);
              return (
                <div key={opt.id} className={`relative px-[10px] py-[7px] mb-1 rounded-md border-[1.5px] cursor-pointer overflow-hidden transition-[border-color] duration-200 text-[0.8rem]${voted ? " border-pink bg-pink-bg" : " border-border bg-white"}`}
                  onClick={() => !poll.is_closed && handleVote(poll.id, opt.id, poll.allow_multi_select, myVotes)}>
                  <div className="ep-poll-bar" style={{ width: `${pct}%` }} />
                  <span className="relative z-[1]">{opt.text}</span>
                  <span className="ep-poll-pct">{pct}%</span>
                </div>
              );
            })}
            <div className="text-[0.72rem] text-text-muted mt-1.5">{totalVotes} vote{totalVotes !== 1 ? "s" : ""}</div>
            {isHost && !poll.is_closed && (
              <div className="flex gap-2 items-center mt-2">
                <button onClick={() => handleClose(poll.id)} className="bg-none border border-border rounded-full px-[10px] py-[3px] font-sans text-[0.72rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Close poll</button>
                <button onClick={() => handleDelete(poll.id)} className="bg-none border-none font-sans text-[0.75rem] text-[#c00] cursor-pointer p-0 hover:underline">Delete</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Potluck Tab ───────────────────────────────────────────────────────────────
function PotluckTab({
  eventUuid,
  myId,
  isHost,
  version,
}: {
  eventUuid: string;
  myId: string;
  isHost: boolean;
  version: number;
}) {
  const [items, setItems] = useState<PotluckItemOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newQty, setNewQty] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getPotluck(eventUuid)
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventUuid]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (version > 0) load();
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClaim = async (itemId: number, hasClaim: boolean) => {
    try {
      if (hasClaim) {
        await unclaimPotluckItem(eventUuid, itemId);
        setItems((prev) =>
          prev.map((i) =>
            i.id === itemId
              ? {
                  ...i,
                  claims: i.claims.filter((c) => c.user_id !== myId),
                  claims_count: i.claims_count - 1,
                }
              : i,
          ),
        );
      } else {
        const updated = await claimPotluckItem(eventUuid, itemId);
        setItems((prev) => prev.map((i) => (i.id === itemId ? updated : i)));
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const item = await createPotluckItem(eventUuid, {
        name: newName.trim(),
        quantity_needed: newQty,
      });
      setItems((prev) => [...prev, item]);
      setShowCreate(false);
      setNewName("");
      setNewQty(1);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemId: number) => {
    try {
      await deletePotluckItem(eventUuid, itemId);
      setItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <div className="p-4 text-text-muted text-[0.85rem]">Loading potluck…</div>;

  return (
    <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1">
      {error && <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md">{error}</div>}
      {isHost && !showCreate && (
        <button className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60 self-start" onClick={() => setShowCreate(true)}>+ Add Item</button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-pink-bg border border-pink-pale rounded-[10px] p-[14px] flex flex-col gap-1.5">
          <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" placeholder="Item name (e.g. Paper plates)" value={newName} onChange={(e) => setNewName(e.target.value)} required />
          <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Quantity needed</label>
          <input type="number" min={1} className="border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark w-20" value={newQty} onChange={(e) => setNewQty(Number(e.target.value))} />
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={saving} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60">{saving ? "Adding…" : "Add"}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-none border border-border rounded-full px-[14px] py-[7px] font-sans text-[0.8rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Cancel</button>
          </div>
        </form>
      )}
      {items.length === 0 && !showCreate && (
        <div className="text-center py-8 text-text-muted text-[0.82rem]">No potluck items yet.{isHost ? " Add some above!" : ""}</div>
      )}
      {items.map((item) => {
        const hasClaim = item.claims.some((c) => c.user_id === myId);
        const full = item.claims_count >= item.quantity_needed;
        return (
          <div key={item.id} className="bg-white border border-border rounded-[10px] px-[14px] py-3 flex items-center gap-2.5">
            <div style={{ flex: 1 }}>
              <div className="text-[0.85rem] font-semibold text-text-dark">{item.name}</div>
              <div className="text-[0.72rem] text-text-muted">{item.claims_count}/{item.quantity_needed} claimed</div>
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
              {isHost && (
                <button onClick={() => handleDelete(item.id)} className="bg-none border-none font-sans text-[0.75rem] text-[#c00] cursor-pointer p-0 hover:underline">Remove</button>
              )}
              <button
                onClick={() => handleClaim(item.id, hasClaim)}
                disabled={!hasClaim && full}
                className={`text-[0.76rem] font-semibold rounded-full px-3 py-[5px] cursor-pointer font-sans transition-all duration-200 border${hasClaim ? " bg-pink text-white border-pink" : full ? " bg-[#eee] text-[#999] border-[#ddd] cursor-not-allowed" : " bg-pink-bg text-pink border-pink-pale hover:bg-pink hover:text-white"}`}
              >
                {hasClaim ? "Unclaim" : full ? "Full" : "Claim"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────
function TasksTab({
  eventUuid,
  myId,
  isHost,
  members,
  version,
  onTasksChange,
}: {
  eventUuid: string;
  myId: string;
  isHost: boolean;
  members: MemberOut[];
  version: number;
  onTasksChange?: (tasks: TaskOut[]) => void;
}) {
  const [tasks, setTasks] = useState<TaskOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getTasks(eventUuid)
      .then((t) => {
        setTasks(t);
        onTasksChange?.(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventUuid]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (version > 0) load();
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (task: TaskOut) => {
    try {
      const u = await updateTask(eventUuid, task.id, {
        is_completed: !task.is_completed,
      });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? u : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };
  const handleVolunteer = async (task: TaskOut) => {
    try {
      const u = await updateTask(eventUuid, task.id, { assigned_to: myId });
      setTasks((prev) => prev.map((t) => (t.id === task.id ? u : t)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setSaving(true);
    try {
      const task = await createTask(eventUuid, {
        title: newTitle.trim(),
        assigned_to: newAssignee || undefined,
        due_date: newDueDate || undefined,
      });
      setTasks((prev) => [...prev, task]);
      setShowCreate(false);
      setNewTitle("");
      setNewAssignee("");
      setNewDueDate("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (taskId: number) => {
    try {
      await deleteTask(eventUuid, taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <div className="p-4 text-text-muted text-[0.85rem]">Loading tasks…</div>;

  return (
    <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1">
      {error && <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md">{error}</div>}
      {isHost && !showCreate && (
        <button className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60 self-start" onClick={() => setShowCreate(true)}>+ Add Task</button>
      )}
      {showCreate && (
        <form onSubmit={handleCreate} className="bg-pink-bg border border-pink-pale rounded-[10px] p-[14px] flex flex-col gap-1.5">
          <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" placeholder="Task title…" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} required />
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Assign to</label>
              <select className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" value={newAssignee} onChange={(e) => setNewAssignee(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map((m) => (<option key={m.user_id} value={m.user_id}>{m.user_id === myId ? "You" : m.display_name || m.user_id.slice(0, 8)}</option>))}
              </select>
            </div>
            <div>
              <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Due date</label>
              <input type="date" className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" value={newDueDate} onChange={(e) => setNewDueDate(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-1">
            <button type="submit" disabled={saving} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60">{saving ? "Adding…" : "Add"}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="bg-none border border-border rounded-full px-[14px] py-[7px] font-sans text-[0.8rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Cancel</button>
          </div>
        </form>
      )}
      {tasks.length === 0 && !showCreate && (
        <div className="text-center py-8 text-text-muted text-[0.82rem]">No tasks yet.{isHost ? " Add some above!" : ""}</div>
      )}
      {tasks.map((task) => {
        const isAssignedToMe = task.assigned_to === myId;
        const canToggle = isHost || isAssignedToMe;
        const canVolunteer = !task.assigned_to && !isHost;
        return (
          <div key={task.id} className="bg-white border border-border rounded-[10px] px-[14px] py-3 flex items-center gap-2.5">
            <input type="checkbox" checked={task.is_completed} onChange={() => canToggle && handleToggle(task)} disabled={!canToggle} className="w-4 h-4 cursor-pointer flex-shrink-0" />
            <div style={{ flex: 1 }}>
              <div className="text-[0.85rem] font-semibold text-text-dark" style={{ textDecoration: task.is_completed ? "line-through" : "none", opacity: task.is_completed ? 0.55 : 1 }}>{task.title}</div>
              {task.assigned_to && <div className="text-[0.72rem] text-text-muted">Assigned to: {isAssignedToMe ? "You" : members.find((m) => m.user_id === task.assigned_to)?.display_name || task.assigned_to.slice(0, 8) + "…"}</div>}
              {task.due_date && <div className="text-[0.72rem] text-text-muted">Due: {new Date(task.due_date).toLocaleDateString()}</div>}
            </div>
            <div className="flex gap-2 items-center flex-shrink-0">
              {canVolunteer && <button onClick={() => handleVolunteer(task)} className="bg-none border border-border rounded-full px-[10px] py-[3px] font-sans text-[0.72rem] font-medium text-pink cursor-pointer hover:border-[#aaa]">Volunteer</button>}
              {isHost && <button onClick={() => handleDelete(task.id)} className="bg-none border-none font-sans text-[0.75rem] text-[#c00] cursor-pointer p-0 hover:underline">Remove</button>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Announcements Tab ─────────────────────────────────────────────────────────
function AnnouncementsTab({
  eventUuid,
  eventTitle,
  myId,
  isHost,
  onNew,
  version,
}: {
  eventUuid: string;
  eventTitle: string;
  myId: string;
  isHost: boolean;
  onNew?: () => void;
  version: number;
}) {
  const [announcements, setAnnouncements] = useState<AnnouncementOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAnnouncements(eventUuid)
      .then(setAnnouncements)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventUuid]);
  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    if (version > 0) {
      load();
      onNew?.();
    }
  }, [version]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    try {
      const ann = await createAnnouncement(eventUuid, body.trim());
      setAnnouncements((prev) => [ann, ...prev]);
      setBody("");
      onNew?.();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (id: number) => {
    try {
      await deleteAnnouncement(eventUuid, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  if (loading) return <div className="p-4 text-text-muted text-[0.85rem]">Loading…</div>;

  return (
    <div className="p-3 flex flex-col gap-2.5 overflow-y-auto flex-1">
      {error && <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md">{error}</div>}
      {isHost && (
        <form onSubmit={handlePost} className="flex flex-col gap-2">
          <textarea
            className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark resize-y min-h-[70px]"
            placeholder="Post an announcement to all guests…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit" disabled={saving || !body.trim()} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60 self-end">
            {saving ? "Posting…" : "Post Announcement"}
          </button>
        </form>
      )}
      {announcements.length === 0 && (
        <div className="bg-pink-bg border border-pink-pale rounded-[10px] px-[14px] py-3">
          <div className="text-[0.85rem] text-text-dark leading-[1.6] font-semibold">🎉 Welcome to {eventTitle}!</div>
          <div className="text-[0.85rem] text-text-muted leading-[1.6] mt-1">You're all set! RSVP, vote in polls, and grab a spot on the potluck list. Check back here often because the host will post all the important updates right in this feed.</div>
          <div className="text-[0.72rem] text-text-muted mt-1.5">Pinned by Cohosted</div>
        </div>
      )}
      {announcements.map((ann) => (
        <div key={ann.id} className="bg-pink-bg border border-pink-pale rounded-[10px] px-[14px] py-3">
          <div className="text-[0.85rem] text-text-dark leading-[1.6]">{ann.body}</div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="text-[0.72rem] text-text-muted">
              {new Date(ann.created_at).toLocaleString()}
              {ann.sms_sent && <span className="ml-2 text-pink">SMS sent</span>}
            </div>
            {(isHost || ann.author_id === myId) && (
              <button onClick={() => handleDelete(ann.id)} className="bg-none border-none font-sans text-[0.72rem] text-[#c00] cursor-pointer p-0 hover:underline">Delete</button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const html = useMemo(() => {
    marked.setOptions({ breaks: true });
    return marked.parse(content) as string;
  }, [content]);
  return (
    <div
      className="ep-ai-markdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── AI Tab ────────────────────────────────────────────────────────────────────
function AiTab({
  eventUuid,
  messages,
  setMessages,
  chatMessages,
  rsvps,
  tasks,
}: {
  eventUuid: string;
  messages: AiMessage[];
  setMessages: React.Dispatch<React.SetStateAction<AiMessage[]>>;
  chatMessages: WsMessage[];
  rsvps: RSVPOut[];
  members: MemberOut[];
  tasks: TaskOut[];
}) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const goingCount = rsvps.filter((r) => r.status === "yes").length;
  const totalGuests = rsvps
    .filter((r) => r.status === "yes")
    .reduce((s, r) => s + r.guest_count, 0);
  const totalAttending = goingCount + totalGuests;

  // Next action: first incomplete task, or a fallback
  const nextTask = tasks.find((t) => !t.is_completed);
  const completedCount = tasks.filter((t) => t.is_completed).length;

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setError(null);
    const contextPrefix =
      chatMessages.length > 0
        ? `[Recent event chat for context — ${chatMessages.length} messages from ${[...new Set(chatMessages.map((m) => m.sender_name))].join(", ")}]\n\n`
        : "";
    const fullContent = contextPrefix ? `${contextPrefix}${text}` : text;
    const next: AiMessage[] = [
      ...messages,
      { role: "user", content: fullContent },
    ];
    setMessages([...messages, { role: "user", content: text }]);
    setLoading(true);
    try {
      const { reply } = await askAi(eventUuid, next);
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[#fff5f9]">
      {/* COHOST AI BRAIN status card */}
      <div className="m-3 mb-0 p-[14px_16px] bg-gradient-to-br from-[#fdf2f8] to-[#fce7f3] border-2 border-dashed border-[#f9a8d4] rounded-xl flex items-start gap-3 flex-shrink-0">
        <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-pink to-[#be185d] flex items-center justify-center flex-shrink-0 shadow-[0_2px_8px_rgba(190,24,93,0.3)]">
          <BsStars size={20} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="font-sans text-[0.82rem] font-extrabold text-[#be185d] tracking-[0.04em] mb-0.5">COHOST AI BRAIN</div>
          <div className="text-[0.73rem] text-[#db7093] leading-[1.4]">
            {messages.length === 0 ? "Ask me anything about this event — guests, logistics, or ideas." : `${messages.filter((m) => m.role === "assistant").length} response${messages.filter((m) => m.role === "assistant").length !== 1 ? "s" : ""} in this session.`}
          </div>
        </div>
        <div className="ep-ai-brain-stats flex gap-2 flex-shrink-0">
          <div className="text-center px-[10px] py-[6px] bg-white border-[1.5px] border-[#f9a8d4] rounded-lg min-w-[80px]">
            <div className="text-[0.56rem] font-bold text-[#db7093] tracking-[0.06em] mb-0.5 uppercase">ATTENDING</div>
            <div className="text-[0.82rem] font-extrabold text-[#be185d]">{totalAttending} going</div>
          </div>
          <div className="text-center px-[10px] py-[6px] bg-white border-[1.5px] border-[#f9a8d4] rounded-lg min-w-[80px]">
            <div className="text-[0.56rem] font-bold text-[#db7093] tracking-[0.06em] mb-0.5 uppercase">NEXT ACTION</div>
            <div className={`font-extrabold${nextTask ? " text-[0.75rem] text-pink" : " text-[0.82rem] text-[#be185d]"}`}>
              {nextTask ? nextTask.title : tasks.length > 0 ? `All ${completedCount} done ✓` : "No tasks yet"}
            </div>
          </div>
        </div>
      </div>

      {/* AI chat label */}
      <div className="px-4 pt-2.5 pb-1 text-[0.68rem] font-bold text-[#db7093] tracking-[0.04em] flex-shrink-0">
        AI ASSISTANT CHAT
        <span className="font-normal text-text-muted ml-1.5 italic">(Privately with Hosts)</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 px-3 py-2">
        {messages.length === 0 && !loading && (
          <div className="text-center py-10 px-6 text-[#f9a8d4] text-[0.85rem] flex flex-col items-center gap-2.5">
            <BsStars size={28} color="rgba(127,119,221,0.5)" />
            <div>Ask anything about this event —<br />guests, polls, tasks, or the chat.</div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-[7px] items-start${msg.role === "user" ? " flex-row-reverse" : ""}`}>
            <div className={`w-[26px] h-[26px] rounded-full flex items-center justify-center text-[0.6rem] font-bold flex-shrink-0${msg.role === "user" ? " bg-pink text-white" : " bg-[#fce7f3] text-[#be185d]"}`}>
              {msg.role === "user" ? "Me" : <BsStars size={11} />}
            </div>
            <div className={`rounded-xl px-3 py-2 max-w-[85%]${msg.role === "user" ? " bg-pink text-white" : " bg-white border border-[#f9a8d4] text-text-dark"}`}>
              {msg.role === "assistant" ? <MarkdownContent content={msg.content} /> : <div className="text-[0.82rem] leading-[1.5]">{msg.content}</div>}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-[7px] items-start">
            <div className="w-[26px] h-[26px] rounded-full bg-[#fce7f3] text-[#be185d] flex items-center justify-center text-[0.6rem] font-bold flex-shrink-0"><BsStars size={11} /></div>
            <div className="bg-white border border-[#f9a8d4] rounded-xl px-3 py-2">
              <div className="flex gap-1 py-0.5">
                <span className="ep-ai-dot inline-block w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" />
                <span className="ep-ai-dot inline-block w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" style={{ animationDelay: "0.2s" }} />
                <span className="ep-ai-dot inline-block w-1.5 h-1.5 rounded-full bg-[#f9a8d4]" style={{ animationDelay: "0.4s" }} />
              </div>
            </div>
          </div>
        )}
        {error && <div className="mx-3 bg-[rgba(255,80,80,0.1)] border border-[rgba(255,80,80,0.25)] rounded-md px-3 py-2 text-[#c00] text-[0.78rem]">{error}</div>}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex gap-[7px] px-3 py-2.5 border-t border-[#fce7f3] flex-shrink-0 bg-[#fff5f9]">
        <input
          className="flex-1 border-[1.5px] border-[#f9a8d4] rounded-full px-[14px] py-2 font-sans text-[0.82rem] outline-none transition-[border-color] duration-200 bg-white text-text-dark placeholder:text-[#db7093] focus:border-pink"
          placeholder="Ask AI…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
          disabled={loading}
        />
        <button className="border-none rounded-full w-8 h-8 flex items-center justify-center cursor-pointer flex-shrink-0 bg-pink text-white hover:bg-accent-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors" onClick={send} disabled={loading} aria-label="Send">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M14 8L2 2l3 6-3 6 12-6z" fill="white" /></svg>
        </button>
      </div>
    </div>
  );
}

// ── Edit Event Panel ──────────────────────────────────────────────────────────
function EditEventPanel({
  event,
  onSave,
  onCancel,
}: {
  event: EventOut;
  onSave: (updated: EventOut) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(event.title);
  const [description, setDescription] = useState(event.description ?? "");
  const [location, setLocation] = useState(event.location ?? "");
  const [startDate, setStartDate] = useState(
    event.start_dt ? event.start_dt.slice(0, 10) : "",
  );
  const [startTime, setStartTime] = useState(
    event.start_dt ? event.start_dt.slice(11, 16) : "",
  );
  const [endDate, setEndDate] = useState(
    event.end_dt ? event.end_dt.slice(0, 10) : "",
  );
  const [endTime, setEndTime] = useState(
    event.end_dt ? event.end_dt.slice(11, 16) : "",
  );
  const [viewableByLink, setViewableByLink] = useState(
    event.viewable_by_link ?? false,
  );
  const [recurrenceRule, setRecurrenceRule] = useState(
    event.recurrence_rule ?? "",
  );
  const [recurrenceEndDate, setRecurrenceEndDate] = useState(
    event.recurrence_end_dt ? event.recurrence_end_dt.slice(0, 10) : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body: Partial<EventOut> & Record<string, unknown> = {
        title: title.trim(),
      };
      body.description = description || null;
      body.location = location || null;
      body.start_dt = startDate
        ? startTime
          ? `${startDate}T${startTime}:00`
          : `${startDate}T00:00:00`
        : null;
      body.end_dt = endDate
        ? endTime
          ? `${endDate}T${endTime}:00`
          : `${endDate}T23:59:00`
        : null;
      body.viewable_by_link = viewableByLink;
      body.recurrence_rule = recurrenceRule || null;
      body.recurrence_end_dt = recurrenceEndDate
        ? `${recurrenceEndDate}T23:59:00`
        : null;
      const updated = await updateEvent(event.uuid, body as Partial<EventOut>);
      onSave(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white border-[1.5px] border-pink-pale rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="m-0 font-heading text-[1.1rem] text-text-dark">Edit Event</h3>
        <button onClick={onCancel} className="bg-none border-none text-[1.5rem] text-text-muted cursor-pointer leading-none px-1 hover:text-text-dark" aria-label="Close">&times;</button>
      </div>
      {error && <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md mb-2">{error}</div>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5">
        <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Title *</label>
        <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Description</label>
        <textarea className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark resize-y min-h-[70px]" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Tell your guests what to expect…" />
        <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Location</label>
        <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Address or venue" />
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Start Date</label><input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
          <div><label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Start Time</label><input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div><label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">End Date</label><input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} /></div>
          <div><label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">End Time</label><input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
        </div>
        <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Repeat</label>
        <select className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" value={recurrenceRule} onChange={(e) => setRecurrenceRule(e.target.value)}>
          <option value="">Does not repeat</option>
          <option value="DAILY">Daily</option>
          <option value="WEEKLY">Weekly</option>
          <option value="MONTHLY">Monthly</option>
        </select>
        {recurrenceRule && (
          <>
            <label className="text-[0.75rem] font-semibold text-text-muted block mb-[3px]">Repeat until</label>
            <input className="w-full border-[1.5px] border-border rounded-md px-[10px] py-2 font-sans text-[0.82rem] outline-none focus:border-pink bg-white text-text-dark" type="date" value={recurrenceEndDate} onChange={(e) => setRecurrenceEndDate(e.target.value)} />
          </>
        )}
        <label className="flex items-center gap-1.5 text-[0.78rem] cursor-pointer text-text-mid mt-1">
          <input type="checkbox" checked={viewableByLink} onChange={(e) => setViewableByLink(e.target.checked)} className="w-4 h-4 cursor-pointer" />
          <span>Viewable by anyone with the link</span>
        </label>
        <div className="flex gap-2 mt-2">
          <button type="button" onClick={onCancel} className="bg-none border border-border rounded-full px-[14px] py-[7px] font-sans text-[0.8rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Cancel</button>
          <button type="submit" disabled={saving} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark disabled:opacity-60">{saving ? "Saving…" : "Save Changes"}</button>
        </div>
      </form>
    </div>
  );
}

// ── Main EventPage ────────────────────────────────────────────────────────────
export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile, getToken } = useAuth();

  const [event, setEvent] = useState<EventOut | null>(null);
  const [myRsvp, setMyRsvp] = useState<RSVPOut | null>(null);
  const [rsvps, setRsvps] = useState<RSVPOut[]>([]);
  const [eventMembers, setEventMembers] = useState<MemberOut[]>([]);
  const [eventTasks, setEventTasks] = useState<TaskOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("announcements");
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [inviteCopied, setInviteCopied] = useState(false);
  const [editing, setEditing] = useState(false);
  const [guestCount, setGuestCount] = useState(0);
  const [flyerOpen, setFlyerOpen] = useState(false);
  const [inviteLinkVisible, setInviteLinkVisible] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [guestListOpen, setGuestListOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([
    { role: "assistant", content: "Hey! I'm your Cohost AI. Ask me anything about this event, guest counts, what's on the potluck list, task status, or ideas to make it even better. I'm here to help 🎉" },
  ]);
  const [liveChatMessages, setLiveChatMessages] = useState<WsMessage[]>([]);
  const [unreadTabs, setUnreadTabs] = useState<Set<string>>(new Set());
  const [resourceVersions, setResourceVersions] = useState<
    Record<string, number>
  >({});

  const markRead = (tab: string) =>
    setUnreadTabs((prev) => {
      const s = new Set(prev);
      s.delete(tab);
      return s;
    });
  const markUnread = (tab: string) =>
    setUnreadTabs((prev) =>
      activeTab === tab ? prev : new Set([...prev, tab]),
    );

  const eventUuid = id ?? "";
  const myId = profile?.cognito_sub ?? "";
  const myDbId = profile?.id ?? null;
  const myName = profile?.display_name ?? profile?.email ?? "Guest";
  const token = getToken() ?? "";

  useEffect(() => {
    if (!eventUuid) return;
    Promise.all([
      getEvent(eventUuid),
      getMyRsvp(eventUuid).catch(() => null),
      getRsvps(eventUuid).catch(() => []),
      getMembers(eventUuid).catch(() => []),
      getTasks(eventUuid).catch(() => []),
    ])
      .then(([ev, rsvp, allRsvps, allMembers, allTasks]) => {
        setEvent(ev);
        setMyRsvp(rsvp);
        setRsvps(allRsvps as RSVPOut[]);
        setEventMembers(allMembers as MemberOut[]);
        setEventTasks(allTasks as TaskOut[]);
        if (rsvp) setGuestCount((rsvp as RSVPOut).guest_count);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [eventUuid]);

  const handleRsvp = async (status: RSVPStatus, guests?: number) => {
    setRsvpLoading(true);
    try {
      const gc = guests ?? guestCount;
      const updated = await upsertRsvp(eventUuid, status, gc);
      setMyRsvp(updated);
      setGuestCount(updated.guest_count);
      setRsvps((prev) => {
        const exists = prev.find((r) => r.user_id === myId);
        if (exists) return prev.map((r) => (r.user_id === myId ? updated : r));
        return [...prev, updated];
      });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "RSVP failed");
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleCopyInvite = async () => {
    if (!event?.invite_token || !event.invite_active) return;
    copyToClipboard(`${window.location.origin}/join/${event.invite_token}`);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };
  const handleRegenerateInvite = async () => {
    if (!event) return;
    try {
      const u = await regenerateInvite(eventUuid);
      setEvent(u);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };
  const handleRevokeInvite = async () => {
    if (!event) return;
    try {
      const u = await revokeInvite(eventUuid);
      setEvent(u);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    }
  };

  const handleRoleChange = async (
    userId: string,
    newRole: "co_host" | "attendee",
  ) => {
    try {
      const updated = await updateMemberRole(eventUuid, userId, newRole);
      setEventMembers((prev) =>
        prev.map((m) => (m.user_id === userId ? updated : m)),
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    }
  };

  const handleRemoveMember = async (userId: string) => {
    try {
      await removeMember(eventUuid, userId);
      setEventMembers((prev) => prev.filter((m) => m.user_id !== userId));
      setRsvps((prev) => prev.filter((r) => r.user_id !== userId));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to remove member");
    }
  };

  // ── Real-time update handler ──────────────────────────────────────────────
  const handleEventUpdate = useCallback(
    (update: EventUpdate) => {
      const { kind, action, data } = update;

      if (kind === "rsvp") {
        const rsvp = data as unknown as RSVPOut;
        if (action === "upsert") {
          setRsvps((prev) => {
            const exists = prev.find((r) => r.user_id === rsvp.user_id);
            return exists
              ? prev.map((r) => (r.user_id === rsvp.user_id ? rsvp : r))
              : [...prev, rsvp];
          });
          if (rsvp.user_id === myId) {
            setMyRsvp(rsvp);
            setGuestCount(rsvp.guest_count);
          }
        }
      }

      if (kind === "event" && action === "upsert") {
        setEvent(data as unknown as EventOut);
      }

      if (kind === "member") {
        const member = data as unknown as MemberOut;
        if (action === "create") {
          setEventMembers((prev) =>
            prev.find((m) => m.user_id === member.user_id)
              ? prev
              : [...prev, member],
          );
        } else if (action === "upsert") {
          setEventMembers((prev) =>
            prev.map((m) => (m.user_id === member.user_id ? member : m)),
          );
          if (member.display_name) {
            setLiveChatMessages((prev) =>
              prev.map((msg) =>
                msg.sender_id === member.user_id
                  ? { ...msg, sender_name: member.display_name! }
                  : msg,
              ),
            );
          }
        } else if (action === "delete") {
          const id = (data as unknown as { id: number }).id;
          setEventMembers((prev) => prev.filter((m) => m.id !== id));
        }
      }

      // For polls/tasks/potluck/announcements: signal the active tab to refresh
      // We use a version counter per resource type — tabs watch it and re-fetch
      if (["poll", "task", "potluck", "announcement"].includes(kind)) {
        setResourceVersions((prev) => ({
          ...prev,
          [kind]: (prev[kind] ?? 0) + 1,
        }));
      }
    },
    [myId],
  );

  const isHost = event?.host_id === myId || event?.host_id === myDbId;

  const tabItems = [
    {
      key: "announcements",
      label: "Feed",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M4 11a9 9 0 019 9" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M4 4a16 16 0 0116 16" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="5" cy="19" r="1" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      key: "polls",
      label: "Polls",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="10" width="4" height="11" rx="1" />
          <rect x="10" y="6" width="4" height="15" rx="1" />
          <rect x="17" y="2" width="4" height="19" rx="1" />
        </svg>
      ),
    },
    {
      key: "tasks",
      label: "Tasks",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      key: "potluck",
      label: "Potluck",
      icon: (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8h1a4 4 0 010 8h-1" strokeLinecap="round" />
          <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" strokeLinecap="round" />
          <line x1="6" y1="1" x2="6" y2="4" strokeLinecap="round" />
          <line x1="10" y1="1" x2="10" y2="4" strokeLinecap="round" />
          <line x1="14" y1="1" x2="14" y2="4" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      key: "ai",
      label: "AI Assistant",
      mobileLabel: "AI",
      icon: <BsStars size={13} />,
    },
  ];

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-text-muted">
        Loading events…
      </div>
    );
  if (error && !event)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div style={{ color: "#c00" }}>{error}</div>
        <button onClick={() => navigate("/events")} className="bg-pink text-white border-none rounded-full px-[18px] py-2 font-sans text-[0.8rem] font-semibold cursor-pointer hover:bg-accent-dark">Back to Events</button>
      </div>
    );
  if (!event) return null;

  const goingCount = rsvps.filter((r) => r.status === "yes").length;
  const maybeCount = rsvps.filter((r) => r.status === "maybe").length;
  const noCount = rsvps.filter((r) => r.status === "no").length;

  return (
    <div className="ep-root">
      {/* ── LEFT SIDEBAR ── */}
      <div className="ep-sidebar flex-[3_1_0] min-w-0 flex flex-col h-full overflow-hidden">
        <div className="ep-sidebar-inner flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {/* Event title + edit */}
          <div className="ep-sidebar-title-row flex items-start justify-between gap-2">
            <h1 className="font-display text-[1.7rem] leading-[1.1] text-text-dark m-0">{event.title}</h1>
            {isHost && !editing && (
              <button onClick={() => setEditing(true)} className="flex items-center gap-1 bg-none border border-border rounded-full px-[10px] py-1 font-sans text-[0.72rem] font-semibold text-text-muted cursor-pointer whitespace-nowrap transition-all duration-200 flex-shrink-0 hover:border-pink hover:text-pink" aria-label="Edit event">
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M10.5 1.5l2 2-8 8H2.5v-2l8-8z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                Edit
              </button>
            )}
          </div>

          {/* Flyer card */}
          <div
            className={`ep-flyer-card w-full h-[160px] rounded-xl overflow-hidden relative bg-gradient-to-br from-[#f472b6] to-[#be185d] border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[3px_3px_0px_#be185d] flex-shrink-0${event.flyer_url ? " cursor-zoom-in" : ""}`}
            onClick={() => event.flyer_url && setFlyerOpen(true)}
          >
            {event.flyer_url ? (
              <>
                <img src={event.flyer_url} alt={event.title} className="w-full h-full object-cover" />
                <div className="ep-flyer-expand absolute bottom-1.5 right-1.5 bg-black/45 rounded-[5px] p-1 flex items-center justify-center">
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M1 1h4M1 1v4M13 1h-4M13 1v4M1 13h4M1 13v-4M13 13h-4M13 13v-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="bg-white rounded-full px-[14px] py-[5px] text-[0.78rem] font-medium text-text-mid shadow-[var(--shadow-sm)]">
                  {event.start_dt ? formatDate(event.start_dt) : "Date TBD"}
                </div>
              </div>
            )}
          </div>

          {/* Flyer lightbox */}
          {flyerOpen && event.flyer_url && (
            <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setFlyerOpen(false)}>
              <button className="absolute top-5 right-6 bg-white/15 border-none text-white text-[1.25rem] w-9 h-9 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/30" onClick={() => setFlyerOpen(false)} aria-label="Close">✕</button>
              <img src={event.flyer_url} alt={event.title} className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-[0_8px_40px_rgba(0,0,0,0.5)] cursor-default" onClick={(e) => e.stopPropagation()} />
            </div>
          )}

          {/* Details card */}
          <div className="bg-white rounded-xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[3px_3px_0px_#be185d] overflow-hidden">
            <div className="px-[14px] py-3">
              {event.description && <p className="text-[0.82rem] leading-[1.6] text-text-mid mb-2.5">{event.description}</p>}
              {event.start_dt && (
                <div className="flex items-center gap-1.5 mb-1">
                  <FiCalendar size={13} className="flex-shrink-0 text-text-muted" />
                  <span className="text-[0.78rem] text-text-mid">{formatDate(event.start_dt)}{event.end_dt ? ` – ${formatDate(event.end_dt)}` : ""}</span>
                </div>
              )}
              {event.recurrence_rule && (
                <div className="flex items-center gap-1.5 mb-1">
                  <FiRepeat size={13} className="flex-shrink-0 text-text-muted" />
                  <span className="text-[0.78rem] text-text-mid">{event.recurrence_rule.charAt(0) + event.recurrence_rule.slice(1).toLowerCase()}{event.recurrence_end_dt ? ` until ${new Date(event.recurrence_end_dt).toLocaleDateString()}` : ""}</span>
                </div>
              )}
              {event.location && (
                <div className="flex items-center gap-1.5 mb-1">
                  <FiMapPin size={13} className="flex-shrink-0 text-text-muted" />
                  <span className="text-[0.78rem] text-text-mid">{event.location}</span>
                </div>
              )}
              {event.viewable_by_link && (
                <div className="flex items-center gap-1.5 mb-1 text-pink">
                  <FiLink size={13} className="flex-shrink-0" />
                  <span className="text-[0.78rem]">Viewable by anyone with the link</span>
                </div>
              )}
            </div>
          </div>

          {/* RSVP + Attendance card */}
          <div className="ep-info-card bg-white rounded-xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[3px_3px_0px_#be185d] overflow-hidden">
            <div className="px-[14px] py-2 flex items-center gap-1.5 bg-gradient-to-r from-[#dcfce7] to-[#f0fdf4] border-b border-[#86efac]">
              <span className="text-[0.65rem] font-bold text-[#15803d] uppercase tracking-[0.08em]">YOUR RSVP</span>
            </div>
            <div className="px-[14px] py-3">
              <div className="flex gap-1.5 flex-wrap mb-2.5">
                {(["yes", "maybe", "no"] as RSVPStatus[]).map((status) => {
                  const active = myRsvp?.status === status;
                  const labels: Record<RSVPStatus, string> = { yes: "Going", maybe: "Maybe", no: "No" };
                  const activeClass = status === "yes" ? "bg-[#16a34a] text-white border-[#16a34a]" : status === "maybe" ? "bg-[#d97706] text-white border-[#d97706]" : "bg-[#dc2626] text-white border-[#dc2626]";
                  const hoverClass = status === "yes" ? "hover:border-[#16a34a] hover:text-[#16a34a] hover:bg-[#f0fdf4]" : status === "maybe" ? "hover:border-[#d97706] hover:text-[#d97706] hover:bg-[#fffbeb]" : "hover:border-[#dc2626] hover:text-[#dc2626] hover:bg-[#fef2f2]";
                  return (
                    <button key={status} onClick={() => handleRsvp(status)} disabled={rsvpLoading}
                      className={`flex-1 rounded-lg px-1.5 py-2 font-sans text-[0.78rem] font-bold cursor-pointer transition-all duration-200 border-[1.5px] text-center disabled:opacity-60 disabled:cursor-not-allowed ${active ? activeClass : `bg-white text-text-mid border-border ${hoverClass}`}`}>
                      {labels[status]}
                    </button>
                  );
                })}
              </div>
              {(myRsvp?.status === "yes" || myRsvp?.status === "maybe") && (
                <div className="flex items-center gap-2.5 mt-2.5 pt-2.5 border-t border-[#fce7f3]">
                  <span className="text-[0.75rem] text-text-muted font-medium">Guests</span>
                  <div className="flex items-center border-[1.5px] border-border rounded-full overflow-hidden">
                    <button type="button" className="w-[26px] h-[26px] border-none bg-white text-[1rem] cursor-pointer flex items-center justify-center text-text-dark transition-colors hover:bg-pink-bg disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => { const n = Math.max(0, guestCount - 1); setGuestCount(n); handleRsvp(myRsvp!.status, n); }} disabled={guestCount === 0 || rsvpLoading}>−</button>
                    <span className="w-[22px] text-center text-[0.82rem] font-semibold text-text-dark">{guestCount}</span>
                    <button type="button" className="w-[26px] h-[26px] border-none bg-white text-[1rem] cursor-pointer flex items-center justify-center text-text-dark transition-colors hover:bg-pink-bg disabled:opacity-40 disabled:cursor-not-allowed"
                      onClick={() => { const n = guestCount + 1; setGuestCount(n); handleRsvp(myRsvp!.status, n); }} disabled={rsvpLoading}>+</button>
                  </div>
                </div>
              )}
              <div className="flex gap-1.5 mt-2.5 pt-2.5 border-t border-[#fce7f3]">
                <div className="flex-1 text-center rounded-lg py-[7px] px-1 border-[1.5px] bg-[#f0fdf4] border-[#86efac]">
                  <div className="text-[1.15rem] font-extrabold text-[#16a34a]">{goingCount}</div>
                  <div className="text-[0.58rem] font-bold tracking-[0.05em] mt-px text-[#16a34a]">GOING</div>
                </div>
                <div className="flex-1 text-center rounded-lg py-[7px] px-1 border-[1.5px] bg-[#fffbeb] border-[#fde68a]">
                  <div className="text-[1.15rem] font-extrabold text-[#d97706]">{maybeCount}</div>
                  <div className="text-[0.58rem] font-bold tracking-[0.05em] mt-px text-[#d97706]">MAYBE</div>
                </div>
                <div className="flex-1 text-center rounded-lg py-[7px] px-1 border-[1.5px] bg-[#fef2f2] border-[#fca5a5]">
                  <div className="text-[1.15rem] font-extrabold text-[#dc2626]">{noCount}</div>
                  <div className="text-[0.58rem] font-bold tracking-[0.05em] mt-px text-[#dc2626]">NO</div>
                </div>
              </div>
            </div>
          </div>

          {/* Invite link card (host only) */}
          {isHost && (
            <div className="bg-white rounded-xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[3px_3px_0px_#be185d] overflow-hidden">
              <div className="px-[14px] py-2 flex items-center gap-1.5 bg-gradient-to-r from-[#ffedd5] to-[#fff7ed] border-b border-[#fdba74]">
                <span className="text-[0.65rem] font-bold text-[#c2410c] uppercase tracking-[0.08em]">INVITE LINK</span>
              </div>
              <div className="px-[14px] py-3">
                {event.invite_token && event.invite_active ? (
                  <>
                    <div className="flex gap-[5px] items-center mb-1.5">
                      <input readOnly type={inviteLinkVisible ? "text" : "password"} value={`${window.location.origin}/join/${event.invite_token}`} className="flex-1 min-w-0 border border-border rounded-md px-2 py-[5px] text-[0.65rem] bg-[#fafafa] text-text-muted font-mono" />
                      <button onClick={() => setInviteLinkVisible((v) => !v)} className="bg-none border border-border rounded-md p-1 cursor-pointer flex items-center text-text-muted flex-shrink-0" title={inviteLinkVisible ? "Hide" : "Show"}>
                        {inviteLinkVisible ? (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" /><path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" /><line x1="1" y1="1" x2="23" y2="23" /></svg>
                        ) : (
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                        )}
                      </button>
                      <button onClick={handleCopyInvite} className={`flex items-center gap-[3px] border-none rounded-md px-[10px] py-[5px] text-[0.7rem] cursor-pointer font-sans font-semibold whitespace-nowrap flex-shrink-0 transition-colors${inviteCopied ? " bg-[#1a7a3c] text-white" : " bg-pink text-white"}`}>
                        {inviteCopied ? <><FiCheck size={11} /> Copied</> : "Copy"}
                      </button>
                    </div>
                    <div className="flex gap-2.5">
                      <button onClick={handleRegenerateInvite} className="text-[0.72rem] text-text-muted bg-none border-none cursor-pointer underline font-sans p-0">Regenerate</button>
                      <button onClick={handleRevokeInvite} className="text-[0.72rem] text-[#c00] bg-none border-none cursor-pointer underline font-sans p-0">Disable</button>
                      <button onClick={() => setQrOpen(true)} className="text-[0.72rem] text-text-muted bg-none border-none cursor-pointer underline font-sans p-0 ml-auto">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "inline", marginRight: 3 }}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><path d="M14 14h2v2h-2zM18 14h3M14 18h2M18 18h3M14 21h3M21 18v3" /></svg>
                        QR Code
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-[0.72rem] text-[#c00] mb-1.5">Link is disabled.</div>
                    <button onClick={handleRegenerateInvite} className="bg-none border border-border rounded-full px-[14px] py-[7px] font-sans text-[0.78rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa]">Generate New Link</button>
                  </>
                )}
              </div>
            </div>
          )}

          {/* QR Code modal */}
          {qrOpen && event?.invite_token && event.invite_active && (
            <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-8 cursor-zoom-out" onClick={() => setQrOpen(false)}>
              <button className="absolute top-5 right-6 bg-white/15 border-none text-white text-[1.25rem] w-9 h-9 rounded-full cursor-pointer flex items-center justify-center hover:bg-white/30" onClick={() => setQrOpen(false)} aria-label="Close">✕</button>
              <div className="bg-white rounded-[20px] px-8 py-7 flex flex-col items-center gap-2.5 shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-2 border-[#f9a8d4]" onClick={(e) => e.stopPropagation()}>
                <div className="font-display text-[1.4rem] text-[#be185d] tracking-[0.02em]">Scan to join</div>
                <div className="text-[0.85rem] text-text-muted -mt-1 mb-1">{event.title}</div>
                <div className="p-4 bg-white rounded-xl border-2 border-dashed border-[#f9a8d4]">
                  <QRCodeSVG value={`${window.location.origin}/join/${event.invite_token}`} size={220} fgColor="#be185d" bgColor="#ffffff" level="M" />
                </div>
                <div className="text-[0.65rem] text-text-muted font-mono break-all text-center max-w-[260px] mt-1">{`${window.location.origin}/join/${event.invite_token}`}</div>
              </div>
            </div>
          )}

          {/* Guest list card */}
          <div className="bg-white rounded-xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[3px_3px_0px_#be185d] overflow-hidden">
            <div className="px-[14px] py-2 flex items-center gap-1.5 bg-gradient-to-r from-[#ffe4e6] to-[#fff1f2] border-b border-[#fda4af]">
              <span className="text-[0.65rem] font-bold text-[#e11d48] uppercase tracking-[0.08em]">GUESTS ({eventMembers.length})</span>
            </div>
            <div className="px-[14px] py-3">
              <div className="flex flex-col gap-1.5">
                {eventMembers.filter((m) => m.role === "host" || m.role === "co_host").map((m) => {
                  const rsvp = rsvps.find((r) => r.user_id === m.user_id);
                  const isMe = m.user_id === myId;
                  const name = isMe ? "You" : m.display_name || m.user_id.slice(0, 8) + "…";
                  const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                  const isHost_ = m.role === "host";
                  const isCoHost = m.role === "co_host";
                  return (
                    <div key={m.id} className="ep-guest-row flex items-center gap-2">
                      <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#fce7f3] to-[#fda4af] flex items-center justify-center text-[0.6rem] font-bold text-[#be185d] flex-shrink-0">{initials}</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div className="text-[0.78rem] font-semibold text-text-dark overflow-hidden text-ellipsis whitespace-nowrap">{name}</div>
                        <div className="text-[0.72rem]" style={{ color: isHost_ ? "var(--pink)" : isCoHost ? "#db7093" : "var(--text-muted)" }}>{m.role.replace("_", " ")}</div>
                      </div>
                      {rsvp && (
                        <span className={`ep-guest-rsvp text-[0.62rem] px-1.5 py-px rounded-full font-semibold flex-shrink-0 flex items-center gap-0.5${rsvp.status === "yes" ? " bg-[#f0fdf4] text-[#16a34a]" : rsvp.status === "no" ? " bg-[#fef2f2] text-[#dc2626]" : " bg-[#fffbeb] text-[#d97706]"}`}>
                          {rsvp.status === "yes" ? <FiCheck size={10} /> : rsvp.status === "no" ? <FiX size={10} /> : <FiStar size={10} />}
                          {rsvp.guest_count > 0 && ` +${rsvp.guest_count}`}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
              <button className="w-full mt-2.5 bg-none border border-border rounded-full py-[7px] font-sans text-[0.78rem] font-medium text-text-mid cursor-pointer hover:border-[#aaa] transition-colors" onClick={() => setGuestListOpen(true)}>
                See full guest list ({eventMembers.length})
              </button>
            </div>
          </div>

          {/* Full guest list modal */}
          {guestListOpen && (
            <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-8" onClick={() => setGuestListOpen(false)}>
              <div className="bg-white rounded-[20px] px-8 py-7 flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.4)] border-2 border-[#f9a8d4] max-h-[80vh] w-[340px]" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-3">
                  <div className="font-display text-[1.4rem] text-[#be185d] tracking-[0.02em]">All Guests ({eventMembers.length})</div>
                  <button className="bg-white/15 border-none text-[#be185d] text-[1rem] w-8 h-8 rounded-full cursor-pointer flex items-center justify-center hover:bg-[#fce7f3]" onClick={() => setGuestListOpen(false)} aria-label="Close">✕</button>
                </div>
                <div className="overflow-y-auto flex-1 flex flex-col gap-1.5">
                  {eventMembers.map((m) => {
                    const rsvp = rsvps.find((r) => r.user_id === m.user_id);
                    const isMe = m.user_id === myId;
                    const name = isMe ? "You" : m.display_name || m.user_id.slice(0, 8) + "…";
                    const initials = name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);
                    const isHost_ = m.role === "host";
                    const isCoHost = m.role === "co_host";
                    return (
                      <div key={m.id} className="ep-guest-row flex items-center gap-2">
                        <div className="w-[26px] h-[26px] rounded-full bg-gradient-to-br from-[#fce7f3] to-[#fda4af] flex items-center justify-center text-[0.6rem] font-bold text-[#be185d] flex-shrink-0">{initials}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div className="text-[0.78rem] font-semibold text-text-dark overflow-hidden text-ellipsis whitespace-nowrap">{name}</div>
                          <div className="text-[0.72rem]" style={{ color: isHost_ ? "var(--pink)" : isCoHost ? "#db7093" : "var(--text-muted)" }}>{m.role.replace("_", " ")}</div>
                        </div>
                        {rsvp && (
                          <span className={`ep-guest-rsvp text-[0.62rem] px-1.5 py-px rounded-full font-semibold flex-shrink-0 flex items-center gap-0.5${rsvp.status === "yes" ? " bg-[#f0fdf4] text-[#16a34a]" : rsvp.status === "no" ? " bg-[#fef2f2] text-[#dc2626]" : " bg-[#fffbeb] text-[#d97706]"}`}>
                            {rsvp.status === "yes" ? <FiCheck size={10} /> : rsvp.status === "no" ? <FiX size={10} /> : <FiStar size={10} />}
                            {rsvp.guest_count > 0 && ` +${rsvp.guest_count}`}
                          </span>
                        )}
                        {isHost && !isMe && !isHost_ && (
                          <div className="ep-guest-actions">
                            {isCoHost ? (
                              <button className="text-[0.62rem] font-bold px-[7px] py-0.5 rounded-full border-[1.5px] border-[#f9a8d4] bg-[#fce7f3] text-[#be185d] cursor-pointer font-sans whitespace-nowrap hover:bg-[#be185d] hover:text-white hover:border-[#be185d] transition-all" title="Demote to attendee" onClick={() => handleRoleChange(m.user_id, "attendee")}>co-host ↓</button>
                            ) : (
                              <button className="text-[0.62rem] font-bold px-[7px] py-0.5 rounded-full border-[1.5px] border-[#f9a8d4] bg-[#fdf2f8] text-[#be185d] cursor-pointer font-sans whitespace-nowrap hover:bg-[#be185d] hover:text-white hover:border-[#be185d] transition-all" title="Promote to co-host" onClick={() => handleRoleChange(m.user_id, "co_host")}>+ co-host</button>
                            )}
                            <button className="w-5 h-5 rounded-full border-[1.5px] border-[#fca5a5] bg-[#fef2f2] text-[#dc2626] text-[0.6rem] cursor-pointer flex items-center justify-center hover:bg-[#dc2626] hover:text-white hover:border-[#dc2626] transition-all flex-shrink-0" title="Remove from event" onClick={() => handleRemoveMember(m.user_id)}>✕</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── CENTER: TABS ── */}
      <div className="ep-main flex-[4_1_0] min-w-0 flex flex-col h-full overflow-hidden bg-white rounded-2xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[4px_4px_0px_#be185d]">
        {/* Edit panel overlay */}
        {editing && (
          <div className="p-4 overflow-y-auto flex-shrink-0 max-h-[60vh] border-b border-border bg-white">
            <EditEventPanel event={event} onSave={(updated) => { setEvent(updated); setEditing(false); }} onCancel={() => setEditing(false)} />
          </div>
        )}

        {error && (
          <div className="text-[#c00] text-[0.78rem] bg-[#fff0f0] px-3 py-2 rounded-md mx-4 mt-3">{error}</div>
        )}

        {/* Tab bar */}
        <div className="flex gap-0 px-2 border-b-[1.5px] border-[#fce7f3] overflow-x-auto scrollbar-none flex-shrink-0 bg-gradient-to-br from-[#fdf2f8] to-[#fce7f3] rounded-t-2xl" style={{ scrollbarWidth: "none" }}>
          {tabItems.map((item) => (
            <button
              key={item.key}
              className={`flex items-center gap-[5px] px-[13px] py-[11px] bg-none border-none border-b-[2.5px] font-sans text-[0.78rem] font-semibold cursor-pointer whitespace-nowrap transition-all duration-150 -mb-[1.5px]${activeTab === item.key ? " text-[#be185d] border-b-[#be185d] font-extrabold bg-white/70 rounded-t-lg" : " text-[#db7093] border-b-transparent hover:text-[#be185d]"}`}
              onClick={() => { setActiveTab(item.key); markRead(item.key); }}
            >
              <span className="flex items-center">{item.icon}</span>
              {'mobileLabel' in item
                ? <><span className="ep-tab-label-desktop">{item.label}</span><span className="ep-tab-label-mobile">{(item as { mobileLabel: string }).mobileLabel}</span></>
                : <span>{item.label}</span>
              }
              {unreadTabs.has(item.key) && <span className="w-1.5 h-1.5 rounded-full bg-[#be185d] flex-shrink-0 ml-0.5" />}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col overflow-hidden min-h-0">
          {activeTab === "polls" && <PollsTab eventUuid={eventUuid} myId={myId} isHost={isHost} version={resourceVersions["poll"] ?? 0} />}
          {activeTab === "tasks" && <TasksTab eventUuid={eventUuid} myId={myId} isHost={isHost} members={eventMembers} version={resourceVersions["task"] ?? 0} onTasksChange={setEventTasks} />}
          {activeTab === "potluck" && <PotluckTab eventUuid={eventUuid} myId={myId} isHost={isHost} version={resourceVersions["potluck"] ?? 0} />}
          {activeTab === "announcements" && <AnnouncementsTab eventUuid={eventUuid} eventTitle={event?.title ?? "this event"} myId={myId} isHost={isHost} onNew={() => markUnread("announcements")} version={resourceVersions["announcement"] ?? 0} />}
          {activeTab === "ai" && <AiTab eventUuid={eventUuid} messages={aiMessages} setMessages={setAiMessages} chatMessages={liveChatMessages} rsvps={rsvps} members={eventMembers} tasks={eventTasks} />}
        </div>
      </div>

      {/* ── RIGHT: COMMUNITY CHAT ── */}
      <div className="ep-chat-col flex-[3_1_0] min-w-0 flex flex-col h-full overflow-hidden bg-white rounded-2xl border-[1.5px] border-[#f9a8d4] border-r-[#be185d] border-b-[#be185d] shadow-[4px_4px_0px_#be185d]">
        <div className="flex items-center gap-2 px-4 py-3 border-b-[1.5px] border-[#fce7f3] text-[0.72rem] font-extrabold text-[#be185d] tracking-[0.06em] flex-shrink-0 bg-gradient-to-r from-[#fce7f3] to-[#fdf2f8]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" /></svg>
          <span>COMMUNITY CHAT</span>
          <span className="ep-live-dot w-[7px] h-[7px] rounded-full bg-[#1a7a3c] ml-auto" />
          <span className="text-[0.62rem] font-bold text-[#1a7a3c] tracking-[0.05em]">LIVE</span>
        </div>
        <ChatPanel eventId={eventUuid} myId={myId} myName={myName} token={token} onMessagesChange={(msgs) => { setLiveChatMessages(msgs); markUnread("chat"); }} onEventUpdate={handleEventUpdate} />
      </div>
    </div>
  );
}
