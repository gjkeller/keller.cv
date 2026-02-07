# Website Redesign -- Design Notes

## Date: 2026-02-06

## Inspiration Analysis

### 1. armandiorg.com
**Screenshot:** `screenshots/armandiorg.png`

Ultra-minimal single page. Light/white background, no nav bar. Left-aligned text block
with name, tagline ("constantly curious and stubbornly optimistic"), current project, and
contact links (email, linkedin, x). Right side has a large ASCII/generative art piece.
Feels like a business card. No blog, no projects section, no scroll.

**What we like:** The restraint. Strong typographic hierarchy on a clean white canvas.
Nothing competes for attention. The generous whitespace conveys confidence.

### 2. shayaanazeem.com
**Screenshot:** `screenshots/shayaanazeem.png`

Light theme with command palette (Cmd+K) and sidebar nav (about, experiences, fieldnotes,
philosophy, photos). Hero is casual and lowercase ("i'm a student at @uwaterloo and i like
to build things"), followed by a bullet list of accomplishments, then a filterable project
grid with cover images and descriptions. Lots of content but the lowercase casual tone
keeps it from feeling corporate.

**What we like:** The amount of content without feeling cluttered. Project cards with
images are compelling. The casual student tone works well. The command palette is a nice
touch for power users.

### 3. ishanshah.me
**Screenshot:** `screenshots/ishanshah.png`

Warm cream/beige background (#FAF8F5-ish), clean serif-adjacent typography. Top nav
(Projects, Writing, Reading). Centered profile illustration, short bio paragraph, then a
dotted-line work history table (Company ... Description). Has separate pages for projects,
writing, and reading. Very editorial, like a magazine profile page. UT Austin grad.

**What we like:** The warm background immediately differentiates from the sea of white/dark
sites. The dotted-line work table is elegant and scannable. The tone is professional
without being stiff. Separate Writing page shows he takes content seriously.

### 4. rasmic.xyz
**Screenshot:** `screenshots/rasmic.png`

Dark theme, professional consultant vibe. Profile photo + "Full Stack Engineer" title,
bio paragraph, "What I do" bullet list, then 3 service cards (hire team, book consultation,
sponsor video). Scrolling company logo marquee at bottom. Single page, no nav. This is the
most "I'm selling something" of the group.

**What we like:** The services card layout is clean and scannable. The "book a consultation"
CTA is prominent without being pushy. Company logos add social proof. Dark theme is polished.

### 5. aelew.com
**Screenshot:** `screenshots/aelew.png`

Dark theme with glassmorphism, floating nav bar, 3D abstract graphic in hero. Experience
timeline with company logos and dates. Project cards with screenshots and tech stack badges.
"Want to chat?" CTA at bottom. Theme toggle (light/dark/system). Very polished student
portfolio with strong visual design.

**What we like:** The experience timeline with company logos is really well done. Project
cards with actual screenshots feel tangible. The floating nav is sleek. Good balance of
showing a lot without overwhelming.

## Design Decisions

### Theme: Light/warm
Not dark. The warm cream direction (ishanshah) or clean white (armandiorg) both fit the
"professional but not snobby" constraint. Dark themes can feel more corporate/consultant.

### Density: Medium
Not a business card (too sparse for someone with this much to show), not a full portfolio
gallery (too much for a student site). Bio + current work + blog teaser + contact is the
right amount.

### Tone: Professional, clean
Not lowercase-casual (shayaan), not consultant-aggressive (rasmic). Clean and neutral,
like ishanshah -- let the work speak for itself.

### Navigation: None
Single page. The content is medium-density, so it all fits without scrolling much. Blog
lives at /blog as a separate route. No nav bar needed on the homepage.

### Book a call: Subtle
Networking/coffee chats, not consulting. A simple link alongside other contact methods,
not a prominent CTA card.

### Blog: MDX pipeline
Blog posts stay as MDX files in content/blog/. The homepage shows 2-3 recent post titles
as a teaser. The /blog route shows the full listing.

### Main page: TSX (not MDX)
The homepage is a proper React component so agents can edit it directly. No markdown
constraints on layout.

## Three Prototypes

- **A: "Editorial Warmth"** -- ishanshah-inspired. Cream bg, serif headings, dotted work table.
- **B: "Typographic Minimalism"** -- armandiorg-inspired. White bg, strong type, lots of air.
- **C: "Structured Cards"** -- rasmic-meets-ishanshah. Light gray bg, white card sections.
