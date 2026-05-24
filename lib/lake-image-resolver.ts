import type { Lake, LakeImage } from "@/lib/supabase";

export const LAKE_PLACEHOLDER_IMAGE = "/ozera_splash.png";

type LakeImageOwner = Pick<Lake, "image_url"> & {
  lake_images?: LakeImage[] | null;
};

type ImageLike = Pick<LakeImage, "id" | "lake_id" | "url"> &
  Partial<Pick<LakeImage, "medium_url" | "thumb_url" | "is_primary" | "sort_order" | "created_at">>;

function cleanUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function warnIfOriginal(url: string, source: string) {
  if (process.env.NODE_ENV === "development" && url.includes("/original/")) {
    console.warn(`[lake-image-resolver] ${source} selected an /original/ URL for public UI: ${url}`);
  }
}

function publicUrl(url: string | null | undefined, source: string) {
  const selected = cleanUrl(url) ?? LAKE_PLACEHOLDER_IMAGE;
  warnIfOriginal(selected, source);
  return selected;
}

function isLakeImageOwner(value: ImageLike | LakeImageOwner | null | undefined): value is LakeImageOwner {
  return !!value && "image_url" in value;
}

export function normalizeLakeImages(images: LakeImage[] | null | undefined): LakeImage[] {
  return (images ?? [])
    .filter((image): image is LakeImage => Boolean(image?.id))
    .slice()
    .sort((a, b) => {
      if (a.is_primary && !b.is_primary) return -1;
      if (!a.is_primary && b.is_primary) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    });
}

export function getPrimaryLakeImage(lake: LakeImageOwner | null | undefined): LakeImage | null {
  const images = normalizeLakeImages(lake?.lake_images);
  return images.find((image) => image.is_primary) ?? images[0] ?? null;
}

export function getLakeCardImage(lake: LakeImageOwner | null | undefined) {
  const primary = getPrimaryLakeImage(lake);
  return publicUrl(primary?.thumb_url ?? lake?.image_url, "getLakeCardImage");
}

export function getLakeMapPreviewImage(lake: LakeImageOwner | null | undefined) {
  const primary = getPrimaryLakeImage(lake);
  return publicUrl(primary?.thumb_url ?? lake?.image_url, "getLakeMapPreviewImage");
}

export function getLakeDetailImage(lake: LakeImageOwner | null | undefined) {
  const primary = getPrimaryLakeImage(lake);
  return publicUrl(primary?.medium_url ?? lake?.image_url, "getLakeDetailImage");
}

export function getLakeOgImage(lake: LakeImageOwner | null | undefined) {
  const primary = getPrimaryLakeImage(lake);
  return publicUrl(primary?.medium_url ?? lake?.image_url, "getLakeOgImage");
}

export function getGalleryMainImage(imageOrLake: ImageLike | LakeImageOwner | null | undefined, lake?: LakeImageOwner | null) {
  if (isLakeImageOwner(imageOrLake)) {
    return getLakeDetailImage(imageOrLake);
  }

  return publicUrl(imageOrLake?.medium_url ?? imageOrLake?.thumb_url ?? lake?.image_url, "getGalleryMainImage");
}

export function getGalleryThumbImage(imageOrLake: ImageLike | LakeImageOwner | null | undefined, lake?: LakeImageOwner | null) {
  if (isLakeImageOwner(imageOrLake)) {
    return getLakeCardImage(imageOrLake);
  }

  return publicUrl(imageOrLake?.thumb_url ?? imageOrLake?.medium_url ?? lake?.image_url, "getGalleryThumbImage");
}
