"use client";

import { useState } from "react";

interface Props {
  images: string[];
  name: string;
}

export default function ImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);

  if (images.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      {/* Головне фото */}
      <div className="rounded-2xl overflow-hidden h-72 md:h-96 bg-slate-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={name}
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      </div>

      {/* Мініатюри (якщо більше 1 фото) */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`shrink-0 rounded-xl overflow-hidden h-16 w-24 border-2 transition-all ${
                i === active
                  ? "border-[#f5c842] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-90"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${name} ${i + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Лічильник */}
      {images.length > 1 && (
        <p className="text-xs text-slate-400 text-right">
          {active + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
