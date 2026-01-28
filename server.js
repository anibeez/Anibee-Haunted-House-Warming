const path = require("path");
const fs = require("fs");
const express = require("express");
const Database = require("better-sqlite3");

const PORT = Number.parseInt(process.env.PORT, 10) || 3000;
const API_PREFIX = process.env.API_PREFIX || "/api";
const VENMO_USERNAME = process.env.VENMO_USERNAME || "Anibee-Zingalis";
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const DATABASE_PATH =
  process.env.DATABASE_PATH || path.join(DATA_DIR, "haunted-housewarming.db");
const CORS_ORIGIN = process.env.CORS_ORIGIN || "";

const DEFAULT_FUNDS = [
  {
    fund_id: "stairs",
    name: "Back Stairs",
    description: "Safe, sturdy steps for the patio entrance.",
    current: 0,
    image: "src/media/images/gift_stair.png",
  },
  {
    fund_id: "snowblower",
    name: "Snow Blower",
    description: "Clear the driveway when the winter ghosts roll in.",
    current: 0,
    image: "src/media/images/gift_snowblower.png",
  },
  {
    fund_id: "outlets",
    name: "Basement Outlets",
    description: "Extra outlets for cozy movie nights downstairs.",
    current: 0,
    image: "src/media/images/gift_outlets.png",
  },
  {
    fund_id: "mower",
    name: "Lawn Mower",
    description: "Keep the yard tidy all season long.",
    current: 0,
    image: "src/media/images/gift_lawnmower.png",
  },
  {
    fund_id: "pets",
    name: "General Pet Care",
    description: "Feeding, Cleaning, and Homing the little beasts.",
    current: 0,
    image: "src/media/images/gift_pet.png",
  },
];

fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(DATABASE_PATH);
db.pragma("journal_mode = WAL");
db.pragma("synchronous = NORMAL");
db.pragma("foreign_keys = ON");
db.pragma("busy_timeout = 5000");

db.exec(`
  CREATE TABLE IF NOT EXISTS funds (
    fund_id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    current INTEGER NOT NULL DEFAULT 0,
    image TEXT
  );
  CREATE TABLE IF NOT EXISTS pledges (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fund_id TEXT NOT NULL,
    amount INTEGER NOT NULL,
    name TEXT,
    message TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS guestbook_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    message TEXT NOT NULL,
    image_url TEXT,
    image_alt TEXT,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS gallery_images (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    src TEXT NOT NULL,
    caption TEXT,
    tags TEXT,
    created_at TEXT NOT NULL
  );
`);

const seedFunds = () => {
  const { count } = db.prepare("SELECT COUNT(*) as count FROM funds").get();
  if (count > 0) {
    return;
  }

  const insert = db.prepare(
    "INSERT INTO funds (fund_id, name, description, current, image) VALUES (@fund_id, @name, @description, @current, @image)"
  );
  const transaction = db.transaction((funds) => {
    funds.forEach((fund) => insert.run(fund));
  });
  transaction(DEFAULT_FUNDS);
};

const seedGallery = () => {
  const { count } = db
    .prepare("SELECT COUNT(*) as count FROM gallery_images")
    .get();
  if (count > 0) {
    return;
  }

  const manifestPath = path.join(__dirname, "src", "media", "images", "gallery.json");
  if (!fs.existsSync(manifestPath)) {
    return;
  }

  const data = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
  const insert = db.prepare(
    "INSERT INTO gallery_images (src, caption, tags, created_at) VALUES (@src, @caption, @tags, @created_at)"
  );
  const transaction = db.transaction((images) => {
    images.forEach((image) => {
      insert.run({
        src: image.src,
        caption: image.caption || "",
        tags: JSON.stringify(image.tags || []),
        created_at: new Date().toISOString(),
      });
    });
  });
  transaction(data);
};

const serializeGallery = (row) => ({
  id: row.id,
  src: row.src,
  caption: row.caption,
  tags: row.tags ? JSON.parse(row.tags) : [],
});

