# Reaction Lab

Reaction Lab is a static reaction timer game built with HTML, CSS, and vanilla JavaScript. The goal is simple: start a round, wait for the signal, and click as fast as possible when the game says `GO`.

The project also includes animated Three.js background visuals, reaction grading, sound effects, session stats, keyboard controls, and mobile-friendly layout tweaks.

## Features

- Static website with no framework or build step
- Start rounds with the `Space` bar or the `Start` button
- Click too early and the game records a false start
- Live feedback for each round
- Reaction grades from `Amazing` to `Pathetic`
- Session tracking for best time, average time, valid attempts, and false starts
- Procedural sound effects for successful clicks and false starts
- Animated 3D background built with Three.js
- SVG and PNG favicon support

## How To Play

1. Press `Space` or click `Start`.
2. Wait for a random delay between 1 and 5 seconds.
3. When the reaction area turns green and says `GO`, click it as fast as you can.
4. If you click too early, it counts as a false start.
5. Use `Replay` to start another round or `Reset` to clear your session stats.

## Reaction Grades

- `Amazing`: under 240 ms
- `Great`: 240-299 ms
- `Good`: 300-399 ms
- `Average`: 400-499 ms
- `Bad`: 500-649 ms
- `Pathetic`: 650 ms and up

## Tech Used

- HTML5
- CSS3
- Vanilla JavaScript
- [Three.js](https://threejs.org/) loaded from a CDN
- Web Audio API for sound effects

## Project Files

- `index.html` - page structure and game UI
- `style.css` - layout, styling, responsive design, and animations
- `script.js` - game logic, keyboard controls, scoring, sound effects, and 3D scene
- `favicon.svg` - SVG favicon
- `favicon.png` - PNG favicon fallback

## Run Locally

This is a static project, so you can run it without installing anything.

### Option 1

Open `index.html` directly in your browser.

### Option 2

Use the VS Code Live Server extension for easier testing.

## Notes

- The instructions show on first load and hide after gameplay starts.
- The game is designed to work on desktop and mobile.
- Sound playback depends on browser autoplay and user interaction rules, so sounds usually begin after your first click or key press.

## Author

Built by Jared Vass.
