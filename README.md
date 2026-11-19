# Pairwise

A browser-local image utility. [Source repository](https://github.com/JuliaMathias/pairwise) · [Hosted Pairwise](https://pairwise-image-joiner-jm.thejuliamathias.chatgpt.site) (ChatGPT sign-in and owner access required). The working app lives in `dist/` and runs entirely in the browser. Choose **Join images** for batches, or **Make a collage** for a framed composition of up to nine photos. No uploads, backend, database, AI connection, or Lara service is used. Files and generated results disappear when the page reloads; download what you want to keep.

## Behavior and decisions

- Select or drop multiple raster images; append or remove files before joining.
- Natural ascending English filename ordering, case-insensitive: img2 precedes img10. Identical names keep selection order.
- Choose a whole number of images per group, minimum 2, default 2. The final partial group is included, even if it has one image.
- Choose vertical or horizontal joining, maintaining input order.
- Optionally enter a group name used as a common download prefix, and a numbering offset. `Holiday` with offset `10` produces `Holiday-011.png`, `Holiday-012.png`, etc., in both individual downloads and `Holiday.zip`. Blank name preserves legacy `group-001-vertical.png` style; blank offset means zero. Offsets must be whole numbers from 0 through 999999999.
- A live preview shows the first filename. Names retain Unicode, replace characters unsafe in filenames, strip leading/trailing dots and spaces, avoid reserved device names and are limited to 80 characters. Naming changes clear existing results so regenerate before downloading.
- Join preserves original pixels by default, centering on a transparent background. Optional crop, solid background, proportional resize and colored borders are available, with a live preview and exact output dimensions. Drag the queue grip or use its buttons/arrow keys to reorder, and use Sort by name to restore natural ordering.
- Export each group as PNG and offer individual downloads plus a standard uncompressed ZIP. PNG compression already reduces image data, so ZIP needs no additional dependency.
- ZIP entries use the browser-local download time for their modification date, consistently in both ZIP headers. DOS ZIP timestamps have two-second precision and support 1980–2107; out-of-range device dates are clamped. Existing downloaded archives retain their old metadata and must be downloaded again.
- Collage imports up to nine photos and sets the slot count automatically. Exact-count layouts are ranked for the export shape: 1/2/3 photos have 1/2/4 choices; 4/5/6/7/8/9 photos have 9/10/10/12/14/15 choices each. Select fewer slots to keep extras in the unplaced tray.
- Six collage exports: square 1080×1080, story 1080×1920, portrait 1080×1350, landscape 1800×1200, widescreen 1920×1080 and tall phone 1080×2340. Photos fill their slots with proportional cover cropping. Drag within a slot to reframe, drag onto another slot to swap, or use Move / swap. Zoom uses a slider or two-pointer pinch; borders set the outside frame and inner spacing.
- Supported input: PNG, JPEG, WebP, GIF, AVIF and BMP if the browser decodes them. Animated input uses its first frame. HEIC and SVG are not accepted.
- Reject files larger than 100 MB or 40 megapixels. Output limits are 16,384 pixels per side and 40 megapixels; excessive groups fail visibly while other groups can succeed. Large collections can still hit device memory limits; use smaller batches.

## Local setup and checks

No dependencies or build step. Verification most recently used Node.js 25.4.0; the built-in Node test runner and Python 3 are required for these commands. Clone and enter the repository first:

```sh
git clone https://github.com/JuliaMathias/pairwise.git
cd pairwise
```

Run checks and start a local web server:

```sh
node --test tests/*.test.mjs
node --check dist/app.mjs
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

Open http://127.0.0.1:4173 and choose a tool. The interface uses system fonts and has no runtime external assets. Image processing has no network path.

## Structure and ownership

- `dist/index.html`: accessible page structure and copy.
- `dist/style.css`: responsive presentation.
- `dist/core.mjs`: pure filename grouping, manual ordering, crop-aware composition, CRC32 and ZIP encoding.
- `dist/composer.mjs`, `dist/collage-layouts.mjs`, `dist/crop.mjs`: shared join/collage geometry, layout ranking, framing gestures and crop validation.
- `dist/app.mjs`: batch UI, queue, live previews and mode navigation.
- `dist/collage.mjs`, `dist/crop-editor.mjs`: collage slot/gesture state and modal crop UI.
- `dist/photos.mjs`: browser decoding, generated synthetic samples, PNG encoding and Blob URL cleanup.
- `tests/*.test.mjs`: deterministic core, geometry, crop and fake-browser photo-adapter tests.
- `.openai/hosting.json`: Sites identity and static deployment configuration.

## Browser acceptance procedure

Manual testing is needed because canvas decoding and browser downloads cannot be established by pure unit tests. For the new editor, use the [web parity procedure](docs/editor-parity.md#manual-acceptance-procedure). The original batch regression steps below start in **Join images**, with Transparent padding and zero borders.

1. Create four synthetic solid-color PNGs: img1 (20×10 red), img2 (10×30 green), img3 (15×15 yellow), img10 (40×20 blue). Select them out of order.
2. Set group size to 3. Expect img1 + img2 + img3, followed by img10 alone.
3. Join vertically. First output must be 20×55, in red/green/yellow order with transparent centering and no resizing. Download the PNG.
4. Download ZIP. Open it with an ordinary archive reader; entries must match all successful individual PNGs and have no CRC errors.
5. Switch horizontally, regenerate. First output must be 45×30 in the same order.
6. Enter 0, 1 or a fractional group size. Generation must be disabled. Restore 2 and remove/add a file; grouping must update and old results must disappear.
7. Try a corrupt PNG and a nonimage. They must be reported and excluded before pairing. Try oversized output; show a group-specific error, preserving successful groups.
8. Check keyboard focus, narrow layout, both direction states, clear and regeneration.
9. Enter group name `Holiday` and offset `10`, with the four synthetic inputs grouped by 2. Preview must show `Holiday-011.png`. Generate and download: expect `Holiday-011.png`, `Holiday-012.png` and `Holiday.zip` containing exactly those entries. Verify archive CRCs and compare its first PNG with the individual file.
10. Enter offset `-1` and then `1.5`: generation must be disabled. Clear both optional fields: expect legacy filename preview starting at 001. Changing names or offset must clear stale results. Restore the example and regenerate.

11. Download a fresh ZIP, note the local download time, and extract it with macOS Archive Utility or `ditto -x -k <archive.zip> <new-empty-folder>`. Inspect the extracted files in Finder or with `stat`: modified dates must match the download time within two seconds and must not show 1980 for a current device clock. Record creation dates too; their handling can vary by extractor/filesystem. Verify file bytes and archive CRCs. Use synthetic data and a fresh extraction directory; preserve old downloads and originals.

Pass if ordering, grouping, dimensions, direction, downloaded content and ZIP modification dates match. Record revision, browser, fixture dimensions, output sizes and archive validation; keep private image contents out of project files. Cleanup: delete only synthetic fixtures/downloads if desired; preserve originals.

## Current verification and remaining plan

2026-11-04: automated tests and syntax validation passed. Browser tested group-size changes to 3, vertical and horizontal generation, and PNG/ZIP downloads. Synthetic first group dimensions were 20×55 vertical and 45×30 horizontal. Downloaded ZIP contained three PNGs with all CRCs valid; its first PNG matched the individual download. Layout had no horizontal overflow at the observed 596px width. Final whole-pixel centering is covered by automated regression test; browser rendering after that small adjustment is not separately rerun.

Custom naming update (2026-11-04): nine automated tests and syntax checks passed. Browser verified `Holiday` + offset `10`, individual `Holiday-011.png`, bundle `Holiday.zip`, and exactly two archive entries numbered 011 and 012. ZIP CRCs passed and the first entry matched the individual PNG. Negative and fractional offsets disabled generation; blank fields restored the default preview and naming changes cleared stale results. Desktop layout at 1200px had no horizontal overflow. This check used only four synthetic images. The final small `badInput` guard for incomplete numeric input was syntax checked; that browser-specific state was not separately exercised.

ZIP date fix (2026-11-04): removed the hard-coded 1980 date and zero time. Eleven tests passed in each of `TZ=America/Sao_Paulo` and `TZ=UTC`, including every local/central header, odd-second truncation, date-range boundaries and invalid dates. Generated a two-PNG archive with the actual current clock using the same `makeZip` function as the browser. macOS `ditto` extraction produced creation and modified dates of 2026-11-04 18:22:08 BRT; modification times were within two seconds of archive creation. ZIP CRCs passed and extracted files matched the synthetic input bytes. Browser clicks were not repeated for this ZIP-format-only change; browser upload/generation/download behavior was verified in earlier increments. Finder Archive Utility itself and other extractors were not rerun.

Format decision source: [PKWARE APPNOTE 6.3.10, section 4.4.6](https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT) specifies MS-DOS date/time encoding, a year relative to 1980 and two-second precision. Both headers now receive the same captured local timestamp; the optional date argument permits deterministic tests without changing the normal browser call.

Not run: comprehensive keyboard/accessibility audit, other browsers/devices, memory stress test, browser corrupt/oversized-file paths. No CI configured for this repository; local results are not hosted CI evidence.

Delivery plan: implement → automated checks → browser generation/download checks → private Sites publication. Plan updated for the ZIP date regression with deterministic header tests and real macOS extraction; configurable naming and grouping remain covered; no additional dependencies needed: client-side processing satisfies the workflow without remote storage or services. Publication success is recorded by the Sites deployment response. Remaining checks above are limitations, not claims of acceptance.

## GitHub development and review

The initial public import preserves the three original source commits through `730c639`, including configurable grouping, custom download names and the ZIP date fix. The GitHub repository is public; the hosted Site remains owner-private. Source visibility does not change visitor access.

For subsequent changes, create or identify a GitHub issue, then use a `codex/issue-<number>-<description>` branch and open a pull request. Follow `.github/PULL_REQUEST_TEMPLATE.md`. It adapts the review baseline to this buildless browser tool: deterministic Node tests, relevant browser/download checks, no migrations and separate Sites publication. No automatic CI or deployment is configured. Keep synthetic fixtures separate from private images and never commit credentials or downloaded bundles. Use focused commits with a descriptive title and body documenting purpose, validation and limits. Leave merging to the repository owner.

Repository creation policy: squash is the only enabled merge method and merged head branches are automatically deleted. No license has been selected; public availability alone does not grant a reuse license.

Import validation (2026-11-18): all 11 tests passed under both `America/Sao_Paulo` and `UTC` on Node.js 25.4.0; `node --check dist/app.mjs` and `node --check dist/core.mjs` passed. The import does not change application behavior, so browser checks were not repeated. Review of tracked files and history found no image uploads, runtime databases or credential material. The hosting manifest contains a Site identifier, not a credential.

Delivery plan review: import existing source/history → document local setup and review → verify tests and repository settings → push the public repository. No adjustments needed to the application's requirements or architecture because the import adds no runtime behavior. Remaining application validation limits above still apply. Track the import in [issue #1](https://github.com/JuliaMathias/pairwise/issues/1).

## Publishing and recovery

The Sites skill helper packages `dist/` with the hosting manifest, synchronizes source, then deploys a saved version privately. No runtime migrations or persistent data. Recovery: redeploy a previously saved Sites version; original images are never modified. Source changes should use a dedicated branch and focused commits with explanatory bodies. GitHub and Sites keep separate Git repositories. `origin` points to GitHub in the local checkout. The Sites workflow obtains temporary repository access for the Site ID in `.openai/hosting.json`; keep credentials in memory/stdin and never place them in Git. A GitHub push alone does not publish the Site. When publishing is requested, verify the latest Sites source, reconcile any changes, then use the Sites source/package and saved-version deployment workflow. This GitHub import performs no Sites publication or audience change.

## Web editing parity

The web editing work is tracked in [issue #2](https://github.com/JuliaMathias/pairwise/issues/2). See [editor parity requirements, architecture and acceptance](docs/editor-parity.md). The geometry and responsive editor are implemented. Local verification: 22 tests passed, all module syntax checks passed, and real browser checks covered crop/reorder, preview dimensions, PNG/ZIP, collage import limits, swaps, zoom, export and desktop/narrow layouts. The exact evidence and remaining phone checks are in the parity document; publication and review state are tracked in issue #2. No CI is configured.
