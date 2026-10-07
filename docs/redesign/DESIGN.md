# Electricity redesign — 7 October 2026

The active site is a single Arabic RTL application. The book supplies the scope: 17 distinct devices across the three provided illustrations. Existing static/dynamic entry URLs forward to the corresponding mode of the same application.

## Child's journey

1. Choose one illustrated device or photograph/upload one image from the supplied book activities.
2. “تعرّف” presents a still model that can be manually rotated, a factual explanation and matching Arabic narration.
3. “جرّب” offers battery and household/grid electricity for comparison, plus sunlight, wind or wheel movement where the pictured device needs it. Tap a source and “جرّب التشغيل”, or drag a source onto the stage.
4. Observe the device-specific response. Incompatible sources stop the device and receive a hint; there is no timer or penalty. A repeated success cannot inflate the device count.
5. Successful source/device observations are saved locally in the discovery notebook. The radio illustrates both possible supply options. The tablet uses a rechargeable battery; mains charging is explained rather than treated as a dry-cell appliance.

## Visual direction

The signature is a toy-like worktable, one large device, and a small lightbulb friend. Tokens: ink `#34304b`, violet `#7560af`, lilac `#eee9f8`, mint `#dff3ed`, warm yellow `#ffdb76`, background `#f6f5fa`. Locally hosted Tajawal 700 carries headings and choices; Tajawal 400 handles instructions. Large rounded surfaces, restrained borders and meaningful three-step numbering replace the old dense laboratory controls.

Device cards use locally rendered thumbnails of the actual 3D assets. The original textbook crops are retained for matching. The application preserves zoom, keyboard focus, native dialog focus trapping and reduced-motion preferences. Portrait phones use a single column and full-width action button. Guidance also appears next to the action after an attempt.

## Architecture

`src/electricity/data.js`: textbook catalogue, compatibility, facts, bounded local assistant, voice copy.

`app.js`: selection, modes, progress, audio preferences, dialogs, capture, guidance and XR controls.

`models.js`: downloaded GLBs, reused legacy geometry, additional educational models, interactive effects.

`scene.js`: Three.js stage and orbit controls; real WebXR AR hit testing and VR controller selection.

`recognition.js`: lazy local OpenCV ORB descriptors, ratio matching, RANSAC geometric verification. Results require confirmation. Missing/ambiguous matches fall back to explicit selection.

`audio.js`: a single audio channel with cancellation; local recordings first, matching Arabic system voice as fallback. No English voice is substituted for Arabic.

## Honest boundaries

- Photos are matched to the supplied book references and mapped to a prepared model. The site does not reconstruct arbitrary photos into 3D geometry or identify arbitrary real-world products.
- Recognition quality depends on the printed reference, focus, crop, perspective and lighting. It has been checked against original, rotated/scaled and blank fixtures, not a classroom camera dataset.
- Seven models are downloaded Kenney assets. Others reuse existing geometry or add schematic educational models. These are representative devices, not exact replicas of photographed commercial products.
- The assistant is a local rules-based educational simulator. It is not a general-purpose LLM and has no API dependency or access to user conversations.
- AR requires HTTPS (or localhost), `immersive-ar`, hit testing and DOM overlay. It places the selected model on a detected surface, keeps source controls and guidance available, and releases the session and hit-test source on exit.
- VR requires an `immersive-vr` headset/browser. In-world Arabic panels support source choice, next device, static/interactive modes and exit through a controller ray. Headset physical testing was unavailable in this workspace.
- Camera streams stop on close, hidden page, capture and replacement. Pictures remain local and are released after closing the dialog. Recordings are generated at development time from authored text only.
- This is an electricity-source learning simulation, not a circuit or voltage/current simulator. Effects are illustrative. Real household mains interactions are never instructed.
- No service worker/offline reopening guarantee. Downloaded models, voices, fonts, recognition and rendering runtime are served locally after deployment; lazy resources must have been fetched before loss of connectivity.
