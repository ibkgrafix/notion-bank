import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { beneficiarySchema } from "@/lib/validations";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const beneficiaries = await prisma.beneficiary.findMany({
      where: { userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ beneficiaries });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const body = await request.json();
    const parsed = beneficiarySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Check for duplicate
    const existing = await prisma.beneficiary.findFirst({
      where: {
        userId,
        accountNumber: parsed.data.accountNumber,
        status: "ACTIVE",
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "A beneficiary with this account number already exists." },
        { status: 409 }
      );
    }

    const beneficiary = await prisma.beneficiary.create({
      data: {
        userId,
        name: parsed.data.name,
        accountNumber: parsed.data.accountNumber,
        routingNumber: parsed.data.routingNumber,
        bankName: parsed.data.bankName,
        nickname: parsed.data.nickname || null,
        status: "ACTIVE",
      },
    });

    return NextResponse.json({ beneficiary }, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
