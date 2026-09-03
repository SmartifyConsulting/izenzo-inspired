# Running the demo

Two processes, both required. Run each in its own terminal.

## 1. Backend (real API, port 4000)

```
cd server
npm install
npm run dev
```

Confirms it's up:
```
Loaded 19326 entries from OFAC SDN list
Izenzo spine backend listening on :4000
```

On first run this downloads nothing — the OFAC sanctions list is already checked into
`server/db/sdn.csv`. **Refresh it the morning of the presentation** so it's verifiably
current-day data, not a stale snapshot:

```
curl -s -L "https://www.treasury.gov/ofac/downloads/sdn.csv" -o server/db/sdn.csv
```

Then restart the backend so it reloads the list.

To start clean (wipe all demo transactions/wallets before the meeting):
```
rm server/db/izenzo.sqlite
```
It's recreated automatically on next backend start.

## 2. Frontend (port 5173 via Vite, or 8095 if using the Claude Code launch config)

```
npm install
npm run dev
```

Open `/live-demo` in the nav under **Developers → Live Backend Demo**, or go directly to
`http://localhost:5173/live-demo`.

## Demo script

1. Leave the counterparty name as the default (**Aurelia Metals Trading Pty Ltd**) and
   click **Run the full spine live**. Every stage lights up green, ending in a sealed
   Finality certificate and a verified Memory hash chain (~20+ events).
2. To show the hard gate actually works — not just decoration — change the name to
   **Vladimir Putin** (a real OFAC-listed individual) and run again. WaD correctly FAILS,
   Execution correctly LOCKS with a `409 NON_WAIVABLE_BLOCK`. This is the strongest single
   proof point: a real government sanctions list blocking a real gate in real time.
3. Both runs create a fresh workspace each time (no shared state), so you can alternate
   between them freely during the meeting.

## What this proves vs. what it doesn't

**Real and verified:** the exact Trading→POI→WaD→Execution→Finality sequence from the
spec, server-enforced stage order, non-waivable $10/$30 token gates, live sanctions
screening against the actual US Treasury list, SHA-256 hash-sealing, and an append-only
hash-chained Memory substrate with forward/backward lineage.

**Not built:** AI document extraction, payment provider integration (PayFast), multi-tenant
security hardening, the Execution "Project Preparation" sub-stages, funder workspaces, and
everything else in the spec's WP5–WP7. Say so plainly if asked — the whole point of this
exercise was not repeating the previous vendor's problem of overclaiming.
