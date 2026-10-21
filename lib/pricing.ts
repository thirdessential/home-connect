// Single place that turns a directory entry's pricing into display rows.
// Mobile entries store {rate, subtext}; admin-created entries mirror
// {rate, description}. Both, JSON strings and `price` are accepted.
export type PricingLine = { amount: string; label: string };

const toList = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const formatRupees = (rate: unknown): string => {
  if (rate === null || rate === undefined || rate === "") return "";
  const n = Number(typeof rate === "string" ? rate.replace(/[₹,\s]/g, "") : rate);
  return Number.isFinite(n) ? `₹${n.toLocaleString("en-IN")}` : "";
};

export const normalizePricing = (entry: any): PricingLine[] => {
  const raw = toList(entry?.pricingRates).length ? toList(entry?.pricingRates) : toList(entry?.pricing_rates);
  return raw
    .filter((r) => r && typeof r === "object")
    .map((r) => ({
      amount: formatRupees(r.rate ?? r.price),
      label: String(r.subtext ?? r.description ?? "").trim(),
    }))
    .filter((r) => r.amount || r.label);
};

export const NO_PRICING_TEXT = "No pricing available";
