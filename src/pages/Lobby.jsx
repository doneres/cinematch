import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Play, Film, Tag, Eye, Loader2 } from 'lucide-react'
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
    <div className="min-h-dvh bg-[#080810] flex flex-col px-4 py-6">
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

        {session && (
          <ParticipantList participants={session.participants} hostId={session.hostId} />
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

        {!isHost && (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block" />
            Aguardando anfitrião…
          </div>
        )}
      </motion.div>
    </div>
  )
}
