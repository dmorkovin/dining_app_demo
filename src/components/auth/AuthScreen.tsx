import { useState, useEffect } from 'react'
import { Loader2, ArrowLeft } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { haptic } from '../../utils/haptics'
import { biometrics } from '../../utils/biometrics'

type View = 'login' | 'register' | 'forgot'

const josefin = "'Josefin Sans', sans-serif"

const inputStyle: React.CSSProperties = {
  background: 'rgba(255,255,255,0.12)',
  border: '1px solid rgba(255,255,255,0.25)',
  borderRadius: 12,
  padding: '12px 16px',
  color: 'white',
  fontSize: 16,
  width: '100%',
  outline: 'none',
}

export default function AuthScreen() {
  const [view, setView] = useState<View>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricType, setBiometricType] = useState('')

  useEffect(() => {
    biometrics.isAvailable().then(available => {
      setBiometricAvailable(available);
      if (available) biometrics.getBiometryType().then(setBiometricType);
    });
  }, []);

  const handleLogin = async () => {
    haptic.medium()
    if (!email || !password) {
      setError('Please fill in all fields')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
    } else {
      localStorage.setItem('gd_saved_email', email)
      localStorage.setItem('gd_saved_password', password)
      localStorage.setItem('gd_biometric_enabled', 'true')
    }
    setLoading(false)
  }

  const handleBiometricLogin = async () => {
    haptic.medium()
    const success = await biometrics.authenticate('Sign in to Genuine Dining')
    if (success) {
      const savedEmail = localStorage.getItem('gd_saved_email')
      const savedPassword = localStorage.getItem('gd_saved_password')
      if (savedEmail && savedPassword) {
        setLoading(true)
        setError(null)
        const { error } = await supabase.auth.signInWithPassword({ email: savedEmail, password: savedPassword })
        if (error) setError(error.message)
        setLoading(false)
      } else {
        alert('Please sign in with your password first to enable biometric login.')
      }
    }
  }

  const handleRegister = async () => {
    haptic.medium()
    if (!name || !email || !password || !confirmPassword) {
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
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } }
    })
    if (error) {
      setError(error.message)
    } else {
      setSuccess('Check your email to verify your account!')
    }
    setLoading(false)
  }

  const handleForgotPassword = async () => {
    haptic.medium()
    if (!resetEmail) {
      setError('Please enter your email address')
      return
    }
    setLoading(true)
    setError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(
      resetEmail,
      { redirectTo: 'https://diningapp.netlify.app' }
    )
    if (error) {
      setError(error.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  const switchView = (next: View) => {
    setView(next)
    setError(null)
    setSuccess(null)
    setResetSent(false)
    setResetEmail('')
  }

  return (
    <div
      className="flex flex-col items-center justify-center px-6"
      style={{
        minHeight: '100vh',
        width: '100%',
        position: 'fixed',
        inset: 0,
        overflowY: 'auto',
        paddingTop: 'max(2.5rem, env(safe-area-inset-top))',
        paddingBottom: 'max(2.5rem, env(safe-area-inset-bottom))',
      }}
    >
      <div className="w-full max-w-md">
        {/* Logo area */}
        <div className="flex flex-col items-center mb-10">
          <img
            src="/assets/Frame_2087326403.png"
            width={80}
            height={80}
            alt="Genuine Dining"
            style={{ borderRadius: 18, marginBottom: 20 }}
          />
          <h1
            style={{
              fontFamily: josefin,
              fontWeight: 700,
              fontSize: 32,
              color: 'white',
              letterSpacing: '-0.5px',
            }}
          >
            Genuine Dining
          </h1>
          <p
            style={{
              fontFamily: josefin,
              fontWeight: 600,
              fontSize: 11,
              color: '#F88D66',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              marginTop: 8,
            }}
          >
            Scratch made. Student approved.
          </p>
        </div>

        {/* Form card */}
        <div
          style={{
            background: 'rgba(22,74,49,0.85)',
            border: '1px solid rgba(255,255,255,0.15)',
            borderRadius: 20,
            padding: 28,
          }}
        >
          {view === 'login' && (
            <div className="flex flex-col">
              <h2
                style={{
                  fontFamily: josefin,
                  fontWeight: 700,
                  fontSize: 24,
                  color: 'white',
                  marginBottom: 4,
                }}
              >
                Welcome back
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
                Sign in to your account
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => switchView('forgot')}
                  className="self-end mt-1 hover:underline"
                  style={{ fontSize: 12, fontWeight: 600, color: '#F88D66' }}
                >
                  Forgot password?
                </button>
              </div>

              {error && (
                <div className="mt-4 rounded-xl border border-red-400 border-opacity-40 px-4 py-3 text-sm text-red-200"
                  style={{ background: 'rgba(220,38,38,0.2)' }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading}
                className="mt-6 w-full text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                style={{
                  background: '#EE5E29',
                  borderRadius: 12,
                  padding: '13px 0',
                  fontFamily: josefin,
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Sign In'}
              </button>

              {biometricAvailable && (
                <div className="flex flex-col items-center mt-3 gap-2">
                  <button
                    type="button"
                    onClick={handleBiometricLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center hover:opacity-80 transition disabled:opacity-60"
                    style={{
                      background: 'transparent',
                      border: '1.5px solid #164A31',
                      borderRadius: 12,
                      height: 48,
                      fontFamily: josefin,
                      fontWeight: 600,
                      fontSize: 14,
                      color: '#164A31',
                      cursor: 'pointer',
                    }}
                  >
                    Sign in with {biometricType}
                  </button>
                  <p style={{ fontSize: 11, color: '#58595B', textAlign: 'center' }}>
                    Your credentials are stored securely on this device
                  </p>
                </div>
              )}

              <p className="text-center mt-6" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('register')}
                  className="hover:underline"
                  style={{ color: '#F88D66', fontWeight: 600 }}
                >
                  Create account
                </button>
              </p>
            </div>
          )}

          {view === 'register' && (
            <div className="flex flex-col">
              <h2
                style={{
                  fontFamily: josefin,
                  fontWeight: 700,
                  fontSize: 24,
                  color: 'white',
                  marginBottom: 4,
                }}
              >
                Create account
              </h2>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
                Join your campus dining community
              </p>

              <div className="flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="Full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="name"
                />
                <input
                  type="email"
                  placeholder="University email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="email"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="new-password"
                />
                <input
                  type="password"
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  style={inputStyle}
                  className="auth-input"
                  autoComplete="new-password"
                />
              </div>

              {error && (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm text-red-200"
                  style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)' }}>
                  {error}
                </div>
              )}

              {success && (
                <div className="mt-4 rounded-xl px-4 py-3 text-sm"
                  style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac' }}>
                  <p className="font-semibold">{success}</p>
                  <p className="mt-1" style={{ color: '#4ade80' }}>
                    You can close this screen and check your inbox
                  </p>
                </div>
              )}

              <button
                onClick={handleRegister}
                disabled={loading}
                className="mt-6 w-full text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                style={{
                  background: '#EE5E29',
                  borderRadius: 12,
                  padding: '13px 0',
                  fontFamily: josefin,
                  fontWeight: 700,
                  fontSize: 14,
                  textTransform: 'uppercase',
                  letterSpacing: '2px',
                }}
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Create Account'}
              </button>

              <p className="text-center mt-6" style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)' }}>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchView('login')}
                  className="hover:underline"
                  style={{ color: '#F88D66', fontWeight: 600 }}
                >
                  Sign in
                </button>
              </p>
            </div>
          )}

          {view === 'forgot' && (
            <div className="flex flex-col">
              <button
                type="button"
                onClick={() => switchView('login')}
                className="self-start p-2 -ml-2 mb-4 rounded-full transition-colors"
                style={{ background: 'rgba(255,255,255,0.08)' }}
                aria-label="Back to sign in"
              >
                <ArrowLeft className="w-5 h-5 text-white" />
              </button>

              {resetSent ? (
                <div className="flex flex-col items-center text-center py-4">
                  <div
                    className="w-16 h-16 rounded-full flex items-center justify-center mb-5"
                    style={{ background: 'rgba(238,94,41,0.2)', border: '1px solid rgba(238,94,41,0.4)' }}
                  >
                    <span style={{ fontSize: 28 }}>✉</span>
                  </div>
                  <h2
                    style={{
                      fontFamily: josefin,
                      fontWeight: 700,
                      fontSize: 24,
                      color: 'white',
                      marginBottom: 8,
                    }}
                  >
                    Check your email
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 8 }}>
                    We sent a password reset link to{' '}
                    <span style={{ fontWeight: 600, color: 'white' }}>{resetEmail}</span>
                  </p>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 28 }}>
                    Don't see it? Check your spam folder
                  </p>
                  <button
                    type="button"
                    onClick={() => switchView('login')}
                    className="hover:underline"
                    style={{ fontSize: 14, fontWeight: 600, color: '#F88D66' }}
                  >
                    Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <h2
                    style={{
                      fontFamily: josefin,
                      fontWeight: 700,
                      fontSize: 24,
                      color: 'white',
                      marginBottom: 4,
                    }}
                  >
                    Reset Password
                  </h2>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', marginBottom: 24 }}>
                    Enter your email and we'll send you a reset link
                  </p>

                  <input
                    type="email"
                    placeholder="Email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    style={inputStyle}
                    className="auth-input"
                    autoComplete="email"
                  />

                  {error && (
                    <div className="mt-4 rounded-xl px-4 py-3 text-sm text-red-200"
                      style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.4)' }}>
                      {error}
                    </div>
                  )}

                  <button
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="mt-6 w-full text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-60"
                    style={{
                      background: '#EE5E29',
                      borderRadius: 12,
                      padding: '13px 0',
                      fontFamily: josefin,
                      fontWeight: 700,
                      fontSize: 14,
                      textTransform: 'uppercase',
                      letterSpacing: '2px',
                    }}
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Reset Link'}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
