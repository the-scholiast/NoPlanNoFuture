import { apiCall } from './client'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url: string
  created_at: string
  updated_at: string
}

// Get current user's profile
export async function getUserProfile(): Promise<UserProfile | null> {
  try {
    const data = await apiCall('/user/profile')
    return data
  } catch (error) {
    console.error('Error fetching user profile:', error)
    return null
  }
}

// Update user profile
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile | null> {
  try {
    const data = await apiCall('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates)
    })
    return data
  } catch (error) {
    console.error('Error updating user profile:', error)
    return null
  }
}