import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

const POPCORN = ['🍿', '🌽', '🍿', '🍿', '🌽', '🍿']

function r(min, max) { return min + Math.random() * (max - min) }

function generateKernels(count = 20) {
  return Array.from({ length: count }, (_, i) => {
    const fromLeft = i % 2 === 0
    return {
      id: i,
      startX: fromLeft ? r(-5, 15) : r(85, 105),
      startY: r(70, 100),
      endX: fromLeft ? r(5, 55) : r(45, 95),
      endY: r(-15, 45),
      rotation: r(-400, 400),
      scale: r(0.9, 1.7),
      duration: r(0.55, 1.05),
      delay: r(0, 0.22),
      emoji: POPCORN[i % POPCORN.length],
    }
  })
}

export default function PopcornBurst({ active }) {
  const [visible, setVisible] = useState(false)
  const [kernels, setKernels] = useState([])
  const timerRef = useRef(null)

  useEffect(() => {
    if (!active) return
    setKernels(generateKernels(20))
    setVisible(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setVisible(false), 1200)
    return () => clearTimeout(timerRef.current)
  }, [active])

  return (
    <AnimatePresence>
      {visible && (
        <div
          key={kernels[0]?.id}
          className="fixed inset-0 pointer-events-none z-50 overflow-hidden"
        >
          {kernels.map((k) => (
            <motion.span
              key={k.id}
              initial={{ left: `${k.startX}%`, top: `${k.startY}%`, scale: 0, rotate: 0, opacity: 1 }}
              animate={{
                left: `${k.endX}%`,
                top: `${k.endY}%`,
                scale: k.scale,
                rotate: k.rotation,
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: k.duration,
                delay: k.delay,
                ease: [0.15, 0.8, 0.35, 1],
                opacity: { times: [0, 0.55, 1], duration: k.duration + k.delay },
              }}
              style={{ position: 'absolute', fontSize: 22, lineHeight: 1 }}
            >
              {k.emoji}
            </motion.span>
          ))}
        </div>
      )}
    </AnimatePresence>
  )
}
