import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM = process.env.EMAIL_FROM || "NorthVault Bank <onboarding@resend.dev>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

// ─── Shared HTML wrapper ───────────────────────────────────────────────────
function layout(title: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#1B3A6B,#2a5298);padding:32px 40px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">🏦 NorthVault Bank</h1>
            <p style="margin:4px 0 0;color:#a5bbfc;font-size:12px;letter-spacing:2px;text-transform:uppercase;">Secure Banking</p>
          </td>
        </tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:24px 40px;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#9ca3af;font-size:12px;line-height:1.6;">
              This email was sent by NorthVault Bank · 100 NorthVault Plaza, New York, NY 10001<br/>
              NorthVault Bank is a fictional institution for demonstration purposes only.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(text: string, url: string, color = "#1B3A6B"): string {
  return `<div style="text-align:center;margin:32px 0;">
    <a href="${url}" style="display:inline-block;background:${color};color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">${text}</a>
  </div>`;
}

function heading(text: string): string {
  return `<h2 style="margin:0 0 8px;color:#111827;font-size:22px;font-weight:700;">${text}</h2>`;
}

function para(text: string): string {
  return `<p style="margin:16px 0;color:#374151;font-size:15px;line-height:1.7;">${text}</p>`;
}

function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:10px 12px;color:#6b7280;font-size:13px;border-bottom:1px solid #f3f4f6;">${label}</td>
    <td style="padding:10px 12px;color:#111827;font-size:13px;font-weight:600;border-bottom:1px solid #f3f4f6;">${value}</td>
  </tr>`;
}

function infoTable(rows: [string, string][]): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;margin:20px 0;">
    <tbody>${rows.map(([l, v]) => infoRow(l, v)).join("")}</tbody>
  </table>`;
}

// ─── Send helper ──────────────────────────────────────────────────────────
async function send(to: string, subject: string, html: string): Promise<void> {
  try {
    const { error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) console.error("[Email] Send error:", error);
  } catch (err) {
    console.error("[Email] Unexpected error:", err);
  }
}

// ─── Welcome email ────────────────────────────────────────────────────────
export async function sendWelcomeEmail(params: {
  to: string;
  firstName: string;
  checkingNumber: string;
  savingsNumber: string;
}): Promise<void> {
  const { to, firstName, checkingNumber, savingsNumber } = params;

  const body = `
    ${heading(`Welcome to NorthVault, ${firstName}! 🎉`)}
    ${para("Your accounts are open and ready. Here's a summary of what we've set up for you:")}
    ${infoTable([
      ["Checking Account", `•••• ${checkingNumber.slice(-4)}`],
      ["Savings Account", `•••• ${savingsNumber.slice(-4)}`],
      ["Interest Rate (Savings)", "4.50% APY"],
      ["Monthly Fees", "None"],
    ])}
    ${para("You can start banking right away — transfer money, pay bills, apply for loans, and manage your cards all from your dashboard.")}
    ${btn("Go to My Dashboard", `${APP_URL}/dashboard`)}
    ${para("If you have any questions, our support team is available 24/7 at 1-800-NVAULT-1.")}
    <p style="margin:24px 0 0;color:#9ca3af;font-size:13px;">If you didn't create this account, please contact us immediately.</p>
  `;

  await send(to, "Welcome to NorthVault Bank — Your account is ready", layout("Welcome", body));
}

// ─── Password reset email ─────────────────────────────────────────────────
export async function sendPasswordResetEmail(params: {
  to: string;
  firstName: string;
  resetToken: string;
}): Promise<void> {
  const { to, firstName, resetToken } = params;
  const resetUrl = `${APP_URL}/reset-password?token=${resetToken}`;

  const body = `
    ${heading("Password Reset Request")}
    ${para(`Hi ${firstName}, we received a request to reset your NorthVault Bank password.`)}
    ${para("Click the button below to create a new password. This link expires in <strong>1 hour</strong>.")}
    ${btn("Reset My Password", resetUrl, "#1B3A6B")}
    ${para("If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.")}
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;">⚠️ For your security, never share this link with anyone. NorthVault Bank staff will never ask for this link.</p>
    </div>
  `;

  await send(to, "NorthVault Bank — Reset your password", layout("Password Reset", body));
}

