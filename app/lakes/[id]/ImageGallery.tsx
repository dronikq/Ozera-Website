"use client";

import { useState } from "react";

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

  if (images.length === 0) return null;

  const activeImage = images[active] ?? images[0];

  return (
    <div className="dk-gallery">
      <div className="dk-gallery-main-wrap">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeImage.mainUrl}
          alt={activeImage.alt || name}
          className="dk-gallery-main"
        />
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
    </div>
  );
}
