import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CART_KEY = 'shopsphere-cart-items'

const CartContext = createContext(null)

function readCartItems() {
  try {
    const parsed = JSON.parse(localStorage.getItem(CART_KEY) || '[]')
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveCartItems(items) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
}

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState(() => readCartItems())

  useEffect(() => {
    const syncCartItems = () => setCartItems(readCartItems())
    window.addEventListener('storage', syncCartItems)
    return () => window.removeEventListener('storage', syncCartItems)
  }, [])

  const cartCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    [cartItems],
  )

  const addToCart = (product) => {
    const productId = typeof product === 'string' ? product : product?.id
    if (!productId) return

    const items = readCartItems()
    const existing = items.find((item) => item.id === productId)

    if (existing) {
      existing.quantity = Math.min(10, Number(existing.quantity || 1) + 1)
    } else {
      items.push({ id: productId, quantity: 1 })
    }

    saveCartItems(items)
    setCartItems(items)
  }

  const removeFromCart = (productId) => {
    const nextItems = readCartItems().filter((item) => item.id !== productId)
    saveCartItems(nextItems)
    setCartItems(nextItems)
  }

  const updateQuantity = (productId, quantity) => {
    const nextQty = Math.max(1, Math.min(10, Number(quantity) || 1))
    const nextItems = readCartItems().map((item) =>
      item.id === productId ? { ...item, quantity: nextQty } : item,
    )
    saveCartItems(nextItems)
    setCartItems(nextItems)
  }

  const value = useMemo(
    () => ({
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
    }),
    [cartItems, cartCount],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const context = useContext(CartContext)

  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }

  return context
}
