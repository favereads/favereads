import Head from 'next/head'
import BookCard from '../components/BookCard'
import BookForm from '../components/BookForm'
import { useState } from 'react'
import { LayoutList, LayoutGrid } from 'lucide-react'

const ITEMS_PER_PAGE = 6

export default function Home() {
  const [books, setBooks] = useState([])
  const [view, setView] = useState('list')
  const [currentPage, setCurrentPage] = useState(1)

  const handleAddBook = async (title, comment) => {
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, comment })
      })
      const data = await res.json()
      if (!data.book) return alert('Something went wrong')

      const submittedBook = data.book
      setBooks(prev => {
        const existing = prev.find(b => b.title.toLowerCase() === submittedBook.title.toLowerCase())
        if (existing) {
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
        return [{ ...submittedBook, favorites: 1, comments: [submittedBook.comment] }, ...prev]
      })
    } catch (err) {
      console.error('Add book error:', err)
    }
  }

  const handleLike = (title) => {
    setBooks(prev =>
      prev.map(book =>
        book.title === title ? { ...book, favorites: (book.favorites || 1) + 1 } : book
      )
    )
  }

  const totalPages = Math.ceil(books.length / ITEMS_PER_PAGE)
  const displayedBooks = books.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      <Head>
        <title>FaveReads</title>
      </Head>

      {/* Header */}
      <header className="bg-green-100 py-8 text-center">
        <div className="flex items-center justify-center space-x-4">
          <img src="/favereads-logo2.png" alt="FaveReads logo" className="w-11 h-11" />
          <h1 className="text-4xl font-bold text-gray-800">FaveReads</h1>
        </div>
        <p className="text-gray-700 mt-2 text-base">
          Favorite Books shared by parents for you! Share your favorites with other parents!
        </p>
      </header>

      {/* Toggle View */}
      <div className="max-w-6xl mx-auto px-4 mt-6 mb-4 flex justify-end space-x-2">
        <button onClick={() => setView('list')} className={`p-2 border rounded ${view === 'list' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}>
          <LayoutList size={18} />
        </button>
        <button onClick={() => setView('tile')} className={`p-2 border rounded ${view === 'tile' ? 'bg-blue-600 text-white' : 'text-blue-600'}`}>
          <LayoutGrid size={18} />
        </button>
      </div>

      {/* Books */}
     <div className={`mx-auto ${view === 'tile' ? 'grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 px-6' : 'flex flex-col items-center gap-4 px-4'} max-w-6xl`}>

        {displayedBooks.map((book, i) => (
          <BookCard key={i} book={book} onLike={() => handleLike(book.title)} view={view} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center space-x-2">
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

      {/* Share Form */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-md py-4 px-4">
        <div className="max-w-2xl mx-auto">
          <BookForm onAddBook={handleAddBook} />
        </div>
      </div>
    </div>
  )
}
