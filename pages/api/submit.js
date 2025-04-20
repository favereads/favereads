// pages/api/submit.js

import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  console.log('📦 API: /api/submit called')
  console.log('🧪 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🧪 Supabase KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...')
  console.log('📘 Incoming Book:', req.body)

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { title, comment, thumbnail, ageGroup, buyLinks } = req.body

  if (!title || !comment) {
    return res.status(400).json({ error: 'Missing title or comment' })
  }

  const safeBuyLinks = Array.isArray(buyLinks) ? buyLinks : []

  const { data, error } = await supabase
    .from('books')
    .upsert(
      {
        title,
        comment,
        comments: [comment],
        favorites: 1,
        thumbnail,
        age_group: ageGroup,
        buy_links: safeBuyLinks,
      },
      { onConflict: 'title' }
    )
    .select()

  if (error) {
    console.error('❌ Supabase Insert Error:', error)
    return res.status(500).json({ error: 'Failed to save book' })
  }

  res.status(200).json({ book: data[0] })
}
