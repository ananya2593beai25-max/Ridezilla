// Turns a ride, a vehicle and the form answers into the record we save.

import { makeId } from "../../lib/storage";
import { travelMinutes } from "../../lib/calc";

export function buildBooking({ user, ride, vehicle, route, fare, co2, form }) {
  return {
    id: makeId("bk"),
    userId: user.id,
    status: "requested", // waits for an admin to assign a vehicle and driver
    assignment: null,
    createdAt: new Date().toISOString(),
    riderName: form.name.trim(),
    riderPhone: form.phone,
    payment: form.payment,
    note: form.note?.trim() || "",
    pickup: { name: ride.pickup.name, lat: ride.pickup.lat, lng: ride.pickup.lng },
    dropoff: { name: ride.dropoff.name, lat: ride.dropoff.lat, lng: ride.dropoff.lng },
    date: ride.date,
    time: ride.time,
    passengers: ride.passengers,
    vehicleId: vehicle.id,
    vehicleName: vehicle.name,
    vehicleType: vehicle.type,
    ratePerKm: vehicle.ratePerKm,
    avgSpeedKmh: vehicle.avgSpeedKmh, // the simulated driver uses these two
    etaMin: vehicle.etaMin,
    distanceKm: Number(route.distanceKm.toFixed(2)),
    durationMin: Math.max(1, Math.round(travelMinutes(vehicle, route.distanceKm))),
    fare: fare.total,
    baselineG: Math.round(co2.baselineG),
    rideG: Math.round(co2.rideG),
    co2SavedG: Math.round(co2.savedG),
    estimated: route.estimated,
  };
}
