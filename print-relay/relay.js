// Runs on the front-desk PC (Windows), not on Render. The TSP100III has no
// CloudPRNT support, so instead of the printer polling us, this script
// polls our API and prints to the Windows printer queue (installed via the
// futurePRNT driver), which handles Japanese text and cutting correctly.
//
// Setup: see README.md in this folder.
const { execFile } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const API_BASE = process.env.API_BASE || "https://koushien-booking.onrender.com";
const TOKEN = process.env.PRINT_RELAY_TOKEN;
const PRINTER_NAME = process.env.PRINTER_NAME;
const POLL_MS = 5000;

if (!TOKEN) {
  console.error("Set PRINT_RELAY_TOKEN before running (see README.md).");
  process.exit(1);
}
if (!PRINTER_NAME) {
  console.error("Set PRINTER_NAME before running (see README.md).");
  process.exit(1);
}

function printText(body) {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), `koushien-receipt-${Date.now()}.txt`);
    fs.writeFileSync(tmpFile, body, { encoding: "utf8" });
    const psCommand =
      `Get-Content -Path "${tmpFile}" -Encoding UTF8 | Out-Printer -Name "${PRINTER_NAME}"`;
    execFile(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", psCommand],
      (err, stdout, stderr) => {
        fs.unlink(tmpFile, () => {});
        if (err) reject(new Error(stderr || err.message));
        else resolve();
      }
    );
  });
}

async function ack(id, ok) {
  await fetch(`${API_BASE}/api/print-jobs/${id}/ack`, {
    method: "POST",
    headers: { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ ok })
  });
}

async function pollOnce() {
  const res = await fetch(`${API_BASE}/api/print-jobs/next`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  });
  if (!res.ok) {
    console.error(`poll failed: HTTP ${res.status}`);
    return;
  }
  const data = await res.json();
  if (!data.job) return;

  console.log(`[${new Date().toISOString()}] printing job #${data.job.id}...`);
  try {
    await printText(data.job.body);
    await ack(data.job.id, true);
    console.log(`job #${data.job.id} printed`);
  } catch (err) {
    console.error(`job #${data.job.id} failed to print:`, err.message);
    await ack(data.job.id, false);
  }
}

console.log(`print relay started.`);
console.log(`  polling: ${API_BASE}`);
console.log(`  printer: ${PRINTER_NAME}`);
console.log(`  interval: ${POLL_MS}ms`);

setInterval(() => {
  pollOnce().catch((e) => console.error("poll error:", e.message));
}, POLL_MS);
pollOnce().catch((e) => console.error("poll error:", e.message));
