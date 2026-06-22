import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState } from 'react'

const SWIPE_THRESHOLD = 100

export default function SwipeCard({ film, omdbData, onSwipe, isTop }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-25, 25])
  const likeOpacity = useTransform(x, [20, 100], [0, 1])
  const nopeOpacity = useTransform(x, [-100, -20], [1, 0])
  const [dragging, setDragging] = useState(false)

  const poster =
    omdbData?.Poster && omdbData.Poster !== 'N/A'
      ? omdbData.Poster
      : null

  const genres = omdbData?.Genre?.split(', ').slice(0, 3) || []
  const runtime = omdbData?.Runtime || '—'
  const year = omdbData?.Year || ''
  const plot = omdbData?.Plot || 'Sem sinopse disponível.'
  const imdbRating = omdbData?.imdbRating || '—'

  async function handleDragEnd(_, info) {
    setDragging(false)
    if (info.offset.x > SWIPE_THRESHOLD) {
      await animate(x, 600, { duration: 0.3 })
      onSwipe('like')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      await animate(x, -600, { duration: 0.3 })
      onSwipe('nope')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 25 })
    }
  }

  async function handleButton(direction) {
    await animate(x, direction === 'like' ? 600 : -600, { duration: 0.3 })
    onSwipe(direction)
  }

  return (
    <div className="relative flex flex-col items-center">
      <motion.div
        style={{ x, rotate }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={() => setDragging(true)}
        onDragEnd={handleDragEnd}
        className="relative w-80 sm:w-96 cursor-grab active:cursor-grabbing select-none"
        whileTap={{ scale: 1.02 }}
      >
        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-8 left-6 z-20 rotate-[-20deg] border-4 border-emerald-400 text-emerald-400 text-3xl font-black px-3 py-1 rounded-lg tracking-widest pointer-events-none"
        >
          CURTIR
        </motion.div>

        {/* NOPE stamp */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-8 right-6 z-20 rotate-[20deg] border-4 border-rose-500 text-rose-500 text-3xl font-black px-3 py-1 rounded-lg tracking-widest pointer-events-none"
        >
          PASSAR
        </motion.div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#12121f] border border-white/5">
          {/* Poster */}
          <div className="relative h-[420px] bg-[#0d0d1a]">
            {poster ? (
              <img
                src={poster}
                alt={film.name}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-6xl">🎬</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />

            {/* IMDb badge */}
            {imdbRating !== '—' && (
              <div className="absolute top-3 right-3 bg-[#f5c518] text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                ⭐ {imdbRating}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-4 space-y-3">
            <div>
              <h2 className="text-white text-xl font-bold leading-tight">{film.name}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                <span>{year}</span>
                {runtime !== '—' && <><span>·</span><span>⏱ {runtime}</span></>}
                {film.rating > 0 && <><span>·</span><span className="text-amber-400">★ {film.rating}</span></>}
              </div>
            </div>

            {genres.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {genres.map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {g}
                  </span>
                ))}
              </div>
            )}

            <p className="text-gray-400 text-sm leading-relaxed line-clamp-3">{plot}</p>
          </div>
        </div>
      </motion.div>

      {/* Buttons */}
      {isTop && (
        <div className="flex gap-6 mt-6">
          <button
            onClick={() => handleButton('nope')}
            className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-rose-500/50 text-rose-500 text-2xl flex items-center justify-center hover:bg-rose-500/10 transition-colors shadow-lg"
          >
            ✕
          </button>
          <button
            onClick={() => handleButton('like')}
            className="w-16 h-16 rounded-full bg-[#1a1a2e] border border-emerald-400/50 text-emerald-400 text-2xl flex items-center justify-center hover:bg-emerald-400/10 transition-colors shadow-lg"
          >
            ♥
          </button>
        </div>
      )}
    </div>
  )
}
