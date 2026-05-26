import assert from "node:assert/strict";
import test from "node:test";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
const {
  getGalleryDisplayImage,
  getGalleryMainImage,
  getGalleryThumbImage,
  getLakeCardImage,
  getLakeDetailImage,
  getLakeMapPreviewImage,
  getLakeSchemeImage,
  LAKE_PLACEHOLDER_IMAGE,
  PUBLIC_LAKE_IMAGE_SELECT,
  DIAGNOSTIC_LAKE_IMAGE_SELECT,
} = jiti("../lib/lake-image-resolver.ts");

function makeLake(overrides = {}) {
  return {
    id: "lake-1",
    slug: "lake-1",
    name: "Lake One",
    description: null,
    location_text: null,
    city: null,
    lat: null,
    lng: null,
    area_ha: null,
    max_depth_m: null,
    image_url: null,
    lake_images: [],
    extra: null,
    is_active: true,
    fish_species: null,
    location_google_url: null,
    location_waze_url: null,
    contacts_enabled: false,
    contacts: null,
    price_details_enabled: false,
    price_details_text: null,
    catch_quota_enabled: false,
    catch_quota_text: null,
    additional_services_enabled: false,
    additional_services_text: null,
    lake_rules_enabled: false,
    lake_rules_text: null,
    stocking_enabled: false,
    stocking_text: null,
    faq_enabled: false,
    faq_items: null,
    amenities_enabled: false,
    amenities: null,
    scheme_enabled: false,
    scheme_image_url: null,
    show_work_schedule: false,
    base_open_time: null,
    base_close_time: null,
    work_schedule_summary: null,
    price_uah: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

function makeImage(overrides = {}) {
  return {
    id: "image-1",
    lake_id: "lake-1",
    url: "https://cdn.example.com/original.jpg",
    original_url: "https://cdn.example.com/original-only.jpg",
    medium_url: "https://cdn.example.com/medium.webp",
    thumb_url: "https://cdn.example.com/thumb.webp",
    is_primary: true,
    sort_order: 0,
    created_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

test("card resolves thumb_url first", () => {
  const lake = makeLake({
    lake_images: [makeImage()],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getLakeCardImage(lake), "https://cdn.example.com/thumb.webp");
});

test("detail resolves medium_url first", () => {
  const lake = makeLake({
    lake_images: [makeImage()],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getLakeDetailImage(lake), "https://cdn.example.com/medium.webp");
});

test("missing thumb falls back to medium", () => {
  const lake = makeLake({
    lake_images: [makeImage({ thumb_url: null })],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getGalleryThumbImage(lake.lake_images?.[0], lake), "https://cdn.example.com/medium.webp");
});

test("gallery thumb falls back to legacy image_url when variants are missing", () => {
  const lake = makeLake({
    lake_images: [makeImage({ medium_url: null, thumb_url: null, original_url: "https://cdn.example.com/original-only.jpg" })],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getGalleryThumbImage(lake.lake_images?.[0], lake), "https://cdn.example.com/legacy.jpg");
  assert.equal(getGalleryDisplayImage(lake.lake_images?.[0], lake), "https://cdn.example.com/legacy.jpg");
});

test("original_url is never selected", () => {
  const lake = makeLake({
    lake_images: [makeImage({ medium_url: null, thumb_url: null, original_url: "https://cdn.example.com/original-only.jpg" })],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getGalleryThumbImage(lake.lake_images?.[0], lake), "https://cdn.example.com/legacy.jpg");
  assert.equal(getGalleryDisplayImage(lake.lake_images?.[0], lake), "https://cdn.example.com/legacy.jpg");
});

test("gallery display prefers medium_url", () => {
  const image = makeImage();

  assert.equal(getGalleryDisplayImage(image, makeLake()), "https://cdn.example.com/medium.webp");
  assert.equal(getGalleryMainImage(image, makeLake()), "https://cdn.example.com/medium.webp");
});

test("gallery thumb prefers thumb_url", () => {
  const image = makeImage();

  assert.equal(getGalleryThumbImage(image, makeLake()), "https://cdn.example.com/thumb.webp");
});

test("map preview prefers thumb_url", () => {
  const lake = makeLake({
    lake_images: [makeImage()],
    image_url: "https://cdn.example.com/legacy.jpg",
  });

  assert.equal(getLakeMapPreviewImage(lake), "https://cdn.example.com/thumb.webp");
});

test("scheme uses scheme_image_url", () => {
  const lake = makeLake({
    scheme_enabled: true,
    scheme_image_url: "https://cdn.example.com/scheme.webp",
    image_url: "https://cdn.example.com/legacy.jpg",
    lake_images: [makeImage()],
  });

  assert.equal(getLakeSchemeImage(lake), "https://cdn.example.com/scheme.webp");
});

test("public select excludes original_url", () => {
  assert.equal(PUBLIC_LAKE_IMAGE_SELECT.includes("original_url"), false);
  assert.equal(DIAGNOSTIC_LAKE_IMAGE_SELECT.includes("original_url"), true);
});

test("placeholder stays available when everything is missing", () => {
  const lake = makeLake();
  assert.equal(getLakeCardImage(lake), LAKE_PLACEHOLDER_IMAGE);
});
