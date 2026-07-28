# All User-Facing Copy — Rewrite Worksheet

Every piece of player-visible text in CurryClicker, in one place, so you can rewrite it
without hunting through the codebase.

## How to apply your edits

1. **Edit the text columns in place** (the `Name` / `Description` / `Current text`
   columns). Leave the `id` and `file:line` columns alone — those are the anchors
   Claude uses to find the string.
2. Partial passes are fine. Anything you don't touch stays as-is.
3. When you're done (or done with a section), say:
   > "Apply allDescriptionsForUpdate.md"
   or "Apply sections 4 and 5 of the copy doc."
4. Claude reads this file, diffs each row against the live source, and edits only the
   rows that changed.

Notes:
- Line numbers are **approximate** (accurate as of this pass) — file paths are exact.
- Anything marked **[ID — do not change]** is a persisted/Steam-registered key. The
  display name next to it is free to rewrite; the id is not.
- Ingredient sprites/icons are tied to ids, not names, so renaming is safe.

---

## 1. Rarity names and labels

Six rarities, ascending. The `label` in `rarityFx.ts` is what the player actually sees
(reel, filter pills, rarity badge on cards); the id in `gacha.ts` is code-only.

`src/components/gacha/rarityFx.ts:17-24`

| id (do not change) | Label (edit) | Where it shows | file:line |
|---|---|---|---|
| `common` | Common | Reel tile, roll card badge, filter pill | `src/components/gacha/rarityFx.ts:18` |
| `uncommon` | Uncommon | same | `src/components/gacha/rarityFx.ts:19` |
| `rare` | Rare | same | `src/components/gacha/rarityFx.ts:20` |
| `epic` | Epic | same | `src/components/gacha/rarityFx.ts:21` |
| `legendary` | Legendary | same | `src/components/gacha/rarityFx.ts:22` |
| `currylicious` | Currylicious | same | `src/components/gacha/rarityFx.ts:23` |

Related shout-out strings on the full-screen reveal overlay (top two rarities only):

| id | Current text | file:line |
|---|---|---|
| `legendary` reveal | `LEGENDARY!` | `src/components/gacha/RarityRevealOverlay.tsx:19` |
| `currylicious` reveal | `CURRYLICIOUS!` | `src/components/gacha/RarityRevealOverlay.tsx:20` |

---

## 2. Float band names

The CS:GO-style "wear" label printed next to each modifier bar on a roll card. `f` is the
modifier's float in [0,1].

`src/engine/gacha.ts:110-116`

| Band range | Current name (edit) | file:line |
|---|---|---|
| f < 0.2 | Bland | `src/engine/gacha.ts:111` |
| 0.2 ≤ f < 0.4 | Simmered | `src/engine/gacha.ts:112` |
| 0.4 ≤ f < 0.6 | Seasoned | `src/engine/gacha.ts:113` |
| 0.6 ≤ f < 0.8 | Rich | `src/engine/gacha.ts:114` |
| f ≥ 0.8 | Sublime | `src/engine/gacha.ts:115` (and the fallback on `:120`) |

Heads-up: `Sublime` appears twice — the table row and the fallback `return` on line 120.
Both need the same new word.

---

## 3. Modifier type labels

The six bonus types a rolled ingredient can carry. Labels live in `RollCard`.

`src/components/gacha/RollCard.tsx:15-22`

| id (do not change) | Label (edit) | What it does | file:line |
|---|---|---|---|
| `click_mult` | Click power | % multiplier on curry per cook | `src/components/gacha/RollCard.tsx:16` |
| `flat_click` | Flat click | flat curry added per cook | `src/components/gacha/RollCard.tsx:17` |
| `crit_chance` | Crit chance | % more crit circles spawn | `src/components/gacha/RollCard.tsx:18` |
| `crit_power` | Crit power | % bigger crit payouts | `src/components/gacha/RollCard.tsx:19` |
| `fire_gain` | Fire gain | % more On Fire earnings | `src/components/gacha/RollCard.tsx:20` |
| `spin_discount` | Spin discount | % off gacha spin cost | `src/components/gacha/RollCard.tsx:21` |

Two more strings on the same component:

| Key | Current text | file:line |
|---|---|---|
| compact card "equipped" flag | `On` | `src/components/gacha/RollCard.tsx:74` |
| full card "equipped" flag | `Equipped` | `src/components/gacha/RollCard.tsx:113` |

---

## 4. The 60 ingredients

