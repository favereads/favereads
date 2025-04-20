// pages/api/status.js
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  try {
    const { data, error } = await supabase.from('books').select('*').limit(1)

    if (error) {
      console.error('🔴 Supabase status check failed:', error)
      return res.status(500).json({ status: 'error', message: 'Supabase query failed', detail: error.message || error })
    }

    return res.status(200).json({ status: 'ok', dataCount: data?.length || 0 })
  } catch (err) {
    console.error('🔴 Supabase unreachable:', err)
    return res.status(500).json({ status: 'error', message: 'Fetch failed', detail: err.message || err })
  }
}
