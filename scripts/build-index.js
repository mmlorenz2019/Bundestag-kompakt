// Fasst alle Einträge aus data/entries/ zu einer Datei data/index.json zusammen,
// damit die Webseite mit einem einzigen Fetch alle Vorgänge laden kann
// (ein Verzeichnis-Listing gibt es auf GitHub Pages nicht).

const fs = require("fs");
const path = require("path");

const ENTRIES_DIR = path.join(__dirname, "..", "data", "entries");
const INDEX_PATH = path.join(__dirname, "..", "data", "index.json");

function parseGermanDate(d) {
  if (!d) return 0;
  const [day, month, year] = d.split(".").map(Number);
  return new Date(year, month - 1, day).getTime();
}

function main() {
  const files = fs.readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".json"));
  const entries = files.map((f) => JSON.parse(fs.readFileSync(path.join(ENTRIES_DIR, f), "utf-8")));

  entries.sort((a, b) => parseGermanDate(b.letzteAenderung) - parseGermanDate(a.letzteAenderung));

  fs.writeFileSync(INDEX_PATH, JSON.stringify(entries, null, 2) + "\n", "utf-8");
  console.log(`data/index.json geschrieben mit ${entries.length} Einträgen.`);
}

main();
