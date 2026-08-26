const categories = [
  { name: 'Electronics', emoji: '🎧', description: 'Audio, wearables & more' },
  { name: 'Fashion', emoji: '👗', description: 'Apparel and accessories' },
  { name: 'Home & Living', emoji: '🏠', description: 'Furniture and decor' },
  { name: 'Books', emoji: '📚', description: 'Bestsellers and guides' },
  { name: 'Sports', emoji: '🏅', description: 'Fitness and outdoor gear' },
]

export default function CategorySection({ activeCategory, onCategorySelect }) {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 sm:text-3xl">Product Categories</h2>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">Select a category to filter featured products.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 lg:grid-cols-5">
        {categories.map((category, index) => {
          const isLast = index === categories.length - 1
          return (
            <button
              key={category.name}
              type="button"
              className={`category-card rounded-xl border border-slate-200 bg-white p-4 text-left shadow-sm hover:border-indigo-300 hover:shadow-md sm:p-5 ${
                activeCategory === category.name ? 'border-indigo-300 bg-indigo-50' : ''
              } ${isLast ? 'col-span-2 sm:col-span-1' : ''}`}
              data-category={category.name}
              onClick={() => onCategorySelect(category.name)}
            >
              <span className="text-2xl">{category.emoji}</span>
              <h3 className="mt-3 font-semibold text-slate-900">{category.name}</h3>
              <p className="mt-1 text-xs text-slate-500">{category.description}</p>
            </button>
          )
        })}
      </div>
    </section>
  )
}
