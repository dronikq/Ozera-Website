# Traffic Audit: Three-Stage Production Comparison

## A. Executive Summary
- True pre-optimization baseline report not found.
- Baseline-0 used here is approximate: [traffic-audit-prod-smoke.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-smoke.json).
- Traffic improved from BASELINE-0 to FINAL: cold total resource fell from 76.31 MB to 46.74 MB (-38.7%), and cold image resource fell from 48.97 MB to 24.87 MB.
- Warm/cache behavior improved in repeated request count, but not in transfer volume: warm total transfer moved from 0.39 MB to 0.40 MB, while repeated downloads still remained non-zero in FINAL (731 requests, 0.34 MB known transfer, 1.78 MB repeated resource bytes).
- The image pipeline cleaned up legacy and external scheme usage in FINAL: legacy requests are 0, scheme_external/scheme_jpeg/scheme_failed are 0, and original requests stayed at 0 across all three stages.
- Direct native memory was not measured; the audit only exposes resource-timing and request-level proxy metrics.

## B. Reports Used
- BASELINE-0: [traffic-audit-prod-smoke.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-smoke.json) (approximate)
- BASELINE-1: [traffic-audit-prod-after-scheme-webp.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-after-scheme-webp.json)
- FINAL: [traffic-audit-prod-final-full-after-all-fixes-v3.json](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-prod-final-full-after-all-fixes-v3.json)

## C. Coverage Table
| stage | report file | detail pages cold | detail pages warm | all lakes covered | partial |
| --- | --- | ---: | ---: | --- | --- |
| BASELINE-0 | [traffic-audit-prod-smoke.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-smoke.json) | 41 | 41 | yes | no |
| BASELINE-1 | [traffic-audit-prod-after-scheme-webp.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-after-scheme-webp.json) | 41 | 41 | yes | no |
| FINAL | [traffic-audit-prod-final-full-after-all-fixes-v3.json](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-prod-final-full-after-all-fixes-v3.json) | 41 | 41 | yes | no |

## D. Main Bytes Comparison
| metric | BASELINE-0 | BASELINE-1 | FINAL | delta B0 -> B1 | delta B1 -> FINAL | total delta B0 -> FINAL | percent change |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| cold total resource MB | 76.31 MB | 69.44 MB | 46.82 MB | -6.87 MB (-9.0%) | -22.62 MB (-32.6%) | -29.49 MB (-38.6%) | -38.6% |
| cold image resource MB | 48.97 MB | 41.26 MB | 25.03 MB | -7.71 MB (-15.7%) | -16.23 MB (-39.3%) | -23.94 MB (-48.9%) | -48.9% |
| cold storage resource MB | 33.13 MB | 29.38 MB | 13.35 MB | -3.75 MB (-11.3%) | -16.03 MB (-54.6%) | -19.78 MB (-59.7%) | -59.7% |
| warm total resource MB | 75.81 MB | 68.98 MB | 47.03 MB | -6.83 MB (-9.0%) | -21.95 MB (-31.8%) | -28.78 MB (-38.0%) | -38.0% |
| warm image resource MB | 48.47 MB | 40.80 MB | 25.15 MB | -7.66 MB (-15.8%) | -15.65 MB (-38.4%) | -23.31 MB (-48.1%) | -48.1% |
| warm storage resource MB | 32.77 MB | 29.06 MB | 13.47 MB | -3.70 MB (-11.3%) | -15.59 MB (-53.6%) | -19.29 MB (-58.9%) | -58.9% |
| repeated transfer MB | 0.30 MB | 0.30 MB | 0.34 MB | -0.00 MB (-1.1%) | 0.04 MB (14.3%) | 0.04 MB (12.9%) | 12.9% |
| repeated hard bytes MB | n/a | n/a | 0.00 MB | n/a | n/a | n/a | n/a |
| JS unique MB | n/a | 23.89 MB | 21.05 MB | n/a | -2.84 MB (-11.9%) | n/a | n/a |

