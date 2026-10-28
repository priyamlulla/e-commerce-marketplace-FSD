import assert from 'node:assert/strict'
import { after, afterEach, test } from 'node:test'
import { products as sourceProducts } from '../products-data.js'
import { fetchProducts, getCatalogProducts } from '../catalog.js'
import {
  addToCart,
  clearCart,
  getCartCount,
  getCartProducts,
  getCartSummary,
  removeFromCart,
  saveLocalDemoOrder,
  setItemQuantity,
} from '../cart.js'

const originalFetch = globalThis.fetch
const originalStorage = globalThis.localStorage
const originalDocument = globalThis.document
const values = new Map()

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  },
})
globalThis.document = { getElementById: () => null }

afterEach(() => {
  globalThis.fetch = originalFetch
  values.clear()
})

async function loadCatalog(databaseProducts = []) {
  globalThis.fetch = async () => new Response(JSON.stringify(databaseProducts), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
  return fetchProducts()
}

test('catalog preserves all 18 original products, five categories, descriptions, images, and labels', async () => {
  const catalog = await loadCatalog()
  assert.equal(catalog.length, 18)
  assert.deepEqual([...new Set(catalog.map((product) => product.category))].sort(), [
    'Books',
    'Electronics',
    'Fashion',
    'Home & Living',
    'Sports',
  ])
  for (const original of sourceProducts) {
    const restored = catalog.find((product) => product.id === original.id)
    assert.ok(restored)
    assert.equal(restored.name, original.name)
    assert.equal(restored.price, original.price)
    assert.equal(restored.description, original.description)
    assert.equal(restored.image, original.image)
    assert.equal(restored.stockLabel, original.stock)
    assert.equal(restored.stockQuantity, null)
    assert.equal(restored.stockQuantityKnown, false)
  }
})

test('only exact catalog IDs map inventory and verified stock while preserving original labels', async () => {
  const catalog = await loadCatalog([{
    _id: '507f1f77bcf86cd799439011',
    catalogId: 'aria-headphones',
    name: 'Admin-edited headphones',
    category: 'Electronics',
    price: 25000,
    stock: 2,
    stockVerified: true,
    stockMode: 'demo',
  }, {
    _id: '507f1f77bcf86cd799439012',
    catalogId: 'nova-speaker',
    name: 'Orbit Bluetooth Speaker',
    category: 'Electronics',
    price: 1899,
    stock: 4,
    stockVerified: true,
    stockMode: 'demo',
  }, {
    _id: '507f1f77bcf86cd799439014',
    catalogId: 'pulse-smartwatch',
    name: 'Pulse Smartwatch SE',
    category: 'Electronics',
    price: 12990,
    stock: 0,
    stockVerified: true,
    stockMode: 'verified',
  }, {
    _id: '507f1f77bcf86cd799439013',
    name: 'Aria Wireless Headphones',
    stock: 50,
    stockVerified: true,
  }])
  const headphones = catalog.find((item) => item.id === 'aria-headphones')
  assert.equal(headphones.databaseId, '507f1f77bcf86cd799439011')
  assert.equal(headphones.price, 25000)
  assert.equal(headphones.stockQuantity, 2)
  assert.equal(headphones.inventoryMode, 'demo')
  assert.equal(headphones.purchasable, true)
  assert.equal(getCatalogProducts().find((item) => item.id === 'nova-speaker').stockLabel, 'Low Stock')
  assert.equal(getCatalogProducts().find((item) => item.id === 'pulse-smartwatch').stockLabel, 'Out of Stock')
  assert.equal(getCatalogProducts().find((item) => item.id === 'pulse-smartwatch').purchasable, false)
})

test('duplicate exact catalog mappings do not override the original catalog', async (t) => {
  t.mock.method(console, 'error', () => {})
  const [product] = await loadCatalog([
    { _id: '507f1f77bcf86cd799439011', catalogId: 'aria-headphones', price: 1 },
    { _id: '507f1f77bcf86cd799439012', catalogId: 'aria-headphones', price: 2 },
  ])
  const headphones = getCatalogProducts().find((item) => item.id === 'aria-headphones')
  assert.equal(product.id, 'aria-headphones')
  assert.equal(headphones.databaseId, null)
  assert.equal(headphones.price, 24990)
})

test('cart add, stock caps, badge count, totals, quantity changes, and removal work without DB links', async () => {
  await loadCatalog([
    {
      _id: '507f1f77bcf86cd799439011',
      catalogId: 'aria-headphones',
      name: 'Aria Wireless Headphones',
      category: 'Electronics',
      price: 24990,
      stock: 2,
      stockVerified: true,
    },
  ])

  addToCart('aria-headphones', 1)
  addToCart('aria-headphones', 7)
  addToCart('pulse-smartwatch', 1)
  addToCart('home-cooking', 1)
  assert.equal(getCartCount(), 3)
  assert.equal(getCartProducts().length, 2)

  setItemQuantity('aria-headphones', 20)
  const summary = getCartSummary()
  assert.equal(summary.lines.find((item) => item.id === 'aria-headphones').quantity, 2)
  assert.equal(summary.lines.find((item) => item.id === 'aria-headphones').quantityValid, true)
  assert.equal(summary.lines.find((item) => item.id === 'aria-headphones').lineTotal, 49980)
  assert.equal(summary.canCheckout, false)

  setItemQuantity('pulse-smartwatch', 0)
  assert.equal(getCartProducts().find((item) => item.id === 'pulse-smartwatch').quantity, 1)
  removeFromCart('pulse-smartwatch')
  assert.equal(getCartCount(), 2)
  assert.equal(getCartProducts().length, 1)
  clearCart()
  assert.equal(getCartCount(), 0)
})

test('original in-stock catalog items can proceed through local demo checkout without DB links', async () => {
  await loadCatalog()
  addToCart('pulse-smartwatch', 2)

  const summary = getCartSummary()
  assert.equal(summary.canCheckout, false)
  assert.equal(summary.canPlaceDemoOrder, true)
  assert.equal(summary.total, sourceProducts.find((item) => item.id === 'pulse-smartwatch').price * 2)
})

test('local demo order storage preserves older orders and deduplicates a repeated submission key', () => {
  const earlierOrder = { id: 'legacy-order', total: 499 }
  values.set('shopsphere-orders', JSON.stringify([earlierOrder]))
  const order = { id: 'LOCAL-first', idempotencyKey: 'checkout-key-1', total: 1000 }

  const firstSave = saveLocalDemoOrder(order)
  const repeatedSave = saveLocalDemoOrder({ ...order, id: 'LOCAL-duplicate' })
  const storedOrders = JSON.parse(values.get('shopsphere-orders'))

  assert.equal(firstSave.id, 'LOCAL-first')
  assert.equal(repeatedSave.id, 'LOCAL-first')
  assert.deepEqual(storedOrders.map((savedOrder) => savedOrder.id), ['LOCAL-first', 'legacy-order'])
})

test('original Out of Stock products stay unavailable even with a linked positive quantity', async () => {
  await loadCatalog([{
    _id: '507f1f77bcf86cd799439013',
    catalogId: 'home-cooking',
    name: 'Weeknight Home Cooking',
    category: 'Books',
    price: 650,
    stock: 10,
    stockVerified: true,
  }])
  const book = getCatalogProducts().find((item) => item.id === 'home-cooking')
  assert.equal(book.stockLabel, 'Out of Stock')
  assert.equal(book.purchasable, false)
  addToCart(book.id)
  assert.equal(getCartCount(), 0)
})

after(() => {
  if (originalStorage === undefined) delete globalThis.localStorage
  else Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: originalStorage })
  if (originalDocument === undefined) delete globalThis.document
  else globalThis.document = originalDocument
})
