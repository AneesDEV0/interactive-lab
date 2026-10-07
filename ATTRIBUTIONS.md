# Credits and asset rights

The application loads its scripts, fonts and geometry data locally. It contains no remote model viewer, CDN import or external image request.

| Used work | Creator / source | Rights | Local location |
|---|---|---|---|
| Toy car, portable radio, refrigerator, AA cell, mobile cart, room, Sharara robot | Original procedural artwork created for this project | CC0 1.0; use, modification and redistribution permitted | `src/scene.js`, `assets/models/lab-design.json`, `licenses/ORIGINAL-ASSETS-CC0.txt` |
| Interface icons and robot portrait | Original SVG artwork for this project | CC0 1.0 | `src/icons.js`, `public/favicon.svg` |
| Short radio phrase | Original Web Audio synthesis for this project | CC0 1.0 | `src/audio.js` |
| Three.js 0.180.0 and RoundedBoxGeometry | [Three.js contributors](https://github.com/mrdoob/three.js/tree/r180) | MIT; preserve copyright and license | `vendor/`, `licenses/THREE-MIT.txt` |
| Tajawal regular and bold, Arabic and Latin subsets | Google Inc., copyright as supplied in the package; [Tajawal at Fontsource](https://fontsource.org/fonts/tajawal) | SIL Open Font License 1.1; font use and redistribution permitted under included terms | `assets/fonts/`, `licenses/TAJAWAL-OFL.txt` |

The earlier three-device experiment used original geometry only. Its initial search is recorded in [asset-research.md](docs/asset-research.md). The active redesign now includes the seven downloaded models listed below; the earlier failed ZIP attempt is superseded by verified individual GLB downloads.

The earlier original models provided a single-cell educational compartment. The active redesign uses representative devices and a symbolic battery indicator; it does not claim that a photographed commercial appliance uses one particular cell. Display scales differ for visibility; physical size does not determine compatibility.

The app's source and documentation are provided with the project. The CC0 dedication above applies to the original artwork; third-party licenses remain separate.

## Active electricity redesign (7 October 2026)

Seven GLB assets by **Kenney**, **CC0-1.0**, downloaded and stored locally in `assets/models/book/`:

| Local file | Source asset | Original pack |
|---|---|---|
| car.glb | police | https://kenney.nl/assets/car-kit |
| solarCar.glb | sedan | https://kenney.nl/assets/car-kit |
| fridge.glb | kitchenfridge | https://kenney.nl/assets/furniture-kit |
| washer.glb | washer | https://kenney.nl/assets/furniture-kit |
| tv.glb | televisionmodern | https://kenney.nl/assets/furniture-kit |
| radio.glb | radio | https://kenney.nl/assets/furniture-kit |
| street.glb | light-curved | https://kenney.nl/assets/city-kit-roads |

GLB distribution mirror: https://github.com/Hidencod/tge-assets (pack catalog identifies creator and CC0 license). Original author pack pages independently confirm CC0. The car assets represent toy/solar educational vehicles; a solar panel and educational effects are added in code. Rendered thumbnails in `assets/thumbnails/` are derived from the displayed models.

Remaining models reuse `src/devices/factory.js` or are original schematic geometry in `src/electricity/models.js`. They are not downloaded commercial product replicas.

OpenCV.js 4.13.0: https://docs.opencv.org/4.13.0/opencv.js. Apache-2.0 license in `licenses/OPENCV-APACHE-2.0.txt`. Three.js addons are from the installed Three 0.180.0 package, under the existing MIT license.

Textbook crops in `assets/book/` are derived from the three images supplied by the user for this project. They are reference images for local matching and retain their original rights; the CC0 dedication for original assets does not apply to them.

Arabic voice: authored educational scripts rendered with Microsoft ar-SA-ZariyahNeural through edge-tts at build time, rate -12%. Files are in `assets/audio/electricity/`; exact transcript is `manifest.json`. No child text or photos were used for voice generation.
