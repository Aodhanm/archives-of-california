#!/usr/bin/env python3
"""Validate crossrefs.json AND the asset manifests against the live catalog.

ROOT CAUSE THIS GUARDS
A crossref key is caV-dN-nSCAN. A volume re-read inserts records and renumbers
doc_ids, but crossrefs.json is never re-keyed, so an old note silently attaches
to a DIFFERENT document. Seven entries were wrong on the live site on
2026-09-24 (ca6-d192, ca55-d335, ca14-d160, ca63-d230, ca63-d326,
ca12-d465, ca12-d466). The keys all *resolved*; they resolved to the wrong
record. Key resolution alone is therefore NOT a sufficient test.

RUN AFTER EVERY VOLUME REPUBLISH.  Exit 1 if anything is suspect.

Tests, in order:
  DANGLING  key matches no record at all
  YEAR      a year named in the note is absent from the record's date
  CONTENT   note and record share no distinctive vocabulary
CONTENT weights a shared term by how rare it is across the whole catalog: one
shared rare term (a personal name, a ship, a place) outweighs three common ones,
because these notes describe the OTHER archive and legitimately share little
wording with the C-A summary.

LIMITS, measured.  Replayed against the seven keys known to be wrong, this
catches five.  It MISSES ca63-d230 and ca63-d326: the drifted record sat in the
same year and the same subject area (San Jose 1847 elections; an 1849 alcalde
case) as the intended one, so neither the year nor the vocabulary test fires.
A green run means no crossref is obviously misattached.  It does not mean every
crossref is right, and it is not a substitute for re-reading a pairing after the
volume it points into has been re-read.
"""
import json, re, sys, pathlib
from collections import Counter

ROOT = pathlib.Path(__file__).resolve().parent.parent
recs = json.loads((ROOT / "ca-catalog-export.json").read_text())
xref = json.loads((ROOT / "crossrefs.json").read_text())

# Pairs a human has read and confirmed despite a low automatic score.
# key -> why it is fine.
REVIEWED = {
    "ca17-d174-n115": "Boris's 950-skin declaration; note describes the AGN "
                      "Provincias Internas file, no shared wording expected "
                      "(checked 2026-09-24)",
}

def rkey(r):
    m = re.search(r"n\d+", str(r.get("scan") or ""))
    return f"ca{r['ca_volume']}-d{r['doc_id']}-" + (m.group(0) if m else "")

by = {rkey(r): r for r in recs}

STOP = set("""the a an of to in and for on at by from with this that his her its as is are was
were be been which who whom not no or el la los las de del y en que se su sus por para con un
una es son published edition transcribed translated savage spanish text also see counterpart
original survives record document documents papers archives side scan verified pairing index
level cited cite same both ends other than""".split())

def toks(s):
    return {w for w in re.findall(r"[a-záéíóúñü]{4,}", s.lower()) if w not in STOP}

# document frequency across the catalog, for rarity weighting
df = Counter()
for r in recs:
    df.update(toks(r.get("summary", "")))
N = len(recs)
RARE = max(40, N // 200)          # a term in fewer than this many records is distinctive

problems = []
for k, v in sorted(xref.items()):
    if k.startswith("_") or not isinstance(v, dict):
        continue
    r = by.get(k)
    if r is None:
        problems.append((k, "DANGLING", "key matches no record"))
        continue
    txt = v.get("text", "")

    yrs = set(re.findall(r"1[78]\d\d", txt))
    ryr = (r.get("date_text") or r.get("year") or "")[:4]
    if yrs and ryr and ryr not in yrs:
        problems.append((k, "YEAR", f"record is {ryr}; note names {sorted(yrs)}"))
        continue

    if txt.startswith("Published edition") or k in REVIEWED:
        continue
    blob = " ".join(str(r.get(f, "")) for f in ("summary", "detail", "author", "recipient"))
    shared = toks(txt) & toks(blob)
    strong = [w for w in shared if df[w] < RARE]
    if not strong and len(shared) < 3:
        problems.append((k, "CONTENT",
                         f"no distinctive shared term with «{r.get('summary','')[:58]}»"))

# --- the same drift breaks the asset manifests, which are keyed identically ---
for name in ("transcriptions/manifest.json", "expanded/manifest.json"):
    mp = ROOT / name
    if not mp.exists():
        continue
    man = json.loads(mp.read_text())
    for k in man:
        if k.startswith("_"):
            continue
        if k not in by:
            problems.append((k, "DANGLING", f"{name}: key matches no record, so the "
                                            "attached page never renders"))

# --- the overlays that nest their keys under _records ---
# witnesses.json documents six ca14 keys deliberately left unbound because more
# than one record shares the scan and Hittell's page cannot choose between them.
WITNESS_AMBIGUOUS = {"ca14-d1080-n253", "ca14-d1082-n254", "ca14-d1084-n255",
                     "ca14-d1092-n258", "ca14-d1104-n266", "ca14-d1130-n275"}
for name in ("bancroft.json", "witnesses.json"):
    mp = ROOT / name
    if not mp.exists():
        continue
    rec = json.loads(mp.read_text()).get("_records", {})
    for k in rec:
        if k.startswith("_") or k in WITNESS_AMBIGUOUS:
            continue
        if k not in by:
            problems.append((k, "DANGLING", f"{name}: key matches no record, so the "
                                            "attached box never renders"))

live = len([k for k in xref if not k.startswith("_")])
print(f"crossrefs: {live}   reviewed-exempt: {len(REVIEWED)}   suspect: {len(problems)}")
for k, kind, why in problems:
    print(f"  [{kind}] {k} — {why}")
sys.exit(1 if problems else 0)
