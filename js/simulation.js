// simulation.js
// Turns each vehicle's road route (js/data/routes.js) into a timed trip for today:
// how fast the car drives on each piece of road, where it stops and for how long,
// and where it is at any moment. The trip track, map, fuel and alert pages all use
// the TRIPS list made here, so every page tells the same story.
// Load places.js, vehicles.js and routes.js before this file.

// Trips start at 07:00 or a little later (counted in minutes after midnight).
const DAY_START_MINUTE = 7 * 60;

// Business rule 4: parking longer than this at a non-official place creates an alert.
const ALERT_PARK_MINUTES = 30;

// Makes a random number generator that always gives the same numbers for the same seed.
// We use it instead of Math.random() so the demo looks the same every time the page loads.
// This is the well-known "Mulberry32" generator: the bit operations only mix the number up.
// It returns numbers from 0 up to (but not including) 1, like Math.random().
function createRandom(seed) {
  let state = seed;
  return function () {
    state = (state + 0x6d2b79f5) | 0;
    let mixed = Math.imul(state ^ (state >>> 15), 1 | state);
    mixed = (mixed + Math.imul(mixed ^ (mixed >>> 7), 61 | mixed)) ^ mixed;
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296;
  };
}

// Distance in meters between two [lat, lng] points.
// Uses the haversine formula, which measures along the curve of the Earth.
function distanceMeters(pointA, pointB) {
  const earthRadius = 6371000;
  const toRadians = Math.PI / 180;
  const latDifference = (pointB[0] - pointA[0]) * toRadians;
  const lngDifference = (pointB[1] - pointA[1]) * toRadians;
  const haversine =
    Math.sin(latDifference / 2) ** 2 +
    Math.cos(pointA[0] * toRadians) * Math.cos(pointB[0] * toRadians) * Math.sin(lngDifference / 2) ** 2;
  return 2 * earthRadius * Math.asin(Math.sqrt(haversine));
}

// Drives the car along one piece of road (from points[i] to points[i + 1])
// and adds the time, distance and speed to the trip.
function driveRoadPiece(trip, route, i, modelInfo, random) {
  const lengthMeters = distanceMeters(route.points[i], route.points[i + 1]);
  // A government car drives at 70% of the normal road speed, at least 12 km/h,
  // and never faster than the top speed of its model.
  const roadSpeed = Math.min(modelInfo.maxSpeed, Math.max(12, route.speeds[i] * 0.7));
  // Change the speed a little (from -12% to +12%) so the speed chart looks like real driving.
  const speed = roadSpeed * (0.88 + random() * 0.24);
  // km/h divided by 3.6 gives meters per second.
  const seconds = lengthMeters / (speed / 3.6);

  trip.totalTime += seconds;
  trip.totalDistance += lengthMeters;
  trip.movingTime += seconds;
  // Only short pieces are skipped for the top speed, so one tiny piece cannot give a strange value.
  if (speed > trip.maxSpeed && lengthMeters > 150) {
    trip.maxSpeed = speed;
    trip.maxSpeedPointIndex = i;
  }
  trip.timeline.push({ time: trip.totalTime, pointIndex: i + 1, distance: trip.totalDistance, speed: speed });
}

// Parks the car at a place on its route and adds the stop to the trip.
// Official places get a normal stop of 14 to 41 minutes. Non-official places use the
// planted parkMinutes from places.js, so they can trigger the "parked too long" alert.
function parkAtStop(trip, placeKey, pointIndex, random) {
  const place = PLACES[placeKey];
  let parkMinutes = place.parkMinutes;
  if (place.official) {
    parkMinutes = 14 + Math.floor(random() * 28);
  }
  const arriveTime = trip.totalTime;
  const leaveTime = arriveTime + parkMinutes * 60;

  trip.stops.push({
    placeKey: placeKey,
    pointIndex: pointIndex,
    arriveTime: arriveTime,
    leaveTime: leaveTime,
    distance: trip.totalDistance,
    official: place.official,
  });
  trip.totalTime = leaveTime;
  // A second timeline entry at the same point means "the car waited here".
  trip.timeline.push({ time: leaveTime, pointIndex: pointIndex, distance: trip.totalDistance, speed: 0 });
}

// Makes an empty trip for one vehicle, before any driving is added.
// All times are in seconds after the trip started, all distances in meters.
function createEmptyTrip(vehicle, route, tripIndex) {
  return {
    index: tripIndex,
    plate: vehicle.plate,
    model: vehicle.model,
    agency: vehicle.agency,
    driver: vehicle.driver,
    placeKeys: vehicle.route,
    points: route.points,
    // Spread the start times between 07:00 and 08:49 so the cars do not all leave together.
    startMinute: DAY_START_MINUTE + ((tripIndex * 23) % 110),
    // The timeline lists, in order, each moment the car reaches a point or leaves a stop.
    timeline: [{ time: 0, pointIndex: 0, distance: 0, speed: 0 }],
    stops: [],
    totalTime: 0,
    totalDistance: 0,
    movingTime: 0,
    maxSpeed: 0,
    maxSpeedPointIndex: 0,
  };
}

