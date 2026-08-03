"use client";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { X, RotateCcw, ZoomIn, ZoomOut, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProfileImageEditorProps {
  open: boolean;
  src: string;
  aspect: number; // width / height of the crop window
  shape?: "circle" | "rect";
  title?: string;
  onClose: () => void;
  onSave: (dataUrl: string) => void;
}

export function ProfileImageEditor({
  open,
  src,
  aspect,
  shape = "circle",
  title = "Edit Image",
  onClose,
  onSave,
}: ProfileImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [imgSize, setImgSize] = useState({ w: 0, h: 0 });
  const [loaded, setLoaded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [saving, setSaving] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; panX: number; panY: number } | null>(null);

  const outW = 600;
  const outH = Math.round(600 / aspect);

  useEffect(() => {
    if (!open) return;
    setLoaded(false);
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgSize({ w: img.naturalWidth, h: img.naturalHeight });
      setLoaded(true);
    };
    img.src = src;
  }, [open, src]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img || !loaded) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = outW;
    canvas.height = outH;

    ctx.clearRect(0, 0, outW, outH);
    const safeScale = 1.2;
    const baseScale =
      Math.max(outW / img.naturalWidth, outH / img.naturalHeight) * safeScale;
    const scale = baseScale * zoom;

    ctx.save();
    ctx.translate(outW / 2 + pan.x, outH / 2 + pan.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -img.naturalWidth / 2, -img.naturalHeight / 2, img.naturalWidth, img.naturalHeight);
    ctx.restore();

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }, [loaded, zoom, rotation, pan, shape, outW, outH]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, panX: pan.x, panY: pan.y };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPan({ x: dragRef.current.panX + dx, y: dragRef.current.panY + dy });
  };

  const onPointerUp = () => {
    dragRef.current = null;
  };

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setSaving(true);
    const dataUrl = shape === "circle"
      ? canvas.toDataURL("image/png")
      : canvas.toDataURL("image/jpeg", 0.92);
    setTimeout(() => {
      setSaving(false);
      onSave(dataUrl);
    }, 120);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg glass-card border-white/10 shadow-premium rounded-3xl overflow-hidden"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <h3 className="text-base font-bold">{title}</h3>
            <p className="text-xs text-muted-foreground">Crop, zoom, rotate &amp; reposition</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground rounded-lg p-1.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div
            className="relative mx-auto overflow-hidden rounded-2xl border border-white/10 bg-black/40 touch-none"
            style={{ aspectRatio: `${aspect} / 1` }}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
          >
            <canvas ref={canvasRef} className="w-full h-full block select-none" />
            <div className="absolute inset-0 pointer-events-none grid grid-cols-3 grid-rows-3 rounded-2xl">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="border border-white/10" />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-indigo-500"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground shrink-0" />
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r - 90)}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Rotate -90°
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((r) => r + 90)}
              className="gap-1.5 text-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 rotate-180" /> Rotate +90°
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/10">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!loaded || saving}
            className={cn("gradient-primary text-white gap-1.5 shadow-glow")}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Apply
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
