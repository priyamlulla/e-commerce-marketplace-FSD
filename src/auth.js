export function setFieldError(input, messageEl, message) {
  messageEl.textContent = message || ''
  input.setAttribute('aria-invalid', message ? 'true' : 'false')
  input.classList.toggle('border-red-500', Boolean(message))
  input.classList.toggle('border-slate-300', !message)
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function setupMobileMenu() {
  const menuToggle = document.getElementById('menu-toggle')
  const mobileMenu = document.getElementById('mobile-menu')
  const iconOpen = document.getElementById('icon-open')
  const iconClose = document.getElementById('icon-close')

  if (!menuToggle || !mobileMenu) return

  function setMenuOpen(isOpen) {
    mobileMenu.classList.toggle('hidden', !isOpen)
    iconOpen.classList.toggle('hidden', isOpen)
    iconClose.classList.toggle('hidden', !isOpen)
    menuToggle.setAttribute('aria-expanded', String(isOpen))
    menuToggle.setAttribute('aria-label', isOpen ? 'Close menu' : 'Open menu')
  }

  menuToggle.addEventListener('click', () => {
    setMenuOpen(mobileMenu.classList.contains('hidden'))
  })
}

export function setupPasswordToggle(input, toggleButton) {
  toggleButton.addEventListener('click', () => {
    const hidden = input.type === 'password'
    input.type = hidden ? 'text' : 'password'
    toggleButton.textContent = hidden ? 'Hide' : 'Show'
    toggleButton.setAttribute('aria-label', hidden ? 'Hide password' : 'Show password')
  })
}
