export const FDA_ALLERGENS = [
  'Wheat',
  'Milk',
  'Eggs',
  'Peanuts',
  'Tree Nuts',
  'Fish',
  'Shellfish',
  'Soy',
  'Sesame',
] as const;

export const LIFESTYLE_PREFERENCES = ['Vegetarian', 'Vegan'] as const;

export const ALLERGEN_ICONS: Record<string, string> = {
  Wheat: '🌾',
  Milk: '🥛',
  Eggs: '🥚',
  Peanuts: '🥜',
  'Tree Nuts': '🌰',
  Fish: '🐟',
  Shellfish: '🦐',
  Soy: '🫘',
  Sesame: '⚪',
  Vegetarian: '🥬',
  Vegan: '🌱',
};

export const ALLERGEN_I18N_KEYS: Record<string, string> = {
  Wheat: 'wheat',
  Milk: 'milk',
  Eggs: 'eggs',
  Peanuts: 'peanuts',
  'Tree Nuts': 'treeNuts',
  Fish: 'fish',
  Shellfish: 'shellfish',
  Soy: 'soy',
  Sesame: 'sesame',
  Vegetarian: 'vegetarian',
  Vegan: 'vegan',
};

const LEGACY_ALLERGEN_MAP: Record<string, string> = {
  Dairy: 'Milk',
  dairy: 'Milk',
  Nuts: 'Tree Nuts',
  nuts: 'Tree Nuts',
  Gluten: 'Wheat',
  gluten: 'Wheat',
};

export function normalizeAllergen(name: string): string {
  return LEGACY_ALLERGEN_MAP[name] || name;
}

export function getAllergenIcon(name: string): string {
  const normalized = normalizeAllergen(name);
  return ALLERGEN_ICONS[normalized] || '';
}

export function getAllergenI18nKey(name: string): string {
  const normalized = normalizeAllergen(name);
  return ALLERGEN_I18N_KEYS[normalized] || normalized.toLowerCase();
}

export function formatAllergenDisplay(name: string): string {
  const normalized = normalizeAllergen(name);
  const icon = ALLERGEN_ICONS[normalized] || '';
  return icon ? `${icon} ${normalized}` : normalized;
}

export const SUPPRESSED_TAGS = ['GF', 'DF'];
