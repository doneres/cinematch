import { useState } from 'react'

// value: 0–10 in 0.5 steps, displayed as 5 stars
// Each full star = 2 pts, half star = 1 pt
export default function StarRating({ value = 0, onChange, readonly = false, size = 'md' }) {
  const [hover, setHover] = useState(null)
  const display = hover ?? value // 0–10

  const starSizes = { sm: 24, md: 36, lg: 44 }
  const px = starSizes[size] || 36

  function getState(starIdx) {
    // starIdx 1–5; each star covers 2 pts
    const threshold = starIdx * 2
    if (display >= threshold) return 'full'
    if (display >= threshold - 1) return 'half'
    return 'empty'
  }

  function handleMouseMove(e, starIdx) {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = e.clientX - rect.left < rect.width / 2
    setHover(isLeft ? starIdx * 2 - 1 : starIdx * 2)
  }

  function handleClick(e, starIdx) {
    if (readonly) return
    const rect = e.currentTarget.getBoundingClientRect()
    const isLeft = e.clientX - rect.left < rect.width / 2
    onChange?.(isLeft ? starIdx * 2 - 1 : starIdx * 2)
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="flex gap-1"
        onMouseLeave={() => !readonly && setHover(null)}
      >
        {[1, 2, 3, 4, 5].map((i) => {
          const state = getState(i)
          return (
            <div
              key={i}
              style={{ width: px, height: px, cursor: readonly ? 'default' : 'pointer' }}
              onMouseMove={(e) => handleMouseMove(e, i)}
              onClick={(e) => handleClick(e, i)}
            >
              <StarSVG state={state} size={px} />
            </div>
          )
        })}
      </div>
      <div className="text-amber-400 font-bold text-xl tabular-nums">
        {value > 0 ? value.toFixed(1) : '—'}
        <span className="text-gray-600 text-sm font-normal"> / 10</span>
      </div>
    </div>
  )
}

function StarSVG({ state, size }) {
  const filled = '#f5c518'
  const empty = '#2a2a3a'
  const id = `half-${Math.random().toString(36).slice(2)}`

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {state === 'half' && (
        <defs>
          <linearGradient id={id} x1="0" x2="1" y1="0" y2="0">
            <stop offset="50%" stopColor={filled} />
            <stop offset="50%" stopColor={empty} />
          </linearGradient>
        </defs>
      )}
      <path
        d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
        fill={
          state === 'full' ? filled
          : state === 'half' ? `url(#${id})`
          : empty
        }
        stroke={state !== 'empty' ? filled : '#3a3a4a'}
        strokeWidth="1"
      />
    </svg>
  )
}
