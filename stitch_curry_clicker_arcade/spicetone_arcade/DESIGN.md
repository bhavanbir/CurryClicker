---
name: Spicetone Arcade
colors:
  surface: '#f7f9fc'
  surface-dim: '#d8dadd'
  surface-bright: '#f7f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f4f7'
  surface-container: '#eceef1'
  surface-container-high: '#e6e8eb'
  surface-container-highest: '#e0e3e6'
  on-surface: '#191c1e'
  on-surface-variant: '#564334'
  inverse-surface: '#2d3133'
  inverse-on-surface: '#eff1f4'
  outline: '#897362'
  outline-variant: '#ddc1ae'
  surface-tint: '#904d00'
  primary: '#904d00'
  on-primary: '#ffffff'
  primary-container: '#ff8c00'
  on-primary-container: '#623200'
  inverse-primary: '#ffb77d'
  secondary: '#586062'
  on-secondary: '#ffffff'
  secondary-container: '#dae1e3'
  on-secondary-container: '#5d6466'
  tertiary: '#7d5700'
  on-tertiary: '#ffffff'
  tertiary-container: '#da9f28'
  on-tertiary-container: '#543900'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdcc3'
  primary-fixed-dim: '#ffb77d'
  on-primary-fixed: '#2f1500'
  on-primary-fixed-variant: '#6e3900'
  secondary-fixed: '#dde4e6'
  secondary-fixed-dim: '#c1c8ca'
  on-secondary-fixed: '#161d1f'
  on-secondary-fixed-variant: '#41484a'
  tertiary-fixed: '#ffdeaa'
  tertiary-fixed-dim: '#fabc44'
  on-tertiary-fixed: '#271900'
  on-tertiary-fixed-variant: '#5f4100'
  background: '#f7f9fc'
  on-background: '#191c1e'
  surface-variant: '#e0e3e6'
typography:
  display-score:
    fontFamily: Montserrat
    fontSize: 48px
    fontWeight: '900'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Montserrat
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-lg-mobile:
    fontFamily: Montserrat
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Montserrat
    fontSize: 20px
    fontWeight: '700'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '700'
    lineHeight: '1'
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  gutter: 20px
  container-max: 1200px
---

## Brand & Style

The design system is engineered to capture the high-energy, addictive nature of arcade clickers. It blends **Corporate Modern** precision with **High-Contrast Bold** energy to create a "Curry Clicker" experience that feels both professional and intensely playful.

The brand personality is energetic, appetizing, and rewarding. It targets casual gamers who appreciate clean, legible interfaces paired with tactile, juicy interactions. The UI should evoke a sense of momentum—every click should feel impactful through subtle scale transforms and vibrant color shifts. The aesthetic is "Premium Fast Casual," mirroring the visual language of modern food brands: clean white spaces punctuated by explosive, spice-inspired accents.

## Colors

The palette is anchored by **Vibrant Orange (#FF8C00)**, representing heat, spice, and the core "curry" element. This primary color is used for action-oriented elements and key progress indicators.

- **Primary:** The heat of the curry. Used for main buttons and score highlights.
- **Secondary:** A deep charcoal for high-contrast typography and "heavy" UI elements like headers.
- **Tertiary:** A softer ginger-yellow used for secondary highlights, hover states, and XP bars.
- **Neutral:** A clean, slightly cool grey for background surfaces and card containers to ensure the vibrant oranges pop.
- **Semantic:** Success Green is used for "level up" and "purchase successful" notifications.

## Typography

This design system utilizes **Montserrat** for all display and heading roles to inject a geometric, bold personality that fits the arcade theme. Its high x-height and heavy weights make scores feel substantial and "clickable."

**Inter** handles all functional body copy and labels. Its neutral, systematic nature provides a necessary visual rest from the loud headlines, ensuring that shop descriptions and ingredient lists remain highly legible even during fast-paced gameplay. 

For the primary score display, use the `display-score` style with a slight drop-shadow to create a "floating" effect over the gameplay area.

## Layout & Spacing

The design system employs a **Fluid Grid** model with a 12-column structure for desktop and a single-column stack for mobile. 

- **Gaming Zone:** Centralized layout. The main "clicker" area should be a square aspect ratio container with ample "safe area" (40px) to prevent accidental clicks on UI menus.
- **Sidebars:** Shop and Upgrades are housed in side-drawers or cards that utilize a 20px gutter.
- **Rhythm:** Use a 4px base unit. Components should stick to multiples of 4 (e.g., 16px padding for cards, 8px gap between buttons). 

On mobile, the shop moves to a bottom-sheet component to keep the upper half of the screen clear for the primary game interaction.

## Elevation & Depth

To maintain a "modern arcade" feel, depth is achieved through **Ambient Shadows** and **Tonal Layers** rather than heavy gradients.

- **Level 0 (Floor):** Pure white background or a very light neutral grey (#F7F9FC).
- **Level 1 (Cards):** Shop items and stats use soft, extra-diffused shadows (`0 8px 30px rgba(0,0,0,0.04)`) to appear as if they are resting on the surface.
- **Level 2 (Active Elements):** Buttons and the main clicker element use a slightly more aggressive shadow with a hint of the primary color (`0 10px 20px rgba(255,140,0,0.15)`) to signal interactivity.
- **Overlay (Modals/Popups):** Use a backdrop blur (12px) with a 20% opacity neutral tint to focus the player's attention on level-up rewards.

## Shapes

The shape language is consistently **Rounded**. This choice makes the UI feel approachable and "bouncy," fitting for a game centered around food and clicking.

- **Main Buttons:** 0.5rem (8px) corner radius.
- **Feature Cards:** 1rem (16px) corner radius.
- **Progress Bars:** Fully pill-shaped (capsule) to emphasize the flow of the liquid-like curry filling.
- **Clicker Object:** Should utilize a circular or organic rounded shape to maximize the hit area.

## Components

### Playful Buttons
Buttons are high-contrast. The primary button uses the Primary Orange with white text. On hover, it should scale 1.05x; on click (active), it scales down to 0.95x to provide tactile feedback.

### Container Cards
Used for the shop and leaderboard. Cards use a white background, 1px light neutral border, and the Level 1 soft shadow. Header sections within cards are separated by a subtle horizontal rule.

### Score Displays
The "Curry Count" should be the largest element. It uses the `display-score` typography. Add a subtle "pulse" animation whenever the score increases.

### Progress Bars
The bar track is a light grey neutral, while the "fill" is a vibrant Primary Orange gradient. Use a subtle "shimmer" effect on the fill to indicate active accumulation.

### Shop Items
ListItem components should include:
- A rounded square icon slot for the ingredient image.
- Title (Headline-md) and Price (Label-bold in Primary Orange).
- A "Buy" button that is disabled (30% opacity) if funds are insufficient.

### Floating Toasts
When a player clicks, floating text should appear at the cursor location (e.g., "+1") using the `label-bold` style in Primary Orange, fading upwards and out.