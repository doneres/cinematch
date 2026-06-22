import { motion, AnimatePresence } from 'framer-motion'

export default function ParticipantList({ participants = {}, hostId }) {
  const list = Object.entries(participants)

  return (
    <div className="w-full max-w-sm space-y-2">
      <p className="text-gray-400 text-xs uppercase tracking-widest text-center mb-3">
        Participantes ({list.length})
      </p>
      <AnimatePresence>
        {list.map(([uid, p]) => (
          <motion.div
            key={uid}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl bg-white/5 border border-white/5"
          >
            <div className="w-8 h-8 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center justify-center text-amber-400 font-bold text-sm">
              {p.name?.[0]?.toUpperCase() || '?'}
            </div>
            <span className="text-white text-sm font-medium flex-1">{p.name}</span>
            {uid === hostId && (
              <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                anfitrião
              </span>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
