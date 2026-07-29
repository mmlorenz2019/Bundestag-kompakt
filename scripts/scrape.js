// Phase 1: ruft bundestagszusammenfasser.de ab und liest Einträge strukturiert
// in rohes JSON ein. Noch keine KI-Zusammenfassung (siehe Phase 2).

const fs = require("fs");
const path = require("path");
const cheerio = require("cheerio");

const BASE = "https://bundestagszusammenfasser.de";

// Kategorien, die zum Scope der App passen (nur Bundestag, nicht Kabinett/Vorbereitung):
// - bundestagneu: offene Vorhaben im Bundestag (laufende Themen)
// - ausschuss: Ausschussberatung (Fortschritt laufender Themen)
// - archiv-2: abgeschlossene Vorhaben (fertige Beschlüsse)
const LIST_PAGES = ["bundestagneu", "ausschuss", "archiv-2"];

const RAW_DIR = path.join(__dirname, "..", "data", "raw");
const HEADERS = { "User-Agent": "Mozilla/5.0 (compatible; BundestagKompaktBot/0.1)" };

async function fetchHtml(url) {
  const res = await fetch(url, { headers: HEADERS });
  if (!res.ok) throw new Error(`Fehler beim Abrufen von ${url}: HTTP ${res.status}`);
  return res.text();
}

// Liest eine Übersichtsseite (z.B. /bundestagneu) und findet alle Vorgänge
// (docid + Titel + Rohdaten der Tabellenzeile) über die enthaltenen Detail-Links.
function parseListPage(html) {
  const $ = cheerio.load(html);
  const entries = new Map();

  $('a[href*="details?docid="]').each((_, el) => {
    const href = $(el).attr("href");
    const match = href.match(/docid=(\d+)/);
    if (!match) return;
    const docid = match[1];
    const title = $(el).text().trim();

    const row = $(el).closest("tr");
    const cells = row
      .find("td")
      .map((__, td) => $(td).text().replace(/\s+/g, " ").trim())
      .get()
      .filter((text) => text.length > 0);

    if (!entries.has(docid)) {
      entries.set(docid, { docid, title, url: `${BASE}/details?docid=${docid}`, listRowCells: cells });
    }
  });

  return [...entries.values()];
}

// Wandelt HTML-Inhalt (mit <br>) in Klartext mit Zeilenumbrüchen um.
function htmlToText($, el) {
  const clone = $(el).clone();
  clone.find("br").replaceWith("\n");
  return clone
    .text()
    .replace(/ /g, " ")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n")
    .trim();
}

// Zelleninhalt einer Tabelle: Text, plus Link falls vorhanden.
function parseCell($, td) {
  const $td = $(td);
  const text = $td.text().replace(/\s+/g, " ").trim();
  const href = $td.find("a").first().attr("href");
  return href ? { text, href } : text;
}

function parseTable($, table) {
  const $table = $(table);
  const hasHeaderRow = $table.find("tr").first().find("th").length > 0;

  if (hasHeaderRow) {
    const rows = $table.find("tr");
    const headers = rows
      .first()
      .find("th")
      .map((_, th) => $(th).text().trim())
      .get();
    // native Array#map statt Cheerio#map, damit verschachtelte Arrays
    // (eine Zeile pro Tabellenreihe) nicht automatisch geflacht werden
    const dataRows = rows
      .slice(1)
      .toArray()
      .map((tr) => $(tr).find("td").map((__, td) => parseCell($, td)).get());
    return { type: "list", headers, rows: dataRows };
  }

  const entries = {};
  $table.find("tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 2) return;
    const label = $(tds[0]).text().replace(/\s+/g, " ").trim().replace(/:$/, "");
    const value = parseCell($, tds[1]);
    entries[label] = value;
  });
  return { type: "kv", entries };
}

// Liest eine Detailseite (/details?docid=NNN) generisch ein: jeder aufklappbare
// Abschnitt (su-spoiler) wird als benannte Section mit Tabellen + Restlicht-Text abgelegt.
function parseDetailPage(html, docid, url) {
  const $ = cheerio.load(html);

  const title = $(".entry-content h3.has-text-align-center").first().text().trim();
  const statusImageAlt = $(".entry-content .wp-block-image img").first().attr("alt") || null;

  const sections = {};
  $(".su-spoiler").each((_, spoilerEl) => {
    const $spoiler = $(spoilerEl);
    const sectionTitle = $spoiler.find(".su-spoiler-title").first().text().trim();
    const $content = $spoiler.find(".su-spoiler-content").first();

    const tables = $content
      .find("table")
      .map((__, table) => parseTable($, table))
      .get();

    const contentClone = $content.clone();
    contentClone.find("table").remove();
    const text = htmlToText($, contentClone);

    sections[sectionTitle] = { tables, text: text || null };
  });

  return {
    docid,
    url,
    scrapedAt: new Date().toISOString(),
    title,
    statusImageAlt,
    sections,
  };
}

async function main() {
  const limit = Number(process.argv[2]) || null; // optional: nur die ersten N Vorgänge (zum Testen)

  fs.mkdirSync(RAW_DIR, { recursive: true });

  console.log("Lese Übersichtsseiten ...");
  const allListEntries = new Map();
  for (const page of LIST_PAGES) {
    const html = await fetchHtml(`${BASE}/${page}`);
    for (const entry of parseListPage(html)) {
      allListEntries.set(entry.docid, entry);
    }
  }
  console.log(`${allListEntries.size} Vorgänge gefunden über ${LIST_PAGES.join(", ")}.`);

  let docids = [...allListEntries.keys()];
  if (limit) docids = docids.slice(0, limit);

  console.log(`Lese ${docids.length} Detailseiten ...`);
  for (const docid of docids) {
    const listEntry = allListEntries.get(docid);
    const html = await fetchHtml(listEntry.url);
    const detail = parseDetailPage(html, docid, listEntry.url);
    detail.listRowCells = listEntry.listRowCells;

    fs.writeFileSync(path.join(RAW_DIR, `${docid}.json`), JSON.stringify(detail, null, 2), "utf-8");
    console.log(`  ${docid}: ${detail.title}`);
  }

  console.log("Fertig.");
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { parseListPage, parseDetailPage };
