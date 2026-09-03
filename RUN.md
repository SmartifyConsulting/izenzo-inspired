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
   click **Run the full spine live**. Every stage lights up green — including a real
   token-purchase session and signed-callback settlement before POI/WaD unlock — ending
   in a sealed Finality certificate and a verified Memory hash chain (~22 events).
2. To show the hard gate actually works — not just decoration — change the name to
   **Vladimir Putin** (a real OFAC-listed individual) and run again. WaD correctly FAILS,
   Execution correctly LOCKS with a `409 NON_WAIVABLE_BLOCK`. This is the strongest single
   proof point: a real government sanctions list blocking a real gate in real time.
3. Both runs create a fresh workspace each time (no shared state), so you can alternate
   between them freely during the meeting.
4. **Real account creation**: go to `/auth`, create an account with a real email/password.
   It persists server-side (bcrypt-hashed), and signing in with the wrong password shows
   a real inline error rather than crashing or silently failing.
5. **Payment gateway (manual walkthrough)**: call `POST /v1/token-purchases` with
   `{"tokens": 4}`, open `/checkout/<session_id>` in the browser, click Pay — this fires
   the same session→signed-callback→credit flow a live PayFast integration would use.
   Trying a POI/WaD gate before paying returns `402 INSUFFICIENT_TOKENS`; it unlocks the
   instant the payment settles. No real money moves — say so if asked; the mechanism is
   real, the processor behind it is a sandbox.

## What this proves vs. what it doesn't

**Real and verified:** the exact Trading→POI→WaD→Execution→Finality sequence from the
spec, server-enforced stage order, non-waivable $10/$30 token gates that require a real
settled wallet balance, live sanctions screening against the actual US Treasury list,
SHA-256 hash-sealing, an append-only hash-chained Memory substrate with forward/backward
lineage, real account creation and sign-in, and a real settlement-verification payment
flow (session → signed callback → idempotent credit) running against a sandbox provider.
Cross-tenant data isolation and basic crash resilience were tested and a real bug in each
was found and fixed during this build (see git log for details) — worth mentioning if
asked how thoroughly this was checked.

**Not built:** AI document extraction, a live payment processor account (PayFast or
otherwise — connecting one requires your own merchant credentials), OAuth sign-in
(buttons are visibly disabled, not silently broken), password reset, independent security
audit / penetration testing, multi-tenant load testing, the Execution "Project
Preparation" sub-stages, funder workspaces, and everything else in the spec's WP5–WP7.
Say so plainly if asked — the whole point of this exercise was not repeating the previous
vendor's problem of overclaiming.
