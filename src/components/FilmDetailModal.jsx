import { motion, AnimatePresence } from 'framer-motion'
import { X, Heart, Star, Clock, Calendar, User, Video, Award } from 'lucide-react'
import FilmPoster from './FilmPoster'

export default function FilmDetailModal({ omdbData, filmId, onClose, onLike, onNope }) {
  if (!omdbData) return null

  const poster = omdbData.Poster && omdbData.Poster !== 'N/A' ? omdbData.Poster : null
  const val = (v) => (v && v !== 'N/A' ? v : null)
  const rtRating = omdbData.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
        onClick={onClose}
      >
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full bg-[#10101c] rounded-t-3xl overflow-hidden max-h-[90dvh] flex flex-col"
        >
          <div className="flex justify-center pt-3 pb-1 shrink-0">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          <div className="overflow-y-auto flex-1">
            <div className="relative h-48 sm:h-64">
              <FilmPoster
                src={poster}
                title={omdbData.Title}
                imdbId={filmId}
                className="absolute inset-0 w-full h-full"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#10101c] via-[#10101c]/40 to-transparent" />
            </div>

            <div className="px-5 pb-8 space-y-4">
              <div className="flex items-start justify-between gap-3 pt-2">
                <h2 className="text-white text-2xl font-black leading-tight flex-1">{omdbData.Title}</h2>
                <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-gray-400 hover:text-white shrink-0 mt-0.5">
                  <X size={16} />
                </button>
              </div>

              <div className="flex flex-wrap gap-3 text-sm text-gray-400">
                {val(omdbData.Year) && <span className="flex items-center gap-1.5"><Calendar size={13} className="text-amber-400" />{omdbData.Year}</span>}
                {val(omdbData.Runtime) && <span className="flex items-center gap-1.5"><Clock size={13} className="text-amber-400" />{omdbData.Runtime}</span>}
                {val(omdbData.Rated) && <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-medium">{omdbData.Rated}</span>}
              </div>

              <div className="flex gap-3 flex-wrap">
                {val(omdbData.imdbRating) && (
                  <div className="flex items-center gap-1.5 bg-[#f5c518]/10 border border-[#f5c518]/20 px-3 py-1.5 rounded-xl">
                    <Star size={14} className="text-[#f5c518]" fill="currentColor" />
                    <span className="text-white font-bold text-sm">{omdbData.imdbRating}</span>
                    <span className="text-gray-500 text-xs">/10 IMDb</span>
                  </div>
                )}
                {rtRating && (
                  <div className="flex items-center gap-1.5 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl">
                    <Award size={14} className="text-rose-400" />
                    <span className="text-white font-bold text-sm">{rtRating.Value}</span>
                    <span className="text-gray-500 text-xs">RT</span>
                  </div>
                )}
              </div>

              {val(omdbData.Genre) && (
                <div className="flex flex-wrap gap-1.5">
                  {omdbData.Genre.split(', ').map((g) => (
                    <span key={g} className="text-xs px-2.5 py-1 rounded-full bg-white/8 text-gray-300 border border-white/8">{g}</span>
                  ))}
                </div>
              )}

              {val(omdbData.Plot) && (
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1.5">Sinopse</p>
                  <p className="text-gray-300 text-sm leading-relaxed">{omdbData.Plot}</p>
                </div>
              )}

              {val(omdbData.Director) && (
                <div className="flex items-start gap-2">
                  <Video size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-gray-300 text-sm"><span className="text-gray-500">Direção · </span>{omdbData.Director}</p>
                </div>
              )}

              {val(omdbData.Actors) && (
                <div className="flex items-start gap-2">
                  <User size={14} className="text-amber-400 mt-0.5 shrink-0" />
                  <p className="text-gray-300 text-sm"><span className="text-gray-500">Elenco · </span>{omdbData.Actors}</p>
                </div>
              )}

              {(val(omdbData.Country) || val(omdbData.Language)) && (
                <p className="text-gray-600 text-xs">
                  {[val(omdbData.Country), val(omdbData.Language)].filter(Boolean).join(' · ')}
                </p>
              )}

              {(onLike || onNope) && (
                <div className="flex gap-3 pt-2">
                  {onNope && (
                    <button onClick={onNope} className="flex-1 py-3.5 rounded-2xl border border-rose-500/40 text-rose-400 font-semibold flex items-center justify-center gap-2 hover:bg-rose-500/10 transition-colors">
                      <X size={18} />Passar
                    </button>
                  )}
                  {onLike && (
                    <button onClick={onLike} className="flex-1 py-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-400/40 text-emerald-400 font-semibold flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-colors">
                      <Heart size={18} />Curtir
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
