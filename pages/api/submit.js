// pages/api/submit.js

import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  const { title, comment, thumbnail, ageGroup, buyLinks, isKidBook } = req.body
  const category = isKidBook ? 'Kids' : 'Other'
  const safeBuyLinks = Array.isArray(buyLinks) ? buyLinks : []

  console.log('📦 API: /api/submit called')
  console.log('🧪 Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('🧪 Supabase KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 10) + '...')
  console.log('📘 Incoming Book:', {
    title,
    comment,
    ageGroup,
    thumbnail,
    buyLinks: safeBuyLinks,
    category,
    isKidBook
  })

  if (!title || !comment) {
    return res.status(400).json({ error: 'Missing title or comment' })
  }

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
        category,
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
