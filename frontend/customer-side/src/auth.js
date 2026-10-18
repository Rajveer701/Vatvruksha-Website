// Auth helpers — customer app
import { auth } from './firebase.js'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  updateProfile,
  getIdToken,
  GoogleAuthProvider,
} from 'firebase/auth'

const provider = new GoogleAuthProvider()

export {
  auth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  sendEmailVerification,
  signOut,
  updateProfile,
  getIdToken,
  GoogleAuthProvider,
  provider,
}

export const signInEmail = (email, password) =>
  signInWithEmailAndPassword(auth, email, password)

export const signUpEmail = (email, password) =>
  createUserWithEmailAndPassword(auth, email, password)

export const signInGoogle = () => signInWithPopup(auth, provider)

export const sendVerification = (user) => sendEmailVerification(user)

export const signOutUser = () => signOut(auth)

export const updateUserProfile = (user, { displayName }) =>
  updateProfile(user, { displayName })

export const refreshIdToken = (user) => getIdToken(user, true)
