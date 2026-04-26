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
    <div className="dk-gallery">
      {/* Головне фото */}
      <div className="dk-gallery-main-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={images[active]}
          alt={name}
          className="dk-gallery-main"
        />
      </div>

      {/* Мініатюри (якщо більше 1 фото) */}
      {images.length > 1 && (
        <div className="dk-gallery-thumbs">
          {images.map((url, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`dk-gallery-thumb${i === active ? " active" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt={`${name} ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </button>
          ))}
        </div>
      )}

      {/* Лічильник */}
      {images.length > 1 && (
        <p className="dk-gallery-counter">
          {active + 1} / {images.length}
        </p>
      )}
    </div>
  );
}
