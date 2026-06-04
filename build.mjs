// Curated Feed builder — runs in GitHub Actions.
// Pulls X Lists (via RSSHub) + Substacks/blogs (native RSS), classifies into lanes,
// merges into a deduped persistent store, and renders the dashboard to public/index.html.
// Dependency-free: Node 20+ (built-in fetch), minimal RSS/Atom parsing.

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const cfg = JSON.parse(readFileSync("feeds.json", "utf8"));
const STORE = "data/feed.json";

// ---------- tiny RSS/Atom parser ----------
const strip = (s = "") =>
  s.replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
   .replace(/<[^>]+>/g, " ")
   .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
   .replace(/&#39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, " ")
   .replace(/\s+/g, " ").trim();

const tag = (block, name) => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? m[1].trim() : "";
};

function parseFeed(xml) {
  const items = [];
  const isAtom = /<entry[\s>]/i.test(xml) && !/<item[\s>]/i.test(xml);
  const blocks = xml.match(isAtom ? /<entry[\s\S]*?<\/entry>/gi : /<item[\s\S]*?<\/item>/gi) || [];
  for (const b of blocks) {
    let link = "";
    if (isAtom) {
      const lm = b.match(/<link[^>]*href="([^"]+)"/i);
      link = lm ? lm[1] : "";
    } else {
      link = strip(tag(b, "link")) || (b.match(/<link[^>]*href="([^"]+)"/i)?.[1] ?? "");
    }
    const title = strip(tag(b, "title"));
    const author = strip(tag(b, "dc:creator") || tag(b, "author") || tag(b, "name"));
    const desc = strip(tag(b, "description") || tag(b, "content:encoded") || tag(b, "summary") || tag(b, "content"));
    const dateRaw = strip(tag(b, "pubDate") || tag(b, "published") || tag(b, "updated"));
    const d = dateRaw ? new Date(dateRaw) : null;
    items.push({
      title: title.slice(0, 200),
      source: link,
      author: author.slice(0, 60),
      desc: desc.slice(0, 300),
      published: d && !isNaN(d) ? d.toISOString().slice(0, 10) : "",
      _ts: d && !isNaN(d) ? d.getTime() : Date.now(),
    });
  }
  return items;
}

async function fetchText(url) {
  try {
    const r = await fetch(url, { headers: { "user-agent": "curated-feed/1.0" } });
    if (!r.ok) { console.warn(`  ! ${r.status} ${url}`); return ""; }
    return await r.text();
  } catch (e) { console.warn(`  ! ${e.message} ${url}`); return ""; }
}

// ---------- classify ----------
const kw = cfg.laneKeywords;
function lane(item, fallback) {
  const t = (item.title + " " + item.desc + " " + item.source).toLowerCase();
  if ((kw.health || []).some(k => t.includes(k))) return fallback === "claude" ? fallback : "health";
  if ((kw.claude || []).some(k => t.includes(k))) return "claude";
  return fallback;
}
const typeOf = (u) =>
  /x\.com|twitter\.com/.test(u) ? "X" : /substack\.com/.test(u) ? "Substack" : "Web";

// ---------- gather ----------
const fresh = [];
async function pull(url, laneHint) {
  const xml = await fetchText(url);
  if (!xml) return;
  const items = parseFeed(xml);
  for (const it of items) {
    it.type = typeOf(it.source);
    it.domain = it.type === "X" ? laneHint : lane(it, laneHint); // trust list lane for X
    if (it.title && it.source) fresh.push(it);
  }
  console.log(`  + ${items.length} <- ${url}`);
}

console.log("Pulling X Lists via RSSHub...");
for (const L of cfg.xLists) {
  if (L.listId.startsWith("PASTE_")) { console.log(`  (skip ${L.lane}: list id not set)`); continue; }
  await pull(`${cfg.rsshubBase}/twitter/list/${L.listId}`, L.lane);
}
console.log("Pulling Substacks & blogs...");
for (const F of [...cfg.substacks, ...cfg.blogs]) await pull(F.url, F.lane);

// ---------- merge + dedupe + cap ----------
const store = JSON.parse(readFileSync(STORE, "utf8"));
const key = (i) => (i.source || i.title).split("?")[0];
const seen = new Map();
for (const i of store) seen.set(key(i), i);
for (const i of fresh) seen.set(key(i), i); // fresh overwrites
let merged = [...seen.values()].sort((a, b) => (b._ts || 0) - (a._ts || 0));
if (merged.length > (cfg.maxStore || 600)) merged = merged.slice(0, cfg.maxStore);

writeFileSync(STORE, JSON.stringify(merged));
console.log(`Store: ${merged.length} items (${fresh.length} fetched this run).`);

// ---------- render ----------
const tpl = readFileSync("template.html", "utf8");
mkdirSync("public", { recursive: true });
writeFileSync("public/index.html", tpl.replace("__DATA__", JSON.stringify(merged)));
console.log("Wrote public/index.html");
