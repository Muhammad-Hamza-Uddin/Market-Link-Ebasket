---
name: MarketLink
colors:
  surface: '#f9f9ff'
  surface-dim: '#d0daf0'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f0f3ff'
  surface-container: '#e7eeff'
  surface-container-high: '#dee8ff'
  surface-container-highest: '#d9e3f9'
  on-surface: '#121c2c'
  on-surface-variant: '#414844'
  inverse-surface: '#273141'
  inverse-on-surface: '#ebf1ff'
  outline: '#717973'
  outline-variant: '#c1c8c2'
  surface-tint: '#3f6653'
  primary: '#012d1d'
  on-primary: '#ffffff'
  primary-container: '#1b4332'
  on-primary-container: '#86af99'
  inverse-primary: '#a5d0b9'
  secondary: '#006c48'
  on-secondary: '#ffffff'
  secondary-container: '#92f7c3'
  on-secondary-container: '#00734d'
  tertiary: '#3e1e00'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e3000'
  on-tertiary-container: '#f48c24'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#c1ecd4'
  primary-fixed-dim: '#a5d0b9'
  on-primary-fixed: '#002114'
  on-primary-fixed-variant: '#274e3d'
  secondary-fixed: '#92f7c3'
  secondary-fixed-dim: '#75daa8'
  on-secondary-fixed: '#002113'
  on-secondary-fixed-variant: '#005235'
  tertiary-fixed: '#ffdcc3'
  tertiary-fixed-dim: '#ffb77d'
  on-tertiary-fixed: '#2f1500'
  on-tertiary-fixed-variant: '#6e3900'
  background: '#f9f9ff'
  on-background: '#121c2c'
  surface-variant: '#d9e3f9'
typography:
  headline-hero:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
  headline-hero-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '700'
    lineHeight: 28px
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
  label-caps:
    fontFamily: Plus Jakarta Sans
    fontSize: 11px
    fontWeight: '700'
    lineHeight: 14px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-mobile: 0.75rem
  margin: 2rem
  margin-mobile: 1rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

The design system establishes a grounded, warm, and highly trustworthy marketplace experience connecting conscientious consumers directly with independent local growers and food artisans. The aesthetic balances pastoral warmth with modern transactional efficiency, eschewing industrial e-commerce tropes in favor of an artisanal community hub.

### Target Audience & Emotional Intent
- **Audiences**: Urban and suburban weekend market shoppers seeking peak nutritional density; generational smallholders and local growers requiring frictionless pre-order queue management; municipal market organizers overseeing regulatory verification.
- **Emotional Resonance**: Authentic, abundant, deeply grounded, dependable, and neighborly. Interacting with the system feels like walking down a tree-shaded market stall on a Saturday morning with direct peace of mind.

### Core Domain Rules & Constraints
- **Strict Terminology**: Producers are referred to strictly as **Farmers** or **Growers** across all interface tiers (never "Vendors").
- **Zero-Delivery Model**: The model is exclusively **Pre-Order for In-Person Stall Pickup**. All fulfillment interactions emphasize market stall numbers, morning pickup windows, and personal touchpoints (e.g., "Pay at Stall"). Delivery addresses, shipping trackers, and courier metaphors are completely excluded.
- **Visual Stance**: Organic Modernism. Rich botanical greens paired with gentle sun-cured creams, tactile micro-tags, high-clarity status pills, and authentic photography capturing soil-dusted produce, farm hands, and open-air wooden stalls.

## Colors

The palette draws directly from agricultural earth, deep foliage, morning sunlight, and mineral slate. Light mode is the singular source of truth to maintain the sunlit daytime ambiance of a local farm stand.

### Palette Hierarchy & Intent
- **Canvas & Backgrounds**:
  - Primary Canvas: `#FBFBF7` (warm morning cream), replacing stark digital white with natural flax fiber.
  - Surface Substrates: `#F4F5F0` (subtle oat tint) for table cards, inset lists, and segmented controls.
  - Surface Pure: `#FFFFFF` strictly reserved for elevated interactive cards, modals, and input fields.
- **Primary Brand (`#1B4332`)**: Deep evergreen foliage. Anchors navigation, primary action buttons, key metrics, and dominant typographic headers. Communicates permanence, heritage, and trust.
  - Tonal Shade: `#133926` for pressed/active button states and hero banners.
