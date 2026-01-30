# Anibee-Haunted-House-Warming

Website for Anibee's House Warming Party and Registry.

## Local preview

```bash
python3 -m http.server
```

Then open `http://localhost:8000`.

## Configuration

Update the `CONFIG` object in `app.js` with:

- `VENMO_USERNAME`: Your Venmo username for deep links.

## Production backend (AWS Amplify)

Guestbook entries, gallery uploads, and auth are powered by AWS Amplify. To configure
the production backend, deploy the Amplify resources (Auth, Data, Storage) and then
publish the generated `amplify_outputs.json` to the site so the frontend can connect
to the correct environment.

The repository already includes the backend definitions in `amplify/` and the Amplify
pipeline configuration in `amplify.yml`. Use the Amplify CLI (or the Amplify Console
pipeline) to deploy the backend and sync the outputs to hosting.
