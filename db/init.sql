-- ============================================================
-- Library Borrowing System - database schema + seed data
-- This file runs ONLY the first time PostgreSQL starts with an
-- empty data volume. After that, the data in the volume is kept.
-- ============================================================

CREATE TABLE IF NOT EXISTS books (
    id               SERIAL PRIMARY KEY,
    title            VARCHAR(200) NOT NULL,
    author           VARCHAR(200) NOT NULL,
    isbn             VARCHAR(20),
    total_copies     INTEGER NOT NULL DEFAULT 1 CHECK (total_copies >= 0),
    available_copies INTEGER NOT NULL DEFAULT 1 CHECK (available_copies >= 0),
    created_at       TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS borrowings (
    id            SERIAL PRIMARY KEY,
    borrower_name VARCHAR(100) NOT NULL,
    book_id       INTEGER NOT NULL REFERENCES books(id),
    borrowed_at   TIMESTAMP NOT NULL DEFAULT NOW(),
    due_date      DATE NOT NULL DEFAULT (CURRENT_DATE + 14),
    returned_at   TIMESTAMP,
    status        VARCHAR(20) NOT NULL DEFAULT 'borrowed'
);

INSERT INTO books (title, author, isbn, total_copies, available_copies) VALUES
    ('Noli Me Tangere', 'Jose Rizal', '9789710810736', 3, 3),
    ('El Filibusterismo', 'Jose Rizal', '9789710810743', 2, 2),
    ('Clean Code', 'Robert C. Martin', '9780132350884', 1, 1);
