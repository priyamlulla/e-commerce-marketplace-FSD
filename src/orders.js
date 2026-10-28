import './style.css'
import { setupMobileMenu } from './auth.js'
import { apiRequest } from './api.js'
import { formatPrice, setupCartButton } from './cart.js'

setupMobileMenu()
setupCartButton()

const list = document.getElementById('orders-list')
const empty = document.getElementById('empty-orders')
const status = document.getElementById('orders-status')

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[character])
}

function display(value) {
  return value ? String(value).replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase()) : '—'
}

function renderOrder(order) {
  const items = (order.items || []).map((item) =>
    `<li>${escapeHtml(item.name)} × ${Number(item.quantity)} · ${formatPrice(item.unitPrice)} each</li>`,
  ).join('')
  const address = order.address
    ? [order.address.line1, order.address.city, order.address.state, order.address.postalCode, order.address.country].filter(Boolean).map(escapeHtml).join(', ')
    : 'No delivery address recorded.'

  return `
    <article class="rounded-2xl border border-slate-200 bg-white p-5">
      <div class="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Order ID</p>
          <h2 class="mt-1 break-all text-lg font-bold text-slate-900">${escapeHtml(order._id)}</h2>
          <p class="mt-1 text-sm text-slate-500">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
        </div>
        <p class="text-lg font-bold text-slate-900">${formatPrice(order.total)}</p>
      </div>
      <p class="mt-3 text-sm text-slate-600">Order: ${display(order.orderStatus)} · Payment: ${display(order.paymentStatus)} (${display(order.paymentMethod)})</p>
      <ul class="mt-3 space-y-1 text-sm text-slate-700">${items}</ul>
      <div class="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
        <p><strong>Delivery address:</strong> ${address}</p>
        <p class="mt-1"><strong>Shipment:</strong> ${display(order.shipment?.status)}${order.shipment?.trackingNumber ? ` · Tracking ${escapeHtml(order.shipment.trackingNumber)}` : ''}${order.shipment?.courier ? ` · ${escapeHtml(order.shipment.courier)}` : ''}</p>
        <p class="mt-1"><strong>Estimated delivery:</strong> ${order.shipment?.estimatedDeliveryDate ? new Date(order.shipment.estimatedDeliveryDate).toLocaleDateString('en-IN') : 'Not provided'}</p>
        <p class="mt-1"><strong>Actual delivery:</strong> ${order.shipment?.actualDeliveryDate ? new Date(order.shipment.actualDeliveryDate).toLocaleDateString('en-IN') : 'Not recorded'}</p>
      </div>
    </article>
  `
}

async function loadOrders() {
  try {
    const { orders } = await apiRequest('/orders')
    if (!orders.length) {
      empty.classList.remove('hidden')
      return
    }
    list.innerHTML = orders.map(renderOrder).join('')
  } catch (error) {
    if (error.status === 401) {
      window.location.replace('login.html')
      return
    }
    status.textContent = error.message || 'Unable to load your order history.'
    status.classList.remove('hidden')
  }
}

loadOrders()
