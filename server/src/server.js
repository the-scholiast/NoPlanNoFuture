// COMBINED EXPRESS.JS SERVER - Main Entry Point
// Serves as the central API server for the NoPlanNoFuture application
// Handles todos, workouts, exercises, profiles, and notifications
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import apiRoutes from './routes/index.js'
import { startNotificationScheduler } from './services/notificationScheduler.js'

const app = express()
const PORT = process.env.PORT || 3001

// MIDDLEWARE SETUP

// Enable CORS configuration - allows frontend to talk to backend
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001', // Allow requests between frontend and backend
    `https://no-plan-no-future.vercel.app/`,
    'https://*.vercel.app'
  ],
  credentials: true, // Allow cookies and auth headers
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parse JSON bodies - converts request bodies to JavaScript objects
app.use(express.json())
// Parse URL-encoded bodies - handles form submissions
app.use(express.urlencoded({ extended: true }))

// ROUTES

// Health check endpoint - returns server status and available endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'NoPlanNoFuture API Server is running!',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    endpoints: {
      todos: '/api/todos',
      exercises: '/api/exercises',
      workoutTemplates: '/api/workout-templates',
      workouts: '/api/workouts',
      profile: '/api/profile',
      stats: '/api/stats'
    }
  })
})

// Simple health check for debugging - minimal response for monitoring
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Main API routes - all business logic routes are prefixed with /api
app.use('/api', apiRoutes)

// ERROR HANDLING

// 404 handler for undefined routes - catches all unmatched requests
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    method: req.method,
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: {
      health: 'GET /',
      api: 'GET /api/*'
    }
  })
})

// Global error handler - catches all errors thrown by routes
// Provides detailed error info in development, generic messages in production
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)

  // Log more details in development
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error stack:', err.stack)
    console.error('Request details:', {
      method: req.method,
      path: req.path,
      headers: req.headers,
      body: req.body
    })
  }

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error' // Generic message for production security
      : err.message, // Detailed message for development debugging
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.details || null
    })
  })
})

// SERVER STARTUP

app.listen(PORT, () => {
  console.log('\n🚀 Server started successfully!')
  console.log(` 🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(` ⏰ Started at: ${new Date().toISOString()}`)

  // Environment variable validation - ensures required config is present
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingEnvVars.length > 0) {
    console.warn('\n ⚠️  WARNING: Missing environment variables:')
    missingEnvVars.forEach(varName => {
      console.warn(`   - ${varName}`)
    })
    console.warn('🔌 Database connections may fail!')
  } else {
    console.log('✅ Environment variables loaded')
  }

  // Initialize background services
  startNotificationScheduler() // Start scheduled task notifications
})

// PROCESS MANAGEMENT
// Graceful shutdown handlers - ensures clean server shutdown
process.on('SIGTERM', () => { process.exit(0) })
process.on('SIGINT', () => { process.exit(0) })

export default app