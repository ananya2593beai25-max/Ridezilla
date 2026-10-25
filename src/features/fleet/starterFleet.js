// The starting fleet, added once on first run so the Fleet page has real rows to filter. After that the admin manages it.
// Each row: [category id, model, colour, plate, city, status].

import { SERVICE_AREA } from "../../lib/config";

const CATEGORIES = {
  ebike: { type: "bike", name: "E-Bike", seats: 1 },
  erickshaw: { type: "rickshaw", name: "E-Rickshaw", seats: 3 },
  "ecar-hatch": { type: "car", name: "Electric Hatchback", seats: 4 },
  "ecar-suv": { type: "car", name: "Electric SUV", seats: 6 },
};

const ROWS = [
  // Chandigarh
  ["ecar-hatch", "Tata Tiago EV", "White", "CH01CK4821", "Chandigarh", "available"],
  ["ecar-hatch", "Tata Tigor EV", "Blue", "CH01CM1176", "Chandigarh", "available"],
  ["ecar-suv", "Mahindra XUV400", "Grey", "CH01CP9034", "Chandigarh", "maintenance"],
  ["erickshaw", "Mahindra Treo", "Yellow", "CH01CE2257", "Chandigarh", "available"],
  ["ebike", "Ola S1 Pro", "Black", "CH01CB6612", "Chandigarh", "available"],
  ["ebike", "Ather 450X", "Green", "CH01CB7305", "Chandigarh", "available"],
  // Mohali
  ["ecar-hatch", "MG Comet", "Pink", "PB65AK3340", "Mohali", "available"],
  ["ecar-suv", "Tata Nexon EV", "Silver", "PB65AM5518", "Mohali", "available"],
  ["erickshaw", "Piaggio Ape E-City", "Green", "PB65AE0872", "Mohali", "available"],
  ["ebike", "Hero Optima", "Red", "PB65AB4429", "Mohali", "available"],
  // Panchkula
  ["ecar-hatch", "Tata Tiago EV", "Teal", "HR03AK7765", "Panchkula", "available"],
  ["ecar-suv", "MG ZS EV", "White", "HR03AM2093", "Panchkula", "available"],
  ["erickshaw", "Mahindra Treo", "Yellow", "HR03AE5541", "Panchkula", "maintenance"],
  ["ebike", "Ola S1 Pro", "Grey", "HR03AB1908", "Panchkula", "available"],
  // Ludhiana
  ["ecar-hatch", "Tata Tigor EV", "White", "PB10CK6204", "Ludhiana", "available"],
  ["ecar-suv", "Mahindra XUV400", "Blue", "PB10CM8817", "Ludhiana", "available"],
  ["erickshaw", "Bajaj Maxima E-Cart", "Yellow", "PB10CE3390", "Ludhiana", "available"],
  ["ebike", "Ather 450X", "Black", "PB10CB5076", "Ludhiana", "available"],
  // Amritsar
  ["ecar-hatch", "MG Comet", "White", "PB02CK1459", "Amritsar", "available"],
  ["erickshaw", "Mahindra Treo", "Green", "PB02CE7723", "Amritsar", "available"],
  ["ecar-suv", "Tata Nexon EV", "Grey", "PB02CM4086", "Amritsar", "maintenance"],
  // Jalandhar
  ["ecar-hatch", "Tata Tiago EV", "Red", "PB08CK2931", "Jalandhar", "available"],
  ["ebike", "Hero Optima", "Blue", "PB08CB6648", "Jalandhar", "available"],
  ["erickshaw", "Piaggio Ape E-City", "Yellow", "PB08CE1175", "Jalandhar", "available"],
  // Patiala
  ["ecar-hatch", "Tata Tigor EV", "Silver", "PB11CK8302", "Patiala", "available"],
  ["ebike", "Ola S1 Pro", "White", "PB11CB2517", "Patiala", "available"],
  ["erickshaw", "Mahindra Treo", "Yellow", "PB11CE9964", "Patiala", "available"],
  // Bathinda
  ["ecar-suv", "MG ZS EV", "Blue", "PB03CM3678", "Bathinda", "available"],
  ["ebike", "Ather 450X", "Green", "PB03CB0451", "Bathinda", "available"],
];

const stateOf = (city) => SERVICE_AREA.find((a) => a.cities.includes(city))?.state || "";

/** The starter fleet as a Redux entity-adapter state: { ids, entities }, sorted by model like the slice does. */
export function buildStarterFleet() {
  const now = new Date().toISOString();
  const vehicles = ROWS.map(([catalogueId, modelName, color, plateNumber, city, status], i) => {
    const c = CATEGORIES[catalogueId];
    return {
      id: `veh_seed${String(i + 1).padStart(2, "0")}`,
      catalogueId,
      category: c.type,
      categoryName: c.name,
      modelName,
      plateNumber,
      seats: c.seats,
      color,
      state: stateOf(city),
      city,
      status,
      createdAt: now,
    };
  });
  vehicles.sort((a, b) => a.modelName.localeCompare(b.modelName));
  return { ids: vehicles.map((v) => v.id), entities: Object.fromEntries(vehicles.map((v) => [v.id, v])) };
}
