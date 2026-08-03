"use client";
import { Sparkles, Github, Twitter, Linkedin, Mail, Heart, Bot } from "lucide-react";
import { useApp } from "@/lib/store";

export function Footer() {
  const { navigate, setChatbotOpen } = useApp();
  return (
    <footer className="relative mt-12 overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] gradient-hero blur-3xl opacity-30 pointer-events-none" />
      <div className="relative mx-auto max-w-[1500px] px-4 sm:px-6 lg:px-8 py-12 pb-28 md:pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="relative">
                <div className="absolute inset-0 gradient-primary rounded-xl blur-md opacity-60" />
                <div className="relative gradient-primary rounded-xl p-2 shadow-glow">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <p className="font-bold text-lg gradient-text tracking-tight">InternGenie</p>
                <p className="text-xs text-muted-foreground">PM Internship Scheme</p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-md">
              AI-powered internship recommendations connecting 1.2M+ Indian students
              with 12,500+ companies. Built under the PM Internship Scheme to empower
              youth with industry-ready skills and opportunities.
            </p>
            <div className="flex items-center gap-3 mt-4">
              {[Github, Twitter, Linkedin, Mail].map((Icon, i) => (
                <button
                  key={i}
                  className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/10 hover:text-primary hover:-translate-y-0.5 transition-all shadow-glow"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4 mx-auto" />
                </button>
              ))}
            </div>
          </div>

          {/* For Students */}
          <div>
            <p className="font-semibold text-sm mb-3">For Students</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => navigate("internships")} className="hover:text-primary transition-colors">
                  Browse Internships
                </button>
              </li>
              <li>
                <button onClick={() => navigate("auth")} className="hover:text-primary transition-colors">
                  Sign Up
                </button>
              </li>
              <li>
                <button onClick={() => navigate("home")} className="hover:text-primary transition-colors">
                  AI Resume Builder
                </button>
              </li>
              <li>
                <button onClick={() => navigate("home")} className="hover:text-primary transition-colors">
                  Career Guidance
                </button>
              </li>
            </ul>
          </div>

          {/* For Companies */}
          <div>
            <p className="font-semibold text-sm mb-3">For Companies</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <button onClick={() => navigate("auth")} className="hover:text-primary transition-colors">
                  Post Internship
                </button>
              </li>
              <li>
                <button onClick={() => navigate("auth")} className="hover:text-primary transition-colors">
                  Company Login
                </button>
              </li>
              <li>
                <button onClick={() => navigate("home")} className="hover:text-primary transition-colors">
                  Pricing
                </button>
              </li>
              <li>
                <button onClick={() => navigate("home")} className="hover:text-primary transition-colors">
                  Success Stories
                </button>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <p className="font-semibold text-sm mb-3">Resources</p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><button onClick={() => navigate("home")} className="hover:text-primary transition-colors">Help Center</button></li>
              <li><button onClick={() => navigate("home")} className="hover:text-primary transition-colors">Privacy Policy</button></li>
              <li><button onClick={() => navigate("home")} className="hover:text-primary transition-colors">Terms of Service</button></li>
              <li><button onClick={() => setChatbotOpen(true)} className="hover:text-primary transition-colors flex items-center gap-1.5"><Bot className="w-3.5 h-3.5 text-cyan-400" /> AI Assistant</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/[0.06] mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            © 2026 InternGenie. Government of India — PM Internship Scheme.
          </p>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
            Made with <Heart className="w-3 h-3 fill-red-500 text-red-500" /> for Indian youth
          </p>
        </div>
      </div>
    </footer>
  );
}
