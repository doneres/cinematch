import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Clapperboard, Loader2, AlertTriangle } from 'lucide-react'
import Logo from '../components/Logo'
import { fetchFilmList, getFilmDetails } from '../lib/omdb'
import { getFilmMeta } from '../lib/filmStore'
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
    if (g === 'all') { setGenres(['all']); return }
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
      const [filmList, filmMeta] = await Promise.all([fetchFilmList(), getFilmMeta()])

      // Merge watched overrides from Firestore
      let films = filmList
        .filter((f) => f.id)
        .map((f) => ({
          ...f,
          watched: filmMeta[f.id]?.watched ?? f.watched ?? false,
        }))

      // Add custom films
      const customFilms = Object.entries(filmMeta)
        .filter(([id, m]) => m.custom && !films.some((f) => f.id === id))
        .map(([id, m]) => ({ id, name: m.name, watched: m.watched ?? false }))
      films = [...films, ...customFilms]

      // Filter watched
      if (!includeWatched) films = films.filter((f) => !f.watched)

      let filmIds = films.map((f) => f.id)

      // Genre filter
      if (!genres.includes('all')) {
        setLoadingMsg(`Filtrando por gênero (0/${filmIds.length})…`)
        const matched = []
        for (let i = 0; i < filmIds.length; i++) {
          const details = await getFilmDetails(filmIds[i])
          if (details?.Genre) {
            const filmGenres = details.Genre.split(', ')
            if (genres.some((g) => filmGenres.includes(g))) matched.push(filmIds[i])
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
      const code = await createSession({
        hostId: getUserId(),
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
    <div className="flex-1 flex flex-col px-4 py-6 overflow-y-auto">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
        >
          <ChevronLeft size={18} />
        </button>
        <Logo size="sm" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 max-w-sm w-full mx-auto"
      >
        <h2 className="text-white text-2xl font-bold mb-6">Criar sessão</h2>

        {loading ? (
          <div className="flex flex-col items-center gap-4 py-16">
            <Loader2 size={36} className="text-amber-400 animate-spin" />
            <p className="text-gray-400 text-sm text-center">{loadingMsg}</p>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-5">
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

            {/* Watched toggle */}
            <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/10">
              <div>
                <p className="text-white text-sm font-medium">Incluir já assistidos</p>
                <p className="text-gray-500 text-xs">Filmes marcados como vistos</p>
              </div>
              <button
                type="button"
                onClick={() => setIncludeWatched((v) => !v)}
                className={`w-11 h-6 rounded-full transition-all relative shrink-0 ${includeWatched ? 'bg-amber-400' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${includeWatched ? 'left-6' : 'left-1'}`} />
              </button>
            </div>

            {/* Genres */}
            <div className="space-y-2">
              <label className="text-gray-400 text-sm">Gêneros</label>
              <div className="flex flex-wrap gap-2">
                <GenreChip label="Todos" active={genres.includes('all')} onClick={() => toggleGenre('all')} />
                {ALL_GENRES.map((g) => (
                  <GenreChip
                    key={g}
                    label={g}
                    active={genres.includes(g) && !genres.includes('all')}
                    onClick={() => toggleGenre(g)}
                  />
                ))}
              </div>
              {!genres.includes('all') && (
                <div className="flex items-start gap-1.5 text-amber-400/80 text-xs">
                  <AlertTriangle size={12} className="mt-0.5 shrink-0" />
                  Filtrar por gênero busca dados de cada filme e pode demorar alguns segundos
                </div>
              )}
            </div>

            {error && <p className="text-rose-400 text-sm">{error}</p>}

            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20"
            >
              <Clapperboard size={20} />
              Criar sessão
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

function GenreChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
        active ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
      }`}
    >
      {label}
    </button>
  )
}
