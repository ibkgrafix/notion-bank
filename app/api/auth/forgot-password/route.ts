import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = forgotPasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always return success to prevent user enumeration
    if (!user) {
      return NextResponse.json({
        message:
          "If an account exists with that email, a reset link has been sent.",
      });
    }

    // Invalidate any existing reset tokens
    await prisma.passwordReset.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const token = crypto.randomUUID() + "-" + crypto.randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour

    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    // In production, this would send an email. For dev, log the token.
    if (process.env.NODE_ENV === "development") {
      console.log(`\n==== PASSWORD RESET TOKEN ====`);
      console.log(`User: ${user.email}`);
      console.log(`Token: ${token}`);
      console.log(`Reset URL: ${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`);
      console.log(`==========================\n`);
    }

    return NextResponse.json({
      message:
        "If an account exists with that email, a reset link has been sent.",
      // Only expose token in development
      ...(process.env.NODE_ENV === "development" && { devToken: token }),
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Request failed. Please try again." },
      { status: 500 }
    );
  }
}
