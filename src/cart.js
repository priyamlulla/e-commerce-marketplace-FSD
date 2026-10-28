import { getCatalogProducts } from './catalog.js'

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
const LOCAL_ORDERS_KEY = 'shopsphere-orders'
function findProduct(productIdOrName) {
  return getCatalogProducts().find((item) => item.id === productIdOrName || item.name === productIdOrName)
}

function getMaximumQuantity(product) {
  return product.stockQuantityKnown
    ? Math.min(10, product.stockQuantity)
    : 10
}

function normalizeQuantity(quantity, maximum = 10) {
  if (maximum < 1) return 0
  const parsed = Number(quantity)
  const wholeNumber = Number.isFinite(parsed) ? Math.floor(parsed) : 1
  return Math.max(1, Math.min(maximum, wholeNumber))
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
      const product = getCatalogProducts().find((candidate) => candidate.id === item.id)
      if (!product) {
        return {
          id: item.id,
          name: `Unmapped cart item (${item.id})`,
          category: 'Unmapped',
          price: null,
          image: '',
          stockLabel: 'Quantity unverified',
          stockQuantity: null,
          stockQuantityKnown: false,
          inventoryMode: null,
          purchasable: false,
          quantity: item.quantity,
          lineTotal: null,
        }
      }
      return {
        ...product,
        quantity: item.quantity,
        lineTotal: product.price * item.quantity,
        quantityValid: Number.isInteger(item.quantity)
          && item.quantity >= 1
          && item.quantity <= 10
          && (!product.stockQuantityKnown || item.quantity <= product.stockQuantity),
      }
    })
}

export function addToCart(productIdOrName, quantity = 1) {
  const product = findProduct(productIdOrName)
  if (!product || product.stockLabel === 'Out of Stock' || product.stock === 'Out of Stock') return

  const maximum = getMaximumQuantity(product)
  if (maximum < 1) return
  const qtyToAdd = normalizeQuantity(quantity, maximum)
  const items = getCartItems()
  const existing = items.find((item) => item.id === product.id)

  if (existing) {
    existing.quantity = normalizeQuantity(Number(existing.quantity) + qtyToAdd, maximum)
  } else {
    items.push({ id: product.id, quantity: qtyToAdd })
  }

  saveCartItems(items)
  showToast(`${product.name} added to cart`)
}

export function setItemQuantity(productId, quantity) {
  const product = findProduct(productId)
  if (!product || product.stockLabel === 'Out of Stock' || product.stock === 'Out of Stock') return
  const maximum = getMaximumQuantity(product)
  if (maximum < 1) return
  const nextQty = normalizeQuantity(quantity, maximum)
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

export function getLocalDemoOrders() {
  const savedOrders = localStorage.getItem(LOCAL_ORDERS_KEY)
  if (savedOrders === null) return []

  let orders
  try {
    orders = JSON.parse(savedOrders)
  } catch {
    throw new Error('Saved local orders could not be read. They were left unchanged.')
  }
  if (!Array.isArray(orders)) {
    throw new Error('Saved local orders have an unsupported format. They were left unchanged.')
  }
  return orders
}

export function saveLocalDemoOrder(order) {
  if (!order?.idempotencyKey) {
    throw new Error('A checkout request key is required to save this demo order.')
  }

  const orders = getLocalDemoOrders()
  const existingOrder = orders.find((savedOrder) => savedOrder.idempotencyKey === order.idempotencyKey)
  if (existingOrder) return existingOrder

  localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify([order, ...orders]))
  return order
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
  const subtotal = lines.reduce((sum, item) => sum + (item.lineTotal || 0), 0)
  const discount = getDiscount(subtotal)
  const shipping = lines.length ? getShippingCost(subtotal, method) : 0
  const total = Math.max(0, subtotal - discount + shipping)
  return {
    lines,
    subtotal,
    discount,
    shipping,
    total,
    coupon: getCoupon(),
    method,
    canCheckout: lines.length > 0 && lines.every((item) =>
      item.purchasable && Boolean(item.databaseId) && item.quantityValid,
    ),
    canPlaceDemoOrder: lines.length > 0 && lines.every((item) =>
      item.quantityValid
      && item.stockLabel !== 'Out of Stock'
      && Number.isFinite(item.price)
      && Number.isFinite(item.lineTotal),
    ),
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
