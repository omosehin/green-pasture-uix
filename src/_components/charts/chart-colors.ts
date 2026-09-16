/**
 * Chart series colours, themed to green-pasture. Ported from ogaryde-admin-ui's
 * chart-colors.ts (whose own 5-hue set was already validated); re-validated here
 * against THIS app's surfaces with the dataviz skill's validator — all six checks
 * pass on both the light card (#ffffff) and dark card (#111827), worst adjacent
 * ΔE 26.4 (normal-vision), 24.5 (deuteranopia). Assigned in FIXED order — never
 * cycled; a 6th category folds into "Other" (grey). Text/labels use ink tokens,
 * never these; these carry mark identity only.
 *
 * Palette derivation (green-pasture has only 4 brand hues — primary green,
 * secondary teal, lime accent, and destructive red — not enough distinguishable
 * hues for a 5-slice donut, so 3 were derived rather than borrowed from ogaryde):
 *  - green  #0e9f6e — same ~160° hue family as --color-primary (#1f6554 /
 *    #469a85 in dark mode), chroma boosted to clear the OKLCH chroma-floor
 *    check (#469a85 alone reads as gray at 0.088 chroma, just under the 0.10
 *    floor); this is the brand hue, not a foreign one.
 *  - red    #dc2626 — reused verbatim from --destructive (globals.css), already
 *    the app's colour for "bad". Zero invention.
 *  - blue, amber, violet — no green-pasture equivalents exist, so these three
 *    were derived to sit at the same lightness/chroma band as the green and red
 *    anchors (mid-saturation, mid-lightness) rather than reusing ogaryde's exact
 *    hues verbatim.
 */
export const CATEGORICAL = ["#0e9f6e", "#2f6fed", "#d97706", "#8b5cf6", "#dc2626"] as const;

export const OTHER_GREY = "#64748b";

/** Single-series trend hues, keyed by metric so a series keeps its colour across views. */
export const TREND = {
  revenue: "#0e9f6e", // money → brand green
  orders: "#2f6fed", // volume → blue
  customers: "#d97706", // growth → amber
} as const;

/**
 * Semantic status → colour, keyed to this app's real OrderStatus enum
 * (src/common/enumerations/order_status.enum.ts in the API repo) rather than
 * ogaryde's ride-hailing statuses, which don't exist in green-pasture's data.
 * COMPLETED/DELIVERED read as brand-green success; CANCELLED/FAILED/RETURNED
 * as red; PENDING/PROCESSING/PRE_PAYMENT/ON_HOLD as in-progress amber/blue;
 * REFUNDED/EXCHANGED as violet — carrying forward the same REFUNDED → violet
 * mapping the old src/pages/admin/dashboard.tsx already used, so this isn't a
 * new colour decision, just the one already made in this codebase.
 * Statuses not listed fall back to the categorical order, then Other.
 */
const STATUS_COLORS: Record<string, string> = {
  COMPLETED: "#0e9f6e",
  DELIVERED: "#0e9f6e",
  PROCESSING: "#2f6fed",
  PENDING: "#d97706",
  PRE_PAYMENT: "#d97706",
  ON_HOLD: "#d97706",
  REFUNDED: "#8b5cf6",
  EXCHANGED: "#8b5cf6",
  CANCELLED: "#dc2626",
  FAILED: "#dc2626",
  RETURNED: "#dc2626",
};

/** Colour for a status slice — semantic when known, else stable-by-index categorical. */
export function statusColor(status: string, index: number): string {
  return STATUS_COLORS[status.toUpperCase()] ?? categoricalColor(index);
}

/** Nth categorical colour; anything past the palette length is "Other" grey. */
export function categoricalColor(index: number): string {
  return index < CATEGORICAL.length ? CATEGORICAL[index] : OTHER_GREY;
}
