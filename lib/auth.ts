import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import type { Role } from "@prisma/client";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback-secret-change-in-production"
);

const SESSION_DURATION_HOURS = parseInt(
  process.env.SESSION_DURATION_HOURS || "24"
);

export interface SessionPayload {
  userId: string;
  email: string;
  role: Role;
  sessionId: string;
}

export async function createSession(
  userId: string,
  email: string,
  role: Role,
  ipAddress?: string,
  userAgent?: string
): Promise<string> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + SESSION_DURATION_HOURS);

  const session = await prisma.userSession.create({
    data: {
      userId,
      token: crypto.randomUUID(),
      ipAddress,
      userAgent,
      expiresAt,
    },
  });

  const token = await new SignJWT({
    userId,
    email,
    role,
    sessionId: session.id,
  } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_HOURS}h`)
    .sign(JWT_SECRET);

  return token;
}

export async function verifySession(
  token: string
): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    const session = payload as unknown as SessionPayload;

    // Verify session exists and is not invalidated
    const dbSession = await prisma.userSession.findUnique({
      where: { id: session.sessionId },
      include: { user: { select: { status: true, role: true } } },
    });

    if (!dbSession) return null;
    if (dbSession.invalidatedAt) return null;
    if (dbSession.expiresAt < new Date()) return null;
    if (dbSession.user.status === "SUSPENDED" || dbSession.user.status === "LOCKED") return null;

    // Update last active
    await prisma.userSession.update({
      where: { id: session.sessionId },
      data: { lastActiveAt: new Date() },
    });

    return session;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function invalidateSession(sessionId: string): Promise<void> {
  await prisma.userSession.update({
    where: { id: sessionId },
    data: { invalidatedAt: new Date() },
  });
}

export async function invalidateAllUserSessions(userId: string): Promise<void> {
  await prisma.userSession.updateMany({
    where: { userId, invalidatedAt: null },
    data: { invalidatedAt: new Date() },
  });
}

export function requireAuth(session: SessionPayload | null): SessionPayload {
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export function requireAdmin(session: SessionPayload | null): SessionPayload {
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  if (session.role !== "ADMIN") {
    throw new Error("FORBIDDEN");
  }
  return session;
}
