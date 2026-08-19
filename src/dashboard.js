import './style.css'
import { setupMobileMenu } from './auth.js'
import { formatPrice, setupCartButton, showToast } from './cart.js'
import { products } from './products-data.js'

setupMobileMenu()
setupCartButton()

const customer = {
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+91 98765 43210',
  address: '14 FC Road, Shivajinagar, Pune, Maharashtra 411005',
}

const dummyOrders = [
  {
    id: 'SS10482931',
    product: 'Aria Wireless Headphones',
    productId: 'aria-headphones',
    date: '12 Aug 2026',
    amount: 24990,
    status: 'Delivered',
  },
  {
    id: 'SS10483002',
    product: 'Nordic Runner Sneakers',
    productId: 'nordic-sneakers',
    date: '16 Aug 2026',
    amount: 8495,
    status: 'Pending',
  },
  {
    id: 'SS10483110',
    product: 'Forge Yoga Mat Pro',
    productId: 'yoga-mat-pro',
    date: '18 Aug 2026',
    amount: 1299,
    status: 'Shipped',
  },
  {
    id: 'SS10483188',
    product: 'The Marketplace Mindset',
    productId: 'marketplace-mindset',
    date: '19 Aug 2026',
    amount: 499,
    status: 'Delivered',
  },
]

const panels = ['overview', 'orders', 'wishlist', 'profile', 'addresses']

function statusClass(status) {
  if (status === 'Delivered') return 'bg-green-50 text-green-700'
  if (status === 'Pending') return 'bg-amber-50 text-amber-700'
  return 'bg-indigo-50 text-indigo-700'
}

