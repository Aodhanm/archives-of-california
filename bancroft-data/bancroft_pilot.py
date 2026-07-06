#!/usr/bin/env python3
"""Bancroft Tier-2 PILOT: extract C-A citations from HoC vol.1 and join to the catalog."""
import json, re, csv, collections

# --- load per-leaf text with printed pages
st = open('b1_search.txt', errors='ignore').read()
pidx = json.load(open('b1_pageindex.json'))
pnum = {p['leafNum']: p.get('pageNumber') for p in json.load(open('b1_pages.json'))['pages']}
leaves = []
for i, ent in enumerate(pidx):
    a, b = ent[0], ent[1]
    if b > a:
        leaves.append((i, pnum.get(i), st[a:b]))

# --- series patterns (tolerant of OCR: 8t/St, Frov/Prov, spacing)
SP = r"[SB8]t\.?\s*"          # St. with OCR 8t/Bt
PROV = r"[PF]rov\.?\s*"
ROM = r"([ivxlcIVXLC1l]+)"    # roman numeral w/ OCR 1/l
PAGES = r"([0-9][0-9OoIl]*(?:\s*[-–]\s*[0-9OoIl]+)?(?:\s*,\s*[0-9][0-9OoIl]*(?:\s*[-–]\s*[0-9OoIl]+)?){0,4})"
MS = r"(?:,?\s*MS\.?\s*[.,]?)?"
SERIES = [
 ('PSP-BenMil', PROV+SP+r"Pap\.?,?\s*Ben(?:icia)?\.?,?\s*Mil(?:it)?\.?"+MS),
 ('PSP-Presidios', PROV+SP+r"Pap\.?,?\s*Presidios,?"+MS),
 ('PSP', PROV+SP+r"Pap\.?"+MS),
 ('ProvRec', PROV+r"Rec\.?"+MS),
 ('SP-Sac', SP+r"Pap\.?,?\s*Sac\.?"+MS),
 ('SP-Miss', SP+r"Pap\.?,?\s*Miss(?:ions)?\.?(?:\s*(?:and|&)\s*Colon\.?)?"+MS),
]
# longest-first matching: BenMil/Presidios before bare PSP
cites = []
for leaf, page, text in leaves:
    t = re.sub(r'\s+', ' ', text)
    taken = []
    for name, pat in SERIES:
        for m in re.finditer(pat + r'\s*[,.]?\s*' + ROM + r'\.?\s*' + PAGES, t):
            span = m.span()
            if any(not (span[1] <= a or span[0] >= b) for a, b in taken): continue
            taken.append(span)
            cites.append(dict(series=name, tomo_raw=m.group(1), pages_raw=m.group(2),
                              leaf=leaf, page=page, raw=t[max(0,span[0]-10):span[1]+5]))
print('raw citations extracted:', len(cites))
print(collections.Counter(c['series'] for c in cites))

def roman(s):
    s = s.lower().replace('1','i').replace('l','i')
    vals={'i':1,'v':5,'x':10,'c':100}
    if not all(ch in vals for ch in s): return None
    tot=0
    for a,b in zip(s, s[1:]+'\0'):
        v=vals.get(a,0); tot += -v if vals.get(b,0)>v else v
    return tot

def parse_pages(s):
    s = s.replace('O','0').replace('o','0').replace('I','1').replace('l','1').replace('–','-').replace('.',' ')
    out=[]
    for part in re.split(r'[,\s]+', s):
        if not part: continue
        m = re.fullmatch(r'(\d+)(?:-(\d+))?', part)
        if not m: continue
        a=int(m.group(1))
        b=m.group(2)
        if b:  # elided range 120-35 -> 120-135
            b=int(b); 
            if b < a: b = int(str(a)[:len(str(a))-len(str(int(m.group(2))))] + m.group(2))
        else: b=a
        if 0 < a <= 2000 and a <= b <= 2000: out.append((a,b))
    return out

for c in cites:
    c['tomo'] = roman(c['tomo_raw'])
    c['pages'] = parse_pages(c['pages_raw'])
good = [c for c in cites if c['tomo'] and c['pages']]
print('parsed OK:', len(good))
json.dump(good, open('b1_citations.json','w'), indent=0)
