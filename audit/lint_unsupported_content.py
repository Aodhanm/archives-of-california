#!/usr/bin/env python3
"""lint_unsupported_content.py — triage for catalogue rows that may assert content
absent from the manuscript leaf.

WHAT THIS IS NOT
----------------
This is NOT a measurement of the invention rate, and it must never be quoted as one.
It cannot read leaves. It ranks rows for a human to open. The only instrument that
can produce a rate is a random sample with leaf reads (see the Stage 1 design in
vault `06 Main Notes/Research Projects/ca-archives/invented-catalogue-rows-2026-10-06.md`).

WHY TWO DETECTORS
-----------------
Three confirmed inventions (2026-10-06/07) fail in two different ways, and neither
detector alone catches both:

  A  INTERPRETIVE CLAIM. The summary asserts what the document is EVIDENCE FOR
     ("applied directly to", "the policy follow-up to", "companion to", "proves").
     A one-line Savage abstract cannot support such a clause, so the clause came
     from the cataloguer. Caught ca55-d258 (a whole fabricated row: published as
     "two English ships at Bodega" for a letter about two English deserters asking
     to convert) and ca54-d88 ("Concepción" where the leaf reads «Aranzazú»).
     MISSED ca54-d183.

  B  RIVAL NAME / SUPPLIED NAME. A quoted proper noun sitting beside a hedge and a
     second, different name. Caught ca54-d183, where the catalogue printed the brig
     "under 'Puget'" while Savage wrote «al mándo del Caballero 'Britor' (Sic)
     (Supongo es Broughton)». MISSED ca55-d258.

  ⚠ The inversion worth understanding: in d183 the HEDGE marks the TRUE part
    (Savage's own Broughton guess) and the CONFIDENT part is the invention. And
    d258, the worst case, is written with total confidence and no hedge at all.
    So a detector keyed only on uncertainty markers looks in the wrong place:
    hedges mark conscientiousness, not fraud. B works because it keys on a name
    CONFLICT, not on doubt.

MEASURED, AND THE CAVEAT IS LOAD-BEARING
----------------------------------------
On the 9 records adjudicated at the leaf on 2026-10-06/07:
    sensitivity 3/3 · specificity 6/6 · precision 3/3
⚠ n=9, all from one thematic cluster (Bodega/Vancouver in C-A 54/55), and the
detector was built after seeing those cases. Treat as promising, NOT validated.
Honest statement: "it caught all three known inventions and flagged none of six
known-clean rows; it has never been tested on rows it was not designed against."

Usage:
    python3 audit/lint_unsupported_content.py              # ranked triage list
    python3 audit/lint_unsupported_content.py --selftest   # regression on known cases
    python3 audit/lint_unsupported_content.py --json out.json
"""
import json, os, re, sys, collections

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
EXPORT = os.path.join(REPO, "ca-catalog-export.json")

INTERP = re.compile(
    r"\b(the policy follow-up|applied directly to|is the policy|proves|evidence that|"
    r"confirms the|corroborat\w+|demonstrates|extends the|companion to|counterpart to|"
    r"follow-up to|the fullest|the clearest|the decisive|central \w+ document)\b", re.I)

_Q     = r"[‘’'\"*]"
_NAME  = r"[A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑáéíóúñ.]{1,22}"
_HEDGE = r"(?:supongo(?: es)?|probably|likely|perhaps|possibly|presumably|i\.?e\.?|=|\?)"
NAMEHEDGE = re.compile(
    rf"{_Q}{_NAME}(?:[ .]{_NAME})?{_Q}[^.;]{{0,30}}?{_HEDGE}[^.;]{{0,12}}?{_NAME}"
    rf"|\bsupongo\b", re.I)

# A summary's routing tail (after "→") is curatorial by design; detector A ignores it.
def descriptive_body(s):
    return (s or "").split("→")[0]

def classify(summary):
    """Return (flags, evidence). flags ⊆ {'A','B'}."""
    flags, ev = set(), {}
    m = INTERP.search(descriptive_body(summary))
    if m:
        flags.add("A"); ev["A"] = m.group(0)
    m = NAMEHEDGE.search(summary or "")
    if m:
        flags.add("B"); ev["B"] = m.group(0)[:80]
    return flags, ev

def load():
    with open(EXPORT, encoding="utf-8") as fh:
        return json.load(fh)

