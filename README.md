# OV-NOCS: Annotation pipeline & Large-scale canonicalized dataset

Interactive research presentation of shape canonicalization, paired object renders and object-to-scene coordinates.

- **Website:** https://andzy324.github.io/ov-nocs/
- **Personal homepage:** https://andzy324.github.io/#ov-nocs

## Edit and preview

The editable website and every runtime asset are tracked in `site/`. No framework, dependency install, CDN, backend, API key, or full dataset download is needed.

```sh
python3 -m http.server 8000 --directory site
```

Open http://localhost:8000. Update prose and layout in `site/index.html`, styling in `site/styles.css`, and interactions in `site/app.js`, `site/research.js`, `site/canonical-view.js`, `site/coverage.js`, or `site/collection.js`. Measured display data lives in the neighboring `*-data.js` files. Images, videos and posters live in `site/assets/`; publication-resolution method figures are in `figures/`.

After replacing media, refresh its tracked inventory:

```sh
python3 scripts/asset_manifest.py
python3 scripts/check_site.py
```

All links and asset paths are relative, so the site works at the `/ov-nocs/` project URL as well as on a local server.

## Publish and repair

Push changes to a branch and open a pull request to run validation. Merge reviewed changes into `main` to deploy the `site/` directory through GitHub Actions. Only that directory is published; the repository also retains figure originals and maintenance scripts. A repair uses the same process and keeps the website URL. Revert the relevant commit to restore an earlier version.

## Displayed results

- Nine selected instances: two teapots, two cabinets, three bottles and two mugs; 72 paired final views.
- Each instance has 16 RGB-D input views and 4,096 DINOv2 surface descriptors. Matching uses 2,048 keypoints, four yaw candidates, and recorded correspondence-based residual-yaw scores.
- Explicit reference directions initialize canonical orientation. One cabinet includes a separately recorded orientation refinement after matching; candidate selection and reviewed exports remain distinct in the presentation.
- The object atlas covers 134,644 source-category catalogue entries across 1,100 groups from complete metadata inventories and the Objaverse alignment table. The catalogue is independent of locally retrieved meshes. Reported orientations and validated renders have separate coverage indicators; absent reports remain unknown. See `site/catalogue-statistics.json` for exact sources and scopes.
- HSSD scene coordinates demonstrate composition between canonical frames and scene-instance transforms.

Canonical visualization is right-handed, +Z up and +Y front. Uniform max-side mesh normalization and per-axis rendered NOCS normalization are explained on the page. Feature PCA colors are visual projections of descriptors.

## Assets and attribution

See [ASSETS.md](ASSETS.md) and [assets.json](assets.json). The repository contains the assets required by this website, including mesh geometry encoded in `site/canonical-data.js` and surface/matching/scene display data. It does not redistribute the complete source datasets, original research repositories, checkpoints or private experiment logs. Dataset assets retain their original terms; inclusion here does not grant a new blanket dataset license.
