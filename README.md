# YourDegree — Home page

Static landing page built from the Figma design
[YOUR-DEGREE_NEW → Home Page — Desktop](https://www.figma.com/design/7ddqCpgnAYjdyydCNo4Ebm/YOUR-DEGREE_NEW?node-id=164-10964).

- `index.html` — page markup (one `<section>` per Figma frame)
- `styles.css` — design tokens + styles, responsive down to 360px
- `main.js` — carousels, tabs, counsellor switcher, search
- `assets/` — images and icons exported from Figma

## Assets

Images and icons come from Figma. Download them with:

```sh
./scripts/fetch-figma-assets.sh
```

The script reads `scripts/figma-assets.txt` (local file name → Figma MCP asset id).
Those Figma URLs are temporary (about 7 days). If they have expired, re-export the
assets from the Figma file and update the manifest.

## Run

Open `index.html` directly, or serve the folder:

```sh
python3 -m http.server 8000
```
