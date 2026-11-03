# Website assets

Every image, video, poster, display mesh and interactive point/transform dataset required at runtime is stored in this repository. There are no external media/CDN requests.

| Location | Contents |
| --- | --- |
| `site/assets/batch-*` | Native figures and RGB inputs from the selected multi-category pipeline runs |
| `site/assets/*-rgb-*`, `*-mask-*`, `*-nocs-*` | Selected paired object-render examples |
| `site/assets/coverage-*` | Locally retrieved category preview images |
| `site/assets/scene-*` | Scene visualizations for Hypersim, V-KITTI, Real275 and the HSSD layout fallback |
| `site/assets/annotation-workflow.mp4` and poster | Canonicalization-tool demonstration |
| `site/assets/dataset-turntable-original.mp4` and poster | Original-resolution RGB/NOCS turntable stream used by the presentation |
| `site/canonical-data.js` | Nine display meshes, normals, triangle indices, frame transforms and review metadata |
| `site/feature-data.js`, `algorithm-data.js` | Surface descriptors projected for visualization and measured matching traces |
| `site/scene-data.js` | HSSD sampled surfaces, scene transforms, bounding boxes and example metadata |
| `site/coverage-data.js` | Complete source-catalogue counts, report-based stage indicators, representative IDs and atlas positions |
| `figures/` | Publication-resolution PNG counterparts of the multi-category figures |

Named data sources include Objaverse-XL, Omni6DPose, 3D-FUTURE, HSSD, ShapeNet, Hypersim, V-KITTI and Real275. Existing method diagrams, scene images and demonstration videos were retained from the project presentation; new figures are derived from recorded local runs. Source dataset and media terms remain applicable. This is a project presentation, not the complete dataset release.

`assets.json` records repository-relative filenames, byte counts and SHA-256 hashes. Private machine paths and raw experiment logs are not included.

The annotation demonstration is a 14.5-second chronological edit at native playback speed. Seven excerpts retain category browsing, cluster inspection, instance selection, canonicalization and result review. Editorial crops enlarge the 3D viewport, with synchronized control/viewport framing for the canonicalization action. Idle intervals and OBS windows are omitted. See `media-edits.json` for exact intervals and framing.

`site/catalogue-statistics.json` preserves the source filenames, SHA-256 hashes, scope, complete per-category counts and coverage notes behind the 131,352-entry / 1,091-group atlas. Counts describe catalogue memberships, not a claim of complete processing or a deduplicated union. Objaverse uses the 434-category alignment summary (44,473 entries), corroborated by the Drive progress workbook. 3D-FUTURE excludes 1,751 entries without a category. The other datasets use summary_all_filtered_sheets.xlsx, including 4,302 available Omni6DPose models and 15,293 HSSD entries in 400 condensed categories. Missing reports are null. Local preview availability does not determine category sizes.

Category result panels pair native alignment overview sheets with synchronized RGB/NOCS examples. Objaverse examples are extracted from read-only HDF5 render packages on the external archive (view 25 of 150); existing website render samples supplement the other datasets. Rendered HDF5 frames use the same foreground-mask bounding box for RGB and NOCS, with 12% padding, to improve readability. Images open at full stored resolution. The 3D-FUTURE render report covers 14,809 instances in 49 categories. All 14,812 classified canonical mesh exports were independently verified as nonempty and match the workbook category counts. ShapeNet counts use the maximum validated count per category across the two batch reports after subtracting invalid packages; overlapping car batches are not summed.

`site/assets/category-frame-*.png` contains 629 unmodified coordinate-frame PNGs embedded in `src/build_metadata/dataset_info.xlsx`. Dataset/category keys and image anchor rows determine the mapping; 21 unmatched source rows are retained in the statistics audit. Preview instance IDs and workbook rows are shown under Source details. Workbook processing counts do not replace catalogue counts. `site/catalogue-counts.csv` records every catalogue count with its original source category, sheet and row. `scripts/check_catalogue.py` validates the display data, statistical export, stage flags, source count table and image hashes. Case-distinct source labels remain distinct; the render report for `cannon` is not also assigned to `Cannon`.
