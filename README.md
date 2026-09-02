# FreeTrxBet

A complete TRX gambling platform template built with React, TypeScript, Vite, and Tailwind CSS. Features a Hi-Lo card game, deposit/withdrawal system, full admin panel, and a marketing landing page.

## Quick Start

```bash
npm install
npm run dev
```

Open the browser at the URL shown in the terminal (typically `http://localhost:5173`).

To build for production:

```bash
npm run build
```

## Demo Credentials

| Role  | Email                   | Password   |
|-------|-------------------------|------------|
| Admin | admin@freetrxbet.com    | admin123   |
| User  | demo@freetrxbet.com     | demo123    |

The demo user starts with 100 TRX. The admin has access to the admin panel (visible as a shield icon in the nav after logging in).

## Data Model

All data is stored in the browser's `localStorage` under two keys:

- `freetrxbet_store_v1` — users, deposits, withdrawals, bets, and site configuration
- `freetrxbet_session_v1` — the current logged-in user's ID

No backend or external database is used. Clearing browser storage resets all data. The admin panel's Site Config page includes a "Reset Demo Data" button that clears storage and restores the original seed data.

### Password Security

Passwords are hashed client-side using the Web Crypto API (`crypto.subtle.digest('SHA-256', ...)`). This is appropriate for a localStorage demo. A production deployment with a backend should use server-side bcrypt or argon2 instead.

## Features

### Player Side
- **Hi-Lo Card Game** — Bet TRX on whether the next card value (1-100) will be higher or lower. Win chance and multiplier are calculated transparently based on the current card value and a configurable house edge.
- **Deposits** — Scan a QR code or copy the deposit address, send TRX, then submit the transaction hash for admin review.
- **Withdrawals** — Request a withdrawal to any TRX address. Pending withdrawals can be cancelled (funds are refunded instantly).
- **Profile** — Update username, email, and password. Delete account permanently via the Danger Zone.
- **Bet History** — Full table of recent bets with direction, card value, multiplier, and payout.

### Admin Side
- **User Management** — Search, ban/unban, modify balances (add/subtract), and permanently delete users. Deleted users' historical records remain but display as "Deleted User".
- **Deposit Review** — Approve or reject pending deposits. Approving credits the user's balance.
- **Withdrawal Review** — Approve or reject pending withdrawals. Rejecting refunds the user with a reason.
- **Site Configuration** — Edit site name, support Telegram, deposit address, game limits (min/max bet, house edge), transaction limits (min deposit/withdrawal), withdrawal note, and maintenance mode.
- **Reset Demo Data** — One-click reset to the original seed state.

### Landing Page
Logged-out visitors see a marketing landing page with a hero section, feature highlights, and login/register CTAs.

## Configuration

All game and transaction settings are configurable from the admin panel under **Site Config**:

| Setting            | Description                                      | Default |
|--------------------|--------------------------------------------------|---------|
| `hiLoMinBet`       | Minimum TRX amount per bet                       | 1       |
| `hiLoMaxBet`       | Maximum TRX amount per bet                        | 5000    |
| `houseEdgePercent` | House edge applied to fair multiplier            | 5       |
| `minDeposit`       | Minimum TRX deposit amount                       | 5       |
| `minWithdrawal`    | Minimum TRX withdrawal amount                    | 10      |
| `maintenanceMode`  | When ON, non-admin users see a maintenance screen | false  |

## Customization Guide

### Brand Name
- **Display name**: Edit `siteName` in the admin panel (Site Config), or change the default in `src/lib/storage.ts` (`DEFAULT_CONFIG.siteName`).
- **Logo text**: The `Logo` component in `src/components/Logo.tsx` renders "Free**Trx**Bet" — edit the JSX to change the wordmark.

### Colors
Color tokens are defined in `tailwind.config.js` under `theme.extend.colors`:
- `base` — background and surface tones (charcoal/near-black)
- `accent.salmon` — the coral/salmon accent used for highlights and active nav items
- `accent.red` — the red used for primary CTA buttons
- `status` — green (success), amber (pending), red (error), gray (neutral)

Change these values to re-theme the entire app.

### Fonts
Fonts are loaded in `index.html` via Google Fonts:
- **Geist** — the primary sans-serif font (body text, headings)
- **JetBrains Mono** — used for numeric/balance displays

Replace the `<link>` tags and the `fontFamily` entries in `tailwind.config.js` to use different fonts.

### Sounds
Game sounds (bet, card reveal, win, loss) are generated with the Web Audio API in `src/lib/sounds.ts` — no audio files needed. Edit the `sounds` object to change tones or add new ones.

## Tech Stack

- **React 18** with TypeScript
- **Vite 5** as the build tool
- **Tailwind CSS 3** for styling
- **lucide-react** for icons
- **qrcode.react** for deposit QR codes
- **Web Crypto API** for password hashing
- **Web Audio API** for sound effects

## Disclaimer

FreeTrxBet is a **UI and state management template**. It does not process real cryptocurrency payments, has no backend server, and performs no KYC/AML checks. The deposit address is a placeholder, balances are fictional numbers in localStorage, and no on-chain TRX transactions occur.

Integrating real TRX transactions requires a backend service that:
- Verifies on-chain deposits by polling the Tron network (e.g., via TronGrid/TronScan APIs)
- Sends withdrawals through a managed wallet using the TronWeb SDK
- Enforces KYC/AML compliance as required by your jurisdiction
- Uses server-side password hashing (bcrypt/argon2) and secure session management

These are out of scope for this template.
