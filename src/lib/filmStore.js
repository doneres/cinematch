import {
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  collection,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from './firebase'

// filmMeta/{imdbId} = { watched, custom, name, addedAt }
// For JSON-source films: only `watched` is stored (override)
// For custom films: watched + name + custom:true

export function subscribeToFilmMeta(callback) {
  return onSnapshot(collection(db, 'filmMeta'), (snap) => {
    const meta = {}
    snap.forEach((d) => { meta[d.id] = d.data() })
    callback(meta)
  })
}

export async function getFilmMeta() {
  const snap = await getDocs(collection(db, 'filmMeta'))
  const meta = {}
  snap.forEach((d) => { meta[d.id] = d.data() })
  return meta
}

export async function setWatched(imdbId, watched) {
  const ref = doc(db, 'filmMeta', imdbId)
  await setDoc(ref, { watched }, { merge: true })
}

export async function addCustomFilm({ id, name }) {
  const ref = doc(db, 'filmMeta', id)
  await setDoc(ref, {
    custom: true,
    name,
    watched: false,
    addedAt: serverTimestamp(),
  }, { merge: true })
}

export async function removeCustomFilm(imdbId) {
  await deleteDoc(doc(db, 'filmMeta', imdbId))
}
