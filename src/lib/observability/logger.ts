type LogLevel = 'info' | 'warn' | 'error';

type LogContext = {
  operation: string;
  organizationId?: string;
  userId?: string;
  route?: string;
  durationMs?: number;
  status?: string | number;
  error?: string;
  metadata?: Record<string, unknown>;
};

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordHash',
  'token',
  'secret',
  'apiKey',
  'authorization',
  'cookie',
]);

function redact(value: unknown): unknown {
  if (value == null) return value;
  if (Array.isArray(value)) return value.map(redact);
  if (typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.has(k.toLowerCase())) {
        out[k] = '[REDACTED]';
      } else {
        out[k] = redact(v);
      }
    }
    return out;
  }
  return value;
}

function emit(level: LogLevel, ctx: LogContext) {
  const payload = {
    level,
    ts: new Date().toISOString(),
    ...ctx,
    metadata: ctx.metadata ? redact(ctx.metadata) : undefined,
  };

  if (level === 'error') {
    console.error(JSON.stringify(payload));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(payload));
  } else {
    console.log(JSON.stringify(payload));
  }
}

export function logInfo(ctx: LogContext) {
  emit('info', ctx);
}

export function logWarn(ctx: LogContext) {
  emit('warn', ctx);
}

export function logError(ctx: LogContext) {
  emit('error', ctx);
}

export async function withTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  context?: Omit<LogContext, 'operation' | 'durationMs'>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    logInfo({ operation, durationMs: Date.now() - start, status: 'ok', ...context });
    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'UNKNOWN_ERROR';
    logError({
      operation,
      durationMs: Date.now() - start,
      status: 'error',
      error: message,
      ...context,
    });
    throw err;
  }
}
