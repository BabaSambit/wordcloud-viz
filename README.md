# Word Cloud — Looker Studio Community Visualization

A custom word cloud viz that connects directly to BigQuery via Looker Studio.

## Files

| File | Purpose |
|------|---------|
| `index.html` | Entry point loaded by Looker Studio |
| `wordcloud.js` | Main visualization logic (D3 + d3-cloud) |
| `wordcloud.json` | Config: dimensions, metrics, style properties |
| `manifest.json` | Viz metadata |

---

## Deployment Steps

### 1. Create a Google Cloud Storage bucket

```bash
gsutil mb gs://your-wordcloud-viz
gsutil iam ch allUsers:objectViewer gs://your-wordcloud-viz
```

### 2. Upload all files

```bash
gsutil cp index.html    gs://your-wordcloud-viz/
gsutil cp wordcloud.js  gs://your-wordcloud-viz/
gsutil cp wordcloud.json gs://your-wordcloud-viz/
gsutil cp manifest.json gs://your-wordcloud-viz/
```

### 3. Set CORS (required for Looker Studio to load your files)

Create a file called `cors.json`:
```json
[
  {
    "origin": ["https://lookerstudio.google.com"],
    "method": ["GET"],
    "responseHeader": ["Content-Type"],
    "maxAgeSeconds": 3600
  }
]
```

Apply it:
```bash
gsutil cors set cors.json gs://your-wordcloud-viz
```

### 4. Add to Looker Studio

1. Open your Looker Studio report
2. Click **Add a chart** → **Community visualizations**
3. Click **"Explore more"** → **"Build your own"**
4. Enter your component ID:
   ```
   gs://your-wordcloud-viz/wordcloud.json
   ```
5. Click **Submit**

### 5. Connect BigQuery

- **Dimension** → your word/text column (e.g. `product_name`, `keyword`)
- **Metric** → your count/weight column (e.g. `search_count`, `frequency`)

---

## Style Options

| Option | Description |
|--------|-------------|
| Color Scheme | Ocean, Sunset, Forest, Candy, Mono Dark |
| Background Color | Any color picker value |
| Font | Any Google Font |
| Min/Max Font Size | Controls word size range |
| Max Words | Limit displayed words (10–200) |
| Spiral Layout | Archimedean or Rectangular |
| Word Rotations | Horizontal, Mixed, or Vertical & Horizontal |
| Show Tooltip | Shows word + count on hover |

---

## Local Testing (optional)

Looker Studio provides a local dev server:

```bash
npm install -g @google/dscc-scripts
dscc-scripts viz start
```

Then load `http://localhost:8080` to preview with mock data.
