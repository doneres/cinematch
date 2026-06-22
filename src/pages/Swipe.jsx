import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import SwipeCard from '../components/SwipeCard'
import FilmDetailModal from '../components/FilmDetailModal'
import Logo from '../components/Logo'
import { subscribeToSession, recordVote } from '../lib/sessionService'
import { getFilmDetails } from '../lib/omdb'
import { getUserId, seededShuffle } from '../lib/utils'
import { Users, Info, Film } from 'lucide-react'

export default function Swipe() {
  const { code } = useParams()
  const navigate = useNavigate()
  const userId = getUserId()

  const [session, setSession] = useState(null)
  const [filmOrder, setFilmOrder] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [omdbCache, setOmdbCache] = useState({})
  const [done, setDone] = useState(false)
  const [detailFilm, setDetailFilm] = useState(null)

  useEffect(() => {
    if (!code) return
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'completed' && data.matchedFilm) navigate(`/match/${code}`)
      if (data.status === 'watching') navigate(`/watch/${code}`)
      if (data.status === 'reviewing' || data.status === 'finished') navigate(`/review/${code}`)
    })
    return unsub
  }, [code])

  useEffect(() => {
    if (!session?.filmIds) return
    setFilmOrder(seededShuffle(session.filmIds, userId))
  }, [session?.filmIds, userId])

  // Preload current + next 2
  useEffect(() => {
    if (!filmOrder.length) return
    filmOrder.slice(currentIndex, currentIndex + 3).forEach(async (id) => {
      if (!omdbCache[id]) {
        const data = await getFilmDetails(id)
        if (data) setOmdbCache((prev) => ({ ...prev, [id]: data }))
      }
    })
  }, [currentIndex, filmOrder])

  async function handleSwipe(direction) {
    const filmId = filmOrder[currentIndex]
    if (!filmId) return
    try {
      const result = await recordVote({ code, userId, filmId, liked: direction === 'like' })
      if (result.matched) { navigate(`/match/${code}`); return }
    } catch (err) {
      console.error(err)
    }
    const next = currentIndex + 1
    if (next >= filmOrder.length) setDone(true)
    else setCurrentIndex(next)
  }

  const currentFilmId = filmOrder[currentIndex]
  const currentOmdb = omdbCache[currentFilmId]
  const nextFilmId = filmOrder[currentIndex + 1]
  const participantCount = Object.keys(session?.participants || {}).length
  const progress = filmOrder.length > 0 ? (currentIndex / filmOrder.length) * 100 : 0

  if (done) {
    return (
      <div className="page-swipe items-center justify-center px-4 gap-4 bg-[#080810]">
        <Film size={48} className="text-gray-700" />
        <h2 className="text-white text-xl font-bold text-center">Você viu todos os filmes!</h2>
        <p className="text-gray-400 text-sm text-center">Aguardando os outros participantes…</p>
        <div className="flex items-center gap-2 text-amber-400 text-sm mt-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block" />
          Match em andamento
        </div>
      </div>
    )
  }

  return (
    <div className="page-swipe bg-[#080810] px-4">
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2 shrink-0">
        <Logo size="sm" />
        <div className="flex items-center gap-3 text-right">
          <span className="text-gray-500 text-xs">{currentIndex + 1}/{filmOrder.length}</span>
          <span className="flex items-center gap-1 text-gray-500 text-xs">
            <Users size={12} />
            {participantCount}
          </span>
        </div>
      </div>

      {/* Progress */}
      <div className="h-0.5 w-full bg-white/5 rounded-full mb-3 shrink-0">
        <div
          className="h-full bg-amber-400/70 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center relative">
        {/* Background (next card hint) */}
        {nextFilmId && (
          <div className="absolute inset-x-0 top-3 mx-auto w-full opacity-30 scale-[0.96] pointer-events-none">
            <div className="rounded-2xl bg-[#12121f] border border-white/5" style={{ height: 'clamp(260px, 55dvh, 460px)' }} />
          </div>
        )}

        <AnimatePresence mode="wait">
          {currentFilmId && (
            <motion.div
              key={currentFilmId}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.18 }}
              className="w-full"
            >
              <SwipeCard
                film={{ id: currentFilmId, name: currentOmdb?.Title || '', rating: 0 }}
                omdbData={currentOmdb}
                onSwipe={handleSwipe}
                isTop={true}
                onDetail={() => setDetailFilm({ id: currentFilmId, omdb: currentOmdb })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Hint */}
      <p className="text-gray-700 text-xs text-center py-3 shrink-0">
        Arraste → curtir · ← passar · toque em <Info size={11} className="inline" /> para detalhes
      </p>

      {/* Film detail modal */}
      {detailFilm && (
        <FilmDetailModal
          omdbData={detailFilm.omdb}
          onClose={() => setDetailFilm(null)}
          onLike={() => { setDetailFilm(null); handleSwipe('like') }}
          onNope={() => { setDetailFilm(null); handleSwipe('nope') }}
        />
      )}
    </div>
  )
}
