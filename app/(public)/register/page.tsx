"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Shield, Eye, EyeOff, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY",
];

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    addressLine1: "",
    city: "",
    state: "",
    zipCode: "",
    password: "",
    confirmPassword: "",
  });

  const update = (field: string, value: string) => {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => ({ ...p, [field]: "" }));
  };

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!form.firstName.trim()) errs.firstName = "First name is required";
    if (!form.lastName.trim()) errs.lastName = "Last name is required";
    if (!form.email.trim()) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Invalid email address";
    if (!form.phone.trim()) errs.phone = "Phone number is required";
    return errs;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!form.password) errs.password = "Password is required";
    else if (form.password.length < 8) errs.password = "Must be at least 8 characters";
    else if (!/[A-Z]/.test(form.password)) errs.password = "Must contain an uppercase letter";
    else if (!/[a-z]/.test(form.password)) errs.password = "Must contain a lowercase letter";
    else if (!/[0-9]/.test(form.password)) errs.password = "Must contain a number";
    if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleNext = () => {
    const errs = validateStep1();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.details) {
          const fieldErrors: Record<string, string> = {};
          Object.entries(data.details).forEach(([key, val]) => {
            fieldErrors[key] = Array.isArray(val) ? val[0] : String(val);
          });
          setErrors(fieldErrors);
        } else {
          setErrors({ general: data.error || "Registration failed" });
        }
        return;
      }

      toast({
        type: "success",
        title: "Account created!",
        description: "Welcome to NorthVault Bank.",
      });
      router.push("/dashboard");
    } catch {
      setErrors({ general: "An unexpected error occurred. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    const p = form.password;
    if (!p) return null;
    let strength = 0;
    if (p.length >= 8) strength++;
    if (/[A-Z]/.test(p)) strength++;
    if (/[a-z]/.test(p)) strength++;
    if (/[0-9]/.test(p)) strength++;
    if (/[^A-Za-z0-9]/.test(p)) strength++;
    if (strength <= 2) return { label: "Weak", color: "bg-red-500", width: "w-1/4" };
    if (strength <= 3) return { label: "Fair", color: "bg-amber-500", width: "w-2/4" };
    if (strength <= 4) return { label: "Good", color: "bg-blue-500", width: "w-3/4" };
    return { label: "Strong", color: "bg-green-500", width: "w-full" };
  };

  const pwStrength = passwordStrength();

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-600 shadow-lg">
            <Shield className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Open your account</h1>
          <p className="mt-1.5 text-sm text-gray-500">
            Join NorthVault Bank — takes less than 5 minutes
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex items-center gap-3">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                s < step ? "bg-green-500 text-white" : s === step ? "bg-brand-600 text-white" : "bg-gray-200 text-gray-500"
              }`}>
                {s < step ? <CheckCircle2 className="h-4 w-4" /> : s}
              </div>
              <div className="flex-1 text-xs text-gray-500">
                {s === 1 ? "Personal Info" : "Security"}
              </div>
              {s === 1 && <div className={`h-0.5 flex-1 rounded ${step > 1 ? "bg-brand-600" : "bg-gray-200"}`} />}
            </React.Fragment>
          ))}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-card">
          {errors.general && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errors.general}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="First Name"
                  placeholder="John"
                  value={form.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                  error={errors.firstName}
                  required
                />
                <Input
                  label="Last Name"
                  placeholder="Carter"
                  value={form.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                  error={errors.lastName}
                  required
                />
              </div>
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                error={errors.email}
                required
              />
              <Input
                label="Phone Number"
                type="tel"
                placeholder="(555) 555-5555"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                error={errors.phone}
                required
              />
              <Input
                label="Date of Birth"
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => update("dateOfBirth", e.target.value)}
                error={errors.dateOfBirth}
              />
              <Input
                label="Street Address"
                placeholder="123 Main Street"
                value={form.addressLine1}
                onChange={(e) => update("addressLine1", e.target.value)}
                error={errors.addressLine1}
              />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Input
                    label="City"
                    placeholder="New York"
                    value={form.city}
                    onChange={(e) => update("city", e.target.value)}
                    error={errors.city}
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">State</label>
                  <select
                    value={form.state}
                    onChange={(e) => update("state", e.target.value)}
                    className="h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  >
                    <option value="">--</option>
                    {US_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <Input
                label="ZIP Code"
                placeholder="10001"
                value={form.zipCode}
                onChange={(e) => update("zipCode", e.target.value)}
                error={errors.zipCode}
              />

              <Button onClick={handleNext} className="w-full" size="lg">
                Continue
              </Button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <Input
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Create a strong password"
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                error={errors.password}
                required
                rightElement={
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 hover:text-gray-600">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />

              {pwStrength && (
                <div>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-gray-500">Password strength</span>
                    <span className={`font-medium ${pwStrength.label === "Strong" ? "text-green-600" : pwStrength.label === "Good" ? "text-blue-600" : pwStrength.label === "Fair" ? "text-amber-600" : "text-red-600"}`}>
                      {pwStrength.label}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200">
                    <div className={`h-full rounded-full transition-all ${pwStrength.color} ${pwStrength.width}`} />
                  </div>
                </div>
              )}

              <Input
                label="Confirm Password"
                type={showPassword ? "text" : "password"}
                placeholder="Repeat your password"
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                error={errors.confirmPassword}
                required
              />

              <div className="rounded-lg bg-gray-50 p-4 text-xs text-gray-500 space-y-1">
                {[
                  { check: form.password.length >= 8, text: "At least 8 characters" },
                  { check: /[A-Z]/.test(form.password), text: "One uppercase letter" },
                  { check: /[a-z]/.test(form.password), text: "One lowercase letter" },
                  { check: /[0-9]/.test(form.password), text: "One number" },
                ].map(({ check, text }) => (
                  <div key={text} className={`flex items-center gap-2 ${check ? "text-green-700" : "text-gray-400"}`}>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {text}
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="flex-1"
                  size="lg"
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" loading={loading} size="lg">
                  {loading ? "Creating account..." : "Open Account"}
                </Button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-600 hover:underline">
              Sign in
            </Link>
          </div>
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-xs text-gray-400">
          <Lock className="h-3.5 w-3.5" />
          <span>Your information is encrypted and secure</span>
        </div>
      </div>
    </div>
  );
}
