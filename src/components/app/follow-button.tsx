"use client";
import { useState } from "react";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";

export function FollowButton({
  userId,
  initialFollowing = false,
  onFollowChange,
  size = "sm",
}: {
  userId: string;
  initialFollowing?: boolean;
  onFollowChange?: (following: boolean, followersCount: number) => void;
  size?: "sm" | "md";
}) {
  const { user, token, pushToast } = useApp();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!user) {
      pushToast({ title: "Sign in required", message: "Login to follow students", type: "info" });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/profile/follow/${userId}`, {
        method: following ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setFollowing(data.following);
        onFollowChange?.(data.following, data.followersCount);
        pushToast({
          title: data.following ? "Following" : "Unfollowed",
          message: data.following ? "You'll see updates from this student" : undefined,
          type: "success",
        });
      } else {
        pushToast({ title: "Failed", message: data.error, type: "error" });
      }
    } catch {
      pushToast({ title: "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={toggle}
      disabled={loading || !user || user.id === userId}
      size={size}
      className={cn(
        "gap-1.5 transition-all",
        following
          ? "bg-white/[0.06] text-foreground border border-white/10 hover:bg-white/[0.1]"
          : "gradient-primary text-white shadow-glow hover:opacity-90"
      )}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : following ? (
        <UserCheck className="w-4 h-4" />
      ) : (
        <UserPlus className="w-4 h-4" />
      )}
      {following ? "Following" : "Follow"}
    </Button>
  );
}