// ─── Transfer status email ────────────────────────────────────────────────
export async function sendTransferStatusEmail(params: {
  to: string;
  firstName: string;
  status: "approved" | "declined";
  amount: number;
  reference: string;
  beneficiaryName?: string;
  adminNote?: string;
}): Promise<void> {
  const { to, firstName, status, amount, reference, beneficiaryName, adminNote } = params;
  const approved = status === "approved";
  const amountStr = `$${(amount / 100).toFixed(2)}`;

  const rows: [string, string][] = [
    ["Reference", reference],
    ["Amount", amountStr],
  ];
  if (beneficiaryName) rows.push(["Recipient", beneficiaryName]);
  if (!approved && adminNote) rows.push(["Reason", adminNote]);

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${approved ? "#d1fae5" : "#fee2e2"};border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">${approved ? "✅" : "❌"}</div>
    </div>
    ${heading(approved ? `Transfer Approved` : `Transfer Declined`)}
    ${para(`Hi ${firstName}, your transfer of <strong>${amountStr}</strong> has been <strong>${approved ? "approved and completed" : "declined"}</strong>.`)}
    ${infoTable(rows)}
    ${approved
      ? para("The funds have been deducted from your account and are on their way to the recipient.")
      : para("No funds have been moved from your account. Please contact support if you have questions.")}
    ${btn("View Transaction", `${APP_URL}/dashboard/accounts`, approved ? "#059669" : "#1B3A6B")}
  `;

  await send(
    to,
    `NorthVault Bank — Transfer ${approved ? "Approved" : "Declined"}: ${amountStr}`,
    layout(`Transfer ${approved ? "Approved" : "Declined"}`, body)
  );
}

// ─── Loan decision email ──────────────────────────────────────────────────
export async function sendLoanDecisionEmail(params: {
  to: string;
  firstName: string;
  approved: boolean;
  loanType: string;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate?: number;
  termMonths?: number;
  monthlyPayment?: number;
  adminNote?: string;
}): Promise<void> {
  const { to, firstName, approved, loanType, requestedAmount, approvedAmount, interestRate, termMonths, monthlyPayment, adminNote } = params;

  const rows: [string, string][] = [
    ["Loan Type", loanType.replace("_", " ")],
    ["Requested Amount", `$${(requestedAmount / 100).toFixed(2)}`],
  ];

  if (approved && approvedAmount) {
    rows.push(["Approved Amount", `$${(approvedAmount / 100).toFixed(2)}`]);
    if (interestRate) rows.push(["Interest Rate", `${interestRate}% APR`]);
    if (termMonths) rows.push(["Term", `${termMonths} months`]);
    if (monthlyPayment) rows.push(["Monthly Payment", `$${(monthlyPayment / 100).toFixed(2)}`]);
  }
  if (!approved && adminNote) rows.push(["Note", adminNote]);

  const body = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="display:inline-block;background:${approved ? "#d1fae5" : "#fee2e2"};border-radius:50%;width:64px;height:64px;line-height:64px;font-size:28px;">${approved ? "🎉" : "📋"}</div>
    </div>
    ${heading(approved ? "Loan Application Approved!" : "Loan Application Update")}
    ${para(`Hi ${firstName}, we have reviewed your ${loanType.replace("_", " ").toLowerCase()} loan application.`)}
    ${infoTable(rows)}
    ${approved
      ? para("Congratulations! Your loan has been approved. Our team will be in touch shortly to finalize the details.")
      : para("Unfortunately, we are unable to approve your loan application at this time. You're welcome to reapply in the future.")}
    ${btn("View My Loans", `${APP_URL}/dashboard/loans`, approved ? "#059669" : "#1B3A6B")}
  `;

  await send(
    to,
    `NorthVault Bank — Loan Application ${approved ? "Approved" : "Update"}`,
    layout(`Loan ${approved ? "Approved" : "Update"}`, body)
  );
}

// ─── Security alert email ─────────────────────────────────────────────────
export async function sendSecurityAlertEmail(params: {
  to: string;
  firstName: string;
  event: string;
  ipAddress?: string;
  timestamp?: string;
}): Promise<void> {
  const { to, firstName, event, ipAddress, timestamp } = params;

  const rows: [string, string][] = [["Event", event]];
  if (ipAddress) rows.push(["IP Address", ipAddress]);
  if (timestamp) rows.push(["Time", timestamp]);

  const body = `
    ${heading("Security Alert")}
    ${para(`Hi ${firstName}, we detected the following security event on your NorthVault account:`)}
    ${infoTable(rows)}
    <div style="background:#fef3c7;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:24px 0;">
      <p style="margin:0;color:#92400e;font-size:13px;">⚠️ If you did not perform this action, please contact us immediately at 1-800-NVAULT-1 or reset your password.</p>
    </div>
    ${btn("Review Account Security", `${APP_URL}/dashboard/settings`)}
  `;

  await send(to, "NorthVault Bank — Security Alert", layout("Security Alert", body));
}
