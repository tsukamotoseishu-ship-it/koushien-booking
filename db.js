const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.DATABASE_URL && process.env.DATABASE_URL.includes("render.com")
      ? { rejectUnauthorized: false }
      : process.env.PGSSLMODE === "require"
      ? { rejectUnauthorized: false }
      : false
});

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservations (
      id SERIAL PRIMARY KEY,
      date TEXT NOT NULL,
      facility_id TEXT NOT NULL,
      hour INTEGER NOT NULL,
      room TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (date, facility_id, hour)
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS print_jobs (
      id SERIAL PRIMARY KEY,
      reservation_id INTEGER REFERENCES reservations(id) ON DELETE SET NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      printed_at TIMESTAMPTZ
    );
  `);
}

module.exports = { pool, initSchema };
