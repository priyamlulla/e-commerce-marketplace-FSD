import React from 'react'
import { useCart } from '../context/CartContext.jsx'

export default function ProductCard({ product }) {
  const outOfStock = product.stock === 'Out of Stock'
  const { addToCart } = useCart()

  function handleAdd() {
    addToCart(product)
    // notify App (or any listener) so toast can be shown without prop drilling
    try {
      window.dispatchEvent(new CustomEvent('shopsphere:product-added', { detail: { name: product.name } }))
    } catch (e) {
      // ignore if CustomEvent not supported
      const ev = document.createEvent('Event')
      ev.initEvent('shopsphere:product-added', true, true)
      ev.detail = { name: product.name }
      window.dispatchEvent(ev)
    }
  }

  return (
    <article className="product-card overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm" data-id={product.id} data-category={product.category}>
      <img src={product.image} alt={product.name} className="h-48 w-full object-cover" />
      <div className="p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-indigo-600">{product.category}</p>
        <h3 className="mt-1 font-semibold text-slate-900">{product.name}</h3>
        <p className="mt-1 text-sm text-amber-600">★ {product.rating}</p>
        <p className="mt-2 text-lg font-bold text-slate-900">₹{Number(product.price).toLocaleString('en-IN')}</p>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="add-to-cart flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            onClick={handleAdd}
            disabled={outOfStock}
          >
            Add to Cart
          </button>
          <a href={`product-details.html?id=${product.id}`} className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-white">
            View Details
          </a>
        </div>
      </div>
    </article>
  )
}
