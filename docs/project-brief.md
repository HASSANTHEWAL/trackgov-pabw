# TrackGov project brief

Everything the team decided so far, in one place. Sources: `Project-Charter.pdf` (MPTI course, v1.0, 26 Sep 2026), `P14-worksheet-filled.pdf` (PABW meeting 14), and the consultation notes from 28 Oct 2026.

## Team (Group 1, "No Name Team")

| Student ID | Name | Role in the charter | PABW role |
|---|---|---|---|
| 25523085 | Rama Walta Alinta Elsaprike | Project manager, system analyst, full-stack | Project lead, full-stack |
| 25523274 | Hassan Waleed Hassan Abdo Al-Awadhi | Back-end developer, system analysis helper | Back-end, system analysis |
| 25523189 | Faizah Nabila Azzahra | Front-end developer, UI/UX, technical writer | Front-end, UI/UX, docs |
| 23523215 | Raihan Izdihar Rauf | Back-end and front-end helper | Back-end and front-end helper |
| 25523016 | Razzan Chesta Ugama | Network, server and security engineer | Assumed not in PABW (confirm) |

## The problem (worksheet A.1)

- **In one sentence:** nobody can prove that the fuel the regency pays for was used for official trips, because trips and fuel are written by hand on paper.
- **Who is affected:** vehicle admins and Department Heads, every day, for every trip and every refuel. BKAD at every claim cycle, auditors at every audit, citizens as taxpayers.
- **If nothing changes:** cars get used for personal errands and fuel claims get inflated. The IDR 6.2 billion fuel budget (APBD 2025, up from 5.7 billion) cannot be checked. This also falls short of Perpres 95/2018 (SPBE).
- **Evidence:** the MPTI charter's process mapping and budget figures. To do before P17: a short interview with one driver or vehicle admin.

## The process today, and the 3 steps we digitise

Trip → paper logbook → paper fuel voucher → fuel claim → checked by hand → paid by BKAD.

1. **Trip:** GPS records the route automatically (no driver typing).
2. **Refuel:** the driver logs it in the web app.
3. **Check:** the app compares fuel with distance and flags anything odd.

## The solution (worksheet B.1)

| Question | Answer |
|---|---|
| What the app helps users do | Track every official car on a map and catch fuel claims that don't match the kilometres driven. |
| At the expo a visitor can | Watch cars move on a live map, log a refuel, and see the app flag a suspicious car. |
| Why this way | Not a digital logbook: drivers would still write their own trips. GPS data can't be faked by the driver. |
| Assumptions | Simulated GPS data is fine for the demo. Drivers log every refuel. We know each car's normal km per liter. |
| How we know it works | Cars move on the map, and the planted "cheating" car gets flagged on its own. |
| Left out on purpose | Real GPS hardware, mobile app, link to the finance system. (The charter also lists a public portal; the Figma prototype includes one as a stretch page.) |

## User stories (worksheet B.2)

| # | Story | Done when |
|---|---|---|
| 1 | As an admin, I want to see all cars on one map so that I know where they are right now. | Every car shows on the map and moves when its position updates. |
| 2 | As a driver, I want to log a refuel in the app so that I don't need paper vouchers. | The refuel is saved and shows in the car's history. |
| 3 | As a Department Head, I want a daily fuel report so that I can spot claims that don't add up. | Cars that used too much fuel for their distance are highlighted. |

## Charter goals the demo should show

1. Live location of 20 pilot vehicles, updated at least every 30 seconds.
2. Route history for every trip: start point, route, parking and stop durations.
3. Daily fuel and distance report by 07:00. GPS distance within ±5% of the odometer.
4. Flag any vehicle stationary more than 30 minutes at a non-official location and notify the Department Head within 5 minutes.

## Consultation notes (28 Oct 2026)

- The first Figma prototype looked good but was "a picture of an app": markers sat in a perfect grid, the fuel mismatch % was typed in by hand (and wrong), plates in the alerts didn't match the vehicle list, buttons did nothing, and there was no way to log a refuel.
- Fix: one shared data file, calculate everything from it, make cars move along real roads, add the refuel form.
- The landing page had a CSS bug: the menu-photo class `.t` also hid the "187 Active now" number, the "78%" and two gallery photos. Fixed by renaming the class (`teal`, `wide`).
- The team wants a map of Jogja and a Strava-like trip history that looks like the F1 track graphics on landonorris.com, while keeping the classmates' original dark navy/teal look. Built and placed inside the landing page's "Live tracking" section.

## Known gaps to fix

- Landing page numbers (248 / 187 / 64 / 5) don't match the 20-car pilot.
- Hero chip "Alerts 0" vs. stat "5 alerts".
- Fuel chart labeled liters but drawn as percentages.
- Charter milestone table only defines M1–M4 but billing refers to M6–M8; duration says ~15 weeks in one place and ~12 in another. (Fix in the MPTI documents, not in code.)
