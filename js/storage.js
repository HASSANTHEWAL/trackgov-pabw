// storage.js
// The ONLY file that reads and writes localStorage (things users enter in the demo).
// When the backend is ready, only this file changes: each function will use fetch()
// to talk to the server instead, and the pages that call these functions stay the same.

// The names under which we save each list in localStorage.
const STORAGE_KEYS = {
  refuels: "trackgov.refuels",
};

// Reads a saved list. Returns an empty list if nothing is saved yet,
// or if the browser blocks storage (for example in some private windows).
function readList(key) {
  try {
    const text = localStorage.getItem(key);
    if (!text) {
      return [];
    }
    return JSON.parse(text);
  } catch (error) {
    return [];
  }
}

// Saves a list. Returns false if the browser would not let us save.
function writeList(key, list) {
  try {
    localStorage.setItem(key, JSON.stringify(list));
    return true;
  } catch (error) {
    return false;
  }
}

// ---------- refuels ----------

// All refuels that users added with the refuel form.
function getSavedRefuels() {
  return readList(STORAGE_KEYS.refuels);
}

// Adds one refuel. Gives it an id (the time it was saved, in milliseconds) so it can be removed later.
// Returns false if it could not be saved.
function saveRefuel(refuel) {
  const refuels = getSavedRefuels();
  refuel.id = Date.now();
  refuels.push(refuel);
  return writeList(STORAGE_KEYS.refuels, refuels);
}

// Removes one refuel that a user added, by its id.
function deleteSavedRefuel(id) {
  const refuels = getSavedRefuels().filter((refuel) => refuel.id !== id);
  writeList(STORAGE_KEYS.refuels, refuels);
}
