// Pure functions: distance, per-km fare and CO2. No React, no browser APIs, so they are easy to test and explain.

import { KG_CO2_PER_TREE_YEAR } from "./config";

export function haversineKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(x));
}

/**
 * Fare = rate per km x road distance, never below the minimum fare.
 * Example: 37 km at 9/km = 333, which is above the 30 minimum, so the fare is 333.
 */
export function calcFare(vehicle, distanceKm) {
  const perKmTotal = Math.round(vehicle.ratePerKm * distanceKm);
  const total = Math.max(vehicle.minFare, perKmTotal);
  return {
    ratePerKm: vehicle.ratePerKm,
    perKmTotal,
    minFare: vehicle.minFare,
    minApplied: perKmTotal < vehicle.minFare,
    total,
  };
}

/** Grams of CO2 for this ride, the petrol baseline for the same trip, and what was saved. */
export function calcCO2(vehicle, distanceKm) {
  const rideG = vehicle.gramsPerKm * distanceKm;
  const baselineG = vehicle.baselineGramsPerKm * distanceKm;
  const savedG = Math.max(0, baselineG - rideG);
  return { rideG, baselineG, savedG, trees: savedG / 1000 / KG_CO2_PER_TREE_YEAR };
}

/** Minutes for a ride at the vehicle's average speed: distance divided by speed. A 30 km car ride at 60 km/h is 30 minutes. */
export const travelMinutes = (vehicle, distanceKm) => (distanceKm / vehicle.avgSpeedKmh) * 60;

/** E-bikes and e-rickshaws only take short rides. A vehicle with no maxKm (a car) takes any distance. */
export const withinRange = (vehicle, distanceKm) => !vehicle.maxKm || distanceKm <= vehicle.maxKm;

export const seatsFit = (vehicles, passengers) => vehicles.filter((v) => v.seats >= passengers);
