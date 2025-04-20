import { useState } from 'react'

export default function BookCard({ book, onLike, view }) {
  const [showModal, setShowModal] = useState(false)
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

  const Modal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg">
        <h3 className="text-lg font-semibold mb-4 text-center">Why parents love this book</h3>
        <ul className="list-disc pl-6 space-y-1 text-gray-700 text-sm">
          {comments.map((cmt, idx) => <li key={idx}>{cmt}</li>)}
        </ul>
        <div className="mt-6 text-center">
          <button onClick={() => setShowModal(false)} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Close
          </button>
        </div>
      </div>
    </div>
  )

  const ShowMoreLink = () => (
    <button
      onClick={() => setShowModal(true)}
      className="text-blue-600 underline text-sm mt-1"
    >
      See why parents love this book
    </button>
  )

  if (view === 'tile') {
    return (
      <>
        <div className={`${cardStyle} w-full flex space-x-4 min-w-0`}>
          <img src={book.thumbnail || '/default-cover.jpg'} alt={book.title} className="w-20 h-28 object-cover rounded border" />
          <div className="flex-1 min-w-0">
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
            {comments.length > 1 && <ShowMoreLink />}
            <div className="mt-2 text-sm text-blue-600"><BuyLinks /></div>
          </div>
        </div>
        {showModal && <Modal />}
      </>
    )
  }

  // List view
return (
  <>
    <div className={`${cardStyle} w-full max-w-5xl flex space-x-4 items-center px-4 py-2`}>
      <img
        src={book.thumbnail || '/default-cover.jpg'}
        alt={book.title}
        className="w-12 h-16 object-cover rounded border"
      />
      <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-base font-bold">
              {book.title}{' '}
              <span className="text-sm text-gray-500 font-normal">
                (Age: {book.ageGroup})
              </span>
            </h2>
            <TruncatedComment />
            {comments.length > 1 && (
              <div className="text-xs italic text-gray-500 mt-1">
                <button
                  onClick={() => setShowModal(true)}
                  className="underline"
                >
                  + See why parents love this book
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end justify-between h-full ml-4">
            <button
              onClick={onLike}
              className="text-pink-600 text-sm flex items-center space-x-1 hover:opacity-75"
            >
              ❤️ <span>{book.favorites || 1}</span>
            </button>
            <div className="text-sm text-blue-600 mt-2 text-right">
              <BuyLinks />
            </div>
          </div>
        </div>
      </div>
    </div>
    {showModal && <Modal />}
  </>
)


}
