import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { Mail, Lock, User, ArrowRight, Send } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const initialSignIn = { email: '', password: '' }
const initialSignUp = { name: '', email: '', password: '' }

export default function LoginPage() {
  const navigate = useNavigate()
  const {
    signInEmail,
    signUpEmail,
    signInGoogle,
    sendVerificationEmail,
    user,
    loading,
    error,
    clearError,
  } = useAuth()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [signIn, setSignIn] = useState(initialSignIn)
  const [signUp, setSignUp] = useState(initialSignUp)

  const handleSignIn = async (e) => {
    e.preventDefault()
    clearError()
    try {
      await signInEmail(signIn.email, signIn.password)
      if (user && !user.emailVerified) {
        toast.info('Please verify your email before checkout.')
      }
      navigate('/checkout')
    } catch {
      // error set by context
    }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    clearError()
    try {
      const cred = await signUpEmail(signUp.email, signUp.password)
      await sendVerificationEmail(cred.user)
      navigate('/checkout')
    } catch {
      // error set by context
    }
  }

  const handleGoogle = async () => {
    clearError()
    try {
      await signInGoogle()
      navigate('/checkout')
    } catch {
      // error set by context
    }
  }

  const changeSignIn = (e) => {
    setSignIn({ ...signIn, [e.target.name]: e.target.value })
  }
  const changeSignUp = (e) => {
    setSignUp({ ...signUp, [e.target.name]: e.target.value })
  }

  return (
    <>
      <Helmet>
        <title>Sign In — Vatvruksha Spiritual Vastu Bhandar</title>
        <meta
          name="description"
          content="Sign in to your Vatvruksha account to checkout and track your orders."
        />
      </Helmet>

      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="bg-white rounded-2xl border border-cream-dark p-8 md:p-10 shadow-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-4">
              <span className="font-serif text-gold text-2xl font-bold">
                🪔 Vatvruksha
              </span>
            </Link>
            <h1 className="font-serif text-3xl md:text-4xl font-bold text-brown">
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </h1>
            <p className="text-brown-light text-sm mt-2">
              {mode === 'signin'
                ? 'Welcome back. Sign in to continue your sacred shopping.'
                : 'Join us — create an account to place orders.'}
            </p>
          </div>

          {/* Google sign-in */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 border border-cream-dark rounded-xl px-4 py-3 text-brown font-medium bg-white hover:bg-cream transition-colors disabled:opacity-60"
          >
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              ></path>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"></path>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s0-1.43.22-2.09H12v4.18H7.05c-.52 1.5-1.99 2.68-3.8 2.68C3.3 18.5 1 16.11 1 13.5s2.3-5 4.7-5 .98.18 1.4.43l1.44 1.12z"></path>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.57 4.16 1.48l2.15-2.15C16.11 2.3 10.99 1 6.97 1 3.3 1 .79 3.39.22 6.98l2.62 2.02c.63-2.09 2.43-3.62 4.71-3.62z"></path>
            </svg>
            Continue with Google
          </button>

          {mode === 'signin' ? (
            <>
              <div className="mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-2.5 text-brown-light" />
                      <input
                        name="email"
                        type="email"
                        value={signIn.email}
                        onChange={changeSignIn}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-cream text-brown focus:outline-none focus:border-maroon"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-2.5 text-brown-light" />
                      <input
                        name="password"
                        type="password"
                        value={signIn.password}
                        onChange={changeSignIn}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-cream text-brown focus:outline-none focus:border-maroon"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
                  >
                    <ArrowRight size={16} /> Sign in
                  </button>
                </form>
              </div>
              <p className="mt-6 text-center text-sm text-brown-light">
                Don't have an account?{' '}
                <button
                  onClick={() => setMode('signup')}
                  className="text-maroon font-medium hover:underline"
                >
                  Create account
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <User size={16} className="absolute left-3 top-2.5 text-brown-light" />
                      <input
                        name="name"
                        value={signUp.name}
                        onChange={changeSignUp}
                        placeholder="Your full name"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-cream text-brown focus:outline-none focus:border-maroon"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-3 top-2.5 text-brown-light" />
                      <input
                        name="email"
                        type="email"
                        value={signUp.email}
                        onChange={changeSignUp}
                        placeholder="you@example.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-cream text-brown focus:outline-none focus:border-maroon"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brown mb-1">
                      Password
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3 top-2.5 text-brown-light" />
                      <input
                        name="password"
                        type="password"
                        value={signUp.password}
                        onChange={changeSignUp}
                        placeholder="••••••••"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-cream-dark bg-cream text-brown focus:outline-none focus:border-maroon"
                        required
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary w-full py-3 inline-flex items-center justify-center gap-2"
                  >
                    <Send size={16} /> Create account
                  </button>
                </form>
              </div>
              <p className="mt-6 text-center text-sm text-brown-light">
                Already have an account?{' '}
                <button
                  onClick={() => setMode('signin')}
                  className="text-maroon font-medium hover:underline"
                >
                  Sign in
                </button>
              </p>
              <p className="mt-4 text-center text-xs text-brown-light">
                A verification email will be sent. Verify before checkout.
              </p>
            </>
          )}

          {error && (
            <div className="mt-6 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
