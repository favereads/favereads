import { useState } from 'react'

export default function BookCard({ book, onLike, view }) {
  const [showAllComments, setShowAllComments] = useState(false)
  const comments = Array.isArray(book.comments) ? book.comments : [book.comment]
  const mainComment = comments[0]

  const BuyLinks = () =>
    book.buyLinks?.filter(link => link.name !== 'Google Books').map(link => (
      <div key={link.name}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm"
        >
          {link.name === 'Amazon' ? 'Check on Amazon' : link.name}
        </a>
      </div>
    ))

  const TruncatedComment = () => (
    <div className="text-sm italic text-gray-700 truncate w-full overflow-hidden whitespace-nowrap text-ellipsis">
      <span className="cursor-help" title={mainComment}>“{mainComment}”</span>
    </div>
  )

  const cardStyle = "bg-white border border-gray-200 p-4 rounded shadow-sm"

  if (view === 'tile') {
    return (
      <div className={`${cardStyle} w-full flex space-x-4`}>
        <img src={book.thumbnail || '/default-cover.jpg'} alt={book.title} className="w-20 h-28 object-cover rounded border" />
        <div className="flex-1">
          <div className="flex justify-between">
            <div>
              <h2 className="text-lg font-bold">{book.title}</h2>
              <p className="text-sm text-gray-500">Age: {book.ageGroup}</p>
            </div>
            <button onClick={onLike} className="text-pink-600 text-sm flex items-center space-x-1 hover:opacity-75">
              ❤️ <span>{book.favorites || 1}</span>
            </button>
          </div>
          <TruncatedComment />
          {comments.length > 1 && (
            <div className="mt-1 text-sm">
              <button onClick={() => setShowAllComments(!showAllComments)} className="text-blue-600 underline">
                {showAllComments ? 'Hide all reasons' : `+${comments.length - 1} more reason(s)`}
              </button>
              {showAllComments && (
                <ul className="mt-1 list-disc pl-5 text-gray-700">
                  {comments.slice(1).map((cmt, idx) => <li key={idx}>{cmt}</li>)}
                </ul>
              )}
            </div>
          )}
          <div className="mt-2 text-sm text-blue-600"><BuyLinks /></div>
        </div>
      </div>
    )
  }

  // List view
  return (
    <div className={`${cardStyle} w-full max-w-6xl flex space-x-4`}>
      <img src={book.thumbnail || '/default-cover.jpg'} alt={book.title} className="w-12 h-16 object-cover rounded border" />
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h2 className="text-base font-bold">{book.title} <span className="text-sm text-gray-500 font-normal">(Age: {book.ageGroup})</span></h2>
          <button onClick={onLike} className="text-pink-600 text-sm flex items-center space-x-1 hover:opacity-75">
            ❤️ <span>{book.favorites || 1}</span>
          </button>
        </div>
        <TruncatedComment />
        <div className="mt-2 text-right text-sm"><BuyLinks /></div>
      </div>
    </div>
  )
}
