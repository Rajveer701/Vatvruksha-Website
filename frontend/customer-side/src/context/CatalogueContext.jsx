// Catalogue context — loads products/categories from Firestore.
// Queries follow the integration guide: isActive == true, ordered by sortOrder.
import { createContext, useContext, useEffect, useState } from 'react'
import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
} from 'firebase/firestore'
import { db } from '../firebase.js'

const CatalogueContext = createContext(null)

export function CatalogueProvider({ children }) {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const [productsSnap, categoriesSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'products'),
              where('isActive', '==', true),
              orderBy('sortOrder')
            )
          ),
          getDocs(
            query(
              collection(db, 'categories'),
              where('isActive', '==', true),
              orderBy('sortOrder')
            )
          ),
        ])

        if (!cancelled) {
          setProducts(productsSnap.docs.map((d) => ({ id: d.id, ...d.data() })))
          setCategories(
            categoriesSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
          )
        }
      } catch {} // Firestore not configured yet — keep empty arrays so UI still renders.
      finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [])

  const getProductById = (id) => products.find((p) => p.id === id)
  const getProductBySlug = (slug) => products.find((p) => p.slug === slug)
  const getCategoryBySlug = (slug) =>
    categories.find((c) => c.slug === slug)
  const getProductsByCategory = (categoryId) =>
    products.filter((p) => p.categoryId === categoryId)

  const value = {
    products,
    categories,
    loading,
    getProductById,
    getProductBySlug,
    getCategoryBySlug,
    getProductsByCategory,
  }

  return (
    <CatalogueContext.Provider value={value}>{children}</CatalogueContext.Provider>
  )
}

export const useCatalogue = () => {
  const ctx = useContext(CatalogueContext)
  if (!ctx) throw new Error('useCatalogue must be used within CatalogueProvider')
  return ctx
}
