import { useState, useMemo } from 'react'
import { Film } from 'lucide-react'

function hashColor(str = '') {
  const h = str.split('').reduce((acc, c) => (Math.imul(31, acc) + c.charCodeAt(0)) | 0, 0)
  return Math.abs(h) % 360
}

export default function FilmPoster({ src, title, imdbId, className = '', imgClassName = '', onError }) {
  const [failed, setFailed] = useState(false)

  const hue = useMemo(() => hashColor(imdbId || title || ''), [imdbId, title])

  const gradient = `linear-gradient(145deg, hsl(${hue},38%,13%), hsl(${(hue + 55) % 360},25%,8%))`

  if (!src || src === 'N/A' || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 overflow-hidden ${className}`}
        style={{ background: gradient }}
      >
        <Film size={28} className="text-white/15" />
        {title && (
          <p className="text-white/25 text-xs text-center px-3 leading-snug line-clamp-3 font-medium">
            {title}
          </p>
        )}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={title}
      className={`${className} ${imgClassName} object-cover`}
      draggable={false}
      onError={() => { setFailed(true); onError?.() }}
    />
  )
}
