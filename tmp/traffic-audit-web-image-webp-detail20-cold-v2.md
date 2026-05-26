# Traffic Audit: web-image-webp-detail20-cold-v2

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 20
- Warm detail pages visited: 0
- Total detail pages visited: 20
- Cold transfer: 3.28 MB
- Cold resource: 40.84 MB
- Warm transfer: 0.00 MB
- Warm resource: 0.00 MB
- Cold violations: 1
- Warm violations: 0

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 1504 | 0 |
| Known transfer | 3.28 MB | 0.00 MB |
| Known resource | 40.84 MB | 0.00 MB |
| Image resource | 25.65 MB | 0.00 MB |
| Supabase Storage resource | 18.44 MB | 0.00 MB |
| Scheme WebP | 8 / 1.09 MB | 0 / 0.00 MB |
| Scheme legacy | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme external remaining | 2 / 0.00 MB | 0 / 0.00 MB |
| Scheme PNG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme JPG remaining | 1 / 0.00 MB | 0 / 0.00 MB |
| Scheme failed | 1 / 0.00 MB | 0 / 0.00 MB |
| Repeated network downloads | 0 | 0 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 52 | 9.21 MB | 0.00 MB |
| thumb | 137 | 8.14 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 289 | 8.01 MB | 0.38 MB |

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
| Scheme external requests | 2 | 0 |
| Scheme external resource | 0.00 MB | 0.00 MB |
| Scheme PNG requests | 0 | 0 |
| Scheme PNG resource | 0.00 MB | 0.00 MB |
| Scheme JPG requests | 1 | 0 |
| Scheme JPG resource | 0.00 MB | 0.00 MB |
| Scheme failed requests | 1 | 0 |
| Scheme failed resource | 0.00 MB | 0.00 MB |

## 5. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 44 | 0.79 MB | 0.93 MB | 4 | 11 | 0.34 MB | 0 | 0.00 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 10 | 0.38 MB |
| catalog-initial | 82 | 0.16 MB | 2.57 MB | 37 | 40 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 43 | 2.11 MB |
| catalog-scroll | 63 | 0.16 MB | 0.61 MB | 8 | 8 | 0.44 MB | 7 | 0.41 MB | 3 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 0.41 MB |
| map-open | 88 | 0.08 MB | 1.42 MB | 73 | 73 | 1.21 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 79 | 0.02 MB | 2.57 MB | 34 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 2.11 MB |
| detail-total | 1065 | 2.03 MB | 31.41 MB | 225 | 293 | 19.01 MB | 130 | 14.56 MB | 420 | 10.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 0.04 MB | 345 | 22.08 MB |
| detail-page | 1010 | 2.03 MB | 24.36 MB | 170 | 248 | 11.97 MB | 88 | 7.52 MB | 420 | 10.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 0.04 MB | 290 | 15.04 MB |
| detail-gallery | 35 | 0.00 MB | 5.96 MB | 35 | 35 | 5.96 MB | 34 | 5.96 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 35 | 5.96 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 20 | 0.00 MB | 1.09 MB | 20 | 10 | 1.09 MB | 8 | 1.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 1.09 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 949 | 3.00 MB | 15.58 MB | 50 | 30 | 0.43 MB | 0 | 0.00 MB | 518 | 12.89 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 25 | 3.84 MB |

## 6. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.10 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/vovkove | vovkove | 56 | 0.10 MB | 2.14 MB | 1.52 MB | 3 | 5 | yes | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.10 MB | 1.97 MB | 1.35 MB | 3 | 3 | yes | 2 |
| /lakes/white-horvat | white-horvat | 53 | 0.10 MB | 1.90 MB | 1.28 MB | 3 | 4 | no | 2 |
| /lakes/karpych | karpych | 54 | 0.10 MB | 1.89 MB | 1.27 MB | 3 | 3 | yes | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 7. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb_webp | 0 | 0.00 MB | n/a | n/a |
| lake_thumb_legacy | 0 | 0.00 MB | n/a | n/a |
| lake_medium_webp | 0 | 0.00 MB | n/a | n/a |
| lake_medium_legacy | 0 | 0.00 MB | n/a | n/a |
| lake_original | 0 | 0.00 MB | n/a | n/a |
| lake_legacy_image_url | 0 | 0.00 MB | n/a | n/a |
| scheme_images | 9 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_webp | 8 | 1.09 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp | 0.26 MB |
| scheme_legacy | 0 | 0.00 MB | n/a | n/a |
| scheme_external | 1 | 0.00 MB | /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg | 0.00 MB |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| map_tiles | 20 | 0.47 MB | /light_all/7/70/43.png | 0.03 MB |
| js_bundles | 20 | 3.07 MB | /gtag/js | 0.15 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 20 | 0.03 MB | /api/weather | 0.00 MB |
| unknown_external | 20 | 5.17 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/e740d322-a3ef-4bae-9f43-3b213eeb75ce/medium/89556c423492e09b550ba28b213a81e9d7b6fcaef680bdc46411b97befb6ff5a.jpg | 0.53 MB |

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
| js_bundle_too_high | 1 |

## 10. Recommendations generated from detected data
- Scheme images are still expensive (1.09 MB across top offenders: /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp (0.26 MB), /storage/v1/object/public/lake-images/lakes/353d8141-764b-46ec-9865-027656da4d24/scheme/40081cdb32b44d7ff2b098f208a656b2e7163e0cd56fb1485f64914c87727bef.webp (0.21 MB), /storage/v1/object/public/lake-images/lakes/6c2ab506-a809-4a80-b02a-b84db786ad22/scheme/e1cd7d7fa9645d33d9c157f307cd19ce3687c9bde139a98e2085c2b20fa2ffde.webp (0.17 MB)). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.
- Scheme external remaining: 0.00 MB across /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg (0.00 MB).
- Scheme failed/unreachable: 0.00 MB across /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg (0.00 MB).
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- JS bundle weight is high (12.89 MB). Inspect the bundle analyzer and split heavy code paths with dynamic imports. Top route bundles: /lakes (0.77 MB, unique: .next/static/chunks/0xot5i8x1.v15.js, .next/static/chunks/0bjmub5oei784.js); / (0.65 MB, unique: .next/static/chunks/0ij.u5h_n5lg3.js); /lakes/[slug] (0.61 MB, unique: .next/static/chunks/14zi2gif_h7mn.js); /lakes/add (0.55 MB, unique: .next/static/chunks/0g4w_625xbtex.js). Top network JS resources: /gtag/js (0.15 MB), /gtag/js (0.15 MB), /gtag/js (0.15 MB).
