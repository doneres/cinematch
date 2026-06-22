import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Ticket, Loader2 } from 'lucide-react'
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
      await joinSession({ code: code.trim().toUpperCase(), userId: getUserId(), userName: name.trim() })
      navigate(`/lobby/${code.trim().toUpperCase()}`)
    } catch (err) {
      setError(err.message || 'Erro ao entrar na sessão')
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
        <h2 className="text-white text-2xl font-bold mb-6">Entrar na sessão</h2>

        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-gray-400 text-sm">Código da sessão</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="WOLF ou 2847"
              maxLength={10}
              className="w-full px-4 py-4 rounded-xl bg-white/5 border border-white/10 text-white text-center text-2xl font-mono font-black tracking-[0.3em] focus:outline-none focus:border-amber-400/50 transition-colors uppercase placeholder:text-gray-700 placeholder:text-base placeholder:tracking-normal placeholder:font-normal"
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
            className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-base flex items-center justify-center gap-2.5 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50 shadow-lg shadow-amber-400/20"
          >
            {loading ? <Loader2 size={20} className="animate-spin" /> : <Ticket size={20} />}
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
