// Phase 2: bringt die rohen Einträge aus data/raw/ (Phase 1) mittels Claude
// ins vereinbarte kompakte Format (data/entries/). Braucht ANTHROPIC_API_KEY.

const fs = require("fs");
const path = require("path");

const RAW_DIR = path.join(__dirname, "..", "data", "raw");
const ENTRIES_DIR = path.join(__dirname, "..", "data", "entries");
const MODEL = "claude-sonnet-5";

const SYSTEM_PROMPT = `Du fasst Bundestags-Vorgänge für eine App namens "Bundestag-Kompakt" zusammen.
Zielgruppe: Bürger:innen ohne Vorwissen, die kompakt mitbekommen wollen, was im Bundestag passiert.

Gib AUSSCHLIESSLICH ein JSON-Objekt zurück (keine Erklärungen drumherum) mit exakt diesen Feldern:

{
  "titel": string,               // verständliche Sprache, nicht der sperrige Gesetzestitel
  "zusammenfassung": string,     // einfache Sprache, darf länger als 4-5 Sätze sein wenn nötig, inkl. wichtiger Kritikpunkte aus Stellungnahmen/Anhörungen falls vorhanden
  "abstimmungsergebnis": {
    "art": string,               // z.B. "Ausschuss-Empfehlung (Handzeichen)" / "Namentliche Abstimmung"
    "ausgang": "angenommen" | "abgelehnt", // laut Beschlussempfehlung/Abstimmungstext
    "dafuer": string[],          // Parteien/Fraktionen, leer falls nicht zutreffend
    "dagegen": string[],
    "enthalten": string[]
  } | null,                      // null wenn noch keine Beschlussempfehlung/Abstimmung vorliegt (laufendes Verfahren)
  "eingebrachtVon": string,      // z.B. "Bundesregierung (Bundesministerium für X)" oder Fraktionsname
  "themenbereich": string,       // z.B. Gesundheit, Wirtschaft, Umwelt, Soziales, Verkehr, Justiz ...
  "naechsteSchritte": string,    // z.B. "Muss noch durch den Bundesrat" / "Erste Lesung im Bundestag steht noch aus"
  "alltagsrelevanz": number,     // 1-5, wie stark betrifft das normale Bürger:innen im Alltag direkt?
                                  // 1 = betrifft praktisch niemanden direkt (z.B. sehr technische EU-Anpassung, reine Verwaltungsdetails)
                                  // 3 = betrifft eine klar abgrenzbare Gruppe direkt (z.B. Autofahrer:innen, Landwirt:innen, Anwohner:innen)
                                  // 5 = betrifft einen großen Teil der Bevölkerung direkt und spürbar (z.B. alle gesetzlich Krankenversicherten, alle Familien mit Kindergeld)
  "warumRelevant": string        // 1-2 Sätze, konkret: FÜR WEN und WIE ändert sich etwas im echten Leben. Keine Wiederholung der Zusammenfassung.
}

Nutze ausschließlich Informationen aus den bereitgestellten Rohdaten. Erfinde nichts.`;

async function summarizeOne(raw) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY ist nicht gesetzt.");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: JSON.stringify(raw) }],
    }),
  });

  if (!res.ok) throw new Error(`Anthropic API Fehler: HTTP ${res.status} ${await res.text()}`);
  const data = await res.json();
  let text = data.content.map((block) => block.text).join("").trim();
  text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  return JSON.parse(text);
}

async function main() {
  const docid = process.argv[2];
  if (!docid) {
    console.error("Nutzung: node scripts/summarize.js <docid>");
    process.exit(1);
  }

  fs.mkdirSync(ENTRIES_DIR, { recursive: true });
  const raw = JSON.parse(fs.readFileSync(path.join(RAW_DIR, `${docid}.json`), "utf-8"));
  const summary = await summarizeOne(raw);

  const entry = {
    docid,
    url: raw.url,
    letzteAenderung: raw.sections?.Basics?.tables?.[0]?.entries?.["Letzte Änderung"] ?? null,
    ...summary,
  };

  fs.writeFileSync(path.join(ENTRIES_DIR, `${docid}.json`), JSON.stringify(entry, null, 2), "utf-8");
  console.log(`Geschrieben: data/entries/${docid}.json`);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { SYSTEM_PROMPT, summarizeOne };
