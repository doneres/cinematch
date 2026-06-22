import { useNavigate } from 'react-router-dom'

export default function Logo({ size = 'md' }) {
  const navigate = useNavigate()
  const sizes = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' }

  return (
    <button
      onClick={() => navigate('/')}
      className={`font-black tracking-tight ${sizes[size]} active:opacity-70 transition-opacity`}
    >
      <span className="text-white">Cine</span>
      <span className="text-amber-400">Match</span>
      <span className="text-amber-400 ml-1">🎬</span>
    </button>
  )
}
