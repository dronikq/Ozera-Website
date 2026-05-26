# Traffic Audit: prod-after-scheme-webp-final

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 41
- Warm detail pages visited: 41
- Total detail pages visited: 82
- Cold transfer: 5.34 MB
- Cold resource: 68.81 MB
- Warm transfer: 0.40 MB
- Warm resource: 68.81 MB
- Cold violations: 3
- Warm violations: 1

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 2577 | 2579 |
| Known transfer | 5.34 MB | 0.40 MB |
| Known resource | 68.81 MB | 68.81 MB |
| Image resource | 40.64 MB | 40.63 MB |
| Supabase Storage resource | 28.76 MB | 28.89 MB |
| Scheme storage | 8 / 1.09 MB | 8 / 1.09 MB |
| Scheme WebP | 8 / 1.09 MB | 8 / 1.09 MB |
| Scheme external remaining | 2 / 0.00 MB | 2 / 0.00 MB |
| Scheme PNG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme JPG remaining | 1 / 0.00 MB | 1 / 0.00 MB |
| Scheme failed | 1 / 0.00 MB | 1 / 0.00 MB |
| Repeated network downloads | 0 | 743 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 102 | 15.67 MB | 0.00 MB |
| thumb | 212 | 12.00 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 456 | 12.69 MB | 0.39 MB |

### Warm
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 102 | 15.67 MB | 0.00 MB |
| thumb | 214 | 12.13 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.14 MB | 0.00 MB |
| unknown | 456 | 12.68 MB | 0.01 MB |

## 4. Scheme Breakdown
| Metric | Cold | Warm |
| --- | --- | --- |
| Scheme storage requests | 8 | 8 |
| Scheme storage resource | 1.09 MB | 1.09 MB |
| Scheme WebP requests | 8 | 8 |
| Scheme WebP resource | 1.09 MB | 1.09 MB |
| Scheme external requests | 2 | 2 |
| Scheme external resource | 0.00 MB | 0.00 MB |
| Scheme PNG requests | 0 | 0 |
| Scheme PNG resource | 0.00 MB | 0.00 MB |
| Scheme JPG requests | 1 | 1 |
| Scheme JPG resource | 0.00 MB | 0.00 MB |
| Scheme failed requests | 1 | 1 |
| Scheme failed resource | 0.00 MB | 0.00 MB |

## 5. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 43 | 0.79 MB | 0.93 MB | 3 | 10 | 0.34 MB | 0 | 0.00 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.38 MB |
| catalog-initial | 79 | 0.16 MB | 2.57 MB | 34 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 2.11 MB |
| catalog-scroll | 64 | 0.16 MB | 0.61 MB | 8 | 8 | 0.44 MB | 7 | 0.41 MB | 3 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 0.41 MB |
| map-open | 90 | 0.08 MB | 1.42 MB | 73 | 73 | 1.21 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 78 | 0.02 MB | 2.60 MB | 35 | 40 | 2.14 MB | 31 | 1.77 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 41 | 2.15 MB |
| detail-total | 2140 | 4.09 MB | 59.34 MB | 443 | 586 | 33.96 MB | 254 | 24.83 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 60 | 0.05 MB | 684 | 40.26 MB |
| detail-page | 2053 | 4.09 MB | 48.32 MB | 356 | 509 | 22.94 MB | 181 | 13.81 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 60 | 0.05 MB | 597 | 29.24 MB |
| detail-gallery | 67 | 0.00 MB | 9.93 MB | 67 | 67 | 9.93 MB | 65 | 9.93 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 67 | 9.93 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 20 | 0.00 MB | 1.09 MB | 20 | 10 | 1.09 MB | 8 | 1.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 1.09 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 1683 | 4.90 MB | 28.26 MB | 92 | 49 | 0.15 MB | 0 | 0.00 MB | 959 | 23.89 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 46 | 7.07 MB |

