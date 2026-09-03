import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const SDN_PATH = path.join(__dirname, '..', 'db', 'sdn.csv')

// Loads the real US Treasury OFAC Specially Designated Nationals (SDN) list —
// a live, authoritative, publicly downloadable government sanctions dataset.
// No API key required; this is the primary source most commercial sanctions
// screening vendors resell/aggregate.
let sdnEntries = []

function parseCsvLine(line) {
  const fields = []
  let cur = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      fields.push(cur.trim())
      cur = ''
    } else {
      cur += c
    }
  }
  fields.push(cur.trim())
  return fields
}

function loadSdnList() {
  if (!fs.existsSync(SDN_PATH)) {
    console.warn('OFAC SDN list not found at', SDN_PATH, '— run the fetch step first.')
    return
  }
  const raw = fs.readFileSync(SDN_PATH, 'utf-8')
  const lines = raw.split('\n').filter(Boolean)
  sdnEntries = lines.map((line) => {
    const f = parseCsvLine(line)
    return {
      ent_num: f[0],
      name: (f[1] || '').replace(/^-0-\s*$/, ''),
      type: (f[2] || '').replace(/^-0-\s*$/, ''),
      program: (f[3] || '').replace(/^-0-\s*$/, ''),
      remarks: (f[10] || '').replace(/^-0-\s*$/, ''),
    }
  }).filter((e) => e.name)
  console.log(`Loaded ${sdnEntries.length} entries from OFAC SDN list`)
}

loadSdnList()

function normalize(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim()
}

// Word-level matching only — never raw substring containment, which produces
// false positives like "LIA" matching inside "AuRELIA" (a real bug caught
// during testing: "Aurelia Metals Trading" falsely hit a sanctioned "LIA").
function similarity(a, b) {
  const na = normalize(a)
  const nb = normalize(b)
  if (na === nb) return 1
  const wordsA = na.split(' ').filter((w) => w.length > 2)
  const wordsB = nb.split(' ').filter((w) => w.length > 2)
  if (wordsA.length === 0 || wordsB.length === 0) return 0
  const setB = new Set(wordsB)
  const overlap = wordsA.filter((w) => setB.has(w)).length
  const denom = Math.max(wordsA.length, wordsB.length)
  // Require the shorter name to be substantially covered by shared whole
  // words, not just any overlap, to avoid matching on one common word.
  const coverage = overlap / Math.min(wordsA.length, wordsB.length)
  if (coverage < 0.6) return 0
  return overlap / denom
}

export async function screenName(name) {
  if (sdnEntries.length === 0) {
    return { status: 'error', error: 'OFAC SDN list not loaded on server', matches: [] }
  }
  const scored = sdnEntries
    .map((e) => ({ ...e, score: similarity(name, e.name) }))
    .filter((e) => e.score >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  return {
    status: scored.length > 0 ? 'hit' : 'clear',
    matches: scored.map((m) => ({
      name: m.name,
      score: Number(m.score.toFixed(2)),
      program: m.program,
      ofac_entity_number: m.ent_num,
    })),
    checked_at: new Date().toISOString(),
    source: `US Treasury OFAC Specially Designated Nationals (SDN) List — ${sdnEntries.length} entries, live government data`,
  }
}
