import Head from 'next/head'
import BookCard from '../components/BookCard'
import BookForm from '../components/BookForm'
import { useState, useEffect } from 'react'
import { LayoutList, LayoutGrid } from 'lucide-react'

const ITEMS_PER_PAGE = 21
const IS_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === 'true'

const bannedCommentPhrases = [
  'asdf', 'test', '123', '...', 'cool', 'nice', 'good', 'meaningful blabber',
  'great book', 'fun read', 'awesome', 'interesting', 'ok', 'fine',
  'hate it', 'boring', 'bad', 'terrible', 'meh', 'crap', 'junk',
  'f***', 'sex', 'sexy', 'stupid', 'dumb', 'idiot', 'nonsense'
]

const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const isLowQualityComment = (text) => {
  const lowered = text.trim().toLowerCase()
  if (!lowered || lowered.length < 10) return true

  const isExactMatch = bannedCommentPhrases.includes(lowered)
  const isShortAndSuspicious =
    lowered.length < 25 &&
    bannedCommentPhrases.some(p =>
      lowered.match(new RegExp(`\\b${escapeRegExp(p)}\\b`, 'i'))
    )

  return isExactMatch || isShortAndSuspicious
}

const normalizeAgeGroup = (raw) => {
  if (!raw) return '2–3'
  if (/2|3/.test(raw)) return '2–3'
  if (/4|5/.test(raw)) return '4–5'
  if (/6|7|8|9|10|11|12/.test(raw)) return '6+'
  return '2–3'
}
// Example usage
const examples = ['2–5 years', 'ages 4 and up', '8-12', '', null, 'Readers', 'Preschool']
console.log(examples.map(normalizeAgeGroup))


