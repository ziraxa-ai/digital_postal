# ZIRAXA — Digital Interactive Brochure

This is a **single‑page, luxury‑styled, interactive** brochure (tri‑fold preview + reading mode), bilingual **FA/EN**, optimized for GitHub Pages.

## 1) Update your personal/company info
Open `script.js` and edit the `PROFILE` object at the top:

- `contactPerson`
- `phoneDisplay`, `phoneE164`
- `email`
- `handle`
- (optional) `websiteUrl`

You can also edit brochure texts inside the `CONTENT` object.

## 2) Local preview (recommended)
You can open `index.html` directly, but modern browsers sometimes restrict some features (clipboard) with `file://`.
For best results, run a local static server:

### Option A — Python (most common)
```bash
cd ziraxa-digital-brochure
python -m http.server 8080
```
Then open:
- http://localhost:8080

### Option B — Node
```bash
npx serve
```

## 3) Publish on GitHub Pages (no build step)
### Step-by-step
1. Create a new repository on GitHub (public or private).
2. Upload the files **as-is** (keep this structure):
   - `index.html`
   - `styles.css`
   - `script.js`
   - `assets/logo.png`
3. Go to:
   - **Settings → Pages**
4. Under **Build and deployment**:
   - Source: **Deploy from a branch**
   - Branch: **main** (or `master`) and **/(root)**
5. Save. GitHub will provide your Pages URL.

### CLI alternative
```bash
git init
git add .
git commit -m "Add ZIRAXA digital brochure"
git branch -M main
git remote add origin https://github.com/<YOUR_USERNAME>/<REPO>.git
git push -u origin main
```
Then enable Pages in Settings.

## 4) Export as PDF
Click **Export PDF** on the top bar. In the print dialog choose **Save as PDF**.

## Notes
- QR code is generated via a small CDN library (qrcodejs) which is compatible with GitHub Pages.
- If you set `websiteUrl`, it will also appear in the modal contact section and in the vCard (QR).
