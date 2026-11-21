/** خطای پایهٔ SDK فینگت. */
export class FingetError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "FingetError";
  }
}

/** پاسخ ناموفق API فینگت. */
export class ApiError extends FingetError {
  readonly status: number;
  readonly errorCode: string | null;
  readonly body: Record<string, unknown>;

  constructor(
    message: string,
    status: number,
    errorCode: string | null = null,
    body: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errorCode = errorCode;
    this.body = body;
  }
}
