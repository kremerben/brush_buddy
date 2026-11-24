# brush_buddy

I love my kids, but standing around making sure they've brushed _all_ of their teeth is something better handled automatically. This app was built to make sure each part of a brushers teeth are being included, and visually point out where that is. It's fun for them and frees up 3 minutes of my day, lol.

## Interface

(future screenshot)

## Usage
## This is run as a self-contained web application. 

1. Download/clone/fork the repo and upload onto any webserver.
2. Open index.html
3. Brush your teeth
4. If on a phone make sure it doesn't "sleep" before the brushing time is completed. 

Note: open the app from a webserver, not as a `file://` page. The browser blocks the `routine.js` module and the 3D model on `file://` pages. For a quick local server, run `python3 -m http.server` in the repo folder and open http://localhost:8000.

## Features

The routine has four phases. The chips at the top show the current phase and put a ✓ on each finished one.

| Phase | Time | How it ends |
|---|---|---|
| 💧 Rinse with water | up to 30 s | Check-off button |
| 🧵 Floss | 30–60 s | Check-off button (unlocks after 30 s) |
| 🫧 Mouthwash | 30–60 s | Check-off button (unlocks after 30 s) |
| 🪥 Brush | 16 areas, 8–15 s each | Moves to the next area by itself |

- **Check-off button:** In the first three phases, a big green "I did a good job …" button starts the next phase. Before the minimum time, the button is locked and shows the time to unlock. At the maximum time, the countdown stops and the button pulses until the kid taps it.
- **Dancing teeth:** In the first three phases, the 3D teeth dance (a different dance for each phase). When the brushing starts, they go back to rest. On the Done screen, they do a party dance.
- **Total time:** The "Total" box at the top right shows the time since Start. Pause stops it, and Reset sets it to 0:00. The Done screen shows the final time.
- **Controls:** Next skips a step, and Prev goes back one step, across all four phases.

All step times are in `routine.js`. Change `minSeconds` / `maxSeconds` for the check-off steps, or `duration` for the brushing steps.

## Tests

The routine logic in `routine.js` has unit tests. They need Node.js 22 or later and no packages:

```bash
node --test
```

## AI

This app was built using ChatGPT, and later updated with Claude Code.
