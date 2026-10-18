// Orders query helpers — customer app
// Query: orders where userId == currentUser.uid, ordered by createdAt desc
// (Firestore rules require this owner filter.)
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  doc,
  getDoc,
} from 'firebase/firestore'
import { db } from '../firebase.js'

export const fetchOrdersByUser = async (uid) => {
  const q = query(
    collection(db, 'orders'),
    where('userId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export const fetchOrderById = async (orderId) => {
  const snap = await getDoc(doc(db, 'orders', orderId))
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}
