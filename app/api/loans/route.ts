import { NextRequest, NextResponse } from "next/server";
import { getSession, requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loanApplicationSchema } from "@/lib/validations";
import { dollarsToCents } from "@/lib/utils";

export async function GET() {
  try {
    const session = await getSession();
    const { userId } = requireAuth(session);

    const loans = await prisma.loan.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ loans });
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
    const parsed = loanApplicationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { loanType, requestedAmount, termMonths, purpose } = parsed.data;
    const requestedCents = dollarsToCents(parseFloat(requestedAmount));

    const loan = await prisma.loan.create({
      data: {
        userId,
        loanType,
        requestedCents,
        termMonths,
        purpose: purpose || null,
        status: "PENDING",
      },
    });

    // Log application server-side
    console.info(`[LOAN] User ${userId} applied for ${loanType} loan of $${(requestedCents / 100).toFixed(2)}`);

    return NextResponse.json(
      {
        message: "Loan application submitted successfully.",
        loan: {
          id: loan.id,
          status: loan.status,
          loanType: loan.loanType,
          requestedCents: loan.requestedCents,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Loan application error:", error);
    return NextResponse.json(
      { error: "Application failed. Please try again." },
      { status: 500 }
    );
  }
}
