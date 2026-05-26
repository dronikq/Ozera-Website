# Traffic Audit: prod-after-scheme-classification-check

## 1. Executive Summary
- Base URL: https://www.ozera.in.ua
- Cold detail pages visited: 5
- Warm detail pages visited: 0
- Total detail pages visited: 5
- Cold transfer: 1.74 MB
- Cold resource: 16.63 MB
- Warm transfer: 0.00 MB
- Warm resource: 0.00 MB
- Cold violations: 0
- Warm violations: 0

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 691 | 0 |
| Known transfer | 1.74 MB | 0.00 MB |
| Known resource | 16.63 MB | 0.00 MB |
| Image resource | 10.76 MB | 0.00 MB |
| Supabase Storage resource | 7.04 MB | 0.00 MB |
| Scheme storage | 1 / 0.05 MB | 0 / 0.00 MB |
| Scheme WebP | 1 / 0.05 MB | 0 / 0.00 MB |
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
| medium | 11 | 1.74 MB | 0.00 MB |
| thumb | 92 | 5.25 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.14 MB | 0.14 MB |
| unknown | 159 | 3.64 MB | 0.38 MB |

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
| Scheme storage requests | 1 | 0 |
| Scheme storage resource | 0.05 MB | 0.00 MB |
| Scheme WebP requests | 1 | 0 |
| Scheme WebP resource | 0.05 MB | 0.00 MB |
| Scheme external requests | 0 | 0 |
| Scheme external resource | 0.00 MB | 0.00 MB |
| Scheme PNG requests | 0 | 0 |
| Scheme PNG resource | 0.00 MB | 0.00 MB |
| Scheme JPG requests | 0 | 0 |
| Scheme JPG resource | 0.00 MB | 0.00 MB |
| Scheme failed requests | 0 | 0 |
| Scheme failed resource | 0.00 MB | 0.00 MB |

## 5. Route/Phase Breakdown Table
> `detail-total` is a rollup over all requests attributed to detail pages. `static` groups static assets by category so the page-flow phases stay readable.
| Phase | Requests | Transfer | Resource | Unknown transfer | Images | Image resource | Supabase storage | Storage resource | JS | JS resource | CSS | CSS resource | Fonts | Font resource | Tiles | Tile resource | Weather | Weather resource | External | External resource |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| home | 43 | 0.79 MB | 0.93 MB | 3 | 10 | 0.34 MB | 0 | 0.00 MB | 20 | 0.50 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 9 | 0.38 MB |
| catalog-initial | 70 | 0.15 MB | 2.56 MB | 34 | 39 | 2.10 MB | 30 | 1.74 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 40 | 2.11 MB |
| catalog-scroll | 53 | 0.14 MB | 0.59 MB | 12 | 8 | 0.44 MB | 7 | 0.41 MB | 3 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 0.41 MB |
| map-open | 90 | 0.08 MB | 1.42 MB | 73 | 73 | 1.21 MB | 0 | 0.00 MB | 7 | 0.10 MB | 0 | 0.00 MB | 0 | 0.00 MB | 73 | 1.21 MB | 0 | 0.00 MB | 73 | 1.21 MB |
| map-popup | 15 | 0.01 MB | 0.01 MB | 1 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 1 | 0.00 MB |
| catalog-return | 85 | 0.02 MB | 2.84 MB | 41 | 47 | 2.37 MB | 37 | 2.15 MB | 17 | 0.45 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 47 | 2.52 MB |
| detail-total | 267 | 0.52 MB | 6.95 MB | 57 | 71 | 3.86 MB | 30 | 2.74 MB | 105 | 2.62 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 10 | 0.01 MB | 86 | 4.62 MB |
| detail-page | 257 | 0.52 MB | 5.85 MB | 47 | 62 | 2.75 MB | 22 | 1.64 MB | 105 | 2.62 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 10 | 0.01 MB | 76 | 3.52 MB |
| detail-gallery | 8 | 0.00 MB | 1.05 MB | 8 | 8 | 1.05 MB | 7 | 1.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 8 | 1.05 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 2 | 0.00 MB | 0.05 MB | 2 | 1 | 0.05 MB | 1 | 0.05 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 2 | 0.05 MB |
| privacy-terms | 68 | 0.03 MB | 1.33 MB | 8 | 16 | 0.45 MB | 0 | 0.00 MB | 34 | 0.86 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 20 | 0.75 MB |
| static | 405 | 1.36 MB | 6.01 MB | 25 | 14 | 0.15 MB | 0 | 0.00 MB | 203 | 5.03 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 10 | 1.54 MB |

