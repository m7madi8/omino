import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export async function createUser(input: {
  email: string;
  password: string;
  fullName?: string;
  phone?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new Error('EMAIL_EXISTS');

  const passwordHash = await bcrypt.hash(input.password, 12);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      fullName: input.fullName?.trim() || null,
      phone: input.phone?.trim() || null,
    },
  });
}

export async function verifyCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!user?.passwordHash) return null;

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return null;

  return user;
}
