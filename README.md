# Archives of California — Searchable Calendar

A searchable, item-level **calendar (finding aid) of the Archives of California** (BANC MSS C-A), Bancroft Library, UC Berkeley — the record series of Spanish- and Mexican-era California government.

**Why it matters:** the original provincial records were **destroyed in the 1906 San Francisco earthquake and fire.** What survives are Thomas Savage's 19th-century copies and abstracts, bound as the C-A series. This project turns those catalogs into structured, searchable data.

## 🔎 View it

**→ Open `index.html`** (or the GitHub Pages URL) in any browser. No install, works offline.

- Full-text search across summaries, authors, places, and themes
- Filter by volume, source type, document grain, and decade
- Sort any column
- **Click a scan number (↗)** to open that exact page's manuscript image on the Internet Archive and read it yourself

## 📊 What's here

- **6,661 catalog records** across **22 volumes** — 6,611 item-level documents (+ leaf/section survey rows)
- **279 verbatim transcriptions** identified
- Both page-number systems (Internet Archive scan + original tomo page), source type (Savage abstract vs. verbatim transcription), dates with an explicit confidence flag, people/places/themes where the source recorded them

## 📁 Files

| File | Contents |
|---|---|
| `index.html` | The self-contained searchable viewer (all data embedded) |
| `ca-catalog-export.csv` | Full dataset, one row per record (26 columns) |
| `ca-catalog-export.json` | Same data, structured |

## ⚠️ Notes on the data

- Entries are drawn from a systematic reading of Savage's catalogs; **most are Savage's abstracts**, not the original documents' words, unless flagged `verbatim transcription`.
- Dates carry a `date_confidence` flag (`exact` / `month` / `year` / `inferred`) — an inferred date is never presented as certain.
- Empty fields mean "not recorded by the source catalog," not "no value." Coverage varies by volume.
- Duplicate/cross-reference candidates are flagged for verification, not asserted.

## Attribution

Compiled by **Aodhan Coyne**. Manuscript images courtesy of the **Internet Archive** / **Bancroft Library, UC Berkeley**. This is a research finding aid; verify any document against the linked scan before citing.
