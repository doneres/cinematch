import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { useState } from 'react'
import { Heart, X, Info, Star, Clock, Calendar } from 'lucide-react'

const SWIPE_THRESHOLD = 90

export default function SwipeCard({ film, omdbData, onSwipe, isTop, onDetail }) {
  const x = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 90], [0, 1])
  const nopeOpacity = useTransform(x, [-90, -20], [1, 0])

  const poster = omdbData?.Poster && omdbData.Poster !== 'N/A' ? omdbData.Poster : null
  const genres = omdbData?.Genre?.split(', ').slice(0, 2) || []
  const runtime = omdbData?.Runtime && omdbData.Runtime !== 'N/A' ? omdbData.Runtime : null
  const year = omdbData?.Year && omdbData.Year !== 'N/A' ? omdbData.Year : null
  const plot = omdbData?.Plot && omdbData.Plot !== 'N/A' ? omdbData.Plot : null
  const imdbRating = omdbData?.imdbRating && omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : null
  const title = omdbData?.Title || film.name || '…'

  async function handleDragEnd(_, info) {
    if (info.offset.x > SWIPE_THRESHOLD) {
      await animate(x, 600, { duration: 0.25 })
      onSwipe('like')
    } else if (info.offset.x < -SWIPE_THRESHOLD) {
      await animate(x, -600, { duration: 0.25 })
      onSwipe('nope')
    } else {
      animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 })
    }
  }

  async function handleButton(direction) {
    await animate(x, direction === 'like' ? 600 : -600, { duration: 0.25 })
    onSwipe(direction)
  }

  return (
    <div className="flex flex-col items-center w-full">
      <motion.div
        style={{ x, rotate }}
        drag={isTop ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        onDragEnd={handleDragEnd}
        className="relative w-full cursor-grab active:cursor-grabbing select-none"
        whileTap={{ scale: 1.01 }}
      >
        {/* LIKE stamp */}
        <motion.div
          style={{ opacity: likeOpacity }}
          className="absolute top-5 left-4 z-20 rotate-[-18deg] border-[3px] border-emerald-400 text-emerald-400 text-2xl font-black px-3 py-0.5 rounded-lg tracking-widest pointer-events-none"
        >
          CURTIR
        </motion.div>

        {/* NOPE stamp */}
        <motion.div
          style={{ opacity: nopeOpacity }}
          className="absolute top-5 right-4 z-20 rotate-[18deg] border-[3px] border-rose-500 text-rose-500 text-2xl font-black px-3 py-0.5 rounded-lg tracking-widest pointer-events-none"
        >
          PASSAR
        </motion.div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#12121f] border border-white/5">
          {/* Poster */}
          <div className="relative" style={{ height: 'clamp(200px, 44dvh, 380px)' }}>
            {poster ? (
              <img
                src={poster}
                alt={title}
                className="w-full h-full object-cover"
                draggable={false}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#0d0d1a]">
                <div className="text-gray-700 text-5xl">🎬</div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />

            {/* Info button */}
            {isTop && onDetail && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDetail() }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors"
              >
                <Info size={16} />
              </button>
            )}

            {/* IMDb badge */}
            {imdbRating && (
              <div className="absolute top-3 left-3 bg-[#f5c518] text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                <Star size={10} fill="black" />
                {imdbRating}
              </div>
            )}
          </div>

          {/* Info strip */}
          <div className="px-4 py-3 space-y-2">
            <h2 className="text-white font-bold leading-tight" style={{ fontSize: 'clamp(15px, 4vw, 19px)' }}>
              {title}
            </h2>

            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              {year && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {year}
                </span>
              )}
              {runtime && (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {runtime}
                </span>
              )}
              {film.rating > 0 && (
                <span className="flex items-center gap-1 text-amber-400">
                  <Star size={11} fill="currentColor" />
                  {film.rating}
                </span>
              )}
            </div>

            {genres.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {genres.map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300 border border-white/5">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {plot && (
              <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{plot}</p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      {isTop && (
        <div className="flex gap-8 mt-4">
          <button
            onClick={() => handleButton('nope')}
            className="w-14 h-14 rounded-full bg-[#1a1a2e] border border-rose-500/40 text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-colors shadow-lg active:scale-90"
          >
            <X size={24} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => handleButton('like')}
            className="w-14 h-14 rounded-full bg-[#1a1a2e] border border-emerald-400/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-400/10 transition-colors shadow-lg active:scale-90"
          >
            <Heart size={22} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
