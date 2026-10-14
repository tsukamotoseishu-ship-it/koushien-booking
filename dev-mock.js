// Local demo only: runs the app with an in-memory fake Postgres (pg-mem)
// instead of a real database, so it can be tried on localhost with no
// Render/GitHub setup. Not used in production (see server.js + db.js).
const path = require("path");
const express = require("express");
const { newDb } = require("pg-mem");

const mem = newDb();
const { Pool } = mem.adapters.createPg();
const pool = new Pool();

const dbModulePath = require.resolve("./db");
require.cache[dbModulePath] = {
  id: dbModulePath,
  filename: dbModulePath,
  loaded: true,
  exports: {
    pool,
    initSchema: async () => {
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
          reservation_id INTEGER,
          body TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
          printed_at TIMESTAMPTZ
        );
      `);
    }
  }
};

const { initSchema } = require("./db");
const reservationsRouter = require("./routes/reservations");
const cloudprntRouter = require("./routes/cloudprnt");

const app = express();
app.use(express.json());
app.use("/api", reservationsRouter);
app.use("/cloudprnt", cloudprntRouter);
app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

initSchema().then(() => {
  app.listen(PORT, () => {
    console.log(`\n[MOCK MODE - in-memory DB, not for production]`);
    console.log(`予約画面はこちら: http://localhost:${PORT}/\n`);
  });
});
