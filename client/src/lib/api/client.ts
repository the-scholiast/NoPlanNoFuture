import { getAuthHeaders } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export async function apiCall(endpoint: string, options: RequestInit = {}) {
 const headers = await getAuthHeaders()

 const response = await fetch(`${API_BASE}${endpoint}`, {
   ...options,
   headers: {
     ...headers,
     ...options.headers
   }
 })

 if (!response.ok) {
   const error = await response.json().catch(() => ({ error: 'Unknown error' }))
   throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`)
 }

 return response.json()
}