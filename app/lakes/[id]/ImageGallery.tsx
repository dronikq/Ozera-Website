"use client";

import { useEffect, useState } from "react";

type GalleryImage = {
  id: string;
  alt: string;
  mainUrl: string;
  thumbUrl: string;
};

interface Props {
  images: GalleryImage[];
  name: string;
}

export default function ImageGallery({ images, name }: Props) {
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState(false);

  useEffect(() => {
    if (!opened) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpened(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [opened]);

  if (images.length === 0) return null;

  const activeImage = images[active] ?? images[0];

  return (
    <div className="dk-gallery">
      <div className="dk-gallery-main-wrap">
        <button
          type="button"
          onClick={() => setOpened(true)}
          className="block h-full w-full cursor-zoom-in p-0"
          aria-label={`Відкрити велике фото ${activeImage.alt || name}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.thumbUrl}
            alt={activeImage.alt || name}
            className="dk-gallery-main"
          />
        </button>
      </div>

      {images.length > 1 && (
        <div className="dk-gallery-thumbs">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => setActive(index)}
              className={`dk-gallery-thumb${index === active ? " active" : ""}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.thumbUrl}
                alt={`${image.alt || name} ${index + 1}`}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </button>
          ))}
        </div>
      )}

      {images.length > 1 && (
        <p className="dk-gallery-counter">
          {active + 1} / {images.length}
        </p>
      )}

      {opened && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={`Велике фото ${activeImage.alt || name}`}
          onClick={() => setOpened(false)}
        >
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              setOpened(false);
            }}
            className="absolute right-4 top-4 rounded-full bg-white/10 px-3 py-2 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
            aria-label="Закрити велике фото"
          >
            ✕
          </button>

          <div
            className="max-h-[95vh] max-w-[95vw] overflow-auto rounded-2xl bg-[#132F57] p-2 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={activeImage.mainUrl}
              alt={activeImage.alt || name}
              loading="eager"
              decoding="async"
              className="block max-h-[calc(95vh-1rem)] max-w-[calc(95vw-1rem)] object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}
