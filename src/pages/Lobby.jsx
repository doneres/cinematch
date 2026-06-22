import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo'
import SessionCode from '../components/SessionCode'
import ParticipantList from '../components/ParticipantList'
import { subscribeToSession, startSession } from '../lib/sessionService'
import { getUserId } from '../lib/utils'

export default function Lobby() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [error, setError] = useState('')
  const userId = getUserId()

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'active') navigate(`/swipe/${code}`)
      if (data.status === 'completed') navigate(`/match/${code}`)
    })
    return unsub
  }, [code])

  async function handleStart() {
    try {
      await startSession(code)
    } catch {
      setError('Erro ao iniciar a sessão.')
    }
  }

  const isHost = session?.hostId === userId
  const participantCount = Object.keys(session?.participants || {}).length

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-8 pt-4"
      >
        <Logo size="sm" />

        <div className="text-center space-y-1">
          <h2 className="text-white text-2xl font-bold">Sala de espera</h2>
          <p className="text-gray-500 text-sm">
            {isHost
              ? 'Aguarde seus amigos e inicie quando estiver pronto'
              : 'Aguardando o anfitrião iniciar a sessão…'}
          </p>
        </div>

        {session && <SessionCode code={code} />}

        {session && (
          <ParticipantList
            participants={session.participants}
            hostId={session.hostId}
          />
        )}

        {/* Settings summary */}
        {session?.settings && (
          <div className="w-full max-w-sm px-4 py-3 rounded-xl bg-white/3 border border-white/5 space-y-1">
            <p className="text-gray-500 text-xs uppercase tracking-wider mb-2">Configurações</p>
            <p className="text-gray-400 text-sm">
              📽️ {session.filmIds?.length || 0} filmes na lista
            </p>
            <p className="text-gray-400 text-sm">
              🎭 Gêneros: {session.settings.genres.includes('all') ? 'Todos' : session.settings.genres.join(', ')}
            </p>
            <p className="text-gray-400 text-sm">
              👁️ Assistidos: {session.settings.includeWatched ? 'Incluídos' : 'Excluídos'}
            </p>
          </div>
        )}

        {error && <p className="text-rose-400 text-sm text-center">{error}</p>}

        {isHost && (
          <button
            onClick={handleStart}
            disabled={participantCount < 1}
            className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-lg hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-amber-400/20"
          >
            ▶️ Iniciar sessão ({participantCount} participante{participantCount !== 1 ? 's' : ''})
          </button>
        )}

        {!isHost && (
          <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
            <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Aguardando anfitrião…
          </div>
        )}
      </motion.div>
    </div>
  )
}
