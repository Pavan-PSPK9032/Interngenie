"use client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Search, Bell, Sun, Moon, Menu, X,
  LayoutDashboard, Briefcase, User as UserIcon, LogOut,
  ChevronDown, Building2, Shield, Heart, Bookmark,
} from "lucide-react";
import { useState } from "react";
import { useApp } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function Navbar() {
  const { user, view, navigate, theme, toggleTheme, logout, notifications, savedInternships } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  const navLinks: { label: string; view: any; icon: any }[] = [
    { label: "Home", view: "home", icon: Sparkles },
    { label: "Internships", view: "internships", icon: Briefcase },
  ];

  // Add role-based links
  if (user?.role === "STUDENT") {
    navLinks.push({ label: "Dashboard", view: "student-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Applications", view: "student-applications", icon: Bookmark });
  } else if (user?.role === "COMPANY") {
    navLinks.push({ label: "Dashboard", view: "company-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Post Internship", view: "company-post-internship", icon: Briefcase });
  } else if (user?.role === "ADMIN") {
    navLinks.push({ label: "Dashboard", view: "admin-dashboard", icon: LayoutDashboard });
    navLinks.push({ label: "Companies", view: "admin-companies", icon: Building2 });
  }

  const handleNav = (v: any) => {
    navigate(v);
    setMobileOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full">
        <div className="glass-strong border-b border-border/40">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo */}
              <button
                onClick={() => handleNav("home")}
                className="flex items-center gap-2.5 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 gradient-emerald rounded-xl blur-md opacity-50 group-hover:opacity-75 transition-opacity" />
                  <div className="relative gradient-emerald rounded-xl p-2 shadow-glow">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                </div>
                <div className="flex flex-col leading-none">
                  <span className="font-bold text-lg gradient-text">InternGenie</span>
                  <span className="text-[10px] text-muted-foreground hidden sm:block">
                    PM Internship Scheme
                  </span>
                </div>
              </button>

              {/* Desktop nav */}
              <nav className="hidden md:flex items-center gap-1">
                {navLinks.map((link) => (
                  <button
                    key={link.view}
                    onClick={() => handleNav(link.view)}
                    className={cn(
                      "relative px-4 py-2 rounded-lg text-sm font-medium transition-all",
                      "hover:bg-accent/50 hover:text-accent-foreground",
                      view === link.view
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    <span className="flex items-center gap-1.5">
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </span>
                    {view === link.view && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute inset-0 bg-primary/10 rounded-lg -z-10"
                        transition={{ type: "spring", duration: 0.5 }}
                      />
                    )}
                  </button>
                ))}
              </nav>

              {/* Right side actions */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-full"
                  aria-label="Toggle theme"
                >
                  <AnimatePresence mode="wait">
                    {theme === "light" ? (
                      <motion.div key="moon" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
                        <Moon className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <motion.div key="sun" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
                        <Sun className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>

                {/* Saved (student) */}
                {user?.role === "STUDENT" && savedInternships.length > 0 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleNav("internships")}
                    className="rounded-full relative hidden sm:flex"
                    aria-label="Saved internships"
                  >
                    <Heart className="w-5 h-5 fill-primary text-primary" />
                    <Badge className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[10px] gradient-emerald text-white">
                      {savedInternships.length}
                    </Badge>
                  </Button>
                )}

                {/* Notifications */}
                {user && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full relative">
                        <Bell className="w-5 h-5" />
                        {unread > 0 && (
                          <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-destructive animate-pulse-glow" />
                        )}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80">
                      <DropdownMenuLabel>Notifications</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.slice(0, 6).map((n) => (
                          <DropdownMenuItem
                            key={n.id}
                            className="flex flex-col items-start py-2 cursor-pointer"
                          >
                            <div className="flex w-full items-start gap-2">
                              <div className={cn(
                                "w-2 h-2 rounded-full mt-1.5 shrink-0",
                                n.read ? "bg-muted" :
                                n.type === "SUCCESS" ? "bg-emerald-500" :
                                n.type === "INTERVIEW" ? "bg-amber-500" :
                                n.type === "WARNING" ? "bg-red-500" : "bg-primary"
                              )} />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium">{n.title}</p>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {n.message}
                                </p>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* User menu */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="rounded-full gap-2 px-2 pr-3 hover:bg-accent/50">
                        <Avatar className="w-8 h-8 gradient-emerald">
                          <AvatarFallback className="text-white text-xs font-semibold">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="hidden sm:block text-sm font-medium">
                          {user.name.split(" ")[0]}
                        </span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground hidden sm:block" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60">
                      <div className="px-2 py-1.5">
                        <p className="text-sm font-semibold">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        <Badge variant="secondary" className="mt-1 text-[10px]">
                          {user.role}
                        </Badge>
                      </div>
                      <DropdownMenuSeparator />
                      {user.role === "STUDENT" && (
                        <>
                          <DropdownMenuItem onClick={() => handleNav("student-profile")}>
                            <UserIcon className="w-4 h-4 mr-2" /> My Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleNav("student-applications")}>
                            <Briefcase className="w-4 h-4 mr-2" /> Applications
                          </DropdownMenuItem>
                        </>
                      )}
                      {user.role === "COMPANY" && (
                        <DropdownMenuItem onClick={() => handleNav("company-applicants")}>
                          <UserIcon className="w-4 h-4 mr-2" /> View Applicants
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => handleNav("admin-companies")}>
                        <Building2 className="w-4 h-4 mr-2" /> Manage {user.role === "ADMIN" ? "Companies" : "Account"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="text-destructive">
                        <LogOut className="w-4 h-4 mr-2" /> Sign out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => handleNav("auth")}
                    className="gradient-emerald text-white hover:opacity-90 shadow-glow rounded-full px-5"
                  >
                    Sign In
                  </Button>
                )}

                {/* Mobile menu toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden rounded-full"
                  onClick={() => setMobileOpen(!mobileOpen)}
                >
                  {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden glass-strong border-b border-border/40"
            >
              <nav className="px-4 py-3 space-y-1">
                {navLinks.map((link) => (
                  <button
                    key={link.view}
                    onClick={() => handleNav(link.view)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                      view === link.view
                        ? "bg-primary/10 text-primary"
                        : "text-foreground hover:bg-accent/50"
                    )}
                  >
                    <link.icon className="w-5 h-5" />
                    {link.label}
                  </button>
                ))}
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>
    </>
  );
}
