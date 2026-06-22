import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Home, RotateCcw, MessageSquare, Users, CheckCircle2, Loader2 } from 'lucide-react'
import Logo from '../components/Logo'
import StarRating from '../components/StarRating'
import FilmPoster from '../components/FilmPoster'
import { subscribeToSession, submitReview } from '../lib/sessionService'
import { getFilmDetails } from '../lib/omdb'
import { getUserId } from '../lib/utils'

export default function Review() {
  const { code } = useParams()
  const navigate = useNavigate()
  const userId = getUserId()

  const [session, setSession] = useState(null)
  const [omdb, setOmdb] = useState(null)
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    const unsub = subscribeToSession(code, (data) => {
      setSession(data)
      // If already reviewed by this user, mark as submitted
      if (data.reviews?.[userId]) setSubmitted(true)
    })
    return unsub
  }, [code])

  useEffect(() => {
    if (!session?.matchedFilm) return
    getFilmDetails(session.matchedFilm).then(setOmdb)
  }, [session?.matchedFilm])

  async function handleSubmit(e) {
    e.preventDefault()
    if (rating === 0) return
    setSubmitting(true)
    try {
      const myName = session?.participants?.[userId]?.name || 'Anônimo'
      await submitReview(code, userId, {
        rating,
        comment,
        userName: myName,
        matchedFilmId: session?.matchedFilm,
      })
      setSubmitted(true)
    } catch (err) {
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const isFinished = session?.status === 'finished'
  const reviews = Object.values(session?.reviews || {})
  const participants = Object.keys(session?.participants || {})
  const reviewCount = reviews.length
  const pendingCount = participants.length - reviewCount
  const avgRating = reviewCount > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviewCount).toFixed(1)
    : null

  const poster = omdb?.Poster && omdb.Poster !== 'N/A' ? omdb.Poster : null

  if (!session) {
    return (
      <div className="min-h-dvh bg-[#080810] flex items-center justify-center">
        <Loader2 size={28} className="text-amber-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#080810] flex flex-col px-4 py-6">
      <div className="flex items-center justify-between mb-4">
        <Logo size="sm" />
        {isFinished && (
          <span className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 size={13} />Avaliação encerrada
          </span>
        )}
      </div>

      <div className="flex-1 max-w-sm w-full mx-auto space-y-5">
        {/* Film header */}
        <div className="flex gap-3 items-center p-3 rounded-xl bg-[#12121f] border border-white/5">
          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0">
            <FilmPoster
              src={poster}
              title={omdb?.Title}
              imdbId={session.matchedFilm}
              className="w-full h-full"
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{omdb?.Title || '…'}</p>
            {omdb?.Year && <p className="text-gray-500 text-xs">{omdb.Year}</p>}
            {avgRating && (
              <p className="text-amber-400 text-sm font-bold mt-1">
                ★ {avgRating} <span className="text-gray-600 text-xs font-normal">média do grupo</span>
              </p>
            )}
          </div>
        </div>

        {/* Review form — shown if not yet submitted */}
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.form
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              <div className="text-center space-y-1">
                <h2 className="text-white text-xl font-bold">Como foi o filme?</h2>
                <p className="text-gray-500 text-sm">Dê sua nota e deixe um comentário</p>
              </div>

              <div className="flex flex-col items-center py-2">
                <StarRating value={rating} onChange={setRating} size="lg" />
              </div>

              <div className="space-y-1.5">
                <label className="text-gray-400 text-sm flex items-center gap-1.5">
                  <MessageSquare size={13} />Comentário <span className="text-gray-600">(opcional)</span>
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="O que achou? Teve cena favorita? Vale a pena recomendar?"
                  rows={3}
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-sm focus:outline-none focus:border-amber-400/50 transition-colors resize-none"
                />
                <p className="text-gray-700 text-xs text-right">{comment.length}/300</p>
              </div>

              <button
                type="submit"
                disabled={rating === 0 || submitting}
                className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-40 shadow-lg shadow-amber-400/20"
              >
                {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={18} />}
                {submitting ? 'Enviando…' : 'Enviar avaliação'}
              </button>

              {rating === 0 && (
                <p className="text-gray-600 text-xs text-center">Selecione ao menos meia estrela para enviar</p>
              )}
            </motion.form>
          ) : (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-3 py-4"
            >
              <CheckCircle2 size={40} className="text-emerald-400 mx-auto" />
              <div>
                <p className="text-white font-bold">Avaliação enviada!</p>
                {!isFinished && pendingCount > 0 && (
                  <p className="text-gray-500 text-sm mt-1">
                    Aguardando {pendingCount} pessoa{pendingCount !== 1 ? 's' : ''}…
                  </p>
                )}
              </div>
              {!isFinished && (
                <div className="flex items-center justify-center gap-1.5 text-amber-400 text-sm">
                  <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse inline-block" />
                  {reviewCount}/{participants.length} avaliações recebidas
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Results — shown when all reviewed */}
        {isFinished && reviews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Users size={16} className="text-amber-400" />
                Avaliações do grupo
              </h3>
              <span className="text-amber-400 font-black text-xl">★ {avgRating}</span>
            </div>

            {reviews
              .sort((a, b) => b.rating - a.rating)
              .map((r, i) => (
                <ReviewCard key={i} review={r} />
              ))}

            {/* Watch date */}
            {session.watchSession?.startedAt && (
              <p className="text-gray-600 text-xs text-center pt-2">
                Assistido em{' '}
                {new Date(
                  session.watchSession.startedAt.toDate?.() ?? session.watchSession.startedAt
                ).toLocaleDateString('pt-BR', {
                  day: '2-digit', month: 'long', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold flex items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all"
              >
                <Home size={16} />Início
              </button>
              <button
                onClick={() => navigate('/create')}
                className="flex-1 py-3.5 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-95 transition-all"
              >
                <RotateCcw size={16} />Nova sessão
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  )
}

function ReviewCard({ review }) {
  const stars = Math.floor(review.rating / 2)
  const half = review.rating % 2 !== 0

  return (
    <div className="px-4 py-3 rounded-xl bg-[#12121f] border border-white/5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-amber-400/15 border border-amber-400/25 flex items-center justify-center text-amber-400 font-bold text-xs">
            {review.userName?.[0]?.toUpperCase() || '?'}
          </div>
          <span className="text-white text-sm font-medium">{review.userName}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-amber-400 font-bold text-sm">{review.rating.toFixed(1)}</span>
          <span className="text-gray-600 text-xs">/10</span>
        </div>
      </div>

      {/* Mini star display */}
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((i) => {
          const starsVal = review.rating / 2
          const state = starsVal >= i ? 'full' : starsVal >= i - 0.5 ? 'half' : 'empty'
          return (
            <span key={i} className={`text-base ${state === 'empty' ? 'text-gray-700' : 'text-amber-400'}`}>
              {state === 'half' ? '½' : '★'}
            </span>
          )
        })}
      </div>

      {review.comment && (
        <p className="text-gray-300 text-sm leading-relaxed">{review.comment}</p>
      )}

      {review.submittedAt && (
        <p className="text-gray-600 text-xs">
          {new Date(review.submittedAt.toDate?.() ?? review.submittedAt).toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
          })}
        </p>
      )}
    </div>
  )
}
