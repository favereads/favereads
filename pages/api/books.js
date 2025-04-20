import { supabase } from '../../lib/supabase'

export default async function handler(req, res) {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to fetch books' })
  }

  const normalizedBooks = data.map(b => ({
    ...b,
    ageGroup: b.age_group,
    buyLinks: b.buy_links,
    thumbnail: b.thumbnail
  }))

  res.status(200).json({ books: normalizedBooks })
}
