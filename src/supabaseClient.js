import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jtxubfamrhzlttbxhlhq.supabase.co'
const supabaseKey = 'sb_publishable_xDfmAY1QRwEPSVnLsUxXEQ_dHUqyZYR'

// Mobil debug için
console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key exists:', !!supabaseKey)

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    storageKey: 'supabase-auth',
    storage: localStorage
  },
  global: {
    headers: {
      'X-Client-Info': 'pixel-study-mobile'
    }
  }
})

// Test connection
supabase.from('users').select('count').then(res => {
  console.log('Supabase connection test:', res.error ? 'FAILED' : 'OK', res.error)
})