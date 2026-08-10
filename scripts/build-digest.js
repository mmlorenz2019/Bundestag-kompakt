// Erzeugt einen Wochenüberblick der wichtigsten Entscheidungen (nach Alltagsrelevanz).
// Gedacht für den sonntäglichen Lauf: fasst die gerade zu Ende gegangene ISO-Kalenderwoche
// zusammen (die "Sitzungswoche"-Zählung, die der Bundestag selbst nutzt).

const fs = require("fs");
const path = require("path");

const ENTRIES_DIR = path.join(__dirname, "..", "data", "entries");
const DIGESTS_DIR = path.join(__dirname, "..", "data", "digests");
const CURRENT_PATH = path.join(__dirname, "..", "data", "digest-woche-aktuell.json");
const TOP_N = 5;

function parseGermanDate(d) {
  if (!d) return null;
  const [day, month, year] = d.split(".").map(Number);
  if (!day || !month || !year) return null;
  return new Date(Date.UTC(year, month - 1, day));
}

function isoWeekInfo(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dayNum + 3);
  const isoYear = d.getUTCFullYear();
  const firstThursday = new Date(Date.UTC(isoYear, 0, 4));
  const firstDayNum = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNum + 3);
  const week = 1 + Math.round((d - firstThursday) / (7 * 24 * 3600 * 1000));
  return { isoYear, week };
}

function main() {
  // Optionales Argument TT.MM.JJJJ zum Testen mit einem bestimmten Stichtag, sonst heute.
  const targetDateArg = process.argv[2];
  const targetDate = targetDateArg ? parseGermanDate(targetDateArg) : new Date();
  const { isoYear, week } = isoWeekInfo(targetDate);

  const files = fs.readdirSync(ENTRIES_DIR).filter((f) => f.endsWith(".json"));
  const entries = files.map((f) => JSON.parse(fs.readFileSync(path.join(ENTRIES_DIR, f), "utf-8")));

  const weekEntries = entries.filter((e) => {
    const d = parseGermanDate(e.letzteAenderung);
    if (!d) return false;
    const info = isoWeekInfo(d);
    return info.isoYear === isoYear && info.week === week;
  });

  const top = [...weekEntries]
    .sort((a, b) => (b.alltagsrelevanz ?? 0) - (a.alltagsrelevanz ?? 0))
    .slice(0, TOP_N);

  const digest = {
    isoYear,
    kw: week,
    erzeugtAm: new Date().toISOString(),
    anzahlVorgaengeGesamt: weekEntries.length,
    top: top.map((e) => ({
      docid: e.docid,
      titel: e.titel,
      themenbereich: e.themenbereich,
      alltagsrelevanz: e.alltagsrelevanz ?? null,
      warumRelevant: e.warumRelevant ?? null,
      ausgang: e.abstimmungsergebnis?.ausgang ?? "offen",
      letzteAenderung: e.letzteAenderung,
      url: e.url,
    })),
  };

  fs.mkdirSync(DIGESTS_DIR, { recursive: true });
  const weekFile = path.join(DIGESTS_DIR, `${isoYear}-KW${String(week).padStart(2, "0")}.json`);
  fs.writeFileSync(weekFile, JSON.stringify(digest, null, 2) + "\n", "utf-8");
  fs.writeFileSync(CURRENT_PATH, JSON.stringify(digest, null, 2) + "\n", "utf-8");

  console.log(`Wochenüberblick KW ${week}/${isoYear}: ${top.length} von ${weekEntries.length} Vorgängen ausgewählt -> ${weekFile}`);
}

main();
