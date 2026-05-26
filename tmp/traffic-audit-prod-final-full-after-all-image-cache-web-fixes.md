# Traffic Audit: prod-final-full-after-all-image-cache-web-fixes

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 41
- Warm detail pages visited: 41
- Total detail pages visited: 82
- Cold transfer: 1.79 MB
- Cold resource: 46.82 MB
- Warm transfer: 0.40 MB
- Warm resource: 47.03 MB
- Cold violations: 1
- Warm violations: 1

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 2378 | 2409 |
| Known transfer | 1.79 MB | 0.40 MB |
| Known resource | 46.82 MB | 47.03 MB |
| Image resource | 25.03 MB | 25.15 MB |
| Supabase Storage resource | 13.35 MB | 13.47 MB |
| Scheme WebP | 8 / 1.09 MB | 8 / 1.09 MB |
| Scheme legacy | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme external remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme PNG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme JPG remaining | 0 / 0.00 MB | 0 / 0.00 MB |
| Scheme failed | 0 / 0.00 MB | 0 / 0.00 MB |
| Repeated network downloads | 0 | 731 |

## 3. Variant Breakdown
### Cold
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 0 | 0.00 MB | 0.00 MB |
| thumb | 217 | 12.26 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 453 | 12.49 MB | 0.38 MB |

### Warm
| Variant | Requests | Resource | Transfer |
| --- | --- | --- | --- |
| original | 0 | 0.00 MB | 0.00 MB |
| medium | 0 | 0.00 MB | 0.00 MB |
| thumb | 219 | 12.38 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.00 MB |
| unknown | 463 | 12.48 MB | 0.01 MB |

## 4. Scheme Breakdown
| Metric | Cold | Warm |
| --- | --- | --- |
| Scheme WebP requests | 8 | 8 |
| Scheme WebP resource | 1.09 MB | 1.09 MB |
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
| home | 39 | 0.63 MB | 0.78 MB | 5 | 10 | 0.33 MB | 0 | 0.00 MB | 17 | 0.43 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.37 MB |
| catalog-initial | 57 | 0.16 MB | 2.28 MB | 34 | 32 | 1.88 MB | 30 | 1.74 MB | 18 | 0.41 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 33 | 1.89 MB |
| catalog-scroll | 63 | 0.06 MB | 0.69 MB | 8 | 15 | 0.66 MB | 7 | 0.41 MB | 1 | 0.01 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 15 | 0.63 MB |
| map-open | 93 | 0.07 MB | 1.36 MB | 83 | 74 | 1.24 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 87 | 0.02 MB | 2.71 MB | 40 | 43 | 2.29 MB | 34 | 1.93 MB | 17 | 0.40 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 45 | 2.30 MB |
| detail-total | 1956 | 0.81 MB | 37.72 MB | 328 | 482 | 18.19 MB | 154 | 9.27 MB | 822 | 18.90 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 574 | 24.48 MB |
| detail-page | 1940 | 0.81 MB | 36.64 MB | 312 | 474 | 17.10 MB | 146 | 8.18 MB | 822 | 18.90 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 62 | 0.06 MB | 558 | 23.40 MB |
| detail-gallery | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 16 | 0.00 MB | 1.09 MB | 16 | 8 | 1.09 MB | 8 | 1.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 16 | 1.09 MB |
| privacy-terms | 68 | 0.03 MB | 1.27 MB | 10 | 16 | 0.44 MB | 0 | 0.00 MB | 34 | 0.82 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.74 MB |
| static | 1592 | 1.50 MB | 22.20 MB | 107 | 52 | 0.46 MB | 0 | 0.00 MB | 916 | 21.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 46 | 7.07 MB |

## 7. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/vovkove | vovkove | 51 | 0.02 MB | 1.29 MB | 0.82 MB | 0 | 5 | yes | 2 |
| /lakes/ozero-pidkova | ozero-pidkova | 49 | 0.02 MB | 1.25 MB | 0.77 MB | 0 | 5 | no | 2 |
| /lakes/try-husaka-baza-vidpochynku | try-husaka-baza-vidpochynku | 47 | 0.02 MB | 1.19 MB | 0.72 MB | 0 | 5 | no | 0 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 49 | 0.02 MB | 1.15 MB | 0.67 MB | 0 | 3 | yes | 2 |
| /lakes/white-horvat | white-horvat | 48 | 0.02 MB | 1.13 MB | 0.66 MB | 0 | 4 | no | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/vovkove | vovkove | 51 | 0.01 MB | 1.29 MB | 0.82 MB | 0 | 5 | yes | 2 |
| /lakes/ozero-pidkova | ozero-pidkova | 49 | 0.01 MB | 1.25 MB | 0.77 MB | 0 | 5 | no | 2 |
| /lakes/try-husaka-baza-vidpochynku | try-husaka-baza-vidpochynku | 47 | 0.00 MB | 1.19 MB | 0.72 MB | 0 | 5 | no | 0 |
| /lakes/vidpochynok-klub-rybalok | vidpochynok-klub-rybalok | 54 | 0.01 MB | 1.15 MB | 0.67 MB | 0 | 3 | yes | 2 |
| /lakes/white-horvat | white-horvat | 48 | 0.01 MB | 1.13 MB | 0.66 MB | 0 | 4 | no | 2 |

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
| unknown_external | 20 | 2.47 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |

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
| js_repeated_downloads_too_high | 2 |

## 11. Recommendations generated from detected data
- Scheme images are still expensive (1.09 MB across top offenders: /storage/v1/object/public/lake-images/lakes/8a22c6a3-f3d1-4eab-8f79-ed38d5dc9559/scheme/d5e79fa3c4118b9875402581b9a240384f056269aa731bd5fafd80338c4e45f9.webp (0.26 MB), /storage/v1/object/public/lake-images/lakes/353d8141-764b-46ec-9865-027656da4d24/scheme/40081cdb32b44d7ff2b098f208a656b2e7163e0cd56fb1485f64914c87727bef.webp (0.21 MB), /storage/v1/object/public/lake-images/lakes/6c2ab506-a809-4a80-b02a-b84db786ad22/scheme/e1cd7d7fa9645d33d9c157f307cd19ce3687c9bde139a98e2085c2b20fa2ffde.webp (0.17 MB)). Migrate scheme assets into the optimized Storage pipeline, then serve WebP thumb/full variants from immutable hashed paths.
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
- Warm transfer is still non-zero. Inspect cache headers and confirm repeat requests are being served from cache.
- Repeated warm downloads are visible but transfer remains low (731 requests, 0.34 MB). Keep this as a low-priority cache-header follow-up.
