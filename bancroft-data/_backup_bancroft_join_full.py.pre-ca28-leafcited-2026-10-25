#!/usr/bin/env python3
"""bancroft_join_full.py v2 — Session H census rebuild (2026-07-14).

v1 (retired) joined with its OWN volume/tomo/divider maps — the drift that the
resolver audit called failure-class 3. v2 joins every HoC citation through the
resolver's OWN index (resolver.json, engine v10.x, dual page systems), so the
census and the resolver can never disagree by construction.

Preserves bancroft.json `_corrections` (append-only history) and any
tier:leaf-verified attachments; re-blocks exact (record, cite) pairs that
_corrections documents as removed/suspended — the corrected index re-routes
those cites to their true targets or leaves them unmatched honestly.

Outputs: bancroft.json (attachments + provenance tiers), parked-citations.json
(series-tomo targets absent from the index = unpublished volumes),
review-unmatched.json (misses inside COMPLETE volumes = catalog-gap leads),
b_census_full.json (the never-cited ★★+ census).
"""
import json, re, collections, os

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

RES = json.load(open(os.path.join(REPO, 'resolver.json')))
IDX = RES['index']
CAVEAT_VOLS = set(RES.get('caveats', {}).keys())
cites = json.load(open(os.path.join(HERE, 'hoc-all-citations.json')))
OLD = json.load(open(os.path.join(REPO, 'bancroft.json')))
CAT = json.load(open(os.path.join(REPO, 'ca-catalog-export.json')))

# the citations file's series labels -> resolver series keys. Labels whose key
# is absent from the index park naturally (SP_MISS/DSP/DSP_MONT = C-A 50/51,
# 28-33, 43 not yet published).
SERMAP = {'PSP': 'PSP', 'BenMil': 'PSP_BM', 'PSP-Presidios': 'PSP_PRES',
          'ProvRec': 'PROV_REC', 'SP-Sac': 'SP_SAC', 'SP-Miss': 'SP_MISS',
          'DSP': 'DSP', 'DSP-Mont': 'DSP_MONT', 'DeptRec': 'DEPT_REC',
          'LegRec': 'LEG_REC', 'SupGov': 'SUP_GOV', 'DSP-Ang': 'DSP_ANG',
          'DSP-CH': 'DSP_CH'}

# Bancroft's citation system per volume (leaf-proven; feedback_bancroft_page_numbers):
# LEAF_CITED = he cites the handwritten per-tomo leaf / Savage-page side; MIXED = both.
LEAF_CITED = {'12', '15', '16', '17', '18', '19', '20', '25', '26', '54', '55', '56'}
MIXED_CITED = {'13', '14', '44'}

# volumes read to completion (per the completed-volumes ledger, 2026-07-14):
# a page-miss inside these = a review lead; in any other DB volume it parks.
COMPLETE = {3, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 34,
            41, 42, 46, 49, 52, 54, 55, 56, 58, 59, 60, 61}

# record key = ca{vol}-d{doc}-n{first scan} (v1 convention, kept for continuity)
KEY = {}
for r in CAT:
    scans = re.findall(r'n\d+', str(r.get('scan') or ''))
    KEY[(str(r['ca_volume']), str(r['doc_id']))] = 'ca%s-d%s-%s' % (
        r['ca_volume'], r['doc_id'], scans[0] if scans else '')

# ---- blocklist + hand-preserved attachments from the current file ----
def _sig(rec_key, cite_text): return (rec_key, cite_text[:40])
block = set()
for e in OLD.get('_corrections', []):
    rm = e.get('removed')
    if isinstance(rm, dict): rm = [rm]
    for x in rm or []:
        block.add(_sig(x['record'], x['cite']['cite']))
    sus = e.get('suspended')
    if isinstance(sus, dict):                      # {reckey: {cited: [...]}}
        for k, v in sus.items():
            for h in v.get('cited', []): block.add(_sig(k, h['cite']))
    elif isinstance(sus, list):
        for h in sus:
            k = h.get('reckey') or e.get('key')
            if k: block.add(_sig(k, h['cite']))
hand = collections.defaultdict(list)               # key -> leaf-verified cites
for k, v in OLD.get('_records', {}).items():
    for h in v.get('cited', []):
        if h.get('tier') == 'leaf-verified': hand[k].append(h)

