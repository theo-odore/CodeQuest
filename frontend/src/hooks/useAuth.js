import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { authService } from '@services/auth.service'
import { ROUTES } from '@constants/routes'

export function useAuth() {
  const { user, token, isAuthenticated, setAuth, logout: storeLogout, isAdmin, isStudent } = useAuthStore()
  const navigate = useNavigate()

  const login = useCallback(async (credentials) => {
    const { data } = await authService.login(credentials)
    const tokenVal = data.access_token || data.token
    setAuth(data.user, tokenVal)
    const roleUpper = data.user?.role?.toUpperCase()
    if (roleUpper === 'ADMIN') {
      navigate(ROUTES.ADMIN.DASHBOARD)
    } else {
      navigate(ROUTES.STUDENT.DASHBOARD)
    }
    return data
  }, [setAuth, navigate])

  const logout = useCallback(() => {
    storeLogout()
    navigate(ROUTES.LOGIN)
  }, [storeLogout, navigate])

  return {
    user,
    token,
    isAuthenticated,
    isAdmin: isAdmin(),
    isStudent: isStudent(),
    login,
    logout,
  }
}