- **Secondary Sage (`#52B788`)**: Fresh sprouting greens. Applied to active status markers, successful crop verification tags, confirmation chips, and pickup availability indicators.
  - Tinted Background: `#D8F3DC` and `#EAF8ED` for low-contrast alert backgrounds, success badges, and selected toggle pills.
- **Harvest Accent (`#D97706`)**: Warm sunlit amber and golden squash tone. Used exclusively for temporal scarcity, harvest countdown timers (e.g., cutoff deadlines), pending farmer notifications, and seasonal alert tags.
  - Amber Tint: `#FEF3C7` for highlight backdrops and priority alerts.
- **Neutrals & Borders**:
  - Deep Text: Slate Charcoal `#2D3748` ensuring optimal WCAG AAA contrast without harsh monochrome black.
  - Muted Text: Slate Olive `#4B5563` and `#6B7280` for subheaders, stall numbers, and timestamp details.
  - Structural Borders: Hairline `#E5E7EB` (1px) used consistently across container grids.

## Typography

The type scale combines the approachable geometry of **Plus Jakarta Sans** for prominent headers with the utilitarian clarity of **Inter** for data tables, inventory dispatch queues, and transactional packing slips.

### Typographic Roles
- **Display & Section Headers**: Rendered in `Plus Jakarta Sans` with soft terminals. When used for market dates or harvest titles, weights stay firm (`600` or `700`) to evoke hand-stamped craft signage.
- **Overline Tags (`label-caps`)**: Uppercase with `+0.05em` letter-spacing, set in dark green (`#1B4332`) or harvest amber (`#D97706`) above main headlines to immediately orient users to regional distribution zones or order states.
- **Dense Data & Pre-Order Stalls**: `Inter` handles operational items (e.g., "Stall #12B", "$8.50 / loaf", "42/50 slots reserved") to ensure zero ambiguity during brisk early-morning stall pickups.

## Layout & Spacing

The layout employs a responsive 12-column grid on desktop and tablet, collapsing to a single-column structured feed on mobile screens.

### Grid & Composition Rules
- **Desktop (1200px+)**: 12 columns with `1.25rem` (20px) gutters and max-width containers constrained to `1280px` centered on `#FBFBF7` canvas. Section separation maintains a steady `2.5rem` to `3.5rem` cadence.
- **Tablet (768px – 1199px)**: 8 columns with `1rem` gutters; split views (such as map radar alongside market hub lists) reflow vertically or switch into sticky bottom drawers.
- **Mobile (< 768px)**: 4 columns with `0.75rem` gutters and `1rem` safe-margin outer offsets. Product cards scale cleanly down to full-width or two-column square produce tiles.
- **Spatial Rhythm**: Element spacing adheres strictly to 4px and 8px baselines. Component interiors use `space-sm` (8px) for badge gaps, `space-md` (16px) for card body padding, and `space-lg` (24px) for expansive summary modules.

## Elevation & Depth

Depth is established primarily through clean layered surfaces, tactile micro-borders, and very soft, warm ambient drop shadows rather than artificial heavy blurs.

### Surface Architecture
- **Layer 0 (Canvas Base)**: `#FBFBF7` for consumer market views; `#F4F5F0` for farmer dispatch consoles.
- **Layer 1 (Card Rest)**: `#FFFFFF` surface enclosed by a delicate 1px border of `#E5E7EB` or `#E2E8F0`, paired with a warm diffused shadow: `0 1px 3px rgba(27, 67, 50, 0.04), 0 4px 12px rgba(27, 67, 50, 0.03)`. The faint green-slate tint prevents shadows from appearing gray or muddy.
- **Layer 2 (Interactive Hover & Focus)**: Elevated `2px` along the Y-axis: `0 4px 6px -1px rgba(27, 67, 50, 0.06), 0 10px 20px -3px rgba(27, 67, 50, 0.06)`. Borders brighten gently to `#D8F3DC`.
- **Layer 3 (Floating Modals & Dispatch Drawers)**: Surface floating above backdrop overlay: `0 20px 25px -5px rgba(27, 67, 50, 0.08), 0 10px 10px -5px rgba(27, 67, 50, 0.04)`.

