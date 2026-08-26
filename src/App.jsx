import { useEffect, useState } from 'react'
import { addToCart, getCartCount } from './cart.js'
import { products } from './products-data.js'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import CategorySection from './components/CategorySection.jsx'
import FeaturedProducts from './components/FeaturedProducts.jsx'
import Footer from './components/Footer.jsx'

const featuredProductIds = [
  'aria-headphones',
  'pulse-smartwatch',
  'nordic-sneakers',
  'aurel-overcoat',
  'lumen-floor-lamp',
  'haven-sofa',
  'marketplace-mindset',
  'yoga-mat-pro',
]

const featuredProducts = featuredProductIds
  .map((id) => products.find((product) => product.id === id))
  .filter(Boolean)

export default function App() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState('All')
  const [cartCount, setCartCount] = useState(getCartCount())
  const [toastMessage, setToastMessage] = useState('')

  useEffect(() => {
    const syncCartCount = () => setCartCount(getCartCount())
    syncCartCount()
    window.addEventListener('storage', syncCartCount)
    return () => window.removeEventListener('storage', syncCartCount)
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

  function handleAddToCart(product) {
    addToCart(product.id)
    setCartCount(getCartCount())
    setToastMessage(`${product.name} added to cart`)
  }

  function handleCategorySelect(category) {
    setActiveCategory(category)
    setIsMobileMenuOpen(false)
    const productsSection = document.getElementById('products')
    if (productsSection) {
      productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <>
      {toastMessage && (
        <div
          className="pointer-events-none fixed right-4 top-20 z-50 max-w-sm rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-lg"
          role="status"
          aria-live="polite"
        >
          {toastMessage}
        </div>
      )}

      <Navbar
        cartCount={cartCount}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />

      <main>
        <Hero />
        <CategorySection
          activeCategory={activeCategory}
          onCategorySelect={handleCategorySelect}
        />
        <FeaturedProducts
          products={featuredProducts}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          onAddToCart={handleAddToCart}
        />
      </main>

      <Footer />
    </>
  )
}
