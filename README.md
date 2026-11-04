# Pairwise

A private Sites image utility. The working app lives in `dist/` and runs entirely in the browser. No uploads, backend, database, AI connection, or Lara service is used. Files and generated results disappear when the page reloads; download what you want to keep.

## Behavior and decisions

- Select or drop multiple raster images; append or remove files before joining.
- Natural ascending English filename ordering, case-insensitive: img2 precedes img10. Identical names keep selection order.
- Choose a whole number of images per group, minimum 2, default 2. The final partial group is included, even if it has one image.
- Choose vertical or horizontal joining, maintaining input order.
- Preserve original pixel dimensions without cropping or resizing. Center on the shared axis at integer pixel coordinates; unused canvas stays transparent.
- Export each group as PNG and offer individual downloads plus a standard uncompressed ZIP. PNG compression already reduces image data, so ZIP needs no additional dependency.
- Supported input: PNG, JPEG, WebP, GIF, AVIF and BMP if the browser decodes them. Animated input uses its first frame. HEIC and SVG are not accepted.
- Reject files larger than 100 MB or 40 megapixels. Output limits are 16,384 pixels per side and 40 megapixels; excessive groups fail visibly while other groups can succeed. Large collections can still hit device memory limits; use smaller batches.

## Local setup and checks

No dependencies or build step. Use Node.js for tests and Python 3 for a local web server:

```sh
node --test tests/core.test.mjs
node --check dist/app.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173. Google Fonts are optional network styling; system fonts provide fallback. Image processing has no network path.

## Structure and ownership

- `dist/index.html`: accessible page structure and copy.
- `dist/style.css`: responsive presentation.
- `dist/core.mjs`: pure filename grouping, pixel layout, CRC32 and ZIP encoding.
- `dist/app.mjs`: transient UI state, file decoding, canvas export and Blob URL lifecycle.
- `tests/core.test.mjs`: deterministic behavioral tests.
- `.openai/hosting.json`: Sites identity and static deployment configuration.

## Browser acceptance procedure

Manual testing is needed because canvas decoding and browser downloads cannot be established by pure unit tests.

1. Create four synthetic solid-color PNGs: img1 (20×10 red), img2 (10×30 green), img3 (15×15 yellow), img10 (40×20 blue). Select them out of order.
2. Set group size to 3. Expect img1 + img2 + img3, followed by img10 alone.
3. Join vertically. First output must be 20×55, in red/green/yellow order with transparent centering and no resizing. Download the PNG.
4. Download ZIP. Open it with an ordinary archive reader; entries must match all successful individual PNGs and have no CRC errors.
5. Switch horizontally, regenerate. First output must be 45×30 in the same order.
6. Enter 0, 1 or a fractional group size. Generation must be disabled. Restore 2 and remove/add a file; grouping must update and old results must disappear.
7. Try a corrupt PNG and a nonimage. They must be reported and excluded before pairing. Try oversized output; show a group-specific error, preserving successful groups.
8. Check keyboard focus, narrow layout, both direction states, clear and regeneration.

Pass if ordering, grouping, dimensions, direction and downloaded content match. Record revision, browser, fixture dimensions, output sizes and archive validation; keep private image contents out of project files. Cleanup: delete only synthetic fixtures/downloads if desired; preserve originals.

## Current verification and remaining plan

2026-11-04: automated tests and syntax validation passed. Browser tested group-size changes to 3, vertical and horizontal generation, and PNG/ZIP downloads. Synthetic first group dimensions were 20×55 vertical and 45×30 horizontal. Downloaded ZIP contained three PNGs with all CRCs valid; its first PNG matched the individual download. Layout had no horizontal overflow at the observed 596px width. Final whole-pixel centering is covered by automated regression test; browser rendering after that small adjustment is not separately rerun.

Not run: comprehensive keyboard/accessibility audit, other browsers/devices, memory stress test, browser corrupt/oversized-file paths. No CI configured for this small Sites repository.

Delivery plan: implement → automated checks → browser generation/download checks → private Sites publication. No adjustments needed beyond the requested configurable group size: client-side processing satisfies the workflow without remote storage or services. Publication success is recorded by the Sites deployment response. Remaining checks above are limitations, not claims of acceptance.

## Publishing and recovery

The Sites skill helper packages `dist/` with the hosting manifest, synchronizes source, then deploys a saved version privately. No runtime migrations or persistent data. Recovery: redeploy a previously saved Sites version; original images are never modified. Source changes should use a dedicated branch and focused commits with explanatory bodies. This is a Sites-managed repository, not a newly created GitHub repository; GitHub issues/PR/CI setup is outside this delivery.
