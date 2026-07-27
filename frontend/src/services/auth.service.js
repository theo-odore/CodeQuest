import api from './api'

export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
}
