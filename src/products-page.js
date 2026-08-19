import './style.css'
import { setupMobileMenu } from './auth.js'
import { addToCart, formatPrice, setupCartButton } from './cart.js'
import { categories, products } from './products-data.js'

setupMobileMenu()
setupCartButton()

const searchInput = document.getElementById('search-input')
const categorySelect = document.getElementById('category-filter')
const priceFilter = document.getElementById('price-filter')
const sortSelect = document.getElementById('sort-select')
const productGrid = document.getElementById('product-grid')
const productCount = document.getElementById('product-count')
const emptyState = document.getElementById('empty-state')
const categoryButtons = document.getElementById('category-buttons')

let activeCategory = 'All'

function matchesPrice(product, range) {
  if (range === 'all') return true
  if (range === '0-1000') return product.price < 1000
  if (range === '1000-5000') return product.price >= 1000 && product.price <= 5000
  if (range === '5000-15000') return product.price > 5000 && product.price <= 15000
  if (range === '15000+') return product.price > 15000
  return true
}

function getFilteredProducts() {
  const query = searchInput.value.trim().toLowerCase()
  const range = priceFilter.value
  const sort = sortSelect.value

  let list = products.filter((product) => {
    const matchesCategory = activeCategory === 'All' || product.category === activeCategory
    const matchesSearch = product.name.toLowerCase().includes(query)
    return matchesCategory && matchesSearch && matchesPrice(product, range)
  })

  if (sort === 'price-asc') list = [...list].sort((a, b) => a.price - b.price)
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.price - a.price)
  if (sort === 'rating-desc') list = [...list].sort((a, b) => b.rating - a.rating)

  return list
}

function stockClass(stock) {
  if (stock === 'In Stock') return 'text-green-700 bg-green-50'
  if (stock === 'Low Stock') return 'text-amber-700 bg-amber-50'
  return 'text-red-700 bg-red-50'
}

function renderCategoryButtons() {
  categoryButtons.innerHTML = categories
    .map((category) => {
      const isActive = category === activeCategory
      const activeClasses = isActive
        ? 'bg-indigo-600 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
      return `<button type="button" class="category-chip rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm ${activeClasses}" data-category="${category}">${category}</button>`
    })
    .join('')

  categorySelect.value = activeCategory
}

function renderProducts() {
  const list = getFilteredProducts()
  productCount.textContent = `Showing ${list.length} of ${products.length} products`
  emptyState.classList.toggle('hidden', list.length > 0)
  productGrid.classList.toggle('hidden', list.length === 0)

  productGrid.innerHTML = list
    .map((product) => {
      const outOfStock = product.stock === 'Out of Stock'
      return `
        <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-indigo-200">
          <img src="${product.image}" alt="${product.name}" class="h-48 w-full object-cover" />
          <div class="p-4">
            <p class="text-xs font-medium uppercase tracking-wide text-indigo-600">${product.category}</p>
            <h3 class="mt-1 font-semibold text-slate-900">${product.name}</h3>
            <p class="mt-1 text-sm text-amber-600">★ ${product.rating}</p>
            <p class="mt-2 text-lg font-bold text-slate-900">${formatPrice(product.price)}</p>
            <span class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${stockClass(product.stock)}">${product.stock}</span>
            <div class="mt-4 flex gap-2">
              <button type="button" data-id="${product.id}" class="add-to-cart flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300" ${outOfStock ? 'disabled' : ''}>Add to Cart</button>
              <a href="product-details.html?id=${product.id}" class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Details</a>
            </div>
          </div>
        </article>
      `
    })
    .join('')
}

function applyFilters() {
  renderCategoryButtons()
  renderProducts()
}

searchInput.addEventListener('input', renderProducts)
priceFilter.addEventListener('change', renderProducts)
sortSelect.addEventListener('change', renderProducts)

categorySelect.addEventListener('change', () => {
  activeCategory = categorySelect.value
  applyFilters()
})

categoryButtons.addEventListener('click', (event) => {
  const button = event.target.closest('.category-chip')
  if (!button) return
  activeCategory = button.dataset.category
  applyFilters()
})

productGrid.addEventListener('click', (event) => {
  const button = event.target.closest('.add-to-cart')
  if (!button || button.disabled) return
  const product = products.find((item) => item.id === button.dataset.id)
  if (product) addToCart(product.id)
})

const urlCategory = new URLSearchParams(window.location.search).get('category')
if (urlCategory && categories.includes(urlCategory)) {
  activeCategory = urlCategory
}

applyFilters()
