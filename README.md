# @finget/sdk

کلاینت رسمی [فینگت](https://finget.ir) برای **Node.js**، **JavaScript** و **TypeScript**: ورود بدون رمز و ارسال اعلان.

- نیازمندی: **Node.js 18+** (native `fetch`)
- مستندات API: [finget.ir/provider/panel/docs](https://finget.ir/provider/panel/docs)
- دانلود ZIP: [finget.ir/plugins](https://finget.ir/plugins)

## نصب

```bash
npm install @finget/sdk
```

## شروع سریع

```bash
export FINGET_API_KEY=fg_live_...
```

```ts
import { Client } from "@finget/sdk";

const finget = Client.fromEnv();
// یا: new Client({ apiKey: process.env.FINGET_API_KEY! })

const { site } = await finget.getSite();
```

## ورود با فینگت

```ts
import { Client } from "@finget/sdk";

const finget = Client.fromEnv();
const clientId = process.env.FINGET_CLIENT_ID!;

// شروع ورود
const { url, state } = finget.loginUrl(clientId);
req.session.fingetState = state;
res.redirect(url);

// callback
const expected = req.session.fingetState;
delete req.session.fingetState;
if (!req.query.code || !expected || req.query.state !== expected) {
  return res.redirect("/login");
}

const { user, isNew } = await finget.exchangeCode(String(req.query.code));
// حساب را با user.id پیدا یا بسازید
```

## ارسال اعلان

```ts
await finget.sendNotification({
  id: `order-${order.id}-shipped`,
  kind: "notice",
  title: "سفارش شما ارسال شد",
  body: `سفارش ${order.id} تحویل پست شد.`,
  link: { url: `https://shop.ir/orders/${order.id}`, label: "پیگیری سفارش" },
  users: [user.fingetId],
});
```

## JavaScript (بدون TypeScript)

```js
const { Client } = require("@finget/sdk");
// یا: import { Client } from "@finget/sdk";

const finget = new Client({ apiKey: process.env.FINGET_API_KEY });
```

## توسعهٔ محلی

```ts
const finget = new Client({
  apiKey: process.env.FINGET_API_KEY!,
  baseUrl: "http://localhost:3001/api/v1",
  authUrl: "http://localhost:5173/auth",
});
```

## مجوز

MIT
