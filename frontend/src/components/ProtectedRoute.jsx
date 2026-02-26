import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }) {
  const { token, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="admin-shell" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#4b5a51', padding: '4rem', textAlign: 'center' }}>
          <div className="skeleton" style={{ width: '120px', height: '12px', margin: '0 auto 0.75rem' }} />
          <div className="skeleton" style={{ width: '80px', height: '12px', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  if (!token) {
    return <Navigate to="/admin/login" replace />
  }

  return children
}
