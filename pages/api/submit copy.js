export default async function handler(req, res) {
  const { title, comment } = req.body;

  try {
    // Step 1: Fetch book data from Google Books API
    const googleBooksRes = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=intitle:${encodeURIComponent(title)}&key=${process.env.GOOGLE_BOOKS_API_KEY}`
    );
    const googleBooksData = await googleBooksRes.json();
    const bookInfo = googleBooksData.items?.[0]?.volumeInfo || {};

    const bookDetails = {
      title: bookInfo.title || title,
      description: bookInfo.description || '',
      thumbnail: bookInfo.imageLinks?.thumbnail || '',
      authors: bookInfo.authors?.join(', ') || '',
    };

    // Step 2: Fallback logic if OpenAI is not used
    const fallback = {
      ageGroup: '2–6',
      category: 'General',
    };

    const finalBook = {
      ...bookDetails,
      comment,
      ageGroup: fallback.ageGroup,
      category: fallback.category,
      buyLinks: [
        {
          name: 'Amazon',
          url: `https://www.amazon.com/s?k=${encodeURIComponent(bookDetails.title)}`,
        },
        {
          name: 'Google Books',
          url: `https://books.google.com?q=${encodeURIComponent(bookDetails.title)}`,
        },
      ],
    };

    console.log('✅ Final book (Google Books only):', finalBook);
    res.status(200).json({ message: 'Success', book: finalBook });
  } catch (error) {
    console.error('🔥 Error in /api/submit (Google Books fallback):', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
