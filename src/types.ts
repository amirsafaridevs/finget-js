export type FingetUser = {
  id: string;
  name: string;
  phone: string;
};

export type SiteInfo = {
  domain: string;
  displayDomain: string;
  name: string | null;
  verifiedAt: string;
};

export type TokenResult = {
  user: FingetUser;
  isNew: boolean;
};

export type NotificationLink = {
  url: string;
  label?: string;
};

export type NotificationCoupon = {
  code: string;
  note?: string;
  expiresAt?: string;
};

export type SendNotificationInput = {
  title: string;
  body?: string;
  kind?: "notice" | "reminder" | "security" | "promo";
  id?: string;
  users?: string[];
  audience?: "all";
  link?: NotificationLink;
  coupon?: NotificationCoupon;
};

export type NotificationResult = {
  notification: Record<string, unknown>;
  skipped?: Record<string, number>;
  duplicate?: boolean;
};

export type ClientOptions = {
  /** کلید API سایت (fg_live_…) — فقط سمت سرور */
  apiKey: string;
  /** پیش‌فرض: https://finget.ir/api/v1 */
  baseUrl?: string;
  /** پیش‌فرض: https://finget.ir/auth */
  authUrl?: string;
  /** مهلت درخواست بر حسب میلی‌ثانیه */
  timeoutMs?: number;
};