## 6. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/fishing-park | fishing-park | 55 | 0.10 MB | 1.64 MB | 1.02 MB | 3 | 5 | no | 2 |
| /lakes/trident-lake | trident-lake | 56 | 0.10 MB | 1.52 MB | 0.90 MB | 3 | 5 | yes | 2 |
| /lakes/avanfish | avanfish | 55 | 0.12 MB | 1.49 MB | 0.87 MB | 3 | 3 | no | 2 |
| /lakes/gold-fish-club | gold-fish-club | 54 | 0.10 MB | 1.46 MB | 0.84 MB | 2 | 5 | no | 2 |
| /lakes/kunka-kunka | kunka-kunka | 47 | 0.10 MB | 0.84 MB | 0.22 MB | 0 | 0 | no | 2 |

### Warm
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |

## 7. Top Offenders by Category
| Category | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| lake_thumb | 20 | 1.91 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |
| lake_medium | 11 | 1.74 MB | /storage/v1/object/public/lake-images/lakes/067646b0-9cc4-458a-95c7-076da74a0af7/2deb0cfb-bb22-47b8-a70c-7d105ed689b3/medium/47f493778ae604c174405a53cbb2e37da8484eadaa8e1a54c585d8fccf7bd806.jpg | 0.23 MB |
| scheme_images | 1 | 0.05 MB | /storage/v1/object/public/lake-images/lakes/d0ebb1ce-f18b-474e-8146-ce9c9d5958bd/scheme/0fadfb1694db306f5baf802967dac2296ce174feaff72e229d61d75e36ae5a93.webp | 0.05 MB |
| scheme_storage | 1 | 0.05 MB | /storage/v1/object/public/lake-images/lakes/d0ebb1ce-f18b-474e-8146-ce9c9d5958bd/scheme/0fadfb1694db306f5baf802967dac2296ce174feaff72e229d61d75e36ae5a93.webp | 0.05 MB |
| scheme_webp | 1 | 0.05 MB | /storage/v1/object/public/lake-images/lakes/d0ebb1ce-f18b-474e-8146-ce9c9d5958bd/scheme/0fadfb1694db306f5baf802967dac2296ce174feaff72e229d61d75e36ae5a93.webp | 0.05 MB |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| map_tiles | 20 | 0.47 MB | /light_all/7/70/43.png | 0.03 MB |
| js_bundles | 20 | 2.22 MB | /gtag/js | 0.15 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 10 | 0.01 MB | /api/weather | 0.00 MB |
| unknown_external | 20 | 1.33 MB | /premium_photo-1727538055174-92526593a254 | 0.07 MB |

## 8. Top Remaining Scheme Offenders
| Bucket | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| top20SchemeFailed | 0 | 0.00 MB | n/a | n/a |

## 9. Violations/regressions
- None

## 10. Recommendations generated from detected data
- Scheme storage WebP: 0.05 MB across /storage/v1/object/public/lake-images/lakes/d0ebb1ce-f18b-474e-8146-ce9c9d5958bd/scheme/0fadfb1694db306f5baf802967dac2296ce174feaff72e229d61d75e36ae5a93.webp (0.05 MB).
- Map tiles still cost traffic. Consider lazy-loading the map, shrinking the initial viewport, or improving tile cache behavior.
