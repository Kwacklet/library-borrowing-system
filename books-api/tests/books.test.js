// books.test.js - automated tests for the Books API.
// These tests do NOT need a database: they check the health endpoint
// and the input validation that runs before any database query.
const request = require('supertest');
const app = require('../src/app');

describe('Books API', () => {
  test('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /books without a title returns 400', async () => {
    const res = await request(app).post('/books').send({ author: 'Jose Rizal' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('Title and author are required');
  });

  test('POST /books with 0 copies returns 400', async () => {
    const res = await request(app)
      .post('/books')
      .send({ title: 'Test Book', author: 'Someone', total_copies: 0 });
    expect(res.statusCode).toBe(400);
  });

  test('GET /books/abc (invalid id) returns 400', async () => {
    const res = await request(app).get('/books/abc');
    expect(res.statusCode).toBe(400);
  });
});
