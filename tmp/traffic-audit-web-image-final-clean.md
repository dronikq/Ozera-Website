# Traffic Audit: web-image-final-clean

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 20
- Warm detail pages visited: 0
- Total detail pages visited: 20
- Cold transfer: 3.14 MB
- Cold resource: 39.43 MB
- Warm transfer: 0.00 MB
- Warm resource: 0.00 MB
- Cold violations: 2
- Warm violations: 0

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 1415 | 0 |
| Known transfer | 3.14 MB | 0.00 MB |
| Known resource | 39.43 MB | 0.00 MB |
| Image resource | 24.43 MB | 0.00 MB |
| Supabase Storage resource | 17.22 MB | 0.00 MB |
| Scheme WebP | 8 / 1.09 MB | 0 / 0.00 MB |
| Scheme legacy | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme external remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme PNG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme JPG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme failed | 0 / 0.00 MB | 0 / 0.00 MB |
| Repeated network downloads | 0 | 0 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 70 | 12.25 MB | 0.00 MB |
| thumb | 67 | 3.88 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 284 | 8.01 MB | 0.38 MB |

### Warm
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 0 | 0.00 MB | 0.00 MB |
| thumb | 0 | 0.00 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 0 | 0.00 MB | 0.00 MB |
| unknown | 0 | 0.00 MB | 0.00 MB |

## 4. Scheme Breakdown
| Metric | Cold | Warm |
| --- | --- | --- |
| Scheme WebP requests | 8 | 0 |
| Scheme WebP resource | 1.09 MB | 0.00 MB |
| Scheme legacy requests | 0 | 0 |
| Scheme legacy resource | 0.00 MB | 0.00 MB |
| Scheme external requests | 0 | 0 |
| Scheme external resource | 0.00 MB | 0.00 MB |
| Scheme PNG requests | 0 | 0 |
| Scheme PNG resource | 0.00 MB | 0.00 MB |
| Scheme JPG requests | 0 | 0 |
| Scheme JPG resource | 0.00 MB | 0.00 MB |
| Scheme failed requests | 0 | 0 |
| Scheme failed resource | 0.00 MB | 0.00 MB |

## 5. Scheme Data Offenders
_No scheme data offenders detected._

## 6. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 38 | 0.63 MB | 0.77 MB | 7 | 10 | 0.34 MB | 0 | 0.00 MB | 17 | 0.43 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.38 MB |
| catalog-initial | 73 | 0.22 MB | 2.56 MB | 37 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 41 | 2.11 MB |
| catalog-scroll | 37 | 0.13 MB | 0.58 MB | 11 | 8 | 0.44 MB | 7 | 0.41 MB | 3 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 7 | 0.41 MB |
| map-open | 91 | 0.08 MB | 1.42 MB | 73 | 73 | 1.21 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 78 | 0.02 MB | 2.57 MB | 34 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 2.11 MB |
| detail-total | 1015 | 2.02 MB | 30.19 MB | 175 | 238 | 17.79 MB | 78 | 13.34 MB | 420 | 10.49 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 0.04 MB | 289 | 20.86 MB |
| detail-page | 999 | 2.02 MB | 29.10 MB | 159 | 230 | 16.70 MB | 70 | 12.25 MB | 420 | 10.49 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 0.04 MB | 273 | 19.77 MB |
| detail-gallery | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 16 | 0.00 MB | 1.09 MB | 16 | 8 | 1.09 MB | 8 | 1.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 16 | 1.09 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 915 | 2.86 MB | 15.40 MB | 61 | 30 | 0.43 MB | 0 | 0.00 MB | 515 | 12.83 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 25 | 3.84 MB |

## 7. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/vovkove | vovkove | 53 | 0.10 MB | 2.23 MB | 1.61 MB | 5 | 0 | yes | 2 |
| /lakes/ozero-pidkova | ozero-pidkova | 51 | 0.10 MB | 2.16 MB | 1.54 MB | 5 | 0 | no | 2 |
| /lakes/white-horvat | white-horvat | 50 | 0.10 MB | 1.73 MB | 1.11 MB | 4 | 0 | no | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 51 | 0.10 MB | 1.73 MB | 1.11 MB | 3 | 0 | yes | 2 |
| /lakes/neptun-lymanne-hospodarstvo | neptun-lymanne-hospodarstvo | 52 | 0.10 MB | 1.71 MB | 1.09 MB | 4 | 0 | yes | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 8. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb_webp | 0 | 0.00 MB | n/a | n/a |
| lake_thumb_legacy | 0 | 0.00 MB | n/a | n/a |
| lake_medium_webp | 0 | 0.00 MB | n/a | n/a |
| lake_medium_legacy | 0 | 0.00 MB | n/a | n/a |
| lake_original | 0 | 0.00 MB | n/a | n/a |
| lake_legacy_image_url | 0 | 0.00 MB | n/a | n/a |
| scheme_images | 8 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_webp | 8 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_legacy | 0 | 0.00 MB | n/a | n/a |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| map_tiles | 20 | 0.47 MB | /light_all/7/70/43.png | 0.03 MB |
| js_bundles | 20 | 3.07 MB | /gtag/js | 0.15 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 20 | 0.03 MB | /api/weather | 0.00 MB |
| unknown_external | 20 | 5.57 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/e740d322-a3ef-4bae-9f43-3b213eeb75ce/medium/89556c423492e09b550ba28b213a81e9d7b6fcaef680bdc46411b97befb6ff5a.jpg | 0.53 MB |

## 9. Top Remaining Scheme Offenders
| Bucket | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| top20SchemeFailed | 0 | 0.00 MB | n/a | n/a |

## 10. Violations/regressions
| Violation | Count |
| --- | --- |
| js_bundle_too_high | 1 |
| medium_too_high | 1 |

## 11. Recommendations generated from detected data
- Many medium images were loaded. Inspect gallery and detail-page loading to reduce redundant medium fetches.
- Scheme images are still expensive (1.09 MB across top offenders: /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp (0.26 MB), /storage/v1/object/public/lake-images/lakes/353d8141-764b-46ec-9865-027656da4d24/scheme/40081cdb32b44d7ff2b098f208a656b2e7163e0cd56fb1485f64914c87727bef.webp (0.21 MB), /storage/v1/object/public/lake-images/lakes/6c2ab506-a809-4a80-b02a-b84db786ad22/scheme/e1cd7d7fa9645d33d9c157f307cd19ce3687c9bde139a98e2085c2b20fa2ffde.webp (0.17 MB)). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- JS bundle weight is high (12.83 MB). Inspect the bundle analyzer and split heavy code paths with dynamic imports. Top route bundles: /lakes (0.77 MB, unique: .next/static/chunks/0xot5i8x1.v15.js, .next/static/chunks/0bjmub5oei784.js); / (0.65 MB, unique: .next/static/chunks/0ij.u5h_n5lg3.js); /lakes/[slug] (0.61 MB, unique: .next/static/chunks/0fn9b0~gpbdv7.js); /lakes/add (0.55 MB, unique: .next/static/chunks/0g4w_625xbtex.js). Top network JS resources: /gtag/js (0.15 MB), /gtag/js (0.15 MB), /gtag/js (0.15 MB).
