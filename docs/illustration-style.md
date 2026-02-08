# Illustration Style Guide — keller.cv Blog

## Character

The mascot is a small teddy bear in a **plain navy blue crewneck sweater** (no logos, no emblems). Warm tan fur, round ears, black bead eyes, small brown nose. Proportions are chibi/cartoon — big head relative to body, stubby paws.

The bear is the recurring protagonist across all blog OG images. It acts out scenes that metaphorically represent each post's topic — similar to how Ben Borger's blog character appears in different situations per post.

## Art Style

**Medium**: Ink-and-watercolor editorial cartoon. Generated via DALL-E 3 (`1792x1024`, `hd` quality).

**Lines**: Thick black ink outlines, slightly loose/hand-drawn feel. Not perfectly clean vector art, but not as wobbly as actual hand-drawn — somewhere between digital illustration and traditional ink.

**Fills**: Muted watercolor washes. Colors should bleed *slightly* past the outlines in places to give an organic, imperfect feel. Avoid flat digital fills.

**Background**: Clean white or very faint off-white. No gradients, no patterns, no text. The illustration stands alone.

**Composition**: Single centered scene. The bear is always the focal point. Props and environmental elements support the narrative but don't overwhelm.

**Energy/Motion**: Use curved "motion lines" and small marks (like `~ ~` or `( (` shapes) around moving elements to convey energy, chaos, speed, or nervousness. This is a signature element borrowed from editorial cartooning.

## Color Palette

| Element | Color |
|---------|-------|
| Bear fur | Warm tan / light brown |
| Sweater | Navy blue (plain, no logo) |
| Ink outlines | Black, thick |
| Accent props | Soft blues, warm oranges, muted reds |
| Background | White (#FFFFFF or #FAFAFA) |
| Watercolor washes | Desaturated, never neon |

## Prompt Template

Use this as a base when generating new OG images. Replace `[SCENE]` with the post-specific concept.

```
Editorial cartoon illustration in ink-and-watercolor style on a clean white
background. A small cute teddy bear wearing a plain navy blue crewneck sweater
(no logos, no emblems, no text on the sweater) is [SCENE]. Style: thick black
ink outlines, slightly loose hand-drawn feel, muted watercolor fills that bleed
slightly past the lines. Colors: warm tan bear fur, navy sweater, [SCENE-SPECIFIC
COLORS]. No text anywhere in the image. Centered composition. The feel should be
whimsical, energetic, and charming — like a professional editorial cartoon
illustration for a tech blog.
```

**API params**: `model: dall-e-3`, `size: 1792x1024`, `quality: hd`

## Existing Images

### "How I built keller.cv with Cursor and Claude in one afternoon"
- **File**: `public/images/blog/building-keller-cv/og-cover.png`
- **Scene**: Bear hunched at a tiny desk frantically typing on a laptop. UI mockup cards and browser windows scattered in the air like tossed playing cards. Spilled coffee cup. Motion lines radiating outward. Bear has a focused, slightly manic expression.
- **Concept reasoning**: Represents the rapid-fire prototyping process — 9 prototypes, 60 commits, one afternoon. The flying UI cards = discarded iterations. The energy = speed of AI-assisted development.

## Concept Guidelines

Each blog post's OG image should:

1. **Be a visual metaphor** for the post's topic, not a literal depiction
2. **Show the bear in action** — doing something, not just posing
3. **Have one clear focal action** — don't try to illustrate the whole post
4. **Include 2-3 supporting props** that add context without clutter
5. **Convey an emotion** — frantic, curious, proud, confused, mischievous — matching the post's tone

## Inspiration

Style is inspired by [Ben Borger's blog](https://ben.page/) cover illustrations:
- Hand-drawn ink + watercolor aesthetic
- Single subject on white background
- Character acting out a metaphor for the blog topic
- Motion lines for energy
- No text in the image

Our version is slightly more polished/clean than Ben's fully hand-drawn look, but maintains the warmth and charm of the watercolor medium.
