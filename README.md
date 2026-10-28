# TrackGov

Government vehicle and fuel monitoring website. Group project for Pengembangan Aplikasi Berbasis Web (SIF302), Universitas Islam Indonesia, 2026/2027. Group 1, "No Name Team".

All data on the site is dummy data for the expo. The road routes are real (OpenStreetMap); trip times and stops are simulated.

## How to run

No install and no build step.

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Or, from this folder: `python -m http.server 8000`, then open http://localhost:8000.

## Folders

```
index.html          landing page (made by our classmates)
css/style.css       landing page styles and the project's colors
css/track.css       styles for the 3D trip track
js/main.js          landing page animations
js/track.js         the 3D trip track (trip replay)
js/data/            all dummy data: places, vehicles, road routes
assets/img/         photos and logo
assets/video/       hero video
docs/               project charter, P14 worksheet, project brief, Figma brief
reference/          Figma prototype code and the first trip-replay page (look only, do not copy)
CLAUDE.md           rules and plan for Claude Code
```

## Team

| Student ID | Name | Role |
|---|---|---|
| 25523085 | Rama Walta Alinta Elsaprike | Project lead, full-stack |
| 25523274 | Hassan Waleed Hassan Abdo Al-Awadhi | Back-end, system analysis |
| 25523189 | Faizah Nabila Azzahra | Front-end, UI/UX, docs |
| 23523215 | Raihan Izdihar Rauf | Back-end and front-end helper |

## Credits

Map and route data © OpenStreetMap contributors. Routes computed with OSRM (project-osrm.org).
