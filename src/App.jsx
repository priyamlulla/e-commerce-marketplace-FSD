import { useEffect, useState } from 'react'
import { products } from './products-data.js'
import Navbar from './components/Navbar.jsx'
import Hero from './components/Hero.jsx'
import CategorySection from './components/CategorySection.jsx'
import FeaturedProducts from './components/FeaturedProducts.jsx'
import Footer from './components/Footer.jsx'
import { useCart } from './context/CartContext.jsx'
import useDocumentTitle from './hooks/useDocumentTitle.js'

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
  const [toastMessage, setToastMessage] = useState('')
  const { addToCart } = useCart()

  useDocumentTitle('ShopSphere - Home')

  useEffect(() => {
    console.log('Home page loaded using useEffect')
  }, [])

  useEffect(() => {
    const onProductAdded = (ev) => {
      const name = ev?.detail?.name || 'Product'
      setToastMessage(`${name} added to cart`)
    }
    window.addEventListener('shopsphere:product-added', onProductAdded)
    return () => window.removeEventListener('shopsphere:product-added', onProductAdded)
  }, [])

  useEffect(() => {
    if (!toastMessage) return undefined
    const timer = window.setTimeout(() => setToastMessage(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toastMessage])

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
        />
      </main>

      <Footer />
    </>
  )
}
