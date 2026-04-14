const explicitApiBase = import.meta.env.VITE_API_BASE_URL

export function getApiBase() {
  // If explicitly set, use that
  if (explicitApiBase && explicitApiBase.trim()) {
    return explicitApiBase.trim().replace(/\/$/, '')
  }

  // Use relative path - Vite proxy will forward to backend
  // This works for both local (localhost:5173) and LAN (192.168.x.x:5173) access
  return ''
}

export const apiBase = getApiBase()