// common.js
// Shared code for the app pages (map, fuel, alerts...): builds the sidebar menu
// on desktop and the bottom menu on phones, and marks the page you are on.
// Each app page sets <body data-page="map.html"> so we know which link is active.
// Later (Task 7) this file also handles the logged-in role.

// Every app page. ready: false means the page is not built yet, so the link is
// shown greyed out with "Soon". Set it to true when the page is finished.
// onPhone: true puts the page in the bottom menu on phones (there is room for 4).
const NAV_ITEMS = [
  { href: "dashboard.html", label: "Dashboard", shortLabel: "Home", ready: true, onPhone: true },
  { href: "map.html", label: "Live map", shortLabel: "Map", ready: true, onPhone: true },
  { href: "trips.html", label: "Trip history", shortLabel: "Trips", ready: true, onPhone: false },
  { href: "fuel.html", label: "Fuel report", shortLabel: "Fuel", ready: true, onPhone: true },
  { href: "alerts.html", label: "Alerts", shortLabel: "Alerts", ready: false, onPhone: true },
  { href: "vehicles.html", label: "Vehicles", shortLabel: "Vehicles", ready: false, onPhone: false },
  { href: "locations.html", label: "Official locations", shortLabel: "Places", ready: false, onPhone: false },
];

// One menu link. Pages that are not ready yet become plain text, not a link.
function buildNavLink(item, labelText) {
  const isCurrent = document.body.dataset.page === item.href;
  let badge = "";
  // The alerts link shows how many alerts there are today.
  if (item.href === "alerts.html") {
    badge = `<b class="nav-badge">${getAlertStops().length}</b>`;
  }
  if (!item.ready) {
    return `<span class="nav-link is-soon">${labelText}<small>Soon</small></span>`;
  }
  if (isCurrent) {
    return `<a class="nav-link is-current" href="${item.href}" aria-current="page">${labelText}${badge}</a>`;
  }
  return `<a class="nav-link" href="${item.href}">${labelText}${badge}</a>`;
}

// The sidebar for desktop: logo, all pages, the public portal and a link back to the website.
function buildSidebar() {
  let links = "";
  NAV_ITEMS.forEach(function (item) {
    links += buildNavLink(item, item.label);
  });
  const publicLink = buildNavLink({ href: "public.html", ready: false }, "Public portal");
  document.querySelector("#app-sidebar").innerHTML = `
    <a class="side-logo" href="index.html"><img src="assets/img/logo-wordmark.png" alt="TrackGov" width="602" height="69" /></a>
    <nav class="side-nav" aria-label="App pages">
      <span class="side-label">Main menu</span>
      ${links}
      <span class="side-label">Public access</span>
      ${publicLink}
    </nav>
    <div class="side-foot">
      <span class="demo">Simulated data</span>
      <a href="index.html">← Back to the website</a>
    </div>`;
}

// The bottom menu for phones, with the 4 most used pages.
function buildBottomNav() {
  let links = "";
  NAV_ITEMS.forEach(function (item) {
    if (item.onPhone) {
      links += buildNavLink(item, item.shortLabel);
    }
  });
  document.querySelector("#app-bottom-nav").innerHTML = links;
}

// ---------- status colors and names, used by the map and the dashboard ----------

// Marker colors for each status (the same colors as css/app.css).
const STATUS_COLORS = { moving: "#16b8a6", parked: "#f5a524", offline: "#6b7a90", alert: "#f26363" };
const STATUS_LABELS = { moving: "Moving", parked: "Parked", offline: "Offline", alert: "Alert" };

buildSidebar();
buildBottomNav();
