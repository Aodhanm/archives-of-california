#!/usr/bin/env python3
import json, re, csv, collections

cites=json.load(open('b_all_citations.json'))
PARTIAL={24,56}   # published but partially read — unmatched pages get parked, not discarded

def vol_for(series,tomo):
    """-> (ca_vol or None, multi_tomo, known_unpublished_ca or None)"""
    M={'PSP':[((1,2),1),((3,4),2),((5,6),3),((7,8),4),((9,9),5),((10,11),6),((12,13),7),((14,15),8),((16,16),9),((17,17),10),((18,18),11),((19,19),12),((20,20),13),((21,22),14)],
       'BenMil':[((1,19),15),((20,39),16),((40,52),17),((53,67),18),((69,77),19),((78,88),20)],
       'PSP-Presidios':[((1,2),21)],
       'ProvRec':[((1,2),22),((3,4),23),((5,7),24),((8,10),25),((11,12),26)],
       'SP-Sac':[((1,4),54),((6,9),55),((10,19),56)],
       'DSP-CH':[((1,8),41)],
       'DeptRec':[((1,1),46),((2,6),47),((7,7),48),((8,14),49)],
       'LegRec':[((1,1),59),((2,2),60),((3,4),61)],
       'SupGov':[((19,21),58)],
       'DSP':[((1,2),27)],          # C-A 27 = Dep. St. Pap. I–II; iii+ splits unconfirmed -> parked by tomo
       'DSP-Ang':[((1,12),34)],     # Angeles tomos across C-A 34-37; treat as 34-group, parked
       'DSP-Mont':[((1,8),43)],
       'SP-Miss':[((1,5),50),((6,11),51)],
      }
    for (a,b),v in M.get(series,[]):
        if a<=tomo<=b: return v,(a!=b)
    return None,None

ROMV={'i':1,'v':5,'x':10,'l':50,'c':100}
def roman(s):
    s=str(s).lower(); tot=0
    if not s or not all(ch in ROMV for ch in s): return None
    for a,b in zip(s,s[1:]+'\0'):
        v=ROMV[a]; tot+= -v if ROMV.get(b,0)>v else v
    return tot
def rec_interval(orig):
    o=orig.strip()
    if not o: return None
    pre=None
    m=re.match(r'^([IVXLCivxlc]+)[·.](.*)$',o)
    if m and roman(m.group(1)): pre=roman(m.group(1)); o=m.group(2)
    m=re.search(r'(\d+)\s*[-–—]\s*(\d+)',o)
    if m:
        a,b=int(m.group(1)),int(m.group(2))
        if b<a: b=int(str(a)[:len(str(a))-len(str(b))]+str(b))
        return (pre,a,b)
    m=re.search(r'(\d+)',o)
    if m: a=int(m.group(1)); return (pre,a,a)
    return None

# scan -> tomo dividers (from the source files' pinned title leaves; 2026-07-06 B-resolution pass)
DIVIDERS={
 6:[(0,10),(184,11)],                       # ca6: Tomo X n0-183, XI n184+
 7:[(0,12),(219,13)],                       # ca7: XIII title n219
 8:[(0,14),(192,15)],                       # ca8: XV title n192
 22:[(0,1),(217,2)],                        # ca22: Vol II n217+
 24:[(0,5)],                                # ca24 read so far = Tomo V only (VI/VII titles not yet reached)
 21:[(0,1),(107,2)],                        # ca21: Tomo II n107+
 14:[(0,21),(100,22)],                     # ca14: Tomo XXII begins n100 (indices n296+)
 56:[(0,10),(114,11),(186,12),(202,13),(223,14),(269,15),(297,16),(326,17),(337,18)],  # ca56 pinned title leaves
 15:[(0,1),(52,2),(102,3),(135,4),(168,5),(180,6),(187,7),(193,8),(208,9),(231,10),(244,11),(253,12),(260,13),(283,14),(296,15),(304,16),(310,17),(334,18),(349,19)],
}
def tomo_from_scan(vol,key):
    import re as _re
    m=_re.search(r'-n(\d+)$',key)
    if not m or vol not in DIVIDERS: return None
    n=int(m.group(1)); t=None
    for start,tm in DIVIDERS[vol]:
        if n>=start: t=tm
    return t

recs=[]
DBVOLS=set()
for r in csv.DictReader(open('/Users/aodhan/archives-of-california/ca-catalog-export.csv')):
    v=int(r['ca_volume']); DBVOLS.add(v)
    key='ca%s-d%s-%s'%(r['ca_volume'],r['doc_id'],(re.findall(r'n\d+',r['scan'])or[''])[0])
    tf=None
    tm=re.fullmatch(r'([IVXLCivxlc]+)',(r.get('tomo') or '').strip())
    if tm: tf=roman(tm.group(1))
    recs.append(dict(vol=v,key=key,iv=rec_interval(r['orig_page']),rating=int(r['rating'] or 0),summary=r['summary'][:80],tf=tf))
