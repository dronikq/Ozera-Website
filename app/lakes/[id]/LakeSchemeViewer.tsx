"use client";

import { useEffect, useState } from "react";

export default function LakeSchemeViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    setVisible(false);
    const timer = window.setTimeout(() => setMounted(false), 180);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in"
        aria-label="Відкрити схему озера на весь екран"
      >
        <img src={src} alt="Схема озера" style={{ width: "100%", display: "block" }} />
      </button>

      {mounted && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Схема озера"
          onClick={() => setOpen(false)}
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpen(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            aria-label="Закрити схему озера"
          >
            ✕
          </button>

          <div
            className="max-h-[95vh] max-w-[95vw] overflow-auto rounded-2xl bg-[#132F57] p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            style={{
              transform: visible ? "scale(1) translateY(0)" : "scale(0.98) translateY(6px)",
              opacity: visible ? 1 : 0,
              transition: "transform 180ms ease, opacity 180ms ease",
            }}
          >
            <img
              src={src}
              alt="Схема озера"
              className="block max-h-[calc(95vh-1rem)] max-w-[calc(95vw-1rem)] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
