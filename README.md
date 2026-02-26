# Pine Beach — Marketing Website

Single-page static marketing site for Pine Beach.

## Stack

- Plain HTML/CSS/JS — no build step, no framework
- Google Fonts (DM Serif Display + DM Sans)
- Deployable to Vercel, Netlify, or any static host

## Deploy

### Vercel

```bash
vercel --prod
```

Or drag-and-drop the folder in the Vercel dashboard.

### Netlify

```bash
netlify deploy --prod --dir .
```

Or drag-and-drop the folder at netlify.com/drop.

### Any Static Host (S3, GitHub Pages, etc.)

Upload all files. No preprocessing required.

## Files

| File           | Purpose                              |
|----------------|--------------------------------------|
| `index.html`   | Full single-page site                |
| `style.css`    | All styles (mobile-first, CSS vars)  |
| `main.js`      | Nav, reveal animations, email form   |
| `logo.png`     | Pine Beach logo                      |
| `vercel.json`  | Vercel deployment config             |
| `netlify.toml` | Netlify deployment config            |

## Customisation Checklist

- [ ] Replace `https://gumroad.com/pinebeach` with the real Gumroad store URL
- [ ] Replace `https://gumroad.com/l/pine-beach-business-in-a-box` with the real product URL
- [ ] Replace `https://github.com/pinebeach` with the real GitHub URL
- [ ] Wire up the email form in `main.js` (look for the `TODO` comment)
- [ ] Add real testimonials to the social proof section when ready
- [ ] Add `favicon.ico` and `apple-touch-icon.png` to the root

## Colours

| Token        | Hex       | Usage                    |
|--------------|-----------|--------------------------|
| `--green`    | `#2D4A3E` | Primary brand / buttons  |
| `--amber`    | `#D4A574` | Accents / highlights     |
| `--offwhite` | `#F0EFED` | Page background          |
| `--cream`    | `#FAF9F7` | Section backgrounds      |
| `--charcoal` | `#1A1A1A` | Body text                |
