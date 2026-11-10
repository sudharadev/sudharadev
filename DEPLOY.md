# Deploy: GitHub profile + sudhara.dev

This folder is a complete, dependency-free static site (`index.html`, `style.css`, `script.js`)
plus your GitHub profile README. One repository serves both.

## 1. Create the repository

1. On GitHub, create a **public** repo named exactly your username: `sudharadev/sudharadev`.
   - GitHub shows its `README.md` on your profile page.
2. Upload everything in this folder (including `CNAME` and `.nojekyll`) to the repo root.

## 2. Turn on GitHub Pages

Repo → **Settings → Pages**
- Source: **Deploy from a branch**
- Branch: `main` / `/ (root)` → Save
- Custom domain: `sudhara.dev` (already set by the `CNAME` file) → Save

## 3. Point the domain (at your DNS provider)

**Option A — site on the root domain `sudhara.dev`**

| Type | Name | Value |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | sudharadev.github.io |

**Option B — keep `sudhara.dev` for the full portfolio, put this page on a subdomain**
(e.g. `me.sudhara.dev`)

| Type | Name | Value |
|------|------|-------|
| CNAME | me | sudharadev.github.io |

…and change the `CNAME` file to `me.sudhara.dev`.

## 4. HTTPS (required for .dev)

`.dev` domains only work over HTTPS. After DNS propagates (minutes to a few hours),
go back to **Settings → Pages** and tick **Enforce HTTPS** once the certificate is ready.

## Edit content

Everything is in `index.html` (text, links, projects) — no build step. Replace:
- `https://cal.com/` with your booking link
- `https://github.com/`, `linkedin.com/`, … with your profile URLs
- `portrait.svg` with your photo (keep the filename or update the `src`)
