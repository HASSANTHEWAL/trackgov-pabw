# TrackGov — instructions for Claude Code

TrackGov is a group project for **Pengembangan Aplikasi Berbasis Web (PABW, SIF302)** at Universitas Islam Indonesia, semester 1 2026/2027. It is a website for monitoring government vehicles: where they are, where they went, and whether their fuel claims make sense. The goal right now is a working demo for the **class expo**, using dummy data.

Read this whole file before doing anything. Background is in `docs/`.

---

## RULE No. 1: plain HTML, CSS and JS, written like a 2nd-year student project

This is coursework. Every team member must be able to open any file, read it, and explain every line during the expo and assessment. The code must look like what a good 2nd-year Informatics student writes by hand. If a piece of code needs more than two sentences to explain, rewrite it simpler.

**Allowed**
- Plain `.html`, `.css` and `.js` files. One HTML file per page.
- `const` / `let`, normal `function` declarations, arrow functions for short callbacks, template strings, `document.querySelector`, `addEventListener`, `forEach`, `map`, `filter`, `for` loops, `if / else`, `localStorage`, `fetch` (later, for the backend).
- CSS variables, flexbox, grid, media queries. One shared stylesheet plus a small stylesheet per page if needed.
- **One library only: Leaflet 1.9.4** (for maps), loaded with a normal `<script>` and `<link>` tag from a CDN. Ask before adding any other library.

**Not allowed**
- No React, Vue, Svelte, Tailwind, Bootstrap, jQuery, TypeScript, npm packages, bundlers, build steps or frameworks. The site must run by opening `index.html` with VS Code Live Server (or `python -m http.server`).
- No ES modules (`import` / `export`), no `class`, no IIFE wrappers, no clever one-liners, no nested ternaries, no long `reduce` chains, no regular expressions unless there is no simple way, no minified code.
- No base64 images or videos inside files. Images go in `assets/img/`, video in `assets/video/`.
- No single-letter variable names (except `i` / `j` in loops). Use clear names: `vehicle`, `routePoints`, `fuelUsedLiters`.

**Style**
- 2 spaces indentation. Functions short (about 30 lines max). One job per function.
- Comments in simple English that explain *why*, above each function and above any non-obvious line. A short header comment at the top of every file saying what the file does.
- The same name for the same thing everywhere (for example, always `plate`, never sometimes `plat` and sometimes `licensePlate`).
- Small commits with clear messages (`Add refuel form to fuel page`). One branch per feature, merged with a pull request. The course grades the Git workflow too.

**Before you finish any task**, re-read your new code as if you were a classmate seeing it for the first time. Simplify anything that looks "too smart".

---

## RULE No. 2: keep the landing page's look

`index.html` is the landing page made by our classmates. Its design (dark navy, teal, big tight headings, scroll animations, the menu) is the **official look of the whole project**. Do not redesign it.
- Only change the parts a task asks for.
- New pages use the same colors, fonts and spacing (see the `:root` variables at the top of `css/style.css`).
- `js/main.js` is our classmates' animation code. It is dense, but leave it alone unless asked.

Design tokens (from `css/style.css`): `--ink #050b14` page background, `--navy #0a1628` cards, `--navy2 #10223d` raised surfaces, `--teal #16b8a6` accent, `--blue #3b82f6` secondary data, `--text #e8eef7`, `--muted #8fa3bf`, `--line rgba(255,255,255,.1)`. Use red `#f26363` only for alerts. Font stack: `"Helvetica Neue", Inter, system-ui, sans-serif`.

---

## RULE No. 3: all data comes from `js/data/`, and every number is calculated

