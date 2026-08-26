import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        login: resolve(root, 'login.html'),
        register: resolve(root, 'register.html'),
        products: resolve(root, 'products.html'),
        productDetails: resolve(root, 'product-details.html'),
        cart: resolve(root, 'cart.html'),
        checkout: resolve(root, 'checkout.html'),
        orders: resolve(root, 'orders.html'),
        dashboard: resolve(root, 'dashboard.html'),
      },
    },
  },
})