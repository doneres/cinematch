import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo'
import { fetchFilmList, getFilmDetails } from '../lib/omdb'
import { createSession } from '../lib/sessionService'
import { getUserId } from '../lib/utils'

const ALL_GENRES = ['Action', 'Adventure', 'Comedy', 'Horror', 'Drama', 'Sci-Fi', 'Animation', 'Thriller', 'Romance', 'Crime']

export default function CreateSession() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [genres, setGenres] = useState(['all'])
  const [includeWatched, setIncludeWatched] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMsg, setLoadingMsg] = useState('')
  const [error, setError] = useState('')

  function toggleGenre(g) {
    if (g === 'all') {
      setGenres(['all'])
      return
    }
    setGenres((prev) => {
      const without = prev.filter((x) => x !== 'all')
      if (without.includes(g)) {
        const next = without.filter((x) => x !== g)
        return next.length === 0 ? ['all'] : next
      }
      return [...without, g]
    })
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!name.trim()) { setError('Digite seu nome'); return }
    setError('')
    setLoading(true)

    try {
      setLoadingMsg('Carregando lista de filmes…')
      const filmList = await fetchFilmList()

      // Filter by watched setting
      let filtered = includeWatched ? filmList : filmList.filter((f) => !f.watched)

      // If genre filter is active, fetch details and filter
      let filmIds = filtered.map((f) => f.id).filter(Boolean)

      if (!genres.includes('all')) {
        setLoadingMsg(`Filtrando por gênero (0/${filmIds.length})…`)
        const matched = []
        for (let i = 0; i < filmIds.length; i++) {
          const details = await getFilmDetails(filmIds[i])
          if (details?.Genre) {
            const filmGenres = details.Genre.split(', ')
            if (genres.some((g) => filmGenres.includes(g))) {
              matched.push(filmIds[i])
            }
          }
          setLoadingMsg(`Filtrando por gênero (${i + 1}/${filmIds.length})…`)
        }
        filmIds = matched
      }

      if (filmIds.length === 0) {
        setError('Nenhum filme encontrado com esses filtros.')
        setLoading(false)
        return
      }

      setLoadingMsg('Criando sessão…')
      const userId = getUserId()
      const code = await createSession({
        hostId: userId,
        hostName: name.trim(),
        settings: { genres, includeWatched, filmIds },
      })

      navigate(`/lobby/${code}`)
    } catch (err) {
      console.error(err)
      setError('Erro ao criar sessão. Tente novamente.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center px-4 py-8 relative">
      <div className="absolute top-4 left-4">
        <button onClick={() => navigate('/')} className="text-gray-500 hover:text-white transition-colors text-sm">
          ← Voltar
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm space-y-6 pt-8"
      >
        <Logo size="md" />

        <h2 className="text-white text-2xl font-bold">Criar sessão</h2>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-12">
            <div className="w-12 h-12 border-4 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
            <p className="text-gray-400 text-sm text-center">{loadingMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-5">
            {/* Name */}
            <div className="space-y-1.5">
              <label className="text-gray-400 text-sm">Seu nome</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como quer ser chamado?"
                maxLength={30}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-amber-400/50 transition-colors"
              />
            </div>

            {/* Include watched */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">Incluir já assistidos</p>
                <p className="text-gray-500 text-xs">Filmes marcados como vistos</p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeWatched((v) => !v)}
                className={`w-12 h-6 rounded-full transition-all relative ${
                  includeWatched ? 'bg-amber-400' : 'bg-white/10'
                }`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                  includeWatched ? 'left-7' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Gêneros</label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => toggleGenre('all')}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    genres.includes('all')
                      ? 'bg-amber-400 text-black'
                      : 'bg-white/5 text-gray-400 hover:bg-white/10'
                  }`}
                >
                  Todos
                </button>
                {ALL_GENRES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGenre(g)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      genres.includes(g) && !genres.includes('all')
                        ? 'bg-amber-400 text-black'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
              {!genres.includes('all') && (
                <p className="text-amber-400/70 text-xs">
                  ⚠️ Filtrar por gênero requer buscar dados de cada filme (pode demorar)
                </p>
              )}
            </div>

            {error && <p className="text-rose-400 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-lg hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20"
            >
              🎬 Criar sessão
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