All names + descriptions live in `src/engine/ingredients.ts`. The **gacha rarity** comes
from `RARITY_INGREDIENTS` in `src/engine/gacha.ts:213-286` — it's shown here for context
so you can pitch the copy at the right tier (staples read plain, top tier reads precious).
Rarity assignment is a balance knob, not copy; if you want to move an ingredient between
tiers, say so separately.

### 4.1 Common — 1 bonus per roll (`src/engine/gacha.ts:214-225`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `salt` | Salt | Makes everything taste of itself. | `src/engine/ingredients.ts:42` |
| `onion` | Onion | Sweet when cooked low and slow. | `src/engine/ingredients.ts:21` |
| `potato` | Potato | Hearty, soaks up every spice. | `src/engine/ingredients.ts:23` |
| `garlic` | Garlic | Pungent foundation of flavour. | `src/engine/ingredients.ts:20` |
| `tomato` | Tomato | Bright acidity and body. | `src/engine/ingredients.ts:22` |
| `turmeric` | Turmeric | Golden colour, gentle bitterness. | `src/engine/ingredients.ts:10` |
| `cumin` | Cumin | Warm, earthy backbone spice. | `src/engine/ingredients.ts:9` |
| `coriander_seed` | Coriander Seed | Citrusy, nutty, rounds out blends. | `src/engine/ingredients.ts:11` |
| `chili` | Chili | Fiery heat that wakes up any pot. | `src/engine/ingredients.ts:8` |
| `pepper` | Pepper | Sharp, clean bite. | `src/engine/ingredients.ts:25` |

### 4.2 Uncommon — 2 bonuses (`src/engine/gacha.ts:226-237`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `ginger` | Ginger | Zingy warmth, aids the whole pot. | `src/engine/ingredients.ts:34` |
| `yogurt` | Yogurt | Cooling, tenderising tang. | `src/engine/ingredients.ts:40` |
| `ghee` | Ghee | Clarified gold, carries aroma. | `src/engine/ingredients.ts:41` |
| `chicken` | Chicken | Tender, takes on any masala. | `src/engine/ingredients.ts:32` |
| `cashew` | Cashew | Creamy richness when blended. | `src/engine/ingredients.ts:33` |
| `mustard_seed` | Mustard Seed | Pops and crackles, nutty heat. | `src/engine/ingredients.ts:26` |
| `curry_leaf` | Curry Leaf | Unmistakable South Indian aroma. | `src/engine/ingredients.ts:24` |
| `pav` | Pav | Butter-toasted roll, the street's soft pillow. | `src/engine/ingredients.ts:57` |
| `green_chutney` | Green Chutney | Mint-coriander fire, slathered on everything. | `src/engine/ingredients.ts:56` |
| `buckwheat` | Buckwheat | Hardy highland grain, toasty and honest. | `src/engine/ingredients.ts:72` |

### 4.3 Rare — 3 bonuses (`src/engine/gacha.ts:238-249`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `cardamom` | Cardamom | Aromatic pods, sweet and floral. | `src/engine/ingredients.ts:12` |
| `cloves` | Cloves | Intense, warming, a little goes far. | `src/engine/ingredients.ts:13` |
| `cinnamon` | Cinnamon | Sweet bark, comforting warmth. | `src/engine/ingredients.ts:14` |
| `nutmeg` | Nutmeg | Nutty, sweet, deeply aromatic. | `src/engine/ingredients.ts:15` |
| `coconut` | Coconut | Silky, sweet, tropical body. | `src/engine/ingredients.ts:35` |
| `paprika` | Paprika | Smoky-sweet colour and flavour. | `src/engine/ingredients.ts:36` |
| `mint` | Mint | Fresh, cooling lift. | `src/engine/ingredients.ts:45` |
| `sea_salt` | Sea Salt | Flaky crystals raked from sun-dried pans. | `src/engine/ingredients.ts:51` |
| `black_salt` | Black Salt | Sulphurous kala namak with volcanic attitude. | `src/engine/ingredients.ts:79` |
| `naan_crisp` | Naan Crisp | Blistered flatbread shards from the clay wall. | `src/engine/ingredients.ts:77` |

