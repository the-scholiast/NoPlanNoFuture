// COMBINED EXPRESS.JS SERVER - Main Entry Point
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import apiRoutes from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 3001

// MIDDLEWARE SETUP

// Enable CORS configuration - allows frontend to talk to backend
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001' // Allow requests between frontend and backend
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))

// Parse JSON bodies - converts request bodies to JavaScript objects
app.use(express.json())
// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }))

// Request logging middleware (development only)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`)
    next()
  })
}

// =============================================
// ROUTES
// =============================================

// Health check endpoint
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

// Simple health check for debugging
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})

// Main app mounts API routes
app.use('/api', apiRoutes)

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler for undefined routes
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

// Global error handler when a route calls next(error)
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
      ? 'Internal server error'
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && {
      stack: err.stack,
      details: err.details || null
    })
  })
})

// =============================================
// SERVER STARTUP
// =============================================

app.listen(PORT, () => {
  console.log('\n Server started successfully!')
  console.log(` API available at http://localhost:${PORT}/api`)
  console.log(` Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(` Started at: ${new Date().toISOString()}`)

  // Environment check
  const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']
  const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

  if (missingEnvVars.length > 0) {
    console.warn('\n  WARNING: Missing environment variables:')
    missingEnvVars.forEach(varName => {
      console.warn(`   - ${varName}`)
    })
    console.warn('   Database connections may fail!')
  } else {
    console.log(' Environment variables loaded')
  }
})

// Graceful shutdown handlers
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully')
  process.exit(0)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

export default app