import { useEffect, useState, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import SwipeCard from '../components/SwipeCard'
import Logo from '../components/Logo'
import { subscribeToSession, recordVote } from '../lib/sessionService'
import { getFilmDetails, fetchFilmList } from '../lib/omdb'
import { getUserId, seededShuffle } from '../lib/utils'

export default function Swipe() {
  const { code } = useParams()
  const navigate = useNavigate()
  const userId = getUserId()

  const [session, setSession] = useState(null)
  const [filmOrder, setFilmOrder] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [omdbCache, setOmdbCache] = useState({})
  const [loadingFilm, setLoadingFilm] = useState(false)
  const [done, setDone] = useState(false)
  const [matchStatus, setMatchStatus] = useState(null) // 'waiting' | null

  // Subscribe to session for real-time match detection
  useEffect(() => {
    if (!code) return
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'completed' && data.matchedFilm) {
        navigate(`/match/${code}`)
      }
    })
    return unsub
  }, [code])

  // Build shuffled film order for this user
  useEffect(() => {
    if (!session?.filmIds) return
    const shuffled = seededShuffle(session.filmIds, userId)
    setFilmOrder(shuffled)
  }, [session?.filmIds, userId])

  // Preload OMDB data for current + next 2 films
  useEffect(() => {
    if (!filmOrder.length) return
    const toLoad = filmOrder.slice(currentIndex, currentIndex + 3)
    toLoad.forEach(async (id) => {
      if (!omdbCache[id]) {
        const data = await getFilmDetails(id)
        if (data) setOmdbCache((prev) => ({ ...prev, [id]: data }))
      }
    })
  }, [currentIndex, filmOrder])

  async function handleSwipe(direction) {
    const filmId = filmOrder[currentIndex]
    if (!filmId) return

    const liked = direction === 'like'
    setMatchStatus(null)

    try {
      const result = await recordVote({ code, userId, filmId, liked })
      if (result.matched) {
        navigate(`/match/${code}`)
        return
      }
    } catch (err) {
      console.error('Vote error:', err)
    }

    const next = currentIndex + 1
    if (next >= filmOrder.length) {
      setDone(true)
    } else {
      setCurrentIndex(next)
    }
  }

  const currentFilmId = filmOrder[currentIndex]
  const currentFilm = session?.filmIds
    ? { id: currentFilmId, name: omdbCache[currentFilmId]?.Title || currentFilmId }
    : null
  const currentOmdb = omdbCache[currentFilmId]

  const participantCount = Object.keys(session?.participants || {}).length
  const progress = filmOrder.length > 0 ? Math.round((currentIndex / filmOrder.length) * 100) : 0

  if (done) {
    return (
      <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-6xl">😴</div>
        <h2 className="text-white text-2xl font-bold text-center">
          Você passou por todos os filmes!
        </h2>
        <p className="text-gray-400 text-sm text-center">
          Aguardando os outros participantes…
        </p>
        <div className="flex items-center gap-2 text-amber-400 text-sm">
          <div className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
          Match em andamento
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center px-4 py-6 relative">
      {/* Header */}
      <div className="w-full max-w-sm flex items-center justify-between mb-6">
        <Logo size="sm" />
        <div className="text-right">
          <p className="text-gray-500 text-xs">
            {currentIndex + 1} / {filmOrder.length}
          </p>
          <p className="text-gray-600 text-xs">
            👥 {participantCount} participante{participantCount !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm h-1 bg-white/5 rounded-full mb-6">
        <div
          className="h-full bg-amber-400/60 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card stack */}
      <div className="relative flex items-center justify-center w-full">
        {/* Background card (next) */}
        {filmOrder[currentIndex + 1] && (
          <div className="absolute scale-95 opacity-40 pointer-events-none top-4">
            <div className="w-80 sm:w-96 h-[560px] rounded-2xl bg-[#12121f] border border-white/5" />
          </div>
        )}

        {/* Current card */}
        <AnimatePresence mode="wait">
          {currentFilmId && (
            <motion.div
              key={currentFilmId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2 }}
            >
              <SwipeCard
                film={{ id: currentFilmId, name: currentOmdb?.Title || '…' }}
                omdbData={currentOmdb}
                onSwipe={handleSwipe}
                isTop={true}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <p className="text-gray-600 text-xs mt-8 text-center">
        Arraste → para curtir · ← para passar
      </p>
    </div>
  )
}