### 4.4 Epic — 4 bonuses (`src/engine/gacha.ts:250-261`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `star_anise` | Star Anise | Liquorice star with serious punch. | `src/engine/ingredients.ts:16` |
| `fenugreek` | Fenugreek | Maple-bitter, signature depth. | `src/engine/ingredients.ts:27` |
| `lemongrass` | Lemongrass | Zesty, fragrant, brightening. | `src/engine/ingredients.ts:28` |
| `tamarind` | Tamarind | Sour-sweet tang that lingers. | `src/engine/ingredients.ts:29` |
| `garam_masala` | Garam Masala | The finishing blend of blends. | `src/engine/ingredients.ts:37` |
| `shrimp` | Shrimp | Sweet snap of the sea in every bite. | `src/engine/ingredients.ts:48` |
| `kokum` | Kokum | Dark coastal fruit, sour-sweet and cooling. | `src/engine/ingredients.ts:49` |
| `jaggery` | Jaggery | Raw cane gold, smoky and molasses-deep. | `src/engine/ingredients.ts:58` |
| `rose_syrup` | Rose Syrup | Ruby-red rose sharbat, summer in a bottle. | `src/engine/ingredients.ts:85` |
| `kasuri_methi` | Kasuri Methi | Dried fenugreek leaves, crumbled over everything rich. | `src/engine/ingredients.ts:78` |

### 4.5 Legendary — 5 bonuses (`src/engine/gacha.ts:262-273`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `malvani_masala` | Malvani Masala | Fierce Konkan blend that smells of the shore. | `src/engine/ingredients.ts:50` |
| `chaat_masala` | Chaat Masala | Tangy cart-side dust that makes tongues dance. | `src/engine/ingredients.ts:55` |
| `seekh_kebab` | Seekh Kebab | Char-grilled skewer straight off the coals. | `src/engine/ingredients.ts:59` |
| `rose_petals` | Rose Petals | Dried blushes from the royal garden. | `src/engine/ingredients.ts:64` |
| `dried_apricot` | Dried Apricot | Amber jewels that melt into the gravy. | `src/engine/ingredients.ts:65` |
| `white_pepper` | White Pepper | Refined heat that never shows its hand. | `src/engine/ingredients.ts:66` |
| `yak_butter` | Yak Butter | Churned at altitude, rich as the mountain air is thin. | `src/engine/ingredients.ts:69` |
| `juniper_berry` | Juniper Berry | Piney mountain berries crushed into the pot. | `src/engine/ingredients.ts:73` |
| `tandoori_paneer` | Tandoori Paneer | Charred cubes straight off the skewer. | `src/engine/ingredients.ts:80` |
| `pistachio` | Pistachio | Emerald slivers crowning every sweet. | `src/engine/ingredients.ts:84` |

### 4.6 Currylicious — 6 bonuses, ~1 in 500 (`src/engine/gacha.ts:274-285`)

| id | Name (edit) | Description (edit) | file:line |
|---|---|---|---|
| `saffron` | Saffron | The most precious thread of all. | `src/engine/ingredients.ts:17` |
| `silver_leaf` | Edible Silver Leaf | Gossamer varq fit for an emperor's thali. | `src/engine/ingredients.ts:62` |
| `kewra_water` | Kewra Water | A palace biryani in a single fragrant drop. | `src/engine/ingredients.ts:63` |
| `black_cardamom` | Black Cardamom | Smoked over open fires, dark cousin of the green pod. | `src/engine/ingredients.ts:70` |
| `timur_pepper` | Timur Pepper | Numbing Nepali berry that makes lips tingle. | `src/engine/ingredients.ts:71` |
| `charcoal_smoke` | Charcoal Smoke | A glowing coal dropped in ghee — dhungar magic. | `src/engine/ingredients.ts:76` |
| `khoya` | Khoya | Milk simmered down to its sweetest self. | `src/engine/ingredients.ts:83` |
| `cardamom_sugar` | Cardamom Sugar | Fragrant crystals that perfume the whole tray. | `src/engine/ingredients.ts:86` |
| `saffron_milk` | Saffron Milk | Golden kesar doodh, dessert's finishing touch. | `src/engine/ingredients.ts:87` |
| `lime_leaf` | Lime Leaf | One torn leaf perfumes the whole pot. | `src/engine/ingredients.ts:52` |

Also in `ingredients.ts`, the pantry category labels (currently unused on any live screen,
but still exported — `src/engine/ingredients.ts:98-104`): `Spice`, `Veg`, `Protein`,
`Dairy`, `Herb`.

---

## 5. Skill tree — 21 curry nodes + 7 star nodes

`src/engine/skillTree.ts`. The **effect** column is what the node mechanically does — it's
here so your description can match reality. Costs are the base price; they're multiplied by
`1.5^(weeks completed)` at runtime, so don't put a literal number in the description.
Star node costs are flat.