const buildVenmoUrl = (fundName, amount) => {
  const note = `Housewarming - ${fundName.toUpperCase()}`;
  const params = new URLSearchParams({
    txn: "pay",
    amount: amount.toString(),
    note,
  });
  return `https://venmo.com/${VENMO_USERNAME}?${params.toString()}`;
};

seedFunds();
seedGallery();

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname)));

if (CORS_ORIGIN) {
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", CORS_ORIGIN);
    res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });
}

app.get(`${API_PREFIX}/health`, (req, res) => {
  res.json({ status: "ok" });
});

app.get(`${API_PREFIX}/funds`, (req, res) => {
  const funds = db.prepare("SELECT * FROM funds").all();
  res.json(funds);
});

app.post(`${API_PREFIX}/pledge`, (req, res) => {
  const { fund_id: fundId, amount, name, message } = req.body;
  const parsedAmount = Number(amount);
  if (!fundId || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
    res.status(400).json({ error: "Invalid pledge." });
    return;
  }

  const fund = db.prepare("SELECT * FROM funds WHERE fund_id = ?").get(fundId);
  if (!fund) {
    res.status(404).json({ error: "Fund not found." });
    return;
  }

  db.prepare("UPDATE funds SET current = current + ? WHERE fund_id = ?").run(
    parsedAmount,
    fundId
  );
  db.prepare(
    "INSERT INTO pledges (fund_id, amount, name, message, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(
    fundId,
    parsedAmount,
    name || null,
    message || null,
    new Date().toISOString()
  );

  const updatedFund = db
    .prepare("SELECT * FROM funds WHERE fund_id = ?")
    .get(fundId);

  res.json({
    fund: updatedFund,
    redirect_url: buildVenmoUrl(updatedFund.name, parsedAmount),
  });
});

app.get(`${API_PREFIX}/guestbook`, (req, res) => {
  const entries = db
    .prepare("SELECT * FROM guestbook_entries ORDER BY created_at DESC")
    .all();
  res.json(entries);
});

app.post(`${API_PREFIX}/guestbook`, (req, res) => {
  const {
    name,
    message,
    image_url: imageUrl,
    image_alt: imageAlt,
    created_at: createdAt,
  } = req.body;

  if (!message) {
    res.status(400).json({ error: "Message is required." });
    return;
  }

  db.prepare(
    "INSERT INTO guestbook_entries (name, message, image_url, image_alt, created_at) VALUES (?, ?, ?, ?, ?)"
  ).run(name || "", message, imageUrl || "", imageAlt || "", createdAt || new Date().toISOString());

  const entries = db
    .prepare("SELECT * FROM guestbook_entries ORDER BY created_at DESC")
    .all();
  res.json(entries);
});

app.get(`${API_PREFIX}/gallery`, (req, res) => {
  const images = db
    .prepare("SELECT * FROM gallery_images ORDER BY created_at DESC")
    .all()
    .map(serializeGallery);
  res.json(images);
});

app.post(`${API_PREFIX}/gallery`, (req, res) => {
  const { src, caption, tags } = req.body;
  if (!src) {
    res.status(400).json({ error: "Image source is required." });
    return;
  }

  if (tags && !Array.isArray(tags)) {
    res.status(400).json({ error: "Tags must be an array." });
    return;
  }

  const now = new Date().toISOString();
  db.prepare(
    "INSERT INTO gallery_images (src, caption, tags, created_at) VALUES (?, ?, ?, ?)"
  ).run(src, caption || "", JSON.stringify(tags || []), now);

  const images = db
    .prepare("SELECT * FROM gallery_images ORDER BY created_at DESC")
    .all()
    .map(serializeGallery);
  res.json(images);
});

const server = app.listen(PORT, () => {
  console.log(`Haunted housewarming server running on http://localhost:${PORT}`);
});

const shutdown = () => {
  server.close(() => {
    db.close();
    process.exit(0);
  });
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
