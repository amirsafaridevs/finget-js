# finget-sdk

[![npm](https://img.shields.io/npm/v/finget-sdk.svg)](https://www.npmjs.com/package/finget-sdk)
[![Node](https://img.shields.io/node/v/finget-sdk.svg)](https://www.npmjs.com/package/finget-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Official **Node.js** SDK for the [Finget](https://finget.ir) public API (`/api/v1`).

Written in TypeScript, published as ESM + CommonJS with full `.d.ts` typings. Use it from TypeScript or plain JavaScript on the server.

- Passwordless **Sign in with Finget**
- Exchange callback `code` for a Finget user
- Send **push notifications** to linked users
- Check site and notification status

> Keep your API key on the server only. Never ship `FINGET_API_KEY` to the browser.

## Links

| | |
|---|---|
| Website | [finget.ir](https://finget.ir) |
| Plugins & SDKs | [finget.ir/plugins](https://finget.ir/plugins) |
| API docs | [Provider panel docs](https://finget.ir/provider/panel/docs) |
| npm | [finget-sdk](https://www.npmjs.com/package/finget-sdk) |
| Repository | [amirsafaridevs/finget-js](https://github.com/amirsafaridevs/finget-js) |

## Requirements

- **Node.js 18+** (uses native `fetch` and `crypto.getRandomValues`)

## Installation

```bash
npm install finget-sdk
```

```bash
pnpm add finget-sdk
yarn add finget-sdk
```

## Quick start

```bash
export FINGET_API_KEY=fg_live_...
```

### TypeScript / ESM

```ts
import { Client } from "finget-sdk";

const finget = Client.fromEnv();
// or: new Client({ apiKey: process.env.FINGET_API_KEY! })

const { site } = await finget.getSite();
console.log(site.domain, site.displayDomain);
```

### CommonJS

```js
const { Client } = require("finget-sdk");

const finget = new Client({ apiKey: process.env.FINGET_API_KEY });
```

## Authentication (Sign in with Finget)

1. In the Finget provider panel, copy your **site client ID** and register the callback URL.
2. Redirect the user to Finget with a CSRF `state` stored in the session.
3. On callback, verify `state`, then exchange `code`.

Example with Express-style handlers:

```ts
import { Client } from "finget-sdk";

const finget = Client.fromEnv();
const clientId = process.env.FINGET_CLIENT_ID!;

// GET /login/finget
app.get("/login/finget", (req, res) => {
  const { url, state } = finget.loginUrl(clientId);
  req.session.fingetState = state;
  res.redirect(url);
});

// GET /auth/finget/callback
app.get("/auth/finget/callback", async (req, res) => {
  const expected = req.session.fingetState;
  delete req.session.fingetState;

  const code = String(req.query.code ?? "");
  const state = String(req.query.state ?? "");

  if (!code || !expected || state !== expected) {
    return res.redirect("/login");
  }

  const { user, isNew } = await finget.exchangeCode(code);
  // user: { id, name, phone }
  // Find or create your local account by user.id, then establish a session.
  res.redirect("/");
});
```

### `loginUrl()`

```ts
const { url, state } = finget.loginUrl(clientId);
const { url, state } = finget.loginUrl(clientId, existingState);
```

## Notifications

```ts
await finget.sendNotification({
  id: `order-${order.id}-shipped`, // optional idempotency key
  kind: "notice", // "notice" | "reminder" | "security" | "promo"
  title: "Your order shipped",
  body: `Order ${order.id} is on the way.`,
  link: {
    url: `https://shop.example/orders/${order.id}`,
    label: "Track order",
  },
  users: [user.fingetId],
  // or: audience: "all",
});
```

Optional coupon:

```ts
coupon: {
  code: "SAVE10",
  note: "Valid this week",
  expiresAt: "2026-12-31T23:59:59+03:30",
}
```

Check status:

```ts
const status = await finget.getNotification("order-1234-shipped");
```

## API reference

### `Client`

| Method | Description |
|--------|-------------|
| `Client.fromEnv(apiKeyEnv?: string)` | Build from `process.env` (default key: `FINGET_API_KEY`) |
| `getSite()` | Validate the API key; return `{ site }` |
| `loginUrl(clientId, state?)` | Auth redirect URL + state |
| `createState(bytes?)` | Secure random hex state (default 16 bytes) |
| `exchangeCode(code)` | Exchange callback code → `{ user, isNew }` |
| `getUser(userId)` | Refresh a linked user → `{ user }` |
| `sendNotification(payload)` | Create a notification (expects HTTP 201) |
| `getNotification(notificationId)` | Notification status payload |

### Constructor options

```ts
new Client({
  apiKey: string;       // required — fg_live_…
  baseUrl?: string;     // default https://finget.ir/api/v1
  authUrl?: string;     // default https://finget.ir/auth
  timeoutMs?: number;   // default 20_000
});
```

### Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FINGET_API_KEY` | yes (for `fromEnv`) | Site API key |
| `FINGET_BASE_URL` | no | Override API base URL |
| `FINGET_AUTH_URL` | no | Override login page URL |

### Types (TypeScript)

Exported from `finget-sdk`:

- `ClientOptions`
- `FingetUser` — `{ id, name, phone }`
- `SiteInfo`
- `TokenResult` — `{ user, isNew }`
- `SendNotificationInput`
- `NotificationResult`
- `NotificationLink`, `NotificationCoupon`

### Errors

```ts
import { Client, ApiError, FingetError } from "finget-sdk";

try {
  await Client.fromEnv().getSite();
} catch (err) {
  if (err instanceof ApiError) {
    err.message;
    err.status;     // 0 if network / timeout
    err.errorCode;  // e.g. invalid_api_key when present
    err.body;
  } else if (err instanceof FingetError) {
    // Client-side validation
  }
}
```

## Local development

```ts
const finget = new Client({
  apiKey: process.env.FINGET_API_KEY!,
  baseUrl: "http://localhost:3001/api/v1",
  authUrl: "http://localhost:5173/auth",
});
```

Or set `FINGET_BASE_URL` / `FINGET_AUTH_URL` in the environment before `Client.fromEnv()`.

## License

[MIT](LICENSE)
