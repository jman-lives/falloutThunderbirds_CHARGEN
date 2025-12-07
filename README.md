# Fallout: Thunderbirds Character Generator

A static web app for creating and saving characters for the Fallout: Thunderbirds tabletop campaign.

**Live site:** https://jman-lives.github.io/falloutThunderbirds_CHARGEN/

## About

This is a fully client-side character generator:
- Fill in character details or click `Generate Random` for a random character.
- Click `Download JSON` to save the character as a file to your computer.
- Use the file input to load a previously saved character JSON.
- All processing happens locally — nothing is uploaded.

## Files

All files are in the `docs/` folder:
- `index.html` — form UI
- `styles.css` — styling
- `script.js` — client-side logic
- `.nojekyll` — tells GitHub Pages to skip Jekyll processing

## Development

Edit files in `docs/` and commit. GitHub Pages will automatically rebuild.

To test locally:
```bash
cd docs
python3 -m http.server 8000
# then open http://127.0.0.1:8000
```

## Notes

- No server or database required.
- Downloaded JSONs are created locally; nothing is sent elsewhere.

Questions or features? Let me know!
