const express = require("express");
const { pool } = require("../db");
const { renderReceipt } = require("../receipt");
const { FACILITIES, ROOMS, START_HOUR, END_HOUR } = require("../config");

const router = express.Router();

function isValidDate(s) {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
}

function isValidFacility(id) {
  return FACILITIES.some((f) => f.id === id);
}

function isValidHour(h) {
  const n = Number(h);
  return Number.isInteger(n) && n >= START_HOUR && n < END_HOUR;
}

function isValidRoom(room) {
  return ROOMS.includes(room);
}

router.get("/config", (req, res) => {
  res.json({ facilities: FACILITIES, rooms: ROOMS, startHour: START_HOUR, endHour: END_HOUR });
});

// Returns today's (or ?date=) reservations without ever exposing another
// room's number to the client - only whether a slot is free / taken / mine.
router.get("/availability", async (req, res) => {
  const date = isValidDate(req.query.date) ? req.query.date : todayStr();
  const room = typeof req.query.room === "string" ? req.query.room : null;

  try {
    const { rows } = await pool.query(
      "SELECT facility_id, hour, room FROM reservations WHERE date = $1",
      [date]
    );
    const slots = rows.map((r) => ({
      facilityId: r.facility_id,
      hour: r.hour,
      mine: room !== null && r.room === room
    }));
    res.json({ date, slots });
  } catch (err) {
    console.error("availability error", err);
    res.status(500).json({ error: "internal_error" });
  }
});

router.post("/reservations", async (req, res) => {
  const { date, facilityId, hour, room } = req.body || {};
  const d = isValidDate(date) ? date : todayStr();

  if (!isValidFacility(facilityId)) return res.status(400).json({ error: "invalid_facility" });
  if (!isValidHour(hour)) return res.status(400).json({ error: "invalid_hour" });
  if (!isValidRoom(room)) return res.status(400).json({ error: "invalid_room" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const insert = await client.query(
      `INSERT INTO reservations (date, facility_id, hour, room)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [d, facilityId, hour, room]
    );
    const reservationId = insert.rows[0].id;
    const body = renderReceipt({ date: d, facilityId, hour: Number(hour), room });
    await client.query(
      `INSERT INTO print_jobs (reservation_id, body) VALUES ($1, $2)`,
      [reservationId, body]
    );
    await client.query("COMMIT");
    res.status(201).json({ id: reservationId });
  } catch (err) {
    await client.query("ROLLBACK");
    if (err.code === "23505") {
      // unique_violation - someone else booked this slot first
      return res.status(409).json({ error: "already_booked" });
    }
    console.error("reservation create error", err);
    res.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

router.delete("/reservations", async (req, res) => {
  const { date, facilityId, hour, room } = req.body || {};
  const d = isValidDate(date) ? date : todayStr();

  if (!isValidFacility(facilityId)) return res.status(400).json({ error: "invalid_facility" });
  if (!isValidHour(hour)) return res.status(400).json({ error: "invalid_hour" });
  if (!isValidRoom(room)) return res.status(400).json({ error: "invalid_room" });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const deleted = await client.query(
      `DELETE FROM reservations WHERE date = $1 AND facility_id = $2 AND hour = $3 AND room = $4
       RETURNING id`,
      [d, facilityId, hour, room]
    );
    if (deleted.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ error: "not_found" });
    }
    // Don't let a cancelled booking still print at the front desk.
    await client.query(
      `DELETE FROM print_jobs WHERE reservation_id = $1 AND status = 'pending'`,
      [deleted.rows[0].id]
    );
    await client.query("COMMIT");
    res.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("reservation delete error", err);
    res.status(500).json({ error: "internal_error" });
  } finally {
    client.release();
  }
});

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

module.exports = router;
