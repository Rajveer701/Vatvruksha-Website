import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'

const slides = [
  {
    id: 1,
    title: 'Divine Murtis for\nYour Sacred Space',
    subtitle: 'Handcrafted with devotion by master artisans',
    cta: 'Explore Collection',
    ctaLink: '/shop',
    bg: 'from-maroon-dark via-maroon to-saffron-dark',
    accent: '#C9962B',
    emoji: '🪔',
  },
  {
    id: 2,
    title: 'Authentic Brass\nIdols & Statues',
    subtitle: 'Sacred metals, blessed by pundits — for your pooja ghar',
    cta: 'Shop Brass Murtis',
    ctaLink: '/shop',
    bg: 'from-brown via-brown-medium to-maroon',
    accent: '#E8741A',
    emoji: '🙏',
  },
  {
    id: 3,
    title: 'Complete Pooja\nEssentials',
    subtitle: 'Diyas, agarbatti, thali sets and more — all in one place',
    cta: 'Shop Pooja Items',
    ctaLink: '/category/daily-pooja',
    bg: 'from-saffron-dark via-saffron to-gold',
    accent: '#FFF8EC',
    emoji: '✨',
  },
]

export default function HeroBanner() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)
  const timerRef = useRef(null)

  const goTo = (idx) => {
    if (animating) return
    setAnimating(true)
    setCurrent(idx)
    setTimeout(() => setAnimating(false), 500)
  }

  const next = () => goTo((current + 1) % slides.length)
  const prev = () => goTo((current - 1 + slides.length) % slides.length)

  useEffect(() => {
    timerRef.current = setInterval(next, 5000)
    return () => clearInterval(timerRef.current)
  }, [current])

  const slide = slides[current]

  return (
    <section
      className={`relative bg-gradient-to-br ${slide.bg} transition-all duration-700`}
      aria-label="Hero banner"
    >
      {/* Decorative Pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(201,150,43,0.4) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(232,116,26,0.3) 0%, transparent 40%)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
        <div className="max-w-2xl">
          {/* Ornament */}
          <p
            className="text-3xl mb-4 animate-fade-in"
            style={{ color: slide.accent }}
          >
            {slide.emoji}
          </p>

          {/* Title */}
          <h1
            key={`title-${current}`}
            className="font-serif text-4xl md:text-6xl font-bold text-cream leading-tight whitespace-pre-line animate-fade-in"
          >
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p
            key={`sub-${current}`}
            className="mt-4 text-cream/80 text-base md:text-lg leading-relaxed animate-fade-in max-w-lg"
          >
            {slide.subtitle}
          </p>

          {/* CTA */}
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={slide.ctaLink}
              className="btn-gold text-base px-6 py-3"
            >
              {slide.cta}
            </Link>
            <Link
              to="/about"
              className="border border-cream/50 text-cream px-6 py-3 rounded-md text-base font-medium hover:bg-cream/10 transition-colors"
            >
              Our Story
            </Link>
          </div>

          {/* Trust badge */}
          <div className="mt-8 flex flex-wrap gap-4 text-xs text-cream/60">
            <span>✓ Authentic Materials</span>
            <span>✓ Blessed by Pundits</span>
            <span>✓ All India Delivery</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cream/20 hover:bg-cream/30 text-cream transition-all backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-cream/20 hover:bg-cream/30 text-cream transition-all backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? 'w-6 h-2 bg-gold'
                : 'w-2 h-2 bg-cream/40 hover:bg-cream/70'
            }`}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
