import { getProductById, products } from './products-data.js'

let toastTimer

export function formatPrice(value) {
  return `₹${Number(value).toLocaleString('en-IN')}`
}

export function showToast(message) {
  const toastEl = document.getElementById('toast')
  if (!toastEl) return

  toastEl.textContent = message
  toastEl.classList.remove('hidden')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => {
    toastEl.classList.add('hidden')
  }, 2200)
}

const ITEMS_KEY = 'shopsphere-cart-items'
const COUPON_KEY = 'shopsphere-cart-coupon'
const ORDERS_KEY = 'shopsphere-orders'

function findProduct(productIdOrName) {
  return getProductById(productIdOrName) || products.find((item) => item.name === productIdOrName)
}

export function getCartItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ITEMS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCartItems(items) {
  localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
  updateCartBadge()
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + Number(item.quantity || 0), 0)
}

export function getCartProducts() {
  return getCartItems()
    .map((item) => {
      const product = getProductById(item.id)
      if (!product) return null
      return {
        ...product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
      }
    })
    .filter(Boolean)
}

export function addToCart(productIdOrName, quantity = 1) {
  const product = findProduct(productIdOrName)
  if (!product || product.stock === 'Out of Stock') return

  const qtyToAdd = Math.max(1, Number(quantity) || 1)
  const items = getCartItems()
  const existing = items.find((item) => item.id === product.id)

  if (existing) {
    existing.quantity = Math.min(10, existing.quantity + qtyToAdd)
  } else {
    items.push({ id: product.id, quantity: Math.min(10, qtyToAdd) })
  }

  saveCartItems(items)
  showToast(`${product.name} added to cart`)
}

export function setItemQuantity(productId, quantity) {
  const nextQty = Math.max(1, Math.min(10, Number(quantity) || 1))
  const items = getCartItems().map((item) =>
    item.id === productId ? { ...item, quantity: nextQty } : item,
  )
  saveCartItems(items)
}

export function removeFromCart(productId) {
  saveCartItems(getCartItems().filter((item) => item.id !== productId))
}

export function clearCart() {
  saveCartItems([])
  localStorage.removeItem(COUPON_KEY)
}

export function getCoupon() {
  return localStorage.getItem(COUPON_KEY) || ''
}

export function applyCoupon(code) {
  const normalized = code.trim().toUpperCase()
  if (normalized === 'SHOP10' || normalized === 'FLAT100') {
    localStorage.setItem(COUPON_KEY, normalized)
    return { ok: true, code: normalized }
  }
  return { ok: false, message: 'Enter SHOP10 or FLAT100 to apply a demo coupon.' }
}

export function removeCoupon() {
  localStorage.removeItem(COUPON_KEY)
}

export function getShippingCost(subtotal, method = 'standard') {
  if (method === 'express') return 149
  return subtotal >= 499 ? 0 : 49
}

export function getDiscount(subtotal, coupon = getCoupon()) {
  if (coupon === 'SHOP10') return Math.round(subtotal * 0.1)
  if (coupon === 'FLAT100') return Math.min(100, subtotal)
  return 0
}

export function getCartSummary(method = 'standard') {
  const lines = getCartProducts()
  const subtotal = lines.reduce((sum, item) => sum + item.lineTotal, 0)
  const discount = getDiscount(subtotal)
  const shipping = lines.length ? getShippingCost(subtotal, method) : 0
  const total = Math.max(0, subtotal - discount + shipping)
  return { lines, subtotal, discount, shipping, total, coupon: getCoupon(), method }
}

export function saveOrder(order) {
  const orders = getOrders()
  orders.unshift(order)
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders))
}

export function getOrders() {
  try {
    const parsed = JSON.parse(localStorage.getItem(ORDERS_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function updateCartBadge() {
  const cartCountEl = document.getElementById('cart-count')
  if (cartCountEl) {
    cartCountEl.textContent = String(getCartCount())
  }
}

export function setupCartButton() {
  updateCartBadge()
  const cartButton = document.getElementById('cart-button')
  if (!cartButton || cartButton.tagName === 'A') return

  cartButton.addEventListener('click', () => {
    window.location.href = 'cart.html'
  })
}
