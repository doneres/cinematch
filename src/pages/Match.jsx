import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, Play, Star, Clock, Calendar, User, Video, Award, Loader2 } from 'lucide-react'
import Logo from '../components/Logo'
import FilmPoster from '../components/FilmPoster'
import { subscribeToSession } from '../lib/sessionService'
import { getFilmDetails } from '../lib/omdb'
import { getUserId } from '../lib/utils'

export default function Match() {
  const { code } = useParams()
  const navigate = useNavigate()
  const userId = getUserId()
  const [omdb, setOmdb] = useState(null)
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  // Real-time subscription — forwards status changes downstream
  useEffect(() => {
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      if (data.status === 'watching') navigate(`/watch/${code}`)
      if (data.status === 'reviewing' || data.status === 'finished') navigate(`/review/${code}`)
    })
    return unsub
  }, [code])

  useEffect(() => {
    if (!session?.matchedFilm) return
    getFilmDetails(session.matchedFilm).then((d) => {
      setOmdb(d)
      setLoading(false)
    })
  }, [session?.matchedFilm])

  if (loading || !session) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 size={28} className="text-amber-400 animate-spin" />
      </div>
    )
  }

  const poster = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : null
  const val = (v) => (v && v !== 'N/A' ? v : null)
  const participantNames = Object.values(session.participants || {}).map((p) => p.name)
  const rtRating = omdb?.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')
  const isHost = session.hostId === userId

  return (
    <div className="flex-1 flex flex-col items-center px-4 py-8 overflow-y-auto">
      {/* Confetti */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 18 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: `${Math.random() * 100}vw`, opacity: 1 }}
            animate={{ y: '110vh', opacity: 0, rotate: Math.random() * 360 }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, repeat: Infinity }}
            className="absolute w-2.5 h-2.5 rounded-sm"
            style={{ backgroundColor: ['#f5c518', '#e53e3e', '#48bb78', '#9f7aea', '#ed8936'][i % 5] }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 22 }}
        className="w-full max-w-sm z-10 space-y-5"
      >
        <div className="text-center space-y-1">
          <Logo size="sm" />
          <motion.p
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 280 }}
            className="text-4xl mt-3"
          >
            🍿
          </motion.p>
          <h1 className="text-white text-3xl font-black mt-1">É um Match!</h1>
          <p className="text-gray-400 text-sm">{participantNames.join(' · ')} vão assistir…</p>
        </div>

        {/* Film card */}
        <div className="rounded-2xl overflow-hidden bg-[#12121f] border border-amber-400/20 shadow-2xl shadow-amber-400/10">
          <div className="relative h-56">
            <FilmPoster
              src={poster}
              title={omdb?.Title}
              imdbId={session.matchedFilm}
              className="absolute inset-0 w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />
          </div>

          <div className="p-5 space-y-3">
            <h2 className="text-white text-xl font-bold">{omdb?.Title}</h2>

            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-400">
              {val(omdb?.Year) && <span className="flex items-center gap-1"><Calendar size={13} className="text-amber-400" />{omdb.Year}</span>}
              {val(omdb?.Runtime) && <span className="flex items-center gap-1"><Clock size={13} className="text-amber-400" />{omdb.Runtime}</span>}
            </div>

            <div className="flex gap-2 flex-wrap">
              {val(omdb?.imdbRating) && (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-[#f5c518]/10 border border-[#f5c518]/20 text-amber-300">
                  <Star size={11} fill="currentColor" />{omdb.imdbRating} IMDb
                </span>
              )}
              {rtRating && (
                <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-300">
                  <Award size={11} />{rtRating.Value} RT
                </span>
              )}
            </div>

            {val(omdb?.Genre) && (
              <div className="flex flex-wrap gap-1.5">
                {omdb.Genre.split(', ').map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/8 text-gray-300 border border-white/5">{g}</span>
                ))}
              </div>
            )}

            {val(omdb?.Plot) && <p className="text-gray-400 text-sm leading-relaxed">{omdb.Plot}</p>}

            <div className="space-y-1.5 pt-1">
              {val(omdb?.Director) && (
                <p className="text-gray-500 text-xs flex items-center gap-1.5"><Video size={11} className="text-amber-400" />{omdb.Director}</p>
              )}
              {val(omdb?.Actors) && (
                <p className="text-gray-500 text-xs flex items-center gap-1.5"><User size={11} className="text-amber-400" />{omdb.Actors}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="py-3.5 px-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
          >
            <Home size={17} />
          </button>
          <button
            onClick={() => navigate(`/watch/${code}`)}
            className="flex-1 py-3.5 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20"
          >
            <Play size={18} fill="black" />
            {isHost ? 'Iniciar sessão de cinema' : 'Sala de cinema'}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
