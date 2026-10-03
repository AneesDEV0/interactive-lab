# Verification — 3 October 2026

## Results

- **110 / 110 unit tests passed**, no skipped tests. See `unit-test-results.txt`.
- **22 / 22 browser checks passed**, using installed Chrome through Playwright. See `browser-results.json` for each named check and duration.
- No unexpected browser console errors or uncaught JavaScript errors during the main journey.
- All requests in the main journey stayed on the local origin. No remote fonts, images, telemetry or API calls.
- Dev server additionally verified with agent-browser: meaningful page, scene canvas, expected controls, no reported errors. Screenshots were visually reviewed on desktop and mobile; an overlapping phone-label layout was corrected and the browser checks rerun.

## Browser coverage

1. Local load, RTL and actual WebGL scene.
2. Optional incorrect prediction followed by successful toy-car observation.
3. Battery transfer to radio, former device off and prior discovery retained.
4. Refrigerator rejects the cell and returns it to the tray; contextual Arabic explanation.
5. Explicit adult mains demo enables the refrigerator and cooling indicator.
6. Comparison distinguishes current operation from recorded discoveries.
7. Wrong classification permits retry; completion blocked until all classifications and explanation succeed.
8. Reset confirmation preserves progress until accepted; acceptance clears devices, history and milestones.
9. Keyboard Enter completes all four science milestones.
10. Real mouse drag into a card, then drag outside without counting a new scientific attempt.
11. Escape and pointer cancellation do not increment attempts.
12. HTML-like chat input displays as text and does not alter the compatibility rules.
13. Camera zoom, inspection and reset leave science state intact.
14. Reduced motion preserves scientific observations.
15. Ongoing activity and local questions work after the browser goes offline, once resources have loaded.
16. Arabic / English switching preserves the current round.
17. Tablet width and 720 CSS-pixel layout have no horizontal overflow; round remains intact.
18. Actual `WEBGL_lose_context` event activates cards without losing discoveries.
19. No unexpected console errors, no external requests in the main journey.
20. Emulated touch phone completes the four milestones, survives rotation and opens chat.
21. Aborted actual `lab-design.json` request uses built-in original model defaults and allows a successful experiment.
22. WebGL unavailable at boot still permits all four observations using cards.

Unit tests also cover event deduplication, rejection of previous-session events after reset, stale chat context, valid suggested actions, chemistry and size/design wording, 29 intent rules with three examples each, and a deterministic 250-step invariant check.

## Performance and bytes

`performance.json` records a separate run with the real default graphics backend:

- Windows Chrome, Intel Iris Xe via ANGLE / Direct3D11; viewport 1280 × 900, device pixel ratio 1.
- Toy running, four successive 2.1-second sample windows: **16.85, 30.00, 30.00, 30.00 fps** (rounded). First sample includes initialization; adaptive quality selected 0.8 rendering resolution.
- Scene: **32,616 triangles**, **130 draw calls** at the sampled state.
- The forced SwiftShader software-rendering browser suite reported about **5.96 fps** at its final sample. Functional checks pass in that mode, but it does not meet the 30fps target. This limitation is not hidden by the hardware result.
- The static delivery is about **0.89 MB uncompressed**, about **0.27 MB** when summing per-file gzip sizes. Exact counts are generated in `build-size.json`. The included local server does not apply gzip. These figures exclude development dependencies, test reports and screenshots.
- No medium-range physical phone was available. No claim of a universal 30fps guarantee is made.

## Captured states

| Image | State |
|---|---|
| `screenshots/01-intro.png` | Welcome and laboratory |
| `screenshots/02-car-running.png` | Toy car powered by the cell |
| `screenshots/03-radio-running.png` | Radio running; car stopped |
| `screenshots/04-fridge-battery.png` | Incompatible refrigerator attempt |
| `screenshots/05-mains-demo.png` | Virtual household supply |
| `screenshots/06-comparison.png` | Observation comparison and challenge |
| `screenshots/07-completed.png` | Explorer badge |
| `screenshots/08-reduced-motion.png` | Reduced-motion preference |
| `screenshots/09-tablet.png` | Tablet layout |
| `screenshots/10-renderer-fallback.png` | Equivalent HTML fallback |
| `screenshots/11-mobile.png` | Phone layout, labels corrected |
| `screenshots/12-mobile-chat.png` | Dismissible mobile conversation |
| `screenshots/13-asset-fallback.png` | Actual local asset request failure |

## Limits and unverified conditions

- Touch is browser emulation, not physical-device testing. The display rotation test changes viewport dimensions.
- The 720px check exercises a layout equivalent in width to a 1440px viewport at 200% zoom. Native browser/OS zoom and screen-reader speech output were not automated. Semantic controls, native dialogs, focus handling and live regions are present; a formal accessibility audit is not claimed.
- Audio output from actual speakers and installed Arabic voices was not assessed. The text and visual path remains complete without either. Tests verify mute does not alter science state.
- No offline reopening promise: no service worker. Only continuation after complete initial loading was tested.
- The local knowledge engine is deliberately bounded. Synonyms, selected compound questions and malformed input are tested; unrestricted Arabic understanding is not claimed.
- External 3D model candidates were researched, but no third-party model was successfully integrated. The project uses original procedural models with locally included source and CC0 artwork dedication; failures and alternatives are documented in `asset-research.md`.
- The intended 5–8 minute learning duration was not measured with children.
