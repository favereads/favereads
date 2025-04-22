import { useState, useEffect } from 'react'

export default function BookForm({ onAddBook, prefillTitle = '' }) {
  const [title, setTitle] = useState(prefillTitle)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(false)
  const [errors, setErrors] = useState({})
  const [confirmationMsg, setConfirmationMsg] = useState('')

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (!title || selectedSuggestion) {
        setSuggestions([])
        return
      }

      const fetchSuggestions = async () => {
        try {
          const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
          const res = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${apiKey}`)
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
    const newErrors = {}

    if (!title) newErrors.title = 'Book title is required.'
    if (!comment || comment.trim().length < 10 || /^(asdf|test|123|\.\.\.)$/i.test(comment.trim())) {
      newErrors.comment = 'Please write a more helpful reason.'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    setErrors({})

    let thumbnail = ''
    let buyLinks = []
    let ageGroup = ''
    let isKidBook = false

    try {
      const encodedTitle = encodeURIComponent(title)
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&key=${apiKey}`)
      if (!googleRes.ok) throw new Error('Google API failed')

      const googleData = await googleRes.json()
      const bookInfo = googleData.items?.[0]?.volumeInfo
      const saleInfo = googleData.items?.[0]?.saleInfo

      if (!bookInfo || !bookInfo.title || !bookInfo.imageLinks?.thumbnail) {
        setErrors({ title: `❌ The book "${title}" could not be verified. Please check the spelling or try a different title.` })
        setLoading(false)
        return
      }

      thumbnail = bookInfo.imageLinks.thumbnail
      ageGroup = bookInfo.categories?.[0] || ''

      // 🌟 Normalize vague categories
      if (!ageGroup || /juvenile|fiction|literature/i.test(ageGroup)) {
        ageGroup = '2–6'
      }

      // 🔍 Smarter child book detection
      const kidKeywords = [
        'children', 'kids', 'child', 'toddler', 'preschool', 'early reader',
        'ages', 'board book', 'read aloud', 'alphabet', 'picture book',
        'nursery', 'baby', 'young reader', 'rhyming', 'storybook',
        'juvenile fiction', 'juvenile literature'
      ]

      const isLikelyKidBook = (text) =>
        text && kidKeywords.some(k => text.toLowerCase().includes(k))

      isKidBook =
        (bookInfo.categories && bookInfo.categories.some(isLikelyKidBook)) ||
        isLikelyKidBook(bookInfo.title) ||
        isLikelyKidBook(bookInfo.subtitle) ||
        isLikelyKidBook(bookInfo.description)

      // ✅ Final fallback: pattern-based age detection
      if (!isKidBook && /[2–7]/.test(ageGroup)) {
        isKidBook = true
      }

      const amazon = saleInfo?.buyLink
      if (amazon) buyLinks.push({ name: 'Amazon', url: amazon })

      console.log('📘 Final Category:', isKidBook ? 'Kids' : 'Other')
      console.log('📗 Age Group:', ageGroup)
      console.log('🧠 DEBUG — isKidBook:', isKidBook)
      console.log('📕 Categories:', bookInfo.categories)
      console.log('📙 Title:', bookInfo.title)
      console.log('📗 Subtitle:', bookInfo.subtitle)
      console.log('📘 Description:', bookInfo.description)

    } catch (err) {
      console.error('Google API failed:', err)
      setErrors({ title: 'Could not fetch book details. Please try again.' })
      setLoading(false)
      return
    }

    console.log('🚀 Submitting to Supabase:', {
      title, comment, ageGroup, thumbnail, buyLinks, isKidBook
    })

    await onAddBook(title, comment, ageGroup, thumbnail, buyLinks, isKidBook)

    const tab = isKidBook ? 'Kids Books 📚' : 'Other Books 📖'
    setConfirmationMsg(`Your book was added in the ${tab}`)
    setTimeout(() => setConfirmationMsg(''), 2500)

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
        className="w-full border border-gray-300 rounded px-3 py-3 text-sm mb-1"
      />
      {errors.title && <p className="text-red-600 text-xs mb-2">{errors.title}</p>}

      {suggestions.length > 0 && !selectedSuggestion && (
        <ul className="absolute z-10 bg-white border border-gray-300 rounded shadow max-h-48 overflow-auto w-full mt-1 mb-2 text-sm">
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

      <label className="text-sm font-medium text-gray-700 block mt-2 mb-1">Why is it your favorite?</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Tell us why your child loves it!"
        className="w-full border border-gray-300 rounded px-3 py-3 text-sm resize-none min-h-[120px]"
      />
      {errors.comment && <p className="text-red-600 text-xs mb-3">{errors.comment}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white font-semibold py-2 rounded hover:bg-blue-700 text-sm"
      >
        {loading ? 'Sharing...' : 'Share Book'}
      </button>

      {confirmationMsg && (
        <p className="text-sm text-green-600 mt-2 text-center">{confirmationMsg}</p>
      )}
    </form>
  )
}
