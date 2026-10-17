export type AppErrorCode = 'network' | 'timeout' | 'server' | 'unknown';

export class AppError extends Error {
  readonly code: AppErrorCode;
  readonly original?: unknown;

  constructor(code: AppErrorCode, message: string, original?: unknown) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.original = original;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

const NETWORK_HINTS = ['network request failed', 'failed to fetch', 'network error'];

function messageOf(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as {message?: unknown}).message;
    return typeof m === 'string' ? m : '';
  }
  return '';
}

/** Turns anything that was thrown into an AppError with a stable `code`. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }
  const message = messageOf(error);
  const lower = message.toLowerCase();
  if (NETWORK_HINTS.some(hint => lower.includes(hint))) {
    return new AppError('network', 'Could not reach the server.', error);
  }
  if (!message) {
    return new AppError('unknown', 'Something went wrong.', error);
  }
  return new AppError('server', message, error);
}
