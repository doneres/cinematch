import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ChevronLeft, Search, Plus, Eye, EyeOff, Trash2, Film,
  Check, X, Loader2, Star,
} from 'lucide-react'
import Logo from '../components/Logo'
import FilmDetailModal from '../components/FilmDetailModal'
import { fetchFilmList, searchFilms, getFilmDetails } from '../lib/omdb'
import { subscribeToFilmMeta, setWatched, addCustomFilm, removeCustomFilm } from '../lib/filmStore'

const FILTERS = ['todos', 'assistidos', 'não assistidos']

export default function FilmManager() {
  const navigate = useNavigate()
  const [baseFilms, setBaseFilms] = useState([])   // from JSON
  const [filmMeta, setFilmMeta] = useState({})      // from Firestore
  const [omdbCache, setOmdbCache] = useState({})
  const [filter, setFilter] = useState('todos')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  // Add film UI
  const [showAdd, setShowAdd] = useState(false)
  const [addQuery, setAddQuery] = useState('')
  const [addResults, setAddResults] = useState([])
  const [addLoading, setAddLoading] = useState(false)

  // Detail modal
  const [detailFilm, setDetailFilm] = useState(null)

  // Load base JSON once
  useEffect(() => {
    fetchFilmList().then((list) => {
      setBaseFilms(list.filter((f) => f.id))
      setLoading(false)
    })
  }, [])

  // Real-time Firestore meta
  useEffect(() => {
    return subscribeToFilmMeta(setFilmMeta)
  }, [])

  // Build merged film list
  const allFilms = [
    ...baseFilms.map((f) => ({
      ...f,
      watched: filmMeta[f.id]?.watched ?? f.watched ?? false,
      custom: false,
    })),
    ...Object.entries(filmMeta)
      .filter(([, m]) => m.custom)
      .filter(([id]) => !baseFilms.some((f) => f.id === id))
      .map(([id, m]) => ({
        id,
        name: m.name || id,
        watched: m.watched ?? false,
        rating: 0,
        custom: true,
      })),
  ]

  const filtered = allFilms.filter((f) => {
    const matchFilter =
      filter === 'todos' ||
      (filter === 'assistidos' && f.watched) ||
      (filter === 'não assistidos' && !f.watched)
    const matchSearch = !search || f.name.toLowerCase().includes(search.toLowerCase())
    return matchFilter && matchSearch
  })

  // Lazy-load OMDB data for visible films
  useEffect(() => {
    filtered.slice(0, 20).forEach(async (f) => {
      if (!omdbCache[f.id]) {
        const data = await getFilmDetails(f.id)
        if (data) setOmdbCache((prev) => ({ ...prev, [f.id]: data }))
      }
    })
  }, [filtered.length, filter, search])

  async function toggleWatched(film) {
    await setWatched(film.id, !film.watched)
  }

  async function handleRemoveCustom(id) {
    await removeCustomFilm(id)
  }

  // OMDB search for add
  useEffect(() => {
    if (!addQuery || addQuery.length < 2) { setAddResults([]); return }
    const t = setTimeout(async () => {
      setAddLoading(true)
      const results = await searchFilms(addQuery)
      setAddResults(results)
      setAddLoading(false)
    }, 400)
    return () => clearTimeout(t)
  }, [addQuery])

  async function handleAddFilm(result) {
    await addCustomFilm({ id: result.imdbID, name: result.Title })
    setShowAdd(false)
    setAddQuery('')
    setAddResults([])
  }

  const watchedCount = allFilms.filter((f) => f.watched).length

  return (
    <div className="min-h-dvh bg-[#080810] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <Logo size="sm" />
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 text-sm text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-xl hover:bg-amber-400/10 transition-colors"
        >
          <Plus size={15} />
          Adicionar
        </button>
      </div>

      {/* Stats */}
      <div className="flex gap-3 px-4 py-3 border-b border-white/5 shrink-0">
        <StatBadge label="Total" value={allFilms.length} />
        <StatBadge label="Assistidos" value={watchedCount} color="emerald" />
        <StatBadge label="Para ver" value={allFilms.length - watchedCount} color="amber" />
      </div>

      {/* Search */}
      <div className="px-4 pt-3 pb-2 shrink-0">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar filme…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/8 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-400/40 transition-colors"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 px-4 pb-3 shrink-0">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all ${
              filter === f ? 'bg-amber-400 text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'
            }`}
          >
            {f}
          </button>
        ))}
        <span className="ml-auto text-gray-600 text-xs self-center">{filtered.length} filmes</span>
      </div>

      {/* Film list */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 space-y-2">
        {loading && (
          <div className="flex justify-center pt-12">
            <Loader2 size={24} className="text-amber-400 animate-spin" />
          </div>
        )}

        <AnimatePresence>
          {filtered.map((film) => {
            const omdb = omdbCache[film.id]
            const poster = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : null
            const genre = omdb?.Genre?.split(', ').slice(0, 2).join(', ')
            const year = omdb?.Year && omdb.Year !== 'N/A' ? omdb.Year : null
            const runtime = omdb?.Runtime && omdb.Runtime !== 'N/A' ? omdb.Runtime : null

            return (
              <motion.div
                key={film.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  film.watched
                    ? 'bg-white/3 border-white/5 opacity-60'
                    : 'bg-[#12121f] border-white/5'
                }`}
              >
                {/* Poster */}
                <button
                  onClick={() => omdb && setDetailFilm({ omdb })}
                  className="w-12 h-16 rounded-lg overflow-hidden bg-white/5 shrink-0 relative"
                >
                  {poster ? (
                    <img src={poster} alt={film.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Film size={18} className="text-gray-600" />
                    </div>
                  )}
                  {film.watched && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Check size={16} className="text-emerald-400" />
                    </div>
                  )}
                </button>

                {/* Info */}
                <button
                  className="flex-1 text-left min-w-0"
                  onClick={() => omdb && setDetailFilm({ omdb })}
                >
                  <p className="text-white text-sm font-medium truncate">{omdb?.Title || film.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    {year && <span className="text-gray-500 text-xs">{year}</span>}
                    {runtime && <span className="text-gray-600 text-xs">· {runtime}</span>}
                    {genre && <span className="text-gray-600 text-xs">· {genre}</span>}
                  </div>
                  {omdb?.imdbRating && omdb.imdbRating !== 'N/A' && (
                    <span className="flex items-center gap-1 text-amber-400 text-xs mt-0.5">
                      <Star size={10} fill="currentColor" />
                      {omdb.imdbRating}
                    </span>
                  )}
                </button>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => toggleWatched(film)}
                    title={film.watched ? 'Marcar como não assistido' : 'Marcar como assistido'}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      film.watched
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-white/5 text-gray-500 hover:text-emerald-400 hover:bg-emerald-500/10'
                    }`}
                  >
                    {film.watched ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  {film.custom && (
                    <button
                      onClick={() => handleRemoveCustom(film.id)}
                      className="w-8 h-8 rounded-full flex items-center justify-center text-gray-600 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center gap-2 pt-16 text-gray-600">
            <Film size={36} />
            <p className="text-sm">Nenhum filme encontrado</p>
          </div>
        )}
      </div>

      {/* Add film bottom sheet */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end"
            onClick={() => setShowAdd(false)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full bg-[#10101c] rounded-t-3xl p-5 space-y-4 max-h-[80dvh] flex flex-col"
            >
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-white font-bold text-lg">Adicionar filme</h3>
                <button onClick={() => setShowAdd(false)} className="text-gray-500 hover:text-white">
                  <X size={20} />
                </button>
              </div>

              <div className="relative shrink-0">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  autoFocus
                  type="text"
                  value={addQuery}
                  onChange={(e) => setAddQuery(e.target.value)}
                  placeholder="Buscar por título…"
                  className="w-full pl-9 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-400/40 transition-colors"
                />
                {addLoading && (
                  <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 animate-spin" />
                )}
              </div>

              <div className="overflow-y-auto flex-1 space-y-2">
                {addResults.map((r) => (
                  <button
                    key={r.imdbID}
                    onClick={() => handleAddFilm(r)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                  >
                    {r.Poster && r.Poster !== 'N/A' ? (
                      <img src={r.Poster} alt={r.Title} className="w-10 h-14 rounded-lg object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-14 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                        <Film size={16} className="text-gray-600" />
                      </div>
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">{r.Title}</p>
                      <p className="text-gray-500 text-xs">{r.Year} · {r.Type}</p>
                    </div>
                    <Plus size={16} className="text-amber-400 ml-auto shrink-0" />
                  </button>
                ))}

                {addQuery.length >= 2 && !addLoading && addResults.length === 0 && (
                  <p className="text-gray-600 text-sm text-center py-8">Nenhum resultado para "{addQuery}"</p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      {detailFilm && (
        <FilmDetailModal
          omdbData={detailFilm.omdb}
          onClose={() => setDetailFilm(null)}
        />
      )}
    </div>
  )
}

function StatBadge({ label, value, color = 'default' }) {
  const colors = {
    default: 'bg-white/5 text-gray-300',
    emerald: 'bg-emerald-500/10 text-emerald-400',
    amber: 'bg-amber-400/10 text-amber-400',
  }
  return (
    <div className={`flex flex-col items-center px-3 py-2 rounded-xl ${colors[color]}`}>
      <span className="text-lg font-bold">{value}</span>
      <span className="text-xs opacity-70">{label}</span>
    </div>
  )
}
