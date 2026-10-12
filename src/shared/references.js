// Pixel rectangles measured on the supplied textbook scans, excluding labels/answer bulbs.
// A reference belongs to one item; a whole shared page must never be used as every item's reference.
import { devices } from '../electricity/data.js';

export const materialReferences = [
  { id: 'metalSpoon', source: '/assets/book/metalSpoon.png', rect: [0, 0, 180, 130] },
  { id: 'paperEnvelope', source: '/assets/book/paperEnvelope.png', rect: [0, 0, 186, 108] },
  { id: 'fabricCloth', source: '/assets/book/fabricCloth.png', rect: [0, 0, 191, 163] },
  { id: 'ironNail', source: '/assets/book/ironNail.png', rect: [0, 0, 169, 154] },
  { id: 'eraser', source: '/assets/book/eraser.png', rect: [0, 0, 149, 75] },
  { id: 'glassCup', source: '/assets/book/glassCup.png', rect: [0, 0, 147, 169] },
  { id: 'chalk', source: '/assets/book/chalk.png', rect: [0, 0, 174, 135] },
  { id: 'woodStick', source: '/assets/book/woodStick.png', rect: [0, 0, 224, 164] },
  { id: 'paperClip', source: '/assets/book/paperClip.png', rect: [0, 0, 279, 153] },
  { id: 'woolBall', source: '/assets/book/woolBall.png', rect: [0, 0, 225, 115] },
  { id: 'goldRing', source: '/assets/book/goldRing.png', rect: [0, 0, 185, 108] },
  { id: 'brassMortar', source: '/assets/book/brassMortar.png', rect: [0, 0, 128, 178] },
  { id: 'keys', source: '/assets/book/keys.png', rect: [0, 0, 157, 138] },
  { id: 'plasticRuler', source: '/assets/book/plasticRuler.png', rect: [0, 0, 340, 340] },
  { id: 'glassJar', source: '/assets/book/glassJar.png', rect: [0, 0, 340, 340] }
];

export const safetyReferences = [
  { id: 'overloaded_socket', source: '/assets/book/overloaded_socket.png', rect: [0, 0, 230, 177] },
  { id: 'kids_playing_cords', source: '/assets/book/kids_playing_cords.png', rect: [0, 0, 245, 175] },
  { id: 'baby_biting_cord', source: '/assets/book/baby_biting_cord.png', rect: [0, 0, 363, 226] },
  { id: 'exposed_damaged_wire', source: '/assets/book/exposed_damaged_wire.png', rect: [0, 0, 274, 209] },
  { id: 'inserting_scissors_socket', source: '/assets/book/inserting_scissors_socket.png', rect: [0, 0, 298, 221] }
];

export const frictionReferences = [
  { id: 'winterHands', source: '/assets/book/winterHands.png', rect: [230, 80, 320, 320] },
  { id: 'balloonWool', source: '/assets/book/woolBall.png', rect: [0, 0, 225, 115] },
  { id: 'rulerWool', source: '/assets/book/plasticRuler.png', rect: [0, 0, 340, 340] },
  { id: 'combHair', source: '/assets/book/paperClip.png', rect: [0, 0, 279, 153] },
  { id: 'woodFriction', source: '/assets/book/woodStick.png', rect: [0, 0, 224, 164] }
];

export function referencesFor(activity) {
  const refs = activity.id === 'electricity'
    ? devices.map(d => ({ id: d.id, source: `/assets/book/${d.id}.jpg` }))
    : activity.id === 'safety'
      ? safetyReferences
      : activity.id === 'friction'
        ? frictionReferences
        : materialReferences;
  return refs.filter(r => activity.items.some(d => d.id === r.id));
}
