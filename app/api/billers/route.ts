import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { addBillerSchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);
    const billers = await prisma.biller.findMany({ where: { userId }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ billers });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const body = await request.json();
    const parsed = addBillerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }

    const biller = await prisma.biller.create({
      data: { userId, name: parsed.data.name, accountRef: parsed.data.accountRef, category: parsed.data.category || "OTHER" },
    });

    return NextResponse.json({ biller }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
