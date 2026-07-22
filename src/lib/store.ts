// Global app state — view router, auth, theme, saved internships, chatbot panel
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role, ViewKey, User, Notification } from "./types";

interface AppState {
  // Routing (single-page app view switcher)
  view: ViewKey;
  selectedInternshipId: string | null;
  selectedApplicantInternshipId: string | null;
  navigate: (view: ViewKey, opts?: { internshipId?: string }) => void;

  // Auth
  user: User | null;
  token: string | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (patch: Partial<User>) => void;

  // Theme
  theme: "light" | "dark";
  toggleTheme: () => void;
  setTheme: (theme: "light" | "dark") => void;

  // Saved internships
  savedInternships: string[];
  toggleSaved: (id: string) => void;

  // Notifications
  notifications: Notification[];
  setNotifications: (n: Notification[]) => void;
  markNotificationRead: (id: string) => void;

  // Chatbot
  chatbotOpen: boolean;
  setChatbotOpen: (open: boolean) => void;

  // Toast (optional fallback)
  toasts: { id: string; title: string; message?: string; type: "info" | "success" | "error" }[];
  pushToast: (t: { title: string; message?: string; type?: "info" | "success" | "error" }) => void;
  dismissToast: (id: string) => void;
}

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      view: "home",
      selectedInternshipId: null,
      selectedApplicantInternshipId: null,
      navigate: (view, opts) =>
        set({
          view,
          selectedInternshipId: opts?.internshipId ?? get().selectedInternshipId,
          selectedApplicantInternshipId: opts?.internshipId ?? get().selectedApplicantInternshipId,
        }),

      user: null,
      token: null,
      login: (user, token) => {
        set({ user, token });
        // Auto-navigate based on role
        const roleDefault: Record<Role, ViewKey> = {
          STUDENT: "student-dashboard",
          COMPANY: "company-dashboard",
          ADMIN: "admin-dashboard",
        };
        set({ view: roleDefault[user.role] });
      },
      logout: () => set({ user: null, token: null, view: "home" }),
      updateUser: (patch) =>
        set((s) => ({ user: s.user ? { ...s.user, ...patch } : null })),

      theme: "light",
      toggleTheme: () =>
        set((s) => ({ theme: s.theme === "light" ? "dark" : "light" })),
      setTheme: (theme) => set({ theme }),

      savedInternships: [],
      toggleSaved: (id) =>
        set((s) => ({
          savedInternships: s.savedInternships.includes(id)
            ? s.savedInternships.filter((x) => x !== id)
            : [...s.savedInternships, id],
        })),

      notifications: [],
      setNotifications: (notifications) => set({ notifications }),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),

      chatbotOpen: false,
      setChatbotOpen: (chatbotOpen) => set({ chatbotOpen }),

      toasts: [],
      pushToast: (t) => {
        const id = Math.random().toString(36).slice(2);
        set((s) => ({
          toasts: [
            ...s.toasts,
            { id, type: t.type || "info", title: t.title, message: t.message },
          ],
        }));
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) }));
        }, 4000);
      },
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
    }),
    {
      name: "pm-internship-app",
      partialize: (s) => ({
        user: s.user,
        token: s.token,
        theme: s.theme,
        savedInternships: s.savedInternships,
      }),
    }
  )
);
