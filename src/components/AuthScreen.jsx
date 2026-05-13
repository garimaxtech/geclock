import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin },
    })
    if (error) setError(error.message)
    else setSent(true)
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-8 bg-[#FDF8F6]">
      <div className="text-6xl mb-4">⏱️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">geclock</h1>
      <p className="text-sm text-gray-400 mb-12 text-center">track your time, beautifully</p>

      {sent ? (
        <div className="w-full max-w-xs text-center">
          <div className="text-5xl mb-4">✉️</div>
          <p className="font-bold text-gray-800 mb-1">check your inbox!</p>
          <p className="text-sm text-gray-400">we sent a login link to</p>
          <p className="text-sm font-semibold text-purple-500 mt-1">{email}</p>
          <button onClick={() => setSent(false)} className="mt-8 text-xs text-gray-300 underline underline-offset-2">
            use a different email
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSend()}
            placeholder="your@email.com"
            autoFocus
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 bg-white transition-colors placeholder:text-gray-300 text-center"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            onClick={handleSend}
            disabled={loading || !email.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}
          >
            {loading ? 'sending…' : 'send magic link ✨'}
          </button>
          <p className="text-center text-xs text-gray-300">no password needed · works on all your devices</p>
        </div>
      )}
    </div>
  )
}
