# TrackGov

Government vehicle and fuel monitoring website. Group project for Pengembangan Aplikasi Berbasis Web (SIF302), Universitas Islam Indonesia, 2026/2027. Group 1, "No Name Team".

All data on the site is dummy data for the expo. The road routes are real (OpenStreetMap); trip times and stops are simulated.

The project is for Gunungkidul Regency. For the expo, the demo uses roads in Yogyakarta city.

## How to run

No install and no build step.

1. Open this folder in VS Code.
2. Install the **Live Server** extension.
3. Right-click `index.html` and choose **Open with Live Server**.

Or, from this folder: `python -m http.server 8000`, then open http://localhost:8000.

## Folders

```
index.html          landing page (made by our classmates)
login.html          demo login: choose Admin or Supervisor (no password)
dashboard.html      summary of the fleet today
map.html            live map of the 20 vehicles
fuel.html           daily fuel report and refuel form
trips.html          trip history: 3D trip replay and today's trips
alerts.html         alerts for long stops at non-official places
locations.html      official locations: map circles and add form (Admin only)
vehicles.html       all vehicles with filters, Add vehicle for Admin
public.html         public portal: no login, no driver names
css/style.css       landing page styles and the project's colors
css/track.css       styles for the 3D trip track
css/app.css         layout of the app pages (sidebar, bottom menu, status colors)
css/map.css         styles for the live map page
css/fuel.css        styles for the fuel report page
css/trips.css       styles for the trip history page
css/dashboard.css   styles for the dashboard
css/login.css       styles for the login page
css/alerts.css      styles for the alerts page
css/locations.css   styles for the official locations page
css/vehicles.css    styles for the vehicles page
css/public.css      styles for the public portal
js/main.js          landing page animations
js/simulation.js    turns each route into a timed trip (used by every page)
js/format.js        small text helpers (clock times, numbers)
js/common.js        menu of the app pages, login check and roles
js/login.js         the login page
js/alerts.js        the alerts page
js/locations.js     the official locations page
js/vehicles.js      the vehicles page
js/public.js        the public portal
js/landing.js       calculated numbers on the landing page
js/map.js           the live map page
js/fuel-data.js     fuel report calculations (used by the fuel page and the dashboard)
js/fuel.js          the fuel report page
js/dashboard.js     the dashboard
js/trips.js         the trip list on the trip history page
js/storage.js       the only file that saves to localStorage (replace with fetch for the backend)
js/track.js         the 3D trip track (trip replay)
js/data/            all dummy data: places, vehicles, road routes, refuels
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
