import { useState } from 'react'
import { Utensils, Loader2, CheckCircle } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export default function ResetPasswordScreen() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError('Please fill in all fields')
      return
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        supabase.auth.signOut()
      }, 3000)
    }
    setLoading(false)
  }

  const inputClass =
    'border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[var(--color-orange)] w-full text-sm'

  return (
    <div className="min-h-screen w-full bg-white flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-full bg-[var(--color-orange)] flex items-center justify-center shadow-lg mb-5">
            <Utensils className="w-10 h-10 text-white" strokeWidth={2.25} />
          </div>
          <h1 className="font-serif text-4xl font-black text-[var(--color-navy)] tracking-tight">
            Genuine Dining
          </h1>
          <p className="text-xs font-semibold text-[var(--color-orange)] uppercase tracking-[0.2em] mt-2">
            Scratch made. Student approved.
          </p>
        </div>

        {success ? (
          <div className="flex flex-col items-center text-center py-4">
            <CheckCircle className="w-16 h-16 text-green-500 mb-5" strokeWidth={1.5} />
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-2">
              Password updated!
            </h2>
            <p className="text-sm text-gray-500">
              You will be redirected to sign in shortly
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold text-[var(--color-navy)] mb-1">
              Set New Password
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              Choose a strong password for your account
            </p>

            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="New password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                style={{ fontSize: '16px' }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={inputClass}
                autoComplete="new-password"
                style={{ fontSize: '16px' }}
              />
            </div>

            {error && (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              onClick={handleReset}
              disabled={loading}
              className="mt-6 w-full bg-[var(--color-orange)] text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 hover:opacity-95 transition disabled:opacity-70"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Set New Password'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
