import './style.css'
import { setupMobileMenu } from './auth.js'
import { formatPrice, getOrders, setupCartButton } from './cart.js'

setupMobileMenu()
setupCartButton()

const list = document.getElementById('orders-list')
const empty = document.getElementById('empty-orders')
const orders = getOrders()

if (!orders.length) {
  empty.classList.remove('hidden')
} else {
  list.innerHTML = orders
    .map(
      (order) => `
        <article class="rounded-2xl border border-slate-200 bg-white p-5">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-indigo-600">Order ID</p>
              <h2 class="mt-1 text-lg font-bold text-slate-900">${order.id}</h2>
              <p class="mt-1 text-sm text-slate-500">${new Date(order.createdAt).toLocaleString('en-IN')}</p>
            </div>
            <p class="text-lg font-bold text-slate-900">${formatPrice(order.total)}</p>
          </div>
          <p class="mt-3 text-sm text-slate-600">${order.delivery} · ${order.estimate} · ${order.payment}</p>
          <ul class="mt-3 space-y-1 text-sm text-slate-700">
            ${order.items.map((item) => `<li>${item.name} × ${item.quantity}</li>`).join('')}
          </ul>
        </article>
      `,
    )
    .join('')
}
