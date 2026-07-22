"use client";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ToastContainer() {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="fixed top-20 right-4 z-[100] space-y-2 pointer-events-none">
      <AnimatePresence>
        {toasts.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 100, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, scale: 0.9 }}
            transition={{ type: "spring", duration: 0.4 }}
            className={cn(
              "pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl glass-strong shadow-premium border max-w-sm",
              t.type === "success" && "border-emerald-500/30",
              t.type === "error" && "border-red-500/30",
              t.type === "info" && "border-primary/30"
            )}
          >
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-500" />}
              {t.type === "error" && <XCircle className="w-5 h-5 text-red-500" />}
              {t.type === "info" && <Info className="w-5 h-5 text-primary" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">{t.title}</p>
              {t.message && <p className="text-xs text-muted-foreground mt-0.5">{t.message}</p>}
            </div>
            <button
              onClick={() => dismissToast(t.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
