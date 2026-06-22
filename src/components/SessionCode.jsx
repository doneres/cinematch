import { useState } from 'react'
import { Copy, Share2, Check, Link } from 'lucide-react'
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
    await navigator.clipboard.writeText(buildShareUrl(code))
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
    <div className="flex flex-col items-center gap-3 w-full">
      <p className="text-gray-500 text-xs uppercase tracking-widest">Código da sessão</p>

      <button
        onClick={copyCode}
        className="group relative px-8 py-4 rounded-2xl bg-[#1a1a2e] border-2 border-amber-400/30 hover:border-amber-400/60 transition-all w-full flex flex-col items-center"
      >
        <span className="text-4xl font-black tracking-[0.2em] text-amber-400 font-mono">
          {code}
        </span>
        <span className="text-gray-600 text-xs mt-1 flex items-center gap-1">
          {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
          {copied ? 'Copiado!' : 'Toque para copiar'}
        </span>
      </button>

      <div className="flex gap-2 w-full">
        <button
          onClick={copyLink}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
        >
          {copiedLink ? <Check size={14} className="text-emerald-400" /> : <Link size={14} />}
          {copiedLink ? 'Copiado!' : 'Copiar link'}
        </button>
        <button
          onClick={shareLink}
          className="flex-1 flex items-center justify-center gap-1.5 text-sm text-gray-400 hover:text-white py-2.5 rounded-xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
        >
          <Share2 size={14} />
          Compartilhar
        </button>
      </div>
    </div>
  )
}
