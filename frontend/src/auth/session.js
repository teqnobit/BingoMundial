export function saveSession(token, usuario) {
  localStorage.setItem('token', token)
  localStorage.setItem('usuario', JSON.stringify(usuario))
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUsuario() {
  const raw = localStorage.getItem('usuario')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated() {
  return Boolean(getToken())
}
