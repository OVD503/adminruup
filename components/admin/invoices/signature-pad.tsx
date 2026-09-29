"use client";

import { useEffect, useRef, useState } from "react";
import { PenLine, RotateCcw, Save, Upload, X, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignaturePadProps = {
  value?: string | null;
  onChange: (value: string | null) => void;
  label?: string;
};

type Mode = "draw" | "upload";

export function SignaturePad({ value, onChange, label = "Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [hasInk, setHasInk] = useState(Boolean(value));
  const [mode, setMode] = useState<Mode>("draw");
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);

  // Initialise / refresh the canvas whenever we are in draw mode
  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0f172a";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (value && !uploadPreview) {
      const image = new window.Image();
      image.onload = () => ctx.drawImage(image, 0, 0, rect.width, rect.height);
      image.src = value;
    }
  }, [mode, value, uploadPreview]);

  // ─── Draw helpers ──────────────────────────────────────────────────────────
  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function begin(event: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setHasInk(true);
  }

  function end() {
    drawingRef.current = false;
  }

  function clearDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    setHasInk(false);
    onChange(null);
  }

  function saveDraw() {
    if (!canvasRef.current || !hasInk) return onChange(null);
    onChange(canvasRef.current.toDataURL("image/png"));
  }

  // ─── Upload helpers ────────────────────────────────────────────────────────
  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadPreview(dataUrl);
      onChange(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  function clearUpload() {
    setUploadPreview(null);
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // ─── Mode switch ───────────────────────────────────────────────────────────
  function switchMode(next: Mode) {
    if (next === mode) return;
    onChange(null);
    setHasInk(false);
    setUploadPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setMode(next);
  }

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <PenLine className="h-4 w-4" />
          {label}
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-md border border-slate-200 overflow-hidden text-xs font-medium">
          <button
            type="button"
            onClick={() => switchMode("draw")}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors ${
              mode === "draw"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <PenLine className="h-3 w-3" />
            Draw
          </button>
          <button
            type="button"
            onClick={() => switchMode("upload")}
            className={`px-3 py-1.5 flex items-center gap-1.5 transition-colors border-l border-slate-200 ${
              mode === "upload"
                ? "bg-slate-800 text-white"
                : "bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            <ImagePlus className="h-3 w-3" />
            Upload Photo
          </button>
        </div>
      </div>

      {/* ── Draw mode ───────────────────────────────────────────────────────── */}
      {mode === "draw" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Sign directly in the box below using a stylus or finger.
          </p>
          <canvas
            ref={canvasRef}
            className="h-40 w-full touch-none rounded-md border border-slate-200 bg-white shadow-inner"
            onPointerDown={begin}
            onPointerMove={draw}
            onPointerUp={end}
            onPointerCancel={end}
            aria-label={label}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={clearDraw}>
              <RotateCcw className="h-4 w-4" />
              Clear
            </Button>
            <Button type="button" size="sm" onClick={saveDraw}>
              <Save className="h-4 w-4" />
              Save / Use
            </Button>
          </div>
        </div>
      )}

      {/* ── Upload mode ─────────────────────────────────────────────────────── */}
      {mode === "upload" && (
        <div className="space-y-2">
          <p className="text-xs text-slate-500">
            Sign on paper, take a photo, and upload it here.
          </p>

          {uploadPreview ? (
            <div className="relative rounded-md border border-slate-200 bg-white shadow-inner h-40 flex items-center justify-center overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={uploadPreview}
                alt="Customer signature"
                className="max-h-full max-w-full object-contain"
              />
              <button
                type="button"
                onClick={clearUpload}
                className="absolute top-2 right-2 rounded-full bg-white border border-slate-200 shadow p-1 hover:bg-red-50 transition-colors"
                aria-label="Remove photo"
              >
                <X className="h-4 w-4 text-slate-600" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center h-40 w-full rounded-md border-2 border-dashed border-slate-300 bg-slate-50 cursor-pointer hover:bg-slate-100 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 mb-2" />
              <span className="text-sm font-medium text-slate-600">Click to upload signature photo</span>
              <span className="text-xs text-slate-400 mt-1">PNG · JPG · JPEG · WEBP</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="sr-only"
                onChange={handleFileChange}
              />
            </label>
          )}
        </div>
      )}
    </div>
  );
}

