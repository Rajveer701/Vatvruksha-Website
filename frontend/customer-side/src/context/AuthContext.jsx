// Firebase Auth context — customer app
// Provides current user, sign-in/out, email verification, and ID-token refresh.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  getIdToken,
  auth,
} from '../auth.js'

const GoogleProvider = new GoogleAuthProvider()

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const refreshIdToken = useCallback(async () => {
    if (!user) return null
    try {
      const token = await getIdToken(user, true) // force refresh
      return token
    } catch (err) {
      setError(err.message || 'Token refresh failed')
      return null
    }
  }, [user])

  const handleSignInEmail = async (email, password) => {
    setError(null)
    try {
      return await signInWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(err.message || 'Sign in failed')
      throw err
    }
  }

  const handleSignUpEmail = async (email, password) => {
    setError(null)
    try {
      return await createUserWithEmailAndPassword(auth, email, password)
    } catch (err) {
      setError(err.message || 'Sign up failed')
      throw err
    }
  }

  const handleSignInGoogle = async () => {
    setError(null)
    try {
      return await signInWithPopup(auth, GoogleProvider)
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      throw err
    }
  }

  const handleSendVerification = async () => {
    if (!user) return
    setError(null)
    try {
      await sendEmailVerification(user)
      setError('Verification email sent. Please check your inbox.')
    } catch (err) {
      setError(err.message || 'Could not send verification email')
      throw err
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOut(auth)
    } catch (err) {
      setError(err.message || 'Sign out failed')
      throw err
    }
  }

  const value = {
    user,
    loading,
    error,
    clearError: () => setError(null),
    isAuthenticated: !!user,
    isEmailVerified: !!user && user.emailVerified === true,
    signInEmail: handleSignInEmail,
    signUpEmail: handleSignUpEmail,
    signInGoogle: handleSignInGoogle,
    sendVerificationEmail: handleSendVerification,
    signOut: handleSignOut,
    refreshIdToken,
    updateProfile: (u, { displayName }) => updateProfile(u, { displayName }),
  }

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