- `js/data/places.js`: offices, official destinations and non-official places (with `official: true/false`).
- `js/data/vehicles.js`: the 20 vehicles (plate, model, agency, driver, today's route) and `MODELS` (km per liter, max speed).
- `js/data/routes.js`: real road routes from OpenStreetMap, one per vehicle.

Never type plates, totals, percentages or alerts directly into a page. Calculate them from the data so every page tells the same story. (A reviewer already caught a fuel table where the typed-in "mismatch %" did not match its own numbers.)

Until the backend exists, things users enter (refuels, reviewed alerts, new official locations) are saved in `localStorage`. Keep all `localStorage` code in one file (`js/storage.js`) so it is easy to replace with `fetch` calls when the course reaches databases and APIs.

---

## The project in short

Source: `docs/Project-Charter.pdf` and `docs/project-brief.md`.

- **Problem:** the regency cannot prove that the fuel it pays for was used for official trips. Trips are written in paper logbooks and fuel is bought with paper vouchers. The 2025 fuel budget is IDR 6.2 billion.
- **Users:** Admin (General Affairs fleet admin, full access), Supervisor (Department Head: map, reports, alerts), Public (read-only, no login, no driver names).
- **Pilot:** 20 vehicles. Agencies: Setda, Dinas Kesehatan, Dinas PU, BPBD.
- **Business rules** (from the charter goals and the P14 worksheet):
  1. Live location of each vehicle, updated at least every 30 seconds (the demo updates every few seconds).
  2. Every trip has a route history: start point, route line, stops and how long each stop took.
  3. **Fuel check:** `expectedLiters = kmDriven / kmPerLiter`. `mismatchPercent = (litersBought - expectedLiters) / expectedLiters * 100`. Over **5%** shows in red.
  4. **Unofficial stop alert:** a vehicle parked **more than 30 minutes** at a place that is not an official location creates an alert for the Department Head.
  5. Daily fuel and distance report ready by 07:00.

### Must-have features (P14 worksheet, agreed priority)

| # | Feature (the job the user does) | Who |
|---|---|---|
| 1 | See all cars live on a map | Admin |
| 2 | View a car's trip route and stops | Admin, auditor |
| 3 | Log a refuel (liters, price, odometer, receipt photo) | Driver or Admin |
| 4 | Check the daily fuel-vs-distance report, with mismatches in red | Department Head |
| 5 | Alert when a car parks too long at a non-official place | Department Head (stretch) |

User stories and how we know each is done are in `docs/project-brief.md`.

---

## Pages to build

The visual layout of the app pages comes from the Figma prototype in `reference/figma-dashboard/` (it was generated as React, so **use it only to see the layout and content; never copy its code**). The colors come from the landing page (Rule No. 2), not from Figma.

| File | Page | Notes |
|---|---|---|
| `index.html` | Landing page | Exists. "Live tracking" section already shows the 3D trip track. |
| `login.html` | Login | Role picker (Admin / Supervisor) plus a link to the public page. Demo only: no real passwords. Save the role in `localStorage`. |
| `dashboard.html` | Summary | Stat cards (vehicles, moving, parked, offline, alerts, fuel today), small map, latest alerts, 7-day fuel chart. |
| `map.html` | Live map | Leaflet map of Jogja, the 20 cars moving along `ROUTES`, searchable list, click a car for plate, agency, driver, speed, last update, fuel. |
| `trips.html` | Trip history | The 3D track replay (reuse `js/track.js` and `css/track.css`) plus the list of today's trips. |
| `fuel.html` | Fuel report | Table per vehicle: liters bought, expected liters, km, km/L, mismatch % (red over 5%). Refuel form. Export to CSV. |
| `alerts.html` | Alerts | Calculated from the simulation (Rule 4). Tabs New / Reviewed / All. "Mark reviewed" and "Dismiss" saved in `localStorage`. |
| `locations.html` | Official locations (Admin only) | Leaflet circles for official places, form to add one. |
| `vehicles.html` | Vehicles | Table with filters by agency and status. "Add vehicle" for Admin. |
| `public.html` | Public portal | Fleet stats, status map **without driver names**, monthly fuel spend. |

Shared files to create: `css/app.css` (sidebar layout for the app pages, desktop sidebar, bottom nav on mobile), `js/common.js` (navigation, current role, hide Admin-only links for other roles), `js/simulation.js` (turns a route into a timed trip: position at any time, stops, speed; used by the map, trips, fuel and alert pages), `js/storage.js` (all `localStorage` reads and writes).

---

## Task list (do in this order, one branch each)

0. **Setup.** `git init`, first commit of this starter, push to the group repo `trackgov-pabw`. Check that `index.html` opens with Live Server with no console errors.
1. **Rewrite `js/track.js` to follow Rule No. 1.** It works but was written compactly by an AI tool. Keep exactly the same look and behavior. Move the trip simulation part (building the timeline from a route, stops, speeds) into `js/simulation.js` so other pages can use it. Use readable names and comments. Keep the `tg-` prefix on all its classes and ids (it avoids clashes with the landing page's code).
2. **Fix the landing page numbers.** The hero and "Fleet overview" say 248 vehicles / 187 active / 64 trips / 5 alerts, but the pilot is 20 vehicles. Calculate them from the data. The hero chip says "Alerts 0" next to "5 alerts". The fuel chart says "litres" but shows percentages. The "Know every asset" panel should become "Log every refuel" to match the must-have list. Point "Login (coming soon)" to `login.html` once that page exists.
3. **Live map** (`map.html`, `js/map.js`). Dark map tiles to match the landing page (for example CARTO "dark_all", with the required attribution). Markers colored by status: teal moving, amber parked, grey offline, red alert.
4. **Fuel report + refuel form** (`fuel.html`, `js/fuel.js`). Plant the dummy refuels so that 2 vehicles go over 5%.
5. **Trip history** (`trips.html`).
6. **Dashboard** (`dashboard.html`).
7. **Login and roles** (`login.html`, `js/common.js`).
8. **Alerts** (`alerts.html`).
9. **Official locations** (`locations.html`).
10. **Public portal** (`public.html`), then **Vehicles** (`vehicles.html`).

After each task: test on desktop and phone width (Chrome DevTools), check the console has no errors, then commit.

---

## Decisions already made (do not undo without asking)

- The map shows **Jogja (Kota Yogyakarta) roads**, because the team wanted a Jogja map for the expo. The road data is real (OpenStreetMap / OSRM). Trip times and stop lengths are simulated.
- The trip history uses an **F1-race-track style** (glowing 3D line, numbered stop pins, big stats) in the landing page's navy and teal colors, not neon yellow.
- 4 of the 20 dummy trips are planted to trigger the unofficial-stop rule: Ambarrukmo Plaza, Pantai Parangtritis, Jogja City Mall and Alun-alun Kidul.
- Everything shown is labeled as demo or simulated data.

## Open questions (ask the user before the related task)

1. **Gunungkidul or Jogja?** The project charter and worksheet are about **Gunungkidul Regency** (Wonosari), but the demo uses Jogja city. Either the written documents say "demo uses Yogyakarta city for the expo", or new routes are needed for Wonosari. Ask before building more map pages.
2. **Language.** The landing page is in English. The Figma prototype and worksheet are in Bahasa Indonesia. Ask which language the app pages use, then use it everywhere.
3. **Backend.** Which language and database the course uses after P14 (for example PHP + MySQL). Until then, keep `js/storage.js` as the only place that saves data.
4. **Team.** The charter lists 5 members, but one is not enrolled in PABW (assumed: Razzan Chesta Ugama, network and server role). Confirm before writing names in the README or on pages.

## Credits that must stay visible
- Map and route data: "© OpenStreetMap contributors", routes computed with OSRM.
- Map tiles: credit whatever tile provider is used, as its terms require.
