# Used Car Scout — Design System (reference)

A plain-language reference for building the app in Lovable. It describes the look; it contains no code. Pictures of every screen are in [`screens/`](screens/) and of the design system in [`system/`](system/). Source of truth: the [Figma file](https://www.figma.com/design/YARHxc2pgKDcBJQlgVcl4V).

**The feel in one line:** a calm, honest friend. Lots of white space, few words, and color only where something needs attention.

## Colors

| Name | Hex | Use for |
| --- | --- | --- |
| Primary (Deep Teal) | `#0F5C5C` | Main buttons, links, the "How it works" color block |
| Primary tint (Mist Teal) | `#E3F0EE` | Soft highlights, light text on teal |
| Accent (Warm Coral) | `#E8684A` | **Scout only**: avatar, hand-drawn circle, small labels |
| Accent tint | `#FCE9E3` | Scout's chat bubbles |
| Background (Warm Cream) | `#FBF7F2` | Page background |
| Surface | `#FFFFFF` | Cards, receipt paper, alternating sections |
| Border (Sand) | `#E6E0D8` | Card borders, dividers |
| Text (Ink) | `#1F2A2E` | Headings and body |
| Text secondary (Slate) | `#5B6B70` | Captions, hints, labels |
| Good | `#2E7D4F` on `#E6F4EC` | "Looks fine", savings |
| Caution | `#B26A00` on `#FDF3E1` | Medium risk, scam warnings |
| Risk | `#C0392B` on `#FBE9E7` | High risk |

**Rules**
- Main buttons are teal with white text. Never white text on coral.
- Status colors appear only on things that need attention (a dot, a short word, a small pill). Everything else stays neutral.
- Never rely on color alone: pair it with a word ("High", "Medium risk").

## Typography

Three fonts, each with one job (all free on Google Fonts):

| Font | Job | Where |
| --- | --- | --- |
| **Fraunces** (Regular, Italic) | Headlines | Landing page headlines and section titles. Use the italic for one emphasized word, e.g. "Buying your first car *alone?*" |
| **DM Sans** (Regular, Medium, SemiBold) | Everything you read | Body text, buttons, labels, app screens |
| **DM Mono** (Regular, Medium) | Data | The receipt, prices and car details in data contexts |
| Caveat (Bold) | One handwritten note | "↑ the part nobody tells you" — once per page at most |

**Sizes** (size / line height)

| Style | Font | Size |
| --- | --- | --- |
| Landing hero | Fraunces Regular | 54/62 desktop · 34/41 mobile |
| Landing section title | Fraunces Regular | 36/44 desktop · 26/33 mobile |
| Display (app) | DM Sans SemiBold | 30/36 |
| H1 | DM Sans SemiBold | 22/28 |
| H2 | DM Sans SemiBold | 18/24 |
| H3 | DM Sans Medium | 16/22 |
| Body | DM Sans Regular | 16/24 |
| Body strong | DM Sans Medium | 16/24 |
| Small | DM Sans Regular | 14/20 |
| Small strong | DM Sans Medium | 14/20 |
| Caption | DM Sans Regular | 12/16, letter-spacing 0.2 |
| Number (prices) | DM Sans SemiBold | 24/30 |

No heavy bold anywhere. Body text is never smaller than 14px (16px for main reading).

## Spacing and layout

- **Base unit 4px.** Common gaps: 8, 12, 16, 20, 24, 28.
- **Mobile:** 390px design width, 20px side margins, cards full width.
- **Desktop landing:** 1200px content width (120px side padding), sections 96px top and bottom (56px on mobile).
- **App screens on desktop** (Report, Viewing mode): one centered column, 680px wide. No sidebars, no floating panels.
- **Landing sections alternate** cream and white backgrounds; "How it works" is a full-width teal block with cream text.
- Tap targets at least 44px tall.

## Corners, borders, shadows

- **Corners: 4px** on buttons, cards, inputs, chips, bubbles and sheets. Only avatars, small dots, number badges and circular icon buttons are round.
- **Borders:** 1px Sand (`#E6E0D8`). Dividers inside lists are 1px Sand.
- **Shadows:** almost none. Only floating things get a soft shadow (the hero input card and the receipt): 0 10px 24px at about 10% opacity of Ink.

## Components

**Buttons**
- **Primary:** teal background, white DM Sans Medium 16px, padding 14px × 20px, 4px corners. Full width for the main action on mobile.
- **Secondary:** white background, 1.5px Sand border, teal text.
- **Text button:** teal text only, no background.
- **Compact:** padding 9px × 14px, 14px text (e.g. "Check this car" inside the paste box).

**Cards:** white, 1px Sand border, 4px corners, 16–20px padding. Prefer fewer cards: use white space and thin dividers before adding another box.

**Grouped list** (report "What matters"): one white card; each row = small colored dot (8px) + title + optional short value + chevron; 16px × 18px padding; 1px dividers between rows.

**Expandable row (tap-through):** tapping a row opens it in place: Scout's 1–2 sentence explanation, an answered follow-up in a cream box (question in teal with a check mark, answer beside Scout's small avatar), then 2–3 follow-up questions as teal text links with chevrons.

