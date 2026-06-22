import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo'
import { joinSession } from '../lib/sessionService'
import { getUserId } from '../lib/utils'

export default function JoinSession() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams()
  const [code, setCode] = useState(urlCode || '')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) { setError('Digite o código da sessão'); return }
    if (!name.trim()) { setError('Digite seu nome'); return }
    setError('')
    setLoading(true)

    try {
      const userId = getUserId()
      await joinSession({ code: code.trim().toUpperCase(), userId, userName: name.trim() })
      navigate(`/lobby/${code.trim().toUpperCase()}`)
    } catch (err) {
      setError(err.message || 'Erro ao entrar na sessão')
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
        <h2 className="text-white text-2xl font-bold">Entrar na sessão</h2>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-gray-400 text-sm">Código da sessão</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="Ex: WOLF ou 2847"
              maxLength={10}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-center text-2xl font-mono font-bold tracking-widest focus:outline-none focus:border-amber-400/50 transition-colors uppercase"
            />
          </div>

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

          {error && <p className="text-rose-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-lg hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
          >
            {loading ? 'Entrando…' : '🎟️ Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
