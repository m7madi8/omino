import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createUser } from '@/server/services/auth-service';
import { checkRateLimit, getClientIp } from '@/lib/security/rate-limit';

const signupSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(128),
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(24).optional(),
});

const SIGNUP_LIMIT = parseInt(process.env.SIGNUP_RATE_LIMIT_PER_HOUR ?? '10', 10);

export async function POST(request: Request) {
  try {
    const ip = getClientIp(request);
    const rate = checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT, 3_600_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: 'RATE_LIMITED' },
        {
          status: 429,
          headers: rate.retryAfterMs
            ? { 'Retry-After': String(Math.ceil(rate.retryAfterMs / 1000)) }
            : undefined,
        }
      );
    }

    const body = await request.json();
    const data = signupSchema.parse(body);

    await createUser({
      email: data.email,
      password: data.password,
      fullName: data.fullName,
      phone: data.phone,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: 'VALIDATION', details: err.flatten() }, { status: 400 });
    }
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return NextResponse.json({ error: 'EMAIL_EXISTS' }, { status: 409 });
    }
    console.error('[signup]', err);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}
