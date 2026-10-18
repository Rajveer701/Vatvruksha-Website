import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { User, Package, Heart, Bell } from 'lucide-react'

const cards = [
  { icon: <User size={18} />, title: 'Profile', desc: 'Manage your personal details and addresses.', to: '/account/addresses' },
  { icon: <Package size={18} />, title: 'Orders', desc: 'Track your spiritual purchases and order history.', to: '/orders' },
  { icon: <Heart size={18} />, title: 'Wishlist', desc: 'Review your saved deity idols and pooja essentials.', to: '/wishlist' },
  { icon: <Bell size={18} />, title: 'Notifications', desc: 'Receive festival offers and new arrivals.', to: '/contact' },
]

export default function AccountPage() {
  return (
    <>
      <Helmet>
        <title>My Account — Vatvruksha Spiritual Vastu Bhandar</title>
        <meta name="description" content="Access your account overview, saved items, orders and spiritual recommendations." />
      </Helmet>

      <div className="bg-cream-dark border-b border-cream-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light">
            <Link to="/" className="hover:text-maroon">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-brown font-medium">My Account</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="mb-8">
          <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Account</p>
          <h1 className="font-serif text-4xl text-brown mt-2">Welcome back</h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {cards.map((card) => (
            <div key={card.title} className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
              <div className="w-11 h-11 rounded-xl bg-gold-50 text-maroon flex items-center justify-center mb-4">{card.icon}</div>
              <h2 className="font-serif text-2xl text-brown mb-2">{card.title}</h2>
              <p className="text-sm text-brown-light leading-relaxed">{card.desc}</p>
              {card.to && (
                <Link
                  to={card.to}
                  className="mt-4 block text-sm font-medium text-maroon hover:underline"
                >
                  Open →
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