# Rows adjudicated at the leaf on 2026-10-06/07. Pre-fix text is kept verbatim so the
# regression still fires after the live records were corrected.
KNOWN = [
 ("ca55-d258", "INVENTED",
  "Do NOT aid the two English ships at Bodega (those of his letter of the 2nd) who sought to "
  "resupply / harbored deserters — wait for the Viceroy's decision, 'á no ser que sucediese antes "
  "peligro de muerte.' Arrillaga's foreign-exclusion policy applied directly to Bodega, the policy "
  "follow-up to the Jan 1793 sighting (Doc 164/Entry 13)"),
 ("ca54-d183", "INVENTED",
  "Doc III-13 — Sal → Arrillaga — 'Sobre la expedición de Vancouver.' — The fullest Sal narrative "
  "of Vancouver's SF visit (Nov 1792); the brig 'Chatham' under 'Puget' ('supongo es Broughton') "
  "arrived the 18th."),
 ("ca54-d88", "INVENTED",
  "'Sobre buques que han pasado frente al puerto.' — A second Sal letter of 31 Oct 1792 (companion "
  "to the boundary letter i.119): on the 21st a frigate passed the harbor mouth and saluted with 4 "
  "cannon (answered in kind), thought to be the *'Concepción'[?]*"),
 ("ca54-d51",  "clean", None), ("ca54-d279", "clean", None), ("ca54-d74", "clean", None),
 ("ca24-d763", "clean", None), ("ca24-d770", "clean", None), ("ca24-d754", "clean", None),
]

def selftest(recs):
    by = {f"ca{r['ca_volume']}-d{r['doc_id']}": r for r in recs}
    tp = fp = fn = tn = 0
    print("regression on leaf-adjudicated rows (2026-10-06/07):\n")
    for rid, label, pre in KNOWN:
        text = pre if pre is not None else (by.get(rid, {}).get("summary") or "")
        if pre is None and rid not in by:
            print(f"  {rid:<12} SKIPPED (not in export)"); continue
        flags, ev = classify(text)
        hit = bool(flags)
        tag = "".join(sorted(flags)) or "-"
        print(f"  {rid:<12} {label:<9} {'FLAG[' + tag + ']' if hit else 'pass':<9}"
              f"{(' ' + repr(ev.get('A') or ev.get('B'))) if hit else ''}")
        if label == "INVENTED":
            tp, fn = (tp + 1, fn) if hit else (tp, fn + 1)
        else:
            fp, tn = (fp + 1, tn) if hit else (fp, tn + 1)
    print(f"\n  TP={tp} FN={fn} FP={fp} TN={tn}")
    print(f"  sensitivity {tp}/{tp+fn} · specificity {tn}/{tn+fp} · precision {tp}/{tp+fp or 1}")
    print("\n  ⚠ n=9, one thematic cluster, detector built after seeing these cases.")
    print("  ⛔ Promising, NOT validated. Never quote the flag count as an invention rate.")
    return 0 if fn == 0 else 1

def main():
    args = sys.argv[1:]
    recs = load()
    if "--selftest" in args:
        sys.exit(selftest(recs))
    out, byvol = [], collections.Counter()
    for r in recs:
        flags, ev = classify(r.get("summary"))
        if not flags:
            continue
        rid = f"ca{r['ca_volume']}-d{r['doc_id']}"
        out.append({"record": rid, "vol": r["ca_volume"], "scan": r.get("scan"),
                    "date": r.get("date_text"), "flags": "".join(sorted(flags)),
                    "evidence": ev, "summary_head": (r.get("summary") or "")[:160]})
        byvol[r["ca_volume"]] += 1
    # both detectors firing on one row is the strongest signal
    out.sort(key=lambda r: (r["flags"] != "AB", r["vol"], r["record"]))
    print(f"catalogue rows flagged for leaf triage: {len(out)} of {len(recs)} "
          f"({100*len(out)/len(recs):.2f}%)")
    print(f"  both detectors (read these first): {sum(1 for r in out if r['flags']=='AB')}")
    print(f"  A interpretive claim only        : {sum(1 for r in out if r['flags']=='A')}")
    print(f"  B rival/supplied name only       : {sum(1 for r in out if r['flags']=='B')}")
    print("\ntop volumes: " + ", ".join(f"ca{v}:{c}" for v, c in byvol.most_common(10)))
    print("\n⛔ This is a TRIAGE RANKING, not a measurement. A flag means 'open the leaf',")
    print("   not 'this is wrong'. The rate can only come from a random sample (Stage 1).")
    if "--json" in args:
        path = args[args.index("--json") + 1]
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(out, fh, ensure_ascii=False, indent=1)
        print(f"\nwrote {path}")
    else:
        print("\nfirst 20 (both-detector rows first):")
        for r in out[:20]:
            print(f"  [{r['flags']:<2}] {r['record']:<12} {str(r['date'])[:10]:<10} "
                  f"{list(r['evidence'].values())[0][:48]!r}")

if __name__ == "__main__":
    main()
