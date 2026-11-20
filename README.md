# KnowDrug Representative Edition (English)

An English copy of the KnowDrug representative app. It retains the original avatar setup, video generation demo, doctor insights, knowledge base, video invitation flow, and the same video files and sources. The Chinese project remains separate.

## Run locally

```bash
python3 -m http.server 8080 --directory dist
```

Open `http://127.0.0.1:8080/` on a computer or phone on the same network.

## Implementation

- `dist/` is the deployable site. GitHub Pages serves this directory from the `gh-pages` branch.
- `dist/i18n-en.js` translates interface text without changing the underlying workflow or video media.
- Q&A requests include `locale: "en"`. The optional English branch in `server/worker.mjs` returns English streaming answers and follow-up questions; requests without the locale continue to use Chinese.
- Browser data uses the `knowdrug-representative-en-` prefix and `knowdrug-representative-en-workspace` IndexedDB name, separate from the Chinese project.

## Check

```bash
npm ci
npm test
```

The DeepSeek API key stays on the server and is never included in the web bundle.