Three curry branches, all reset on weekly prestige. Branch headings themselves are copy too:

| Branch key | Heading (edit) | file:line |
|---|---|---|
| `spice` | Spice | `src/screens/SkillTreeScreen.tsx:19` |
| `service` | Service | `src/screens/SkillTreeScreen.tsx:20` |
| `hustle` | Hustle | `src/screens/SkillTreeScreen.tsx:21` |
| (per-branch note) | `Resets on prestige` | `src/screens/SkillTreeScreen.tsx:68` |
| star panel heading | `Franchise Perks` | `src/screens/SkillTreeScreen.tsx:109` |
| star panel note | `Permanent — never reset on prestige` | `src/screens/SkillTreeScreen.tsx:111` |

### 5.1 Spice branch — raw click power

| id (do not change) | Name (edit) | Description (edit) | Effect | Base cost | file:line |
|---|---|---|---|---|---|
| `spice_1` | Sharper Knives | +15% curry per cook | click_mult +0.15 | 8,000 | `src/engine/skillTree.ts:36` |
| `spice_2` | Bigger Pot | +5 curry on every cook | flat_click +5 | 25,000 | `src/engine/skillTree.ts:37` |
| `spice_3` | Roasting Drum | +25% curry per cook | click_mult +0.25 | 90,000 | `src/engine/skillTree.ts:38` |
| `spice_4` | Masala Grinder | +40 curry on every cook | flat_click +40 | 320,000 | `src/engine/skillTree.ts:39` |
| `spice_5` | Tandoor Blast | +40% curry per cook | click_mult +0.40 | 1,100,000 | `src/engine/skillTree.ts:40` |
| `spice_6` | Industrial Wok | +300 curry on every cook | flat_click +300 | 3,500,000 | `src/engine/skillTree.ts:41` |
| `spice_7` | Ghost Pepper Reserve | +60% curry per cook | click_mult +0.60 | 12,000,000 | `src/engine/skillTree.ts:42` |

### 5.2 Service branch — crits and dining-room size

| id (do not change) | Name (edit) | Description (edit) | Effect | Base cost | file:line |
|---|---|---|---|---|---|
| `service_1` | Attentive Waiters | +15% crit circle chance | crit_chance +0.15 | 10,000 | `src/engine/skillTree.ts:46` |
| `expand_1` | Cozy Extension | Grow the dining room | expansion level 1 | 30,000 | `src/engine/skillTree.ts:47` |
| `service_3` | Table Service | +25% crit payout | crit_power +0.25 | 100,000 | `src/engine/skillTree.ts:48` |
| `expand_3` | Dining Hall | A much busier dining room | expansion level 3 | 350,000 | `src/engine/skillTree.ts:49` |
| `service_5` | Front of House | +25% crit circle chance | crit_chance +0.25 | 1,200,000 | `src/engine/skillTree.ts:50` |
| `service_6` | Showpiece Plating | +60% crit payout | crit_power +0.60 | 4,000,000 | `src/engine/skillTree.ts:51` |
| `expand_5` | Curry Emporium | Maximum bustle — a packed house | expansion level 5 | 14,000,000 | `src/engine/skillTree.ts:52` |

### 5.3 Hustle branch — gacha and On Fire economy

| id (do not change) | Name (edit) | Description (edit) | Effect | Base cost | file:line |
|---|---|---|---|---|---|
| `hustle_1` | Market Haggling | Spins cost 10% less | spin_discount 0.10 | 12,000 | `src/engine/skillTree.ts:55` |
| `hustle_2` | Stoked Coals | +25% On Fire earnings | fire_gain +0.25 | 35,000 | `src/engine/skillTree.ts:56` |
| `hustle_3` | Supplier Contacts | +0.15 luck on every spin | luck +0.15 | 110,000 | `src/engine/skillTree.ts:57` |
| `hustle_4` | Bulk Buying | Spins cost another 20% less | spin_discount 0.20 | 380,000 | `src/engine/skillTree.ts:58` |
| `hustle_5` | Roaring Kitchen | +50% On Fire earnings | fire_gain +0.50 | 1,300,000 | `src/engine/skillTree.ts:59` |
| `hustle_6` | Import Licence | +0.35 luck on every spin | luck +0.35 | 4,500,000 | `src/engine/skillTree.ts:60` |
| `hustle_7` | Empire Logistics | +1,200 curry on every cook | flat_click +1,200 | 15,000,000 | `src/engine/skillTree.ts:61` |

