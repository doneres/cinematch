import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Play, Film, Tag, Eye, Loader2,
  X, Edit2, Crown, Clock, AlertTriangle, Trash2, Check,
} from 'lucide-react'
import Logo from '../components/Logo'
import SessionCode from '../components/SessionCode'
import ChatDrawer from '../components/ChatDrawer'
import {
  subscribeToSession, startSession, kickParticipant,
  renameParticipant, cancelSession,
} from '../lib/sessionService'
import { getUserId } from '../lib/utils'

const INACTIVE_MS = 2 * 60 * 1000 // 2 min without heartbeat = inactive

export default function Lobby() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const [managePid, setManagePid] = useState(null)   // participantId being managed
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const userId = getUserId()

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'cancelled') { navigate('/'); return }
      if (data.status === 'active') navigate(`/swipe/${code}`)
      if (data.status === 'completed') navigate(`/match/${code}`)
    })
    return unsub
  }, [code])

  async function handleStart() {
    try { await startSession(code) }
    catch { setError('Erro ao iniciar a sessão.') }
  }

  async function handleKick(pid) {
    setManagePid(null)
    await kickParticipant(code, pid).catch(() => {})
  }

  async function handleRenameSubmit(e) {
    e?.preventDefault()
    if (!newName.trim()) return
    await renameParticipant(code, managePid, newName).catch(() => {})
    setManagePid(null)
    setRenaming(false)
    setNewName('')
  }

  async function handleCancel() {
    setConfirmCancel(false)
    await cancelSession(code).catch(() => {})
    navigate('/')
  }

  function openManage(pid) {
    setManagePid(pid)
    setRenaming(false)
    setNewName(session.participants[pid]?.name || '')
  }

  function isInactive(p) {
    if (!p.lastSeen) return false
    const ts = p.lastSeen.toDate?.() ?? new Date(p.lastSeen)
    return Date.now() - ts.getTime() > INACTIVE_MS
  }

  const isHost = session?.hostId === userId
  const participantCount = Object.keys(session?.participants || {}).length
  const participants = session?.participants || {}
  const managedParticipant = managePid ? participants[managePid] : null

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <Logo size="sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center gap-6 max-w-sm w-full mx-auto"
      >
        <div className="text-center">
          <h2 className="text-white text-2xl font-bold">Sala de espera</h2>
          <p className="text-gray-500 text-sm mt-1">
            {isHost
              ? 'Aguarde seus amigos e inicie quando estiver pronto'
              : 'Aguardando o anfitrião iniciar a sessão…'}
          </p>
        </div>

        {session && <SessionCode code={code} />}

        {/* Participant list with host management */}
        {session && (
          <div className="w-full space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wider">
              Participantes · {participantCount}
            </p>
            {Object.entries(participants).map(([pid, p]) => {
              const inactive = isInactive(p)
              const isMe = pid === userId
              const isParticipantHost = pid === session.hostId

              return (
                <div
                  key={pid}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                    inactive ? 'bg-white/2 border-white/5 opacity-60' : 'bg-white/4 border-white/6'
                  }`}
                >
                  <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                    {p.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white text-sm font-medium truncate">{p.name}</span>
                      {isParticipantHost && <Crown size={11} className="text-amber-400 shrink-0" />}
                      {isMe && <span className="text-gray-600 text-xs">(você)</span>}
                    </div>
                    {inactive && (
                      <span className="text-orange-400/70 text-xs flex items-center gap-1">
                        <Clock size={10} />inativo
                      </span>
                    )}
                  </div>

                  {/* Host-only manage button for non-host participants */}
                  {isHost && !isParticipantHost && (
                    <button
                      onClick={() => openManage(pid)}
                      className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
                    >
                      <Edit2 size={12} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Settings summary */}
        {session?.settings && (
          <div className="w-full px-4 py-3 rounded-xl bg-white/3 border border-white/5 space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wider">Configurações</p>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Film size={13} className="text-amber-400 shrink-0" />
              {session.filmIds?.length || 0} filmes na lista
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Tag size={13} className="text-amber-400 shrink-0" />
              {session.settings.genres.includes('all') ? 'Todos os gêneros' : session.settings.genres.join(', ')}
            </div>
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Eye size={13} className="text-amber-400 shrink-0" />
              Já assistidos: {session.settings.includeWatched ? 'Incluídos' : 'Excluídos'}
            </div>
          </div>
        )}

        {error && <p className="text-rose-400 text-sm">{error}</p>}

        {!session && (
          <div className="flex justify-center py-8">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        )}

        {isHost && session && (
          <button
            onClick={handleStart}
            className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20"
          >
            <Play size={20} fill="black" />
            Iniciar sessão · {participantCount} participante{participantCount !== 1 ? 's' : ''}
          </button>
        )}

        {isHost && session && (
          <button
            onClick={() => setConfirmCancel(true)}
            className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-400 text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-colors"
          >
            <Trash2 size={14} />
            Cancelar e encerrar sessão
          </button>
        )}

        {!isHost && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block" />
            Aguardando anfitrião…
          </div>
        )}
      </motion.div>

      {/* Manage participant bottom sheet */}
      <AnimatePresence>
        {managePid && managedParticipant && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => { setManagePid(null); setRenaming(false) }}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e1c] rounded-t-3xl border-t border-white/8 p-5 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-bold">{managedParticipant.name}</p>
                  <p className="text-gray-500 text-xs">Gerenciar participante</p>
                </div>
                <button onClick={() => { setManagePid(null); setRenaming(false) }} className="text-gray-500">
                  <X size={20} />
                </button>
              </div>

              {renaming ? (
                <form onSubmit={handleRenameSubmit} className="space-y-3">
                  <input
                    autoFocus
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    maxLength={30}
                    placeholder="Novo nome…"
                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-400/40 transition-colors"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRenaming(false)}
                      className="flex-1 py-3 rounded-xl bg-white/5 text-gray-400 font-medium text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={!newName.trim()}
                      className="flex-1 py-3 rounded-xl bg-amber-400 text-black font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
                    >
                      <Check size={15} />Salvar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setRenaming(true)}
                    className="w-full py-3.5 rounded-xl bg-white/5 border border-white/8 text-white text-sm font-medium flex items-center gap-3 px-4 hover:bg-white/10 transition-colors"
                  >
                    <Edit2 size={15} className="text-amber-400" />
                    Renomear participante
                  </button>
                  <button
                    onClick={() => handleKick(managePid)}
                    className="w-full py-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm font-medium flex items-center gap-3 px-4 hover:bg-rose-500/20 transition-colors"
                  >
                    <X size={15} />
                    Remover da sessão
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel session confirmation */}
      <AnimatePresence>
        {confirmCancel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
              onClick={() => setConfirmCancel(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-[#0e0e1c] rounded-2xl border border-white/8 p-6 space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-rose-500/15 flex items-center justify-center shrink-0">
                    <AlertTriangle size={18} className="text-rose-400" />
                  </div>
                  <div>
                    <p className="text-white font-bold">Cancelar sessão?</p>
                    <p className="text-gray-500 text-sm">Todos os participantes serão desconectados.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancel(false)}
                    className="flex-1 py-3 rounded-xl bg-white/5 text-gray-300 font-medium text-sm"
                  >
                    Manter
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-3 rounded-xl bg-rose-500 text-white font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} />
                    Cancelar sessão
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {session && (
        <ChatDrawer
          code={code}
          userName={session.participants?.[userId]?.name || 'Anônimo'}
          participants={session.participants}
        />
      )}
    </div>
  )
}
