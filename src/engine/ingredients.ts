import type { Ingredient } from "../types";

// The 30 ingredients, balanced across categories. Icons are Material Symbols
// ligature names (rendered via the Icon component).
export const INGREDIENT_LIST: Ingredient[] = [
  // --- Spices (1–10) ---
  { id: "chili", name: "Chili", icon: "local_fire_department", color: "text-red-500", baseValue: 8, category: "spice", rarity: "common", description: "Fiery heat that wakes up any pot." },
  { id: "cumin", name: "Cumin", icon: "spa", color: "text-yellow-600", baseValue: 6, category: "spice", rarity: "common", description: "Warm, earthy backbone spice." },
  { id: "turmeric", name: "Turmeric", icon: "grain", color: "text-yellow-400", baseValue: 5, category: "spice", rarity: "common", description: "Golden colour, gentle bitterness." },
  { id: "coriander_seed", name: "Coriander Seed", icon: "grass", color: "text-green-400", baseValue: 5, category: "spice", rarity: "common", description: "Citrusy, nutty, rounds out blends." },
  { id: "cardamom", name: "Cardamom", icon: "eco", color: "text-green-500", baseValue: 9, category: "spice", rarity: "uncommon", description: "Aromatic pods, sweet and floral." },
  { id: "cloves", name: "Cloves", icon: "pin", color: "text-stone-700", baseValue: 6, category: "spice", rarity: "uncommon", description: "Intense, warming, a little goes far." },
  { id: "cinnamon", name: "Cinnamon", icon: "straighten", color: "text-orange-900", baseValue: 6, category: "spice", rarity: "uncommon", description: "Sweet bark, comforting warmth." },
  { id: "nutmeg", name: "Nutmeg", icon: "egg_alt", color: "text-stone-600", baseValue: 7, category: "spice", rarity: "uncommon", description: "Nutty, sweet, deeply aromatic." },
  { id: "star_anise", name: "Star Anise", icon: "star", color: "text-orange-800", baseValue: 8, category: "spice", rarity: "rare", description: "Liquorice star with serious punch." },
  { id: "saffron", name: "Saffron", icon: "wb_sunny", color: "text-red-400", baseValue: 10, category: "spice", rarity: "rare", description: "The most precious thread of all." },

  // --- Vegetables (11–20) ---
  { id: "garlic", name: "Garlic", icon: "lens_blur", color: "text-stone-400", baseValue: 4, category: "vegetable", rarity: "common", description: "Pungent foundation of flavour." },
  { id: "onion", name: "Onion", icon: "egg", color: "text-purple-400", baseValue: 3, category: "vegetable", rarity: "common", description: "Sweet when cooked low and slow." },
  { id: "tomato", name: "Tomato", icon: "nutrition", color: "text-red-500", baseValue: 4, category: "vegetable", rarity: "common", description: "Bright acidity and body." },
  { id: "potato", name: "Potato", icon: "radio_button_checked", color: "text-amber-700", baseValue: 3, category: "vegetable", rarity: "common", description: "Hearty, soaks up every spice." },
  { id: "curry_leaf", name: "Curry Leaf", icon: "compost", color: "text-green-600", baseValue: 6, category: "vegetable", rarity: "uncommon", description: "Unmistakable South Indian aroma." },
  { id: "pepper", name: "Pepper", icon: "radio_button_unchecked", color: "text-gray-700", baseValue: 5, category: "vegetable", rarity: "uncommon", description: "Sharp, clean bite." },
  { id: "mustard_seed", name: "Mustard Seed", icon: "scatter_plot", color: "text-yellow-500", baseValue: 5, category: "vegetable", rarity: "uncommon", description: "Pops and crackles, nutty heat." },
  { id: "fenugreek", name: "Fenugreek", icon: "blur_on", color: "text-amber-600", baseValue: 6, category: "vegetable", rarity: "uncommon", description: "Maple-bitter, signature depth." },
  { id: "lemongrass", name: "Lemongrass", icon: "forest", color: "text-lime-600", baseValue: 7, category: "vegetable", rarity: "rare", description: "Zesty, fragrant, brightening." },
  { id: "tamarind", name: "Tamarind", icon: "voicemail", color: "text-stone-800", baseValue: 8, category: "vegetable", rarity: "rare", description: "Sour-sweet tang that lingers." },

  // --- Proteins (21–26) ---
  { id: "chicken", name: "Chicken", icon: "set_meal", color: "text-orange-300", baseValue: 5, category: "protein", rarity: "common", description: "Tender, takes on any masala." },
  { id: "cashew", name: "Cashew", icon: "lens", color: "text-amber-300", baseValue: 6, category: "protein", rarity: "common", description: "Creamy richness when blended." },
  { id: "ginger", name: "Ginger", icon: "cruelty_free", color: "text-amber-500", baseValue: 5, category: "protein", rarity: "common", description: "Zingy warmth, aids the whole pot." },
  { id: "coconut", name: "Coconut", icon: "sports_rugby", color: "text-stone-500", baseValue: 7, category: "protein", rarity: "uncommon", description: "Silky, sweet, tropical body." },
  { id: "paprika", name: "Paprika", icon: "cloud", color: "text-red-600", baseValue: 6, category: "protein", rarity: "uncommon", description: "Smoky-sweet colour and flavour." },
  { id: "garam_masala", name: "Garam Masala", icon: "bubble_chart", color: "text-amber-800", baseValue: 8, category: "protein", rarity: "rare", description: "The finishing blend of blends." },

  // --- Dairy (27–29) ---
  { id: "yogurt", name: "Yogurt", icon: "water_drop", color: "text-sky-300", baseValue: 4, category: "dairy", rarity: "common", description: "Cooling, tenderising tang." },
  { id: "ghee", name: "Ghee", icon: "opacity", color: "text-yellow-300", baseValue: 5, category: "dairy", rarity: "common", description: "Clarified gold, carries aroma." },
  { id: "salt", name: "Salt", icon: "ac_unit", color: "text-gray-400", baseValue: 3, category: "dairy", rarity: "common", description: "Makes everything taste of itself." },

  // --- Herbs (30) ---
  { id: "mint", name: "Mint", icon: "local_florist", color: "text-emerald-500", baseValue: 6, category: "herb", rarity: "uncommon", description: "Fresh, cooling lift." },
];

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_LIST.map((i) => [i.id, i]),
);

export const INGREDIENT_IDS: string[] = INGREDIENT_LIST.map((i) => i.id);

export const VALID_INGREDIENT_IDS = new Set(INGREDIENT_IDS);

export const CATEGORIES: { id: Ingredient["category"]; label: string }[] = [
  { id: "spice", label: "Spice" },
  { id: "vegetable", label: "Veg" },
  { id: "protein", label: "Protein" },
  { id: "dairy", label: "Dairy" },
  { id: "herb", label: "Herb" },
];
