import express from 'express';
import { createClient } from '@supabase/supabase-js';

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// =============================================
// AUTHENTICATION HELPER
// =============================================

const verifyToken = async (token) => {
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    throw new Error('Invalid token');
  }
  return user;
};

// =============================================
// MIDDLEWARE FOR AUTHENTICATION
// =============================================

const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
      return res.status(401).json({ error: 'No token provided' })
    }

    const user = await verifyToken(token)
    req.user = user
    next()
  } catch (error) {
    console.error('Auth error:', error)
    res.status(401).json({ error: 'Invalid token' })
  }
}

// =============================================
// TODOS API ROUTES
// =============================================

// GET /api/todos - Get all todos for authenticated user
router.get('/todos', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('todos')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform to frontend format
    const todos = data.map(todo => ({
      id: todo.id,
      title: todo.title,
      completed: todo.completed,
      createdAt: new Date(todo.created_at),
      section: todo.section,
      priority: todo.priority,
      startDate: todo.start_date,
      endDate: todo.end_date,
      startTime: todo.start_time,
      endTime: todo.end_time
    }))

    res.json(todos)
  } catch (error) {
    console.error('Error fetching todos:', error)
    res.status(500).json({ error: 'Failed to fetch todos' })
  }
})

// POST /api/todos - Create a new todo
router.post('/todos', authenticateUser, async (req, res) => {
  try {
    const { title, section, priority, startDate, endDate, startTime, endTime } = req.body

    if (!title || !section) {
      return res.status(400).json({ error: 'Title and section are required' })
    }

    const { data, error } = await supabase
      .from('todos')
      .insert({
        user_id: req.user.id,
        title,
        section,
        priority: priority || null,
        start_date: startDate || null,
        end_date: endDate || null,
        start_time: startTime || null,
        end_time: endTime || null
      })
      .select()
      .single()

    if (error) throw error

    // Transform to frontend format
    const todo = {
      id: data.id,
      title: data.title,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      section: data.section,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      startTime: data.start_time,
      endTime: data.end_time
    }

    res.status(201).json(todo)
  } catch (error) {
    console.error('Error creating todo:', error)
    res.status(500).json({ error: 'Failed to create todo' })
  }
})

// PATCH /api/todos/:id - Update a todo
router.patch('/todos/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    // Transform frontend format to database format
    const dbUpdates = {}
    if (updates.title !== undefined) dbUpdates.title = updates.title
    if (updates.completed !== undefined) dbUpdates.completed = updates.completed
    if (updates.section !== undefined) dbUpdates.section = updates.section
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority
    if (updates.startDate !== undefined) dbUpdates.start_date = updates.startDate
    if (updates.endDate !== undefined) dbUpdates.end_date = updates.endDate
    if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime
    if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime

    const { data, error } = await supabase
      .from('todos')
      .update(dbUpdates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    // Transform to frontend format
    const todo = {
      id: data.id,
      title: data.title,
      completed: data.completed,
      createdAt: new Date(data.created_at),
      section: data.section,
      priority: data.priority,
      startDate: data.start_date,
      endDate: data.end_date,
      startTime: data.start_time,
      endTime: data.end_time
    }

    res.json(todo)
  } catch (error) {
    console.error('Error updating todo:', error)
    res.status(500).json({ error: 'Failed to update todo' })
  }
})

// DELETE /api/todos/:id - Delete a todo
router.delete('/todos/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('todos')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting todo:', error)
    res.status(500).json({ error: 'Failed to delete todo' })
  }
})

// POST /api/todos/bulk-delete - Delete multiple todos
router.post('/todos/bulk-delete', authenticateUser, async (req, res) => {
  try {
    const { section, completed } = req.body

    let query = supabase
      .from('todos')
      .delete()
      .eq('user_id', req.user.id)

    if (section) {
      query = query.eq('section', section)
    }

    if (completed !== undefined) {
      query = query.eq('completed', completed)
    }

    const { data, error } = await query.select()

    if (error) throw error

    res.json({ success: true, deleted: data?.length || 0 })
  } catch (error) {
    console.error('Error bulk deleting todos:', error)
    res.status(500).json({ error: 'Failed to delete todos' })
  }
})

// =============================================
// USER PROFILE API ROUTES
// =============================================

// GET /api/profile - Get user profile
router.get('/profile', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', req.user.id)
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error fetching profile:', error)
    res.status(500).json({ error: 'Failed to fetch profile' })
  }
})

// PATCH /api/profile - Update user profile
router.patch('/profile', authenticateUser, async (req, res) => {
  try {
    const updates = req.body

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error updating profile:', error)
    res.status(500).json({ error: 'Failed to update profile' })
  }
})

// =============================================
// WORKOUT TEMPLATES API ROUTES
// =============================================

// GET /api/workout-templates - Get user's workout templates
router.get('/workout-templates', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('workout_templates')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching workout templates:', error)
    res.status(500).json({ error: 'Failed to fetch workout templates' })
  }
})

