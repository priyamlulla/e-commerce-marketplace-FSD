import { apiRequest } from './api.js'
import { products as sourceProducts } from './products-data.js'

const originalProducts = sourceProducts.map((product) => ({
  ...product,
  stockLabel: product.stock,
  stockQuantity: null,
  stockQuantityKnown: false,
  databaseId: null,
  purchasable: false,
}))

let products = originalProducts

function mapCatalogProduct(product, databaseProduct) {
  if (!databaseProduct) return { ...product }

  const stock = databaseProduct.stock
  const stockQuantityKnown = databaseProduct.stockVerified === true
    && typeof stock === 'number'
    && Number.isInteger(stock)
    && stock >= 0

  return {
    ...product,
    name: databaseProduct.name,
    category: databaseProduct.category,
    price: databaseProduct.price,
    description: databaseProduct.description || product.description,
    image: databaseProduct.image || product.image,
    databaseId: String(databaseProduct._id),
    stock: stockQuantityKnown ? stock : product.stock,
    stockLabel: product.stock === 'Out of Stock'
      ? product.stock
      : stockQuantityKnown
        ? (stock === 0 ? 'Out of Stock' : product.stock === 'Low Stock' ? 'Low Stock' : 'In Stock')
        : product.stock,
    stockQuantity: stockQuantityKnown ? stock : null,
    stockQuantityKnown,
    inventoryMode: databaseProduct.stockMode === 'demo' ? 'demo' : 'verified',
    purchasable: stockQuantityKnown && stock > 0 && product.stock !== 'Out of Stock',
  }
}

export async function fetchProducts() {
  let databaseProducts = []
  try {
    databaseProducts = await apiRequest('/products')
  } catch (error) {
    console.warn('Using the original local catalog; database overrides could not be loaded.', error)
  }

  const productsByCatalogId = new Map()
  const productsByCatalogIdCounts = new Map()
  for (const product of databaseProducts) {
    if (typeof product.catalogId !== 'string' || !product.catalogId) continue
    productsByCatalogIdCounts.set(
      product.catalogId,
      (productsByCatalogIdCounts.get(product.catalogId) || 0) + 1,
    )
    productsByCatalogId.set(product.catalogId, product)
  }
  for (const [catalogId, count] of productsByCatalogIdCounts) {
    if (count > 1) {
      productsByCatalogId.delete(catalogId)
      console.error(`Multiple database products claim original catalog ID "${catalogId}"; no override was applied.`)
    }
  }

  products = originalProducts.map((product) =>
    mapCatalogProduct(product, productsByCatalogId.get(product.id)),
  )
  return products
}

export function getCatalogProducts() {
  return products
}

export async function fetchProductById(id) {
  await fetchProducts()
  const product = products.find((item) => item.id === id)
  if (!product) throw new Error('This product could not be found in the original catalog.')
  return product
}
