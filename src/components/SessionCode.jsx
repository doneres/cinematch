import { useState } from 'react'
import { buildShareUrl } from '../lib/utils'

export default function SessionCode({ code }) {
  const [copied, setCopied] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  async function copyCode() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function copyLink() {
    const url = buildShareUrl(code)
    await navigator.clipboard.writeText(url)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2000)
  }

  async function shareLink() {
    const url = buildShareUrl(code)
    if (navigator.share) {
      await navigator.share({ title: 'CineMatch — Entre na sessão!', url })
    } else {
      copyLink()
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-gray-400 text-sm uppercase tracking-widest">Código da sessão</p>

      <button
        onClick={copyCode}
        className="group relative px-8 py-4 rounded-2xl bg-[#1a1a2e] border-2 border-amber-400/30 hover:border-amber-400/60 transition-all"
      >
        <span className="text-4xl font-black tracking-[0.2em] text-amber-400 font-mono">
          {code}
        </span>
        <span className="absolute -top-2 -right-2 text-xs bg-amber-400 text-black px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
          {copied ? 'Copiado!' : 'Copiar'}
        </span>
      </button>

      <div className="flex gap-2 mt-1">
        <button
          onClick={copyLink}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          🔗 {copiedLink ? 'Link copiado!' : 'Copiar link'}
        </button>
        <button
          onClick={shareLink}
          className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-white px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-all"
        >
          📤 Compartilhar
        </button>
      </div>
    </div>
  )
}
