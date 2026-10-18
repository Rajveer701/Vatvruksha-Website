import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SectionTitle from '../ui/SectionTitle'
import ProductCard from '../product/ProductCard'
import { SkeletonCard } from '../ui/Skeleton'
import { getFeaturedProducts, getBestSellers, getNewArrivals, getOnSale } from '../../data/products'

const TABS = [
  { id: 'best', label: 'Best Sellers', fn: getBestSellers },
  { id: 'new', label: 'New Arrivals', fn: getNewArrivals },
  { id: 'sale', label: 'On Sale', fn: getOnSale },
]

export default function TabbedProducts() {
  const [activeTab, setActiveTab] = useState('best')
  const [loading, setLoading] = useState(false)
  const [products, setProducts] = useState(getBestSellers())

  const handleTab = (tab) => {
    if (tab.id === activeTab) return
    setLoading(true)
    setActiveTab(tab.id)
    // Simulate async fetch
    setTimeout(() => {
      setProducts(tab.fn())
      setLoading(false)
    }, 300)
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SectionTitle
          title="Sacred Selections"
          subtitle="Curated by devotion — find the perfect murti for every occasion"
        />

        {/* Tabs */}
        <div className="flex justify-center gap-2 mb-10">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTab(tab)}
              className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-maroon text-white shadow-md'
                  : 'bg-cream text-brown hover:bg-cream-dark border border-cream-dark'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : products.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>

        <div className="text-center mt-10">
          <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
            View All Products →
          </Link>
        </div>
      </div>
    </section>
  )
}
