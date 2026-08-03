"use client";
import { useMemo } from "react";
import { motion } from "framer-motion";

const ORBS = [
  { className: "orb orb-indigo", size: 420, top: "-8%", left: "-6%", delay: 0 },
  { className: "orb orb-cyan", size: 360, top: "12%", left: "62%", delay: 2.5 },
  { className: "orb orb-violet", size: 460, top: "55%", left: "72%", delay: 1.2 },
  { className: "orb orb-indigo", size: 300, top: "70%", left: "4%", delay: 3.8 },
  { className: "orb orb-cyan", size: 260, top: "-12%", left: "38%", delay: 5 },
];

export function AnimatedBackground() {
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        left: `${(i * 37) % 100}%`,
        top: `${(i * 53 + 11) % 100}%`,
        size: 2 + ((i * 7) % 3),
        duration: 8 + ((i * 3) % 9),
        delay: (i * 1.7) % 10,
      })),
    []
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="absolute inset-0 aurora-bg" />
      <div className="absolute inset-0 grid-pattern opacity-60" />
      {ORBS.map((orb, i) => (
        <motion.div
          key={i}
          className={`orb ${orb.className}`}
          style={{ width: orb.size, height: orb.size, top: orb.top, left: orb.left }}
          animate={{ x: [0, 30, -25, 0], y: [0, -35, 20, 0], scale: [1, 1.08, 0.96, 1] }}
          transition={{ duration: 16 + i * 2, repeat: Infinity, ease: "easeInOut", delay: orb.delay }}
        />
      ))}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          className="absolute rounded-full bg-white/25"
          style={{ left: p.left, top: p.top, width: p.size, height: p.size }}
          animate={{ y: [0, -38, 0], opacity: [0.15, 0.7, 0.15] }}
          transition={{ duration: p.duration, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
        />
      ))}
      <div className="absolute inset-0 noise opacity-70" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-background to-transparent" />
    </div>
  );
}
