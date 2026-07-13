# Archives of California: A Documentary Calendar of the Savage Transcripts (BANC MSS C-A)

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.21327098.svg)](https://doi.org/10.5281/zenodo.21327098)

A searchable, item-level **calendar (finding aid) of the Archives of California** (BANC MSS C-A), Bancroft Library, UC Berkeley — the record series of Spanish- and Mexican-era California government.

**Why it matters:** the original provincial records were **destroyed in the 1906 San Francisco earthquake and fire.** What survives are Thomas Savage's 19th-century copies and abstracts, bound as the C-A series. This project turns those catalogs into structured, searchable data.

## 🔎 View it

**→ Open `index.html`** (or the GitHub Pages URL) in any browser. No install, works offline.

- Full-text search across summaries, authors, places, and themes
- Filter by volume, source type, document grain, and decade
- Sort any column
- **Click a scan number (↗)** to open that exact page's manuscript image on the Internet Archive and read it yourself

## 📊 What's here

- **14,455 catalog records** across **39 volumes** — 14,405 item-level documents (+ leaf/section survey rows)
- **331 verbatim transcriptions** identified
- Both page-number systems (Internet Archive scan + original tomo page), source type (Savage abstract vs. verbatim transcription), dates with an explicit confidence flag, people/places/themes where the source recorded them

## 📁 Files

| File | Contents |
|---|---|
| `index.html` | The self-contained searchable viewer (all data embedded) |
| `ca-catalog-export.csv` | Full dataset, one row per record (26 columns) |
| `ca-catalog-export.json` | Same data, structured |

## 🛠 How it was made & license

Entries were produced by page-by-page reading of the digitized Savage volumes, done with the help of a large-language-model assistant (Anthropic's Claude) directed leaf-by-leaf by the compiler, who set the cataloging rules, adjudicated uncertainties, and reviewed the output; starred documents are re-verified against the manuscript image, and automated integrity checks gate every publication (full statement on the site's **About & Sources** tab). **Data: CC BY 4.0 · code: MIT** — see `LICENSE.md`. Corrections: aodhancoyne@gmail.com or open an issue.

## ⚠️ Notes on the data

- Entries are drawn from a systematic reading of Savage's catalogs; **most are Savage's abstracts**, not the original documents' words, unless flagged `verbatim transcription`.
- Dates carry a `date_confidence` flag (`exact` / `month` / `year` / `inferred`) — an inferred date is never presented as certain.
- Empty fields mean "not recorded by the source catalog," not "no value." Coverage varies by volume.
- Duplicate/cross-reference candidates are flagged for verification, not asserted.

## 🆕 Scholarly apparatus (2026-07-02)

- **Click any row** for the full record with a formal **"Cite as" string** (series, tomo, original page, BANC MSS number, Savage-copy provenance) and a **permalink** you can put in a footnote.
- **Verbatim transcriptions:** selected documents open with a full transcription + translation + editorial note (`transcriptions/`); more are added as the deep reads are formalized.
- **Cross-archive links:** records whose counterparts or originals survive in other archives (AGN Mexico City, AGI Seville, History San José) show an "Other archives" panel (`crossrefs.json`).
- **Integrity:** every record's manuscript deep link is machine-checked (page anchor + scan range) after each update.

## How to cite this catalog

> Aodhan Coyne, *Archives of California — A Searchable Calendar of BANC MSS C-A (Savage Transcripts)*, https://aodhanm.github.io/archives-of-california/ (accessed [date]).

Machine-readable metadata: `CITATION.cff`. **To cite a document**, use the per-record "Cite as" string — and always verify against the linked manuscript image first.

## Attribution

Compiled by **Aodhan Coyne**. Manuscript images courtesy of the **Internet Archive** / **Bancroft Library, UC Berkeley**. This is a research finding aid; verify any document against the linked scan before citing.
