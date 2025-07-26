// EXPRESS.JS SERVER MAIN FILE
import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import apiRoutes from './routes/index.js'

const app = express()
const PORT = process.env.PORT || 5000

// =============================================
// MIDDLEWARE SETUP
// =============================================

// Enable CORS for your Next.js frontend
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}))

// Parse JSON bodies
app.use(express.json())

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }))

// =============================================
// ROUTES
// =============================================

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'NoPlanNoFuture API Server is running!', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  })
})

// API routes
app.use('/api', apiRoutes)

// =============================================
// ERROR HANDLING
// =============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    path: req.path,
    method: req.method
  })
})

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err)
  
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  })
})

// =============================================
// SERVER STARTUP
// =============================================

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
  console.log(`📡 API available at http://localhost:${PORT}/api`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  
  // Log available endpoints
  console.log('\n📋 Available API endpoints:')
  console.log('  GET    /api/todos')
  console.log('  POST   /api/todos')
  console.log('  PATCH  /api/todos/:id')
  console.log('  DELETE /api/todos/:id')
  console.log('  POST   /api/todos/bulk-delete')
  console.log('  GET    /api/profile')
  console.log('  PATCH  /api/profile')
  console.log('  GET    /api/workout-templates')
  console.log('  POST   /api/workout-templates')
  console.log('  PATCH  /api/workout-templates/:id')
  console.log('  DELETE /api/workout-templates/:id')
  console.log('  GET    /api/workouts')
  console.log('  POST   /api/workouts')
  console.log('  PATCH  /api/workouts/:id')
  console.log('  DELETE /api/workouts/:id')
  console.log('  GET    /api/exercises')
  console.log('  POST   /api/exercises')
  console.log('  GET    /api/stats')
  console.log('')
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app