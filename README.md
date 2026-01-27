# Anibee-Haunted-House-Warming

Website for Anna's Haunted House Warming Party and Registry.

## Local preview

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

## Pages

- `index.html`: Landing invite with party details and countdown.
- `gift-registry.html`: Pledge-based gift registry with Venmo redirects.
- `photo-gallery.html`: Placeholder for event photos.
- `message-board.html`: Placeholder for guestbook messages.

## Configuration

Update the `CONFIG` object in `app.js` with:

- `API_BASE_URL`: API Gateway URL for `/funds` and `/pledge`.
- `VENMO_USERNAME`: Your Venmo username for deep links.

If `API_BASE_URL` is blank, the registry uses sample fund data and generates the Venmo
redirect locally.
