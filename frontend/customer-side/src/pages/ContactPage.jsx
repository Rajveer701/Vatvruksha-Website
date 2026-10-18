import { useState } from 'react'
import { Helmet } from 'react-helmet-async'
import { Link } from 'react-router-dom'
import { MapPin, Mail, Phone, Clock, Send } from 'lucide-react'
import STORE from '../config/store'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <>
      <Helmet>
        <title>Contact Us — Vatvruksha Spiritual Vastu Bhandar</title>
        <meta name="description" content="Get in touch with Vatvruksha Spiritual Vastu Bhandar for guidance, custom orders and spiritual product inquiries." />
      </Helmet>

      <div className="bg-cream-dark border-b border-cream-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <nav aria-label="Breadcrumb" className="text-xs text-brown-light">
            <Link to="/" className="hover:text-maroon">Home</Link>
            <span className="mx-2">›</span>
            <span className="text-brown font-medium">Contact</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[0.9fr_1.1fr] gap-8">
          <div className="space-y-6">
            <div>
              <p className="text-sm uppercase tracking-[0.2em] text-gold font-semibold">Get In Touch</p>
              <h1 className="font-serif text-4xl text-brown mt-2">Contact Us</h1>
            </div>

            <div className="bg-white rounded-2xl border border-cream-dark p-5 shadow-sm space-y-4">
              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 text-maroon flex items-center justify-center"><Phone size={18} /></div>
                <div>
                  <p className="text-sm text-brown-light">Phone</p>
                  <a href={`tel:${STORE.phone}`} className="font-medium text-brown hover:text-maroon">{STORE.phone}</a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 text-maroon flex items-center justify-center"><Mail size={18} /></div>
                <div>
                  <p className="text-sm text-brown-light">Email</p>
                  <a href={`mailto:${STORE.email}`} className="font-medium text-brown hover:text-maroon">{STORE.email}</a>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 text-maroon flex items-center justify-center"><MapPin size={18} /></div>
                <div>
                  <p className="text-sm text-brown-light">Address</p>
                  <p className="font-medium text-brown">{STORE.address.full}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-10 h-10 rounded-full bg-gold-50 text-maroon flex items-center justify-center"><Clock size={18} /></div>
                <div>
                  <p className="text-sm text-brown-light">Business Hours</p>
                  <p className="font-medium text-brown">{STORE.hours}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-cream-dark bg-gradient-to-br from-cream to-white p-4">
              <div className="h-64 rounded-xl bg-[radial-gradient(circle_at_center,_rgba(201,150,43,0.25)_0%,_rgba(122,31,43,0.12)_50%,_rgba(255,248,236,1)_100%)] flex items-center justify-center text-center">
                <div>
                  <div className="text-5xl mb-3">📍</div>
                  <p className="font-serif text-2xl text-brown">Map Preview</p>
                  <p className="text-sm text-brown-light mt-2">{STORE.address.full}</p>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-dark p-5 md:p-6 shadow-sm">
            <h2 className="font-serif text-3xl text-brown mb-5">Send a Message</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-brown mb-2" htmlFor="name">Your Name</label>
                <input id="name" type="text" className="w-full rounded-xl border border-cream-dark px-3 py-2.5" placeholder="Enter your name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-brown mb-2" htmlFor="phone">Phone</label>
                <input id="phone" type="tel" className="w-full rounded-xl border border-cream-dark px-3 py-2.5" placeholder="+91 99999 99999" />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-brown mb-2" htmlFor="subject">Subject</label>
              <input id="subject" type="text" className="w-full rounded-xl border border-cream-dark px-3 py-2.5" placeholder="How can we help?" />
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-brown mb-2" htmlFor="message">Message</label>
              <textarea id="message" rows="6" className="w-full rounded-xl border border-cream-dark px-3 py-2.5" placeholder="Tell us about your requirements..." />
            </div>

            <button type="submit" className="btn-primary mt-5 inline-flex items-center gap-2">
              <Send size={16} /> Send Message
            </button>

            {submitted && (
              <p className="mt-4 text-sm text-green-700 font-medium">Thank you! Your message has been recorded. We will reach out soon.</p>
            )}
          </form>
        </div>
      </div>
    </>
  )
}
