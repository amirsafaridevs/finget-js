import { ApiError, FingetError } from "./errors.js";
import type {
  ClientOptions,
  NotificationResult,
  SendNotificationInput,
  SiteInfo,
  TokenResult,
  FingetUser,
} from "./types.js";

export const VERSION = "1.0.0";
export const DEFAULT_BASE_URL = "https://finget.ir/api/v1";
export const DEFAULT_AUTH_URL = "https://finget.ir/auth";

/**
 * کلاینت رسمی API عمومی فینگت (/api/v1).
 * کلید API را فقط سمت سرور نگه دارید.
 */
export class Client {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly authUrl: string;
  private readonly timeoutMs: number;

  constructor(options: ClientOptions) {
    const apiKey = options.apiKey.trim();
    if (!apiKey) {
      throw new FingetError("کلید API فینگت خالی است.");
    }
    const timeoutMs = options.timeoutMs ?? 20_000;
    if (timeoutMs < 1) {
      throw new FingetError("مهلت درخواست باید حداقل ۱ میلی‌ثانیه باشد.");
    }

    this.apiKey = apiKey;
    this.baseUrl = (options.baseUrl ?? DEFAULT_BASE_URL).replace(/\/$/, "");
    this.authUrl = (options.authUrl ?? DEFAULT_AUTH_URL).replace(/\/$/, "");
    this.timeoutMs = timeoutMs;
  }

  /** از process.env.FINGET_API_KEY (و اختیاری FINGET_BASE_URL / FINGET_AUTH_URL). */
  static fromEnv(apiKeyEnv = "FINGET_API_KEY"): Client {
    const key = process.env[apiKeyEnv];
    if (!key?.trim()) {
      throw new FingetError(`متغیر محیطی ${apiKeyEnv} تنظیم نشده است.`);
    }
    return new Client({
      apiKey: key,
      baseUrl: process.env.FINGET_BASE_URL || undefined,
      authUrl: process.env.FINGET_AUTH_URL || undefined,
    });
  }

  /** آزمودن کلید؛ مشخصات سایت صاحب کلید. */
  async getSite(): Promise<{ site: SiteInfo }> {
    return this.request("GET", "/site");
  }

  /** کد یک‌بارمصرف callback را به اطلاعات کاربر تبدیل می‌کند. */
  async exchangeCode(code: string): Promise<TokenResult> {
    const trimmed = code.trim();
    if (!trimmed) {
      throw new FingetError("کد ورود (code) خالی است.");
    }
    return this.request("POST", "/auth/token", { code: trimmed });
  }

  /** اطلاعات تازه‌ی کاربر وصل به سایت. */
  async getUser(userId: string): Promise<{ user: FingetUser }> {
    const id = userId.trim();
    if (!id) {
      throw new FingetError("شناسه‌ی کاربر خالی است.");
    }
    return this.request("GET", `/users/${encodeURIComponent(id)}`);
  }

  /** ارسال اعلان به کاربران وصل سایت. */
  async sendNotification(payload: SendNotificationInput): Promise<NotificationResult> {
    return this.request("POST", "/notifications", payload, 201);
  }

  /** وضعیت یک پیام. */
  async getNotification(notificationId: string): Promise<Record<string, unknown>> {
    const id = notificationId.trim();
    if (!id) {
      throw new FingetError("شناسه‌ی اعلان خالی است.");
    }
    return this.request("GET", `/notifications/${encodeURIComponent(id)}`);
  }

  /** رشته‌ی تصادفی امن برای پارامتر state ورود. */
  createState(bytes = 16): string {
    if (bytes < 8) {
      throw new FingetError("طول state خیلی کوتاه است.");
    }
    const buf = new Uint8Array(bytes);
    crypto.getRandomValues(buf);
    return [...buf].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  /**
   * آدرس دکمه‌ی «ورود با فینگت».
   * اگر state ندهید ساخته می‌شود؛ همان را در نشست نگه دارید.
   */
  loginUrl(clientId: string, state?: string): { url: string; state: string } {
    const id = clientId.trim();
    if (!id) {
      throw new FingetError("شناسه‌ی سایت (client_id) خالی است.");
    }
    const s = state ?? this.createState();
    const url = new URL(this.authUrl);
    url.searchParams.set("client_id", id);
    url.searchParams.set("state", s);
    return { url: url.toString(), state: s };
  }

  private async request<T = Record<string, unknown>>(
    method: string,
    path: string,
    body?: unknown,
    okStatuses: number | number[] = 200,
  ): Promise<T> {
    const ok = Array.isArray(okStatuses) ? okStatuses : [okStatuses];
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.baseUrl}${path}`, {
        method,
        redirect: "manual",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "User-Agent": `finget-js/${VERSION}`,
          ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });

      let data: Record<string, unknown> = {};
      const text = await res.text();
      if (text) {
        try {
          const parsed: unknown = JSON.parse(text);
          data = parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
        } catch {
          data = {};
        }
      }

      if (!ok.includes(res.status)) {
        const message =
          typeof data.message === "string"
            ? data.message
            : `درخواست به فینگت ناموفق بود (HTTP ${res.status}).`;
        const code = typeof data.code === "string" ? data.code : null;
        throw new ApiError(message, res.status, code, data);
      }

      return data as T;
    } catch (err) {
      if (err instanceof ApiError) {
        throw err;
      }
      if (err instanceof Error && err.name === "AbortError") {
        throw new ApiError("مهلت اتصال به فینگت تمام شد.", 0);
      }
      const message = err instanceof Error ? err.message : "اتصال به فینگت برقرار نشد.";
      throw new ApiError(message, 0);
    } finally {
      clearTimeout(timer);
    }
  }
}
