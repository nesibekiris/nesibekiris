# TechLetter Website Guide

This README walks you through setting up, customizing, and deploying the TechLetter-inspired Next.js + Tailwind CSS + MDX website.

## 🏗 Project Setup

### Prerequisites
- Node.js (v18 or newer)
- npm or yarn
- Git

### Clone & Install
```bash
git clone https://github.com/<username>/<repo>.git
cd <repo>
npm install
npm run dev
```

Visit the local development server at [http://localhost:3000](http://localhost:3000).

## 🧱 Project Structure
- `/app`: All page routes (Home, About, Services, Insights, Contact).
- `/components`: Reusable UI elements like `Navbar`, `Footer`, `Layout`, `ServiceCard`, and more.
- `/content/posts`: MDX blog posts and TechLetter essays.
- `/styles`: Global styles and Tailwind configuration.
- `/utils`: Metadata, constants, and SEO configuration helpers.
- `/public`: Images, favicons, and other static assets.

### Sample MDX Post
```mdx
---
title: "AI Governance in Context"
date: "2025-05-01"
summary: "Reflections on building responsible AI ecosystems across Europe and Türkiye."
tags: ["AI Policy", "Ethics"]
---

Writing in MDX allows you to blend Markdown with React components.
```

## 🎨 Styling and Design
- Tailwind CSS handles styling; adjust global variables in `/styles/globals.css`.
- Update `tailwind.config.js` colors to match the TechLetter pastel palette.
- Fonts (Inter and Space Grotesk) are imported via Google Fonts for a calm, thoughtful tone.

## 🧩 Adding or Editing Content
- To add a new article, create a `.mdx` file in `/content/posts/` and include frontmatter (`title`, `date`, `summary`, `tags`).
- Restart the development server after adding new files.
- Blog cards are generated dynamically from the files in `/content/posts`.
- Update services or about page content in `/app/services/page.tsx` or `/app/about/page.tsx` respectively.

## 🌍 Deploying to GitHub Pages
Add these scripts to your `package.json`:

```json
"scripts": {
  "build": "next build && next export",
  "deploy": "gh-pages -d out"
}
```

Then run:
```bash
npm run build
npm run deploy
```

This exports static HTML files into `/out` and publishes them to the `gh-pages` branch. Ensure your repository is public, then in GitHub **Settings → Pages** select the `gh-pages` branch as the source.

## 🌐 Connecting Your Custom Domain
1. Create `/public/CNAME` containing your domain:
   ```
   nesibekiris.com
   ```
2. Configure DNS records with your registrar (e.g., Namecheap, Google Domains):

   | Type | Name | Value |
   | ---- | ---- | ----- |
   | A    | @    | 185.199.108.153 |
   | A    | @    | 185.199.109.153 |
   | A    | @    | 185.199.110.153 |
   | A    | @    | 185.199.111.153 |
   | CNAME | www | `<username>.github.io` |

## 📈 SEO & Analytics
- Configure site metadata in `/utils/seo.config.ts`.
- Optionally add your Google Analytics tag in `_app.tsx` or `head.tsx`.

## 💾 Maintenance
- Update content by editing or adding MDX files.
- Push updates with:
  ```bash
  git add .
  git commit -m "update content"
  git push origin main
  npm run build && npm run deploy
  ```
- Keep dependencies fresh with `npm update`.

## 🧠 Credits
Built with Next.js, Tailwind CSS, Framer Motion, and MDX. Designed for a TechLetter-inspired tone—calm, pastel, and thoughtful.
