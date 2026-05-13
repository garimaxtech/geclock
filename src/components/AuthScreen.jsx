import { useState } from 'react'
import { supabase } from '../lib/supabase'

export default function AuthScreen() {
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [step, setStep] = useState('email') // 'email' | 'code'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSendCode() {
    if (!email.trim()) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    })
    if (error) setError(error.message + (error.status ? ` [${error.status}]` : ''))
    else setStep('code')
    setLoading(false)
  }

  async function handleVerify() {
    if (code.length !== 6) return
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: 'email',
    })
    if (error) setError('wrong code, try again')
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-dvh px-8 bg-[#FDF8F6]">
      <div className="text-6xl mb-4">⏱️</div>
      <h1 className="text-2xl font-bold text-gray-900 mb-1">geclock</h1>
      <p className="text-sm text-gray-400 mb-12 text-center">track your time, beautifully</p>

      {step === 'email' ? (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendCode()}
            placeholder="your@email.com"
            autoFocus
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-sm text-gray-800 focus:outline-none focus:border-purple-300 bg-white transition-colors placeholder:text-gray-300 text-center"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            onClick={handleSendCode}
            disabled={loading || !email.trim()}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}
          >
            {loading ? 'sending…' : 'send code ✨'}
          </button>
          <p className="text-center text-xs text-gray-300">no password needed · works on all your devices</p>
        </div>
      ) : (
        <div className="w-full max-w-xs flex flex-col gap-3">
          <div className="text-center mb-1">
            <p className="text-sm font-semibold text-gray-700">check your email</p>
            <p className="text-xs text-gray-400 mt-0.5">we sent a 6-digit code to</p>
            <p className="text-xs font-semibold text-purple-500 mt-0.5">{email}</p>
          </div>
          <input
            type="text"
            inputMode="numeric"
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && handleVerify()}
            placeholder="000000"
            autoFocus
            className="w-full border-2 border-gray-100 rounded-2xl px-4 py-3.5 text-2xl font-bold text-gray-800 focus:outline-none focus:border-purple-300 bg-white transition-colors placeholder:text-gray-200 text-center tracking-[0.5em]"
          />
          {error && <p className="text-red-400 text-xs text-center">{error}</p>}
          <button
            onClick={handleVerify}
            disabled={loading || code.length !== 6}
            className="w-full py-3.5 rounded-2xl font-bold text-white text-sm transition-all active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #c084fc, #f472b6)' }}
          >
            {loading ? 'verifying…' : 'log in →'}
          </button>
          <button onClick={() => { setStep('email'); setCode(''); setError('') }} className="text-xs text-gray-300 underline underline-offset-2 text-center">
            use a different email
          </button>
        </div>
      )}
    </div>
  )
}
