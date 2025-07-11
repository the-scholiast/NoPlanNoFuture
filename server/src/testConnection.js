// server/src/testConnection.js
import supabase from './supabaseAdmin.js'

async function test() {
  const { data, error } = await supabase.from('users').select('*')

  if (error) {
    console.error('❌ Supabase error:', error)
  } else {
    console.log('✅ Supabase connected. Users:', data)
  }
}

test()
