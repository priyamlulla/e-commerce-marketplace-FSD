import './style.css'
import { setupMobileMenu } from './auth.js'
import {
  applyCoupon,
  formatPrice,
  getCartSummary,
  removeCoupon,
  removeFromCart,
  setItemQuantity,
  setupCartButton,
  showToast,
} from './cart.js'

setupMobileMenu()
setupCartButton()

const listEl = document.getElementById('cart-list')
const emptyEl = document.getElementById('empty-cart')
const summaryEl = document.getElementById('cart-summary')
const couponInput = document.getElementById('coupon-input')
const couponMessage = document.getElementById('coupon-message')
const checkoutBtn = document.getElementById('checkout-btn')

function renderCart() {
  const summary = getCartSummary('standard')
  const { lines, subtotal, discount, shipping, total, coupon } = summary

  emptyEl.classList.toggle('hidden', lines.length > 0)
  summaryEl.classList.toggle('hidden', lines.length === 0)
  listEl.classList.toggle('hidden', lines.length === 0)

  if (!lines.length) {
    listEl.innerHTML = ''
    return
  }

  listEl.innerHTML = lines
    .map(
      (item) => `
        <article class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center" data-id="${item.id}">
          <img src="${item.image}" alt="${item.name}" class="h-28 w-full rounded-xl object-cover sm:h-24 sm:w-24" />
          <div class="min-w-0 flex-1">
            <p class="text-xs font-medium uppercase tracking-wide text-indigo-600">${item.category}</p>
            <h2 class="mt-1 font-semibold text-slate-900">${item.name}</h2>
            <p class="mt-1 text-sm text-slate-600">Unit price: ${formatPrice(item.price)}</p>
            <p class="mt-1 text-sm font-semibold text-slate-900">Subtotal: ${formatPrice(item.lineTotal)}</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <div class="flex items-center rounded-lg border border-slate-300">
              <button type="button" class="qty-decrease px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" aria-label="Decrease quantity">−</button>
              <span class="w-8 text-center text-sm">${item.quantity}</span>
              <button type="button" class="qty-increase px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" aria-label="Increase quantity">+</button>
            </div>
            <button type="button" class="remove-item rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50">Remove</button>
          </div>
        </article>
      `,
    )
    .join('')

  document.getElementById('summary-subtotal').textContent = formatPrice(subtotal)
  document.getElementById('summary-shipping').textContent = shipping === 0 ? 'Free' : formatPrice(shipping)
  document.getElementById('summary-discount').textContent = discount ? `− ${formatPrice(discount)}` : formatPrice(0)
  document.getElementById('summary-total').textContent = formatPrice(total)
  couponInput.value = coupon
  if (coupon === 'SHOP10') {
    couponMessage.textContent = 'SHOP10 applied: 10% off.'
    couponMessage.className = 'mt-2 text-sm text-green-700'
  } else if (coupon === 'FLAT100') {
    couponMessage.textContent = 'FLAT100 applied: ₹100 off.'
    couponMessage.className = 'mt-2 text-sm text-green-700'
  } else {
    couponMessage.textContent = 'Try SHOP10 (10% off) or FLAT100 (₹100 off).'
    couponMessage.className = 'mt-2 text-sm text-slate-500'
  }
}

listEl.addEventListener('click', (event) => {
  const card = event.target.closest('article[data-id]')
  if (!card) return
  const id = card.dataset.id
  const item = getCartSummary().lines.find((line) => line.id === id)
  if (!item) return

  if (event.target.closest('.qty-increase')) {
    setItemQuantity(id, item.quantity + 1)
    renderCart()
  }

  if (event.target.closest('.qty-decrease')) {
    setItemQuantity(id, item.quantity - 1)
    renderCart()
  }

  if (event.target.closest('.remove-item')) {
    removeFromCart(id)
    showToast(`${item.name} removed from cart`)
    renderCart()
  }
})

document.getElementById('apply-coupon').addEventListener('click', () => {
  const result = applyCoupon(couponInput.value)
  couponMessage.textContent = result.ok ? `${result.code} applied.` : result.message
  couponMessage.className = result.ok ? 'mt-2 text-sm text-green-700' : 'mt-2 text-sm text-red-600'
  if (result.ok) renderCart()
})

document.getElementById('remove-coupon').addEventListener('click', () => {
  removeCoupon()
  couponInput.value = ''
  couponMessage.textContent = ''
  renderCart()
})

checkoutBtn.addEventListener('click', () => {
  if (!getCartSummary().lines.length) {
    showToast('Your cart is empty')
    return
  }
  window.location.href = 'checkout.html'
})

renderCart()
