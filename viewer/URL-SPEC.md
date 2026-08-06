# Permanent image + viewer URL specification
*v1.0, 2026-08-05. This scheme is a permanence commitment: once Phase 3 goes live these URLs never change. Plan: vault `projects/ca-archives/ia-mirror-plan-2026-08-05.md`.*

## Viewer (live now, IA-backed interim mode)
```
https://archivesofcalifornia.com/viewer/?vol={V}&leaf={n}
```
- `V` = C-A volume number 1–63 (bare number; `ca31` also accepted).
- `n` = scan leaf index, identical to the Internet Archive n-numbers already recorded across the catalog, resolver, and DB. No re-cataloging is ever required.

## Self-hosted images (Phase 3, Cloudflare R2 bucket)
```
https://images.archivesofcalifornia.com/ca{NN}/read/n{leaf}.jpg   (~1400px wide reading copy)
https://images.archivesofcalifornia.com/ca{NN}/full/n{leaf}.jpg   (full-resolution derivative)
https://images.archivesofcalifornia.com/ca{NN}/thumb/n{leaf}.jpg  (thumbnail, optional later)
```
- `NN` = zero-padded volume number (`ca04`, `ca31`).
- Derived from the IA `_jp2.zip` masters; masters themselves stay on the cold-storage SSD, not in the bucket.

## Mode switch
`viewer/index.html` has a single constant `IMG_MODE` (`'ia'` now, `'self'` at cutover). Flipping it, plus the link templates in `build_export.py` / resolver output, is the entire site-wide cutover. Rollback = flip back.

## Rules
1. Never rename or renumber files in the bucket. Corrections are uploaded in place (same key).
2. `viewer/volumes.js` is generated from vault `volumes.json` (idents + leaf counts); regenerate on volume metadata changes, never hand-edit.
3. IA links remain as labeled secondary links while the IA items exist.
