import { z } from "zod";

export const registerSchema = z
  .object({
    firstName: z
      .string()
      .min(2, "First name must be at least 2 characters")
      .max(50),
    lastName: z
      .string()
      .min(2, "Last name must be at least 2 characters")
      .max(50),
    email: z.string().email("Invalid email address"),
    phone: z
      .string()
      .regex(/^\+?[\d\s\-()]{10,}$/, "Invalid phone number")
      .optional()
      .or(z.literal("")),
    dateOfBirth: z.string().optional(),
    addressLine1: z.string().max(100).optional().or(z.literal("")),
    city: z.string().max(50).optional().or(z.literal("")),
    state: z.string().max(2).optional().or(z.literal("")),
    zipCode: z
      .string()
      .regex(/^\d{5}(-\d{4})?$/, "Invalid ZIP code")
      .optional()
      .or(z.literal("")),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[a-z]/, "Password must contain at least one lowercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Must contain at least one uppercase letter")
      .regex(/[a-z]/, "Must contain at least one lowercase letter")
      .regex(/[0-9]/, "Must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const transferSchema = z.object({
  sourceAccountId: z.string().min(1, "Source account is required"),
  beneficiaryId: z.string().min(1, "Beneficiary is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
  description: z.string().max(200).optional(),
});

export const beneficiarySchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  accountNumber: z
    .string()
    .regex(/^\d{8,17}$/, "Account number must be 8-17 digits"),
  routingNumber: z
    .string()
    .regex(/^\d{9}$/, "Routing number must be exactly 9 digits"),
  bankName: z.string().min(2, "Bank name is required").max(100),
  nickname: z.string().max(50).optional().or(z.literal("")),
});

export const loanApplicationSchema = z.object({
  loanType: z.enum([
    "PERSONAL",
    "AUTO",
    "MORTGAGE",
    "STUDENT",
    "BUSINESS",
    "LINE_OF_CREDIT",
  ]),
  requestedAmount: z
    .string()
    .regex(/^\d+(\.\d{1,2})?$/, "Invalid amount")
    .refine((v) => parseFloat(v) >= 1000, "Minimum loan amount is $1,000")
    .refine(
      (v) => parseFloat(v) <= 500000,
      "Maximum loan amount is $500,000"
    ),
  termMonths: z.number().min(6).max(360),
  purpose: z.string().max(500).optional(),
});

export const adminDeclineSchema = z.object({
  transactionId: z.string().min(1),
  adminNote: z.string().max(500).optional(),
});

export const adminApproveSchema = z.object({
  transactionId: z.string().min(1),
});

export const billPaymentSchema = z.object({
  billerId: z.string().min(1, "Biller is required"),
  sourceAccountId: z.string().min(1, "Source account is required"),
  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount"),
  description: z.string().max(200).optional(),
});

export const addBillerSchema = z.object({
  name: z.string().min(2).max(100),
  accountRef: z.string().min(1).max(50),
  category: z.string().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type TransferInput = z.infer<typeof transferSchema>;
export type BeneficiaryInput = z.infer<typeof beneficiarySchema>;
export type LoanApplicationInput = z.infer<typeof loanApplicationSchema>;
