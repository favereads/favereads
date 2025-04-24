// pages/api/submit.js
import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  let { title, comment, thumbnail, ageGroup, buyLinks, isKidBook } = req.body
  const safeBuyLinks = Array.isArray(buyLinks) ? buyLinks : []
  const category = isKidBook ? 'Kids' : 'Other'

  // 🔍 Auto-detect ageGroup if not provided or clearly incorrect
  if (!ageGroup || ageGroup === '2–3') {
    ageGroup = inferAgeGroup({ title, description })
    console.log(`🔁 Adjusted ageGroup: ${ageGroup}`)
  }

  console.log('📦 API: /api/submit called')
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

// 🔍 Age group inference logic
function inferAgeGroup({ title = '', description = '' }) {
  const combined = (title + ' ' + description).toLowerCase()

  if (/level\s*1/.test(combined)) return '3–4'
  if (/level\s*2/.test(combined)) return '4–5'
  if (/level\s*3/.test(combined)) return '5–6'
  if (/level\s*4/.test(combined)) return '6–7'
  if (/level\s*5/.test(combined)) return '7–8'

  if (combined.includes('step into reading') || combined.includes('phonics')) return '4–6'
  if (combined.includes('beginner') || combined.includes('early reader')) return '4–5'
  if (combined.includes('picture book')) return '2–4'
  if (combined.includes('board book')) return '1–3'

  return '2–3' // fallback
}
