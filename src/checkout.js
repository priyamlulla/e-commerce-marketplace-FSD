import './style.css'
import { isValidEmail, setFieldError, setupMobileMenu } from './auth.js'
import {
  clearCart,
  formatPrice,
  getCartSummary,
  saveLocalDemoOrder,
  setupCartButton,
} from './cart.js'

setupMobileMenu()
setupCartButton()

const form = document.getElementById('checkout-form')
const checkoutRoot = document.getElementById('checkout-root')
const emptyRoot = document.getElementById('empty-checkout')
const confirmRoot = document.getElementById('confirm-root')
const submitButton = form.querySelector('button[type="submit"]')
const CHECKOUT_KEY = 'shopsphere-checkout-idempotency-key'

function getIdempotencyKey() {
  let key = sessionStorage.getItem(CHECKOUT_KEY)
  if (!key) {
    key = crypto.randomUUID()
    sessionStorage.setItem(CHECKOUT_KEY, key)
  }
  return key
}

function selectedDelivery() {
  return document.querySelector('input[name="delivery"]:checked')?.value || 'standard'
}

function renderSummary() {
  const summary = getCartSummary(selectedDelivery())
  const list = document.getElementById('summary-products')
  list.replaceChildren(...summary.lines.map((item) => {
    const row = document.createElement('div')
    row.className = 'flex items-start justify-between gap-3 text-sm'
    const details = document.createElement('div')
    const name = document.createElement('p')
    name.className = 'font-medium text-slate-900'
    name.textContent = item.name
    const quantity = document.createElement('p')
    quantity.className = 'text-slate-500'
    quantity.textContent = `Qty ${item.quantity}`
    details.append(name, quantity)
    const price = document.createElement('p')
    price.className = 'font-medium text-slate-900'
    price.textContent = formatPrice(item.lineTotal)
    row.append(details, price)
    return row
  }))

  document.getElementById('summary-subtotal').textContent = formatPrice(summary.subtotal)
  document.getElementById('summary-shipping').textContent = summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)
  document.getElementById('summary-discount').textContent = summary.discount ? `− ${formatPrice(summary.discount)}` : formatPrice(0)
  document.getElementById('summary-total').textContent = formatPrice(summary.total)
  return summary
}

function showFormError(message) {
  const status = document.getElementById('checkout-status')
  status.textContent = message
  status.classList.remove('hidden')
}

function submitOrder(event) {
  event.preventDefault()
  const summary = renderSummary()
  if (!summary.lines.length) return
  if (!summary.canPlaceDemoOrder) {
    showFormError('Remove unavailable items and correct invalid quantities before placing a local demo order.')
    return
  }

  const nameInput = document.getElementById('full-name')
  const emailInput = document.getElementById('email')
  const phoneInput = document.getElementById('phone')
  const addressInput = document.getElementById('address')
  const cityInput = document.getElementById('city')
  const stateInput = document.getElementById('state')
  const pinInput = document.getElementById('pin')
  const countryInput = document.getElementById('country')
  const paymentError = document.getElementById('payment-error')
  const payment = document.querySelector('input[name="payment"]:checked')
  let valid = true

  if (!nameInput.value.trim()) {
    setFieldError(nameInput, document.getElementById('name-error'), 'Full name is required.')
    valid = false
  } else setFieldError(nameInput, document.getElementById('name-error'), '')

  if (!isValidEmail(emailInput.value.trim())) {
    setFieldError(emailInput, document.getElementById('email-error'), 'Enter a valid email address.')
    valid = false
  } else setFieldError(emailInput, document.getElementById('email-error'), '')

  if (!/^[0-9]{10}$/.test(phoneInput.value.trim())) {
    setFieldError(phoneInput, document.getElementById('phone-error'), 'Enter a 10-digit phone number.')
    valid = false
  } else setFieldError(phoneInput, document.getElementById('phone-error'), '')

  for (const [input, errorId, label] of [
    [addressInput, 'address-error', 'Address'],
    [cityInput, 'city-error', 'City'],
    [stateInput, 'state-error', 'State'],
    [countryInput, 'country-error', 'Country'],
  ]) {
    if (!input.value.trim()) {
      setFieldError(input, document.getElementById(errorId), `${label} is required.`)
      valid = false
    } else setFieldError(input, document.getElementById(errorId), '')
  }

  if (!/^[0-9A-Za-z -]{3,20}$/.test(pinInput.value.trim())) {
    setFieldError(pinInput, document.getElementById('pin-error'), 'Enter a valid postal code.')
    valid = false
  } else setFieldError(pinInput, document.getElementById('pin-error'), '')

  paymentError.textContent = payment ? '' : 'Select a payment method.'
  if (!payment) valid = false
  if (!valid) return

  submitButton.disabled = true
  submitButton.textContent = 'Saving demo order…'
  document.getElementById('checkout-status').classList.add('hidden')

  try {
    const deliveryMethod = selectedDelivery()
    const order = saveLocalDemoOrder({
      id: `LOCAL-${crypto.randomUUID()}`,
      idempotencyKey: getIdempotencyKey(),
      createdAt: new Date().toISOString(),
      customer: nameInput.value.trim(),
      email: emailInput.value.trim(),
      phone: phoneInput.value.trim(),
      items: summary.lines.map((item) => ({
        id: item.id,
        name: item.name,
        category: item.category,
        image: item.image,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.lineTotal,
        stockLabel: item.stockLabel,
        inventoryMode: item.inventoryMode || 'unknown',
      })),
      subtotal: summary.subtotal,
      discount: summary.discount,
      shipping: summary.shipping,
      total: summary.total,
      address: {
        line1: addressInput.value.trim(),
        city: cityInput.value.trim(),
        state: stateInput.value.trim(),
        postalCode: pinInput.value.trim(),
        country: countryInput.value.trim(),
      },
      deliveryMethod,
      delivery: deliveryMethod === 'express' ? 'Express Delivery' : 'Standard Delivery',
      paymentMethod: payment.value,
      paymentStatus: 'pending',
      orderStatus: 'local_demo_pending',
      inventoryReserved: false,
      storage: 'browser_local_demo',
    })

    clearCart()
    sessionStorage.removeItem(CHECKOUT_KEY)
    document.getElementById('confirm-id').textContent = order.id
    document.getElementById('confirm-total').textContent = formatPrice(order.total)
    document.getElementById('confirm-estimate').textContent = 'Local demo only — inventory not reserved'
    checkoutRoot.classList.add('hidden')
    confirmRoot.classList.remove('hidden')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (error) {
    showFormError(error.message || 'Unable to save the local demo order. Your cart has not been intentionally cleared.')
  } finally {
    submitButton.disabled = false
    submitButton.textContent = 'Place Demo Order'
  }
}

function initializeCheckout() {
  const summary = getCartSummary()
  if (!summary.lines.length) {
    checkoutRoot.classList.add('hidden')
    emptyRoot.classList.remove('hidden')
    return
  }

  renderSummary()
  if (!summary.canPlaceDemoOrder) {
    showFormError('This cart contains an unavailable item or invalid quantity. Remove it before placing a local demo order.')
    submitButton.disabled = true
  }

  document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener('change', renderSummary)
  })
  form.addEventListener('submit', submitOrder)
}

initializeCheckout()
