"use client";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Mail, Lock, Loader2, ArrowLeft, KeyRound } from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function ForgotPassword() {
  const { navigate, pushToast } = useApp();
  const [mode, setMode] = useState<"request" | "reset">("request");
  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("token");
      if (t) {
        setToken(t);
        setMode("reset");
      }
    }
  }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ title: "Error", message: data.error || "Something went wrong", type: "error" });
        return;
      }
      setSuccess(true);
      pushToast({ title: "Email sent", message: "Check your inbox for the reset link", type: "success" });
    } catch {
      pushToast({ title: "Error", message: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      pushToast({ title: "Error", message: "Passwords do not match", type: "error" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        pushToast({ title: "Error", message: data.error || "Something went wrong", type: "error" });
        return;
      }
      pushToast({ title: "Password reset", message: "You can now sign in with your new password", type: "success" });
      navigate("auth");
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
            <div className="text-center mb-6">
              <div className="inline-flex w-14 h-14 rounded-2xl gradient-emerald items-center justify-center mb-3 shadow-glow">
                <KeyRound className="w-7 h-7 text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">
                {mode === "request" ? "Forgot password?" : "Reset password"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {mode === "request"
                  ? "Enter your email and we will send you a reset link"
                  : "Enter your new password below"}
              </p>
            </div>

            {mode === "request" && !success ? (
              <form onSubmit={handleRequest} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-emerald text-white shadow-glow rounded-xl h-11 gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Send Reset Link"
                  )}
                </Button>
              </form>
            ) : mode === "request" && success ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">
                  If an account exists with <strong>{email}</strong>, you will receive a password reset email shortly.
                </p>
                <Button
                  variant="outline"
                  onClick={() => navigate("auth")}
                  className="gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Sign In
                </Button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="new-password">New Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="new-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm new password"
                      className="pl-9"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full gradient-emerald text-white shadow-glow rounded-xl h-11 gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Reset Password"
                  )}
                </Button>
              </form>
            )}

            <div className="text-center mt-6">
              <button
                onClick={() => navigate("auth")}
                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to Sign In
              </button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
