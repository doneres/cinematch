import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import Logo from '../components/Logo'

export default function Home() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-[#080810] flex flex-col items-center justify-center px-4 relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-purple-800/5 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col items-center gap-8 z-10 w-full max-w-sm"
      >
        <div className="flex flex-col items-center gap-2">
          <Logo size="lg" />
          <p className="text-gray-500 text-sm text-center">
            Escolha o próximo filme com seus amigos
          </p>
        </div>

        {/* Film reel decoration */}
        <div className="flex items-center gap-1 opacity-20">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="w-6 h-8 border border-gray-500 rounded-sm flex items-center justify-center"
            >
              <div className="w-3 h-4 bg-gray-600 rounded-xs" />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full">
          <button
            onClick={() => navigate('/create')}
            className="w-full py-4 rounded-2xl bg-amber-400 text-black font-bold text-lg hover:bg-amber-300 active:scale-95 transition-all shadow-lg shadow-amber-400/20"
          >
            🎬 Criar sessão
          </button>
          <button
            onClick={() => navigate('/join')}
            className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold text-lg hover:bg-white/10 active:scale-95 transition-all"
          >
            🎟️ Entrar em sessão
          </button>
        </div>

        <p className="text-gray-600 text-xs text-center">
          Swipe para curtir · Swipe para passar · Match = próximo filme!
        </p>
      </motion.div>
    </div>
  )
}
