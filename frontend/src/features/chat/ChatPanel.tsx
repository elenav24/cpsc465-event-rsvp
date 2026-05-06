import { useState, useRef, useEffect } from "react";
import type { ChatMessage } from "../../data/sampleData";

interface ChatPanelProps {
  eventId: string;
  messages: ChatMessage[];
  currentUserId: string;
  currentUserName: string;
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const diff = today.getDate() - d.getDate();
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export default function ChatPanel({
  messages: initialMessages,
  currentUserId,
  currentUserName,
  isOpen,
  onClose,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change or panel opens
  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    setSending(true);
    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      userId: currentUserId,
      userName: currentUserName,
      text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");

    // Simulate WebSocket send — replace with real WS call
    // ws.send(JSON.stringify({ action: 'sendMessage', eventId, text }))
    await new Promise((res) => setTimeout(res, 200));
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(e as unknown as React.FormEvent);
    }
  };

  // Group messages by day
  const grouped: { day: string; msgs: ChatMessage[] }[] = [];
  messages.forEach((msg) => {
    const day = formatDay(msg.timestamp);
    const last = grouped[grouped.length - 1];
    if (last && last.day === day) {
      last.msgs.push(msg);
    } else {
      grouped.push({ day, msgs: [msg] });
    }
  });

  return (
    <aside
      className={`chat-panel${isOpen ? " chat-panel--open" : ""}`}
      aria-label="Event chat"
    >
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-header-icon">💬</span>
          <div>
            <h3 className="chat-header-title">Event Chat</h3>
            <span className="chat-header-count">
              {messages.length} messages
            </span>
          </div>
        </div>
        <button
          className="chat-close-btn"
          onClick={onClose}
          aria-label="Close chat"
        >
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages" role="log" aria-live="polite">
        {messages.length === 0 ? (
          <div className="chat-empty">
            <span className="chat-empty-icon">💬</span>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          grouped.map(({ day, msgs }) => (
            <div key={day} className="chat-day-group">
              <div className="chat-day-label">
                <span>{day}</span>
              </div>
              {msgs.map((msg, i) => {
                const isMine = msg.userId === currentUserId;
                const prevMsg = msgs[i - 1];
                const isConsecutive = prevMsg && prevMsg.userId === msg.userId;
                return (
                  <div
                    key={msg.id}
                    className={`chat-msg${isMine ? " chat-msg--mine" : ""}${isConsecutive ? " chat-msg--consecutive" : ""}`}
                  >
                    {!isMine && !isConsecutive && (
                      <div className="chat-avatar" aria-hidden="true">
                        {getInitials(msg.userName)}
                      </div>
                    )}
                    {!isMine && isConsecutive && (
                      <div className="chat-avatar-spacer" />
                    )}
                    <div className="chat-bubble-wrap">
                      {!isMine && !isConsecutive && (
                        <span className="chat-sender">{msg.userName}</span>
                      )}
                      <div className="chat-bubble">
                        <span className="chat-text">{msg.text}</span>
                        <span className="chat-time">
                          {formatTime(msg.timestamp)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form className="chat-input-form" onSubmit={sendMessage}>
        <input
          ref={inputRef}
          type="text"
          className="chat-input"
          placeholder="Send a message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={500}
          aria-label="Message input"
          disabled={sending}
        />
        <button
          type="submit"
          className="chat-send-btn"
          disabled={!input.trim() || sending}
          aria-label="Send message"
        >
          {sending ? "…" : "↑"}
        </button>
      </form>

      <style>{`
        .chat-panel {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--bg-card);
          border-left: 1px solid var(--border);
        }

        /* Header */
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border);
          flex-shrink: 0;
        }
        .chat-header-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .chat-header-icon {
          font-size: 20px;
        }
        .chat-header-title {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-heading);
        }
        .chat-header-count {
          font-size: 12px;
          color: var(--text-muted);
        }
        .chat-close-btn {
          background: none;
          border: none;
          font-size: 16px;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 4px 8px;
          border-radius: var(--radius-sm);
          transition: background var(--transition);
          line-height: 1;
        }
        .chat-close-btn:hover {
          background: var(--surface);
          color: var(--text-heading);
        }

        /* Messages */
        .chat-messages {
          flex: 1;
          overflow-y: auto;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          padding: 40px 0;
        }
        .chat-empty-icon {
          font-size: 32px;
        }
        .chat-day-group {
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-bottom: 8px;
        }
        .chat-day-label {
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 8px 0;
        }
        .chat-day-label span {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          background: var(--surface);
          padding: 3px 10px;
          border-radius: var(--radius-full);
        }
        .chat-msg {
          display: flex;
          align-items: flex-end;
          gap: 8px;
          margin-bottom: 2px;
        }
        .chat-msg--mine {
          flex-direction: row-reverse;
        }
        .chat-msg--consecutive {
          margin-top: 1px;
        }
        .chat-avatar {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .chat-avatar-spacer {
          width: 28px;
          flex-shrink: 0;
        }
        .chat-bubble-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
          max-width: 75%;
        }
        .chat-msg--mine .chat-bubble-wrap {
          align-items: flex-end;
        }
        .chat-sender {
          font-size: 11px;
          font-weight: 500;
          color: var(--text-muted);
          padding: 0 4px;
        }
        .chat-bubble {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 8px 12px;
          border-radius: 16px;
          border-bottom-left-radius: 4px;
          background: var(--surface);
          word-break: break-word;
        }
        .chat-msg--mine .chat-bubble {
          background: var(--accent);
          border-bottom-left-radius: 16px;
          border-bottom-right-radius: 4px;
        }
        .chat-text {
          font-size: 14px;
          color: var(--text-heading);
          line-height: 1.45;
        }
        .chat-msg--mine .chat-text {
          color: white;
        }
        .chat-time {
          font-size: 10px;
          color: var(--text-muted);
          white-space: nowrap;
          flex-shrink: 0;
          align-self: flex-end;
        }
        .chat-msg--mine .chat-time {
          color: rgba(255,255,255,0.65);
        }

        /* Input */
        .chat-input-form {
          display: flex;
          gap: 8px;
          padding: 12px 16px;
          border-top: 1px solid var(--border);
          flex-shrink: 0;
        }
        .chat-input {
          flex: 1;
          padding: 9px 14px;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          background: var(--surface);
          color: var(--text-heading);
          font-size: 14px;
          outline: none;
          transition: border-color var(--transition);
        }
        .chat-input:focus {
          border-color: var(--accent);
        }
        .chat-input::placeholder {
          color: var(--text-muted);
        }
        .chat-send-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--accent);
          color: white;
          border: none;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: background var(--transition), transform var(--transition);
        }
        .chat-send-btn:hover:not(:disabled) {
          background: var(--accent-dark);
          transform: scale(1.05);
        }
        .chat-send-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
      `}</style>
    </aside>
  );
}
