import type { Flavor, Ingredient } from "../types";

// The 30 ingredients, balanced across categories. Icons are Material Symbols
// ligature names (rendered via the Icon component).
export const INGREDIENT_LIST: Ingredient[] = [
  // --- Spices (1–10) ---
  { id: "chili", name: "Chili", icon: "local_fire_department", color: "text-red-500", baseValue: 8, category: "spice", flavor: "spicy", rarity: "common", description: "Fiery heat that wakes up any pot." },
  { id: "cumin", name: "Cumin", icon: "spa", color: "text-yellow-600", baseValue: 6, category: "spice", flavor: "savory", rarity: "common", description: "Warm, earthy backbone spice." },
  { id: "turmeric", name: "Turmeric", icon: "grain", color: "text-yellow-400", baseValue: 5, category: "spice", flavor: "savory", rarity: "common", description: "Golden colour, gentle bitterness." },
  { id: "coriander_seed", name: "Coriander Seed", icon: "grass", color: "text-green-400", baseValue: 5, category: "spice", flavor: "savory", rarity: "common", description: "Citrusy, nutty, rounds out blends." },
  { id: "cardamom", name: "Cardamom", icon: "eco", color: "text-green-500", baseValue: 9, category: "spice", flavor: "sweet", rarity: "uncommon", description: "Aromatic pods, sweet and floral." },
  { id: "cloves", name: "Cloves", icon: "pin", color: "text-stone-700", baseValue: 6, category: "spice", flavor: "sweet", rarity: "uncommon", description: "Intense, warming, a little goes far." },
  { id: "cinnamon", name: "Cinnamon", icon: "straighten", color: "text-orange-900", baseValue: 6, category: "spice", flavor: "sweet", rarity: "uncommon", description: "Sweet bark, comforting warmth." },
  { id: "nutmeg", name: "Nutmeg", icon: "egg_alt", color: "text-stone-600", baseValue: 7, category: "spice", flavor: "sweet", rarity: "uncommon", description: "Nutty, sweet, deeply aromatic." },
  { id: "star_anise", name: "Star Anise", icon: "star", color: "text-orange-800", baseValue: 8, category: "spice", flavor: "unique", rarity: "rare", description: "Liquorice star with serious punch." },
  { id: "saffron", name: "Saffron", icon: "wb_sunny", color: "text-red-400", baseValue: 10, category: "spice", flavor: "unique", rarity: "rare", description: "The most precious thread of all." },

  // --- Vegetables (11–20) ---
  { id: "garlic", name: "Garlic", icon: "lens_blur", color: "text-stone-400", baseValue: 4, category: "vegetable", flavor: "savory", rarity: "common", description: "Pungent foundation of flavour." },
  { id: "onion", name: "Onion", icon: "egg", color: "text-purple-400", baseValue: 3, category: "vegetable", flavor: "savory", rarity: "common", description: "Sweet when cooked low and slow." },
  { id: "tomato", name: "Tomato", icon: "nutrition", color: "text-red-500", baseValue: 4, category: "vegetable", flavor: "savory", rarity: "common", description: "Bright acidity and body." },
  { id: "potato", name: "Potato", icon: "radio_button_checked", color: "text-amber-700", baseValue: 3, category: "vegetable", flavor: "mild", rarity: "common", description: "Hearty, soaks up every spice." },
  { id: "curry_leaf", name: "Curry Leaf", icon: "compost", color: "text-green-600", baseValue: 6, category: "vegetable", flavor: "savory", rarity: "uncommon", description: "Unmistakable South Indian aroma." },
  { id: "pepper", name: "Pepper", icon: "radio_button_unchecked", color: "text-gray-700", baseValue: 5, category: "vegetable", flavor: "spicy", rarity: "uncommon", description: "Sharp, clean bite." },
  { id: "mustard_seed", name: "Mustard Seed", icon: "scatter_plot", color: "text-yellow-500", baseValue: 5, category: "vegetable", flavor: "spicy", rarity: "uncommon", description: "Pops and crackles, nutty heat." },
  { id: "fenugreek", name: "Fenugreek", icon: "blur_on", color: "text-amber-600", baseValue: 6, category: "vegetable", flavor: "unique", rarity: "uncommon", description: "Maple-bitter, signature depth." },
  { id: "lemongrass", name: "Lemongrass", icon: "forest", color: "text-lime-600", baseValue: 7, category: "vegetable", flavor: "unique", rarity: "rare", description: "Zesty, fragrant, brightening." },
  { id: "tamarind", name: "Tamarind", icon: "voicemail", color: "text-stone-800", baseValue: 8, category: "vegetable", flavor: "sweet", rarity: "rare", description: "Sour-sweet tang that lingers." },

  // --- Proteins (21–26) ---
  { id: "chicken", name: "Chicken", icon: "set_meal", color: "text-orange-300", baseValue: 5, category: "protein", flavor: "savory", rarity: "common", description: "Tender, takes on any masala." },
  { id: "cashew", name: "Cashew", icon: "lens", color: "text-amber-300", baseValue: 6, category: "protein", flavor: "mild", rarity: "common", description: "Creamy richness when blended." },
  { id: "ginger", name: "Ginger", icon: "cruelty_free", color: "text-amber-500", baseValue: 5, category: "protein", flavor: "spicy", rarity: "common", description: "Zingy warmth, aids the whole pot." },
  { id: "coconut", name: "Coconut", icon: "sports_rugby", color: "text-stone-500", baseValue: 7, category: "protein", flavor: "mild", rarity: "uncommon", description: "Silky, sweet, tropical body." },
  { id: "paprika", name: "Paprika", icon: "cloud", color: "text-red-600", baseValue: 6, category: "protein", flavor: "spicy", rarity: "uncommon", description: "Smoky-sweet colour and flavour." },
  { id: "garam_masala", name: "Garam Masala", icon: "bubble_chart", color: "text-amber-800", baseValue: 8, category: "protein", flavor: "spicy", rarity: "rare", description: "The finishing blend of blends." },

  // --- Dairy (27–29) ---
  { id: "yogurt", name: "Yogurt", icon: "water_drop", color: "text-sky-300", baseValue: 4, category: "dairy", flavor: "mild", rarity: "common", description: "Cooling, tenderising tang." },
  { id: "ghee", name: "Ghee", icon: "opacity", color: "text-yellow-300", baseValue: 5, category: "dairy", flavor: "mild", rarity: "common", description: "Clarified gold, carries aroma." },
  { id: "salt", name: "Salt", icon: "ac_unit", color: "text-gray-400", baseValue: 3, category: "dairy", flavor: "savory", rarity: "common", description: "Makes everything taste of itself." },

  // --- Herbs (30) ---
  { id: "mint", name: "Mint", icon: "local_florist", color: "text-emerald-500", baseValue: 6, category: "herb", flavor: "mild", rarity: "uncommon", description: "Fresh, cooling lift." },

  // --- Coastal Set (31–35, franchise: set_coastal) ---
  { id: "shrimp", name: "Shrimp", icon: "phishing", color: "text-rose-400", baseValue: 5, category: "protein", flavor: "savory", rarity: "common", description: "Sweet snap of the sea in every bite.", set: "coastal" },
  { id: "kokum", name: "Kokum", icon: "circle", color: "text-purple-800", baseValue: 6, category: "vegetable", flavor: "sweet", rarity: "uncommon", description: "Dark coastal fruit, sour-sweet and cooling.", set: "coastal" },
  { id: "malvani_masala", name: "Malvani Masala", icon: "cyclone", color: "text-red-700", baseValue: 7, category: "spice", flavor: "spicy", rarity: "uncommon", description: "Fierce Konkan blend that smells of the shore.", set: "coastal" },
  { id: "sea_salt", name: "Sea Salt", icon: "blur_circular", color: "text-cyan-300", baseValue: 4, category: "dairy", flavor: "savory", rarity: "common", description: "Flaky crystals raked from sun-dried pans.", set: "coastal" },
  { id: "lime_leaf", name: "Lime Leaf", icon: "energy_savings_leaf", color: "text-lime-500", baseValue: 6, category: "herb", flavor: "unique", rarity: "rare", description: "One torn leaf perfumes the whole pot.", set: "coastal" },

  // --- Street Food Set (36–40, franchise: set_street) ---
  { id: "chaat_masala", name: "Chaat Masala", icon: "auto_awesome", color: "text-amber-500", baseValue: 6, category: "spice", flavor: "unique", rarity: "uncommon", description: "Tangy cart-side dust that makes tongues dance.", set: "street" },
  { id: "green_chutney", name: "Green Chutney", icon: "invert_colors", color: "text-green-500", baseValue: 4, category: "herb", flavor: "spicy", rarity: "common", description: "Mint-coriander fire, slathered on everything.", set: "street" },
  { id: "pav", name: "Pav", icon: "bakery_dining", color: "text-amber-400", baseValue: 4, category: "dairy", flavor: "mild", rarity: "common", description: "Butter-toasted roll, the street's soft pillow.", set: "street" },
  { id: "jaggery", name: "Jaggery", icon: "cookie", color: "text-amber-800", baseValue: 5, category: "vegetable", flavor: "sweet", rarity: "common", description: "Raw cane gold, smoky and molasses-deep.", set: "street" },
  { id: "seekh_kebab", name: "Seekh Kebab", icon: "kebab_dining", color: "text-orange-700", baseValue: 7, category: "protein", flavor: "savory", rarity: "rare", description: "Char-grilled skewer straight off the coals.", set: "street" },

  // --- Royal Set (41–45, franchise: set_royal) ---
  { id: "silver_leaf", name: "Edible Silver Leaf", icon: "diamond", color: "text-slate-300", baseValue: 12, category: "spice", flavor: "unique", rarity: "rare", description: "Gossamer varq fit for an emperor's thali.", set: "royal" },
  { id: "kewra_water", name: "Kewra Water", icon: "water", color: "text-teal-300", baseValue: 9, category: "dairy", flavor: "sweet", rarity: "rare", description: "A palace biryani in a single fragrant drop.", set: "royal" },
  { id: "rose_petals", name: "Rose Petals", icon: "filter_vintage", color: "text-pink-400", baseValue: 8, category: "herb", flavor: "mild", rarity: "uncommon", description: "Dried blushes from the royal garden.", set: "royal" },
  { id: "dried_apricot", name: "Dried Apricot", icon: "brightness_1", color: "text-orange-400", baseValue: 8, category: "vegetable", flavor: "sweet", rarity: "uncommon", description: "Amber jewels that melt into the gravy.", set: "royal" },
  { id: "white_pepper", name: "White Pepper", icon: "adjust", color: "text-stone-300", baseValue: 10, category: "spice", flavor: "spicy", rarity: "rare", description: "Refined heat that never shows its hand.", set: "royal" },

  // --- Himalayan Set (46–50, franchise: set_himalayan) ---
  { id: "yak_butter", name: "Yak Butter", icon: "opacity", color: "text-amber-200", baseValue: 7, category: "dairy", flavor: "mild", rarity: "uncommon", description: "Churned at altitude, rich as the mountain air is thin.", set: "himalayan" },
  { id: "black_cardamom", name: "Black Cardamom", icon: "eco", color: "text-stone-800", baseValue: 9, category: "spice", flavor: "unique", rarity: "rare", description: "Smoked over open fires, dark cousin of the green pod.", set: "himalayan" },
  { id: "timur_pepper", name: "Timur Pepper", icon: "flare", color: "text-rose-700", baseValue: 10, category: "spice", flavor: "spicy", rarity: "rare", description: "Numbing Nepali berry that makes lips tingle.", set: "himalayan" },
  { id: "buckwheat", name: "Buckwheat", icon: "grain", color: "text-stone-500", baseValue: 5, category: "vegetable", flavor: "savory", rarity: "common", description: "Hardy highland grain, toasty and honest.", set: "himalayan" },
  { id: "juniper_berry", name: "Juniper Berry", icon: "forest", color: "text-indigo-600", baseValue: 6, category: "herb", flavor: "unique", rarity: "uncommon", description: "Piney mountain berries crushed into the pot.", set: "himalayan" },

  // --- Tandoor Set (51–55, franchise: set_tandoor) ---
  { id: "charcoal_smoke", name: "Charcoal Smoke", icon: "air", color: "text-gray-600", baseValue: 8, category: "spice", flavor: "unique", rarity: "rare", description: "A glowing coal dropped in ghee — dhungar magic.", set: "tandoor" },
  { id: "naan_crisp", name: "Naan Crisp", icon: "bakery_dining", color: "text-amber-300", baseValue: 4, category: "dairy", flavor: "mild", rarity: "common", description: "Blistered flatbread shards from the clay wall.", set: "tandoor" },
  { id: "kasuri_methi", name: "Kasuri Methi", icon: "compost", color: "text-green-700", baseValue: 7, category: "herb", flavor: "savory", rarity: "uncommon", description: "Dried fenugreek leaves, crumbled over everything rich.", set: "tandoor" },
  { id: "black_salt", name: "Black Salt", icon: "ac_unit", color: "text-purple-900", baseValue: 5, category: "vegetable", flavor: "savory", rarity: "common", description: "Sulphurous kala namak with volcanic attitude.", set: "tandoor" },
  { id: "tandoori_paneer", name: "Tandoori Paneer", icon: "kebab_dining", color: "text-orange-500", baseValue: 7, category: "protein", flavor: "savory", rarity: "uncommon", description: "Charred cubes straight off the skewer.", set: "tandoor" },

  // --- Mithai Set (56–60, franchise: set_mithai) ---
  { id: "khoya", name: "Khoya", icon: "cloud", color: "text-stone-200", baseValue: 8, category: "dairy", flavor: "sweet", rarity: "uncommon", description: "Milk simmered down to its sweetest self.", set: "mithai" },
  { id: "pistachio", name: "Pistachio", icon: "lens", color: "text-green-400", baseValue: 7, category: "protein", flavor: "sweet", rarity: "uncommon", description: "Emerald slivers crowning every sweet.", set: "mithai" },
  { id: "rose_syrup", name: "Rose Syrup", icon: "water_drop", color: "text-pink-500", baseValue: 6, category: "vegetable", flavor: "sweet", rarity: "common", description: "Ruby-red rose sharbat, summer in a bottle.", set: "mithai" },
  { id: "cardamom_sugar", name: "Cardamom Sugar", icon: "auto_awesome", color: "text-emerald-300", baseValue: 9, category: "spice", flavor: "sweet", rarity: "rare", description: "Fragrant crystals that perfume the whole tray.", set: "mithai" },
  { id: "saffron_milk", name: "Saffron Milk", icon: "wb_sunny", color: "text-yellow-400", baseValue: 10, category: "dairy", flavor: "unique", rarity: "rare", description: "Golden kesar doodh, dessert's finishing touch.", set: "mithai" },
];

export const FLAVORS: Flavor[] = ["spicy", "mild", "sweet", "savory", "unique"];

export const INGREDIENTS: Record<string, Ingredient> = Object.fromEntries(
  INGREDIENT_LIST.map((i) => [i.id, i]),
);

export const INGREDIENT_IDS: string[] = INGREDIENT_LIST.map((i) => i.id);

// Base roster (no franchise `set`) — the always-available ingredients. Daily
// specials and guaranteed combos draw from these so a player is never asked to
// use an ingredient they haven't unlocked. Franchise sets extend INGREDIENT_LIST.
export const BASE_INGREDIENT_IDS: string[] = INGREDIENT_LIST.filter(
  (i) => !i.set,
).map((i) => i.id);

export const VALID_INGREDIENT_IDS = new Set(INGREDIENT_IDS);

export const CATEGORIES: { id: Ingredient["category"]; label: string }[] = [
  { id: "spice", label: "Spice" },
  { id: "vegetable", label: "Veg" },
  { id: "protein", label: "Protein" },
  { id: "dairy", label: "Dairy" },
  { id: "herb", label: "Herb" },
];
