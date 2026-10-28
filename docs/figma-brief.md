# Figma prototype brief

This is the brief the team gave to Figma Make for the dashboard prototype. The generated prototype is in `reference/figma-dashboard/` (React code, for layout reference only).

Changes since then: the app pages use the landing page's dark navy/teal colors (the team said the Figma colors don't matter), the map is Jogja instead of Wonosari (see the open question in `CLAUDE.md`), and everything is rebuilt in plain HTML/CSS/JS.

---

TrackGov: responsive web dashboard for Gunungkidul Regency (Indonesia) to monitor government vehicles, live GPS location and fuel use. Tone: trustworthy government operations center. Desktop-first, works on mobile.

Style: navy #0F2A44, teal #0E9F8E, background #F4F6F8, white cards, 12px radius, Inter font. Status: green moving, amber idle, gray offline, red alert. Left sidebar nav (bottom nav on mobile). Logo: map pin + shield.

Roles: Admin (full access), Supervisor (map, reports, alerts), Public (read-only, no login).

Pages:
- Login with role selector + public page link
- Dashboard: stat cards (20 vehicles, moving, idle, offline, alerts, fuel today in L), mini map, recent alerts, 7-day fuel chart
- Live Map: Wonosari map, colored vehicle markers, searchable vehicle list; clicking shows plate, agency, driver, speed, last update, fuel bar
- Vehicles: table, filters by agency/status, Add vehicle (admin)
- Trip History: Strava-style route line, start/end pins, stop markers, trip list with km, duration, stops, date picker
- Fuel Reports: per vehicle fuel bought, fuel used, km, km/L; mismatch over 5% in red; Excel/PDF export
- Alerts: e.g. "AB 1234 XY stopped 47 min at non-official location"; Mark reviewed/Dismiss; tabs New/Reviewed/All
- Official Locations (admin): geofence circles on map + add form
- Public page: fleet stats, status map without driver names, monthly fuel spend

Data: 20 vehicles, plates like AB 1234 XY, Innova/Avanza/motorbike; agencies Dinas Kesehatan, Dinas PU, Setda, BPBD; Indonesian driver names; around lat -7.965, lng 110.600.

Markers move every few seconds to simulate live GPS. Role choice hides admin pages.

Tech: Leaflet + OpenStreetMap, all mock data in one file, simple code, flexbox/grid, no complex animations (will be rebuilt in plain HTML/CSS/JS).
