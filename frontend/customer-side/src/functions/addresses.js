// Address book query helpers — customer app
// users/{uid}/addresses/{addressId}
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

export const fetchAddresses = async (uid) => {
  const allSnap = await getDocs(collection(db, 'users', uid, 'addresses'))
  return allSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const fetchAddressById = async (uid, addressId) => {
  const snap = await getDoc(doc(db, 'users', uid, 'addresses', addressId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export const saveAddress = async (uid, addressId, data) => {
  await setDoc(doc(db, 'users', uid, 'addresses', addressId), {
    ...data,
    updatedAt: serverTimestamp(),
    ...(!data.createdAt ? { createdAt: serverTimestamp() } : {}),
  })
}

export const deleteAddress = async (uid, addressId) => {
  await deleteDoc(doc(db, 'users', uid, 'addresses', addressId))
}
