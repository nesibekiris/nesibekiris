# nesibekiris Next.js Website

## Architecture Diagrams & AWS Mapping
- See `ARCHITECTURE.md` for detailed architecture diagrams and local-to-AWS mappings.

## 1. 🏗 Project Setup
- Install Node.js v18+, npm (or yarn), and Git.
- Clone the repository and install dependencies.
```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
npm run dev
```
- Open http://localhost:3000 in your browser to view the site.

---

## 2. 🧱 Folder Structure
- `/app` – App Router pages (Home, About, Services, Insights, Contact).
- `/components` – Shared UI components such as Navbar, Footer, Layout, ServiceCard.
- `/content/posts` – MDX blog posts and essays rendered on Insights.
- `/styles` – Global styles and Tailwind configuration files.
- `/utils` – Metadata, constants, and SEO helpers (includes next-themes setup).
- `/public` – Static assets, images, favicons, and CNAME file.

**Sample MDX file**
```mdx
---
title: "AI Governance in Context"
date: "2025-05-01"
summary: "Reflections on building responsible AI ecosystems across Europe and Türkiye."
tags: ["AI Policy", "Ethics"]
---

Writing in MDX allows you to blend Markdown with React components.
```

---

## 3. 🎨 Styling and Design
- Tailwind CSS provides utility-first styling across the project.
- Adjust pastel color tokens in `tailwind.config.js` to reflect TechLetter.co branding.
- Update global rules, dark/light mode styles, and variables in `/styles/globals.css`.
- Fonts Inter and Space Grotesk are loaded via Google Fonts for calm editorial typography.

---

## 4. 🧩 Adding Content
- Add a blog post by creating `/content/posts/new-article.mdx` with frontmatter (title, date, summary, tags).
- Restart the dev server after adding files:
```bash
npm run dev
```
- Update About or Services copy in `/app/about/page.tsx` and `/app/services/page.tsx` respectively.
- Framer Motion animations and next-themes dark/light mode adapt automatically to new content.

---

## 5. 🌍 Deployment to GitHub Pages
- Insert deployment scripts into `package.json`.
```json
"scripts": {
  "build": "next build && next export",
  "deploy": "gh-pages -d out"
}
```
- Export and publish the static site.
```bash
npm run build
npm run deploy
```
- In GitHub → Settings → Pages, choose the `gh-pages` branch as the source.

---

## 6. 🌐 Custom Domain Setup
- Create `/public/CNAME` containing `nesibekiris.com`.
- Configure DNS records with your registrar:

| Type | Name | Value |
| ---- | ---- | ----- |
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |
| CNAME | www | `<username>.github.io` |

---

## 7. 📈 SEO & Analytics
- Edit site metadata, open graph tags, and canonical values in `/utils/seo.config.ts`.
- Optionally add a Google Analytics snippet to the shared layout (`app/layout.tsx`) or tracking component.

---

## 8. 💾 Maintenance
- Update MDX content or page copy, then commit and redeploy.
```bash
git add .
git commit -m "update content"
git push origin main
npm run build && npm run deploy
```
- Run `npm update` periodically to refresh dependencies.

---

## 9. 🧠 Credits
- Built with Next.js (App Router), TypeScript, Tailwind CSS, MDX, Framer Motion, and next-themes.
- Design language inspired by the calm, pastel aesthetic of TechLetter.co.