function orderCard(order) {
  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-4">
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="min-w-0">
          <p class="text-xs font-semibold uppercase tracking-wide text-slate-500">${order.id}</p>
          <h3 class="mt-1 truncate font-semibold text-slate-900">${order.product}</h3>
          <p class="mt-1 text-sm text-slate-600">${order.date} · ${formatPrice(order.amount)}</p>
          <span class="mt-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${statusClass(order.status)}">${order.status}</span>
        </div>
        <button type="button" class="view-order shrink-0 rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50" data-id="${order.id}">View Order</button>
      </div>
    </article>
  `
}

function productCard(product) {
  return `
    <article class="overflow-hidden rounded-2xl border border-slate-200 bg-white hover:border-indigo-200">
      <img src="${product.image}" alt="${product.name}" class="h-44 w-full object-cover" />
      <div class="p-4">
        <h3 class="font-semibold text-slate-900">${product.name}</h3>
        <p class="mt-1 text-sm text-amber-600">★ ${product.rating}</p>
        <p class="mt-2 text-lg font-bold text-slate-900">${formatPrice(product.price)}</p>
        <a href="product-details.html?id=${product.id}" class="mt-4 inline-flex rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">View Details</a>
      </div>
    </article>
  `
}

function renderOrders() {
  const markup = dummyOrders.map(orderCard).join('')
  document.getElementById('recent-orders').innerHTML = markup
  document.getElementById('all-orders').innerHTML = markup
}

function renderRecommended() {
  const list = products.filter((item) => item.stock !== 'Out of Stock').slice(0, 6)
  document.getElementById('recommended-grid').innerHTML = list.map(productCard).join('')
  document.getElementById('wishlist-grid').innerHTML = list.slice(0, 5).map(productCard).join('')
}

function setSidebarActive(panel) {
  document.querySelectorAll('.sidebar-link').forEach((button) => {
    const active = button.dataset.panel === panel
    button.classList.toggle('bg-indigo-600', active)
    button.classList.toggle('text-white', active)
    button.classList.toggle('text-slate-700', !active)
    button.classList.toggle('hover:bg-slate-50', !active)
  })
  const select = document.getElementById('sidebar-select')
  if (select && panels.includes(panel)) select.value = panel
}

function showPanel(panel) {
  if (panel === 'cart') {
    window.location.href = 'cart.html'
    return
  }
  if (panel === 'logout') {
    logout()
    return
  }

  panels.forEach((name) => {
    document.getElementById(`panel-${name}`).classList.toggle('hidden', name !== panel)
  })
  setSidebarActive(panel)
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function logout() {
  showToast('Logged out. Returning to login...')
  window.setTimeout(() => {
    window.location.href = 'login.html'
  }, 700)
}

function openOrderModal(orderId) {
  const order = dummyOrders.find((item) => item.id === orderId)
  if (!order) return
  document.getElementById('order-modal-title').textContent = order.id
  document.getElementById('order-modal-body').innerHTML = `
    <p><span class="font-medium text-slate-900">Product:</span> ${order.product}</p>
    <p><span class="font-medium text-slate-900">Date:</span> ${order.date}</p>
    <p><span class="font-medium text-slate-900">Amount:</span> ${formatPrice(order.amount)}</p>
    <p><span class="font-medium text-slate-900">Status:</span> ${order.status}</p>
    <p class="text-slate-500">This is dummy order data for Experiment 1.</p>
  `
  document.getElementById('order-modal-link').href = `product-details.html?id=${order.productId}`
  document.getElementById('order-modal-link').textContent = 'View product'
  const modal = document.getElementById('order-modal')
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

function closeOrderModal() {
  const modal = document.getElementById('order-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

function openProfileModal() {
  document.getElementById('edit-name').value = customer.name
  document.getElementById('edit-email').value = customer.email
  document.getElementById('edit-phone').value = customer.phone
  document.getElementById('edit-address').value = customer.address
  const modal = document.getElementById('profile-modal')
  modal.classList.remove('hidden')
  modal.classList.add('flex')
}

function closeProfileModal() {
  const modal = document.getElementById('profile-modal')
  modal.classList.add('hidden')
  modal.classList.remove('flex')
}

function updateProfileDisplay() {
  document.getElementById('welcome-title').textContent = `Welcome back, ${customer.name}!`
  document.getElementById('profile-name').textContent = customer.name
  document.getElementById('profile-email').textContent = customer.email
  document.getElementById('profile-phone').textContent = customer.phone
  document.getElementById('profile-address').textContent = customer.address
  document.querySelectorAll('.profile-name-copy').forEach((el) => {
    el.textContent = customer.name
  })
  document.querySelectorAll('.profile-email-copy').forEach((el) => {
    el.textContent = customer.email
  })
  document.querySelectorAll('.profile-phone-copy').forEach((el) => {
    el.textContent = customer.phone
  })
  document.querySelectorAll('.profile-address-copy').forEach((el) => {
    el.textContent = customer.address
  })
  document.getElementById('address-block').innerHTML =
    `${customer.name}<br />${customer.address}<br />Phone: ${customer.phone}`
}

document.querySelectorAll('.sidebar-link').forEach((button) => {
  button.addEventListener('click', () => showPanel(button.dataset.panel))
})

document.getElementById('sidebar-select').addEventListener('change', (event) => {
  showPanel(event.target.value)
})

document.querySelectorAll('.logout-btn').forEach((button) => {
  button.addEventListener('click', logout)
})

document.querySelectorAll('.nav-profile').forEach((button) => {
  button.addEventListener('click', () => showPanel('profile'))
})

document.getElementById('edit-profile').addEventListener('click', openProfileModal)
document.querySelectorAll('.edit-profile-alt').forEach((button) => {
  button.addEventListener('click', openProfileModal)
})

document.getElementById('profile-modal-close').addEventListener('click', closeProfileModal)
document.getElementById('profile-modal').addEventListener('click', (event) => {
  if (event.target.id === 'profile-modal') closeProfileModal()
})

document.getElementById('profile-form').addEventListener('submit', (event) => {
  event.preventDefault()
  customer.name = document.getElementById('edit-name').value.trim() || customer.name
  customer.email = document.getElementById('edit-email').value.trim() || customer.email
  customer.phone = document.getElementById('edit-phone').value.trim() || customer.phone
  customer.address = document.getElementById('edit-address').value.trim() || customer.address
  updateProfileDisplay()
  closeProfileModal()
  showToast('Profile updated (frontend only)')
})

document.getElementById('recent-orders').addEventListener('click', (event) => {
  const button = event.target.closest('.view-order')
  if (button) openOrderModal(button.dataset.id)
})

document.getElementById('all-orders').addEventListener('click', (event) => {
  const button = event.target.closest('.view-order')
  if (button) openOrderModal(button.dataset.id)
})

document.getElementById('order-modal-close').addEventListener('click', closeOrderModal)
document.getElementById('order-modal').addEventListener('click', (event) => {
  if (event.target.id === 'order-modal') closeOrderModal()
})

renderOrders()
renderRecommended()
updateProfileDisplay()
