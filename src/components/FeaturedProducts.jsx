import ProductCard from './ProductCard'

export default function FeaturedProducts({ products, activeCategory, onCategoryChange }) {
  const filteredProducts =
    activeCategory === 'All' || activeCategory === 'all'
      ? products
      : products.filter((product) => product.category === activeCategory)

  const categoryButtons = ['All', 'Electronics', 'Fashion', 'Home & Living', 'Books', 'Sports']

  return (
    <section id="products" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Featured Products</h2>
            <p className="mt-1 text-sm text-slate-600">{activeCategory === 'All' ? 'Showing all products' : `Showing ${activeCategory}`}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryButtons.map((category) => {
              const isActive = category === activeCategory || (category === 'All' && activeCategory === 'all')
              return (
                <button
                  key={category}
                  type="button"
                  className={`rounded-full px-4 py-1.5 text-xs font-semibold sm:text-sm ${
                    isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  data-category={category}
                  onClick={() => onCategoryChange(category === 'All' ? 'All' : category)}
                >
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </section>
  )
}