## 6. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.10 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/vovkove | vovkove | 56 | 0.10 MB | 2.14 MB | 1.52 MB | 3 | 5 | yes | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.10 MB | 1.97 MB | 1.35 MB | 3 | 3 | yes | 2 |
| /lakes/white-horvat | white-horvat | 53 | 0.10 MB | 1.90 MB | 1.28 MB | 3 | 4 | no | 2 |
| /lakes/try-husaka-baza-vidpochynku | try-husaka-baza-vidpochynku | 52 | 0.10 MB | 1.86 MB | 1.24 MB | 3 | 5 | no | 0 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.01 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/vovkove | vovkove | 56 | 0.01 MB | 2.14 MB | 1.52 MB | 3 | 5 | yes | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.01 MB | 1.97 MB | 1.35 MB | 3 | 3 | yes | 2 |
| /lakes/white-horvat | white-horvat | 53 | 0.01 MB | 1.90 MB | 1.28 MB | 3 | 4 | no | 2 |
| /lakes/try-husaka-baza-vidpochynku | try-husaka-baza-vidpochynku | 52 | 0.01 MB | 1.86 MB | 1.24 MB | 3 | 5 | no | 0 |

## 7. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb | 20 | 2.47 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |
| lake_medium | 20 | 5.65 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/e740d322-a3ef-4bae-9f43-3b213eeb75ce/medium/89556c423492e09b550ba28b213a81e9d7b6fcaef680bdc46411b97befb6ff5a.jpg | 0.53 MB |
| scheme_images | 9 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_storage | 8 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_webp | 8 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_external | 1 | 0.00 MB | /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg | 0.00 MB |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| map_tiles | 20 | 0.47 MB | /light_all/7/70/43.png | 0.03 MB |
| js_bundles | 20 | 3.07 MB | /gtag/js | 0.15 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 20 | 0.03 MB | /api/weather | 0.00 MB |
| unknown_external | 20 | 1.48 MB | /premium_photo-1727538055174-92526593a254 | 0.07 MB |

## 8. Top Remaining Scheme Offenders
| Bucket | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| scheme_external | 1 | 0.00 MB | /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg | 0.00 MB |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| top20SchemeFailed | 1 | 0.00 MB | /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg | 0.00 MB |

## 9. Violations/regressions
| Violation | Count |
| --- | --- |
| js_bundle_too_high | 2 |
| no_cache_header_on_public_api | 2 |

## 10. Recommendations generated from detected data
- Scheme images are still expensive (1.09 MB across top offenders: /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp (0.26 MB), /storage/v1/object/public/lake-images/lakes/353d8141-764b-46ec-9865-027656da4d24/scheme/40081cdb32b44d7ff2b098f208a656b2e7163e0cd56fb1485f64914c87727bef.webp (0.21 MB), /storage/v1/object/public/lake-images/lakes/6c2ab506-a809-4a80-b02a-b84db786ad22/scheme/e1cd7d7fa9645d33d9c157f307cd19ce3687c9bde139a98e2085c2b20fa2ffde.webp (0.17 MB)). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.
- Scheme storage WebP: 1.09 MB across /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp (0.26 MB), /storage/v1/object/public/lake-images/lakes/353d8141-764b-46ec-9865-027656da4d24/scheme/40081cdb32b44d7ff2b098f208a656b2e7163e0cd56fb1485f64914c87727bef.webp (0.21 MB), /storage/v1/object/public/lake-images/lakes/6c2ab506-a809-4a80-b02a-b84db786ad22/scheme/e1cd7d7fa9645d33d9c157f307cd19ce3687c9bde139a98e2085c2b20fa2ffde.webp (0.17 MB).
- Scheme external remaining: 0.00 MB across /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg (0.00 MB).
- Scheme failed/unreachable: 0.00 MB across /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg (0.00 MB).
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- JS bundle weight is high (23.89 MB). Inspect the bundle analyzer and split heavy code paths with dynamic imports. Top route bundles: /lakes (0.77 MB, unique: .next/static/chunks/0m.mmb3vzbmno.js, .next/static/chunks/0wvtxgah4v.wg.js); / (0.65 MB, unique: .next/static/chunks/0ij.u5h_n5lg3.js); /lakes/[slug] (0.61 MB, unique: .next/static/chunks/14zi2gif_h7mn.js); /lakes/add (0.55 MB, unique: .next/static/chunks/0g4w_625xbtex.js). Top network JS resources: /gtag/js (0.15 MB), /gtag/js (0.15 MB), /gtag/js (0.15 MB).
- Warm transfer is still non-zero. Inspect cache headers and confirm repeat requests are being served from cache.
- Repeated warm downloads are visible but transfer remains low (743 requests, 0.29 MB). Keep this as a low-priority cache-header follow-up.
