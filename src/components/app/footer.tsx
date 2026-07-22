"use client";
import { Sparkles, Github, Twitter, Linkedin, Mail, Heart } from "lucide-react";
import { useApp } from "@/lib/store";

export function Footer() {
  const { navigate } = useApp();
  return (
    <footer className="mt-auto border-t border-border/40 bg-card/30">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 pb-24 md:pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="gradient-emerald rounded-xl p-2">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-lg gradient-text">InternGenie</p>
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
                  className="w-9 h-9 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary flex items-center justify-center transition-colors"
                  aria-label="social"
                >
                  <Icon className="w-4 h-4" />
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
              <li><button onClick={() => navigate("home")} className="hover:text-primary transition-colors">Contact</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border/40 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
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
