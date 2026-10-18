import { Link, NavLink } from 'react-router-dom'
import { X, ChevronRight } from 'lucide-react'
import { useCatalogue } from '../../context/CatalogueContext'

export default function MobileMenuDrawer({ isOpen, onClose, links }) {
  const { categories: catList } = useCatalogue()
  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        className="fixed inset-y-0 left-0 z-50 w-80 bg-cream flex flex-col shadow-2xl animate-slide-up"
        style={{ animationFillMode: 'both' }}
        role="dialog"
        aria-label="Navigation menu"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-maroon">
          <Link to="/" onClick={onClose} className="text-cream font-serif text-lg font-bold">
            🪔 Vatvruksha
          </Link>
          <button
            onClick={onClose}
            className="p-1 text-cream/80 hover:text-cream transition-colors"
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 overflow-y-auto py-4">
          {links.map((link) => (
            <div key={link.label}>
              {link.children ? (
                <div>
                  <span className="flex items-center justify-between px-5 py-3 text-sm font-semibold text-gold-dark uppercase tracking-wider">
                    {link.label}
                  </span>
                  {link.children.map((child) => (
                    <NavLink
                      key={child.to}
                      to={child.to}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `flex items-center gap-2 pl-8 pr-5 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'text-maroon font-semibold bg-maroon-50'
                            : 'text-brown hover:text-maroon hover:bg-cream-dark'
                        }`
                      }
                    >
                      <ChevronRight size={14} className="text-gold flex-shrink-0" />
                      {child.label}
                    </NavLink>
                  ))}
                </div>
              ) : (
                <NavLink
                  to={link.to}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors border-l-2 ${
                      isActive
                        ? 'text-maroon bg-maroon-50 border-maroon font-semibold'
                        : 'text-brown hover:text-maroon hover:bg-cream-dark border-transparent'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              )}
            </div>
          ))}

          {/* Extra categories */}
          <div className="mt-4 border-t border-cream-dark pt-4">
            <span className="px-5 text-xs font-semibold text-gold-dark uppercase tracking-wider">
              More Categories
            </span>
            {catList.slice(9).map((cat) => (
              <NavLink
                key={cat.slug}
                to={`/category/${cat.slug}`}
                onClick={onClose}
                className="flex items-center gap-2 pl-8 pr-5 py-2.5 text-sm text-brown hover:text-maroon hover:bg-cream-dark transition-colors"
              >
                <ChevronRight size={14} className="text-gold flex-shrink-0" />
                {cat.name}
              </NavLink>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="px-5 py-4 bg-cream-dark border-t border-cream-darker text-xs text-brown-light">
          📞 +91 99999 99999 · Order on WhatsApp
        </div>
      </div>
    </>
  )
}
