"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, Share2, QrCode, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ShareProfileModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { user } = useApp();
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const username = user?.username || user?.id;
  const profileUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/profile/${username || ""}`
      : `/profile/${username || ""}`;

  if (!open || !user) return null;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
    } catch {
      const el = document.createElement("textarea");
      el.value = profileUrl;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const nativeShare = async () => {
    const shareData = { title: `${user.name} | InternGenie`, text: `Check out my profile on InternGenie`, url: profileUrl };
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share(shareData);
      } catch { /* user cancelled */ }
    } else {
      await copyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md glass-card border-white/10 shadow-premium rounded-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            <h3 className="text-base font-bold">Share Profile</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-lg p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-xs text-muted-foreground">
            Anyone with this link can view your public profile{user.privacySettings?.visibility !== "public" ? " (while it remains public)" : ""}.
          </p>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={profileUrl} readOnly className="pl-9 text-xs font-mono" />
            </div>
            <Button variant="outline" size="icon" onClick={copyLink} title="Copy link">
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>

          {copied && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xs text-emerald-500 flex items-center gap-1"
            >
              <Check className="w-3 h-3" /> Link copied to clipboard
            </motion.p>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={nativeShare} className="gap-2 text-xs">
              <Share2 className="w-4 h-4" /> Share
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowQr((v) => !v)}
              className={cn("gap-2 text-xs", showQr && "border-primary/50 text-primary")}
            >
              <QrCode className="w-4 h-4" /> {showQr ? "Hide QR" : "QR Code"}
            </Button>
          </div>

          {showQr && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(profileUrl)}`}
                alt="Profile QR code"
                width={220}
                height={220}
                className="rounded-xl"
              />
              <p className="text-xs text-muted-foreground">Scan to open profile</p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