### 5.4 Star meta branch — permanent (bought with Franchise Stars)

| id (do not change) | Name (edit) | Description (edit) | Effect | Cost | file:line |
|---|---|---|---|---|---|
| `reputation_1` | Reputation I | Permanent ×1.25 to all curry earned | global_mult 1.25 | 2 ★ | `src/engine/skillTree.ts:67` |
| `reputation_2` | Reputation II | Permanent ×1.5 to all curry earned | global_mult 1.5 | 5 ★ | `src/engine/skillTree.ts:68` |
| `reputation_3` | Reputation III | Permanent ×2 to all curry earned | global_mult 2 | 9 ★ | `src/engine/skillTree.ts:69` |
| `head_start_1` | Head Start I | Start each week with 500 curry | head_start 500 | 2 ★ | `src/engine/skillTree.ts:70` |
| `head_start_2` | Head Start II | Start each week with 10,000 curry | head_start 10,000 | 3 ★ | `src/engine/skillTree.ts:71` |
| `fortune` | Fortune's Favour | +0.2 luck on every spin, forever | luck +0.2 | 5 ★ | `src/engine/skillTree.ts:72` |
| `showstopper` | Showstopper | +30% crit payout, forever | crit_power +0.30 | 6 ★ | `src/engine/skillTree.ts:73` |

### 5.5 Franchise rank titles

Shown as the Profile subtitle. Threshold = lifetime Franchise Stars earned.

`src/engine/skillTree.ts:114-120`

| Threshold | Title (edit) | file:line |
|---|---|---|
| 0+ | Street Stall | `src/engine/skillTree.ts:115` |
| 5+ | Corner Kitchen | `src/engine/skillTree.ts:116` |
| 15+ | Local Favorite | `src/engine/skillTree.ts:117` |
| 30+ | City Star | `src/engine/skillTree.ts:118` |
| 50+ | Curry Empire | `src/engine/skillTree.ts:119` |

---

## 6. Badges (10)

`src/engine/badges.ts:17-28`. **The ids are registered Steam achievement keys — do not
change them.** Names and descriptions are free. Several ids no longer match their meaning
(`recipe_master`, `synergy`, `streak_master`) — that's expected; write to the *condition*.

| id (do not change) | Name (edit) | Description (edit) | Actual unlock condition | file:line |
|---|---|---|---|---|
| `spicy_boy` | Spicy Boy | Make your first curry | Earn any curry at all | `src/engine/badges.ts:18` |
| `curry_king` | Curry King | Earn 1M curry all-time | All-time curry ≥ 1,000,000 | `src/engine/badges.ts:19` |
| `speedster` | Speedster | Cook 1,000 times in one day | Best single-day cooks ≥ 1,000 | `src/engine/badges.ts:20` |
| `week_warrior` | Week Warrior | Complete a full 7-day week | Weeks completed ≥ 1 | `src/engine/badges.ts:21` |
| `recipe_master` | Pantry Raider | Roll 25 different ingredients | 25 distinct ingredient ids ever rolled | `src/engine/badges.ts:22` |
| `synergy` | Currylicious | Pull a Currylicious ingredient | Best rarity ever = Currylicious | `src/engine/badges.ts:23` |
| `combo_king` | Combo King | Equip 3 ingredients worth 8+ combined power | Combined roll power of equipped ≥ 8 | `src/engine/badges.ts:24` |
| `special_collector` | High Roller | Pull 5 Epic-or-better ingredients | Lifetime Epic+ pulls ≥ 5 | `src/engine/badges.ts:25` |
| `streak_master` | Specialist | Complete every node of one skill branch | ≥ 1 curry branch owned end to end | `src/engine/badges.ts:26` |
| `curator` | Curator | Hold 50 ingredients at once | Inventory size ≥ 50 | `src/engine/badges.ts:27` |

---

## 7. Star award reason strings

Printed one per line in the Week Summary modal's "Franchise Stars earned" panel. Max 6
stars per week. Awarded in `advanceDayProgress` at week completion.

`src/store/useGameStore.ts:345-373`

| Award | Current text (edit) | Condition | file:line |
|---|---|---|---|
| Base | Completed the week | Always — finishing day 7 | `src/store/useGameStore.ts:348` |
| Earnings I | Earned 1M curry this week | weekCurry ≥ 1,000,000 | `src/store/useGameStore.ts:352` |
| Earnings II | Earned 100M curry this week | weekCurry ≥ 100,000,000 | `src/store/useGameStore.ts:356` |
| Luck I | Pulled an Epic ingredient | Best pull this week ≥ Epic | `src/store/useGameStore.ts:361` |
| Luck II | Pulled a Legendary ingredient | Best pull this week ≥ Legendary | `src/store/useGameStore.ts:365` |
| Grind | Cooked 2,000 times this week | clicksThisWeek ≥ 2,000 | `src/store/useGameStore.ts:369` |