// POST /api/workout-templates - Create workout template
router.post('/workout-templates', authenticateUser, async (req, res) => {
  try {
    const { name, exercises, is_public } = req.body

    if (!name || !exercises) {
      return res.status(400).json({ error: 'Name and exercises are required' })
    }

    const { data, error } = await supabase
      .from('workout_templates')
      .insert({
        user_id: req.user.id,
        name,
        exercises,
        is_public: is_public || false
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating workout template:', error)
    res.status(500).json({ error: 'Failed to create workout template' })
  }
})

// PATCH /api/workout-templates/:id - Update workout template
router.patch('/workout-templates/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('workout_templates')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error updating workout template:', error)
    res.status(500).json({ error: 'Failed to update workout template' })
  }
})

// DELETE /api/workout-templates/:id - Delete workout template
router.delete('/workout-templates/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('workout_templates')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout template:', error)
    res.status(500).json({ error: 'Failed to delete workout template' })
  }
})

// =============================================
// COMPLETED WORKOUTS API ROUTES
// =============================================

// GET /api/workouts - Get completed workouts
router.get('/workouts', authenticateUser, async (req, res) => {
  try {
    const { limit, date } = req.query

    let query = supabase
      .from('workouts')
      .select('*')
      .eq('user_id', req.user.id)
      .order('date', { ascending: false })

    // If date is specified, filter by that specific date
    if (date) {
      query = query.eq('date', date)
    }

    if (limit && !date) { // Only apply limit if not filtering by date
      query = query.limit(parseInt(limit))
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching workouts:', error)
    res.status(500).json({ error: 'Failed to fetch workouts' })
  }
})

// GET /api/workouts/:id - Get specific completed workout
router.get('/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    const { data, error } = await supabase
      .from('workouts')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Workout not found' })
      }
      throw error
    }

    res.json(data)
  } catch (error) {
    console.error('Error fetching workout:', error)
    res.status(500).json({ error: 'Failed to fetch workout' })
  }
})

// POST /api/workouts - Save completed workout
router.post('/workouts', authenticateUser, async (req, res) => {
  try {
    const { name, template_id, exercises, notes, duration_minutes, date } = req.body

    if (!name || !exercises) {
      return res.status(400).json({ error: 'Name and exercises are required' })
    }

    const { data, error } = await supabase
      .from('workouts')
      .insert({
        user_id: req.user.id,
        name,
        template_id: template_id || null,
        exercises,
        notes: notes || null,
        duration_minutes: duration_minutes || null,
        date: date || new Date().toISOString().split('T')[0]
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error saving workout:', error)
    res.status(500).json({ error: 'Failed to save workout' })
  }
})

// PATCH /api/workouts/:id - Update completed workout
router.patch('/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const { data, error } = await supabase
      .from('workouts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single()

    if (error) throw error

    res.json(data)
  } catch (error) {
    console.error('Error updating workout:', error)
    res.status(500).json({ error: 'Failed to update workout' })
  }
})

// DELETE /api/workouts/:id - Delete completed workout
router.delete('/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params

    const { error } = await supabase
      .from('workouts')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id)

    if (error) throw error

    res.json({ success: true })
  } catch (error) {
    console.error('Error deleting workout:', error)
    res.status(500).json({ error: 'Failed to delete workout' })
  }
})

// =============================================
// EXERCISES API ROUTES
// =============================================

// GET /api/exercises - Get all exercises
router.get('/exercises', authenticateUser, async (req, res) => {
  try {
    const { search } = req.query

    let query = supabase
      .from('exercises')
      .select('*')
      .order('name')

    if (search) {
      query = query.ilike('name', `%${search}%`)
      query = query.limit(10)
    }

    const { data, error } = await query

    if (error) throw error

    res.json(data || [])
  } catch (error) {
    console.error('Error fetching exercises:', error)
    res.status(500).json({ error: 'Failed to fetch exercises' })
  }
})

// POST /api/exercises - Create custom exercise
router.post('/exercises', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ error: 'Exercise name is required' })
    }

    const { data, error } = await supabase
      .from('exercises')
      .insert({
        name,
        is_custom: true,
        created_by: req.user.id
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(data)
  } catch (error) {
    console.error('Error creating exercise:', error)
    res.status(500).json({ error: 'Failed to create exercise' })
  }
})

// =============================================
// STATS API ROUTES
// =============================================

// GET /api/stats - Get workout statistics
router.get('/stats', authenticateUser, async (req, res) => {
  try {
    // Get total workouts
    const { count: totalWorkouts } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    // Get total templates
    const { count: totalTemplates } = await supabase
      .from('workout_templates')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)

    // Get workouts this week
    const oneWeekAgo = new Date()
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7)

    const { count: workoutsThisWeek } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('date', oneWeekAgo.toISOString())

    // Get workouts this month
    const oneMonthAgo = new Date()
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

    const { count: workoutsThisMonth } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .gte('date', oneMonthAgo.toISOString())

    const stats = {
      totalWorkouts: totalWorkouts || 0,
      totalTemplates: totalTemplates || 0,
      workoutsThisWeek: workoutsThisWeek || 0,
      workoutsThisMonth: workoutsThisMonth || 0
    }

    res.json(stats)
  } catch (error) {
    console.error('Error fetching stats:', error)
    res.status(500).json({ error: 'Failed to fetch stats' })
  }
})

export default router;