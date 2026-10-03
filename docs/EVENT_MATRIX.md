# Events, messages and valid actions

`src/state.js` is the only scientific state transition source. `src/config.js` contains Arabic / English copy and message variants. `src/knowledge.js` contains the intent rules, synonyms, examples and state-dependent answers. `main.js` adapts inputs to events; `scene.js` reads state for rendering.

## Scientific invariants

- One battery location: tray, held, car or radio. Refrigerator never owns the battery.
- At most one device has `source: battery`. Moving the battery immediately disconnects its former device.
- Refrigerator supply can become `mains` only through the virtual adult demonstration, unlocked by observing battery incompatibility.
- Current device states and durable discoveries are independent.
- Every action has an event ID; duplicate IDs are ignored. Each new intentional experiment may increment attempts, but facts and milestone IDs are unique.
- Cancelled, outside and mains-panel drops do not increment scientific attempts.
- Reset increments `sessionRevision`. Stale asynchronous events and chat answers cannot update a new session. A synchronous local provider eliminates pending network replies.
- Quiz completion requires all four discoveries, all three classifications and the design-based explanation.

| Event / context | Visible result and message | Next action |
|---|---|---|
| `READY`, `START` | Intro / start invitation; neutral device targets | Pick a device or cell |
| `SELECT_DEVICE`, no cell | Select outline; choose battery prompt | Optional prediction, pick cell |
| `PREDICT` | Yes/no recorded only before that device's first experiment | Try or skip |
| `PICK_BATTERY` | Neutral dashed targets for all three devices; prior device turns off | Drop or select target |
| `DROP_ON_DEVICE` car | Cell enters marked single-cell bay; wheels turn and toy follows a bounded path | Unexplored device |
| `DROP_ON_DEVICE` radio | Cell enters bay; power indicator, symbolic waves, optional short tune | Unexplored device |
| `DROP_ON_DEVICE` fridge | Cell returns to tray; compatibility explanation; fridge remains off unless it already has mains | Adult mains demo |
| Repeat fridge | Same outcome, repeated-result message | Mains demo or comparison |
| Repeat success | Observation confirmed, no extra milestone | Unexplored device or comparison |
| Prediction mismatch / match | Brief appended observation message | Continue exploration |
| `DROP_OUTSIDE` | Cell in tray, no attempt recorded | Retry near a device or click its name |
| `CANCEL_DRAG` | Cell in tray, no attempt recorded | Retry |
| `DROP_ON_MAINS` | No connection, cell in tray | Suitable device compartment |
| `REMOVE_BATTERY` | Former device off, discovery retained | Pick cell and another device |
| `TRY_POWER`, no source | Needs suitable source message | Pick cell or unlocked mains demo |
| `SHOW_MAINS_DEMO` | Robot demonstrates a virtual connection, fridge cooling label appears | Comparison or stop demo |
| `STOP_MAINS_DEMO` | Cooling stops, discovery retained | Repeat demo |
| `TOGGLE_DOOR` | Door opens; interior lamp only visible while open and powered | Close door |
| `ASK_QUESTION`, `CHAT_RESPONSE` | Safe text, one locally computed answer; actions checked at display and execution | Up to two allowlisted actions |
| `REQUEST_HINT` | Three disclosure levels; first observation, then specific action, then explanation | Valid contextual action |
| `IDLE` | One optional hint offer after 20 seconds; suppressed during chat and active cell interaction | Hint or continue alone |
| `OPEN_COMPARISON` | Only observed discoveries; current operation in separate fields | Continue or unlocked quiz |
| `QUIZ_ANSWER` incorrect | Remember observed result; no penalty | Retry |
| `QUIZ_ANSWER` correct | Observation confirmed | Remaining classifications and explanation |
| `COMPLETE` | Explorer badge only when gated learning conditions pass | Comparison or reset |
| `ASSET_FAILED` | Original geometry defaults; concise recovery message | Continue |
| `RENDERER_FAILED` | Same-state HTML cards replace scene interaction | Complete the same journey |
| `CHAT_FAILED` | Prepared question / hint recovery | Local question or hint |
| `AUDIO_FAILED` | Read text and observe visuals | Continue |
| `RESET` | Explicit progress confirmation; stop audio, clear chat/observations/quiz, restore camera | New intro |

Messages use one status bubble. A child action replaces the previous result. Recovery is shown immediately. Chat has its own bounded log, and the idle offer never interrupts it. Old suggestions are replaced whenever state changes. Explicit actions remain available even if the renderer fails.

## State shape

Activity phases: `loading`, `intro`, `exploring`, `summary`, `completed`, `recoverable_error`. Devices support `off`, `running`, `paused`; this basic journey uses `off` and `running`, and does not invent random pauses or failures.

State includes `selectedDevice`, `batteryLocation`, `activePowerSource`, `devices`, `exploredDevices`, `attemptsByDevice`, `predictionByDevice`, `lastAttempt`, `lastOutcome`, `lastRelevantEvent`, `discoveredFacts`, `completedMilestones`, `hintLevel`, `interactionMode`, `muted`, `reducedMotion`, `chatOpen`, `assetStatus`, `rendererStatus`, `sessionRevision`, `revision`, `quiz`, `processedEvents`, and preferences.

Chat responses include `intent`, `text`, `suggestedActions`, `referencedEventId`, `stateRevision`, `confidence`. Allowed suggestion IDs: `select_device`, `show_hint`, `show_mains_demo`, `open_comparison`, `restart`, `pick_battery`. Unknown actions are rejected. The chat never evaluates input as code or HTML.

## Knowledge coverage

Each rule includes multiple Arabic/English examples. Tests run every example and independent state regressions. Device-specific why-answers share a state-aware resolver. It checks running supply, cell transfer/removal, prior incompatibility, stopped mains, no prior experiment, named devices, ambiguous multiple devices, and a two-minute context age limit. Unknown input has an explicit fallback; there is no claim of general natural-language understanding.

Scientific answers cover activity, next step, drag/click, dry cell, chemical energy, household supply, terminology, moving car, running radio, fridge incompatibility, useful unsuccessful experiments, size/design, camping/large battery systems, current stopped state, muted radio, radio energy conversion, removal, one battery, depletion, non-rechargeable cell, terminals, invisible electricity, adapters, generation, source choice, safety, disposal, reference clarification, hints, direct solution and restart.
