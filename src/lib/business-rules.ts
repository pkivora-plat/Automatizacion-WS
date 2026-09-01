import type { AppRole } from "./supabase/database.types";

export function isValidRingSize(size: number) {
  return Number.isFinite(size) && size >= 4 && size <= 13 && Number.isInteger(size * 2);
}

export function isValidWeightRange(minimum: number, maximum: number) {
  return Number.isFinite(minimum) && Number.isFinite(maximum) && minimum > 0 && maximum >= minimum;
}

export function calculateWeightedForecast(
  items: ReadonlyArray<{ value: number; probability: number }>,
) {
  return items.reduce(
    (total, item) => total + (item.value * Math.min(100, Math.max(0, item.probability))) / 100,
    0,
  );
}

export function canManageCatalog(role: AppRole) {
  return role === "admin" || role === "supervisor";
}

export function canManageMembers(role: AppRole) {
  return role === "admin";
}

export function belongsToActiveOrganization(
  recordOrganizationId: string,
  activeOrganizationId: string,
) {
  return Boolean(activeOrganizationId) && recordOrganizationId === activeOrganizationId;
}
