# File: specs/haunted-housewarming-ui.md

# Haunted Housewarming — UI & Functionality Spec (Low-Fi → Implementation)

**Theme:** Haunted Housewarming (cute spooky)  
**Goal:** A simple website for a housewarming party with:
- Home page w/ party info + countdown + navigation
- Gift registry page (Venmo redirect + totals stored in DB)
- Photo gallery page (reads from a local images directory)
- Guestbook/message board (name + message + optional image upload)

This spec is intentionally **layout/structure-first**. Styling can be layered after core functionality works.

---

## 1) Information Architecture

### Routes
- `/` — Home
- `/registry` — Gift Registry
- `/gallery` — Photo Gallery
- `/guestbook` — Guestbook / Message Board

### Global Layout (all pages)
- Sticky/top navigation bar
- Main content container (max width; centered)
- Footer

### Navbar Links
- Home
- Gift Registry
- Photo Gallery
- Guestbook

---

## 2) Core Components

### 2.1 Navbar
**Purpose:** Site title + route navigation  
**Elements:**
- Site title: “Haunted Housewarming”
- Links: Home | Registry | Gallery | Guestbook

### 2.2 Button (Primary)
**Purpose:** Consistent CTA buttons  
**Used for:**
- “Contribute on Venmo”
- “Leave Your Mark”
- Gallery filters (can be secondary)

### 2.3 Card — Gift
**Purpose:** Display one gift + total contributed  
**Fields:**
- Gift name (string)
- Short subtitle/description (optional)
- Total gifted amount (currency)
- CTA Button: “Contribute” (redirects to Venmo)

**Important behavior:**
- We DO NOT show “goal/total wanted”.
- We show **only** “Total gifted: $X”.

### 2.4 Card — Guestbook Message
**Purpose:** Display one entry  
**Fields:**
- Name (optional)
- Message (required)
- Optional image
- Timestamp

---

## 3) Page Specs

### 3.1 Home (`/`)
**Primary objectives:**
- Party details (time/location/theme)
- Countdown to party date/time
- CTAs to the 3 subpages

**Sections (top to bottom):**
1. Navbar
2. Hero
   - H1: “Haunted Housewarming”
   - Subhead: “Enter if you dare…”
   - Graphic placeholder (later: spooky house/ghost image)
   - Countdown timer UI (days/hours/min/sec)
3. Party Details Card
   - Location (address + “Copy” button if desired)
   - Date
   - Time
   - Theme note (cute spooky, costumes optional)
4. CTA Row
   - Button: “Visit Gift Registry” → `/registry`
   - Button: “View Gallery” → `/gallery`
   - Button: “Sign Guest Book” → `/guestbook`
5. Footer

**Countdown behavior:**
- Countdown target is configurable (env/config)
- When time has passed, display: “It’s party time 🎃” (or similar)

---

### 3.2 Gift Registry (`/registry`)
**Primary objectives:**
- Show list of gifts
- Each gift shows **Total gifted** (from DB)
- Contribute button redirects to Venmo AND records an “intent/contribution” event so totals can update

**Gifts to include (fixed set):**
- Lawn mower
- Snow blower
- Back stairs
- Basement outlets & Paint

**Layout:**
- Page header: “Offerings for the Haunted Home”
- Gift cards in a responsive grid

**Gift Card contents:**
- Gift name
- “Total gifted: $X”
- Button: “Contribute on Venmo”

**Contribution flow (important):**
Because Venmo payments happen off-site, we need a practical approach:

- When user clicks “Contribute on Venmo”, we show a small modal or inline panel **before redirect**:
  - Input: Amount (required; numeric)
  - Optional: Name (optional)
  - Optional: Note (optional)
  - Confirm button: “Continue to Venmo”
- On confirm:
  1) Create a DB record (a “contribution” row) with amount + gift + metadata
  2) Redirect to Venmo link (existing)

**Result:**
- Totals update immediately (optimistic UI is okay)
- This is not payment verification (we can’t verify Venmo payment automatically)
- Copy on page should gently imply this:  
  “Totals update when you tell the site how much you sent.”

---

### 3.3 Photo Gallery (`/gallery`)
**Primary objectives:**
- Display images from a local repo directory the owner will add
- Basic filters (optional)
- Lightbox view on click (optional but nice)

**Layout:**
- Page header: “Evidence of the Haunting”
- Filter row (buttons):
  - Before
  - Renovations
  - Party Night
  - (If no tagging system yet, filters can be placeholders)
- Gallery grid (masonry-ish or uniform)

**Image source:**
- The repo will contain an images directory (see AGENTS.md)
- The gallery should load images from that directory via a simple manifest JSON or by convention.

**Minimum viable:**
- A `gallery.json` manifest lists images and optional tags/captions
- UI reads manifest and renders images

---

### 3.4 Guestbook (`/guestbook`)
**Primary objectives:**
- Allow posting a message with:
  - Name (optional)
  - Message (required)
  - Optional image upload
- Display a reverse-chronological feed of entries

**Layout:**
- Page header: “Sign the Guest Book”
- Form card
  - Name input (optional)
  - Message textarea (required)
  - Image upload (optional)
  - Submit button “Leave Your Mark”
- Feed list (message cards)

**Behavior:**
- Validate message required, length limits
- Image upload:
  - Accept common types (jpg/png/webp)
  - Size limit (e.g., 5MB)
- Store image and reference it in DB
  - Storage method depends on stack (see AGENTS.md)

---

## 4) Data & State Requirements (Conceptual)

### Gift Totals
We store contributions and compute totals per gift.

- Gifts are a fixed set (enum / constant list).
- Total per gift = SUM(contribution.amount) WHERE gift = X

### Guestbook
We store entries with optional image reference.

---

## 5) Acceptance Criteria

### UI
- All routes exist and are navigable from the navbar
- Layout matches sections above (low-fi OK)
- Home countdown functions

### Registry
- Lists the 5 gifts
- Shows “Total gifted: $X” for each from DB
- Clicking “Contribute” prompts for amount then:
  - records a contribution
  - redirects to Venmo
- Totals update (immediately or after refresh)

### Gallery
- Reads images from repo-provided directory using a manifest
- Displays them in a grid

### Guestbook
- Users can submit name/message (+ optional image)
- Entries persist in DB and display in feed
