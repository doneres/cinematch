import { useState, useEffect } from 'react'
import { Lock, KeyRound, Eye, EyeOff, Shield, Loader2 } from 'lucide-react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'

const SESSION_KEY = 'cinematch_fm_unlocked'
const CONFIG_DOC = 'filmManager'

export default function FilmManagerLock({ onUnlock }) {
  const [mode, setMode] = useState('loading') // 'loading' | 'setup' | 'lock'
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Already unlocked this session?
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      onUnlock()
      return
    }
    // Check if PIN is configured
    getDoc(doc(db, 'config', CONFIG_DOC)).then((snap) => {
      setMode(snap.exists() ? 'lock' : 'setup')
    })
  }, [])

  async function handleSetup(e) {
    e.preventDefault()
    if (pin.length < 4) { setError('PIN deve ter ao menos 4 caracteres'); return }
    if (pin !== confirmPin) { setError('Os PINs não coincidem'); return }
    setSaving(true)
    try {
      await setDoc(doc(db, 'config', CONFIG_DOC), { pin })
      sessionStorage.setItem(SESSION_KEY, 'true')
      onUnlock()
    } catch {
      setError('Erro ao salvar. Verifique as regras do Firestore.')
      setSaving(false)
    }
  }

  async function handleUnlock(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const snap = await getDoc(doc(db, 'config', CONFIG_DOC))
      if (!snap.exists()) { setError('Configuração não encontrada'); setSaving(false); return }
      if (snap.data().pin !== pin) {
        setError('PIN incorreto')
        setPin('')
        setSaving(false)
        return
      }
      sessionStorage.setItem(SESSION_KEY, 'true')
      onUnlock()
    } catch {
      setError('Erro ao verificar. Tente novamente.')
      setSaving(false)
    }
  }

  if (mode === 'loading') {
    return (
      <div className="min-h-dvh bg-[#080810] flex items-center justify-center">
        <Loader2 size={28} className="text-amber-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-[#080810] flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-xs space-y-6">
        {/* Icon */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl bg-amber-400/10 border border-amber-400/20 flex items-center justify-center">
            {mode === 'setup' ? <Shield size={28} className="text-amber-400" /> : <Lock size={28} className="text-amber-400" />}
          </div>
          <div className="text-center">
            <h2 className="text-white text-xl font-bold">
              {mode === 'setup' ? 'Configurar acesso' : 'Área restrita'}
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {mode === 'setup'
                ? 'Crie um PIN para proteger o gerenciador de filmes'
                : 'Digite o PIN para acessar o gerenciador de filmes'}
            </p>
          </div>
        </div>

        {mode === 'setup' ? (
          <form onSubmit={handleSetup} className="space-y-3">
            <PinInput value={pin} onChange={setPin} show={show} placeholder="Criar PIN" />
            <PinInput value={confirmPin} onChange={setConfirmPin} show={show} placeholder="Confirmar PIN" />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-300 transition-colors"
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
              {show ? 'Ocultar' : 'Mostrar'} PIN
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
              {saving ? 'Salvando…' : 'Criar PIN'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleUnlock} className="space-y-3">
            <PinInput value={pin} onChange={setPin} show={show} placeholder="Digite o PIN" autoFocus />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="flex items-center gap-1.5 text-gray-500 text-xs hover:text-gray-300 transition-colors"
            >
              {show ? <EyeOff size={13} /> : <Eye size={13} />}
              {show ? 'Ocultar' : 'Mostrar'} PIN
            </button>
            {error && <p className="text-rose-400 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={saving}
              className="w-full py-3.5 rounded-2xl bg-amber-400 text-black font-bold flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={18} className="animate-spin" /> : <Lock size={18} />}
              {saving ? 'Verificando…' : 'Desbloquear'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function PinInput({ value, onChange, show, placeholder, autoFocus }) {
  return (
    <input
      type={show ? 'text' : 'password'}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      autoFocus={autoFocus}
      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-gray-600 text-center text-lg font-mono tracking-widest focus:outline-none focus:border-amber-400/50 transition-colors"
    />
  )
}
