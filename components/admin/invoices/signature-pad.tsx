"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { PenLine, RotateCcw, Save, Upload, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { readPdfCompatibleImage } from "@/lib/pdf-image";

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
  // Track last point for smooth line rendering (needed for Apple Pencil)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);

  // ─── Canvas init ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== "draw") return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * ratio));
    canvas.height = Math.max(1, Math.floor(rect.height * ratio));

    // willReadFrequently: true improves performance on Safari/WebKit when we
    // later call toDataURL. Without it Safari may stall on Retina iPads.
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
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

  // ─── Prevent page scroll/bounce while actively drawing (iPadOS Safari) ─────
  // When the user is drawing with Apple Pencil or finger on iPad, Safari may
  // try to scroll or rubber-band the page. We attach a global touchmove
  // listener on the *document* that calls preventDefault() while drawing.
  useEffect(() => {
    function preventScroll(e: TouchEvent) {
      if (drawingRef.current) {
        e.preventDefault();
      }
    }

    // { passive: false } is required to call preventDefault() on touch events in Safari.
    document.addEventListener("touchmove", preventScroll, { passive: false });
    return () => {
      document.removeEventListener("touchmove", preventScroll);
    };
  }, []);

  // ─── Draw helpers ──────────────────────────────────────────────────────────
  const getPoint = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }, []);

  /** Calculate line width from Apple Pencil pressure (or default for mouse) */
  const getLineWidth = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    // Apple Pencil reports pointerType === "pen" with pressure 0..1
    // Mouse always reports pressure 0.5 (or 0 when not pressing)
    if (event.pointerType === "pen" && event.pressure > 0) {
      // Map pressure 0..1 → lineWidth 1..5 for natural feel
      return 1 + event.pressure * 4;
    }
    // Touch or mouse – fixed width
    return 2;
  }, []);

  const begin = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    // Prevent default to stop Safari from initiating scroll/zoom gestures
    event.preventDefault();
    event.stopPropagation();

    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    drawingRef.current = true;

    // setPointerCapture ensures we keep receiving events even if the
    // pointer (Apple Pencil tip) drifts slightly outside the canvas bounds.
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some browsers throw if capture is already set — safe to ignore
    }

    const p = getPoint(event);
    lastPointRef.current = p;

    ctx.lineWidth = getLineWidth(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    // Draw a single dot so tapping in place leaves a mark
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
  }, [getPoint, getLineWidth]);

  const draw = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    // Always prevent default on move to block iOS Safari scroll
    event.preventDefault();
    event.stopPropagation();

    if (!drawingRef.current) return;

    const ctx = canvasRef.current?.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const p = getPoint(event);
    ctx.lineWidth = getLineWidth(event);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    lastPointRef.current = p;
    setHasInk(true);
  }, [getPoint, getLineWidth]);

  const end = useCallback((event: React.PointerEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    const wasDrawing = drawingRef.current;
    drawingRef.current = false;
    lastPointRef.current = null;

    if (wasDrawing && canvasRef.current) {
      onChange(canvasRef.current.toDataURL("image/png"));
    }

    // Release pointer capture
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // safe to ignore
    }
  }, [onChange]);

  function clearDraw() {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: true });
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
  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readPdfCompatibleImage(file);
      setUploadPreview(dataUrl);
      onChange(dataUrl);
    } catch (error) {
      console.error("Signature image conversion failed:", error);
      clearUpload();
      toast.error(error instanceof Error ? error.message : "Could not prepare the signature image.");
    }
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
            Sign directly in the box below using Apple Pencil, stylus, or finger.
          </p>
          {/*
            Apple/iPad compatibility notes for this <canvas>:
            ─────────────────────────────────────────────────
            1. style={{ touchAction: "none" }}
               Inline style is required because Safari/WebKit ignores the
               Tailwind `touch-none` class in some scenarios. This disables
               the browser's default touch gestures (scroll, pinch-zoom)
               on the canvas element.

            2. style={{ overscrollBehavior: "none" }}
               Prevents the rubber-band "bounce" effect on iPadOS Safari
               when the user drags beyond the canvas boundary.

            3. style={{ WebkitUserSelect: "none", userSelect: "none" }}
               Prevents text-selection callouts from appearing when
               long-pressing on the canvas with Apple Pencil or finger.

            4. style={{ WebkitTouchCallout: "none" } as any}
               Disables the context menu / callout popup that Safari shows
               on long-press. TypeScript doesn't recognise this proprietary
               CSS property, hence the `as any` escape.

            5. onPointerDown / onPointerMove / onPointerUp all call
               event.preventDefault() + event.stopPropagation() so that
               Safari cannot hijack the gesture for scrolling or zooming.

            6. onPointerLeave mirrors onPointerUp so that if the Apple
               Pencil tip moves off the canvas edge the stroke is cleanly
               finalised instead of "stuck" in drawing mode.

            7. We use setPointerCapture() in begin() so that fast stylus
               strokes that momentarily leave the canvas boundary still
               deliver move events to the canvas element.
          */}
          <canvas
            ref={canvasRef}
            className="h-40 w-full touch-none rounded-md border border-slate-200 bg-white shadow-inner"
            style={{
              touchAction: "none",
              overscrollBehavior: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
              msTouchAction: "none",
              willChange: "transform", // hint GPU compositing on Apple devices
              ...(({ WebkitTouchCallout: "none" }) as any),
            }}
            onPointerDown={begin}
            onPointerMove={draw}
            onPointerUp={end}
            onPointerCancel={end}
            onPointerLeave={end}
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
              <span className="text-xs text-slate-400 mt-1">PNG · JPG · JPEG · HEIC · WEBP</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/heic,image/heif,image/webp"
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
