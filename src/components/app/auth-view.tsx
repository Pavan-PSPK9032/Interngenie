"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Sparkles, GraduationCap, Building2, Shield, ArrowRight,
  Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

export function AuthView() {
  const { login, navigate, pushToast } = useApp();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("STUDENT");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    companyId: "co_flipkart",
  });

  const roles: { value: Role; label: string; icon: any; desc: string }[] = [
    { value: "STUDENT", label: "Student", icon: GraduationCap, desc: "Find & apply to internships" },
    { value: "COMPANY", label: "Company", icon: Building2, desc: "Post internships & hire talent" },
    { value: "ADMIN", label: "Admin", icon: Shield, desc: "Manage platform & analytics" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, password: form.password }),
        });
        const data = await res.json();
        if (!res.ok) {
          pushToast({ title: "Login failed", message: data.error, type: "error" });
          return;
        }
        login(data.user, data.token);
        pushToast({ title: "Welcome back!", message: `Signed in as ${data.user.name}`, type: "success" });
      } else {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...form, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          pushToast({ title: "Registration failed", message: data.error, type: "error" });
          return;
        }
        login(data.user, data.token);
        pushToast({ title: "Account created!", message: `Welcome, ${data.user.name}!`, type: "success" });
      }
    } catch (err) {
      pushToast({ title: "Error", message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (asRole: Role) => {
    setLoading(true);
    const creds =
      asRole === "STUDENT"
        ? { email: "arjun.sharma@student.edu", password: "student123" }
        : asRole === "COMPANY"
        ? { email: "hr@flipkart.com", password: "company123" }
        : { email: "admin@pm-internship.gov.in", password: "admin123" };
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(creds),
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        pushToast({ title: "Demo login", message: `Signed in as ${data.user.role}`, type: "success" });
      } else {
        pushToast({ title: "Demo login failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Error", message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12 gradient-hero">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-strong shadow-premium border-border/40 overflow-hidden">
          <CardContent className="p-7">
            {/* Header */}
            <div className="text-center mb-6">
              <div className="inline-flex w-14 h-14 rounded-2xl gradient-emerald items-center justify-center mb-3 shadow-glow">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "login" ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "login"
                  ? "Sign in to continue to InternGenie"
                  : "Join 1.2M+ students finding dream internships"}
              </p>
            </div>

            {/* Role switcher (register only) */}
            <AnimatePresence mode="wait">
              {mode === "register" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5"
                >
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    I am a
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {roles.map((r) => (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={cn(
                          "flex flex-col items-center gap-1 p-3 rounded-xl border transition-all",
                          role === r.value
                            ? "border-primary bg-primary/5 shadow-glow"
                            : "border-border hover:border-primary/40"
                        )}
                      >
                        <r.icon className={cn(
                          "w-5 h-5",
                          role === r.value ? "text-primary" : "text-muted-foreground"
                        )} />
                        <span className={cn(
                          "text-xs font-medium",
                          role === r.value ? "text-primary" : "text-muted-foreground"
                        )}>
                          {r.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={submit} className="space-y-4">
              {mode === "register" && (
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Arjun Sharma"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="you@example.com"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPwd ? "text" : "password"}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {mode === "login" && (
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => pushToast({ title: "Reset link sent", message: "Check your email", type: "info" })}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full gradient-emerald text-white shadow-glow rounded-xl h-11 gap-2"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    {mode === "login" ? "Sign In" : "Create Account"}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or quick demo login</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Demo login buttons */}
            <div className="grid grid-cols-3 gap-2">
              {roles.map((r) => (
                <Button
                  key={r.value}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => quickLogin(r.value)}
                  disabled={loading}
                  className="text-xs gap-1.5 h-9"
                >
                  <r.icon className="w-3.5 h-3.5" />
                  {r.label}
                </Button>
              ))}
            </div>

            {/* Mode switch */}
            <p className="text-center text-sm text-muted-foreground mt-6">
              {mode === "login" ? "Don't have an account? " : "Already have an account? "}
              <button
                onClick={() => setMode(mode === "login" ? "register" : "login")}
                className="text-primary font-medium hover:underline"
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </CardContent>
        </Card>

        {/* Features list */}
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[
            { icon: CheckCircle2, label: "Free for students" },
            { icon: CheckCircle2, label: "AI-powered matches" },
            { icon: CheckCircle2, label: "Verified companies" },
          ].map((f, i) => (
            <div
              key={i}
              className="flex items-center gap-1.5 text-xs text-muted-foreground"
            >
              <f.icon className="w-3.5 h-3.5 text-emerald-500" />
              {f.label}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
