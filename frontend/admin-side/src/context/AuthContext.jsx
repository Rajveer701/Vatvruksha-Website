// Admin Auth context — Firebase Auth + custom claim guard.
// After sign-in force-refreshes ID token and requires claims.admin === true
// AND claims.email_verified === true. Route guard is UX only; rules/functions enforce authorization.
import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  GoogleAuthProvider,
  getIdToken,
} from 'firebase/auth'
import { auth, provider, signInEmail, signUpEmail, signInGoogle, signOutUser, refreshIdToken } from '../auth.js'

const AdminAuthContext = createContext(null)

export function AdminAuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [claims, setClaims] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const tokenResult = await u.getIdTokenResult(true) // force refresh
          setClaims(tokenResult.claims)
        } catch (err) {
          setError(err.message || 'Token refresh failed')
          setClaims(null)
        }
      } else {
        setClaims(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const isAdmin =
    user &&
    claims.admin === true &&
    claims.email_verified === true

  const handleRefreshClaims = useCallback(async () => {
    if (!user) return
    try {
      const tokenResult = await refreshIdToken(user) // force refresh
      // getIdToken returns the token string; claims come from getIdTokenResult
      const result = await user.getIdTokenResult(true)
      setClaims(result.claims)
      return result.claims
    } catch (err) {
      setError(err.message || 'Token refresh failed')
      return null
    }
  }, [user])

  const handleSignInEmail = async (email, password) => {
    setError(null)
    try {
      await signInEmail(email, password)
    } catch (err) {
      setError(err.message || 'Sign in failed')
      throw err
    }
  }

  const handleSignUpEmail = async (email, password) => {
    setError(null)
    try {
      await signUpEmail(email, password)
    } catch (err) {
      setError(err.message || 'Sign up failed')
      throw err
    }
  }

  const handleSignInGoogle = async () => {
    setError(null)
    try {
      await signInWithPopup(auth, new GoogleAuthProvider())
    } catch (err) {
      setError(err.message || 'Google sign-in failed')
      throw err
    }
  }

  const handleSignOut = async () => {
    setError(null)
    try {
      await signOutUser()
    } catch (err) {
      setError(err.message || 'Sign out failed')
      throw err
    }
  }

  const value = {
    user,
    claims,
    loading,
    error,
    clearError: () => setError(null),
    isAuthenticated: !!user,
    isAdmin,
    handleSignInEmail,
    handleSignUpEmail,
    handleSignInGoogle,
    handleSignOut,
    refreshClaims: handleRefreshClaims,
  }

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const ctx = useContext(AdminAuthContext)
  if (!ctx) throw new Error('useAdminAuth must be used within AdminAuthProvider')
  return ctx
}
