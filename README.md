# Riley & Lexi — Wedding Site

Mobile-first guest site for **October 2, 2027** (`02.10.2027`). Cream paper, brown ink, save-the-date pets art.

## Quick start

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

## Editing content

All guest-facing copy and section flags live in [`src/content.ts`](src/content.ts):

- `visibility.showVenue` / `showDetails` / `showWeddingParty` — flip to `true` when ready
- `wedding.location` — set when the venue is decided (Home shows it only if non-empty)
- FAQ, welcome text, party placeholders

## RSVP → Google Sheet

1. Create a Google Sheet with headers:  
   `Timestamp | Name | Attending | PlusOne | GuestNames | Dietary | Note`
2. **Extensions → Apps Script**, paste [`google-apps-script/Code.gs`](google-apps-script/Code.gs)
3. **Deploy → New deployment → Web app** (Execute as: Me, Who has access: Anyone)
4. Copy `.env.example` to `.env` and set `VITE_RSVP_ENDPOINT` to the web app URL
5. Restart `npm run dev`

Without `VITE_RSVP_ENDPOINT`, the form still validates and shows success (local preview only — nothing is saved).

## Deploy

Build static files with `npm run build`, then host the `dist/` folder on Netlify, Vercel, or similar. Add `VITE_RSVP_ENDPOINT` in the host’s environment variables.
