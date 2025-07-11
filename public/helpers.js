export const getIconForCategory = cat => ({
  food: 'utensils',
  transport: 'car',
  shopping: 'shopping-bag',
  bills: 'receipt',
  entertainment: 'film',
  health: 'heart',
  investment: 'trending-up',
  salary: 'banknote',
  other: 'more-horizontal'
}[cat] ?? 'circle');
export let currentCurrency = 'EUR';

export function applyCurrency(currency) {
  currentCurrency = currency;
  window.dispatchEvent(new CustomEvent('currencyChanged', { detail: currency }));
}

export function formatCurrency(value) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currentCurrency,
    minimumFractionDigits: 2
  }).format(value);
}
