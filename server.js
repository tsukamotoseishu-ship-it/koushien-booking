const path = require("path");
const express = require("express");
const { initSchema } = require("./db");
const reservationsRouter = require("./routes/reservations");
const cloudprntRouter = require("./routes/cloudprnt");

const app = express();
app.use(express.json());

app.use("/api", reservationsRouter);
app.use("/cloudprnt", cloudprntRouter);

app.use(express.static(path.join(__dirname, "public")));

const PORT = process.env.PORT || 3000;

initSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`koushien-booking listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("failed to initialize database schema", err);
    process.exit(1);
  });
