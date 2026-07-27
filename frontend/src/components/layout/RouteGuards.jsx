import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@store/authStore'
import { ROUTES } from '@constants/routes'

export function PrivateRoute({ children, requireAdmin = false }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />
  }

  const roleUpper = user?.role?.toUpperCase()

  if (requireAdmin && roleUpper !== 'ADMIN') {
    return <Navigate to={ROUTES.STUDENT.DASHBOARD} replace />
  }

  if (!requireAdmin && roleUpper === 'ADMIN') {
    return <Navigate to={ROUTES.ADMIN.DASHBOARD} replace />
  }

  return children
}

export function GuestRoute({ children }) {
  const { isAuthenticated, user } = useAuthStore()

  if (isAuthenticated) {
    const roleUpper = user?.role?.toUpperCase()
    return <Navigate to={
      roleUpper === 'ADMIN' ? ROUTES.ADMIN.DASHBOARD : ROUTES.STUDENT.DASHBOARD
    } replace />
  }

  return children
}

