# Traffic Audit: prod-breakdown

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 41
- Warm detail pages visited: 41
- Total detail pages visited: 82
- Cold transfer: 5.35 MB
- Cold resource: 70.24 MB
- Warm transfer: 0.38 MB
- Warm resource: 70.29 MB
- Cold violations: 1
- Warm violations: 1

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 2599 | 2605 |
| Known transfer | 5.35 MB | 0.38 MB |
| Known resource | 70.24 MB | 70.29 MB |
| Image resource | 42.06 MB | 42.11 MB |
| Supabase Storage resource | 27.87 MB | 28.06 MB |
| Repeated network downloads | 0 | 759 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 102 | 15.73 MB | 0.00 MB |
| thumb | 214 | 12.13 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 478 | 13.91 MB | 0.39 MB |

### Warm
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 104 | 16.01 MB | 0.00 MB |
| thumb | 213 | 12.05 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.14 MB | 0.00 MB |
| unknown | 476 | 13.91 MB | 0.01 MB |

## 4. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 43 | 0.79 MB | 0.93 MB | 3 | 10 | 0.34 MB | 0 | 0.00 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.38 MB |
| catalog-initial | 87 | 0.25 MB | 2.71 MB | 32 | 39 | 2.10 MB | 30 | 1.74 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 38 | 2.11 MB |
| catalog-scroll | 55 | 0.07 MB | 0.47 MB | 8 | 8 | 0.44 MB | 7 | 0.41 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 0.41 MB |
| map-open | 79 | 0.07 MB | 1.28 MB | 74 | 73 | 1.21 MB | 0 | 0.00 MB | 4 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 74 | 1.21 MB |
| map-popup | 14 | 0.01 MB | 0.01 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| catalog-return | 94 | 0.02 MB | 2.88 MB | 37 | 42 | 2.27 MB | 33 | 1.91 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 43 | 2.29 MB |
| detail-total | 2159 | 4.10 MB | 60.62 MB | 457 | 608 | 35.24 MB | 246 | 23.81 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 703 | 41.54 MB |
| detail-page | 2053 | 4.10 MB | 48.32 MB | 351 | 511 | 22.94 MB | 181 | 13.81 MB | 861 | 21.48 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 597 | 29.24 MB |
| detail-gallery | 67 | 0.00 MB | 9.99 MB | 67 | 67 | 9.99 MB | 65 | 9.99 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 67 | 9.99 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 39 | 0.00 MB | 2.31 MB | 39 | 30 | 2.31 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 39 | 2.31 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 1686 | 4.91 MB | 28.27 MB | 92 | 49 | 0.15 MB | 0 | 0.00 MB | 959 | 23.89 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 46 | 7.07 MB |

## 5. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/vovkove | vovkove | 56 | 0.10 MB | 2.85 MB | 2.23 MB | 3 | 5 | yes | 2 |
| /lakes/korolok | korolok | 54 | 0.10 MB | 2.37 MB | 1.75 MB | 3 | 3 | yes | 2 |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.10 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/karpych | karpych | 54 | 0.10 MB | 1.95 MB | 1.33 MB | 3 | 3 | yes | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.10 MB | 1.94 MB | 1.32 MB | 3 | 3 | yes | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/vovkove | vovkove | 56 | 0.01 MB | 2.85 MB | 2.23 MB | 3 | 5 | yes | 2 |
| /lakes/korolok | korolok | 54 | 0.01 MB | 2.37 MB | 1.75 MB | 3 | 3 | yes | 2 |
| /lakes/ozero-pidkova | ozero-pidkova | 54 | 0.01 MB | 2.27 MB | 1.65 MB | 3 | 5 | no | 2 |
| /lakes/karpych | karpych | 54 | 0.01 MB | 1.95 MB | 1.33 MB | 3 | 3 | yes | 2 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.01 MB | 1.94 MB | 1.32 MB | 3 | 3 | yes | 2 |

## 6. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb | 20 | 2.47 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |
| lake_medium | 20 | 5.65 MB | /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/e740d322-a3ef-4bae-9f43-3b213eeb75ce/medium/89556c423492e09b550ba28b213a81e9d7b6fcaef680bdc46411b97befb6ff5a.jpg | 0.53 MB |
| scheme_images | 20 | 2.31 MB | /wp-content/uploads/2024/04/%D0%9F%D0%BB%D0%B0%D0%BD-%D0%BE%D0%B7%D0%B5%D1%80%D0%B0-%D0%B8%D1%82%D0%BE%D0%B3-04.png | 0.97 MB |
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

## 8. Recommendations generated from detected data
- Scheme images are still expensive (2.31 MB across top offenders: /wp-content/uploads/2024/04/%D0%9F%D0%BB%D0%B0%D0%BD-%D0%BE%D0%B7%D0%B5%D1%80%D0%B0-%D0%B8%D1%82%D0%BE%D0%B3-04.png (0.97 MB), /wp-content/uploads/2025/05/photo_2025-05-13-12.22.11.png (0.76 MB), /wp-content/uploads/2023/03/%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5_viber_2023-03-13_20-26-32-152.jpg (0.24 MB)). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- JS bundle weight is high (23.89 MB). Inspect the bundle analyzer and split heavy code paths with dynamic imports. Top route bundles: /lakes (0.77 MB, unique: .next/static/chunks/0m.mmb3vzbmno.js, .next/static/chunks/0wvtxgah4v.wg.js); / (0.65 MB, unique: .next/static/chunks/0ij.u5h_n5lg3.js); /lakes/[slug] (0.61 MB, unique: .next/static/chunks/14zi2gif_h7mn.js); /lakes/add (0.55 MB, unique: .next/static/chunks/0g4w_625xbtex.js). Top network JS resources: /gtag/js (0.15 MB), /gtag/js (0.15 MB), /gtag/js (0.15 MB).
- Warm transfer is still non-zero. Inspect cache headers and confirm repeat requests are being served from cache.
- Repeated warm downloads are visible but transfer remains low (759 requests, 0.30 MB). Keep this as a low-priority cache-header follow-up.
