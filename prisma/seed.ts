import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const ROUTING_NUMBER = "021000021";

function randomCents(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1) + min) * 100;
}

function accountNumber(): string {
  return Math.floor(1000000000 + Math.random() * 9000000000).toString();
}

function cardNum(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

async function main() {
  console.log("🌱 Seeding NorthVault Bank database...");

  // Clear existing data
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.userSession.deleteMany();
  await prisma.passwordReset.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.card.deleteMany();
  await prisma.beneficiary.deleteMany();
  await prisma.loan.deleteMany();
  await prisma.biller.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // ============ ADMIN ============
  const adminHash = await bcrypt.hash("Admin@NorthVault1", 12);
  const admin = await prisma.user.create({
    data: {
      firstName: "Sarah",
      lastName: "Mitchell",
      email: "admin@northvaultbank.com",
      phone: "2125550001",
      passwordHash: adminHash,
      role: "ADMIN",
      status: "ACTIVE",
      lastLoginAt: new Date(),
    },
  });
  console.log("✓ Admin created:", admin.email);

  // ============ CUSTOMER 1 - John Carter ============
  const customer1Hash = await bcrypt.hash("Customer@1234", 12);
  const customer1 = await prisma.user.create({
    data: {
      firstName: "John",
      lastName: "Carter",
      email: "john.carter@example.com",
      phone: "2125550101",
      dateOfBirth: new Date("1985-03-15"),
      addressLine1: "142 Riverside Drive",
      city: "New York",
      state: "NY",
      zipCode: "10024",
      passwordHash: customer1Hash,
      role: "CUSTOMER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 3600000),
    },
  });

  // Accounts for customer 1
  const c1Checking = await prisma.account.create({
    data: {
      userId: customer1.id,
      accountType: "CHECKING",
      accountNumber: accountNumber(),
      routingNumber: ROUTING_NUMBER,
      balanceCents: 1245000,  // $12,450.00
      availableCents: 1245000,
      status: "ACTIVE",
    },
  });

  const c1Savings = await prisma.account.create({
    data: {
      userId: customer1.id,
      accountType: "SAVINGS",
      accountNumber: accountNumber(),
      routingNumber: ROUTING_NUMBER,
      balanceCents: 3250000,  // $32,500.00
      availableCents: 3250000,
      status: "ACTIVE",
      interestRate: 4.5,
    },
  });

  // Card for customer 1
  await prisma.card.create({
    data: {
      userId: customer1.id,
      accountId: c1Checking.id,
      cardType: "DEBIT",
      lastFour: cardNum(),
      cardholderName: "JOHN M CARTER",
      expirationMonth: 9,
      expirationYear: 2028,
      status: "ACTIVE",
      networkBrand: "VISA",
    },
  });

  // Beneficiaries for customer 1
  const ben1 = await prisma.beneficiary.create({
    data: {
      userId: customer1.id,
      name: "Emily Carter",
      accountNumber: "38472918473",
      routingNumber: "021000089",
      bankName: "Chase Bank",
      nickname: "Sister",
      status: "ACTIVE",
    },
  });

  const ben2 = await prisma.beneficiary.create({
    data: {
      userId: customer1.id,
      name: "Metro Property Management",
      accountNumber: "9283746512",
      routingNumber: "021000145",
      bankName: "Wells Fargo",
      nickname: "Landlord",
      status: "ACTIVE",
    },
  });

  // Billers for customer 1
  await prisma.biller.createMany({
    data: [
      { userId: customer1.id, name: "Con Edison", accountRef: "JC-78234", category: "UTILITIES" },
      { userId: customer1.id, name: "Verizon", accountRef: "VZ-99102834", category: "TELECOM" },
      { userId: customer1.id, name: "Progressive Insurance", accountRef: "PI-3847261", category: "INSURANCE" },
    ],
  });

  // Transactions for customer 1 - completed
  const completedTxs = [
    { description: "Direct Deposit - Employer", type: "DEPOSIT" as const, amountCents: 350000 },
    { description: "Transfer to Emily Carter", type: "TRANSFER" as const, amountCents: 50000 },
    { description: "Bill Payment - Con Edison", type: "PAYMENT" as const, amountCents: 12800 },
    { description: "ATM Withdrawal", type: "WITHDRAWAL" as const, amountCents: 20000 },
    { description: "Direct Deposit - Employer", type: "DEPOSIT" as const, amountCents: 350000 },
    { description: "Transfer to Metro Property", type: "TRANSFER" as const, amountCents: 200000 },
    { description: "Bill Payment - Verizon", type: "PAYMENT" as const, amountCents: 8500 },
  ];

  for (const tx of completedTxs) {
    await prisma.transaction.create({
      data: {
        reference: `NVB-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
        accountId: c1Checking.id,
        beneficiaryId: tx.type === "TRANSFER" ? ben1.id : null,
        type: tx.type,
        amountCents: tx.amountCents,
        currency: "USD",
        description: tx.description,
        status: "COMPLETED",
        initiatedBy: customer1.id,
        approvedBy: admin.id,
        completedAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600000),
        createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 3600000),
      },
    });
    await new Promise((r) => setTimeout(r, 1));
  }

  // Pending transaction - the main demo flow
  const pendingTx = await prisma.transaction.create({
    data: {
      reference: "NVB-DEMO01-REVIEW",
      accountId: c1Checking.id,
      beneficiaryId: ben2.id,
      type: "TRANSFER",
      amountCents: 250000,  // $2,500
      currency: "USD",
      description: "Monthly rent payment",
      status: "PENDING",
      initiatedBy: customer1.id,
    },
  });

  // Update available balance to reflect hold
  await prisma.account.update({
    where: { id: c1Checking.id },
    data: { availableCents: { decrement: 250000 } },
  });

  // Notifications for customer 1
  await prisma.notification.createMany({
    data: [
      {
        userId: customer1.id,
        type: "ACCOUNT",
        title: "Welcome to NorthVault Bank",
        message: "Welcome, John! Your checking and savings accounts are ready. Start banking today.",
        read: true,
      },
      {
        userId: customer1.id,
        type: "TRANSFER",
        title: "Transfer Submitted",
        message: "Your transfer of $2,500.00 (ref: NVB-DEMO01-REVIEW) has been submitted and is pending review.",
        read: false,
      },
      {
        userId: customer1.id,
        type: "TRANSACTION",
        title: "Direct Deposit Received",
        message: "A direct deposit of $3,500.00 has been credited to your checking account.",
        read: false,
      },
    ],
  });

  // Loan for customer 1
  await prisma.loan.create({
    data: {
      userId: customer1.id,
      loanType: "PERSONAL",
      requestedCents: 1000000, // $10,000
      termMonths: 36,
      purpose: "Home improvements",
      status: "PENDING",
    },
  });

  console.log("✓ Customer 1 created:", customer1.email);

  // ============ CUSTOMER 2 - Maria Rodriguez ============
  const customer2Hash = await bcrypt.hash("Customer@5678", 12);
  const customer2 = await prisma.user.create({
    data: {
      firstName: "Maria",
      lastName: "Rodriguez",
      email: "maria.rodriguez@example.com",
      phone: "3055550202",
      dateOfBirth: new Date("1990-07-22"),
      addressLine1: "800 Brickell Avenue",
      city: "Miami",
      state: "FL",
      zipCode: "33131",
      passwordHash: customer2Hash,
      role: "CUSTOMER",
      status: "ACTIVE",
      lastLoginAt: new Date(Date.now() - 7200000),
    },
  });

  const c2Checking = await prisma.account.create({
    data: {
      userId: customer2.id,
      accountType: "CHECKING",
      accountNumber: accountNumber(),
      routingNumber: ROUTING_NUMBER,
      balanceCents: 876500,  // $8,765.00
      availableCents: 876500,
      status: "ACTIVE",
    },
  });

  const c2Savings = await prisma.account.create({
    data: {
      userId: customer2.id,
      accountType: "SAVINGS",
      accountNumber: accountNumber(),
      routingNumber: ROUTING_NUMBER,
      balanceCents: 1540000,  // $15,400.00
      availableCents: 1540000,
      status: "ACTIVE",
      interestRate: 4.5,
    },
  });

  await prisma.card.create({
    data: {
      userId: customer2.id,
      accountId: c2Checking.id,
      cardType: "DEBIT",
      lastFour: cardNum(),
      cardholderName: "MARIA A RODRIGUEZ",
      expirationMonth: 5,
      expirationYear: 2027,
      status: "ACTIVE",
      networkBrand: "VISA",
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: customer2.id,
        type: "ACCOUNT",
        title: "Welcome to NorthVault Bank",
        message: "Welcome, Maria! Your accounts are set up and ready to use.",
        read: true,
      },
    ],
  });

  // Loan application for customer 2
  await prisma.loan.create({
    data: {
      userId: customer2.id,
      loanType: "AUTO",
      requestedCents: 2500000, // $25,000
      approvedCents: 2500000,
      interestRate: 5.49,
      termMonths: 60,
      monthlyPayCents: 47800,
      status: "APPROVED",
      purpose: "New car purchase",
    },
  });

  console.log("✓ Customer 2 created:", customer2.email);

  // ============ AUDIT LOGS ============
  await prisma.auditLog.createMany({
    data: [
      {
        adminId: admin.id,
        action: "USER_REGISTERED",
        entityType: "User",
        entityId: customer1.id,
        description: `Customer registered: ${customer1.email}`,
        createdAt: new Date(Date.now() - 86400000 * 7),
      },
      {
        adminId: admin.id,
        action: "USER_REGISTERED",
        entityType: "User",
        entityId: customer2.id,
        description: `Customer registered: ${customer2.email}`,
        createdAt: new Date(Date.now() - 86400000 * 5),
      },
      {
        adminId: admin.id,
        action: "ADMIN_APPROVED_LOAN",
        entityType: "Loan",
        description: `Admin approved AUTO loan for $25,000 for maria.rodriguez@example.com`,
        createdAt: new Date(Date.now() - 86400000 * 3),
      },
    ],
  });

  console.log("✓ Audit logs created");

  console.log("\n✅ Seeding complete!");
  console.log("\n📋 Development Credentials:");
  console.log("================================");
  console.log("ADMIN:");
  console.log("  Email:    admin@northvaultbank.com");
  console.log("  Password: Admin@NorthVault1");
  console.log("\nCUSTOMER 1:");
  console.log("  Email:    john.carter@example.com");
  console.log("  Password: Customer@1234");
  console.log("\nCUSTOMER 2:");
  console.log("  Email:    maria.rodriguez@example.com");
  console.log("  Password: Customer@5678");
  console.log("================================\n");
  console.log("💡 The pending transfer NVB-DEMO01-REVIEW is ready for admin approval!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
