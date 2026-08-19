import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [
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