**Paste box:** white card. Scout's greeting line (small avatar + "Hi, I'm Scout! Paste a listing and I'll take a look."), a cream text area (about 84–96px tall), then a row: "Upload a screenshot" with a camera icon on the left, compact "Check this car" button on the right.

**Chat bubbles:** Scout = coral tint with Scout's avatar; user = teal with white text, right-aligned; seller (practice mode) = white with border and a "Seller" label. 4px corners.

**Viewing mode step:** progress bar in 8 segments, a small category label with a colored dot, a large instruction, a short "what to look for", a Scout tip bubble, then big full-width answer buttons: "Looks fine", "Something felt off", and a text "Skip for now".

**Icons:** simple outline icons (Lucide style, 2px stroke), 16–20px, Slate or Teal. Use sparingly; don't put an icon in front of every line.

## The receipt (brand device)

The signature visual: the real cost shown as a printed receipt. See [`system/receipt.png`](system/receipt.png).

- White paper, 360px wide, 26px side padding, soft shadow, slight tilt (about 2°), zig-zag torn bottom edge.
- All text in DM Mono. Header "USED CAR SCOUT" (13px, Medium, wide letter-spacing) and "REAL COST CHECK" (11px, Slate).
- Car line: "2013 NISSAN ALTIMA 2.5 S" and "98,000 MI · LISTED ON MARKETPLACE".
- Dashed dividers between sections.
- Line items with dotted leaders to the price: Asking price, Maintenance due, Likely repairs, Fuel (3 years).
- Total: "REAL COST ........ $15,560" at 20px Medium, circled by hand in coral (2px, slightly uneven loop).
- Then Fair offer and Risk, and the sign-off "*** CHECKED BY SCOUT ***" / "THANK YOU FOR NOT BUYING BLIND".

Use it on the landing hero, the share image, and later the report's cost summary.

## Logo and Scout

- Logo files are in [`../assets/`](../assets/). In the header the mark is about 20px tall next to "Used Car Scout" in DM Sans Medium 16px.
- Scout's avatar is a coral circle (placeholder until the final illustration). It appears small (about 24–40px) beside Scout's words.

## Voice

Short, warm, specific. Second person ("you"). Explain any car word in one line. Never condescending, never pushy, never tells her she must pay for a mechanic. Example: *"Not for most cars! For this model, it's when transmission issues often show up."*

## Do and don't

| Do | Don't |
| --- | --- |
| One main action per screen | Several competing buttons |
| Answer first, details behind a tap | Long scrolling walls of text |
| Color only for risk, caution and Scout | Colored backgrounds on everything |
| 4px corners | Rounded pill buttons |
| Real numbers with a source or "Estimate" label | Unlabeled guesses |
| One handwritten touch per page | Hand-drawn elements everywhere |

## Screen references

| File | Screen |
| --- | --- |
| `screens/01-landing-mobile.png` · `screens/d1-landing-desktop.png` | Landing page |
| `screens/02-confirm-mobile.png` | Confirm your car |
| `screens/03-checking-mobile.png` | Checking (loading) |
| `screens/04-report-mobile.png` · `screens/d2-report-desktop.png` | Report, highlights view |
| `screens/04b-report-tap-through-mobile.png` · `screens/d2b-report-tap-through-desktop.png` | Report with a row opened |
| `screens/04c-full-report-mobile.png` | Full report |
| `screens/04d-viewing-mode-mobile.png` · `screens/04e-viewing-done-mobile.png` | Viewing mode |
| `screens/05-ask-scout-mobile.png` | Ask Scout |
| `screens/06a-practice-setup-mobile.png` · `screens/06b-practice-chat-mobile.png` | Practice with Scout |
| `screens/07-shared-report-mobile.png` · `screens/07b-share-sheet-mobile.png` · `screens/09-share-image.png` | Sharing |
| `screens/08-error-states-mobile.png` | Error and empty states |
| `system/foundations.png` · `system/components.png` · `system/receipt.png` | Colors, type, components, receipt |

Note: some sample screens are older than the latest decisions (e.g. the full report still shows an older layout in places). When a screen and this document disagree, follow this document and the product spec.

## How to use this in Lovable on Day 1

1. **First message:** paste the Colors, Typography, Corners and Buttons sections above, plus one sentence on the feel ("calm, honest friend; lots of white space; color only for risk, caution and Scout"). Upload `system/foundations.png` and `system/components.png`.
2. **Build one screen at a time**, uploading its picture with each request: Landing → Confirm → Checking → Report → Viewing mode → Ask Scout → Share.
3. When something looks off, upload the picture again and name the difference ("corners should be 4px", "remove the icons from this list").
