export default function Logo({ size = 'md' }) {
  const sizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  return (
    <div className={`font-black tracking-tight ${sizes[size]}`}>
      <span className="text-white">Cine</span>
      <span className="text-amber-400">Match</span>
      <span className="text-amber-400 ml-1">🎬</span>
    </div>
  )
}
