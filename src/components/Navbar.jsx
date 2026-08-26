export default function Navbar({ cartCount, isMobileMenuOpen, setIsMobileMenuOpen }) {
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8" aria-label="Main">
        <a href="#home" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">S</span>
          <span className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">ShopSphere</span>
        </a>

        <ul className="hidden items-center gap-8 text-sm font-medium text-slate-600 md:flex">
          <li><a href="#home" className="hover:text-indigo-600">Home</a></li>
          <li><a href="products.html" className="hover:text-indigo-600">Products</a></li>
          <li><a href="#categories" className="hover:text-indigo-600">Categories</a></li>
          <li><a href="login.html" className="hover:text-indigo-600">Login</a></li>
          <li><a href="register.html" className="hover:text-indigo-600">Register</a></li>
        </ul>

        <div className="flex items-center gap-2">
          <a
            href="cart.html"
            className="relative rounded-lg p-2 text-slate-700 hover:bg-slate-100"
            aria-label="Shopping cart"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
            </svg>
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1 text-[11px] font-bold text-white">
              {cartCount}
            </span>
          </a>

          <button
            type="button"
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden"
            aria-controls="mobile-menu"
            aria-expanded={isMobileMenuOpen}
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            onClick={() => setIsMobileMenuOpen((current) => !current)}
          >
            <svg className={`${isMobileMenuOpen ? 'hidden' : 'block'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            <svg className={`${isMobileMenuOpen ? 'block' : 'hidden'} h-6 w-6`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </nav>

      <div className={`${isMobileMenuOpen ? 'block' : 'hidden'} border-t border-slate-200 bg-white md:hidden`} id="mobile-menu">
        <ul className="flex flex-col gap-1 px-4 py-3 text-sm font-medium text-slate-700">
          <li><a href="#home" className="mobile-link block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Home</a></li>
          <li><a href="products.html" className="mobile-link block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Products</a></li>
          <li><a href="#categories" className="mobile-link block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Categories</a></li>
          <li><a href="login.html" className="mobile-link block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Login</a></li>
          <li><a href="register.html" className="mobile-link block rounded-lg px-3 py-2 hover:bg-slate-50" onClick={() => setIsMobileMenuOpen(false)}>Register</a></li>
        </ul>
      </div>
    </header>
  )
}
