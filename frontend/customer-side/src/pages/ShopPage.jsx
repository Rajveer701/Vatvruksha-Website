import { useState, useEffect, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react'
import ProductCard from '../components/product/ProductCard'
import { SkeletonCard } from '../components/ui/Skeleton'
import { useCatalogue } from '../context/CatalogueContext'

const SORT_OPTIONS = [
  { value: 'popularity', label: 'Most Popular' },
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
]

export default function ShopPage({ preCategory = null }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { products: allProducts, categories: catList } = useCatalogue()

  const categoryFilter = preCategory || searchParams.get('category') || ''
  const searchQuery = searchParams.get('search') || ''
  const [selectedCategories, setSelectedCategories] = useState(categoryFilter ? [categoryFilter] : [])
  const [selectedMaterials, setSelectedMaterials] = useState([])
  const [priceRange, setPriceRange] = useState([0, 5000])
  const [sortBy, setSortBy] = useState('popularity')
  const [page, setPage] = useState(1)
  const PER_PAGE = 12

  // Simulate loading
  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => setLoading(false), 400)
    return () => clearTimeout(t)
  }, [selectedCategories, selectedMaterials, sortBy])

  // Update category from URL
  useEffect(() => {
    if (categoryFilter && !selectedCategories.includes(categoryFilter)) {
      setSelectedCategories([categoryFilter])
    }
  }, [categoryFilter])

  const filteredProducts = useMemo(() => {
    let result = [...allProducts]

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.categoryId?.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.material || '').toLowerCase().includes(q)
      )
    }

    // Category filter
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.categoryId))
    }

    // Material filter
    if (selectedMaterials.length > 0) {
      result = result.filter((p) =>
        selectedMaterials.some((m) => (p.material || '').includes(m))
      )
    }

    // Price (priceRange is rupees; variant price is paise)
    const maxPricePaise = priceRange[1] * 100
    const minPricePaise = priceRange[0] * 100
    result = result.filter((p) => {
      const price = p.variants?.default?.price ?? 0
      return price >= minPricePaise && price <= maxPricePaise
    })

    // Sort
    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => (a.salePrice || a.price) - (b.salePrice || b.price))
        break
      case 'price-desc':
        result.sort((a, b) => (b.salePrice || b.price) - (a.salePrice || a.price))
        break
      case 'newest':
        result.sort((a, b) => (b.tags.includes('new') ? 1 : 0) - (a.tags.includes('new') ? 1 : 0))
        break
      default: // popularity
        result.sort((a, b) => b.reviewCount - a.reviewCount)
    }

    return result
  }, [searchQuery, selectedCategories, selectedMaterials, priceRange, sortBy])

  const paginated = filteredProducts.slice(0, page * PER_PAGE)
  const hasMore = paginated.length < filteredProducts.length

  const toggleCategory = (slug) => {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]
    )
    setPage(1)
  }

  const toggleMaterial = (mat) => {
    setSelectedMaterials((prev) =>
      prev.includes(mat) ? prev.filter((m) => m !== mat) : [...prev, mat]
    )
    setPage(1)
  }

  const clearAll = () => {
    setSelectedCategories([])
    setSelectedMaterials([])
    setPriceRange([0, 5000])
    setPage(1)
  }

  const hasFilters =
    selectedCategories.length > 0 || selectedMaterials.length > 0 || priceRange[0] > 0 || priceRange[1] < 5000

  const Sidebar = () => (
    <aside className="w-full md:w-64 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-cream-dark overflow-hidden sticky top-24">
        {/* Filter header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cream-dark">
          <h2 className="font-serif font-bold text-brown">Filters</h2>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-maroon font-medium hover:underline flex items-center gap-1"
            >
              <X size={12} /> Clear All
            </button>
          )}
        </div>

        {/* Category */}
        <div className="px-5 py-4 border-b border-cream-dark">
          <h3 className="text-sm font-semibold text-brown mb-3">Deity / Category</h3>
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {catList.map((cat) => (
              <label key={cat.slug} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat.slug)}
                  onChange={() => toggleCategory(cat.slug)}
                  className="w-4 h-4 accent-maroon rounded"
                />
                <span className="text-sm text-brown group-hover:text-maroon transition-colors">
                  {cat.name}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Material */}
        <div className="px-5 py-4 border-b border-cream-dark">
          <h3 className="text-sm font-semibold text-brown mb-3">Material</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {['Brass', 'Panchadhatu', 'White Marble', 'German Silver', 'Polyresin', 'Black Stone', 'Terracotta', 'Natural'].map(
              (mat) => (
                <label key={mat} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={selectedMaterials.includes(mat)}
                    onChange={() => toggleMaterial(mat)}
                    className="w-4 h-4 accent-maroon rounded"
                  />
                  <span className="text-sm text-brown group-hover:text-maroon transition-colors">
                    {mat}
                  </span>
                </label>
              )
            )}
          </div>
        </div>

        {/* Price */}
        <div className="px-5 py-4">
          <h3 className="text-sm font-semibold text-brown mb-3">
            Price: ₹{priceRange[0]} – ₹{priceRange[1].toLocaleString('en-IN')}
          </h3>
          <input
            type="range"
            min={0}
            max={5000}
            step={100}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-maroon"
            aria-label="Maximum price"
          />
          <div className="flex justify-between text-xs text-brown-light mt-1">
            <span>₹0</span>
            <span>₹5,000+</span>
          </div>
        </div>
      </div>
    </aside>
  )

  return (
    <>
      <Helmet>
        <title>Shop — Vatvruksha Spiritual Vastu Bhandar</title>
        <meta
          name="description"
          content="Browse our complete collection of Hindu god idols, brass murtis, vastu items, diyas, incense and daily pooja essentials."
        />
      </Helmet>

      {/* Breadcrumb */}
      <div className="bg-cream-dark border-b border-cream-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light">
            <span><a href="/" className="hover:text-maroon">Home</a></span>
            <span className="mx-2">›</span>
            <span className="text-brown font-medium">Shop</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden md:block">
            <Sidebar />
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                  className="md:hidden flex items-center gap-2 text-sm font-medium text-brown border border-cream-dark rounded-lg px-3 py-2 hover:bg-cream"
                >
                  <SlidersHorizontal size={15} />
                  Filters
                  {hasFilters && (
                    <span className="bg-maroon text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {selectedCategories.length + selectedMaterials.length}
                    </span>
                  )}
                </button>
                <p className="text-sm text-brown-light">
                  <span className="font-semibold text-brown">{filteredProducts.length}</span> products
                  {searchQuery && ` for "${searchQuery}"`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <label htmlFor="sort" className="text-sm text-brown-light sr-only">Sort by</label>
                <select
                  id="sort"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-sm border border-cream-dark rounded-lg px-3 py-2 bg-white text-brown focus:outline-none focus:border-maroon"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mobile Sidebar */}
            {sidebarOpen && (
              <div className="md:hidden mb-6">
                <Sidebar />
              </div>
            )}

            {/* Active filters */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedCategories.map((slug) => {
                  const cat = catList.find((c) => c.slug === slug)
                  return (
                    <span
                      key={slug}
                      className="flex items-center gap-1 bg-maroon-50 text-maroon text-xs font-medium px-3 py-1 rounded-full"
                    >
                      {cat?.name}
                      <button onClick={() => toggleCategory(slug)} aria-label={`Remove ${cat?.name} filter`}>
                        <X size={10} />
                      </button>
                    </span>
                  )
                })}
                {selectedMaterials.map((mat) => (
                  <span
                    key={mat}
                    className="flex items-center gap-1 bg-gold-50 text-gold-dark text-xs font-medium px-3 py-1 rounded-full"
                  >
                    {mat}
                    <button onClick={() => toggleMaterial(mat)} aria-label={`Remove ${mat} filter`}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Product Grid */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🙏</div>
                <h3 className="font-serif text-xl text-brown mb-2">No products found</h3>
                <p className="text-brown-light text-sm mb-4">Try adjusting your filters</p>
                <button onClick={clearAll} className="btn-primary">
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 md:gap-6">
                  {paginated.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
                {hasMore && (
                  <div className="text-center mt-10">
                    <button
                      onClick={() => setPage((p) => p + 1)}
                      className="btn-primary"
                    >
                      Load More Products
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  )
}