---

## 8. Feature-intro cards

One-time modal shown the day a system unlocks. `src/components/FeatureIntroLayer.tsx:28-93`.
Each card = a badge line, 2–3 rows (title + body), and a CTA button.

### 8.1 Gacha card (day 2)

| Slot | Current text (edit) | file:line |
|---|---|---|
| Badge | Day 2 — The Gacha opens | `src/components/FeatureIntroLayer.tsx:31` |
| CTA | Let's roll! | `src/components/FeatureIntroLayer.tsx:32` |
| Row 1 title | Roll for ingredients | `src/components/FeatureIntroLayer.tsx:37` |
| Row 1 body | Spend curry on a spin. Every roll is unique — rarity sets how many bonuses it carries, and each bonus lands somewhere in its range. | `src/components/FeatureIntroLayer.tsx:38` |
| Row 2 title | Equip three | `src/components/FeatureIntroLayer.tsx:42` |
| Row 2 body | Your inventory keeps every roll, but only three can be equipped at once. Their bonuses stack onto every cook. | `src/components/FeatureIntroLayer.tsx:43` |
| Row 3 title | Chase Currylicious | `src/components/FeatureIntroLayer.tsx:47` |
| Row 3 body | Six rarities, from Common up to Currylicious — the top tier carries six bonuses and almost never drops. | `src/components/FeatureIntroLayer.tsx:48` |

### 8.2 Skills card (day 3)

| Slot | Current text (edit) | file:line |
|---|---|---|
| Badge | Day 3 — Skill Tree | `src/components/FeatureIntroLayer.tsx:54` |
| CTA | Show me the tree! | `src/components/FeatureIntroLayer.tsx:55` |
| Row 1 title | Three curry branches | `src/components/FeatureIntroLayer.tsx:60` |
| Row 1 body | Spice, Service and Hustle buy with curry — click power, crits and room, economy. They all reset when the week prestiges. | `src/components/FeatureIntroLayer.tsx:61` |
| Row 2 title | The star branch is permanent | `src/components/FeatureIntroLayer.tsx:65` |
| Row 2 body | Stars from your week report buy the meta branch. Those nodes stay bought through every prestige. | `src/components/FeatureIntroLayer.tsx:66` |

### 8.3 Prestige card (after week 1 completes)

| Slot | Current text (edit) | file:line |
|---|---|---|
| Badge | Week complete — Prestige! | `src/components/FeatureIntroLayer.tsx:72` |
| CTA | On to week 2! | `src/components/FeatureIntroLayer.tsx:73` |
| Row 1 title | Weekly reset | `src/components/FeatureIntroLayer.tsx:78` |
| Row 1 body | Your curry skill branches reset with the new week — re-buy them; each completed week they come back stronger (and pricier). | `src/components/FeatureIntroLayer.tsx:79` |
| Row 2 title | Franchise Stars | `src/components/FeatureIntroLayer.tsx:83` |
| Row 2 body | Stars from your week report buy the permanent star branch — global multipliers, head-start curry and more. Find it on the Skills tab. | `src/components/FeatureIntroLayer.tsx:84` |
| Row 3 title | What carries over | `src/components/FeatureIntroLayer.tsx:88` |
| Row 3 body | Your rolled ingredients, badges and records stay yours. Chase a better week every week! | `src/components/FeatureIntroLayer.tsx:89` |

---

## 9. Tutorial, hints, goal bar, empty states

### 9.1 Spotlight lines (App.tsx)

| Step | Current text (edit) | file:line |
|---|---|---|
| `start` — points at Start button | Press Start to open your restaurant! | `src/App.tsx:106` |
| `tabs` — points at the Gacha nav tab | Day 1 done! Open the Gacha and roll your first ingredient. | `src/App.tsx:111` |

### 9.2 First-cook hint (over the scene until the first tap)

| Key | Current text (edit) | file:line |
|---|---|---|
| First-cook hint | Tap here to cook! | `src/screens/GameplayScreen.tsx:556` |

### 9.3 Cook button + primary action labels

