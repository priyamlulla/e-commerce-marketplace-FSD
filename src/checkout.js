import './style.css'
import { isValidEmail, setFieldError, setupMobileMenu } from './auth.js'
import {
  clearCart,
  formatPrice,
  getCartSummary,
  saveOrder,
  setupCartButton,
} from './cart.js'

setupMobileMenu()
setupCartButton()

const form = document.getElementById('checkout-form')
const checkoutRoot = document.getElementById('checkout-root')
const emptyRoot = document.getElementById('empty-checkout')
const confirmRoot = document.getElementById('confirm-root')

function selectedDelivery() {
  const selected = document.querySelector('input[name="delivery"]:checked')
  return selected ? selected.value : 'standard'
}

function renderSummary() {
  const summary = getCartSummary(selectedDelivery())
  const list = document.getElementById('summary-products')
  list.innerHTML = summary.lines
    .map(
      (item) => `
        <div class="flex items-start justify-between gap-3 text-sm">
          <div>
            <p class="font-medium text-slate-900">${item.name}</p>
            <p class="text-slate-500">Qty ${item.quantity}</p>
          </div>
          <p class="font-medium text-slate-900">${formatPrice(item.lineTotal)}</p>
        </div>
      `,
    )
    .join('')

  document.getElementById('summary-subtotal').textContent = formatPrice(summary.subtotal)
  document.getElementById('summary-shipping').textContent =
    summary.shipping === 0 ? 'Free' : formatPrice(summary.shipping)
  document.getElementById('summary-discount').textContent = summary.discount
    ? `− ${formatPrice(summary.discount)}`
    : formatPrice(0)
  document.getElementById('summary-total').textContent = formatPrice(summary.total)
  return summary
}

if (!getCartSummary().lines.length) {
  checkoutRoot.classList.add('hidden')
  emptyRoot.classList.remove('hidden')
} else {
  renderSummary()
  document.querySelectorAll('input[name="delivery"]').forEach((input) => {
    input.addEventListener('change', renderSummary)
  })
}

if (form) {
  form.addEventListener('submit', (event) => {
  event.preventDefault()
  const summary = renderSummary()
  if (!summary.lines.length) return

  const nameInput = document.getElementById('full-name')
  const emailInput = document.getElementById('email')
  const phoneInput = document.getElementById('phone')
  const addressInput = document.getElementById('address')
  const cityInput = document.getElementById('city')
  const stateInput = document.getElementById('state')
  const pinInput = document.getElementById('pin')
  const paymentError = document.getElementById('payment-error')
  const payment = document.querySelector('input[name="payment"]:checked')

  let isValid = true

  if (!nameInput.value.trim()) {
    setFieldError(nameInput, document.getElementById('name-error'), 'Full name is required.')
    isValid = false
  } else {
    setFieldError(nameInput, document.getElementById('name-error'), '')
  }

  if (!emailInput.value.trim()) {
    setFieldError(emailInput, document.getElementById('email-error'), 'Email is required.')
    isValid = false
  } else if (!isValidEmail(emailInput.value.trim())) {
    setFieldError(emailInput, document.getElementById('email-error'), 'Enter a valid email address.')
    isValid = false
  } else {
    setFieldError(emailInput, document.getElementById('email-error'), '')
  }

  if (!/^[0-9]{10}$/.test(phoneInput.value.trim())) {
    setFieldError(phoneInput, document.getElementById('phone-error'), 'Enter a 10-digit phone number.')
    isValid = false
  } else {
    setFieldError(phoneInput, document.getElementById('phone-error'), '')
  }

  if (!addressInput.value.trim()) {
    setFieldError(addressInput, document.getElementById('address-error'), 'Address is required.')
    isValid = false
  } else {
    setFieldError(addressInput, document.getElementById('address-error'), '')
  }

  if (!cityInput.value.trim()) {
    setFieldError(cityInput, document.getElementById('city-error'), 'City is required.')
    isValid = false
  } else {
    setFieldError(cityInput, document.getElementById('city-error'), '')
  }

  if (!stateInput.value.trim()) {
    setFieldError(stateInput, document.getElementById('state-error'), 'State is required.')
    isValid = false
  } else {
    setFieldError(stateInput, document.getElementById('state-error'), '')
  }

  if (!/^[0-9]{6}$/.test(pinInput.value.trim())) {
    setFieldError(pinInput, document.getElementById('pin-error'), 'Enter a 6-digit PIN code.')
    isValid = false
  } else {
    setFieldError(pinInput, document.getElementById('pin-error'), '')
  }

  if (!payment) {
    paymentError.textContent = 'Select a payment method.'
    isValid = false
  } else {
    paymentError.textContent = ''
  }

  if (!isValid) return

  const orderId = `SS${Date.now().toString().slice(-8)}`
  const deliveryLabel = selectedDelivery() === 'express' ? 'Express Delivery' : 'Standard Delivery'
  const estimate = selectedDelivery() === 'express' ? '1–2 business days' : '3–5 business days'
  const paymentLabel =
    payment.value === 'cod' ? 'Cash on Delivery' : payment.value === 'upi' ? 'UPI' : 'Card'

  const order = {
    id: orderId,
    createdAt: new Date().toISOString(),
    customer: nameInput.value.trim(),
    email: emailInput.value.trim(),
    total: summary.total,
    delivery: deliveryLabel,
    estimate,
    payment: paymentLabel,
    items: summary.lines.map((item) => ({ name: item.name, quantity: item.quantity })),
  }

  saveOrder(order)
  clearCart()

  document.getElementById('confirm-id').textContent = orderId
  document.getElementById('confirm-total').textContent = formatPrice(order.total)
  document.getElementById('confirm-estimate').textContent = estimate
  checkoutRoot.classList.add('hidden')
  confirmRoot.classList.remove('hidden')
  window.scrollTo({ top: 0, behavior: 'smooth' })
  })
}
