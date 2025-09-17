import { getAuthHeaders } from './auth'

/**
 * This is the base URL where the backend API server is running.
 * It automatically uses the production server URL when deployed,
 * or falls back to localhost:3001 for local development.
 * 
 * Think of this as the "address" where your app sends requests to save/get data.
 */
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

/**
 * This is the main function that talks to your backend API server.
 * Think of it as a messenger that carries requests back and forth between 
 * your app (frontend) and your server (backend).
 * 
 * What it does automatically:
 * - Adds your authentication credentials to every request (so the server knows it's you)
 * - Handles the technical details of making HTTP requests
 * - Checks if the server responded successfully
 * - Converts the server's response into usable data
 * - Throws helpful error messages if something goes wrong
 * 
 * This function is used throughout the app whenever you need to:
 * - Save new tasks, workouts, or calendar events
 * - Fetch your existing data from the database  
 * - Update or delete information
 * - Get statistics or analytics
 * 
 * Example usage:
 * - apiCall('/todos', { method: 'GET' }) - Get all your tasks
 * - apiCall('/workouts', { method: 'POST', body: JSON.stringify(workout) }) - Save a workout
 * 
 * @param endpoint - The specific API route (like '/todos' or '/workouts/123')
 * @param options - Additional request settings (method, body, extra headers, etc.)
 * @returns Promise that resolves to the server's response data
 * @throws Error with helpful message if the request fails
 */
export async function apiCall(endpoint: string, options: RequestInit = {}) {
  // Get your authentication headers (proves you're logged in)
  const headers = await getAuthHeaders()

  // Make the actual request to the server
  // Combines the base URL + '/api' + your specific endpoint
  const response = await fetch(`${API_BASE}/api${endpoint}`, {
    ...options, // Spread any additional options (method, body, etc.)
    headers: {
      ...headers, // Include authentication headers
      ...options.headers // Include any additional headers passed in
    }
  })

  // Check if the server responded with an error
  if (!response.ok) {
    let error;
    try {
      // Try to get a detailed error message from the server
      error = await response.json();
    } catch {
      // If that fails, create a generic error message
      error = { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    // Throw an error with the most helpful message available
    throw new Error(error.error || error.message || `HTTP ${response.status}: ${response.statusText}`)
  }

  // If everything went well, convert the response to JSON and return it
  // This is the data your app components will use
  return response.json()
}