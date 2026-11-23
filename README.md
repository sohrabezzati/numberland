# Numberland — SecondNumber.io Telegram Serverless Bot

A native **Telegram Serverless** (`@tgcloud/cli`) bot integrating with the **[SecondNumber.io](https://secondnumber.io)** virtual phone number & SMS OTP verification API (`https://secondnumber.io/stubs/handler_api.php`).

Runs directly on Telegram's managed serverless V8 infrastructure (`core.telegram.org/bots/serverless`) with built-in SQLite persistence — no VPS, no Cloudflare Workers, and no manual webhook hosting required.

---

## ✨ Features

- **Native Telegram Serverless Runtime**: Managed webhook & V8 isolate execution via `@tgcloud/cli`.
- **Built-in SQLite Persistence (`tgcloud/schema.js`)**:
  - `settings` — Stores the SecondNumber.io API key and owner ID securely inside the bot's private DB.
  - `allowed_users` — Owner-managed admin whitelist.
  - `orders` — Tracks rented virtual numbers, activation IDs, and received OTP codes.
- **Interactive Inline Menus & Direct Commands**:
  - `/buy` — 2-step interactive Service & Country selector, or `/buy <service> <country> [maxPrice]`.
  - `/balance` — Check SecondNumber.io account balance in real time.
  - `/orders` — View recent virtual numbers and tap any to poll OTP codes, request next SMS, complete, or cancel & refund.
  - `/status <id>`, `/next <id>`, `/finish <id>`, `/cancel <id>` — Direct activation lifecycle commands.
- **Secure In-Chat Key Setup**:
  - `/setkey <API_KEY>` verifies the key via `getBalance`, immediately deletes your secret message from Telegram chat history, and claims bot ownership.
  - `/allow <user_id> [label]`, `/revoke <user_id>`, `/admins` — Whitelist management (Owner only).

---

## 📁 Project Structure

```text
tgcloud/
├── schema.js                  # SQLite tables (settings, allowed_users, orders)
├── handlers/
│   ├── message.js             # Text command router
│   └── callback_query.js      # Inline keyboard interaction handler
└── lib/
    ├── secondnumber.js        # SecondNumber.io API client (sdk/fetch)
    ├── catalog.js             # Popular services & countries quick-select list
    ├── store.js               # SQLite queries & access control (sdk/db)
    ├── ui.js                  # HTML formatters & inline keyboard builders
    └── actions.js             # Shared bot action flows
```

---

## 🚀 Deployment

```bash
npm install
npx tgcloud login       # Paste CLI access token from @BotFather → Serverless → CLI Access
npx tgcloud push        # Deploy all modules to Telegram Serverless
npx tgcloud migrate     # Apply SQLite schema migrations
npx tgcloud webhook     # Verify managed webhook status
```
