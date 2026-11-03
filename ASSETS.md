# Website assets

Every image, video, poster, display mesh and interactive point/transform dataset required at runtime is stored in this repository. There are no external media/CDN requests.

| Location | Contents |
| --- | --- |
| `site/assets/batch-*` | Native figures and RGB inputs from the selected multi-category pipeline runs |
| `site/assets/*-rgb-*`, `*-mask-*`, `*-nocs-*` | Selected paired object-render examples |
| `site/assets/canonical-*` | Locally retrieved category preview images |
| `site/assets/scene-*` | Scene visualizations for Hypersim, V-KITTI, Real275 and the HSSD layout fallback |
| `site/assets/annotation.mp4` and poster | Canonicalization-tool demonstration |
| `site/assets/dataset-turntable-original.mp4` and poster | Original-resolution RGB/NOCS turntable stream used by the presentation |
| `site/canonical-data.js` | Nine display meshes, normals, triangle indices, frame transforms and review metadata |
| `site/feature-data.js`, `algorithm-data.js` | Surface descriptors projected for visualization and measured matching traces |
| `site/scene-data.js` | HSSD sampled surfaces, scene transforms, bounding boxes and example metadata |
| `site/coverage-data.js` | Dataset/category counts, instance IDs, stage indicators and atlas positions |
| `figures/` | Publication-resolution PNG counterparts of the multi-category figures |

Named data sources include Objaverse-XL, Omni6DPose, 3D-FUTURE, HSSD, ShapeNet, Hypersim, V-KITTI and Real275. Existing method diagrams, scene images and demonstration videos were retained from the project presentation; new figures are derived from recorded local runs. Source dataset and media terms remain applicable. This is a project presentation, not the complete dataset release.

`assets.json` records repository-relative filenames, byte counts and SHA-256 hashes. Private machine paths and raw experiment logs are not included.
