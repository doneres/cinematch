import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo'
import { getSession } from '../lib/sessionService'
import { getFilmDetails } from '../lib/omdb'

export default function Match() {
  const { code } = useParams()
  const navigate = useNavigate()
  const [film, setFilm] = useState(null)
  const [omdb, setOmdb] = useState(null)
  const [participants, setParticipants] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const session = await getSession(code)
      if (!session?.matchedFilm) { navigate('/'); return }
      setParticipants(session.participants || {})
      const details = await getFilmDetails(session.matchedFilm)
      setOmdb(details)
      setFilm({ id: session.matchedFilm, name: details?.Title || session.matchedFilm })
      setLoading(false)
    }
    load()
  }, [code])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080810] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
      </div>
    )
  }

  const poster = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : null
  const participantNames = Object.values(participants).map((p) => p.name)

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center px-4 py-8 overflow-hidden">
      {/* Confetti particles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -20, x: Math.random() * window.innerWidth, opacity: 1 }}
            animate={{ y: window.innerHeight + 20, opacity: 0, rotate: Math.random() * 360 }}
            transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 1.5, repeat: Infinity }}
            className="absolute w-3 h-3 rounded-sm"
            style={{
              backgroundColor: ['#f5c518', '#e53e3e', '#48bb78', '#9f7aea', '#ed8936'][i % 5],
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="w-full max-w-sm space-y-6 z-10"
      >
        <div className="text-center space-y-1">
          <Logo size="sm" />
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', stiffness: 300 }}
            className="text-5xl mt-4"
          >
            🍿
          </motion.div>
          <h1 className="text-white text-3xl font-black mt-2">É um Match!</h1>
          <p className="text-gray-400 text-sm">
            {participantNames.join(', ')} vão assistir…
          </p>
        </div>

        {/* Film card */}
        <div className="rounded-2xl overflow-hidden bg-[#12121f] border border-amber-400/20 shadow-2xl shadow-amber-400/10">
          {poster && (
            <div className="relative h-72">
              <img src={poster} alt={film.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#12121f] via-transparent to-transparent" />
            </div>
          )}

          <div className="p-5 space-y-3">
            <h2 className="text-white text-2xl font-bold">{film.name}</h2>

            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
              {omdb?.Year && <span>{omdb.Year}</span>}
              {omdb?.Runtime && omdb.Runtime !== 'N/A' && (
                <><span>·</span><span>⏱ {omdb.Runtime}</span></>
              )}
              {omdb?.imdbRating && omdb.imdbRating !== 'N/A' && (
                <><span>·</span><span className="text-amber-400">⭐ {omdb.imdbRating}/10</span></>
              )}
            </div>

            {omdb?.Genre && omdb.Genre !== 'N/A' && (
              <div className="flex flex-wrap gap-1">
                {omdb.Genre.split(', ').map((g) => (
                  <span key={g} className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-gray-300">
                    {g}
                  </span>
                ))}
              </div>
            )}

            {omdb?.Plot && omdb.Plot !== 'N/A' && (
              <p className="text-gray-400 text-sm leading-relaxed">{omdb.Plot}</p>
            )}

            {omdb?.Director && omdb.Director !== 'N/A' && (
              <p className="text-gray-500 text-xs">🎥 {omdb.Director}</p>
            )}
            {omdb?.Actors && omdb.Actors !== 'N/A' && (
              <p className="text-gray-500 text-xs">🎭 {omdb.Actors}</p>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => navigate('/')}
            className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 active:scale-95 transition-all"
          >
            🏠 Início
          </button>
          <button
            onClick={() => navigate('/create')}
            className="flex-1 py-3 rounded-2xl bg-amber-400 text-black font-bold hover:bg-amber-300 active:scale-95 transition-all"
          >
            🔄 Nova sessão
          </button>
        </div>
      </motion.div>
    </div>
  )
}
