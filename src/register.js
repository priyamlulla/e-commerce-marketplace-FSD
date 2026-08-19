import './style.css'
import { isValidEmail, setFieldError, setupMobileMenu, setupPasswordToggle } from './auth.js'

setupMobileMenu()

const form = document.getElementById('register-form')
const nameInput = document.getElementById('full-name')
const emailInput = document.getElementById('email')
const phoneInput = document.getElementById('phone')
const passwordInput = document.getElementById('password')
const confirmInput = document.getElementById('confirm-password')
const termsInput = document.getElementById('terms')
const formStatus = document.getElementById('form-status')

setupPasswordToggle(passwordInput, document.getElementById('toggle-password'))
setupPasswordToggle(confirmInput, document.getElementById('toggle-confirm'))

form.addEventListener('submit', (event) => {
  event.preventDefault()
  formStatus.textContent = ''
  formStatus.className = 'mt-4 text-sm'

  const name = nameInput.value.trim()
  const email = emailInput.value.trim()
  const phone = phoneInput.value.trim()
  const password = passwordInput.value
  const confirmPassword = confirmInput.value
  let isValid = true

  if (!name) {
    setFieldError(nameInput, document.getElementById('name-error'), 'Full name is required.')
    isValid = false
  } else {
    setFieldError(nameInput, document.getElementById('name-error'), '')
  }

  if (!email) {
    setFieldError(emailInput, document.getElementById('email-error'), 'Email is required.')
    isValid = false
  } else if (!isValidEmail(email)) {
    setFieldError(emailInput, document.getElementById('email-error'), 'Enter a valid email address.')
    isValid = false
  } else {
    setFieldError(emailInput, document.getElementById('email-error'), '')
  }

  if (!phone) {
    setFieldError(phoneInput, document.getElementById('phone-error'), 'Phone number is required.')
    isValid = false
  } else if (!/^[0-9]{10}$/.test(phone)) {
    setFieldError(phoneInput, document.getElementById('phone-error'), 'Enter a 10-digit phone number.')
    isValid = false
  } else {
    setFieldError(phoneInput, document.getElementById('phone-error'), '')
  }

  if (!password) {
    setFieldError(passwordInput, document.getElementById('password-error'), 'Password is required.')
    isValid = false
  } else if (password.length < 8) {
    setFieldError(passwordInput, document.getElementById('password-error'), 'Password must be at least 8 characters.')
    isValid = false
  } else {
    setFieldError(passwordInput, document.getElementById('password-error'), '')
  }

  if (!confirmPassword) {
    setFieldError(confirmInput, document.getElementById('confirm-error'), 'Confirm your password.')
    isValid = false
  } else if (password !== confirmPassword) {
    setFieldError(confirmInput, document.getElementById('confirm-error'), 'Passwords do not match.')
    isValid = false
  } else {
    setFieldError(confirmInput, document.getElementById('confirm-error'), '')
  }

  const termsError = document.getElementById('terms-error')
  if (!termsInput.checked) {
    termsError.textContent = 'Please accept the Terms and Conditions.'
    isValid = false
  } else {
    termsError.textContent = ''
  }

  if (!isValid) return

  formStatus.className = 'mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700'
  formStatus.textContent = 'Account created (frontend demo). Redirecting to login...'
  window.setTimeout(() => {
    window.location.href = 'login.html'
  }, 900)
})
