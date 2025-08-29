# Version 1.0: No Plan No Future - Personal Productivity & Fitness Management Platform

A comprehensive full-stack application that combines task management, calendar planning, and workout tracking in one unified platform. Built with modern web technologies and designed for personal productivity optimization.

## 🚀 Features

### 📅 Task Management
- **Smart Todo System**: Create, edit, and organize tasks with sections (Daily, Today, Upcoming)
- **Recurring Tasks**: Set up repeating tasks with flexible scheduling options
- **Priority Management**: Assign and sort tasks by priority levels
- **Date & Time Scheduling**: Full datetime support with time ranges
- **Task Completion Tracking**: Track completion history and patterns

### 📊 Calendar Integration  
- **Universal Date Navigation**: Seamless navigation across year/month/week/day views
- **Smart Breadcrumbs**: Context-aware navigation breadcrumbs
- **Calendar Sharing**: Share calendar views with others
- **Timetable Management**: Structured schedule planning

### 💪 Fitness & Workout Tracking
- **Workout Logger**: Track exercises, sets, reps, and weights
- **Exercise Database**: Built-in exercise library + custom exercise creation
- **Workout Templates**: Save and reuse workout routines
- **Progress Tracking**: Monitor fitness progress over time

### 🔔 Smart Features
- **Notifications System**: Stay on top of tasks and schedules
- **Statistics Dashboard**: Detailed analytics for both tasks and fitness
- **Responsive Design**: Optimized for desktop and mobile devices
- **Real-time Updates**: Live synchronization across devices

## 🛠️ Tech Stack

### Frontend
- **Framework**: React and Next.js 15+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives with custom component library
- **Icons**: Lucide React
- **State Management**: React Query (TanStack Query) for server state
- **Authentication**: Supabase Auth

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT with Supabase
- **API Architecture**: RESTful API with organized route modules

### Development Tools
- **Linting**: ESLint with comprehensive rules
- **Package Manager**: npm
- **Environment**: Development and production configurations

## 📁 Project Structure

```
├── client/                 # Next.js frontend application
│   ├── src/
│   │   ├── app/           # App router pages
│   │   ├── components/    # Reusable UI components
│   │   │   ├── calendar/  # Calendar-specific components
│   │   │   ├── gym/       # Fitness tracking components
│   │   │   ├── todo/      # Task management components
│   │   │   └── ui/        # Base UI components from Shadcn
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript type definitions
│   └── package.json
├── server/                 # Express.js backend API
│   ├── src/
│   │   ├── routes/        # API route handlers
│   │   ├── middleware/    # Express middleware
│   │   └── services/      # Business logic
│   └── package.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd taskfit
   ```

2. **Set up environment variables**
   
   **Client (.env.local):**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   
   **Server (.env):**
   ```env
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   PORT=3001
   ```

3. **Install dependencies**
   ```bash
   # Install client dependencies
   cd client
   npm install
   
   # Install server dependencies
   cd ../server
   npm install
   ```

4. **Set up the database**
   - Create the necessary tables in your Supabase project
   - Set up Row Level Security (RLS) policies
   - Configure authentication providers

5. **Run the development servers**
   
   **Frontend (Terminal 1):**
   ```bash
   cd client
   npm run dev
   ```
   
   **Backend (Terminal 2):**
   ```bash
   cd server
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## 📋 Database Schema

The application uses the following main tables:

- `todos` - Task management data
- `todo_completions` - Task completion tracking
- `workouts` - Completed workout records
- `workout_templates` - Reusable workout routines
- `exercises` - Exercise database (built-in + custom)
- `profiles` - User profile information
- `notifications` - User notifications
- `calendar_shares` - Calendar sharing configurations

## 🔐 Authentication & Security

- **Supabase Auth**: Secure user authentication and authorization
- **Row Level Security**: Database-level security policies
- **JWT Tokens**: Secure API communication
- **Protected Routes**: Client-side route protection
- **API Middleware**: Server-side authentication validation

### Developed by Tracy Chung and Woojin Song