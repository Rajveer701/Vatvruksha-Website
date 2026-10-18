import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import useCartStore from '../store/cartStore'
import { useCatalogue } from '../context/CatalogueContext'
import { useAuth } from '../context/AuthContext'
import {
  callCreateCodOrder,
  callCreatePaytmOrder,
  callVerifyPaytmPayment,
  generateRequestId,
} from '../functions/checkout'
import { fetchAddresses } from '../functions/addresses'
import { formatINR } from '../../../shared/money.js'

const PAYMENT_METHOD = { COD: 'cod', PAYTM: 'paytm' }
const REQUEST_ID_REGEX = /^[A-Za-z0-9_-]{8,128}$/

const isRequestIdValid = (id) => REQUEST_ID_REGEX.test(id)

export default function CheckoutPage() {
  // ── All hooks must be called unconditionally, before any early return ──
  const _navigate = useNavigate()
  const { user, isEmailVerified } = useAuth()
  const items = useCartStore((s) => s.items)
  const clearCart = useCartStore((s) => s.clearCart)
  const { products: allProducts } = useCatalogue()

  const productById = {}
  allProducts.forEach((p) => {
    productById[p.id] = p
  })

  const subtotal = items.reduce((sum, item) => {
    const product = productById[item.productId]
    const price = product?.variants?.[item.variantId]?.price ?? 0
    return sum + price * item.quantity
  }, 0)

  const [requestId] = useState(() => {
    const id = generateRequestId()
    return isRequestIdValid(id) ? id : 'default-request-id'
  })

  const [form, setForm] = useState({
    fullName: '',
    mobile: '',
    addressLine1: '',
    addressLine2: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '',
  })
  const [errors, setErrors] = useState({})

  const [paymentMethod, setPaymentMethod] = useState(PAYMENT_METHOD.COD)
  const [loading, setLoading] = useState(false)
  const [stage, setStage] = useState('form') // 'form' | 'processing' | 'confirm' | 'paytm' | 'error'
  const [orderResult, setOrderResult] = useState(null)
  const [paytmError, setPaytmError] = useState(null)

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState([])
  const [useSavedAddress, setUseSavedAddress] = useState(null)

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const data = await fetchAddresses(user.uid)
        setSavedAddresses(data)
      } catch {} // addresses optional — checkout still works with one-time form
    }
    load()
  }, [user])

  const fillFormFromAddress = (addr) => {
    setForm({
      fullName: addr.fullName || '',
      mobile: addr.mobile || '',
      addressLine1: addr.addressLine1 || '',
      addressLine2: addr.addressLine2 || '',
      landmark: addr.landmark || '',
      city: addr.city || '',
      state: addr.state || '',
      pincode: addr.pincode || '',
    })
    setUseSavedAddress(addr.id)
  }

  if (items.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <CheckCircle2 className="mx-auto text-green-600 mb-4" size={48} />
        <h1 className="font-serif text-4xl text-brown mb-3">Your cart is empty</h1>
        <p className="text-brown-light mb-8">
          Please add products before proceeding to checkout.
        </p>
        <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
          Browse products <ArrowRight size={16} />
        </Link>
      </div>
    )
  }

  const validateForm = (f) => {
    const e = {}
    if (!f.fullName.trim()) e.fullName = 'Full name is required.'
    if (!/^\d{10}$/.test(f.mobile.trim()))
      e.mobile = 'Enter a valid 10-digit mobile number.'
    if (!f.addressLine1.trim()) e.addressLine1 = 'Address line 1 is required.'
    if (!f.city.trim()) e.city = 'City is required.'
    if (!f.state.trim()) e.state = 'State is required.'
    if (!/^\d{6}$/.test(f.pincode.trim()))
      e.pincode = 'Enter a valid 6-digit pincode.'
    return e
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const buildItemsPayload = () =>
    items.map((item) => ({
      productId: item.productId,
      variantId: item.variantId,
      quantity: item.quantity,
    }))

  const buildShippingAddress = () => {
    const addr = {
      fullName: form.fullName,
      mobile: form.mobile,
      addressLine1: form.addressLine1,
      city: form.city,
      state: form.state,
      pincode: form.pincode,
    }
    if (form.addressLine2) addr.addressLine2 = form.addressLine2
    if (form.landmark) addr.landmark = form.landmark
    return addr
  }

  // ── COD flow ──
  const handleCOD = async () => {
    setLoading(true)
    setStage('processing')
    try {
      const request = {
        requestId,
        items: buildItemsPayload(),
        shippingAddress: buildShippingAddress(),
      }
      const resp = await callCreateCodOrder(request)
      const data = resp.data || resp
      setOrderResult({
        orderId: data.orderId,
        totals: data.totals,
        paymentMethod: 'cod',
        paymentStatus: data.paymentStatus ?? 'pending',
      })
      setStage('confirm')
      toast.success('Order placed successfully (Cash on Delivery).')
    } catch (err) {
      const code = err?.code ?? ''
      const message = err?.message ?? ''

      if (code === 'unavailable' || code === 'deadline-exceeded') {
        setPaytmError(
          'The request timed out. We will check for an existing order before creating a duplicate.'
        )
        setStage('error')
        return
      }

      if (code === 'invalid-argument') {
        setErrors({ _form: message || 'Invalid request. Please check your details.' })
        return
      }

      setPaytmError(message || 'Could not place order. Please try again.')
      setStage('error')
    } finally {
      setLoading(false)
    }
  }

  // ── Paytm flow ──
  const handlePaytm = async () => {
    setLoading(true)
    setStage('processing')
    try {
      const request = {
        requestId,
        items: buildItemsPayload(),
        shippingAddress: buildShippingAddress(),
      }
      const resp = await callCreatePaytmOrder(request)
      const data = resp.data || resp

      const { mid, txnToken, amount, environment, orderId } = data

      setOrderResult({
        orderId,
        totals: data.totals,
        paymentMethod: 'paytm',
        paymentStatus: 'pending',
      })
      setStage('paytm')

      await launchPaytmCheckout({ mid, txnToken, amount, environment, orderId })
    } catch (err) {
      const code = err?.code ?? ''
      const message = err?.message ?? ''

      if (code === 'unavailable' || code === 'deadline-exceeded') {
        setPaytmError(
          'The payment request timed out. We will check for an existing order before retrying.'
        )
        setStage('error')
        return
      }

      setPaytmError(message || 'Could not initiate payment. Please try again.')
      setStage('error')
    } finally {
      setLoading(false)
    }
  }

  // Launch Paytm CheckoutJS from the environment host returned by backend
  const launchPaytmCheckout = async ({ mid, txnToken, amount, environment, orderId }) => {
    return new Promise((resolve, reject) => {
      const scriptId = 'paytm-checkoutjs'
      let script = document.getElementById(scriptId)

      if (!script) {
        script = document.createElement('script')
        script.id = scriptId
        script.async = true
        script.crossOrigin = 'anonymous'
        // Correct environment host per guide — no merchant secrets in React
        script.src =
          environment === 'TEST' || environment === 'staging'
            ? 'https://securegw-stage.paytm.in/theia/paytmCheckout'
            : 'https://securegw.paytm.in/theia/paytmCheckout'
        document.head.appendChild(script)
      }

      script.onload = () => {
        try {
          const checkout = window.PaytmCheckout || window.paytmCheckout
          if (!checkout) {
            reject(new Error('Paytm CheckoutJS not available'))
            return
          }

          checkout
            .initiateTransaction({ mid, orderId, txnToken, amount })
            .then((response) => {
              // Callback / redirect is NOT proof of payment — always verify
              setOrderResult((prev) => ({
                ...prev,
                paymentStatus: 'pending',
              }))
              resolve(response)
            })
            .catch((err) => {
              // Closing checkout / user cancellation — not proof of failure
              reject(err)
            })
        } catch (err) {
          reject(err)
        }
      }

      script.onerror = () => {
        reject(new Error('Failed to load Paytm CheckoutJS'))
      }
    })
  }

  // Verify Paytm payment with backend (owner-only callable)
  const handleVerifyPayment = async () => {
    if (!orderResult?.orderId) return
    setLoading(true)
    try {
      const resp = await callVerifyPaytmPayment({ orderId: orderResult.orderId })
      const data = resp.data || resp
      const { status, paymentStatus, ok } = data

      // Known staging issue: functions/data-loss — could not be authenticated
      if (!ok || status === 'data-loss' || paymentStatus === 'data-loss') {
        setPaytmError(
          'We could not verify payment yet; check again. Please use "Check Payment Status" below.'
        )
        setStage('error')
        return
      }

      setOrderResult((prev) => ({
        ...prev,
        status,
        paymentStatus: paymentStatus ?? status,
      }))

      if (paymentStatus === 'paid' || status === 'confirmed') {
        setStage('confirm')
        toast.success('Payment verified. Order confirmed.')
        clearCart()
      } else if (paymentStatus === 'failed') {
        setStage('error')
        setPaytmError(
          'Payment failed. Please contact support if money was deducted.'
        )
      } else {
        setStage('error')
        setPaytmError(
          'Payment is still being verified. Please check again shortly.'
        )
      }
    } catch (err) {
      setPaytmError(
        err?.message ||
          'Verification failed. Please try again or contact support.'
      )
      setStage('error')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const nextErrors = validateForm(form)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      toast.error('Please fix the highlighted details.')
      return
    }

    if (paymentMethod === PAYMENT_METHOD.COD) {
      handleCOD()
    } else {
      handlePaytm()
    }
  }

  const handleRetry = () => {
    setPaytmError(null)
    setStage('form')
    setLoading(false)
  }

  const isPaytmPending =
    stage === 'paytm' ||
    (stage === 'processing' && paymentMethod === PAYMENT_METHOD.PAYTM)

  return (
    <>
      <Helmet>
        <title>
          {stage === 'confirm' ? 'Order Confirmed' : 'Checkout'} — Vatvruksha
          Spiritual Vastu Bhandar
        </title>
        <meta
          name="description"
          content={stage === 'confirm'
            ? 'Your order has been confirmed.'
            : 'Place your order with Cash on Delivery or Paytm.'}
        />
      </Helmet>

      {/* ── Confirmation screen ── */}
      {stage === 'confirm' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <CheckCircle2 className="mx-auto text-green-600 mb-6" size={64} />
          <h1 className="font-serif text-4xl text-brown mb-3">
            Order Confirmed 🙏
          </h1>
          <p className="text-brown-light mb-8">
            Thank you for your order. Your order ID is{' '}
            <span className="font-mono font-semibold text-maroon">
              {orderResult?.orderId}
            </span>
          </p>

          <div className="bg-white rounded-2xl border border-cream-dark p-8 inline-block text-left">
            <div className="space-y-4 text-sm">
              <div className="flex justify-between text-brown-light">
                <span>Order ID</span>
                <span className="font-mono font-semibold">
                  {orderResult?.orderId}
                </span>
              </div>
              <div className="flex justify-between text-brown-light">
                <span>Payment method</span>
                <span>
                  {orderResult?.paymentMethod === 'cod'
                    ? 'Cash on Delivery'
                    : 'Paytm'}
                </span>
              </div>
              <div className="flex justify-between text-brown-light">
                <span>Payment status</span>
                <span className="font-medium">
                  {orderResult?.paymentStatus === 'pending'
                    ? 'Pending (cash to collect)'
                    : orderResult?.paymentStatus === 'paid'
                    ? 'Paid'
                    : orderResult?.paymentStatus}
                </span>
              </div>
              <div className="border-t border-cream-dark pt-4 flex justify-between text-base font-bold text-brown">
                <span>Total (from server)</span>
                <span>
                  {orderResult?.totals?.total != null
                    ? formatINR(orderResult.totals.total)
                    : '—'}
                </span>
              </div>
            </div>
          </div>

          <p className="mt-6 text-xs text-brown-light">
            Save your order ID for reference. COD orders are confirmed while
            payment remains pending until cash is collected.
          </p>

          <div className="mt-10">
            <Link to="/shop" className="btn-primary inline-flex items-center gap-2">
              Continue Shopping <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* ── Error screen ── */}
      {stage === 'error' && (
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="bg-white rounded-2xl border border-cream-dark p-8 text-center">
            <AlertCircle className="mx-auto text-red-600 mb-6" size={48} />
            <h2 className="font-serif text-2xl text-brown mb-2">
              Something went wrong
            </h2>
            <p className="text-brown-light mb-6">{paytmError}</p>
            {orderResult?.orderId && (
              <div className="mb-6 text-left bg-maroon-50 rounded-xl p-4 text-sm">
                <p className="font-semibold text-maroon mb-2">
                  Your order may already exist: {orderResult.orderId}
                </p>
                <p className="text-brown-light">
                  We will check for an existing order before creating a duplicate.
                </p>
              </div>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleRetry}
                className="btn-primary inline-flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} /> Try Again
              </button>
              {paymentMethod === PAYMENT_METHOD.PAYTM && (
                <button
                  onClick={handleVerifyPayment}
                  disabled={loading || !orderResult?.orderId}
                  className="btn-gold inline-flex items-center justify-center gap-2"
                >
                  <ArrowRight size={16} /> Check Payment Status
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Paytm pending screen ── */}
      {isPaytmPending && (
        <div className="max-w-md mx-auto px-4 py-16">
          <div className="bg-white rounded-2xl border border-cream-dark p-8 text-center">
            <Loader2 className="mx-auto text-maroon mb-6 animate-spin" size={32} />
            <h2 className="font-serif text-2xl text-brown mb-3">
              Redirecting to Paytm…
            </h2>
            <p className="text-brown-light mb-6">
              Please complete the payment on the Paytm page. Do not close this
              tab until you return.
            </p>
            <p className="text-xs text-brown-light">
              Order: {orderResult?.orderId}
            </p>
          </div>
        </div>
      )}

      {/* ── Checkout form ── */}
      {stage === 'form' && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 lg:py-14">
          <div className="bg-cream-dark border-b border-cream-darker">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <nav aria-label="Breadcrumb" className="text-xs text-brown-light">
                <Link to="/" className="hover:text-maroon">Home</Link>
                <span className="mx-2">›</span>
                <Link to="/cart" className="hover:text-maroon">Cart</Link>
                <span className="mx-2">›</span>
                <span className="text-brown font-medium">Checkout</span>
              </nav>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-8">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-dark p-6 md:p-8 shadow-sm space-y-6">
              <h1 className="font-serif text-3xl text-brown mb-2">Checkout</h1>
              <p className="text-brown-light text-sm">
                Please verify your shipping details before placing your order.
              </p>

              {/* Payment method */}
              <div className="border border-cream-dark rounded-xl p-4 bg-cream/40">
                <p className="text-sm font-medium text-brown mb-3">
                  Payment method
                </p>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.COD}
                      checked={paymentMethod === PAYMENT_METHOD.COD}
                      onChange={() => setPaymentMethod(PAYMENT_METHOD.COD)}
                      className="accent-maroon rounded"
                    />
                    Cash on Delivery
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={PAYMENT_METHOD.PAYTM}
                      checked={paymentMethod === PAYMENT_METHOD.PAYTM}
                      onChange={() => setPaymentMethod(PAYMENT_METHOD.PAYTM)}
                      className="accent-maroon rounded"
                    />
                    Paytm
                  </label>
                </div>
                {paymentMethod === PAYMENT_METHOD.COD && (
                  <p className="mt-2 text-xs text-brown-light">
                    Cash collected on delivery. Order is confirmed while payment remains pending.
                  </p>
                )}
                {paymentMethod === PAYMENT_METHOD.PAYTM && (
                  <p className="mt-2 text-xs text-brown-light">
                    You will be redirected to Paytm to complete payment. Order total is confirmed by the server.
                  </p>
                )}
              </div>

              {/* Saved address selection */}
              {user && savedAddresses.length > 0 && (
                <div className="mt-6 border border-cream-dark rounded-xl p-4 bg-cream/40">
                  <p className="text-sm font-medium text-brown mb-3">Delivery address</p>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer border border-cream-dark rounded-xl p-3 hover:bg-maroon-50 transition-colors">
                      <input
                        type="radio"
                        name="addressSource"
                        value="one-time"
                        checked={useSavedAddress === null}
                        onChange={() => setUseSavedAddress(null)}
                        className="accent-maroon rounded"
                      />
                      <span>Enter a new address</span>
                    </label>
                    {savedAddresses.map((addr) => (
                      <label
                        key={addr.id}
                        className="flex items-center gap-2 cursor-pointer border border-cream-dark rounded-xl p-3 hover:bg-maroon-50 transition-colors"
                      >
                        <input
                          type="radio"
                          name="addressSource"
                          value={addr.id}
                          checked={useSavedAddress === addr.id}
                          onChange={() => fillFormFromAddress(addr)}
                          className="accent-maroon rounded"
                        />
                        <div>
                          <p className="text-sm font-medium text-brown">
                            {addr.fullName}
                          </p>
                          <p className="text-xs text-brown-light">
                            {addr.addressLine1}, {addr.city}, {addr.state} - {addr.pincode}
                          </p>
                          {addr.isDefault && (
                            <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded">
                              Default
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    value={form.fullName}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 py-2.5 ${
                      errors.fullName ? 'border-red-400' : 'border-cream-dark'
                    }`}
                    required
                  />
                  {errors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{errors.fullName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    Mobile Number
                  </label>
                  <input
                    id="mobile"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 py-2.5 ${
                      errors.mobile ? 'border-red-400' : 'border-cream-dark'
                    }`}
                    required
                  />
                  {errors.mobile && (
                    <p className="mt-1 text-xs text-red-600">{errors.mobile}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  Address Line 1
                </label>
                <input
                  id="addressLine1"
                  name="addressLine1"
                  value={form.addressLine1}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 ${
                    errors.addressLine1 ? 'border-red-400' : 'border-cream-dark'
                  }`}
                  required
                />
                {errors.addressLine1 && (
                  <p className="mt-1 text-xs text-red-600">{errors.addressLine1}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  Address Line 2 (optional)
                </label>
                <input
                  id="addressLine2"
                  name="addressLine2"
                  value={form.addressLine2}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2.5 border-cream-dark"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  Landmark (optional)
                </label>
                <input
                  id="landmark"
                  name="landmark"
                  value={form.landmark}
                  onChange={handleChange}
                  className="w-full rounded-xl border px-3 py-2.5 border-cream-dark"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    City
                  </label>
                  <input
                    id="city"
                    name="city"
                    value={form.city}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 py-2.5 ${
                      errors.city ? 'border-red-400' : 'border-cream-dark'
                    }`}
                    required
                  />
                  {errors.city && (
                    <p className="mt-1 text-xs text-red-600">{errors.city}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-brown mb-1">
                    State
                  </label>
                  <input
                    id="state"
                    name="state"
                    value={form.state}
                    onChange={handleChange}
                    className={`w-full rounded-xl border px-3 py-2.5 ${
                      errors.state ? 'border-red-400' : 'border-cream-dark'
                    }`}
                    required
                  />
                  {errors.state && (
                    <p className="mt-1 text-xs text-red-600">{errors.state}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-brown mb-1">
                  Pincode
                </label>
                <input
                  id="pincode"
                  name="pincode"
                  value={form.pincode}
                  onChange={handleChange}
                  className={`w-full rounded-xl border px-3 py-2.5 ${
                    errors.pincode ? 'border-red-400' : 'border-cream-dark'
                  }`}
                  required
                />
                {errors.pincode && (
                  <p className="mt-1 text-xs text-red-600">{errors.pincode}</p>
                )}
              </div>

              <p className="text-xs text-brown-light">
                Order total will be confirmed by the server. Shipping and COD
                fees are not yet finalised.
              </p>

              <button
                type="submit"
                disabled={loading || !isEmailVerified}
                className="btn-primary w-full py-4 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Processing…
                  </>
                ) : paymentMethod === PAYMENT_METHOD.COD ? (
                  <>
                    <ArrowRight size={16} /> Place Order (COD)
                  </>
                ) : (
                  <>
                    <ArrowRight size={16} /> Pay with Paytm
                  </>
                )}
              </button>
            </form>

            <aside className="bg-white rounded-2xl border border-cream-dark p-6 shadow-sm h-fit">
              <h2 className="font-serif text-2xl text-brown mb-4">Your Order</h2>

              <div className="space-y-3">
                {items.map((item) => {
                  const product = productById[item.productId]
                  const variant = product?.variants?.[item.variantId]
                  const price = variant?.price ?? 0
                  if (!product) return null
                  return (
                    <div
                      key={`${item.productId}-${item.variantId}`}
                      className="flex justify-between gap-3 text-sm border-b border-cream-dark pb-2"
                    >
                      <div>
                        <p className="font-medium text-brown line-clamp-1">
                          {product.name}
                        </p>
                        <p className="text-brown-light">
                          {variant?.label && variant.label !== 'default'
                            ? variant.label
                            : 'Default'}
                          × {item.quantity}
                        </p>
                      </div>
                      <span className="font-semibold text-brown">
                        {formatINR(price * item.quantity)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="mt-4 space-y-2 border-t border-cream-dark pt-4 text-sm">
                <div className="flex justify-between text-brown-light">
                  <span>Subtotal</span>
                  <span>{formatINR(subtotal)}</span>
                </div>
                <div className="flex justify-between text-brown-light">
                  <span>Shipping</span>
                  <span className="text-brown-light">To be confirmed</span>
                </div>
                <div className="flex justify-between text-base font-bold text-brown">
                  <span>Total (server-returned)</span>
                  <span>—</span>
                </div>
              </div>

              <p className="mt-4 text-xs text-brown-light">
                Totals, shipping and COD fees are returned by the server after
                checkout. Do not treat client-side subtotal as authoritative.
              </p>
            </aside>
          </div>
        </div>
      )}
    </>
  )
}
