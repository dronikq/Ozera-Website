import type { Lake, LakeImage } from "@/lib/supabase";

export const LAKE_PLACEHOLDER_IMAGE = "/ozera_splash.png";
export const PUBLIC_LAKE_IMAGE_SELECT = "id, lake_id, url, medium_url, thumb_url, is_primary, sort_order, created_at";
export const DIAGNOSTIC_LAKE_IMAGE_SELECT = "id, lake_id, url, medium_url, thumb_url, original_url, is_primary, sort_order, created_at";

type LakeImageOwner = Pick<Lake, "image_url"> & {
  scheme_image_url?: string | null;
  lake_images?: LakeImage[] | null;
};

type ImageLike = Pick<LakeImage, "id" | "lake_id" | "url"> &
  Partial<Pick<LakeImage, "medium_url" | "thumb_url" | "is_primary" | "sort_order" | "created_at">> & {
    original_url?: string | null;
  };

type ImageVariant = "thumb_url" | "medium_url";

type ImageSource = "lake_images" | "lake.image_url" | "scheme_image_url" | "placeholder";
type ImageKind = "lake_card" | "lake_map" | "lake_detail" | "lake_og" | "lake_gallery" | "lake_scheme";
type ImageVariantLabel = ImageVariant | "legacy" | "placeholder" | "scheme";

export type LakeImageSelection = {
  kind: ImageKind;
  source: ImageSource;
  variant: ImageVariantLabel;
  url: string;
  imageId: string | null;
  isWebP: boolean;
};

function cleanUrl(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed || null;
}

function isWebPUrl(value: string) {
  try {
    return /\.webp($|[?#])/i.test(new URL(value, "https://example.com").pathname);
  } catch {
    return /\.webp($|[?#])/i.test(value);
  }
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

function selectVariantFromImage(image: Pick<LakeImage, "id" | "medium_url" | "thumb_url"> | null | undefined, variants: ImageVariant[]) {
  if (!image) return null;

  for (const variant of variants) {
    const url = cleanUrl(image[variant]);
    if (url) {
      return { url, variant };
    }
  }

  return null;
}

function resolveLakeImageSelection(
  kind: ImageKind,
  owner: LakeImageOwner | null | undefined,
  variants: ImageVariant[],
): LakeImageSelection {
  const primary = getPrimaryLakeImage(owner);
  const selected = selectVariantFromImage(primary, variants);

  if (selected) {
    const url = publicUrl(selected.url, `${kind}:lake_images`);
    return {
      kind,
      source: "lake_images",
      variant: selected.variant,
      url,
      imageId: primary?.id ?? null,
      isWebP: isWebPUrl(url),
    };
  }

  const fallback = cleanUrl(owner?.image_url);
  if (fallback) {
    const url = publicUrl(fallback, `${kind}:lake.image_url`);
    return {
      kind,
      source: "lake.image_url",
      variant: "legacy",
      url,
      imageId: null,
      isWebP: isWebPUrl(url),
    };
  }

  return {
    kind,
    source: "placeholder",
    variant: "placeholder",
    url: LAKE_PLACEHOLDER_IMAGE,
    imageId: null,
    isWebP: false,
  };
}

function resolveImageLikeSelection(
  kind: ImageKind,
  imageOrLake: ImageLike | LakeImageOwner | null | undefined,
  lake: LakeImageOwner | null | undefined,
  variants: ImageVariant[],
): LakeImageSelection {
  if (isLakeImageOwner(imageOrLake)) {
    return resolveLakeImageSelection(kind, imageOrLake, variants);
  }

  const selected = selectVariantFromImage(imageOrLake, variants);
  if (selected) {
    const url = publicUrl(selected.url, `${kind}:image`);
    return {
      kind,
      source: "lake_images",
      variant: selected.variant,
      url,
      imageId: imageOrLake?.id ?? null,
      isWebP: isWebPUrl(url),
    };
  }

  const fallback = cleanUrl(lake?.image_url);
  if (fallback) {
    const url = publicUrl(fallback, `${kind}:lake.image_url`);
    return {
      kind,
      source: "lake.image_url",
      variant: "legacy",
      url,
      imageId: null,
      isWebP: isWebPUrl(url),
    };
  }

  return {
    kind,
    source: "placeholder",
    variant: "placeholder",
    url: LAKE_PLACEHOLDER_IMAGE,
    imageId: null,
    isWebP: false,
  };
}

export function describeLakeImageSelection(selection: LakeImageSelection) {
  const debugSource = `web_${selection.kind.replace("lake_", "")}`;
  return `imageKind=lake source=${debugSource} variant=${selection.variant} isWebP=${selection.isWebP} path=${selection.url}`;
}

export function getLakeCardImage(lake: LakeImageOwner | null | undefined) {
  return resolveLakeImageSelection("lake_card", lake, ["thumb_url", "medium_url"]).url;
}

export function getLakeMapPreviewImage(lake: LakeImageOwner | null | undefined) {
  return resolveLakeImageSelection("lake_map", lake, ["thumb_url", "medium_url"]).url;
}

export function getLakeDetailImage(lake: LakeImageOwner | null | undefined) {
  return resolveLakeImageSelection("lake_detail", lake, ["medium_url", "thumb_url"]).url;
}

export function getLakeOgImage(lake: LakeImageOwner | null | undefined) {
  return resolveLakeImageSelection("lake_og", lake, ["medium_url", "thumb_url"]).url;
}

export function getLakeSchemeImage(lake: LakeImageOwner | null | undefined) {
  return cleanUrl(lake?.scheme_image_url);
}

export function getGalleryDisplayImage(imageOrLake: ImageLike | LakeImageOwner | null | undefined, lake?: LakeImageOwner | null) {
  return resolveImageLikeSelection("lake_gallery", imageOrLake, lake, ["medium_url", "thumb_url"]).url;
}

export function getGalleryMainImage(imageOrLake: ImageLike | LakeImageOwner | null | undefined, lake?: LakeImageOwner | null) {
  return getGalleryDisplayImage(imageOrLake, lake);
}

export function getGalleryThumbImage(imageOrLake: ImageLike | LakeImageOwner | null | undefined, lake?: LakeImageOwner | null) {
  return resolveImageLikeSelection("lake_gallery", imageOrLake, lake, ["thumb_url", "medium_url"]).url;
}
