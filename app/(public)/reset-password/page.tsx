"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Shield, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const token = searchParams.get("token");

  const [form, setForm] = useState({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-600">Invalid reset link. Please request a new one.</p>
        <Link href="/forgot-password" className="mt-4 inline-block text-brand-600 hover:underline">
          Request new link
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Must be at least 8 characters";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, ...form }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrors({ general: data.error });
        return;
      }
      toast({ type: "success", title: "Password reset!", description: "Please sign in with your new password." });
      router.push("/login");
    } catch {
      setErrors({ general: "Reset failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      {errors.general && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errors.general}
        </div>
      )}
      <Input
        label="New Password"
        type={showPassword ? "text" : "password"}
        placeholder="Create a strong password"
        value={form.password}
        onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
        error={errors.password}
        required
        rightElement={
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        }
      />
      <Input
        label="Confirm New Password"
        type={showPassword ? "text" : "password"}
        placeholder="Repeat your password"
        value={form.confirmPassword}
        onChange={(e) => setForm((p) => ({ ...p, confirmPassword: e.target.value }))}
        error={errors.confirmPassword}
        required
      />
      <div className="rounded-lg bg-gray-50 p-3 text-xs space-y-1">
        {[
          { check: form.password.length >= 8, text: "At least 8 characters" },
          { check: /[A-Z]/.test(form.password), text: "One uppercase letter" },
          { check: /[0-9]/.test(form.password), text: "One number" },
        ].map(({ check, text }) => (
          <div key={text} className={`flex items-center gap-2 ${check ? "text-green-700" : "text-gray-400"}`}>
            <CheckCircle2 className="h-3.5 w-3.5" />
            {text}
          </div>
        ))}
      </div>
      <Button type="submit" className="w-full" loading={loading} size="lg">
        {loading ? "Resetting..." : "Reset Password"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create new password</h1>
          <p className="mt-1.5 text-sm text-gray-500">Your new password must be different from previous passwords.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          <Suspense fallback={<p className="text-center text-gray-500">Loading...</p>}>
            <ResetPasswordForm />
          </Suspense>
          <div className="mt-6 text-center text-sm text-gray-500">
            Remember your password?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
