# Showdown Character Spec: Grumli the Dwarf

## Purpose

The Showdown (`.claude/specs/showdown-spec.md`) has no host. The setup screen is a form, the bracket is two cards and a "VS" badge, and the winner screen is a product panel. The pick animation in `ShowdownBracket.tsx` cracks and shatters the losing card, but nothing in the scene causes the break. The glass breaks by itself.

This spec adds a host: Grumli, a stubby comic dwarf from a fantasy world, drawn in 3D in the browser. Grumli greets the user on the setup screen. In the bracket, Grumli throws a rock at the card that lost the match, and the rock's hit starts the existing crack and shatter. On the winner screen, Grumli celebrates.

The feature has four parts: the character model, the setup greeting, the rock throw in the bracket, and the winner celebration.

## Design reference

Figma page name: Showdown. The character adds three sections after the existing ones.

- "Showdown: 5 Character": the `Grumli` component set, with one variant per key pose (`pose=idle`, `greet`, `wind-up`, `throw`, `fist-pump`, `celebrate`), the "Grumli speech bubble" component, and the frame "Grumli: Model notes" with the joint list and the palette. The palette is the "Dwarf" variable collection. Each variable maps to one `--dwarf-*` CSS variable.
- "Showdown: 6 Character on screens": frames "Showdown: Setup + Grumli — Desktop" and "— Mobile", "Showdown: Bracket + Grumli — Desktop" and "— Mobile", and "Showdown: Winner + Grumli — Desktop" and "— Mobile".
- "Showdown: 6b Throw animation": five desktop keyframes, "Throw animation 01 WIND-UP", "02 THROW", "03 HIT", "04 SHATTER", and "05 NEXT MATCH". Each keyframe states its timing.

The design adds two details to the requirements below. On desktop, Grumli stands on the top edge of the setup summary card and on the top-right edge of the winner panel, with the feet on the card border. On a phone, the winner screen shows Grumli next to the "Your pick is in." title.

## Assumptions and dependencies

No 3D tool is available, so the model is built in code from three.js shapes. There is no model file and no asset pipeline. Each body part is a mesh, and each animation is keyframe data in a pure TypeScript module.

This spec adds two dependencies to `apps/web`: `three` and `@react-three/fiber` version 9. The root `package.json` pins React to 18.3.1 through `pnpm.overrides`, but the App Router runs the React 19 that Next.js bundles, and version 8 of `@react-three/fiber` breaks under React 19. So use version 9. It adds no other 3D package, such as `@react-three/drei`. The Showdown spec forbids an animation dependency for the card animation. That rule stays for the cards. The new packages draw the character only.

The character code loads only on `/showdown`, through `next/dynamic` with `ssr: false`. The home page and every other route must not load `three`. Measure the `/showdown` route size before and after with `pnpm build`, and record both numbers in the pull request.

The character needs 11 colors: armor, armor shade, trim, trim shade, sash, leather, eye glow, beard, beard shade, rock, and rock shade. `apps/web/CLAUDE.md` forbids raw hex values in code. So add these colors as CSS variables in `apps/web/app/globals.css`, with the names of the Figma "Dwarf" variables, such as `--dwarf-armor` and `--dwarf-glow`. The character reads them at runtime with `getComputedStyle`.

The character code lives in the existing `apps/web/modules/showdown` module:

- `domain/dwarf-animation.ts`: the keyframes of each animation and a pure function that samples a pose at a time `t`.
- `domain/rock-flight.ts`: a pure function that gives the rock's position at a time `t` on an arc from the hand to the target.
- `presentation/dwarf/`: the canvas, the model, and the animation player.

The backend does not change. No endpoint is added.

Out of scope for this pass:

- A character on any page other than `/showdown`.
- Phrases outside the throw in Feature 3, such as a phrase on the setup or winner screen.
- Sound effects.
- A choice of characters, or any user customization of the character.
- Head or eye tracking of the mouse pointer.

## Feature 1: Character model

### Description

