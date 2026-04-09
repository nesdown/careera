/**
 * Promo codes: complex keys with per-code discount percent (15, 25, or 100).
 * 100% = free report via /api/redeem-promo; 15/25 = applied at Stripe checkout.
 *
 * Override with PROMO_CODES env, comma-separated entries:
 *   CODE:15,CODE:25,CODE:100
 * Codes are matched case-insensitively after normalisation (trim, uppercase, strip spaces).
 */

export function normalizePromoCode(raw) {
  if (typeof raw !== 'string') return '';
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

/** Default keys are multi-segment, not single words. */
export const DEFAULT_PROMO_DEFINITIONS = [
  ['CR-LQX8-M7KP-9W3N-P15-VK4R-HT92', 15],
  ['CR-NM2K-PZ8W-4LRT-P25-YH91-QX73', 25],
  ['CR-W9VX-KM4J-8PLQ-FULL-100-ZAB4', 100],
];

function parsePromoEnv(envVal) {
  if (!envVal || !String(envVal).trim()) return null;
  const parts = String(envVal)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const out = [];
  for (const p of parts) {
    const colon = p.indexOf(':');
    if (colon === -1) {
      const code = normalizePromoCode(p);
      if (code) out.push([code, 100]);
      continue;
    }
    const code = normalizePromoCode(p.slice(0, colon));
    const n = parseInt(p.slice(colon + 1), 10);
    if (code && [15, 25, 100].includes(n)) out.push([code, n]);
  }
  return out.length ? out : null;
}

export function createPromoMap() {
  const envVal =
    typeof globalThis.process !== 'undefined'
      ? globalThis.process.env?.PROMO_CODES
      : undefined;
  const fromEnv = parsePromoEnv(envVal);
  const pairs = fromEnv
    || DEFAULT_PROMO_DEFINITIONS.map(([c, d]) => [normalizePromoCode(c), d]);
  const map = new Map();
  for (const [code, discountPercent] of pairs) {
    if (!code) continue;
    map.set(code, { used: false, usedAt: null, discountPercent });
  }
  return map;
}

export function discountedCents(baseCents, discountPercent) {
  const d = Number(discountPercent);
  if (!Number.isFinite(d) || d <= 0) return baseCents;
  if (d >= 100) return 0;
  return Math.max(0, Math.round((baseCents * (100 - d)) / 100));
}

/** Stripe line-item amounts (USD cents) — keep in sync with UI copy. */
export const PRICE_REPORT_CENTS = 2999;
export const PRICE_REPORT_CALL_CENTS = 9999;

export const PROMO_CODE_STRINGS = DEFAULT_PROMO_DEFINITIONS.map(([c]) => c);

/** For marketing UI: { code, discountPercent } */
export const PROMO_TIERS = DEFAULT_PROMO_DEFINITIONS.map(([code, discountPercent]) => ({
  code,
  discountPercent,
}));
