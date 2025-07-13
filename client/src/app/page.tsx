'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function HomePage() {
  useEffect(() => {
    const testConnection = async () => {
      const { data, error } = await supabase.from('users').select('*')
      if (error) {
        console.error('❌ Supabase error:', error)
      } else {
        console.log('✅ Supabase connected. Users:', data)
      }
    }
    testConnection()
  }, [])

  return <main>Check console for Supabase test</main>
}