# ---- the join ----
hits = collections.defaultdict(list)
parked = collections.defaultdict(list)
review = []
joined = blocked = 0
for c in cites:
    sk = SERMAP.get(c['series'])
    # OCR-ambiguous bare '1.' as the Ben.Mil. tomo token: Bancroft's 'l. 9'
    # (tomo L, 1818) OCRs as '1. 9' — attaching these to C-A 15's tomo I
    # (1770s) is the known wrong-century join (date-guard precedent, F-row
    # 2026-07-13; precision-gate fail #13, 2026-07-14). Park for hand work.
    if c['series'] == 'BenMil' and c['tomo'] == 1 and re.search(r'[\s,.]1\.\s*\d', c['raw']):
        parked['BenMil tomo 1-or-L (OCR-ambiguous bare "1.")'].append(c); continue
    ivs = IDX.get(sk, {}).get(str(c['tomo']), []) if sk else []
    label = f"{c['series']} tomo {c['tomo']}"
    if not ivs:
        parked[label].append(c); continue
    matches = {}                                   # (vol,doc) -> best system
    for (a, b) in c['pages']:
        for iv in ivs:
            p1, p2, vol, doc = iv[0], iv[1], iv[2], iv[3]
            sy = iv[4] if len(iv) > 4 else 'p'
            if p1 <= b and a <= p2:
                cur = matches.get((vol, doc))
                if cur is None or (cur == 's' and sy == 'p'):
                    matches[(vol, doc)] = sy
    if matches:
        joined += 1
        # Per-volume system preference (feedback_bancroft_page_numbers, the
        # leaf-proven per-volume citation map): in volumes Bancroft cites by
        # handwritten per-tomo leaf / Savage page, an 's' hit is the true
        # system and a 'p' hit is a page coincidence (the ca25 Tomo-X class,
        # Session I 2026-07-14); everywhere else 'p' (original pages) wins.
        # Mixed volumes (13/14/44 — he cites BOTH ways) keep both candidates.
        grouped = collections.defaultdict(dict)
        for kk, sy in matches.items(): grouped[str(kk[0])][kk] = sy
        matches = {}
        for vol, g in grouped.items():
            if vol in MIXED_CITED:
                matches.update(g); continue
            want = 's' if vol in LEAF_CITED else 'p'
            if any(sy == want for sy in g.values()):
                g = {kk: sy for kk, sy in g.items() if sy == want}
            matches.update(g)
        nsh = len(matches)
        for (vol, doc), sy in sorted(matches.items())[:6]:
            key = KEY.get((str(vol), str(doc)))
            if not key: continue
            if _sig(key, c['raw']) in block: blocked += 1; continue
            tier = 'orig-page' if sy == 'p' else 'leaf'
            d = {'v': c['hv'], 'p': c['page'], 'cite': c['raw'], 'tier': tier}
            if nsh > 1: d['shared'] = nsh
            if str(vol) in CAVEAT_VOLS and sy == 's': d['caveat'] = str(vol)
            hits[key].append(d)
    else:
        vols = {int(iv[2]) for iv in ivs}
        (review if vols <= COMPLETE else parked[label]).append(c)

# hand-preserved cites win over (and dedupe against) machine ones
for k, hs in hand.items():
    sigs = {_sig(k, h['cite']) for h in hits.get(k, [])}
    for h in hs:
        if _sig(k, h['cite']) not in sigs: hits[k].append(h)
        else:
            for m in hits[k]:
                if _sig(k, m['cite']) == _sig(k, h['cite']): m['tier'] = 'leaf-verified'

# ---- outputs ----
out = {}
for k, hs in hits.items():
    seen, kept = set(), []
    for h in sorted(hs, key=lambda x: (x.get('tier') != 'leaf-verified',
                                       x.get('tier') != 'orig-page')):
        sig = (h.get('v'), h.get('p'), h['cite'][:40])
        if sig in seen: continue
        seen.add(sig); kept.append(h)
    out[k] = {'cited': sorted(kept, key=lambda x: (x.get('v', 0), str(x.get('p', ''))))[:12]}

newb = {'_scope': ('Bancroft, History of California, vols. 1-7 (complete run; incl. Id./ibid. chains). '
        'REBUILT 2026-07-14 (Session H) through the resolver\'s own index (engine v10.x, dual page '
        'systems) — v1\'s parallel join maps retired. Tiers: leaf-verified (hand, page image read) > '
        'orig-page (primary-system interval) > leaf (secondary/Savage-leaf interval; "caveat" flags '
        'page-system-caveat volumes — treat as provisional). "shared" = several records overlap the '
        'cited page. California Pastoral & non-C-A MSS out of scope.'),
        '_records': out, '_corrections': OLD.get('_corrections', [])}
json.dump(newb, open(os.path.join(REPO, 'bancroft.json'), 'w'), indent=0, ensure_ascii=False)

pk = {k: [dict(hv=c['hv'], page=c['page'], tomo=c['tomo'], pages=c['pages'], raw=c['raw'])
          for c in v] for k, v in sorted(parked.items())}
json.dump({'_purpose': ('Bancroft citations awaiting their C-A volume (their series-tomo has no resolver '
           'index entries = unpublished/unindexed). Re-run bancroft_join_full.py after any volume '
           'publishes — these attach automatically.'),
           '_counts': {k: len(v) for k, v in pk.items()}, '_citations': pk},
          open(os.path.join(HERE, 'parked-citations.json'), 'w'), indent=0, ensure_ascii=False)
json.dump(review, open(os.path.join(HERE, 'review-unmatched.json'), 'w'), indent=0, ensure_ascii=False)

cen = [dict(key=KEY[(str(r['ca_volume']), str(r['doc_id']))],
            rating=int(r['rating'] or 0), summary=str(r.get('summary'))[:80])
       for r in CAT if int(r['rating'] or 0) >= 2
       and KEY[(str(r['ca_volume']), str(r['doc_id']))] not in hits]
cen.sort(key=lambda r: -r['rating'])
json.dump(cen, open(os.path.join(HERE, 'b_census_full.json'), 'w'), indent=0, ensure_ascii=False)

print(f"cites {len(cites)} | joined {joined} | parked {sum(len(v) for v in pk.values())} "
      f"across {len(pk)} targets | review-unmatched {len(review)} | blocked {blocked}")
print(f"overlay records {len(out)} | attachments {sum(len(v['cited']) for v in out.values())} "
      f"| never-cited (rating>=2) {len(cen)}")
top = sorted(pk.items(), key=lambda x: -len(x[1]))[:10]
print("largest parked targets:")
for k, v in top: print(f"  {len(v):4}  {k}")
