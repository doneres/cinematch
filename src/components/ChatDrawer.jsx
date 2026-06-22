import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Send, X, ChevronDown } from 'lucide-react'
import { subscribeToMessages, sendMessage } from '../lib/sessionService'
import { getUserId } from '../lib/utils'

export default function ChatDrawer({ code, userName, participants = {} }) {
  const userId = getUserId()
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [unread, setUnread] = useState(0)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const lastSeenRef = useRef(0)

  useEffect(() => {
    const unsub = subscribeToMessages(code, (msgs) => {
      setMessages(msgs)
      if (!open) {
        const newCount = msgs.filter((m) => m.userId !== userId).length - lastSeenRef.current
        setUnread((u) => Math.max(0, newCount))
      }
    })
    return unsub
  }, [code, open])

  useEffect(() => {
    if (open) {
      const others = messages.filter((m) => m.userId !== userId).length
      lastSeenRef.current = others
      setUnread(0)
      setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
        inputRef.current?.focus()
      }, 100)
    }
  }, [open])

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSend(e) {
    e?.preventDefault()
    const trimmed = text.trim()
    if (!trimmed || sending) return
    setSending(true)
    setText('')
    try {
      await sendMessage(code, userId, userName, trimmed)
    } catch (err) {
      console.error(err)
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function formatTime(ts) {
    if (!ts) return ''
    const date = ts.toDate?.() ?? new Date(ts)
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
  }

  const participantNames = Object.fromEntries(
    Object.entries(participants).map(([id, p]) => [id, p.name])
  )

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 right-4 z-40 w-12 h-12 rounded-full bg-amber-400 text-black flex items-center justify-center shadow-lg shadow-amber-400/30 active:scale-90 transition-transform"
        aria-label="Abrir chat"
      >
        <MessageCircle size={22} fill="black" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center px-1 shadow">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Drawer */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[2px]"
              onClick={() => setOpen(false)}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e1c] rounded-t-3xl border-t border-white/8 flex flex-col"
              style={{ maxHeight: '68dvh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Handle + header */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-white/6 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageCircle size={16} className="text-amber-400" />
                  <span className="text-white font-bold text-sm">Chat da sessão</span>
                  <span className="text-gray-600 text-xs">
                    · {Object.keys(participants).length} pessoas
                  </span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <ChevronDown size={20} />
                </button>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-20 gap-1.5 text-gray-600">
                    <MessageCircle size={24} />
                    <p className="text-xs">Seja o primeiro a escrever algo!</p>
                  </div>
                )}

                {messages.map((msg, i) => {
                  const isMe = msg.userId === userId
                  const showName = !isMe && (i === 0 || messages[i - 1]?.userId !== msg.userId)

                  return (
                    <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      {showName && (
                        <span className="text-gray-600 text-[10px] mb-0.5 px-1">
                          {participantNames[msg.userId] || msg.userName}
                        </span>
                      )}
                      <div className={`flex items-end gap-1.5 max-w-[78%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                        <div
                          className={`px-3 py-2 rounded-2xl text-sm leading-snug ${
                            isMe
                              ? 'bg-amber-400 text-black rounded-br-sm font-medium'
                              : 'bg-[#1c1c2e] text-gray-100 border border-white/5 rounded-bl-sm'
                          }`}
                        >
                          {msg.text}
                        </div>
                        <span className="text-gray-700 text-[9px] shrink-0 mb-0.5">
                          {formatTime(msg.createdAt)}
                        </span>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form
                onSubmit={handleSend}
                className="flex items-center gap-2 px-4 py-3 border-t border-white/6 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={handleKey}
                  placeholder="Mensagem…"
                  maxLength={300}
                  className="flex-1 px-4 py-2.5 rounded-full bg-white/6 border border-white/8 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-400/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!text.trim() || sending}
                  className="w-9 h-9 rounded-full bg-amber-400 flex items-center justify-center text-black disabled:opacity-30 active:scale-90 transition-all shrink-0"
                >
                  <Send size={15} />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
