# Design decisions

The central subject is a mobile school science cart. The child’s single job is to try a power source, observe and explain. The cart itself is the signature element: real articulated 3D objects on a shared physical surface, with one visibly portable battery.

## Tokens

- Ink `#244653`: headings and device labels.
- Lab teal `#137d7e`: primary actions and the active learning step.
- Battery yellow `#ffd36b`: the only power cell and toy body.
- Soft mint `#dcf1e9`: assistant bubble and discovery notebook.
- Radio blue `#318abd`: radio and supporting scene objects.
- Paper `#f6faf8`: calm page background.

Tajawal bold is the Arabic display face; Tajawal regular is body text. Arial is restricted to Latin instrument readouts and generated ± labels. Using a shared Arabic family preserves legibility at child-friendly sizes; weight and scale create hierarchy.

## Layout

Desktop: learning route across the header; the large scene and power tools on the right, Sharara and a small discovery notebook on the left. Three HTML device cards stay below the tools so every science action is accessible without manipulating the camera.

Mobile: heading → learning route → scene → battery and household supply → device cards → assistant → notebook. Chat opens as a dismissible bottom panel sized to the dynamic viewport. Device labels use a fixed, non-overlapping row on small displays.

The intro is a small card over the room, keeping actual equipment visible. The notebook comparison is a larger dialog because current state and past discovery must be separate. No scores, countdowns, admin controls or remote-service details appear in the learning path.

The initial review removed an oversized decorative hero in favor of the actual working cart. Light and saturation were adjusted after browser screenshots to keep pale objects distinct. A mobile label collision found in the first capture was corrected before final delivery.
