/**
 * WebSocket chat client for event group chat.
 *
 * The API Gateway WebSocket uses action-based routing:
 *   $connect    — connect with ?event_id=<id>&token=<jwt>
 *   $disconnect — auto on close
 *   sendMessage — { action, event_id, sender_id, sender_name, content }
 *   getHistory  — { action, event_id, limit, last_key? }
 *
 * Incoming messages from the server:
 *   { type: "message", sender_id, sender_name, content, timestamp }
 *   { type: "history", messages: [...], last_key?: string }
 */

const WS_BASE = import.meta.env.VITE_CHAT_WS_URL ?? ''

export interface WsMessage {
  id: string
  sender_id: string
  sender_name: string
  content: string
  timestamp: string
}

export type ChatEventHandler = (msg: WsMessage) => void
export type HistoryHandler = (msgs: WsMessage[], lastKey?: string) => void

export class EventChatSocket {
  private ws: WebSocket | null = null
  private eventId: string
  private token: string
  private senderId: string
  private senderName: string
  private onMessage: ChatEventHandler
  private onHistory: HistoryHandler
  private onConnect?: () => void
  private onDisconnect?: () => void
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private closed = false

  constructor(opts: {
    eventId: string
    token: string
    senderId: string
    senderName: string
    onMessage: ChatEventHandler
    onHistory: HistoryHandler
    onConnect?: () => void
    onDisconnect?: () => void
  }) {
    this.eventId = opts.eventId
    this.token = opts.token
    this.senderId = opts.senderId
    this.senderName = opts.senderName
    this.onMessage = opts.onMessage
    this.onHistory = opts.onHistory
    this.onConnect = opts.onConnect
    this.onDisconnect = opts.onDisconnect
    this.connect()
  }

  private connect() {
    if (!WS_BASE) return
    const url = `${WS_BASE}?event_id=${this.eventId}&token=${encodeURIComponent(this.token)}`
    this.ws = new WebSocket(url)

    this.ws.onopen = () => {
      this.onConnect?.()
      // Fetch recent history on connect
      this.fetchHistory()
    }

    this.ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (data.type === 'message') {
          this.onMessage(data as WsMessage)
        } else if (data.type === 'history') {
          this.onHistory(data.messages ?? [], data.last_key)
        }
      } catch {
        // ignore malformed frames
      }
    }

    this.ws.onclose = () => {
      this.onDisconnect?.()
      if (!this.closed) {
        // Reconnect after 3 s
        this.reconnectTimer = setTimeout(() => this.connect(), 3000)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }

  fetchHistory(lastKey?: string) {
    this.send({
      action: 'getHistory',
      event_id: this.eventId,
      limit: 50,
      ...(lastKey ? { last_key: lastKey } : {}),
    })
  }

  sendMessage(content: string) {
    this.send({
      action: 'sendMessage',
      event_id: this.eventId,
      sender_id: this.senderId,
      sender_name: this.senderName,
      content,
    })
  }

  private send(payload: object) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload))
    }
  }

  close() {
    this.closed = true
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer)
    this.ws?.close()
  }
}
