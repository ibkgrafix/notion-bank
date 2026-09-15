import * as React from "react";
import { cn } from "@/lib/utils";

type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-brand-100 text-brand-700 border-brand-200",
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  neutral: "bg-gray-100 text-gray-600 border-gray-200",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-brand-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
  info: "bg-blue-500",
  neutral: "bg-gray-400",
};

function Badge({
  className,
  variant = "default",
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          className={cn("h-1.5 w-1.5 rounded-full", dotColors[variant])}
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}

export function getTransactionStatusVariant(
  status: string
): BadgeVariant {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "PENDING":
      return "warning";
    case "DECLINED":
    case "FAILED":
    case "CANCELLED":
      return "danger";
    case "APPROVED":
      return "info";
    default:
      return "neutral";
  }
}

export function getAccountStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "FROZEN":
      return "warning";
    case "CLOSED":
    case "SUSPENDED":
    case "LOCKED":
      return "danger";
    case "PENDING":
      return "info";
    default:
      return "neutral";
  }
}

export function getLoanStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "PAID_OFF":
      return "success";
    case "PENDING":
      return "warning";
    case "APPROVED":
      return "info";
    case "DECLINED":
    case "DEFAULTED":
      return "danger";
    default:
      return "neutral";
  }
}

export function getCardStatusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
      return "success";
    case "FROZEN":
      return "warning";
    case "BLOCKED":
    case "EXPIRED":
      return "danger";
    case "PENDING":
      return "info";
    default:
      return "neutral";
  }
}

export { Badge };
