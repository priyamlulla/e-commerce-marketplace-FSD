import './style.css'
import { setFieldError, setupMobileMenu, setupPasswordToggle } from './auth.js'

setupMobileMenu()

const form = document.getElementById('login-form')
const emailInput = document.getElementById('email')
const passwordInput = document.getElementById('password')
const emailError = document.getElementById('email-error')
const passwordError = document.getElementById('password-error')
const rememberInput = document.getElementById('remember')
const formStatus = document.getElementById('form-status')
const forgotLink = document.getElementById('forgot-password')
const forgotNote = document.getElementById('forgot-note')

setupPasswordToggle(passwordInput, document.getElementById('toggle-password'))

const savedEmail = localStorage.getItem('shopsphere-remember-email')
if (savedEmail) {
  emailInput.value = savedEmail
  rememberInput.checked = true
}

forgotLink.addEventListener('click', (event) => {
  event.preventDefault()
  forgotNote.classList.remove('hidden')
})

form.addEventListener('submit', (event) => {
  event.preventDefault()
  formStatus.textContent = ''
  formStatus.className = 'mt-4 text-sm'

  const email = emailInput.value.trim()
  const password = passwordInput.value
  let isValid = true

  if (!email) {
    setFieldError(emailInput, emailError, 'Email cannot be empty.')
    isValid = false
  } else {
    setFieldError(emailInput, emailError, '')
  }

  if (!password) {
    setFieldError(passwordInput, passwordError, 'Password cannot be empty.')
    isValid = false
  } else {
    setFieldError(passwordInput, passwordError, '')
  }

  if (!isValid) return

  if (rememberInput.checked) {
    localStorage.setItem('shopsphere-remember-email', email)
  } else {
    localStorage.removeItem('shopsphere-remember-email')
  }

  formStatus.className = 'mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700'
  formStatus.textContent = 'Login successful. Opening your dashboard...'
  window.setTimeout(() => {
    window.location.href = 'dashboard.html'
  }, 900)
})
