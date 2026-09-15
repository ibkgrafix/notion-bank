import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validations";
import { createSession } from "@/lib/auth";
import { generateAccountNumber, ROUTING_NUMBER } from "@/lib/utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email address already exists." },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 12);

    // Create user and accounts in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email.toLowerCase(),
          phone: data.phone || null,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          addressLine1: data.addressLine1 || null,
          city: data.city || null,
          state: data.state || null,
          zipCode: data.zipCode || null,
          passwordHash,
          role: "CUSTOMER",
          status: "ACTIVE",
        },
      });

      // Create checking account
      const checkingAccount = await tx.account.create({
        data: {
          userId: user.id,
          accountType: "CHECKING",
          accountNumber: generateAccountNumber(),
          routingNumber: ROUTING_NUMBER,
          balanceCents: 0,
          availableCents: 0,
          status: "ACTIVE",
        },
      });

      // Create savings account
      const savingsAccount = await tx.account.create({
        data: {
          userId: user.id,
          accountType: "SAVINGS",
          accountNumber: generateAccountNumber(),
          routingNumber: ROUTING_NUMBER,
          balanceCents: 0,
          availableCents: 0,
          status: "ACTIVE",
          interestRate: 4.5,
        },
      });

      // Create debit card for checking
      await tx.card.create({
        data: {
          userId: user.id,
          accountId: checkingAccount.id,
          cardType: "DEBIT",
          lastFour: Math.floor(1000 + Math.random() * 9000).toString(),
          cardholderName: `${user.firstName} ${user.lastName}`.toUpperCase(),
          expirationMonth: new Date().getMonth() + 1,
          expirationYear: new Date().getFullYear() + 4,
          status: "ACTIVE",
          networkBrand: "VISA",
        },
      });

      // Welcome notification
      await tx.notification.create({
        data: {
          userId: user.id,
          type: "ACCOUNT",
          title: "Welcome to NorthVault Bank",
          message: `Welcome, ${user.firstName}! Your checking and savings accounts have been created. Start your banking journey today.`,
        },
      });

      return { user, checkingAccount, savingsAccount };
    });

    const ipAddress = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    const token = await createSession(
      result.user.id,
      result.user.email,
      result.user.role,
      ipAddress,
      userAgent
    );

    // Update last login
    await prisma.user.update({
      where: { id: result.user.id },
      data: { lastLoginAt: new Date() },
    });

    const response = NextResponse.json(
      {
        message: "Account created successfully",
        user: {
          id: result.user.id,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
          email: result.user.email,
          role: result.user.role,
        },
      },
      { status: 201 }
    );

    response.cookies.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
