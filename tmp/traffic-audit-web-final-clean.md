# Traffic Audit: web-final-clean

## 1. Executive Summary
- Base URL: http://127.0.0.1:3000
- Cold detail pages visited: 20
- Warm detail pages visited: 0
- Total detail pages visited: 20
- Cold transfer: 1.69 MB
- Cold resource: 12.30 MB
- Warm transfer: 0.00 MB
- Warm resource: 0.00 MB
- Cold violations: 0
- Warm violations: 0

## 2. Cold vs Warm
| Metric | Cold | Warm |
| --- | --- | --- |
| Total requests | 776 | 0 |
| Known transfer | 1.69 MB | 0.00 MB |
| Known resource | 12.30 MB | 0.00 MB |
| Image resource | 8.79 MB | 0.00 MB |
| Supabase Storage resource | 8.14 MB | 0.00 MB |
| Scheme WebP | 0 / 0.00 MB | 0 / 0.00 MB |
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
| medium | 0 | 0.00 MB | 0.00 MB |
| thumb | 137 | 8.14 MB | 0.00 MB |
| legacy | 0 | 0.00 MB | 0.00 MB |
| placeholder | 2 | 0.28 MB | 0.14 MB |
| unknown | 35 | 0.37 MB | 0.38 MB |

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
| Scheme WebP requests | 0 | 0 |
| Scheme WebP resource | 0.00 MB | 0.00 MB |
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
| home | 34 | 1.26 MB | 1.25 MB | 1 | 10 | 0.33 MB | 0 | 0.00 MB | 23 | 0.91 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 7 | 0.22 MB |
| catalog-initial | 59 | 0.20 MB | 1.96 MB | 31 | 32 | 1.88 MB | 30 | 1.74 MB | 26 | 0.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 30 | 1.74 MB |
| catalog-scroll | 8 | 0.03 MB | 0.44 MB | 7 | 8 | 0.44 MB | 7 | 0.41 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 7 | 0.41 MB |
| map-open | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| map-popup | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| catalog-return | 59 | 0.01 MB | 1.94 MB | 31 | 32 | 1.88 MB | 30 | 1.74 MB | 26 | 0.06 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 30 | 1.74 MB |
| detail-total | 570 | 0.17 MB | 6.61 MB | 90 | 90 | 4.26 MB | 70 | 4.26 MB | 460 | 2.35 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 70 | 4.26 MB |
| detail-page | 570 | 0.17 MB | 6.61 MB | 90 | 90 | 4.26 MB | 70 | 4.26 MB | 460 | 2.35 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 70 | 4.26 MB |
| detail-gallery | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-weather | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| detail-scheme | 0 | 0.00 MB | 0.00 MB | 0 | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| privacy-terms | 46 | 0.03 MB | 0.09 MB | 2 | 2 | 0.00 MB | 0 | 0.00 MB | 42 | 0.09 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |
| static | 632 | 1.47 MB | 3.94 MB | 25 | 30 | 0.43 MB | 0 | 0.00 MB | 577 | 3.51 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB | 0 | 0.00 MB |

## 7. Top Expensive Detail Pages
### Cold
| Lake | Slug | Requests | Transfer | Resource | Image resource | Medium | Thumb | Scheme loaded | Weather requests |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| /lakes/ozero-pidkova | ozero-pidkova | 30 | 0.01 MB | 1.37 MB | 0.55 MB | 0 | 5 | no | 0 |
| /lakes/white-horvat | white-horvat | 29 | 0.01 MB | 1.26 MB | 0.44 MB | 0 | 4 | no | 0 |
| /lakes/vovkove | vovkove | 30 | 0.01 MB | 0.37 MB | 0.33 MB | 0 | 5 | no | 0 |
| /lakes/gold-fish-club | gold-fish-club | 30 | 0.01 MB | 0.37 MB | 0.33 MB | 0 | 5 | no | 0 |
| /lakes/fishing-park | fishing-park | 30 | 0.01 MB | 0.31 MB | 0.27 MB | 0 | 5 | no | 0 |

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
| scheme_images | 0 | 0.00 MB | n/a | n/a |
| scheme_webp | 0 | 0.00 MB | n/a | n/a |
| scheme_legacy | 0 | 0.00 MB | n/a | n/a |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| map_tiles | 0 | 0.00 MB | n/a | n/a |
| js_bundles | 20 | 2.21 MB | /_next/static/chunks/node_modules_next_dist_compiled_next-devtools_index_0553esy.js | 0.21 MB |
| css | 0 | 0.00 MB | n/a | n/a |
| fonts | 0 | 0.00 MB | n/a | n/a |
| weather | 0 | 0.00 MB | n/a | n/a |
| unknown_external | 20 | 2.35 MB | /storage/v1/object/public/lake-images/lakes/d5d7c7b1-2dc8-4179-850d-2476b3156c10/2cabaf61-6420-4af6-9b01-7447c7c0185c/thumb/92d951fe787de99fd136f85766d3c6308b7492e87b0c1b26848768fccdfe2769.jpg | 0.19 MB |

## 9. Top Remaining Scheme Offenders
| Bucket | Requests | Resource | Top offender | Top offender bytes |
| --- | --- | --- | --- | --- |
| scheme_external | 0 | 0.00 MB | n/a | n/a |
| scheme_png | 0 | 0.00 MB | n/a | n/a |
| scheme_jpeg | 0 | 0.00 MB | n/a | n/a |
| top20SchemeFailed | 0 | 0.00 MB | n/a | n/a |

## 10. Violations/regressions
- None

## 11. Recommendations generated from detected data
- No material hotspots were detected from the current thresholds.
