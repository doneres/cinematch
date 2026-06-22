const API_KEY = import.meta.env.VITE_OMDB_KEY
const CACHE_KEY = 'cinematch_films_cache'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24h

function loadCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return {}
    const { ts, data } = JSON.parse(raw)
    if (Date.now() - ts > CACHE_TTL) return {}
    return data
  } catch {
    return {}
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), data }))
  } catch {}
}

let memCache = null

function getCache() {
  if (!memCache) memCache = loadCache()
  return memCache
}

function setInCache(id, value) {
  const cache = getCache()
  cache[id] = value
  saveCache(cache)
}

export async function getFilmDetails(imdbId) {
  const cache = getCache()
  if (cache[imdbId]) return cache[imdbId]

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&plot=full&apikey=${API_KEY}`
    )
    const data = await res.json()
    if (data.Response === 'True') {
      setInCache(imdbId, data)
      return data
    }
  } catch {}
  return null
}

// Preloads all films in batches — call once on app boot
export async function preloadAllFilms(filmList, onProgress) {
  const cache = getCache()
  const uncached = filmList.filter((f) => f.id && !cache[f.id])

  for (let i = 0; i < uncached.length; i++) {
    await getFilmDetails(uncached[i].id)
    if (onProgress) onProgress(i + 1, uncached.length)
    if (i < uncached.length - 1) await delay(120)
  }
}

function delay(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

// Fetch the master film list from the friend's site
export async function fetchFilmList() {
  const res = await fetch('https://commitspammer.github.io/films.json')
  return res.json()
}
