"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";

export default function LakeSchemeViewer({ src }: { src: string }) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      const frame = requestAnimationFrame(() => setVisible(true));
      return () => cancelAnimationFrame(frame);
    }

    const timer = window.setTimeout(() => {
      setVisible(false);
      setMounted(false);
    }, 180);
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
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="block w-full cursor-zoom-in"
        aria-label="Відкрити схему озера на весь екран"
      >
        <img src={src} alt="Схема озера" style={{ width: "100%", display: "block" }} />
      </button>

      {mounted &&
        createPortal(
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/85 p-4"
            role="dialog"
            aria-modal="true"
            aria-label="Схема озера"
            onClick={() => setOpen(false)}
            style={{
              zIndex: 9999,
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
              className="absolute right-6 top-6 flex h-11 w-11 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white backdrop-blur hover:bg-white/20"
              aria-label="Закрити схему озера"
              style={{ zIndex: 10001 }}
            >
              <span aria-hidden="true" className="text-2xl leading-none">
                ×
              </span>
            </button>

            <div
              className="max-h-[95vh] max-w-[95vw] overflow-auto rounded-2xl bg-[#132F57] p-2 shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              style={{
                zIndex: 10000,
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
          </div>,
          document.body,
        )}
    </>
  );
}
