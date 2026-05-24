"use client";

import { useEffect, useRef, useState } from "react";

export default function LakeSchemeViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const closeTimerRef = useRef<number | null>(null);

  function openViewer() {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setMounted(true);
    setVisible(false);
    setOpen(true);
    requestAnimationFrame(() => setVisible(true));
  }

  function closeViewer() {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    setVisible(false);
    setOpen(false);
    closeTimerRef.current = window.setTimeout(() => {
      setMounted(false);
      closeTimerRef.current = null;
    }, 180);
  }

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeViewer();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  useEffect(() => () => {
    if (closeTimerRef.current != null) {
      window.clearTimeout(closeTimerRef.current);
    }
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={openViewer}
        className="block w-full cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-[#0F2A4D] text-left transition hover:border-white/20 hover:bg-[#13325b]"
        aria-label="Відкрити схему озера"
      >
        <div className="flex min-h-[180px] items-center justify-center px-5 py-10 text-center">
          <div>
            <div className="text-base font-semibold text-white">Переглянути схему водойми</div>
            <div className="mt-1 text-sm text-white/70">Натисніть, щоб відкрити схему</div>
          </div>
        </div>
      </button>

      {mounted && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Схема озера"
          onClick={closeViewer}
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 180ms ease",
          }}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              closeViewer();
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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt="Схема озера"
              loading="lazy"
              decoding="async"
              className="block max-h-[calc(95vh-1rem)] max-w-[calc(95vw-1rem)] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
