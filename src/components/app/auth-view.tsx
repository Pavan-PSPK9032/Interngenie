"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useCallback } from "react";
import {
  Sparkles, GraduationCap, Building2, ArrowRight,
  Mail, Lock, User as UserIcon, Eye, EyeOff, Loader2, CheckCircle2,
  Zap, Target, Users,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { Role } from "@/lib/types";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          prompt: (callback?: (notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          renderButton: (element: HTMLElement, config: {
            type: "standard" | "icon";
            theme?: "outline" | "filled_blue" | "filled_blue";
            size?: "large" | "medium" | "small";
            text?: "signin_with" | "signup_with" | "continue_with" | "signin";
            shape?: "rectangular" | "pill" | "circle" | "square";
            width?: number;
            logo_alignment?: "left" | "center";
          }) => void;
        };
      };
    };
  }
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function AuthView() {
  const { login, navigate, pushToast } = useApp();
  const [activeTab, setActiveTab] = useState<"signin" | "signup">("signin");
  const [role, setRole] = useState<Role>("STUDENT");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);
  const [googleScriptLoaded, setGoogleScriptLoaded] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const rawGoogleId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  const isValidGoogleId = rawGoogleId && !rawGoogleId.startsWith("your-") && rawGoogleId.endsWith(".apps.googleusercontent.com") && rawGoogleId.length > 40;
  const GOOGLE_CLIENT_ID = isValidGoogleId ? rawGoogleId : "";

  const roles: { value: Role; label: string; icon: typeof GraduationCap; desc: string }[] = [
    { value: "STUDENT", label: "Student", icon: GraduationCap, desc: "Find & apply to internships" },
    { value: "COMPANY", label: "Company", icon: Building2, desc: "Post internships & hire talent" },
  ];

  const features = [
    { icon: Zap, text: "AI-powered internship matching" },
    { icon: Target, text: "Personalized career recommendations" },
    { icon: Users, text: "1.2M+ students & 12,500+ companies" },
  ];

  const handleCredentialResponse = useCallback(
    async (response: { credential: string }) => {
      const payload = decodeJwtPayload(response.credential);
      if (!payload) {
        pushToast({ title: "Google sign-in failed", message: "Could not decode Google response", type: "error" });
        return;
      }

      const email = payload.email as string;
      const name = payload.name as string;
      const picture = payload.picture as string | undefined;
      const sub = payload.sub as string;

      setGoogleLoading(true);
      try {
        const res = await fetch("/api/auth/google-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, name, avatarUrl: picture, googleId: sub }),
        });
        const data = await res.json();
        if (!res.ok) {
          pushToast({ title: "Google sign-in failed", message: data.error, type: "error" });
          return;
        }
        login(data.user, data.token);
        pushToast({ title: "Welcome!", message: `Signed in as ${data.user.name}`, type: "success" });
      } catch {
        pushToast({ title: "Error", message: "Network error", type: "error" });
      } finally {
        setGoogleLoading(false);
      }
    },
    [login, pushToast]
  );

  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) {
      setGoogleScriptLoaded(false);
      return;
    }

    if (window.google) {
      setGoogleScriptLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => setGoogleScriptLoaded(true);
    script.onerror = () => setGoogleScriptLoaded(false);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, [GOOGLE_CLIENT_ID]);

  useEffect(() => {
    if (!googleScriptLoaded || !GOOGLE_CLIENT_ID || !window.google) return;

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      setGoogleReady(true);
    } catch {
      setGoogleReady(false);
    }
  }, [googleScriptLoaded, GOOGLE_CLIENT_ID, handleCredentialResponse]);

  const triggerGoogleSignIn = () => {
    if (!googleReady || !window.google) return;
    setGoogleLoading(true);

    const timeout = setTimeout(() => {
      setGoogleLoading(false);
    }, 8000);

    window.google.accounts.id.prompt((notification) => {
      clearTimeout(timeout);
      if (!notification) return;
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setGoogleLoading(false);
      }
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (activeTab === "signin") {
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
          body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role }),
        });
        const data = await res.json();
        if (!res.ok) {
          pushToast({ title: "Registration failed", message: data.error, type: "error" });
          return;
        }
        login(data.user, data.token);
        pushToast({ title: "Account created!", message: `Welcome, ${data.user.name}!`, type: "success" });
      }
    } catch {
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
        : { email: "hr@flipkart.com", password: "company123" };
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
    <div className="min-h-[calc(100vh-4rem)] flex items-stretch">
      {/* LEFT: Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(255,255,255,0.12),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(0,0,0,0.15),transparent_50%)]" />

        <div className="relative z-10 flex flex-col justify-center px-12 xl:px-16 w-full">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">InternGenie</span>
            </div>

            <h1 className="text-4xl xl:text-5xl font-bold text-white leading-tight mb-4">
              AI-Powered
              <br />
              Internship Platform
            </h1>

            <p className="text-lg text-emerald-100/80 mb-10 max-w-md leading-relaxed">
              Discover your perfect internship with intelligent recommendations tailored to your skills, interests, and career goals.
            </p>

            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.text}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.15 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/15">
                    <f.icon className="w-5 h-5 text-emerald-200" />
                  </div>
                  <span className="text-sm font-medium text-white/90">{f.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 sm:px-8 py-12 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-2xl gradient-emerald flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">InternGenie</span>
          </div>

          {/* Tab toggle */}
          <div className="flex bg-muted rounded-xl p-1 mb-6">
            {(["signin", "signup"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === tab
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {tab === "signin" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <Card className="glass-strong shadow-premium border-border/40 overflow-hidden">
            <CardContent className="p-7">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: activeTab === "signin" ? -10 : 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: activeTab === "signin" ? 10 : -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <form onSubmit={submit} className="space-y-4">
                    {activeTab === "signup" && (
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
                          placeholder={activeTab === "signup" ? "Create a password" : "Enter your password"}
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

                    {activeTab === "signin" && (
                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => navigate("forgot-password")}
                          className="text-xs text-primary hover:underline"
                        >
                          Forgot password?
                        </button>
                      </div>
                    )}

                    {activeTab === "signup" && (
                      <div className="space-y-2">
                        <Label className="text-xs text-muted-foreground">I am a</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {roles.map((r) => (
                            <button
                              key={r.value}
                              type="button"
                              onClick={() => setRole(r.value)}
                              className={cn(
                                "flex items-center gap-2.5 p-3 rounded-xl border transition-all text-left",
                                role === r.value
                                  ? "border-primary bg-primary/5 shadow-glow"
                                  : "border-border hover:border-primary/40"
                              )}
                            >
                              <r.icon
                                className={cn(
                                  "w-5 h-5 shrink-0",
                                  role === r.value ? "text-primary" : "text-muted-foreground"
                                )}
                              />
                              <div>
                                <span
                                  className={cn(
                                    "text-sm font-medium block",
                                    role === r.value ? "text-primary" : "text-foreground"
                                  )}
                                >
                                  {r.label}
                                </span>
                                <span className="text-[11px] text-muted-foreground leading-tight">{r.desc}</span>
                              </div>
                            </button>
                          ))}
                        </div>
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
                          {activeTab === "signin" ? "Sign In" : "Create Account"}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>

                  {/* Divider */}
                  <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <div className="flex-1 h-px bg-border" />
                  </div>

                  {/* Google button */}
                  {googleReady ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={triggerGoogleSignIn}
                      disabled={loading || googleLoading}
                      className="w-full h-11 gap-3 bg-white text-gray-700 border-gray-300 hover:bg-gray-50 dark:bg-white dark:text-gray-700 dark:border-gray-300 rounded-xl font-medium text-sm"
                    >
                      {googleLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                      )}
                      Continue with Google
                    </Button>
                  ) : (
                    <div className="w-full h-11 flex items-center justify-center rounded-xl border border-dashed border-border bg-muted/30 text-muted-foreground text-xs">
                      Google Sign-In is not configured. Use email/password instead.
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* Demo login section */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">quick demo</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
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
                  Demo {r.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Bottom features */}
          <div className="mt-6 flex items-center justify-center gap-5">
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
    </div>
  );
}
