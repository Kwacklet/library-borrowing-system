// app.js - defines the Books API routes.
// It exports the app WITHOUT starting a server so tests can use it.
const express = require('express');
const pool = require('./db');

const app = express();
app.use(express.json());

// Helper: checks that an id from the URL is a positive whole number.
function toId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

// Health check - used by Docker, Nginx smoke tests and Jenkins.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'books-api' });
});

// GET /books - list all books
app.get('/books', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM books ORDER BY id');
    res.status(200).json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load books' });
  }
});

// GET /books/:id - one book
app.get('/books/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Book id must be a positive number' });
  try {
    const result = await pool.query('SELECT * FROM books WHERE id = $1', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not load the book' });
  }
});

// POST /books - add a book
app.post('/books', async (req, res) => {
  const { title, author, isbn } = req.body;
  const totalCopies = req.body.total_copies === undefined ? 1 : Number(req.body.total_copies);

  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }
  if (!Number.isInteger(totalCopies) || totalCopies < 1) {
    return res.status(400).json({ error: 'total_copies must be a whole number of at least 1' });
  }
  try {
    const result = await pool.query(
      `INSERT INTO books (title, author, isbn, total_copies, available_copies)
       VALUES ($1, $2, $3, $4, $4) RETURNING *`,
      [title, author, isbn || null, totalCopies]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not add the book' });
  }
});

// PUT /books/:id - update title, author or isbn
app.put('/books/:id', async (req, res) => {
  const id = toId(req.params.id);
  if (!id) return res.status(400).json({ error: 'Book id must be a positive number' });

  const { title, author, isbn } = req.body;
  if (!title || !author) {
    return res.status(400).json({ error: 'Title and author are required' });
  }
  try {
    const result = await pool.query(
      'UPDATE books SET title = $1, author = $2, isbn = $3 WHERE id = $4 RETURNING *',
      [title, author, isbn || null, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Book not found' });
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Could not update the book' });
  }
});

module.exports = app;
