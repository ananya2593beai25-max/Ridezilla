// Central settings. Change the served area, API hosts or storage keys here.

// The served area is Punjab, Chandigarh and the Panchkula district of Haryana (the tricity is Chandigarh, Mohali, Panchkula).
export const COUNTRY_CODE = "in"; // the only country whose places we accept
export const ALLOWED_STATES = ["Punjab", "Chandigarh"];
export const ALLOWED_ISO_CODES = ["IN-PB", "IN-CH"];
export const ALLOWED_HARYANA_DISTRICTS = ["Panchkula"]; // Haryana is served only here

export const REGION = {
  // [south-west, north-east] as [lat, lng]. A loose box that also holds a little of Haryana, Himachal and Pakistan,
  // so the real check is the state of each place (see features/ride/geocode.js).
  bounds: [
    [29.4, 73.8],
    [32.7, 77.1],
  ],
  // Nominatim viewbox: left,top,right,bottom
  viewbox: "73.8,32.7,77.1,29.4",
  center: [30.73, 76.78], // Chandigarh
  zoom: 9,
  minZoom: 7,
  maxZoom: 18,
};

// Where vehicles are based. The fleet page filters by state, then by city.
export const SERVICE_AREA = [
  { state: "Chandigarh", cities: ["Chandigarh"] },
  { state: "Punjab", cities: ["Mohali", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda"] },
  { state: "Haryana", cities: ["Panchkula"] },
];

export const API = {
  nominatim: "https://nominatim.openstreetmap.org",
  osrm: "https://router.project-osrm.org/route/v1/driving",
  tiles: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
  tileAttribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
};

export const REQUEST_TIMEOUT_MS = 8000;
export const SEARCH_DEBOUNCE_MS = 700;
export const ROAD_FACTOR = 1.3; // straight line to road distance, used only when OSRM fails
export const FALLBACK_SPEED_KMH = 28;
export const KG_CO2_PER_TREE_YEAR = 21;
export const MAX_PASSENGERS = 6;
// The simulated driver moves in real time. Set this to 10 to make a demo ten times faster.
export const SIMULATION_SPEEDUP = 1;

export const STORAGE = {
  users: "ridezilla.users",
  session: "ridezilla.session", // client session (kept from the first version)
  sessionAdmin: "ridezilla.session.admin",
  sessionDriver: "ridezilla.session.driver",
  bookings: "ridezilla.bookings",
  fleet: "ridezilla.fleet",
  drivers: "ridezilla.drivers",
  tickets: "ridezilla.tickets",
  messages: "ridezilla.messages",
  rates: "ridezilla.rates", // fare overrides set by the admin: { [vehicleId]: { ratePerKm, minFare } }
  fleetSeeded: "ridezilla.fleetSeeded.v1", // set once the starter fleet has been added
  resetRequests: "ridezilla.resetRequests", // forgot password requests waiting for the admin
  theme: "ridezilla.theme", // "light" or "dark"
  mockCleared: "ridezilla.mockCleared.v1", // set once the old sample data has been removed
};

// Each role keeps its own session, so one browser can be an admin in one tab and a client in another.
export const SESSION_KEYS = {
  client: STORAGE.session,
  admin: STORAGE.sessionAdmin,
  driver: STORAGE.sessionDriver,
};

// Admins cannot sign up, so one admin account is created on first run. Drivers and vehicles are added by this admin.
export const ADMIN_ACCOUNT = { name: "Ridezilla Admin", email: "admin@ridezilla.test", password: "Admin@12345" };

export const LEVELS = [
  { name: "Seedling", minKg: 0 },
  { name: "Sapling", minKg: 5 },
  { name: "Tree", minKg: 20 },
  { name: "Forest", minKg: 50 },
];