Grumli is a short, wide dwarf warrior with a comic, toy-like look. Grumli wears dark plate armor with silver trim, a closed great helm with a vertical face guard, and large round pauldrons. Two glowing eyes show through the visor slit, and two beard braids hang under the helm. A red sash holds a small pouch of rocks, and an axe hangs on the back.

### Requirements

1. Build the model from three.js primitive shapes, such as spheres, capsules, cones, cylinders, and tori. Group the parts in a hierarchy of joints, so an animation can rotate an arm or the head as one unit. The joints are `root`, `body`, `head`, `beard`, `leftArm`, `rightArm`, `leftForearm`, `rightForearm`, `leftLeg`, `rightLeg`, and `axe`. The pauldrons belong to `body`, not to the arms, so a raised arm does not move them.
2. Give the model the comic look with a toon material (`MeshToonMaterial`) and a dark outline. Draw the outline with a second, slightly larger copy of each mesh that shows only its back faces in the `ink` color. Add a rim light behind the model, because dark armor on the dark page background needs a light edge to stay readable.
3. Take every color from the `--dwarf-*` CSS variables in `globals.css`, and the outline color from `--ink`.
4. Draw the model in a transparent canvas, so the page background shows through. Set the canvas `aria-hidden="true"`, because the character is decorative.
5. Cap the device pixel ratio at 2.
6. Play an idle loop when no other animation plays: the body breathes up and down, and the beard sways a little.
7. If the browser cannot create a WebGL context, do not show the character. The Showdown works as it does today.
8. While the character code loads, keep the character's space empty with its final size, so the layout does not shift.
9. If the user's system asks for reduced motion (`prefers-reduced-motion: reduce`), draw one still frame of the current pose and play no animation.

### Acceptance criteria

- A user opens `/showdown`. The character appears in its stage.
- A user opens the home page. The page loads no `three` code.

### Out of scope

- Facial expressions. The closed helm hides the face, and the eyes are two fixed glowing shapes.
- Using the axe in any animation. It stays on the back.
- Shadows cast on the page.

## Feature 2: Setup greeting

### Description

Grumli stands next to the setup screen and waves when the screen opens.

### Requirements

1. Show the character next to the setup panel on desktop. On a phone, show it in a smaller stage above the genre chips.
2. When the setup screen opens, play the greet animation once: Grumli raises the right arm and waves it three times, in about 1.5 seconds. Then play the idle loop.
3. Play the greet animation again after "Restart" and "Play again".

### Acceptance criteria

- A user opens `/showdown`. The character is visible next to the setup panel.

### Out of scope

- A reaction to a genre or size choice.

## Feature 3: Rock throw in the bracket

### Description

Grumli stands under the match. When the user keeps a game, Grumli announces it in a speech bubble with a random comic phrase, for example "PAPER FORTRESS WILL BE!" or "BY MY BEARD, PAPER FORTRESS IT IS!". Then Grumli takes a rock from the pouch and throws it at the other card. The rock hits the card at the impact point, and the card cracks and shatters.

### Requirements

1. On tablet and desktop, show the character in a stage under the two cards, centered on the "VS" badge. On a phone, show it in a smaller stage under the stacked cards.
2. Draw the rock in the same canvas as the character. Make the canvas a transparent overlay over the match area and the stage, with `pointer-events: none`, so the rock can fly over the cards and every click still reaches the cards.
3. Make the rock hit the losing card at the impact point that the Showdown spec defines: the click point on the other card, or the center of the cover on a keyboard pick. Map that point from page pixels to the canvas scene.
4. Make Grumli face the losing card before the throw: turn the body to the left for the left card, and to the right for the right card. On a phone, the target is the card above or below, so turn toward it the same way.
5. Replace the pick timeline in `PICK_TIMELINE` with this one. The total length is about 1350 ms.
   - Pick and wind-up (0 to 280 ms): the picked card scales to 1.03 and gets a red glow, as before. The speech bubble pops in over 120 ms. Grumli takes a rock from the pouch and pulls the arm back.
   - Throw (280 to 520 ms): the rock leaves the hand at 280 ms, flies on an arc, spins, and hits the impact point at 520 ms. Grumli follows through.
   - Crack (520 to 720 ms): the crack phase from the Showdown spec, unchanged. The rock disappears on the hit.
   - Shatter (720 to 1100 ms): the shatter phase from the Showdown spec, unchanged. Grumli pumps a fist.
   - Next match (1100 to 1350 ms): the next-match phase from the Showdown spec, unchanged. Grumli goes back to the idle loop.
