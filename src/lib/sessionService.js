import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
} from 'firebase/firestore'
import { db } from './firebase'
import { generateSessionCode } from './utils'

export async function createSession({ hostId, hostName, settings }) {
  let code
  let attempts = 0

  // Find a unique code
  while (attempts < 10) {
    const type = Math.random() < 0.5 ? 'word' : 'number'
    code = generateSessionCode(type)
    const snap = await getDoc(doc(db, 'sessions', code))
    if (!snap.exists()) break
    attempts++
  }

  const sessionData = {
    status: 'waiting',
    hostId,
    createdAt: serverTimestamp(),
    settings: {
      genres: settings.genres || ['all'],
      includeWatched: settings.includeWatched ?? false,
    },
    filmIds: settings.filmIds || [],
    participants: {
      [hostId]: {
        name: hostName,
        joinedAt: serverTimestamp(),
        ready: false,
        currentIndex: 0,
      },
    },
    votes: {},
    matchedFilm: null,
  }

  await setDoc(doc(db, 'sessions', code), sessionData)
  return code
}

export async function joinSession({ code, userId, userName }) {
  const ref = doc(db, 'sessions', code)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Sessão não encontrada')

  const session = snap.data()
  if (session.status === 'completed') throw new Error('Sessão já encerrada')

  await updateDoc(ref, {
    [`participants.${userId}`]: {
      name: userName,
      joinedAt: serverTimestamp(),
      ready: false,
      currentIndex: 0,
    },
  })

  return session
}

export async function startSession(code) {
  await updateDoc(doc(db, 'sessions', code), { status: 'active' })
}

export async function recordVote({ code, userId, filmId, liked }) {
  const ref = doc(db, 'sessions', code)

  if (liked) {
    await updateDoc(ref, {
      [`votes.${filmId}.${userId}`]: true,
    })

    // Check for match
    const snap = await getDoc(ref)
    const data = snap.data()
    const participants = Object.keys(data.participants)
    const filmVotes = data.votes?.[filmId] || {}
    const allLiked = participants.every((pid) => filmVotes[pid] === true)

    if (allLiked) {
      await updateDoc(ref, {
        matchedFilm: filmId,
        status: 'completed',
      })
      return { matched: true, filmId }
    }
  } else {
    await updateDoc(ref, {
      [`votes.${filmId}.${userId}`]: false,
    })
  }

  return { matched: false }
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
