// Polling API for the local print relay script that runs on the front-desk
// PC (see print-relay/relay.js). The printer itself can't reach us
// (TSP100III has no CloudPRNT support), so the relay pulls jobs from here
// instead and prints them to the Windows-installed printer.
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

function checkAuth(req, res) {
  const expected = process.env.PRINT_RELAY_TOKEN;
  if (!expected) {
    // Not configured yet - fail closed rather than serve reservation
    // details (room numbers, etc.) to anyone who finds the URL.
    res.status(503).json({ error: "relay_not_configured" });
    return false;
  }
  const header = req.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (token !== expected) {
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}

router.get("/next", async (req, res) => {
  if (!checkAuth(req, res)) return;
  try {
    const { rows } = await pool.query(
      `SELECT id, body FROM print_jobs WHERE status = 'pending' ORDER BY id ASC LIMIT 1`
    );
    if (rows.length === 0) return res.json({ job: null });
    res.json({ job: { id: rows[0].id, body: rows[0].body } });
  } catch (err) {
    console.error("print-relay next error", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/:id/ack", async (req, res) => {
  if (!checkAuth(req, res)) return;
  const id = Number(req.params.id);
  const ok = req.body && req.body.ok !== false;
  try {
    await pool.query(
      `UPDATE print_jobs SET status = $1, printed_at = now() WHERE id = $2`,
      [ok ? "done" : "error", id]
    );
    res.json({ ok: true });
  } catch (err) {
    console.error("print-relay ack error", err);
    res.status(500).json({ error: "internal_error" });
  }
});

module.exports = router;