// Builds the whole timed trip for one vehicle from its road route.
function buildTrip(vehicle, route, tripIndex) {
  const modelInfo = MODELS[vehicle.model];
  // Each trip has its own seed, so each car gets different (but always the same) speeds.
  const random = createRandom(tripIndex * 977 + 13);
  const trip = createEmptyTrip(vehicle, route, tripIndex);

  for (let i = 0; i < route.points.length - 1; i++) {
    driveRoadPiece(trip, route, i, modelInfo, random);
    // stopIndexes[0] is the first stop, which is placeKeys[1] (placeKeys[0] is the start).
    const stopNumber = route.stopIndexes.indexOf(i + 1);
    if (stopNumber !== -1) {
      parkAtStop(trip, vehicle.route[stopNumber + 1], i + 1, random);
    }
  }

  trip.unofficialStops = trip.stops.filter((stop) => !stop.official);
  trip.fuelLiters = trip.totalDistance / 1000 / modelInfo.kmPerLiter;
  return trip;
}

// All of today's trips, one per vehicle, in the same order as VEHICLES.
const TRIPS = VEHICLES.map(function (vehicle, index) {
  const route = ROUTES.find((item) => item.vehicleId === vehicle.id);
  return buildTrip(vehicle, route, index);
});

// The state of a car that is standing still at a point (parked at a stop, or finished).
function standingState(pointIndex, distance, parked) {
  return {
    pointIndex: pointIndex,
    nextPointIndex: pointIndex,
    fraction: 0,
    speed: 0,
    distance: distance,
    moving: false,
    parked: parked,
  };
}

// Tells where the car is at a moment of the trip (time = seconds after the start).
// Returns the point it is at (or just passed), how far it is to the next point (fraction 0 to 1),
// its speed, the distance covered so far, and whether it is moving, parked or finished.
function getTripState(trip, time) {
  const timeline = trip.timeline;
  if (time >= trip.totalTime) {
    const lastEntry = timeline[timeline.length - 1];
    return standingState(lastEntry.pointIndex, trip.totalDistance, false);
  }

  // Find the first timeline entry that comes at or after this time.
  let next = 1;
  while (next < timeline.length - 1 && timeline[next].time < time) {
    next++;
  }
  const before = timeline[next - 1];
  const after = timeline[next];

  // Two entries at the same point means the car is parked there.
  if (before.pointIndex === after.pointIndex) {
    return standingState(before.pointIndex, before.distance, true);
  }

  let fraction = (time - before.time) / (after.time - before.time);
  fraction = Math.min(1, Math.max(0, fraction));
  return {
    pointIndex: before.pointIndex,
    nextPointIndex: after.pointIndex,
    fraction: fraction,
    speed: after.speed,
    distance: before.distance + (after.distance - before.distance) * fraction,
    moving: true,
    parked: false,
  };
}

// The [lat, lng] of the car at a moment of the trip, for showing it on a real map.
function getTripLatLng(trip, time) {
  const state = getTripState(trip, time);
  const from = trip.points[state.pointIndex];
  const to = trip.points[state.nextPointIndex];
  const lat = from[0] + (to[0] - from[0]) * state.fraction;
  const lng = from[1] + (to[1] - from[1]) * state.fraction;
  return [lat, lng];
}

// The stop the car is parked at, at a moment of the trip, or undefined if it is not stopped.
function getStopAt(trip, time) {
  return trip.stops.find((stop) => time >= stop.arriveTime && time < stop.leaveTime);
}

// True if this stop breaks business rule 4 (too long at a non-official place).
function isAlertStop(stop) {
  const parkedMinutes = (stop.leaveTime - stop.arriveTime) / 60;
  return !stop.official && parkedMinutes > ALERT_PARK_MINUTES;
}

// All stops of today that create an alert, from every trip.
function getAlertStops() {
  let alertStops = [];
  TRIPS.forEach(function (trip) {
    alertStops = alertStops.concat(trip.stops.filter(isAlertStop));
  });
  return alertStops;
}

// ---------- the demo clock ----------
// The simulated trips only happen in the morning (from 07:00 until the last car is back).
// So that the expo always has cars on the road, the demo uses the real time when it falls
// inside those busy hours, and otherwise loops through the busy hours again and again.

// The first start and the last arrival of the day, in minutes after midnight.
function getBusyHours() {
  let firstStart = TRIPS[0].startMinute;
  let lastArrival = 0;
  TRIPS.forEach(function (trip) {
    firstStart = Math.min(firstStart, trip.startMinute);
    lastArrival = Math.max(lastArrival, trip.startMinute + trip.totalTime / 60);
  });
  return { firstStart: firstStart, lastArrival: lastArrival };
}

// The demo time right now, in minutes after midnight (with seconds as a decimal part).
function getDemoMinute() {
  const now = new Date();
  const realMinute = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const busyHours = getBusyHours();
  if (realMinute >= busyHours.firstStart && realMinute <= busyHours.lastArrival) {
    return realMinute;
  }
  const busyLength = busyHours.lastArrival - busyHours.firstStart;
  return busyHours.firstStart + (realMinute % busyLength);
}

// Seconds since this trip started, at a demo time. Below 0 means the car has not left yet.
function getTripTimeAt(trip, demoMinute) {
  return (demoMinute - trip.startMinute) * 60;
}

// True if the car is out on its trip (driving or parked at a stop) at a demo time.
function isOnTheRoad(trip, demoMinute) {
  const time = getTripTimeAt(trip, demoMinute);
  return time > 0 && time < trip.totalTime;
}
