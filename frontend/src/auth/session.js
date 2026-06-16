export function saveSession(token, usuario) {
  localStorage.setItem('token', token)
  localStorage.setItem('usuario', JSON.stringify(usuario))
  localStorage.removeItem('guest')
}

export function saveGuestSession() {
  localStorage.removeItem('token')
  localStorage.setItem('usuario', JSON.stringify({ id: null, nombre: 'Invitado' }))
  localStorage.setItem('guest', 'true')
}

export function clearSession() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.removeItem('guest')
}

export function getToken() {
  return localStorage.getItem('token')
}

export function getUsuario() {
  const raw = localStorage.getItem('usuario')
  return raw ? JSON.parse(raw) : null
}

export function isAuthenticated() {
  return Boolean(getToken()) || isGuest()
}

export function isGuest() {
  return localStorage.getItem('guest') === 'true'
}
