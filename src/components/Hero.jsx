export default function Hero() {
  return (
    <section id="home" className="bg-slate-900">
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 sm:py-16 lg:grid-cols-2 lg:px-8 lg:py-24">
        <div>
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-indigo-300">Trusted marketplace</p>
          <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Shop smarter. Discover quality from every category.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            ShopSphere brings electronics, fashion, home essentials, books and sports gear together in one clean, reliable storefront.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <a
              href="#products"
              className="inline-flex items-center justify-center rounded-lg bg-indigo-500 px-6 py-3 text-sm font-semibold text-white hover:bg-indigo-400"
            >
              Shop Now
            </a>
            <a
              href="#products"
              className="inline-flex items-center justify-center rounded-lg border border-slate-500 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10"
            >
              Explore Products
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="space-y-3 sm:space-y-4">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80"
              alt="Wireless headphones"
              className="h-36 w-full rounded-2xl object-cover sm:h-44 lg:h-52"
            />
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80"
              alt="Running sneakers"
              className="h-44 w-full rounded-2xl object-cover sm:h-56 lg:h-64"
            />
          </div>
          <div className="mt-6 space-y-3 sm:mt-10 sm:space-y-4">
            <img
              src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
              alt="Modern sofa"
              className="h-44 w-full rounded-2xl object-cover sm:h-56 lg:h-64"
            />
            <img
              src="https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80"
              alt="Classic wristwatch"
              className="h-36 w-full rounded-2xl object-cover sm:h-44 lg:h-52"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
