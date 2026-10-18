// StatCard — client-derived metric card (labelled client-derived per guide)
import { formatINR } from '../../../shared/money.js'

export default function StatCard({ title, value, subtitle, label = 'client-derived', icon }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div>
          {icon && (
            <div className="w-8 h-8 rounded-lg bg-maroon-50 text-maroon flex items-center justify-center mb-2">
              {icon}
            </div>
          )}
          <p className="text-xs font-semibold text-gold-dark uppercase tracking-wider">
            {title}
          </p>
          <span className="text-[10px] text-brown-light border border-cream-dark px-1.5 py-0.5 rounded">
            {label}
          </span>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl font-bold text-brown">{value}</p>
          {subtitle && <p className="text-xs text-brown-light">{subtitle}</p>}
        </div>
      </div>
    </div>
  )
}
