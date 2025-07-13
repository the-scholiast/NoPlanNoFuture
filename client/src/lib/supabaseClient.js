import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Create and export a single Supabase client instance
// This client will be used throughout the application for:
// - Authentication (login, logout, session management)
// - Database queries (CRUD operations)
// - Real-time subscriptions
// - Storage operations
export const supabase = createClient(url, anonKey);

export { createClient };
