# Oscars Predictions

A simple, accessible Oscars prediction game built with vanilla HTML, CSS, and JavaScript. Users register with only a username, make picks, and see a local leaderboard once results are entered. No money, no betting, and no personal details.

## Features

- Local-only usernames and picks (stored in your browser).
- Admin-style results entry to calculate scores.
- Deterministic leaderboard with tie handling.
- JSON export/import for moving data between devices.

## Getting Started

Open `index.html` in a browser. For best results, run a local web server (so `fetch()` can load `data/categories.json`).

```bash
# Example: Python simple server
python3 -m http.server 8080
```

Then visit `http://localhost:8080` in your browser.

## How to vote

Pick at least one category to submit your predictions. You can update your picks until the ceremony deadline (set in `data/categories.json` as `ceremonyDate`, 12:00 GMT).

## Update nominees (one-time scrape)

Run the fetch script to populate `data/categories.json` from the Oscars site:

```bash
npm install
npm run fetch-nominees
```

You can also pass a different ceremony URL:

```bash
npm run fetch-nominees -- https://www.oscars.org/oscars/ceremonies/2025
```

Note: the Oscars site blocks automated requests. The script automatically falls back
to a read-only proxy when direct fetches are denied.

## Data and Customization

Edit `data/categories.json` to:
- Update the Oscar year.
- Replace nominees with the real list.
- Adjust per-category points (optional).

The app stores data in `localStorage` under the following keys:
- `oscars_users`
- `oscars_picks`
- `oscars_results`
- `oscars_current_user`

## File Overview

- `index.html` – Accessible UI for registration, picks, results, and leaderboard.
- `css/site.css` – Styles and focus treatments (no Tailwind).
- `js/app.js` – App logic, storage, scoring, and rendering.
- `data/categories.json` – Categories and nominees.

## Notes

This is a static app. The leaderboard is local to the browser unless users export/import data.
