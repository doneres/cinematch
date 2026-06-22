import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Crown, Edit2, X, Check, Clock,
  Trash2, AlertTriangle, Settings,
} from 'lucide-react'
import { kickParticipant, renameParticipant, cancelSession } from '../lib/sessionService'
import { getUserId } from '../lib/utils'

const INACTIVE_MS = 2 * 60 * 1000

function isInactive(p) {
  if (!p.lastSeen) return false
  const ts = p.lastSeen.toDate?.() ?? new Date(p.lastSeen)
  return Date.now() - ts.getTime() > INACTIVE_MS
}

export default function HostControls({ code, session, onCancelled }) {
  const userId = getUserId()
  const [open, setOpen] = useState(false)
  const [managePid, setManagePid] = useState(null)
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (session?.hostId !== userId) return null

  const participants = session?.participants || {}

  function openManage(pid) {
    setManagePid(pid)
    setRenaming(false)
    setNewName(participants[pid]?.name || '')
  }

  function closeManage() {
    setManagePid(null)
    setRenaming(false)
    setNewName('')
  }

  async function handleKick(pid) {
    closeManage()
    await kickParticipant(code, pid).catch(console.error)
  }

  async function handleRename(e) {
    e?.preventDefault()
    if (!newName.trim()) return
    await renameParticipant(code, managePid, newName).catch(console.error)
    closeManage()
  }

  async function handleCancel() {
    setConfirmCancel(false)
    setOpen(false)
    await cancelSession(code).catch(console.error)
    onCancelled?.()
  }

  const participantList = Object.entries(participants)

  return (
    <>
      {/* Floating host button — fixed within the shell thanks to transform on app-shell */}
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-[4.5rem] right-4 z-30 flex items-center gap-1.5 px-3 py-2 rounded-full bg-[#1a1a2e] border border-amber-400/30 text-amber-400 text-xs font-semibold shadow-lg hover:bg-amber-400/15 active:scale-95 transition-all"
        title="Gerenciar sessão"
      >
        <Crown size={13} />
        <span>{participantList.length} participantes</span>
      </button>

      {/* Main management panel */}
      <AnimatePresence>
        {open && !managePid && !confirmCancel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 30 }}
              className="fixed bottom-0 left-0 right-0 z-50 bg-[#0e0e1c] rounded-t-3xl border-t border-white/8 flex flex-col"
              style={{ maxHeight: '75dvh' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/6 shrink-0">
                <div className="flex items-center gap-2">
                  <Settings size={15} className="text-amber-400" />
                  <span className="text-white font-bold">Gerenciar sessão</span>
                </div>
                <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Participant list */}
              <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-3">
                  Participantes · {participantList.length}
                </p>
                {participantList.map(([pid, p]) => {
                  const inactive = isInactive(p)
                  const isParticipantHost = pid === session.hostId

                  return (
                    <div
                      key={pid}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${
                        inactive ? 'bg-white/2 border-white/5 opacity-70' : 'bg-white/4 border-white/6'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-sm shrink-0">
                        {p.name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-white text-sm font-medium truncate">{p.name}</span>
                          {isParticipantHost && <Crown size={11} className="text-amber-400 shrink-0" />}
                          {pid === userId && <span className="text-gray-600 text-xs">(você)</span>}
                        </div>
                        {inactive && (
                          <span className="text-orange-400/70 text-xs flex items-center gap-1">
                            <Clock size={10} />inativo
                          </span>
                        )}
                      </div>
                      {!isParticipantHost && (
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

              {/* Cancel session */}
              <div className="px-4 py-4 border-t border-white/6 shrink-0">
                <button
                  onClick={() => setConfirmCancel(true)}
                  className="w-full py-3 rounded-xl border border-rose-500/20 text-rose-400 text-sm flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-colors"
                >
                  <Trash2 size={14} />
                  Cancelar e encerrar sessão
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Manage individual participant */}
      <AnimatePresence>
        {managePid && participants[managePid] && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closeManage}
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
                  <p className="text-white font-bold">{participants[managePid]?.name}</p>
                  <p className="text-gray-500 text-xs">Gerenciar participante</p>
                </div>
                <button onClick={closeManage} className="text-gray-500 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              {renaming ? (
                <form onSubmit={handleRename} className="space-y-3">
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
                      Voltar
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
                  <button
                    onClick={() => { closeManage(); setOpen(true) }}
                    className="w-full py-2.5 text-gray-600 text-sm"
                  >
                    ← Voltar à lista
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cancel confirmation dialog */}
      <AnimatePresence>
        {confirmCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
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
                  Encerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
