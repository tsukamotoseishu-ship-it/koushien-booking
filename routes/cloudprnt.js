// Star Micronics CloudPRNT endpoint for the TSP143IIILAN receipt printer.
// Protocol verified against Star's official CloudPRNT Protocol Guide (v2.6.0):
// https://star-m.jp/products/s_print/sdk/StarCloudPRNT/manual/en/
//
// Flow: printer POSTs a status poll -> we reply {jobReady:true/false, ...} ->
// if true, printer GETs the job body -> we mark it "printing" and return the
// receipt as text/plain -> printer DELETEs to confirm success/failure.
const express = require("express");
const { pool } = require("../db");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id FROM print_jobs WHERE status = 'pending' ORDER BY id ASC LIMIT 1"
    );
    if (rows.length === 0) return res.json({ jobReady: false });
    res.json({
      jobReady: true,
      mediaTypes: ["text/plain;encoding=utf-8"],
      jobToken: String(rows[0].id)
    });
  } catch (err) {
    console.error("cloudprnt poll error", err);
    res.json({ jobReady: false });
  }
});

router.get("/", async (req, res) => {
  if (req.query.delete !== undefined) {
    return handleConfirmation(req, res);
  }

  const token = req.query.token;
  if (!token) return res.status(404).end();

  try {
    const { rows } = await pool.query(
      "SELECT id, body FROM print_jobs WHERE id = $1",
      [token]
    );
    if (rows.length === 0) return res.status(404).end();

    await pool.query("UPDATE print_jobs SET status = 'printing' WHERE id = $1", [token]);

    res.set("Content-Type", "text/plain;encoding=utf-8");
    res.set("X-Star-Cut", "full");
    res.status(200).send(rows[0].body);
  } catch (err) {
    console.error("cloudprnt job fetch error", err);
    res.status(404).end();
  }
});

router.delete("/", handleConfirmation);

async function handleConfirmation(req, res) {
  const token = req.query.token;
  const code = req.query.code || "";

  try {
    if (token) {
      if (String(code).startsWith("200")) {
        await pool.query(
          "UPDATE print_jobs SET status = 'done', printed_at = now() WHERE id = $1",
          [token]
        );
      } else {
        await pool.query("UPDATE print_jobs SET status = 'error' WHERE id = $1", [token]);
      }
    }
    res.status(200).end();
  } catch (err) {
    console.error("cloudprnt confirmation error", err);
    res.status(200).end();
  }
}

module.exports = router;
