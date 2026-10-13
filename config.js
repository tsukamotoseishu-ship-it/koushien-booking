// Single source of truth for facilities / rooms / time slots.
// Edit this file when real facility names and room numbers are finalized.

const FACILITIES = [
  { id: "sauna", name: "貸切サウナ", note: "定員2名まで" },
  { id: "rotenA", name: "貸切露天風呂 A", note: "定員4名まで" },
  { id: "rotenB", name: "貸切露天風呂 B", note: "定員4名まで" },
  { id: "ganban", name: "貸切岩盤浴", note: "定員3名まで" },
  { id: "uchiyu", name: "貸切内風呂", note: "定員4名まで" }
];

const ROOMS_F1 = ["101", "102", "103", "104", "105", "106", "107", "108"];
const ROOMS_F2 = ["201", "202", "203", "204", "205", "206", "207", "208"];
const ROOMS = ROOMS_F1.concat(ROOMS_F2);

const START_HOUR = 16;
const END_HOUR = 22; // exclusive; last slot starts at END_HOUR - 1

module.exports = {
  FACILITIES,
  ROOMS_F1,
  ROOMS_F2,
  ROOMS,
  START_HOUR,
  END_HOUR
};
