export async function apiRequest(path, options = {}) {
  const headers = new Headers(options.headers)
  let body = options.body

  if (body && typeof body !== 'string') {
    headers.set('Content-Type', 'application/json')
    body = JSON.stringify(body)
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    body,
    headers,
    credentials: 'same-origin',
  })

  if (response.status === 204) return null

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const error = new Error(payload?.message || `Request failed (${response.status})`)
    error.status = response.status
    error.details = payload?.errors || []
    throw error
  }

  return payload
}
