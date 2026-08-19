import './style.css'
import { setupMobileMenu } from './auth.js'
import { addToCart, formatPrice, setupCartButton } from './cart.js'
import { getProductById } from './products-data.js'

setupMobileMenu()
setupCartButton()

const params = new URLSearchParams(window.location.search)
const product = getProductById(params.get('id'))
const detailsRoot = document.getElementById('details-root')
const missingRoot = document.getElementById('missing-root')

if (!product) {
  detailsRoot.classList.add('hidden')
  missingRoot.classList.remove('hidden')
} else {
  document.title = `${product.name} | ShopSphere`
  document.getElementById('crumb-name').textContent = product.name
  document.getElementById('product-image').src = product.image
  document.getElementById('product-image').alt = product.name
  document.getElementById('product-category').textContent = product.category
  document.getElementById('product-name').textContent = product.name
  document.getElementById('product-rating').textContent = `★ ${product.rating}`
  document.getElementById('product-price').textContent = formatPrice(product.price)
  document.getElementById('product-stock').textContent = product.stock
  document.getElementById('product-desc').textContent = product.description
  document.getElementById('product-delivery').textContent = product.delivery

  const stockEl = document.getElementById('product-stock')
  stockEl.className = 'inline-block rounded-full px-2.5 py-1 text-xs font-semibold'
  if (product.stock === 'In Stock') stockEl.classList.add('bg-green-50', 'text-green-700')
  else if (product.stock === 'Low Stock') stockEl.classList.add('bg-amber-50', 'text-amber-700')
  else stockEl.classList.add('bg-red-50', 'text-red-700')

  document.getElementById('product-info').innerHTML = product.info
    .map((item) => `<li>${item}</li>`)
    .join('')

  document.getElementById('product-reviews').innerHTML = product.reviews
    .map(
      (review) => `
        <article class="rounded-xl border border-slate-200 bg-white p-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <p class="font-semibold text-slate-900">${review.name}</p>
            <p class="text-sm text-slate-500">${review.date}</p>
          </div>
          <p class="mt-1 text-sm text-amber-600">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</p>
          <p class="mt-2 text-sm text-slate-600">${review.comment}</p>
        </article>
      `,
    )
    .join('')

  const qtyInput = document.getElementById('quantity')
  const decreaseBtn = document.getElementById('qty-decrease')
  const increaseBtn = document.getElementById('qty-increase')
  const addBtn = document.getElementById('details-add-cart')
  const buyBtn = document.getElementById('details-buy-now')
  const outOfStock = product.stock === 'Out of Stock'

  if (outOfStock) {
    addBtn.disabled = true
    buyBtn.disabled = true
    qtyInput.disabled = true
    decreaseBtn.disabled = true
    increaseBtn.disabled = true
  }

  function currentQty() {
    const value = Number(qtyInput.value)
    return Number.isFinite(value) && value > 0 ? value : 1
  }

  decreaseBtn.addEventListener('click', () => {
    qtyInput.value = String(Math.max(1, currentQty() - 1))
  })

  increaseBtn.addEventListener('click', () => {
    qtyInput.value = String(Math.min(10, currentQty() + 1))
  })

  addBtn.addEventListener('click', () => {
    addToCart(product.id, currentQty())
  })

  buyBtn.addEventListener('click', () => {
    addToCart(product.id, currentQty())
    window.location.href = 'checkout.html'
  })
}