byvol=collections.defaultdict(list)
for r in recs: byvol[r['vol']].append(r)

hits=collections.defaultdict(list)
parked=collections.defaultdict(list)   # "series tomo" -> cites (unpublished target)
review=[]                              # unmatched in fully-read vols
joined=0
for c in cites:
    v,multi=vol_for(c['series'],c['tomo'])
    target=f"{c['series']} tomo {c['tomo']}" + (f" (C-A {v})" if v else " (C-A ?)")
    if v is None or v not in DBVOLS:
        parked[target].append(c); continue
    matches=[]
    for r in byvol[v]:
        if not r['iv']: continue
        pre,lo,hi=r['iv']
        if hi-lo>60: continue
        if pre is None and v==54:
            m54=re.match(r'ca54-d(\d+)-',r['key'])
            if m54 and len(m54.group(1))==4: pre=int(m54.group(1)[0])
        if pre is None: pre=tomo_from_scan(v,r['key'])
        if pre is None: pre=r.get('tf')   # hand-built volumes carry an exact tomo field
        if pre is not None and pre!=c['tomo']: continue
        tier='B' if (pre is None and multi) else 'A'
        for a,b in c['pages']:
            if not(b<lo or a>hi): matches.append((tier,r)); break
    if matches:
        joined+=1; nsh=len(matches)
        for tier,r in matches[:6]:
            hits[r['key']].append(dict(v=c['hv'],p=c['page'],cite=c['raw'],tier=tier,shared=nsh))
    else:
        (parked[target] if v in PARTIAL else review).append(c)

print(f'joined: {joined} | review (unmatched, complete vols): {len(review)} | parked: {sum(len(v) for v in parked.values())} across {len(parked)} series-tomo targets')
print('records w/ >=1 citation:',len(hits))

# --- outputs
out={}
for k,hs in hits.items():
    A=[h for h in hs if h['tier']=='A']; B=[h for h in hs if h['tier']=='B']
    seen=set(); a2=[]; b2=[]
    for h in A+B:
        sig=(h['v'],h['p'],h['cite'][:40])
        if sig in seen: continue
        seen.add(sig)
        d={'v':h['v'],'p':h['p'],'cite':h['cite']}
        if h.get('shared',1)>1: d['shared']=h['shared']
        (a2 if h['tier']=='A' else b2).append(d)
    out[k]={}
    if a2: out[k]['cited']=sorted(a2,key=lambda x:(x['v'],str(x['p'])))[:12]
    if b2: out[k]['possible']=b2[:8]
json.dump({'_scope':'Bancroft, History of California, vols. 1–7 (complete run, 2026-07-05; incl. Id./ibid. chains). '
 '"cited" = the record\'s ORIGINAL PAGE(S) cited, tomo-confirmed; "shared" = several Savage abstracts on the cited page. '
 '"possible" = page match, tomo unconfirmed. California Pastoral & non–C-A MSS out of scope.','_records':out},
 open('/Users/aodhan/archives-of-california/bancroft.json','w'),indent=0)

# parked ledger (THE waiting-room for unpublished volumes)
pk={k:[dict(hv=c['hv'],page=c['page'],tomo=c['tomo'],pages=c['pages'],raw=c['raw']) for c in v] for k,v in sorted(parked.items())}
json.dump({'_purpose':'Bancroft citations awaiting their C-A volume. When a volume is published to the DB, re-run bancroft_join_full.py — these attach automatically. Keyed by series+tomo (+ best-guess C-A vol).',
 '_counts':{k:len(v) for k,v in pk.items()},'_citations':pk},
 open('/Users/aodhan/archives-of-california/bancroft-data/parked-citations.json','w'),indent=0)
json.dump(review,open('/Users/aodhan/archives-of-california/bancroft-data/review-unmatched.json','w'),indent=0)
json.dump(cites,open('/Users/aodhan/archives-of-california/bancroft-data/hoc-all-citations.json','w'),indent=0)

tierA=sum(1 for v in out.values() if 'cited' in v)
print('overlay records:',len(out),'| tier-A:',tierA)
top=sorted(((k,len(v)) for k,v in pk.items()),key=lambda x:-x[1])[:12]
print('LARGEST PARKED TARGETS:')
for k,n in top: print(f'  {n:4}  {k}')

# census: full-History scope
Aset={k for k,v in out.items() if 'cited' in v}
cen=[r for r in recs if r['rating']>=2 and r['key'] not in hits]
cen.sort(key=lambda r:-r['rating'])
json.dump([dict(key=r['key'],rating=r['rating'],summary=r['summary']) for r in cen],open('b_census_full.json','w'),indent=0)
print('FULL census: ⭐⭐+ records with NO Bancroft citation (vols 1–7):',len(cen),'of',sum(1 for r in recs if r['rating']>=2))
