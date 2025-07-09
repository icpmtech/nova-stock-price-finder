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
