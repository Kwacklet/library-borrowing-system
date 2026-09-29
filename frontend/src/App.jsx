// App.jsx - the whole user interface of the Library Borrowing System.
import { useEffect, useState } from 'react';

// The build number is baked in when the app is built.
// Jenkins passes its BUILD_NUMBER; on your laptop it shows "dev".
const BUILD = import.meta.env.VITE_BUILD_NUMBER || 'dev';
const VERSION = '1.0';

// Small helper: calls an API and throws a readable error if it fails.
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Unexpected response from server (${res.status})`);
  }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

export default function App() {
  const [books, setBooks] = useState([]);
  const [borrowings, setBorrowings] = useState([]);
  const [message, setMessage] = useState('');
  const [newBook, setNewBook] = useState({ title: '', author: '', isbn: '', total_copies: 1 });
  const [borrowerName, setBorrowerName] = useState('');

  // Load books and borrowings from both APIs.
  async function loadData() {
    try {
      setBooks(await api('/api/books'));
      setBorrowings(await api('/api/borrowings'));
    } catch (err) {
      setMessage(`Could not load data: ${err.message}`);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function addBook(event) {
    event.preventDefault();
    try {
      await api('/api/books', {
        method: 'POST',
        body: JSON.stringify({ ...newBook, total_copies: Number(newBook.total_copies) }),
      });
      setNewBook({ title: '', author: '', isbn: '', total_copies: 1 });
      setMessage('Book added.');
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function borrowBook(bookId) {
    if (!borrowerName.trim()) {
      setMessage('Type the borrower name first.');
      return;
    }
    try {
      await api('/api/borrowings', {
        method: 'POST',
        body: JSON.stringify({ borrower_name: borrowerName.trim(), book_id: bookId }),
      });
      setMessage(`Book borrowed by ${borrowerName.trim()}.`);
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  async function returnBook(borrowingId) {
    try {
      await api(`/api/borrowings/${borrowingId}/return`, { method: 'PUT' });
      setMessage('Book returned.');
      loadData();
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <div className="container">
      <header>
        <h1>Library Borrowing System</h1>
        <span className="build">Version {VERSION} - Build {BUILD}</span>
      </header>

      {message && <p className="message">{message}</p>}

      <section>
        <h2>Add a book</h2>
        <form onSubmit={addBook} className="form">
          <input placeholder="Title" value={newBook.title}
            onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} />
          <input placeholder="Author" value={newBook.author}
            onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} />
          <input placeholder="ISBN (optional)" value={newBook.isbn}
            onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} />
          <input type="number" min="1" value={newBook.total_copies}
            onChange={(e) => setNewBook({ ...newBook, total_copies: e.target.value })} />
          <button type="submit">Add book</button>
        </form>
      </section>

      <section>
        <h2>Books</h2>
        <label>
          Borrower name:{' '}
          <input value={borrowerName} onChange={(e) => setBorrowerName(e.target.value)}
            placeholder="e.g. Juan Dela Cruz" />
        </label>
        <table>
          <thead>
            <tr><th>ID</th><th>Title</th><th>Author</th><th>Available</th><th></th></tr>
          </thead>
          <tbody>
            {books.map((book) => (
              <tr key={book.id}>
                <td>{book.id}</td>
                <td>{book.title}</td>
                <td>{book.author}</td>
                <td>{book.available_copies} / {book.total_copies}</td>
                <td>
                  <button onClick={() => borrowBook(book.id)}
                    disabled={book.available_copies < 1}>Borrow</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Borrowing records</h2>
        <table>
          <thead>
            <tr><th>ID</th><th>Borrower</th><th>Book</th><th>Due</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {borrowings.map((b) => (
              <tr key={b.id}>
                <td>{b.id}</td>
                <td>{b.borrower_name}</td>
                <td>{b.book_title}</td>
                <td>{b.due_date}</td>
                <td>{b.status}</td>
                <td>
                  {b.status === 'borrowed' && (
                    <button onClick={() => returnBook(b.id)}>Return</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
