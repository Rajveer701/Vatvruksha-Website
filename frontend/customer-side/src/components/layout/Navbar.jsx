import { useState, useEffect, useRef } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  Search, Heart, ShoppingCart, User, Menu, X, ChevronDown,
  LogOut, Package,
} from 'lucide-react'
import useCartStore from '../../store/cartStore'
import useWishlistStore from '../../store/wishlistStore'
import MobileMenuDrawer from './MobileMenuDrawer'
import useCartDrawerStore from '../../store/cartDrawerStore'
import { useAuth } from '../../context/AuthContext'
import { useCatalogue } from '../../context/CatalogueContext'

export default function Navbar() {
  const { categories: catList, products: allProducts } = useCatalogue()

  const navLinks = [
    { label: 'Home', to: '/' },
    { label: 'Shop', to: '/shop' },
    {
      label: 'Categories',
      to: '#',
      children: catList.slice(0, 9).map((c) => ({
        label: c.name,
        to: `/category/${c.slug}`,
      })),
    },
    { label: 'About', to: '/about' },
    { label: 'Contact', to: '/contact' },
  ]
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [megaMenu, setMegaMenu] = useState(null)
  const searchRef = useRef(null)
  const navigate = useNavigate()

  const items = useCartStore((s) => s.items)
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0)
  const wishItems = useWishlistStore((s) => s.items)
  const openCart = useCartDrawerStore((s) => s.open)
  const { signOut, isAuthenticated } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch {
      // error handled by context
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      const q = searchQuery.toLowerCase()
      setSuggestions(
        allProducts
          .filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.categoryId?.toLowerCase().includes(q) ||
              (p.material || '').toLowerCase().includes(q)
          )
          .slice(0, 5)
      )
    } else {
      setSuggestions([])
    }
  }, [searchQuery])

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSuggestions([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearchSubmit = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/shop?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchQuery('')
      setSuggestions([])
      setSearchOpen(false)
    }
  }

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-md border-b border-cream-darker'
            : 'bg-cream border-b border-cream-dark'
        }`}
      >
        {/* Main Header Row */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20 gap-4">
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link
              to="/"
              className="flex-shrink-0 flex flex-col items-center md:items-start"
            >
              <span className="font-serif text-maroon font-bold text-lg md:text-xl leading-tight">
                🪔 Vatvruksha
              </span>
              <span className="text-[0.6rem] md:text-xs text-gold-dark font-medium uppercase tracking-widest">
                Spiritual Vastu Bhandar
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
              {navLinks.map((link) =>
                link.children ? (
                  <div key={link.label} className="relative">
                    <button
                      className="flex items-center gap-1 text-sm font-medium text-brown hover:text-maroon transition-colors py-6"
                      onMouseEnter={() => setMegaMenu(link.label)}
                      onMouseLeave={() => setMegaMenu(null)}
                      aria-expanded={megaMenu === link.label}
                    >
                      {link.label}
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${megaMenu === link.label ? 'rotate-180' : ''}`}
                      />
                    </button>
                    {megaMenu === link.label && (
                      <div
                        className="absolute top-full left-1/2 -translate-x-1/2 w-64 bg-white border border-cream-dark rounded-xl shadow-xl py-3 z-50"
                        onMouseEnter={() => setMegaMenu(link.label)}
                        onMouseLeave={() => setMegaMenu(null)}
                      >
                        {link.children.map((child) => (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            onClick={() => setMegaMenu(null)}
                            className={({ isActive }) =>
                              `block px-4 py-2 text-sm transition-colors ${
                                isActive
                                  ? 'text-maroon bg-maroon-50 font-medium'
                                  : 'text-brown hover:text-maroon hover:bg-cream'
                              }`
                            }
                          >
                            {child.label}
                          </NavLink>
                        ))}
                        <div className="border-t border-cream-dark mt-2 pt-2 px-4">
                          <Link
                            to="/shop"
                            className="text-sm text-gold font-medium hover:text-gold-dark transition-colors"
                            onClick={() => setMegaMenu(null)}
                          >
                            View All Products →
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <NavLink
                    key={link.label}
                    to={link.to}
                    className={({ isActive }) =>
                      `text-sm font-medium transition-colors ${
                        isActive ? 'text-maroon' : 'text-brown hover:text-maroon'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                )
              )}
            </nav>

            {/* Search + Icons */}
            <div className="flex items-center gap-2 md:gap-3">
              {/* Desktop Search */}
              <div ref={searchRef} className="relative hidden md:block">
                {searchOpen ? (
                  <form onSubmit={handleSearchSubmit} className="flex items-center">
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search idols, pooja items..."
                      className="w-64 px-3 py-2 text-sm border border-gold rounded-l-lg bg-cream focus:outline-none focus:border-maroon"
                    />
                    <button
                      type="submit"
                      className="bg-maroon text-white px-3 py-2 rounded-r-lg hover:bg-maroon-dark transition-colors"
                    >
                      <Search size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSuggestions([]) }}
                      className="ml-2 text-brown hover:text-maroon"
                    >
                      <X size={18} />
                    </button>
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    className="p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
                    aria-label="Search"
                  >
                    <Search size={20} />
                  </button>
                )}

                {/* Suggestions dropdown */}
                {suggestions.length > 0 && (
                  <div className="absolute top-full right-0 w-72 bg-white border border-cream-dark rounded-xl shadow-xl z-50 overflow-hidden">
                    {suggestions.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        onClick={() => { setSuggestions([]); setSearchQuery(''); setSearchOpen(false) }}
                        className="flex items-center gap-3 px-4 py-3 hover:bg-cream transition-colors"
                      >
                        <img
                          src={p.images[0]}
                          alt={p.name}
                          className="w-10 h-10 object-cover rounded-lg"
                        />
                        <div>
                          <p className="text-sm font-medium text-brown line-clamp-1">{p.name}</p>
                          <p className="text-xs text-gold font-semibold">
                            ₹{(p.salePrice || p.price).toLocaleString('en-IN')}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              {/* Mobile Search */}
              <button
                className="md:hidden p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
                onClick={() => navigate('/shop')}
                aria-label="Search"
              >
                <Search size={20} />
              </button>

              {/* Wishlist */}
              <Link
                to="/wishlist"
                className="relative p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
                aria-label={`Wishlist (${wishItems.length} items)`}
              >
                <Heart size={20} />
                {wishItems.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-maroon text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                    {wishItems.length}
                  </span>
                )}
              </Link>

              {/* Account / sign out */}
              {isAuthenticated ? (
                <div className="relative">
                  <Link
                    to="/orders"
                    className="p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors hidden sm:block"
                    aria-label="My Orders"
                  >
                    <Package size={20} />
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors hidden sm:block"
                    aria-label="Sign out"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="p-2 rounded-lg text-brown hover:text-maroon hover:bg-cream-dark transition-colors hidden sm:block"
                  aria-label="My Account"
                >
                  <User size={20} />
                </Link>
              )}

              {/* Cart */}
              <button
                onClick={openCart}
                className="relative flex items-center gap-2 bg-maroon text-white px-3 py-2 rounded-lg hover:bg-maroon-dark transition-all duration-200 hover:shadow-lg"
                aria-label={`Cart (${totalItems} items)`}
              >
                <ShoppingCart size={18} />
                <span className="text-sm font-semibold hidden sm:inline">Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-gold text-brown text-[11px] font-bold rounded-full flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <MobileMenuDrawer
        isOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
        links={navLinks}
      />
    </>
  )
}
