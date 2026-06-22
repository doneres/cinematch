import { motion, useMotionValue, useTransform, animate } from 'framer-motion'
import { Heart, X, Info, Star, Clock, Calendar, Sparkles } from 'lucide-react'
import FilmPoster from './FilmPoster'

const SWIPE_THRESHOLD = 90
const SWIPE_UP_THRESHOLD = 80

export default function SwipeCard({
  film, omdbData, onSwipe, onSuperLike, isTop, onDetail,
  disabled = false, superLikedBy = null,
}) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-200, 200], [-18, 18])
  const likeOpacity = useTransform(x, [20, 90], [0, 1])
  const nopeOpacity = useTransform(x, [-90, -20], [1, 0])
  const superOpacity = useTransform(y, [-80, -20], [1, 0])

  const poster = omdbData?.Poster && omdbData.Poster !== 'N/A' ? omdbData.Poster : null
  const genres = omdbData?.Genre?.split(', ').slice(0, 2) || []
  const runtime = omdbData?.Runtime && omdbData.Runtime !== 'N/A' ? omdbData.Runtime : null
  const year = omdbData?.Year && omdbData.Year !== 'N/A' ? omdbData.Year : null
  const plot = omdbData?.Plot && omdbData.Plot !== 'N/A' ? omdbData.Plot : null
  const imdbRating = omdbData?.imdbRating && omdbData.imdbRating !== 'N/A' ? omdbData.imdbRating : null
  const title = omdbData?.Title || film?.name || '…'

  async function handleDragEnd(_, info) {
    if (disabled) return

    // Swipe UP → super like
    if (info.offset.y < -SWIPE_UP_THRESHOLD && Math.abs(info.offset.x) < 60) {
      await animate(y, -700, { duration: 0.3 })
      onSuperLike?.()
      return
    }
    // Swipe right → like
    if (info.offset.x > SWIPE_THRESHOLD) {
      await animate(x, 600, { duration: 0.25 })
      onSwipe('like')
      return
    }
    // Swipe left → nope
    if (info.offset.x < -SWIPE_THRESHOLD) {
      await animate(x, -600, { duration: 0.25 })
      onSwipe('nope')
      return
    }
    // Snap back
    animate(x, 0, { type: 'spring', stiffness: 350, damping: 28 })
    animate(y, 0, { type: 'spring', stiffness: 350, damping: 28 })
  }

  async function handleButton(direction) {
    if (disabled) return
    await animate(x, direction === 'like' ? 600 : -600, { duration: 0.25 })
    onSwipe(direction)
  }

  async function handleSuperLikeButton() {
    if (disabled) return
    await animate(y, -700, { duration: 0.3 })
    onSuperLike?.()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <motion.div
        style={{ x, y, rotate }}
        drag={isTop && !disabled ? true : false}
        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
        dragElastic={{ top: 0.8, bottom: 0.1, left: 0.8, right: 0.8 }}
        onDragEnd={handleDragEnd}
        className="relative w-full cursor-grab active:cursor-grabbing select-none"
        whileTap={{ scale: 1.01 }}
      >
        {/* Stamps */}
        <motion.div style={{ opacity: likeOpacity }} className="absolute top-5 left-4 z-20 rotate-[-18deg] border-[3px] border-emerald-400 text-emerald-400 text-2xl font-black px-3 py-0.5 rounded-lg tracking-widest pointer-events-none">
          CURTIR
        </motion.div>
        <motion.div style={{ opacity: nopeOpacity }} className="absolute top-5 right-4 z-20 rotate-[18deg] border-[3px] border-rose-500 text-rose-500 text-2xl font-black px-3 py-0.5 rounded-lg tracking-widest pointer-events-none">
          PASSAR
        </motion.div>
        <motion.div style={{ opacity: superOpacity }} className="absolute top-5 left-1/2 -translate-x-1/2 z-20 border-[3px] border-amber-400 text-amber-400 text-xl font-black px-3 py-0.5 rounded-lg tracking-widest pointer-events-none flex items-center gap-1.5 whitespace-nowrap">
          <Sparkles size={18} />SUPER LIKE
        </motion.div>

        <div className="rounded-2xl overflow-hidden shadow-2xl bg-[#12121f] border border-white/5" style={{
          boxShadow: superLikedBy ? '0 0 0 2px rgba(245,193,24,0.5), 0 20px 60px rgba(245,193,24,0.15)' : undefined,
        }}>
          {/* Recommended badge */}
          {superLikedBy && (
            <div className="flex items-center gap-1.5 px-3 py-2 bg-amber-400/10 border-b border-amber-400/20">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-amber-300 text-xs font-semibold">
                Recomendado por <span className="text-amber-400">{superLikedBy}</span>
              </span>
            </div>
          )}

          {/* Poster */}
          <div className="relative" style={{ height: superLikedBy ? 'clamp(180px, 40dvh, 360px)' : 'clamp(200px, 44dvh, 380px)' }}>
            <FilmPoster
              src={poster}
              title={title}
              imdbId={film?.id}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />

            {isTop && onDetail && (
              <button
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => { e.stopPropagation(); onDetail() }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/70 transition-colors z-10"
              >
                <Info size={16} />
              </button>
            )}

            {imdbRating && (
              <div className="absolute top-3 left-3 bg-[#f5c518] text-black text-xs font-bold px-2 py-1 rounded flex items-center gap-1 z-10">
                <Star size={10} fill="black" />{imdbRating}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="px-4 py-3 space-y-2">
            <h2 className="text-white font-bold leading-tight" style={{ fontSize: 'clamp(15px, 4vw, 19px)' }}>
              {title}
            </h2>
            <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
              {year && <span className="flex items-center gap-1"><Calendar size={11} />{year}</span>}
              {runtime && <span className="flex items-center gap-1"><Clock size={11} />{runtime}</span>}
            </div>
            {genres.length > 0 && (
              <div className="flex gap-1 flex-wrap">
                {genres.map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300 border border-white/5">{g}</span>
                ))}
              </div>
            )}
            {plot && <p className="text-gray-400 text-xs leading-relaxed line-clamp-2">{plot}</p>}
          </div>
        </div>
      </motion.div>

      {/* Action buttons */}
      {isTop && (
        <div className="flex items-center gap-5 mt-4">
          {/* Nope */}
          <button
            onClick={() => handleButton('nope')}
            disabled={disabled}
            className="w-13 h-13 rounded-full bg-[#1a1a2e] border border-rose-500/40 text-rose-500 flex items-center justify-center hover:bg-rose-500/10 transition-colors shadow-lg active:scale-90 disabled:opacity-40"
            style={{ width: 52, height: 52 }}
          >
            <X size={22} strokeWidth={2.5} />
          </button>

          {/* Super like — center, bigger, golden */}
          <button
            onClick={handleSuperLikeButton}
            disabled={disabled}
            className="relative flex items-center justify-center rounded-full bg-[#1a1a2e] border-2 border-amber-400/60 text-amber-400 hover:bg-amber-400/10 transition-all shadow-lg shadow-amber-400/20 active:scale-90 disabled:opacity-40"
            style={{ width: 60, height: 60 }}
            title="Super Like — recomenda para todos"
          >
            <Sparkles size={24} />
            {/* Pulse ring */}
            <span className="absolute inset-0 rounded-full border border-amber-400/30 animate-ping pointer-events-none" />
          </button>

          {/* Like */}
          <button
            onClick={() => handleButton('like')}
            disabled={disabled}
            className="w-13 h-13 rounded-full bg-[#1a1a2e] border border-emerald-400/40 text-emerald-400 flex items-center justify-center hover:bg-emerald-400/10 transition-colors shadow-lg active:scale-90 disabled:opacity-40"
            style={{ width: 52, height: 52 }}
          >
            <Heart size={20} strokeWidth={2.5} />
          </button>
        </div>
      )}
    </div>
  )
}
