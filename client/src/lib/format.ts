/**
 * Helper functions for formatting currencies and amounts.
 * WealthWise stores all monetary values in cents to avoid floating point precision issues.
 */

export function formatCurrency(cents: number, currencyCode: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function toCents(dollars: number): number {
  return Math.round(dollars * 100);
}

export function toDollars(cents: number): number {
  return Number((cents / 100).toFixed(2));
}
