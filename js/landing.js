// landing.js
// Fills in the fleet numbers on the landing page (hero and "Fleet overview")
// from the demo data, so they always match the other pages.
// Needs js/simulation.js. Must load before the hero counters start counting up,
// because main.js reads data-to when the loading screen ends.

// How many cars are out on their trip at the demo time right now.
function countActiveVehicles() {
  const demoMinute = getDemoMinute();
  const activeTrips = TRIPS.filter((trip) => isOnTheRoad(trip, demoMinute));
  return activeTrips.length;
}

// The hero numbers count up from 0. main.js counts up to the number in data-to.
// We also set the text, because with "reduce motion" on, main.js shows the
// numbers straight away, before this file has run.
function setCounter(id, number) {
  const counter = document.querySelector(id);
  counter.dataset.to = number;
  counter.textContent = number;
}

// Puts the calculated numbers into the hero and the Fleet overview cards.
function fillLandingNumbers() {
  const vehicleCount = VEHICLES.length;
  const activeCount = countActiveVehicles();
  const tripCount = TRIPS.length; // one trip per vehicle today
  const alertCount = getAlertStops().length;

  setCounter("#hero-vehicles", vehicleCount);
  setCounter("#hero-active", activeCount);
  setCounter("#hero-alerts", alertCount);
  document.querySelector("#hero-alerts-chip").textContent = alertCount;

  document.querySelector("#fleet-vehicles").textContent = vehicleCount;
  document.querySelector("#fleet-active").textContent = activeCount;
  document.querySelector("#fleet-trips").textContent = tripCount;
  document.querySelector("#fleet-alerts").textContent = alertCount;
}

fillLandingNumbers();
