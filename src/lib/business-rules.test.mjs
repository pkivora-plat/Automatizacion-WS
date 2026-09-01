import test from "node:test";
import assert from "node:assert/strict";
import {
  belongsToActiveOrganization,
  calculateWeightedForecast,
  canManageCatalog,
  canManageMembers,
  isValidRingSize,
  isValidWeightRange,
} from "./business-rules.ts";

test("solo acepta tallas del 4 al 13 en pasos de media talla", () => {
  assert.equal(isValidRingSize(4), true);
  assert.equal(isValidRingSize(7.5), true);
  assert.equal(isValidRingSize(13), true);
  assert.equal(isValidRingSize(3.5), false);
  assert.equal(isValidRingSize(7.25), false);
});

test("valida el rango de peso", () => {
  assert.equal(isValidWeightRange(5.1, 5.6), true);
  assert.equal(isValidWeightRange(7.2, 6.5), false);
  assert.equal(isValidWeightRange(0, 5), false);
});

test("calcula el pronóstico ponderado y limita probabilidades", () => {
  assert.equal(
    calculateWeightedForecast([
      { value: 1000, probability: 50 },
      { value: 2000, probability: 100 },
    ]),
    2500,
  );
  assert.equal(
    calculateWeightedForecast([
      { value: 1000, probability: 150 },
      { value: 500, probability: -10 },
    ]),
    1000,
  );
});

test("aplica permisos por rol", () => {
  assert.equal(canManageCatalog("admin"), true);
  assert.equal(canManageCatalog("supervisor"), true);
  assert.equal(canManageCatalog("agent"), false);
  assert.equal(canManageMembers("supervisor"), false);
  assert.equal(canManageMembers("admin"), true);
});

test("impide mezclar registros entre organizaciones", () => {
  assert.equal(belongsToActiveOrganization("org-a", "org-a"), true);
  assert.equal(belongsToActiveOrganization("org-b", "org-a"), false);
  assert.equal(belongsToActiveOrganization("org-a", ""), false);
});
