import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jtxubfamrhzlttbxhlhq.supabase.co'
const supabaseKey = 'sb_publishable_xDfmAY1QRwEPSVnLsUxXEQ_dHUqyZYR'

// ZORUNLU: API key'in doğru formatta olduğundan emin ol
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  }
})

// TEST: Bağlantıyı kontrol et
supabase.from('users').select('*', { count: 'exact', head: true })
  .then(({ error }) => {
    if (error) {
      console.error('🔴 Supabase connection error:', error.message)
    } else {
      console.log('🟢 Supabase connected successfully!')
    }
  })