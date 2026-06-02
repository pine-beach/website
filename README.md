# Pine Beach — website

Marketing site for **Pine Beach**, a design & development studio (pinebeach.com.au).

Built on the Claude Design **Terminal** direction — stark monochrome (Ink `#0a0a0b` / Paper `#fafafa` / Ash `#a1a1aa`), Space Grotesk × JetBrains Mono, and the **Liquid Lens** signature: a cursor-reactive dot-grid canvas.

## Stack

- **Next.js 16** (App Router, Turbopack) · **React 19** · **TypeScript**
- **No Tailwind** — the design tokens are hand-tuned; styling lives in `app/globals.css`, ported verbatim from the design export.
- Fonts self-hosted via `next/font/google` (Space Grotesk, JetBrains Mono), exposed as `--font-display` / `--font-mono`.
- Icons via `lucide-react` (1.5 stroke).
- Deploy target: **Vercel**.

## Structure

```
app/
  layout.tsx        Root layout — metadata, fonts, <html>
  page.tsx          Home (renders the client component)
  PineBeachSite.tsx 'use client' — Liquid Lens canvas + nav/hero/overlay/menu/lead form
  globals.css       All styling + design tokens (verbatim from the export)
public/
  pine-mask.png     The pine sprig as a recolourable alpha mask (the brand logo)
  pine-original.png Original logo artwork (disc + sprig)
  pine-logo.svg     Vector logo
```

The site is a single responsive page: a sticky nav, a hero over the live Liquid Lens field, and a radial-reveal overlay holding the **Work · Studio · Capabilities · Contact** sections. The contact form composes a `mailto:jake@pinebeach.com.au`. Mobile/tablet swap the nav for a full-screen menu.

## Develop

```bash
npm run dev      # dev server (Turbopack)
npm run build    # production build
npm run start    # serve the production build
```

> The Liquid Lens canvas animation only runs in a **visible** browser tab — headless/backgrounded tabs pause `requestAnimationFrame`, leaving the dot field static. `prefers-reduced-motion` is respected (one static frame, no caret blink).

## Brand rules

Monochrome only (Danger red reserved for errors), body copy in Ash never pure white, sentence case, Australian English, no hype words, one Liquid Lens instance per viewport. Full guidelines live in the design export (`../pine-beach-design/`).
