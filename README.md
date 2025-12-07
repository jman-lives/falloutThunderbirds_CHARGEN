# Fallout: Thunderbirds Character Generator

This is a small static web app for creating characters for the Fallout: Thunderbirds tabletop campaign.

What this repo provides
- `index.html` — character form UI you can host on GitHub Pages.
- `styles.css` — minimal styling for a clean layout.
- `script.js` — client-side logic (randomize, download JSON, load JSON).

Quick usage
- Open `index.html` in your browser.
- Click `Generate Random` to create a character, or fill fields manually.
- Click `Download JSON` to save the character as a `.json` file.
- Use the file input to load a saved JSON and repopulate the form.

Deploy to GitHub Pages
- Option A — Serve from repository root on `main`: push this repo to GitHub and enable Pages (Settings → Pages → Source: `main` branch / root).
- Option B — Use `gh-pages` branch: copy these files to a `gh-pages` branch and set Pages to serve from that branch.
- Option C — Serve from the `docs/` folder: this repo already includes a `docs/` folder with the site copy. In GitHub Pages settings choose Source: `main` branch / `docs` folder.

Notes
- This is a fully client-side solution; no server or database is required.
- Downloaded JSON files are created locally in the browser; nothing is uploaded.

Want changes?
- Tell me if you'd like additional fields, a printable character sheet, or automation (CI) to keep `docs/` in sync.
