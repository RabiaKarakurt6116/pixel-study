import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jtxubfamrhzlttbxhlhq.supabase.co'
const supabaseKey = 'sb_publishable_xDfmAY1QRwEPSVnLsUxXEQ_dHUqyZYR'

export const supabase = createClient(supabaseUrl, supabaseKey)
