"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import FishIcon from "@/app/components/FishIcon";
import type { Lake } from "@/lib/supabase";

export type LakeCardData = {
  href: string;
  name: string;
  imageUrl: string | null;
  areaHa: number | null;
  city: string | null;
  locationText: string | null;
  fishSpecies: string[] | null;
  priceUah: number | null;
};

export function toLakeCardData(lake: Pick<Lake, "name" | "image_url" | "area_ha" | "city" | "location_text" | "fish_species" | "price_uah"> & { href: string }): LakeCardData {
  return {
    href: lake.href,
    name: lake.name,
    imageUrl: lake.image_url,
    areaHa: lake.area_ha,
    city: lake.city,
    locationText: lake.location_text,
    fishSpecies: lake.fish_species ?? [],
    priceUah: lake.price_uah,
  };
}

type Props = {
  lake: LakeCardData;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
};

function MapPinIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 21s6-4.35 6-11a6 6 0 0 0-12 0c0 6.65 6 11 6 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

function WavesFallbackIcon() {
  return (
    <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <path d="M7 20c2.5-2.5 5-2.5 7.5 0s5 2.5 7.5 0 5-2.5 7.5 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M10 26c1.9-1.9 3.8-1.9 5.7 0s3.8 1.9 5.7 0 3.8-1.9 5.7 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.8" />
      <path d="M14 32c1.2-1.2 2.5-1.2 3.7 0s2.5 1.2 3.7 0 2.5-1.2 3.7 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" opacity="0.6" />
    </svg>
  );
}

function formatArea(areaHa: number) {
  if (Number.isInteger(areaHa)) return `${areaHa}`;
  return areaHa.toFixed(areaHa < 10 ? 1 : 0).replace(/\.0$/, "");
}

function formatPrice(priceUah: number) {
  return new Intl.NumberFormat("uk-UA").format(priceUah);
}

export default function LakeCard({ lake, onMouseEnter, onMouseLeave }: Props) {
  const [imageFailed, setImageFailed] = useState(!lake.imageUrl);

  useEffect(() => {
    setImageFailed(!lake.imageUrl);
  }, [lake.imageUrl]);

  const badgeText = useMemo(() => {
    if (lake.areaHa != null) return `${formatArea(lake.areaHa)} га`;
    return lake.city || lake.locationText || "Україна";
  }, [lake.areaHa, lake.city, lake.locationText]);

  const locationText = lake.locationText || lake.city || "Локація уточнюється";
  const fish = (lake.fishSpecies ?? []).filter(Boolean);
  const visibleFish = fish.slice(0, 3);
  const moreFish = fish.length > 3 ? fish.length - 3 : 0;

  return (
    <Link
      href={lake.href}
      className="lake-card"
      aria-label={`Відкрити озеро ${lake.name}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="lake-card__media">
        {imageFailed ? (
          <div className="lake-card__media-fallback" aria-hidden="true">
            <div className="lake-card__media-fallback-icon">
              <WavesFallbackIcon />
            </div>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={lake.imageUrl ?? ""}
            alt={lake.name}
            className="lake-card__img"
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
          />
        )}

        <span className="lake-card__badge">{badgeText}</span>
      </div>

      <div className="lake-card__body">
        <div className="lake-card__title-wrap">
          <h3 className="lake-card__title">{lake.name}</h3>
          <p className="lake-card__location">
            <MapPinIcon />
            <span>{locationText}</span>
          </p>
        </div>

        {fish.length > 0 && (
          <div className="lake-card__chips" aria-label="Види риби">
            {visibleFish.map((fishName) => (
              <span key={fishName} className="lake-card__chip">
                {fishName}
              </span>
            ))}
            {moreFish > 0 && <span className="lake-card__chip lake-card__chip--more">+{moreFish}</span>}
          </div>
        )}

        <div className="lake-card__footer">
          <div className="lake-card__price">
            {lake.priceUah != null ? (
              <>
                <span className="lake-card__price-label">Ціна</span>
                <strong>від {formatPrice(lake.priceUah)} грн</strong>
              </>
            ) : (
              <span className="lake-card__price-muted">Ціна уточнюється</span>
            )}
          </div>

          <span className="lake-card__action">Відкрити озеро</span>
        </div>
      </div>
    </Link>
  );
}
