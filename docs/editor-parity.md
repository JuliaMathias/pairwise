# Web editor parity

## Requirements and source

Requested: implement the improvements from the accepted phone prototype in the existing Pairwise website. Reference implementation: [pairwise-mobile at 136b59c](https://github.com/JuliaMathias/pairwise-mobile/tree/136b59c71bbbb51d5a81e712f99caca23c862d1d), read-only snapshot. Its native Android follow-up is separate work. This document and [issue #2](https://github.com/JuliaMathias/pairwise/issues/2) track web scope.

Confirmed scope:
- Keep the batch joiner, filename sorting, configurable group size, partial final groups, file naming/offsets, PNG/ZIP downloads and corrected ZIP timestamps.
- Add manual queue reordering and restore-by-name, free/fixed-ratio crop, immediate preview with export dimensions, transparent/solid padding, proportional resize, border color and thickness.
- Add a collage workspace: import up to nine photos, set slot count from accepted images, offer exact-count layouts, six fixed export sizes, at least five layouts for each 4–9-photo/export-size combination and aspect-aware ranking.
- Reframe within a collage slot by dragging; drag into another slot to swap; retain a button-based swap alternative. Include zoom slider and two-pointer pinch anchored to the fingers' midpoint.
- Local browser processing; no Lara, shared AI, remote image uploads, new dependencies or stored private content. Preserve current hosted audience.

Implementation choice: retain the accepted prototype's layout/geometry and image-editing modules, adapt the UI to a responsive desktop workspace, and keep the modes' state separate while navigating. Sample images are synthetic drawings generated locally. The shared geometry is introduced before the UI integration so existing join behavior remains usable at that intermediate commit.

## Architecture decision

Pure modules (`core`, `crop`, `composer`, `collage-layouts`) own ordering, rectangles, fitting and gesture math. DOM controllers own browser events, current photos and selection state; the photo adapter owns decoding, PNG encoding and download URL cleanup. This keeps calculations testable without real files, network or hardware, while real browser checks establish decoding/rendering/download behavior.

Alternative: build an independent web geometry engine. Rejected because the accepted prototype already implements the same behavior and duplicating the algorithms would introduce drift. This is a source port pinned to a commit, not a live cross-repository dependency. Future changes in either repository need explicit reconciliation.

Tradeoff: collage fills slots with proportional cover cropping, whereas the joiner defaults to retaining original pixels. The UI must explain the selected mode. Reducing the collage template size preserves extra photos in an unplaced tray rather than discarding them.

Layout inspiration: [Canva's grid collection](https://www.canva.com/templates/s/grid/) and [collage maker](https://www.canva.com/photo-collages/) illustrate grid, feature-panel and mosaic families. The imported patterns are original source from the user's prototype; no third-party images or templates are copied. Layout ranking penalizes extreme cell aspect ratios but leaves unusual options available.

Gesture contract: [MDN Pointer Events](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events) and [pinch example](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events/Pinch_zoom_gestures) inform pointer capture/cancellation and two-pointer tracking. Restrict `touch-action: none` to photo/crop editing areas; preserve page scrolling and browser zoom elsewhere.

## Delivery and verification plan

1. Port and test pure geometry/ordering/crop/layout modules. Existing join/ZIP regressions must pass.
2. Integrate the responsive editor and retained prototype interactions. Add only fixes supported by observed failures.
3. Browser-test synthetic imports, crop/reorder, live output sizes, fits/borders, collage exact-count filtering, layout and size changes, mouse swap/reframe, zoom controls, and PNG/ZIP output. Check desktop and narrow layouts and keyboard alternatives.
4. Publish to the same Sites project, push the issue branch and leave the review PR unmerged. Verify issue Development link, project status and milestone. Record unrun phone/two-finger checks visibly.

Status: geometry increment verified locally (19 tests). UI integration, browser verification and publication pending. No CI is currently configured. Real phone pinch and native file-picker behavior need device evidence; synthetic math tests alone do not establish those outcomes.