export default function Home() {
  const [books, setBooks] = useState([])
  const [view, setView] = useState('list')
  const [currentPage, setCurrentPage] = useState(1)
  const [prefillTitle, setPrefillTitle] = useState('')
  const [activeTab, setActiveTab] = useState('Kids')
  const [ageFilter, setAgeFilter] = useState('All')
  const [kidsBadgeCount, setKidsBadgeCount] = useState(0)
  const [otherBadgeCount, setOtherBadgeCount] = useState(0)

  useEffect(() => {
    async function loadBooks() {
      if (IS_MOCK) return setBooks([])
      const res = await fetch('/api/books')
      const data = await res.json()
      const normalized = data.books.map(b => ({
        ...b,
        ageGroup: normalizeAgeGroup(b.age_group),
        category: b.category || 'Kids',
        buyLinks: b.buy_links,
        thumbnail: b.thumbnail,
      }))
      setBooks(normalized)
    }
    loadBooks()
  }, [])

  const handleAddBook = async (title, comment, ageGroup, thumbnail, buyLinks, isKidBook = true) => {
   const category = !!isKidBook ? 'Kids' : 'Other'
    console.log('[index.js] isKidBook received =', isKidBook)
    console.log('[index.js] isKidBook received =', isKidBook, typeof isKidBook)


    if (IS_MOCK) return

    if (isLowQualityComment(comment)) {
      alert('Please write a more meaningful and respectful comment.')
      return
    }

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, comment, ageGroup, thumbnail, buyLinks, category, isKidBook })

      })
      const data = await res.json()
      if (!data.book) return alert('Something went wrong')

      const submittedBook = {
        ...data.book,
        ageGroup: normalizeAgeGroup(data.book.age_group),
        category: data.book.category || 'Kids',
        buyLinks: data.book.buy_links,
        thumbnail: data.book.thumbnail
      }

      setBooks(prev => {
        const exists = prev.find(b => b.title.toLowerCase() === submittedBook.title.toLowerCase())
        if (exists) {
          return prev.map(b =>
            b.title.toLowerCase() === submittedBook.title.toLowerCase()
              ? {
                  ...b,
                  favorites: (b.favorites || 1) + 1,
                  comments: [...(b.comments || [b.comment]), submittedBook.comment]
                }
              : b
          )
        }

        if (submittedBook.category !== activeTab) {
          submittedBook.category === 'Kids'
            ? setKidsBadgeCount(prev => prev + 1)
            : setOtherBadgeCount(prev => prev + 1)
        }

        return [{ ...submittedBook, favorites: 1, comments: [submittedBook.comment] }, ...prev]
      })
    } catch (err) {
      console.error('Add book error:', err)
    }
  }

  const handleTabClick = (tab) => {
    setActiveTab(tab)
    setAgeFilter('All')
    if (tab === 'Kids') setKidsBadgeCount(0)
    if (tab === 'Other') setOtherBadgeCount(0)
  }

  const handleLike = (title) => {
    setBooks(prev =>
      prev.map(book =>
        book.title === title ? { ...book, favorites: (book.favorites || 1) + 1 } : book
      )
    )
  }

  const handleAddReason = (title, newComment) => {
    if (isLowQualityComment(newComment)) {
      alert('Please share a thoughtful reason. Comments like this aren’t helpful.')
      return
    }

    setBooks(prev =>
      prev.map(book =>
        book.title === title
          ? {
              ...book,
              favorites: (book.favorites || 1) + 1,
              comments: [...(book.comments || [book.comment]), newComment]
            }
          : book
      )
    )
  }

  const ageGroupsForTab = Array.from(new Set(
    books.filter(b => b.category === activeTab).map(b => b.ageGroup)
  ))

  const filteredBooks = books.filter(b =>
    b.category === activeTab && (ageFilter === 'All' || b.ageGroup === ageFilter)
  )

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE)
  const displayedBooks = filteredBooks.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Head><title>FaveReads</title></Head>

      <header className="bg-green-100 py-8 text-center">
        <div className="flex items-center justify-center space-x-4">
          <img src="/favereads-logo2.png" alt="FaveReads logo" className="w-11 h-11" />
          <h1 className="text-4xl font-bold text-gray-800">FaveReads</h1>
        </div>
        <p className="text-gray-700 mt-2 text-base">Favorite Books shared by parents for you! Share your favorites!</p>
      </header>

      <main className="flex-grow max-w-[1280px] mx-auto px-4 mt-8 md:grid md:grid-cols-[1fr_320px] gap-6">
        <section className="min-w-0">
          <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
            <div className="flex space-x-4">
              {['Kids', 'Other'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => handleTabClick(tab)}
                  className={`relative text-sm font-semibold ${
                    activeTab === tab ? 'text-blue-600 underline' : 'text-gray-600'
                  }`}
                >
                  {tab === 'Kids' ? '📚 Kids Books' : '📖 Other Books'}
                  {tab === 'Kids' && kidsBadgeCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-blue-600 text-white rounded-full px-1.5 text-xs">{kidsBadgeCount}</span>
                  )}
                  {tab === 'Other' && otherBadgeCount > 0 && (
                    <span className="absolute -top-2 -right-4 bg-blue-600 text-white rounded-full px-1.5 text-xs">{otherBadgeCount}</span>
                  )}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={ageFilter}
                onChange={(e) => setAgeFilter(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1"
              >
                <option value="All">All Ages</option>
                {ageGroupsForTab.map((age, idx) => (
                  <option key={idx} value={age}>{age}</option>
                ))}
              </select>

              <button onClick={() => setView('list')} className={`p-2 border rounded ${view === 'list' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}><LayoutList size={18} /></button>
              <button onClick={() => setView('tile')} className={`p-2 border rounded ${view === 'tile' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}><LayoutGrid size={18} /></button>
            </div>
          </div>

          <div className={`${view === 'tile' ? 'grid gap-5 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 auto-rows-fr' : 'flex flex-col gap-3'}`}>
            {displayedBooks.map((book, i) => (
              <BookCard key={i} book={book} view={view} onLike={handleLike} onAddReason={handleAddReason} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6 flex justify-center space-x-2 w-full">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-600 text-white' : 'text-blue-600'}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="w-full md:w-[320px] md:sticky md:top-[100px]">
          <BookForm onAddBook={handleAddBook} prefillTitle={prefillTitle} />
        </aside>
      </main>

      <footer className="mt-12 bg-gray-100 py-6 text-sm text-gray-600 text-center border-t border-gray-200">
        <p className="mb-2">FaveReads helps parents discover and share the books their kids love most.</p>
        <p className="space-x-4">
          <a href="#" className="hover:underline">About Us</a>
          <a href="#" className="hover:underline">Terms</a>
          <a href="#" className="hover:underline">Privacy</a>
        </p>
        <p className="mt-2">© 2025 FaveReads</p>
      </footer>
    </div>
  )
}
