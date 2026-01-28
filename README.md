# Anibee-Haunted-House-Warming

Website for Anibee's House Warming Party and Registry.

## Local preview

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

## Local API server (SQLite)

To persist guestbook entries, photo uploads, and gift totals, run the API server:

```bash
npm install
npm start
```

Then open `http://localhost:3000`.

If you only want the static preview, set `API_BASE_URL` to an empty string in the
frontend scripts.

## Configuration

Update the `CONFIG` object in `app.js` with:

- `API_BASE_URL`: API Gateway URL for `/funds` and `/pledge`.
- `VENMO_USERNAME`: Your Venmo username for deep links.

If `API_BASE_URL` is blank, the site uses the sample fund data and generates the Venmo
redirect locally.
