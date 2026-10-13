const { FACILITIES } = require("./config");

function facilityName(facilityId) {
  const f = FACILITIES.find((x) => x.id === facilityId);
  return f ? f.name : facilityId;
}

function pad2(n) {
  return String(n).padStart(2, "0");
}

// Plain-text receipt body. text/plain print jobs use the printer's own
// default font/codepage and are auto-cut at the end (no bold/center
// control available in this mode) - see Star CloudPRNT "Text Printing" spec.
function renderReceipt({ date, facilityId, hour, room }) {
  const line = "--------------------------------";
  const timeLabel = `${pad2(hour)}:00-${pad2(hour + 1)}:00`;
  const now = new Date();
  const printedAt = `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(
    now.getDate()
  )} ${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

  return [
    line,
    "HOTEL KOUSHIEN",
    "貸切湯 予約票",
    line,
    `部屋番号 : ${room}`,
    `施設     : ${facilityName(facilityId)}`,
    `日付     : ${date}`,
    `時間     : ${timeLabel}`,
    line,
    "時間になりましたらフロントへ",
    "お越しください。",
    "",
    `発行 ${printedAt}`,
    line,
    "",
    ""
  ].join("\n");
}

module.exports = { renderReceipt };
