const WORDS = [
  'WOLF', 'NOVA', 'STAR', 'MOON', 'FIRE', 'RAIN', 'JADE', 'BOLT',
  'MIST', 'APEX', 'FLUX', 'GLOW', 'HAZE', 'IRIS', 'JOLT', 'KEEN',
  'LARK', 'MAZE', 'NEON', 'OPAL', 'PINE', 'QUIZ', 'REEF', 'SAGE',
  'TIDE', 'URGE', 'VALE', 'WAVE', 'AXES', 'YELL', 'ZEAL', 'ARCH',
  'BLAZE', 'CROW', 'DUSK', 'ECHO', 'FERN', 'GUST', 'HALO', 'ICON',
]

export function getUserId() {
  let id = localStorage.getItem('cinematch_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('cinematch_user_id', id)
  }
  return id
}

export function generateSessionCode(type = 'word') {
  if (type === 'number') {
    return String(Math.floor(1000 + Math.random() * 9000))
  }
  return WORDS[Math.floor(Math.random() * WORDS.length)]
}

// Seeded shuffle so each participant sees films in a different order
export function seededShuffle(array, seed) {
  let rng = hashSeed(seed)
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    rng = (rng * 1664525 + 1013904223) >>> 0
    const j = rng % (i + 1)
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function hashSeed(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function buildShareUrl(code) {
  const base = window.location.origin + window.location.pathname
  return `${base}#/join/${code}`
}
