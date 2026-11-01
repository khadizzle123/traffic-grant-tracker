const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect to PostgreSQL using environment variable
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Required for Render cloud databases
});

// Auto-create shifts table on startup if it doesn't exist
pool.query(`
  CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    date VARCHAR(20),
    officer VARCHAR(100),
    type VARCHAR(50),
    hours NUMERIC,
    stops INT,
    citations INT,
    warnings INT,
    duis INT,
    arrests INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error("Table creation error:", err));

// API Endpoint: Get all shifts
app.get('/api/shifts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM shifts ORDER BY date DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API Endpoint: Add a new shift
app.post('/api/shifts', async (req, res) => {
  const { date, officer, type, hours, stops, citations, warnings, duis, arrests } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO shifts (date, officer, type, hours, stops, citations, warnings, duis, arrests) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [date, officer, type, hours, stops, citations, warnings, duis, arrests]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));