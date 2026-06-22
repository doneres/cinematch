import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore'
import { setWatched } from './filmStore'
import { db } from './firebase'
import { generateSessionCode } from './utils'

export async function createSession({ hostId, hostName, settings }) {
  let code
  let attempts = 0

  while (attempts < 10) {
    const type = Math.random() < 0.5 ? 'word' : 'number'
    code = generateSessionCode(type)
    const snap = await getDoc(doc(db, 'sessions', code))
    if (!snap.exists()) break
    attempts++
  }

  await setDoc(doc(db, 'sessions', code), {
    status: 'waiting',
    hostId,
    createdAt: serverTimestamp(),
    settings: {
      genres: settings.genres || ['all'],
      includeWatched: settings.includeWatched ?? false,
    },
    filmIds: settings.filmIds || [],
    participants: {
      [hostId]: { name: hostName, joinedAt: serverTimestamp(), ready: false },
    },
    votes: {},
    matchedFilm: null,
    watchSession: null,
    reviews: {},
  })

  return code
}

export async function joinSession({ code, userId, userName }) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Sessão não encontrada')

  const session = snap.data()
  const blocked = ['finished']
  if (blocked.includes(session.status)) throw new Error('Sessão já encerrada')

  await updateDoc(ref, {
    [`participants.${userId}`]: {
      name: userName,
      joinedAt: serverTimestamp(),
      ready: false,
    },
  })

  return session
}

export async function startSession(code) {
  const snap = await getDoc(doc(db, 'sessions', code))
  if (!snap.exists()) throw new Error('Sessão não encontrada')
  if (snap.data().status !== 'waiting') throw new Error('Sessão já iniciada')
  await updateDoc(doc(db, 'sessions', code), { status: 'active' })
}

export async function recordVote({ code, userId, filmId, liked }) {
  const ref = doc(db, 'sessions', code)

  await updateDoc(ref, { [`votes.${filmId}.${userId}`]: liked })

  if (!liked) return { matched: false }

  const snap = await getDoc(ref)
  const data = snap.data()
  if (data.status !== 'active') return { matched: false }

  const participants = Object.keys(data.participants)
  const filmVotes = data.votes?.[filmId] || {}
  // Re-apply current vote since Firestore may not have flushed yet
  filmVotes[userId] = true
  const allLiked = participants.every((pid) => filmVotes[pid] === true)

  if (allLiked) {
    await updateDoc(ref, { matchedFilm: filmId, status: 'completed' })
    return { matched: true, filmId }
  }

  return { matched: false }
}

// Parse "1h 42min" or "102 min" → minutes
function parseRuntimeMinutes(runtimeStr = '') {
  const hours = parseInt(runtimeStr.match(/(\d+)\s*h/)?.[1] || '0')
  const mins = parseInt(runtimeStr.match(/(\d+)\s*min/)?.[1] || '0')
  return hours * 60 + mins || 120 // default 2h if unparseable
}

export async function startWatching(code, runtimeStr) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists() || snap.data().status !== 'completed') throw new Error('Sessão inválida')

  const runtimeMinutes = parseRuntimeMinutes(runtimeStr)
  const startedAt = new Date()
  const endAt = new Date(startedAt.getTime() + runtimeMinutes * 60 * 1000)

  await updateDoc(ref, {
    status: 'watching',
    watchSession: {
      startedAt: serverTimestamp(),
      endAt: Timestamp.fromDate(endAt),
      runtimeMinutes,
    },
  })
}

export async function openReview(code) {
  await updateDoc(doc(db, 'sessions', code), { status: 'reviewing' })
}

export async function submitReview(code, userId, { rating, comment, userName, matchedFilmId }) {
  const ref = doc(db, 'sessions', code)

  await updateDoc(ref, {
    [`reviews.${userId}`]: {
      rating,
      comment: comment.trim(),
      submittedAt: serverTimestamp(),
      userName,
    },
  })

  // Check if all participants have reviewed
  const snap = await getDoc(ref)
  const data = snap.data()
  const participants = Object.keys(data.participants)
  const reviews = data.reviews || {}
  // Include the review we just submitted
  reviews[userId] = { rating }
  const allReviewed = participants.every((pid) => reviews[pid] != null)

  if (allReviewed) {
    await updateDoc(ref, { status: 'finished' })
    if (matchedFilmId) {
      await setWatched(matchedFilmId, true).catch(() => {})
    }
  }
}

export function subscribeToSession(code, callback) {
  return onSnapshot(doc(db, 'sessions', code), (snap) => {
    if (snap.exists()) callback({ id: snap.id, ...snap.data() })
  })
}

export async function getSession(code) {
  const snap = await getDoc(doc(db, 'sessions', code))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}
