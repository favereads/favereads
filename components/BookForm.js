import { useState, useEffect } from 'react'

export default function BookForm({ onAddBook, prefillTitle = '' }) {
  const [title, setTitle] = useState(prefillTitle)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [selectedSuggestion, setSelectedSuggestion] = useState(false)
  const [errors, setErrors] = useState({})
  const [confirmationMsg, setConfirmationMsg] = useState('')

  const bannedPhrases = [
    'asdf', 'test', '123', '...', 'cool', 'nice', 'good', 'meaningful blabber',
    'great book', 'fun read', 'awesome', 'interesting', 'ok', 'fine',
    'hate it', 'boring', 'bad', 'terrible', 'meh', 'crap', 'junk',
    'f***', 'sex', 'sexy', 'stupid', 'dumb', 'idiot', 'nonsense'
  ]

  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  const isLowQualityComment = (text) => {
    const lowered = text.trim().toLowerCase()
    if (!lowered || lowered.length < 10) return true

    const isExactMatch = bannedPhrases.includes(lowered)
    const isShortAndSuspicious =
      lowered.length < 25 &&
      bannedPhrases.some(p =>
        lowered.match(new RegExp(`\\b${escapeRegExp(p)}\\b`, 'i'))
      )

    return isExactMatch || isShortAndSuspicious
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!title) newErrors.title = 'Book title is required.'
    if (isLowQualityComment(comment)) {
      newErrors.comment = 'Please write a more meaningful and respectful reason.'
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
    let description = ''

    try {
      const encodedTitle = encodeURIComponent(title)
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY
      const googleRes = await fetch(`https://www.googleapis.com/books/v1/volumes?q=intitle:${encodedTitle}&key=${apiKey}`)
      if (!googleRes.ok) throw new Error('Google API failed')

      const googleData = await googleRes.json()
      const bookInfo = googleData.items?.[0]?.volumeInfo
      const saleInfo = googleData.items?.[0]?.saleInfo

      if (!bookInfo || !bookInfo.title) {
        setErrors({ title: `❌ The book "${title}" could not be verified. Please check the spelling or try a different title.` })
        setLoading(false)
        return
      }

      description = bookInfo.description || ''
      const categoryText = (bookInfo.categories?.join(' ') || '').toLowerCase()
      const textSources = `${description} ${comment}`.toLowerCase()

      // Enhanced logic for age group detection
      if (/level\s*1/.test(textSources)) {
        ageGroup = '3–4'
      } else if (/level\s*2/.test(textSources)) {
        ageGroup = '4–5'
      } else if (/level\s*3/.test(textSources)) {
        ageGroup = '5–6'
      } else if (/level\s*4/.test(textSources)) {
        ageGroup = '6–7'
      } else if (/level\s*5/.test(textSources)) {
        ageGroup = '7–8'
      } else if (categoryText.includes('nursery') || /toddler/.test(textSources)) {
        ageGroup = '2–3'
      } else if (categoryText.includes('phonics') || categoryText.includes('early reader') || /ages? ?4|ages? ?5/.test(textSources)) {
        ageGroup = '4–5'
      } else if (categoryText.includes('independent reader') || /ages? ?6|ages? ?7/.test(textSources)) {
        ageGroup = '6+'
      } else if (categoryText.includes('computer') || categoryText.includes('business') || categoryText.includes('science') || categoryText.includes('history')) {
        ageGroup = '12+'
        isKidBook = false
      } else {
        ageGroup = '2–3' // fallback
      }

      if (!isKidBook && /2|3|4|5|6/.test(ageGroup)) {
        isKidBook = true
      }

      thumbnail = bookInfo.imageLinks?.thumbnail || '/default-cover.jpg'
      const amazon = saleInfo?.buyLink
      if (amazon) buyLinks.push({ name: 'Amazon', url: amazon })

    } catch (err) {
      console.error('Google API failed:', err)
      setErrors({ title: 'Could not fetch book details. Please try again.' })
      setLoading(false)
      return
    }

    console.log('Submitting book with isKidBook =', isKidBook)

    await onAddBook(title, comment, ageGroup, thumbnail, buyLinks, isKidBook, description)

    console.log('[BookForm] onAddBook params:', {
      title,
      comment,
      ageGroup,
      thumbnail,
      buyLinks,
      isKidBook,
      description,
    })

    const tab = isKidBook ? 'Kids Books 📚' : 'Other Books 📖'
    setConfirmationMsg(`Your book was added in the ${tab}`)
    setTimeout(() => setConfirmationMsg(''), 2500)

    setTitle('')
    setComment('')
    setSuggestions([])
    setSelectedSuggestion(false)
    setLoading(false)
  }

  const handleSuggestionClick = (suggestedTitle) => {
    setTitle(suggestedTitle)
    setSuggestions([])
    setSelectedSuggestion(true)
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
