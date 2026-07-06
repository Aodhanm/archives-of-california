#!/usr/bin/env python3
import json, re, csv, collections

cites = json.load(open('b1_citations.json'))

# series+tomo -> C-A volume (volumes IN the DB only; others parked)
def vol_for(series, tomo):
    if series=='PSP':
        m={(1,2):1,(3,4):2,(5,6):3,(7,8):4,(9,9):5,(10,11):6,(12,13):7,(14,15):8,(16,16):9,(17,17):10,(18,18):11,(19,19):12,(20,20):13,(21,22):14}
        for (a,b),v in m.items():
            if a<=tomo<=b: return v, (a!=b)
    if series=='PSP-BenMil':
        m={(1,19):15,(20,39):16,(40,52):17,(53,67):18,(69,77):19,(78,88):20}
        for (a,b),v in m.items():
            if a<=tomo<=b: return v, True
    if series=='PSP-Presidios':
        if 1<=tomo<=2: return 21, True
    if series=='ProvRec':
        m={(1,2):22,(3,4):23,(5,7):24,(8,10):25,(11,12):26}
        for (a,b),v in m.items():
            if a<=tomo<=b: return v, (a!=b)
    if series=='SP-Sac':
        m={(1,4):54,(6,9):55,(10,19):56}
        for (a,b),v in m.items():
            if a<=tomo<=b: return v, (a!=b)
    if series=='SP-Miss': return None, None  # C-A 50-53 partials, not joinable yet
    return None, None

ROMV={'i':1,'v':5,'x':10,'l':50,'c':100}
def roman(s):
    s=s.lower(); tot=0
    if not s or not all(ch in ROMV for ch in s): return None
    for a,b in zip(s,s[1:]+'\0'):
        v=ROMV[a]; tot += -v if ROMV.get(b,0)>v else v
    return tot

def rec_interval(orig):
    """orig_page -> (tomo_prefix or None, lo, hi) — None if unparseable"""
    o=orig.strip()
    if not o: return None
    pre=None
    m=re.match(r'^([IVXLCivxlc]+)[·.](.*)$',o)
    if m and roman(m.group(1)):
        pre=roman(m.group(1)); o=m.group(2)
    m=re.search(r'(\d+)\s*[-–—]\s*(\d+)',o)
    if m:
        a,b=int(m.group(1)),int(m.group(2))
        if b<a: b=int(str(a)[:len(str(a))-len(str(b))]+str(b))  # elided 657-8
        return (pre,a,b)
    m=re.search(r'(\d+)',o)
    if m: a=int(m.group(1)); return (pre,a,a)
    return None

recs=[]
for r in csv.DictReader(open('/Users/aodhan/archives-of-california/ca-catalog-export.csv')):
    iv=rec_interval(r['orig_page'])
    key='ca%s-d%s-%s'%(r['ca_volume'],r['doc_id'],(re.findall(r'n\d+',r['scan'])or[''])[0])
    recs.append(dict(vol=int(r['ca_volume']),key=key,iv=iv,rating=int(r['rating'] or 0),
                     summary=r['summary'][:80],star=int(r['rating'] or 0)))
byvol=collections.defaultdict(list)
for r in recs: byvol[r['vol']].append(r)

hits=collections.defaultdict(list)   # key -> [cite dicts]
parked=collections.Counter(); joined=0; ambiguous=0; unmatchedpage=0
for c in cites:
    v,multi=vol_for(c['series'],c['tomo'])
    if not v or v not in byvol:
        parked[(c['series'],'C-A %s'%v if v else 'unmapped')]+=1; continue
    matches=[]
    for r in byvol[v]:
        if not r['iv']: continue
        pre,lo,hi=r['iv']
        if hi-lo>60: continue  # scattered/bounded giant ranges swallow everything
        if pre is None and v==54:
            m54=re.match(r'ca54-d(\d+)-',r['key'])
            if m54 and len(m54.group(1))==4: pre=int(m54.group(1)[0])  # doc_id encodes tomo (1xxx=I..4xxx=IV)
        if pre is not None and pre!=c['tomo']: continue
        if pre is None and multi: tier='B'
        else: tier='A'
        for a,b in c['pages']:
            if not (b<lo or a>hi):
                matches.append((tier,r)); break
    if matches:
        joined+=1
        for tier,r in matches[:6]:
            hits[r['key']].append(dict(v=1,p=c['page'],cite=c['raw'].strip()[:90],tier=tier))
    else:
        unmatchedpage+=1
print('citations joined to >=1 record:',joined,'| no page match:',unmatchedpage,'| parked:',sum(parked.values()))
print('records with >=1 citation:',len(hits))
print('parked detail:',dict(parked))
json.dump(hits,open('b1_hits.json','w'),indent=0)
# census: starred records in vol-1-relevant DB volumes with NO hit
core_vols={1,2,3,5,6,7,8,9,10,15,16,21,22,24,54,55}
cen=[r for r in recs if r['vol'] in core_vols and r['rating']>=2 and r['key'] not in hits]
print('census: ⭐⭐+ records in Spanish-period vols with NO vol-1 citation:',len(cen),'of',sum(1 for r in recs if r['vol'] in core_vols and r['rating']>=2))
json.dump([dict(key=r['key'],rating=r['rating'],summary=r['summary']) for r in cen],open('b1_census.json','w'),indent=0)