| State | Current text (edit) | file:line |
|---|---|---|
| Tutorial first run | Start Day 1 | `src/screens/GameplayScreen.tsx:677` |
| Day not started | Start Day {n} | `src/screens/GameplayScreen.tsx:682` |
| Day paused | Resume Day | `src/screens/GameplayScreen.tsx:687` |
| Cooking, On Fire | ON FIRE! | `src/screens/GameplayScreen.tsx:692` |
| Cooking, normal | Cook! | `src/screens/GameplayScreen.tsx:692` |
| Pause button aria | Pause day / Resume day | `src/screens/GameplayScreen.tsx:396` |

### 9.4 Equipped strip + empty state (GameplayScreen)

| Key | Current text (edit) | file:line |
|---|---|---|
*(The per-click readout and edit button were removed from the Cook screen; only the equipped ingredient chips remain.)*

### 9.5 GoalBar

*(Removed — the goal bar was cut from the Cook screen.)*

### 9.6 Click-milestone shout-outs

Float text at daily click counts. `src/screens/GameplayScreen.tsx:108-120`.

| At | Current text (edit) | file:line |
|---|---|---|
| 15 | COMBO ×15! | `src/screens/GameplayScreen.tsx:114` |
| 40 | HEATING UP! ×40 | `src/screens/GameplayScreen.tsx:115` |
| 100 | CURRY FRENZY! ×100 | `src/screens/GameplayScreen.tsx:116` |
| 250 | UNSTOPPABLE! ×250 | `src/screens/GameplayScreen.tsx:117` |
| 500 | LADLE LEGEND! ×500 | `src/screens/GameplayScreen.tsx:118` |
| 1000 | SPICE GOD! ×1000 | `src/screens/GameplayScreen.tsx:119` |

### 9.7 In-scene float / crit labels

| Key | Current text (edit) | file:line |
|---|---|---|
| Crit ×25+ suffix | ` JACKPOT!` | `src/screens/GameplayScreen.tsx:233` |
| Crit suffix | `!` | `src/screens/GameplayScreen.tsx:232` |
| Diner tip float | `Tip! +{value}` | `src/screens/GameplayScreen.tsx:432` |
| On Fire meter label | `On Fire +{value}` | `src/screens/GameplayScreen.tsx:526` |
| Chain badge on crit circle | Chain | `src/screens/GameplayScreen.tsx:503` |
| Crit circle aria | `Critical hit worth {value} curry` | `src/screens/GameplayScreen.tsx:479` |

### 9.8 Gacha screen empty states + section headings

| Key | Current text (edit) | file:line |
|---|---|---|
| Equipped section heading | Equipped | `src/screens/GachaScreen.tsx:162` |
| Empty equip slot | Empty | `src/screens/GachaScreen.tsx:42` |
| Equip slot tooltip | `{name} — tap to unequip` | `src/screens/GachaScreen.tsx:51` |
| Idle reel bay | Ready | `src/screens/GachaScreen.tsx:228` |
| Spin button | `Spin — {cost}` | `src/screens/GachaScreen.tsx:251` |
| Unequip button | Unequip | `src/screens/GachaScreen.tsx:195` |
| Equip button | Equip | `src/screens/GachaScreen.tsx:204` |
| Equip button, full | Slots full | `src/screens/GachaScreen.tsx:204` |
| Discard button | Discard | `src/screens/GachaScreen.tsx:217` |
| Dismiss hero | Keep spinning | `src/screens/GachaScreen.tsx:220` |
| Inventory heading | Pantry | `src/screens/GachaScreen.tsx:257` |
| Filter pill "all" | All | `src/screens/GachaScreen.tsx:273` |
| Empty pantry | Nothing in the pantry yet — take a spin. | `src/screens/GachaScreen.tsx:282` |
| Empty filter result | No rolls of that rarity. | `src/screens/GachaScreen.tsx:283` |
| Held stat chip label | Held | `src/screens/GachaScreen.tsx:153` |

---

## 10. Modal copy

### 10.1 StartDayModal — `src/components/StartDayModal.tsx`

| Slot | Current text (edit) | file:line |
|---|---|---|
| Heading | Ready for Day {n}? | `src/components/StartDayModal.tsx:28` |
| Body | The clock starts as soon as you do. Cook as much curry as you can. | `src/components/StartDayModal.tsx:41` |
| CTA | Start Day {n} | `src/components/StartDayModal.tsx:51` |
| Close aria | Close | `src/components/StartDayModal.tsx:34` |