## Shapes

The design system employs **Level 2 Roundedness** (`0.5rem` baseline), evoking soft organic forms and hand-harvested freshness without appearing overly toy-like.

### Radius Scale
- **Base Components (`rounded`)**: `0.5rem` (8px) applied to text inputs, table headers, compact badges, and standard buttons.
- **Medium Panels (`rounded-lg`)**: `1rem` (16px) applied to dispatch feed rows, seasonal highlight banners, and standard product cards.
- **Large Hero Containers (`rounded-xl` / `rounded-2xl`)**: `1.5rem` (24px) applied to full-width featured farmer spotlight modules, interactive market hub map frames, and checkout confirmation modals.
- **Pills (`rounded-full`)**: Applied strictly to status tags (e.g., "Ready for Pickup"), category filters, and calendar date badges.

## Components

### 1. Buttons & Triggers
- **Primary Action (e.g., "Pre-Order for Sat", "Accept Order")**:
  - Background: `#1B4332`; Text: `#FFFFFF`; Radius: `0.5rem`; Font: `Plus Jakarta Sans` semi-bold.
  - Hover: `#133926`; Active: Slight scale reduction (0.99) and darker forest hue.
- **Secondary / Stall Actions (e.g., "View Stall Map", "Manifest PDF")**:
  - Background: `#FFFFFF`; Border: 1px solid `#E5E7EB`; Text: `#1B4332`.
  - Hover: Background `#F4F5F0`, border `#CBD5E1`.
- **Harvest Accent Button (e.g., "Broadcast Cutoff Alert")**:
  - Background: `#D97706`; Text: `#FFFFFF`; Hover: `#B45309`.

### 2. Status Pills & State Badges
All order states use rounded-full tokens with muted pastel fills and strong typographic contrast:
- **Placed / New Pending**: Background `#FEF3C7`; Text `#B45309`; 1px solid `#FDE68A`.
- **Accepted & Packing**: Background `#E0F2FE`; Text `#0369A1`; 1px solid `#BAE6FD`.
- **Ready for Stall Pickup**: Background `#D8F3DC`; Text `#1B4332`; 1px solid `#B7E4C7` (paired with bold green dot icon).
- **Completed / Fulfilled**: Background `#F3F4F6`; Text `#4B5563`; 1px solid `#E5E7EB`.
- **Crop Shortage / Cancelled**: Background `#FEE2E2`; Text `#B91C1C`; 1px solid `#FECACA`.

### 3. Cards & Produce Modules
- **Produce Card**: Crisp `#FFFFFF` card, 1px border `#E5E7EB`, 16px corner radius. Features a top 4:3 high-resolution produce visual with overlay organic certification tag on top-left and wishlist trigger on top-right. Bottom section showcases stall number, price per weight/unit, remaining harvest stock bar (`#52B788`), and instant Pre-Order CTA.
- **Market Hub Summary Card**: Compact card highlighting pickup hours (e.g., "Saturday 8:00 AM – 1:00 PM"), physical stall address, certified farm count, and a prominent calendar block badge showing the day/date.

### 4. Input Fields & Search Controls
- Search bars feature `#FFFFFF` backgrounds with an inset search glass icon, placeholder in `#9CA3AF`, and a pill-shaped quick-select filter category dropdown anchored to the right edge.
- Focus State: Replaces default browser outline with a crisp 2px border in deep forest green (`#1B4332`) and a faint `#D8F3DC` halo.

### 5. Checkboxes, Radios & Live Toggles
- **Toggles (Farmer Stock Controls)**: Track uses `#E5E7EB` when off and rich `#1B4332` or `#52B788` when active; slider knob is pure white with standard subtle drop shadow.
- **Selection Controls**: Checkboxes and radio buttons feature 1.5px border `#9CA3AF` with checked fill `#1B4332` and white check icon.

### 6. Domain-Specific Component: Pickup Stall Ticket
- A specialized receipt module presented upon pre-order completion.
- Features prominent, unmissable bold display typography for: **Stall Number**, **Farmer Name**, **Assigned Time Slot**, and payment notation **"Pay at Stall ($XX.XX)"**. Designed specifically for effortless offline viewing in bright outdoor sunlight.