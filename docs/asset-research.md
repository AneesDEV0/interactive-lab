# Asset research — 3 October 2026

Actual web searches were run before choosing the artwork:

- `toy battery car low poly glb`
- `portable battery radio gltf` and `portable battery radio gltf low poly model`
- `cartoon household refrigerator glb`
- `AA dry cell battery low poly`
- `mobile science lab cart low poly`
- `site.poly.pizza radio`
- `site.kenney.nl assets furniture kit`

## Results and decisions

| Candidate | Author | License / format information actually found | Outcome |
|---|---|---|---|
| [Simple Toy Car](https://sketchfab.com/3d-models/simple-toy-car-9e3e319f39b746b990986b343f6fc082) | Unverified | Page fetch failed; license, format, size and polygon count unverified | Not downloaded or used. Original toy with independently rotating wheels and an explicit single-cell compartment created. |
| [Mini Cartoon Fridge](https://sketchfab.com/3d-models/mini-cartoon-fridge-58ff73d9fa1240a9899cb11463be4613) | Unverified | Page fetch failed; metadata unverified | Not downloaded or used. Original fridge with separate hinged door and cooling indicator created. |
| [Dry Cell AA Battery](https://sketchfab.com/3d-models/dry-cell-aa-battery-0b77889a75314218b754dbee8cea55f4) | p8wer / dt.ikao, from indexed source page | Search index reports CC Attribution, about 1.5k triangles and 608 vertices. Direct page returned 403; downloadable format, bytes, exact license version not verified | Not downloaded or used. No login or access control bypass attempted. Original AA cell created. |
| [Khronos ToyCar legal record](https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/ToyCar/README.md) | Guido Odendahl; Eric Chadwick | Asset-specific CC0 1.0 record; GLB available; uses clearcoat, transmission, sheen. Byte and polygon count not measured | Legal record verified, not downloaded. A materials showcase without the instructional single-cell layout; kept as a documented alternative. |
| [Khronos BoomBox legal record](https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/BoomBox/README.md) | Microsoft | Asset-specific CC0 1.0 record; GLB. Size and triangles not measured | Legal record verified, not downloaded. Kept as an alternative; original one-cell portable educational radio used to match the battery model and visible contacts. |
| [Kenney Furniture Kit](https://kenney.nl/assets/furniture-kit) | Kenney | Official pack page reports CC0 and 140 models. [ZIP download](https://kenney.nl/media/pages/assets/furniture-kit/440e0608a4-1677580847/kenney_furniture-kit.zip) | Download attempted. One request timed out reading the response; a partial 2,588,326-byte file from another attempt failed ZIP validation. It was removed, and no contents are used. |
| [Poly Pizza Radio search](https://poly.pizza/explore/Radio) | Unverified | No individual model and its rights verified; page inaccessible to the retrieval tool | No download and no asset used. |
| [Mobile Bench Cart](https://polyfork.dev/asset/mobile-bench-cart-4b3ff5) | Polyfork catalog; individual author not verified | Page advertises GLB 246 KB, 2,182 triangles, commercial license; purchase / authenticated download required | No purchase or download. Original cart created. Raw-asset redistribution rights were not assumed. |
| [Basic Portable Radio](https://www.turbosquid.com/3d-models/3d-basic-portable-radio-pbr-model-2214363) | LemonadeCG | Indexed source reports standard commercial license, glTF and other formats, 2,452 polygons | Paid candidate, not purchased, downloaded or used. |

## Original models

Fallback geometry is genuine Three.js geometry: rounded cuboids, cylinders, spheres, torus arcs and a tube. It is generated from the local module, not from flat screenshots. Car wheels, refrigerator door, radio waves, cell and robot arm are separate parts. Original assets may be used, modified and redistributed under the included CC0 dedication.

The one-cell car and radio are explicitly fictional educational designs compatible with the one ordinary AA cell shown. This avoids making a downloaded multi-cell product appear to run with one cell. No claim is made about real toy or radio power requirements.

The JSON palette is loaded locally with a four-second timeout. On actual failure, built-in geometry defaults remain usable. If Three.js cannot load or WebGL cannot initialize, the HTML device cards run the same reducer and knowledge engine.

## Scientific references reviewed

- [DOE: Batteries](https://www.energy.gov/science/doe-explainsbatteries): battery energy is stored chemically and released through a suitable circuit. The child-facing wording avoids calling the battery an alternative to electricity itself.
- [NIEHS: Electric and magnetic fields](https://www.niehs.nih.gov/health/kids/topics/pollution/emf): electricity powers appliances; fields are not visible. No health-risk material from that page is introduced into the activity.
- [EIA: Electricity use in homes](https://www.eia.gov/energyexplained/use-of-energy/electricity-use-in-homes.php): refrigeration is a household electricity use. Its US consumption statistics are not presented to children or generalized to the local grid.

These references inform short original explanations; their prose and illustrations are not reproduced.
