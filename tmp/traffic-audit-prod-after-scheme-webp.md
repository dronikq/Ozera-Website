# Traffic Audit: prod-after-scheme-webp

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 41
- Warm detail pages visited: 41
- Total detail pages visited: 82
- Cold transfer: 5.35 MB
- Cold resource: 69.44 MB
- Warm transfer: 0.40 MB
- Warm resource: 68.98 MB
- Cold violations: 18
- Warm violations: 18

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 2584 | 2583 |
| Known transfer | 5.35 MB | 0.40 MB |
| Known resource | 69.44 MB | 68.98 MB |
| Image resource | 41.26 MB | 40.80 MB |
| Supabase Storage resource | 29.38 MB | 29.06 MB |
| Repeated network downloads | 0 | 750 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 103 | 15.98 MB | 0.00 MB |
| thumb | 216 | 12.31 MB | 0.00 MB |
| legacy | 8 | 1.09 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 449 | 11.60 MB | 0.39 MB |

### Warm
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 103 | 15.98 MB | 0.00 MB |
| thumb | 212 | 12.00 MB | 0.00 MB |
| legacy | 8 | 1.09 MB | 0.00 MB |
| placeholder | 2 | 0.14 MB | 0.00 MB |
| unknown | 447 | 11.60 MB | 0.01 MB |

## 4. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 43 | 0.79 MB | 0.93 MB | 3 | 10 | 0.34 MB | 0 | 0.00 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.38 MB |
| catalog-initial | 81 | 0.17 MB | 2.57 MB | 34 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 2.11 MB |
| catalog-scroll | 66 | 0.16 MB | 0.61 MB | 8 | 8 | 0.44 MB | 7 | 0.41 MB | 3 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 0.41 MB |
| map-open | 90 | 0.08 MB | 1.42 MB | 73 | 73 | 1.21 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 82 | 0.02 MB | 2.92 MB | 39 | 44 | 2.46 MB | 35 | 2.09 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 45 | 2.47 MB |
| detail-total | 2139 | 4.10 MB | 59.65 MB | 437 | 588 | 34.27 MB | 255 | 25.14 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 683 | 40.57 MB |
| detail-page | 2052 | 4.10 MB | 48.32 MB | 350 | 511 | 22.94 MB | 181 | 13.81 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 596 | 29.24 MB |
| detail-gallery | 67 | 0.00 MB | 10.24 MB | 67 | 67 | 10.24 MB | 66 | 10.24 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 67 | 10.24 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 20 | 0.00 MB | 1.09 MB | 20 | 10 | 1.09 MB | 8 | 1.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 1.09 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 1687 | 4.91 MB | 28.27 MB | 92 | 49 | 0.15 MB | 0 | 0.00 MB | 959 | 23.89 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 46 | 7.07 MB |

## 5. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.10 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/vovkove | vovkove | 56 | 0.10 MB | 2.14 MB | 1.52 MB | 3 | 5 | no | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.10 MB | 1.97 MB | 1.35 MB | 3 | 3 | no | 2 |
| /lakes/white-horvat | white-horvat | 53 | 0.10 MB | 1.90 MB | 1.28 MB | 3 | 4 | no | 2 |
| /lakes/karpych | karpych | 54 | 0.10 MB | 1.89 MB | 1.27 MB | 3 | 3 | no | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.01 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/vovkove | vovkove | 56 | 0.01 MB | 2.14 MB | 1.52 MB | 3 | 5 | no | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.01 MB | 1.97 MB | 1.35 MB | 3 | 3 | no | 2 |
| /lakes/white-horvat | white-horvat | 53 | 0.01 MB | 1.90 MB | 1.28 MB | 3 | 4 | no | 2 |
| /lakes/karpych | karpych | 54 | 0.01 MB | 1.89 MB | 1.27 MB | 3 | 3 | no | 2 |

## 6. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb | 20 | 2.47 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |
| lake_medium | 20 | 5.65 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/e740d322-a3ef-4bae-9f43-3b213eeb75ce/medium/89556c423492e09b550ba28b213a81e9d7b6fcaef680bdc46411b97befb6ff5a.jpg | 0.53 MB |
| scheme_images | 1 | 0.00 MB | /v/t39.30808-6/472526906_122180941184057114_7080634231629371363_n.jpg | 0.00 MB |
| map_tiles | 20 | 0.47 MB | /light_all/7/70/43.png | 0.03 MB |
| js_bundles | 20 | 3.07 MB | /gtag/js | 0.15 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 20 | 0.03 MB | /api/weather | 0.00 MB |
| unknown_external | 20 | 1.48 MB | /premium_photo-1727538055174-92526593a254 | 0.07 MB |

## 7. Violations/regressions
| Violation | Count |
| --- | --- |
| js_bundle_too_high | 2 |
| legacy_lake_image_loaded | 16 |
| legacy_loaded | 2 |
| public_ui_loaded_lake_image_without_variant | 16 |

## 8. Recommendations generated from detected data
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- JS bundle weight is high (23.89 MB). Inspect the bundle analyzer and split heavy code paths with dynamic imports. Top route bundles: /lakes (0.77 MB, unique: .next/static/chunks/0m.mmb3vzbmno.js, .next/static/chunks/0wvtxgah4v.wg.js); / (0.65 MB, unique: .next/static/chunks/0ij.u5h_n5lg3.js); /lakes/[slug] (0.61 MB, unique: .next/static/chunks/14zi2gif_h7mn.js); /lakes/add (0.55 MB, unique: .next/static/chunks/0g4w_625xbtex.js). Top network JS resources: /gtag/js (0.15 MB), /gtag/js (0.15 MB), /gtag/js (0.15 MB).
- Warm transfer is still non-zero. Inspect cache headers and confirm repeat requests are being served from cache.
- Repeated warm downloads are visible but transfer remains low (750 requests, 0.30 MB). Keep this as a low-priority cache-header follow-up.
