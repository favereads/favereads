import { useState, useEffect } from 'react'

const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

export default function BookForm({ onAddBook, prefillTitle = '' }) {
  const [title, setTitle] = useState(prefillTitle)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(false)

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!title || selectedSuggestion) {
        setSuggestions([])
        return
      }

      const fetchSuggestions = async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
          const res = await fetch(
            `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${apiKey}`
          )
          const data = await res.json()

          const seen = new Set()
          const results = []
          for (const item of data.items || []) {
            const bookTitle = item.volumeInfo?.title?.trim()
            if (bookTitle && !seen.has(bookTitle.toLowerCase())) {
              seen.add(bookTitle.toLowerCase())
              results.push(bookTitle)
            }
            if (results.length === 5) break
          }

          setSuggestions(results)
        } catch (err) {
          console.error('Suggestion fetch failed:', err)
          setSuggestions([])
        }
      }

      fetchSuggestions()
    }, 400)

    return () => clearTimeout(delayDebounce)
  }, [title, selectedSuggestion])

  const handleSuggestionClick = (suggestedTitle) => {
    setTitle(suggestedTitle)
    setSuggestions([])
    setSelectedSuggestion(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title || !comment) return

    setLoading(true)

    if (IS_MOCK) {
      const mockData = {
        title,
        comment,
        ageGroup: '2–6',
        thumbnail: '/default-cover.jpg',
        buyLinks: []
      }

      console.log('🧪 MOCK MODE — Book would be submitted:', mockData)
      await new Promise((res) => setTimeout(res, 500))
      alert(`✅ [MOCK MODE] Book submitted:\n${title}`)

      setTitle('')
      setComment('')
      setSuggestions([])
      setSelectedSuggestion(false)
      setLoading(false)
      return
    }

    let thumbnail = ''
    let buyLinks = []
    let ageGroup = ''

    try {
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const encodedTitle = encodeURIComponent(title)
      const googleRes = await fetch(
        `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&key=${apiKey}`
      )
      const googleData = await googleRes.json()

      const bookInfo = googleData.items?.[0]?.volumeInfo
      const saleInfo = googleData.items?.[0]?.saleInfo

      if (bookInfo) {
        thumbnail = bookInfo.imageLinks?.thumbnail || ''

        if (bookInfo.categories) {
          const category = bookInfo.categories.find(cat =>
            /baby|toddler|preschool|age|children|kids/i.test(cat)
          )
          if (category) ageGroup = category
        }

        if (!ageGroup && bookInfo.description) {
          const desc = bookInfo.description.toLowerCase()
          if (desc.includes('ages 2') || desc.includes('toddlers')) ageGroup = '2–3'
          else if (desc.includes('ages 3') || desc.includes('preschool')) ageGroup = '3–4'
          else if (desc.includes('ages 4') || desc.includes('kindergarten')) ageGroup = '4–5'
          else if (desc.includes('ages 5') || desc.includes('early readers')) ageGroup = '5–6'
        }

        if (!ageGroup) ageGroup = '2–6'

        const amazon = saleInfo?.buyLink
        if (amazon) buyLinks.push({ name: 'Amazon', url: amazon })
      }
    } catch (err) {
      console.warn('Google Books API failed:', err)
    }

    if (!Array.isArray(buyLinks)) buyLinks = []

    await onAddBook(title, comment, ageGroup, thumbnail, buyLinks)
    setTitle('')
    setComment('')
    setSuggestions([])
    setSelectedSuggestion(false)
    setLoading(false)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 border border-gray-300 rounded shadow w-full relative">
      <h2 className="text-lg font-bold text-gray-800 mb-4 leading-tight">Share a favorite book your family loves</h2>

      <label className="text-sm font-medium text-gray-700 block mb-1">Book Title</label>
      <input
        type="text"
        value={title}
        onChange={(e) => {
          setTitle(e.target.value)
          setSelectedSuggestion(false)
        }}
        placeholder="Enter the book title"
        className="w-full border border-gray-300 rounded px-3 py-3 mb-1 text-sm"
      />

      {suggestions.length > 0 && !selectedSuggestion && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow max-h-48 overflow-auto w-full mt-1 mb-3 text-sm">
          {suggestions.map((s, idx) => (
            <li
              key={idx}
              onClick={() => handleSuggestionClick(s)}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
            >
              {s}
            </li>
          ))}
        </ul>
      )}

      <label className="text-sm font-medium text-gray-700 block mt-3 mb-1">Why is it your favorite?</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us why your child loves it!"
        className="w-full border border-gray-300 rounded px-3 py-3 mb-4 text-sm resize-none min-h-[120px]"
      />

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 text-sm"
      >
        {loading ? 'Sharing...' : 'Share Book'}
      </button>
    </form>
  )
}
