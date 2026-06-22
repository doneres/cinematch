import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, SkipForward, Users, Clock, Film } from 'lucide-react'
import Logo from '../components/Logo'
import FilmPoster from '../components/FilmPoster'
import ParticipantList from '../components/ParticipantList'
import { subscribeToSession, startWatching, openReview } from '../lib/sessionService'
import { getFilmDetails } from '../lib/omdb'
import { getUserId } from '../lib/utils'

export default function WatchSession() {
  const { code } = useParams()
  const navigate = useNavigate()
  const userId = getUserId()

  const [session, setSession] = useState(null)
  const [omdb, setOmdb] = useState(null)
  const [remaining, setRemaining] = useState(null) // seconds
  const [starting, setStarting] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'reviewing' || data.status === 'finished') {
        navigate(`/review/${code}`)
      }
      if (data.status === 'active') navigate(`/swipe/${code}`)
    })
    return unsub
  }, [code])

  // Load OMDB data for the matched film
  useEffect(() => {
    if (!session?.matchedFilm) return
    getFilmDetails(session.matchedFilm).then(setOmdb)
  }, [session?.matchedFilm])

  // Countdown timer
  useEffect(() => {
    clearInterval(timerRef.current)
    if (!session?.watchSession?.endAt) return

    const endAt = session.watchSession.endAt.toDate?.() ?? new Date(session.watchSession.endAt)

    function tick() {
      const secs = Math.max(0, Math.floor((endAt - Date.now()) / 1000))
      setRemaining(secs)
      if (secs === 0) {
        clearInterval(timerRef.current)
        // Auto-open review when timer hits 0
        if (session.hostId === userId) {
          openReview(code).catch(() => {})
        }
      }
    }

    tick()
    timerRef.current = setInterval(tick, 1000)
    return () => clearInterval(timerRef.current)
  }, [session?.watchSession?.endAt])

  async function handleStartWatching() {
    setStarting(true)
    try {
      await startWatching(code, omdb?.Runtime || '120 min')
    } catch (err) {
      console.error(err)
      setStarting(false)
    }
  }

  async function handleForceReview() {
    await openReview(code)
  }

  const isHost = session?.hostId === userId
  const isWatching = session?.status === 'watching'
  const poster = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : null

  function formatTime(secs) {
    if (secs == null) return '--:--'
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    const s = secs % 60
    if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const totalSecs = (session?.watchSession?.runtimeMinutes || 0) * 60
  const progress = totalSecs > 0 ? Math.max(0, 1 - remaining / totalSecs) : 0

  return (
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      <div className="flex items-center justify-between mb-6">
        <Logo size="sm" />
        <span className="text-gray-600 text-xs uppercase tracking-wider">Sessão {code}</span>
      </div>

      <div className="flex-1 max-w-sm w-full mx-auto space-y-5">
        {/* Film hero */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden bg-[#12121f] border border-white/5"
        >
          <div className="relative h-44">
            <FilmPoster
              src={poster}
              title={omdb?.Title || '…'}
              imdbId={session?.matchedFilm}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <p className="text-white font-bold text-lg leading-tight">{omdb?.Title || '…'}</p>
              {omdb?.Runtime && omdb.Runtime !== 'N/A' && (
                <p className="text-gray-400 text-xs flex items-center gap-1 mt-0.5">
                  <Clock size={11} />{omdb.Runtime}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status */}
        {!isWatching ? (
          <div className="text-center space-y-4 py-4">
            <div className="text-4xl">🎬</div>
            <div>
              <h2 className="text-white text-xl font-bold">Hora do filme!</h2>
              <p className="text-gray-500 text-sm mt-1">
                {isHost
                  ? 'Inicie quando todos estiverem prontos. O cronômetro vai liberar a avaliação automaticamente.'
                  : 'Aguardando o anfitrião iniciar…'}
              </p>
            </div>

            {isHost && (
              <button
                onClick={handleStartWatching}
                disabled={starting}
                className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20 disabled:opacity-50"
              >
                <Play size={20} fill="black" />
                {starting ? 'Iniciando…' : 'Vamos assistir!'}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {/* Countdown */}
            <div className="px-5 py-4 rounded-2xl bg-[#12121f] border border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-400 text-sm flex items-center gap-1.5">
                  <Clock size={14} className="text-amber-400" />
                  Avaliação disponível em
                </span>
                <span className="text-white font-mono font-bold text-lg tabular-nums">
                  {remaining === 0 ? 'Agora!' : formatTime(remaining)}
                </span>
              </div>

              {/* Film progress bar */}
              <div className="space-y-1">
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-amber-400 rounded-full"
                    style={{ width: `${progress * 100}%` }}
                    transition={{ duration: 1, ease: 'linear' }}
                  />
                </div>
                <div className="flex justify-between text-gray-600 text-xs">
                  <span>Início</span>
                  <span className="flex items-center gap-1"><Film size={10} />Fim do filme</span>
                </div>
              </div>
            </div>

            {remaining === 0 && (
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="py-4 rounded-2xl bg-amber-400/10 border border-amber-400/30 text-center space-y-2"
              >
                <p className="text-amber-400 font-bold">⭐ Hora de avaliar!</p>
                <p className="text-gray-400 text-sm">O filme acabou. Compartilhe sua opinião!</p>
              </motion.div>
            )}

            {isHost && remaining > 0 && (
              <button
                onClick={handleForceReview}
                className="w-full py-3 rounded-xl border border-white/10 text-gray-400 text-sm flex items-center justify-center gap-2 hover:bg-white/5 transition-colors"
              >
                <SkipForward size={15} />
                Liberar avaliação agora
              </button>
            )}
          </div>
        )}

        {/* Participants */}
        {session && (
          <div className="space-y-2">
            <p className="text-gray-500 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <Users size={12} />Assistindo
            </p>
            <ParticipantList participants={session.participants} hostId={session.hostId} />
          </div>
        )}
      </div>
    </div>
  )
}
