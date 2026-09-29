// borrowings.test.js - automated tests for the Borrowing API.
// These tests do NOT need a database: they check the health endpoint
// and the input validation that runs before any database query.
const request = require('supertest');
const app = require('../src/app');

describe('Borrowing API', () => {
  test('GET /health returns 200 and status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('POST /borrowings without borrower_name returns 400', async () => {
    const res = await request(app).post('/borrowings').send({ book_id: 1 });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBe('borrower_name is required');
  });

  test('POST /borrowings with an invalid book_id returns 400', async () => {
    const res = await request(app)
      .post('/borrowings')
      .send({ borrower_name: 'Ana', book_id: 'abc' });
    expect(res.statusCode).toBe(400);
  });

  test('PUT /borrowings/abc/return (invalid id) returns 400', async () => {
    const res = await request(app).put('/borrowings/abc/return');
    expect(res.statusCode).toBe(400);
  });
});
