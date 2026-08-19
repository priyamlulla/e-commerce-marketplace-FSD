import './style.css'
import { addToCart, formatPrice, setupCartButton } from './cart.js'

setupCartButton()

const menuToggle = document.getElementById('menu-toggle')
const mobileMenu = document.getElementById('mobile-menu')
const iconOpen = document.getElementById('icon-open')
const iconClose = document.getElementById('icon-close')
const filterLabel = document.getElementById('filter-label')
const emptyFilter = document.getElementById('empty-filter')
const productCards = document.querySelectorAll('.product-card')
const filterButtons = document.querySelectorAll('.filter-btn')
const categoryCards = document.querySelectorAll('.category-card')
const modal = document.getElementById('product-modal')
const modalClose = document.getElementById('modal-close')
const modalAddCart = document.getElementById('modal-add-cart')

let activeModalProduct = null
let activeModalId = null

function setMenuOpen(isOpen) {
  mobileMenu.classList.toggle('hidden', !isOpen)
  iconOpen.classList.toggle('hidden', isOpen)
  iconClose.classList.toggle('hidden', !isOpen)
  menuToggle.setAttribute('aria-expanded', String(isOpen))
  menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
}

menuToggle.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.contains('hidden')
  setMenuOpen(isOpen)
})

document.querySelectorAll('.mobile-link').forEach((link) => {
  link.addEventListener('click', () => setMenuOpen(false))
})

function setActiveFilterButton(category) {
  filterButtons.forEach((button) => {
    const isActive = button.dataset.category === category
    button.classList.toggle('bg-indigo-600', isActive)
    button.classList.toggle('text-white', isActive)
    button.classList.toggle('bg-slate-100', !isActive)
    button.classList.toggle('text-slate-700', !isActive)
  })
}

function filterProducts(category) {
  let visibleCount = 0

  productCards.forEach((card) => {
    const matches = category === 'all' || card.dataset.category === category
    card.classList.toggle('hidden', !matches)
    if (matches) visibleCount += 1
  })

  emptyFilter.classList.toggle('hidden', visibleCount > 0)
  filterLabel.textContent =
    category === 'all' ? 'Showing all products' : `Showing ${category}`
  setActiveFilterButton(category)
}

filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    filterProducts(button.dataset.category)
  })
})

categoryCards.forEach((card) => {
  card.addEventListener('click', () => {
    filterProducts(card.dataset.category)
    document.getElementById('products').scrollIntoView({ behavior: 'smooth' })
  })
})

function openModal(card) {
  activeModalProduct = card.dataset.name
  activeModalId = card.dataset.id
  document.getElementById('modal-image').src = card.dataset.image
  document.getElementById('modal-image').alt = card.dataset.name
  document.getElementById('modal-category').textContent = card.dataset.category
  document.getElementById('modal-title').textContent = card.dataset.name
  document.getElementById('modal-rating').textContent = `★ ${card.dataset.rating}`
  document.getElementById('modal-price').textContent = formatPrice(card.dataset.price)
  document.getElementById('modal-desc').textContent = card.dataset.desc
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

function closeModal() {
  modal.classList.add('hidden')
  modal.classList.remove('flex')
  activeModalProduct = null
  activeModalId = null
}

document.querySelectorAll('.add-to-cart').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card')
    addToCart(card.dataset.id || card.dataset.name)
  })
})

document.querySelectorAll('.view-details').forEach((button) => {
  button.addEventListener('click', () => {
    const card = button.closest('.product-card')
    if (card.dataset.id) {
      window.location.href = `product-details.html?id=${card.dataset.id}`
      return
    }
    openModal(card)
  })
})

modalClose.addEventListener('click', closeModal)

modal.addEventListener('click', (event) => {
  if (event.target === modal) closeModal()
})

modalAddCart.addEventListener('click', () => {
  if (activeModalProduct) {
    addToCart(activeModalId || activeModalProduct)
    closeModal()
  }
})

