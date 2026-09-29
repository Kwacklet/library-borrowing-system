// app.js - defines the Borrowing API routes.
// It exports the app WITHOUT starting a server so tests can use it.
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// Helper: checks that a value is a positive whole number.
function toId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Health check - used by Docker, Nginx smoke tests and Jenkins.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'borrowing-api' });
});

// GET /borrowings - list all borrowing records (newest first, with book title)
app.get('/borrowings', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT br.*, b.title AS book_title
         FROM borrowings br
         JOIN books b ON b.id = br.book_id
        ORDER BY br.id DESC`
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load borrowings' });
  }
});

// POST /borrowings - borrow a book
// Body: { "borrower_name": "Ana", "book_id": 1 }
app.post('/borrowings', async (req, res) => {
  const borrowerName = req.body.borrower_name;
  const bookId = toId(req.body.book_id);

  if (!borrowerName) return res.status(400).json({ error: 'borrower_name is required' });
  if (!bookId) return res.status(400).json({ error: 'book_id must be a positive number' });

  // A transaction makes both changes happen together, or not at all.
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // FOR UPDATE locks the book row so two people cannot take the last copy at once.
    const book = await client.query(
      'SELECT available_copies FROM books WHERE id = $1 FOR UPDATE',
      [bookId]
    );
    if (book.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Book not found' });
    }
    if (book.rows[0].available_copies < 1) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'No copies available' });
    }

    const created = await client.query(
      'INSERT INTO borrowings (borrower_name, book_id) VALUES ($1, $2) RETURNING *',
      [borrowerName, bookId]
    );
    await client.query(
      'UPDATE books SET available_copies = available_copies - 1 WHERE id = $1',
      [bookId]
    );

    await client.query('COMMIT');
    res.status(201).json(created.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not borrow the book' });
  } finally {
    client.release();
  }
});

// PUT /borrowings/:id/return - return a borrowed book
app.put('/borrowings/:id/return', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Borrowing id must be a positive number' });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const found = await client.query(
      'SELECT * FROM borrowings WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (found.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Borrowing record not found' });
    }
    if (found.rows[0].status === 'returned') {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'This book was already returned' });
    }

    const updated = await client.query(
      `UPDATE borrowings SET status = 'returned', returned_at = NOW()
        WHERE id = $1 RETURNING *`,
      [id]
    );
    await client.query(
      'UPDATE books SET available_copies = available_copies + 1 WHERE id = $1',
      [found.rows[0].book_id]
    );

    await client.query('COMMIT');
    res.status(200).json(updated.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Could not return the book' });
  } finally {
    client.release();
  }
});

module.exports = app;
