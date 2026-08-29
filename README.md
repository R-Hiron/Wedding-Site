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

Guests look themselves up by name, then answer for themselves. The guest list
stays in the spreadsheet and is never sent to the browser — a lookup returns one
person and nothing else.

1. Create a Google Sheet with two tabs, `Invitations` and `Responses`. They can
   start empty; the script adds the headers on first run.
2. **Extensions → Apps Script**, paste [`google-apps-script/Code.gs`](google-apps-script/Code.gs)
3. **Deploy → New deployment → Web app** (Execute as: Me, Who has access: Anyone)
4. Copy `.env.example` to `.env` and set `VITE_RSVP_ENDPOINT` to the web app URL
5. Restart `npm run dev`

### Filling in the guest list

One row per guest on the `Invitations` tab — everybody RSVPs for themselves:

| Guest        | AllowPlusOne | AlsoKnownAs   |
| ------------ | ------------ | ------------- |
| John Smith   | yes          | Jonny         |
| Jane Smith   |              | Janey, Jane B |
| Jean Wallace |              |               |
| Ray Wallace  |              |               |

- **Guest** is the name the page greets them by, so write it the way you'd say
  it. Everyone on the list needs their own row.
- **AllowPlusOne** — `yes` for anyone who may bring a guest of their own. The
  Apps Script enforces this, so it can't be worked around in the browser.
- **AlsoKnownAs** — other names they might type, comma separated. Worth filling
  in for anyone who goes by something other than what you wrote.

A first name on its own is enough when only one guest has it; otherwise the page
asks for a surname. Spelling, spacing, capitals, accents and small typos are all
forgiven. Run **Wedding → Check the guest list** in the sheet to find names that
would be ambiguous, and **Wedding → Look up a name** to try one without saving
anything.

Replies land on `Responses`, one row per guest. Somebody who replies again
replaces their row rather than adding another, and the page shows them what they
said last time so they can change it. Rows with `OnList` set to `no` are guests
the list couldn't place, who replied through the fallback form — those need
matching up by hand.

You can also link someone straight to their reply with `/rsvp?name=Jane%20Smith`.

Without `VITE_RSVP_ENDPOINT`, the page invents a guest from whatever name is
typed so it can be worked on locally. Nothing is saved.

To check the deployed script is answering, with the dev server running:

```bash
npm run check:rsvp -- "Jane Smith"
```

That only performs a lookup, so it reads the sheet and writes nothing. Called
with no name it looks up one that shouldn't exist, which is enough to prove the
endpoint is reachable.

## Deploy

Build static files with `npm run build`, then host the `dist/` folder on Netlify, Vercel, or similar. Add `VITE_RSVP_ENDPOINT` in the host’s environment variables.