## E. Image Variant Comparison
| variant | BASELINE-0 | BASELINE-1 | FINAL | note |
| --- | ---: | ---: | ---: | --- |
| original | 0 | 0 | 0 | stays at 0 |
| legacy | 0 | 8 | 0 | cleared in FINAL |
| thumb | 0 | 216 | 217 | thumb remains dominant |
| medium | 218 | 103 | 0 | removed in FINAL |
| scheme_webp | n/a | 8 | 8 | webp scheme requests were normalized |
| scheme_external | n/a | 0 | 0 | final is clean |
| scheme_jpeg | n/a | 0 | 0 | final is clean |
| scheme_failed | n/a | 0 | 0 | final is clean |
| placeholder | 2 | 2 | 2 | stable |

## F. Violation Comparison
| violation | BASELINE-0 | BASELINE-1 | FINAL |
| --- | --- | --- | --- |
| original usage | no | no | no |
| legacy usage | no | yes | no |
| medium_too_high | no | no | no |
| map_loaded_many_images_initially | no | no | no |
| no_cache_header_on_public_api | no | no | no |
| js_unique_bundle_too_high | no | yes | no |
| js_repeated_downloads_too_high | no | no | no |
| scheme data offenders | n/a | present | no |
| huge_image_over_threshold | yes | no | no |
| public_ui_loaded_lake_image_without_variant | no | yes | no |
| legacy_lake_image_loaded | no | yes | no |

## G. Cache / Repeated Comparison
| metric | BASELINE-0 | BASELINE-1 | FINAL |
| --- | ---: | ---: | ---: |
| repeated downloads count | 757 | 750 | 731 |
| repeated transfer bytes | 316,330 B | 312,693 B | 357,276 B |
| repeated resource bytes | 4,680,321 B | 5,310,178 B | 1,871,100 B |
| repeated hard bytes | n/a | n/a | 0.00 MB |
| immutable repeated bytes | n/a | n/a | 13.40 MB |
| third-party repeated bytes | n/a | n/a | 7.17 MB |
| repeated hard bytes zero? | no direct measure | no direct measure | yes |

## H. Memory / Pressure
Direct native memory was not measured. Proxy metrics improved materially, and the audit exposes request/resource proxies only.

| proxy metric | BASELINE-0 | BASELINE-1 | FINAL |
| --- | ---: | ---: | ---: |
| total resource bytes (cold) | 76.31 MB | 69.44 MB | 46.74 MB |
| image resource bytes (cold) | 48.97 MB | 41.26 MB | 24.87 MB |
| repeated resource bytes | 4.46 MB | 5.06 MB | 1.78 MB |
| image requests | 694 | 770 | 672 |
| original / legacy requests | 0 / 0 | 0 / 8 | 0 / 0 |
| hidden map initial image burst status | no violation detected in selected prod reports | no violation detected in selected prod reports | no violation detected in selected prod reports |

## I. Final Verdict
Optimization goal met for traffic/cache/resource pressure. Direct native memory was not measured. Proxy metrics improved materially, cold/warm violations are empty, and `jsRepeatedHardBytes = 0`.

Ready to merge/deploy: yes for the traffic/cache/resource pressure goal.

## Stage Notes
- BASELINE-0: [traffic-audit-prod-smoke.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-smoke.json) (approximate); cold 41/82, warm 41/82, violations: huge_image_over_threshold
- BASELINE-1: [traffic-audit-prod-after-scheme-webp.json](/Users/qa/Desktop/Projects/Ozera-Website/traffic-audit-prod-after-scheme-webp.json); cold 41/82, warm 41/82, violations: legacy_lake_image_loaded, public_ui_loaded_lake_image_without_variant, legacy_loaded, js_bundle_too_high
- FINAL: [traffic-audit-prod-final-full-after-all-fixes-v3.json](/Users/qa/Desktop/Projects/Ozera-Website/tmp/traffic-audit-prod-final-full-after-all-fixes-v3.json); cold 41/82, warm 41/82, violations: none
