import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePricing } from "../pricing";

test("legacy {rate, subtext}", () => {
  assert.deepEqual(normalizePricing({ pricingRates: [{ rate: "500", subtext: "per visit" }] }), [{ amount: "₹500", label: "per visit" }]);
});
test("admin {rate, description} and multiple rows", () => {
  const out = normalizePricing({ pricingRates: [{ rate: 2, description: "first time" }, { rate: "1000.00", description: "consultation" }] });
  assert.deepEqual(out, [{ amount: "₹2", label: "first time" }, { amount: "₹1,000", label: "consultation" }]);
});
test("JSON string, pricing_rates and price", () => {
  assert.deepEqual(normalizePricing({ pricing_rates: '[{"price":"₹1,200","subtext":"visit"}]' }), [{ amount: "₹1,200", label: "visit" }]);
});
test("empty/null/garbage never yields undefined/NaN", () => {
  assert.deepEqual(normalizePricing({}), []);
  assert.deepEqual(normalizePricing(null), []);
  assert.deepEqual(normalizePricing({ pricingRates: [{ rate: null, subtext: null }] }), []);
  assert.doesNotMatch(JSON.stringify(normalizePricing({ pricingRates: [{ rate: "abc", subtext: "x" }] })), /undefined|NaN|null/);
});

test("real /api/daily-service/approved payload (admin-created, mysql JSON object)", () => {
  assert.deepEqual(normalizePricing({ rate: null, pricingRates: [{ rate: 2, description: "first time" }] }), [
    { amount: "₹2", label: "first time" },
  ]);
});
