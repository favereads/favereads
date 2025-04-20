import { useState } from 'react'

export default function BookCard({ book, onLike, view, onAddReason }) {
  const [showReasonFormModal, setShowReasonFormModal] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [reason, setReason] = useState('')

  const comments = Array.isArray(book.comments) ? book.comments : [book.comment].filter(Boolean)
  const mainComment = comments[0]
  const extraComments = comments.length > 1 ? comments.slice(1) : []

  const showPlus =
    comments.length > 1 || (comments.length === 1 && mainComment && mainComment.length > 100)

  const handleLikeClick = () => setShowReasonFormModal(true)

  const handleSkip = () => {
    onLike(book.title)
    setShowReasonFormModal(false)
    setReason('')
  }

  const handleShare = () => {
    if (reason.trim()) {
      onAddReason(book.title, reason.trim())
    } else {
      onLike(book.title)
    }
    setShowReasonFormModal(false)
    setReason('')
  }

  const amazonLink =
    book.buyLinks?.find(link => link.name === 'Amazon')?.url ||
    `https://www.amazon.com/s?k=${encodeURIComponent(book.title)}`

  const BuyLinks = () =>
    book.buyLinks?.filter(link => link.name === 'Amazon').map(link => (
      <div key={link.name}>
        <a
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-sm"
        >
          Check on Amazon
        </a>
      </div>
    ))

  return (
    <>
      <div className="bg-white border border-gray-300 rounded shadow px-4 py-3 flex items-start space-x-4 w-full max-w-5xl min-h-[100px]">
        <a href={amazonLink} target="_blank" rel="noopener noreferrer">
          <img
            src={book.thumbnail || '/default-cover.jpg'}
            alt={book.title}
            className="w-12 h-16 object-cover rounded border"
          />
        </a>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h2 className="text-base font-bold">
              {book.title}{' '}
              <span className="text-sm text-gray-500 font-normal">(Age: {book.ageGroup})</span>
            </h2>
            <button
              onClick={handleLikeClick}
              className="text-pink-600 text-sm flex items-center space-x-1 hover:opacity-75"
            >
              ❤️ <span>{book.favorites || 1}</span>
            </button>
          </div>

          <div className="flex justify-between items-center">
            <div
              className="text-sm italic text-gray-700 overflow-hidden text-ellipsis whitespace-nowrap truncate max-w-[90%]"
              title={mainComment}
            >
              “{mainComment}”
            </div>
            {showPlus && (
              <button
                onClick={() => setShowCommentsModal(true)}
                title="See why parents love this book"
                className="ml-2 text-blue-600 font-bold text-sm hover:underline"
              >
                +
              </button>
            )}
          </div>

          <div className="mt-2">
            <BuyLinks />
          </div>
        </div>
      </div>

      {showReasonFormModal && (
        <Modal title="Love this book?" onClose={handleSkip}>
          <p className="text-sm text-gray-700 mb-3">Tell us why it’s your favorite.</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Our kids can’t stop asking for it!"
            className="w-full border rounded px-3 py-2 text-sm text-left resize-none min-h-[100px] mb-4"
          />
          <div className="flex justify-center gap-4">
            <Button onClick={handleShare} primary>
              Share
            </Button>
            <Button onClick={handleSkip}>Skip</Button>
          </div>
        </Modal>
      )}

      {showCommentsModal && (
        <Modal title="Why parents love this book" onClose={() => setShowCommentsModal(false)}>
          <ul className="text-sm text-left list-disc pl-5 text-gray-700 space-y-2">
            {comments.map((cmt, idx) => (
              <li key={idx}>{cmt}</li>
            ))}
          </ul>
        </Modal>
      )}
    </>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md max-w-sm w-full">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {children}
        <div className="flex justify-end mt-4">
          <button
            onClick={onClose}
            className="text-gray-600 border border-gray-300 px-4 py-2 rounded text-sm hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

function Button({ children, onClick, primary = false }) {
  const base = 'px-4 py-2 rounded text-sm'
  const styles = primary
    ? `bg-blue-600 text-white hover:bg-blue-700 ${base}`
    : `text-gray-600 border border-gray-300 hover:bg-gray-100 ${base}`
  return (
    <button onClick={onClick} className={styles}>
      {children}
    </button>
  )
}
