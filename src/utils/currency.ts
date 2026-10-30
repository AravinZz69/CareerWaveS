/**
 * Indian Rupee (INR) Currency Formatting Utilities (en-IN locale)
 */

export function formatINR(amount: number, showDecimals = false): string {
  if (typeof amount !== 'number' || Number.isNaN(amount)) {
    return '₹0';
  }
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

export function formatINRSalaryRange(min?: number | null, max?: number | null): string {
  if (!min && !max) return 'Competitive Package';
  if (min && max) {
    return `${formatINR(min)} – ${formatINR(max)}`;
  }
  return formatINR(min || max || 0);
}

export function formatCompactINR(amount: number): string {
  if (amount >= 10000000) {
    return `₹${(amount / 10000000).toFixed(2).replace(/\.00$/, '')} Cr`;
  }
  if (amount >= 100000) {
    return `₹${(amount / 100000).toFixed(1).replace(/\.0$/, '')}L`;
  }
  return formatINR(amount);
}