### 10.2 WeekSummaryModal — `src/components/WeekSummaryModal.tsx`

| Slot | Current text (edit) | file:line |
|---|---|---|
| Heading | Week Complete! | `src/components/WeekSummaryModal.tsx:48` |
| Curry panel label | This week's curry | `src/components/WeekSummaryModal.tsx:55` |
| Cook count suffix | `{n} cooks` | `src/components/WeekSummaryModal.tsx:61` |
| Best-day suffix | `· best Day {n} ({curry})` | `src/components/WeekSummaryModal.tsx:63` |
| Stars panel label | Franchise Stars earned | `src/components/WeekSummaryModal.tsx:72` |
| Stars CTA | Spend your stars in the skill tree | `src/components/WeekSummaryModal.tsx:96` |
| Per-day row | `Day {n}` | `src/components/WeekSummaryModal.tsx:107` |
| Primary CTA | Start Next Week | `src/components/WeekSummaryModal.tsx:120` |
| Demo CTA (demo build only) | Enjoying it? Get the full game | `src/components/WeekSummaryModal.tsx:126` |

Star reason lines inside this modal come from section 7.

---

## 11. Screen titles and subtitles

`PageHeader` props unless noted.

| Screen | Title (edit) | Subtitle (edit) | file:line |
|---|---|---|---|
| Gacha | Inventory | Spend curry, pull ingredients, equip your best three. | `src/screens/GachaScreen.tsx:147-148` |
| Skills | Curry Power | Spend curry on this week's branches, stars on permanent perks. | `src/screens/SkillTreeScreen.tsx:46-47` |
| Profile | Guest Chef | *(dynamic — franchise rank, see 5.5)* | `src/screens/ProfileScreen.tsx:41` |
| Settings | Settings | — | `src/screens/SettingsScreen.tsx:81` |
| Leaderboard | Today's Top Chefs | *(no subtitle — hand-rolled header, not PageHeader)* | `src/screens/LeaderboardScreen.tsx:47-48` |

Settings section headings (`Group title=`): `Demo` (`:84`), `Sound` (`:93`), `Game`
(`:118`), `Data` (`:162`), `Legal` (`:242`) — `src/screens/SettingsScreen.tsx`.

---

## 12. Navigation labels

`src/navigation.ts:17-23`. Keep these short — they sit under a 20px icon on mobile.

| Screen | Label (edit) | Icon | file:line |
|---|---|---|---|
| `gameplay` | Cook | soup_kitchen | `src/navigation.ts:18` |
| `skills` | Curry Power | account_tree | `src/navigation.ts:19` |
| `gacha` | Inventory | casino | `src/navigation.ts:20` |
| `leaderboard` | Leaderboard | leaderboard | `src/navigation.ts:21` |
| `profile` | Profile | account_circle | `src/navigation.ts:22` |

(Leaderboard is hidden in the offline demo build.)

---

## 13. index.html — title and meta

`index.html`

| Slot | Current text (edit) | file:line |
|---|---|---|
| `<title>` | Curry Clicker — spin, season, click | `index.html:10` |
| `meta[name=description]` | Run a curry shop: spin for ingredients across six rarities, equip your best three, and spend the profits on a skill tree that makes every click hit harder. Free browser demo. | `index.html:13` |
| `og:title` | Curry Clicker — spin, season, click | `index.html:17` |
| `og:description` | Spin for rare ingredients, equip the best three, unlock the skill tree, and run your curry shop. Free browser demo. | `index.html:20` |

`og:title` and `<title>` are currently identical — fine to diverge if you want.

---

## 14. Demo end panel

Shown on the Gameplay screen in the demo build once week 1 completes.
`src/screens/GameplayScreen.tsx:564-603`

| Slot | Current text (edit) | file:line |
|---|---|---|
| Heading | That's the demo! | `src/screens/GameplayScreen.tsx:569` |
| Body | The full game keeps the gacha running: 60 ingredients across six rarities, the whole skill tree, skins, and a fresh week to chase every real day. | `src/screens/GameplayScreen.tsx:573-575` |
| Stat 1 label | Curry all-time | `src/screens/GameplayScreen.tsx:580` |
| Stat 2 label | Best pull | `src/screens/GameplayScreen.tsx:585` |
| Stat 3 label | Stars earned | `src/screens/GameplayScreen.tsx:590` |
| Steam CTA | Get the full game on Steam | `src/screens/GameplayScreen.tsx:594` |
| Contact button | Contact us | `src/screens/GameplayScreen.tsx:601` |