6. Show the speech bubble for 2 seconds from the pick, so the user can read it: it fades out from 1900 to 2000 ms. The bubble outlasts the 1350 ms timeline and stays over the next match. The cards do not wait for it. If the user picks again before it ends, the new phrase replaces it. Its text is one phrase from `THROW_PHRASES` in `configuration/constraints.ts`, with the kept game's title in the `{title}` slot, shown in uppercase. Pick the phrase at random for each throw, but never the same phrase twice in a row. Keep the pick in a pure function in `domain/phrases.ts`, with a unit test. Color the title with the `primary` token and the rest of the phrase with the `background` token, on a `foreground` bubble with a `background` border. In this app the `ink` utility maps to the slate border color, so it is not dark enough for the text. Follow the layout of the "Grumli speech bubble" component.
   - Render the bubble as HTML next to the canvas, not inside the 3D scene, so the text stays sharp and uses the app fonts.
   - Place it next to Grumli's helm, on the side away from the losing card, with its tail pointing at the helm. On a phone, place it above Grumli.
   - Limit its width to 280 px on desktop and 220 px on a phone. Wrap a long title to 2 lines, then end it with an ellipsis.
   - Set `aria-hidden="true"` on the bubble, because it repeats the pick that the user just made.
7. Keep the cards, "Undo", and "Restart" locked for the whole timeline, as the Showdown spec does today.
8. "Undo" plays no animation. Grumli stays in the idle loop.
9. If the character is not shown, because WebGL is not available or the code did not load yet, play the timeline without the throw and without the speech bubble: the crack starts at 120 ms, as it does today.
10. If the user's system asks for reduced motion, play no throw and show no speech bubble. Keep the 200 ms fade from the Showdown spec.
11. Put the rock arc in `domain/rock-flight.ts` and the throw keyframes in `domain/dwarf-animation.ts`. Give both a unit test: the rock starts at the hand, ends at the target at 520 ms, and stays above the straight line between them.

### Acceptance criteria

- A user starts an 8-game bracket. The character is visible under the match.
- A user picks a game in every match of an 8-game bracket. After 7 picks, the app shows the winner screen, as it does today.

### Out of scope

- A miss. The rock always hits.
- A different throw for each round, or a bigger rock in the Final.

## Feature 4: Winner celebration

### Description

Grumli celebrates next to the winning game.

### Requirements

1. Show the character next to the winner panel on desktop. On a phone, show it in a smaller stage above the winner's cover.
2. When the winner screen opens, play the celebrate animation once: Grumli jumps twice with both arms up, in about 1.5 seconds. Then play the idle loop.

### Acceptance criteria

- A user finishes a bracket. The character is visible on the winner screen.

### Out of scope

- Confetti or other particle effects.

## Cross-feature requirements

- Give a `data-testid` to the character's stage, in lowercase with hyphens, per `apps/web/CLAUDE.md`. Use `showdown-character` on every screen, and `showdown-character-phrase` on the speech bubble.
- Set `data-pose` on the stage to the current animation: `greet`, `idle`, `throw`, or `celebrate`. Under reduced motion, set it to the pose of the screen (`greet`, `idle`, or `celebrate`) and keep it still. This gives the tests a verifiable state without reading the canvas.
- Do not show `showdown-character` when WebGL is not available. Playwright runs Chromium with a software WebGL renderer, so the stage shows in the E2E run.
- Keep the Showdown Playwright specs on `reducedMotion: 'reduce'`. A unit test covers the timeline instead.
- Do not change any existing `data-testid` or any existing behavior of the Showdown spec, except the timeline in Feature 3.
