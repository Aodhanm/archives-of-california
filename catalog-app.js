let rows=DATA.slice(), sortK="ca_volume", sortD=1;
const el=id=>document.getElementById(id);
const esc=s=>(s||"").replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
const decade=y=>{y=parseInt(y);return isNaN(y)?"":Math.floor(y/10)*10+"s";};
function showTab(t){
 el('catview').classList.toggle('hidden',t!='cat'); el('bancview').classList.toggle('hidden',t!='banc'); el('tagview').classList.toggle('hidden',t!='tag'); el('pplview').classList.toggle('hidden',t!='ppl'); el('abtview').classList.toggle('hidden',t!='abt');
 el('tabCat').classList.toggle('on',t=='cat'); el('tabBanc').classList.toggle('on',t=='banc'); el('tabTag').classList.toggle('on',t=='tag'); el('tabPpl').classList.toggle('on',t=='ppl'); el('tabAbt').classList.toggle('on',t=='abt');
 window.scrollTo(0,0);
}
(function(){const it=DATA.filter(d=>d.granularity=="item"),ys=DATA.filter(d=>!/\[sic\][\s\S]{0,40}?read\s+\d{4}/i.test(d.date_text||"")&&!/NOT a primary/i.test(d.summary||"")).map(d=>parseInt(d.year)).filter(y=>!isNaN(y)),vb=it.filter(d=>d.source_type=="verbatim transcription").length,vols=new Set(DATA.map(d=>d.ca_volume)).size;
 el("stats").innerHTML=[["Documents",it.length.toLocaleString()],["Volumes",vols],["Span",ys.reduce((a,b)=>b<a?b:a)+"–"+ys.reduce((a,b)=>b>a?b:a)],["Verbatim",vb.toLocaleString()],["Records",DATA.length.toLocaleString()]].map(s=>`<div class="stat">${s[0]}<b>${s[1]}</b></div>`).join("");})();
const norm=s=>String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function fmatch(r,k,v){const any=(s,vv)=>vv.split('|').map(x=>x.trim()).filter(Boolean).some(x=>norm(s||'').includes(x));
 if(k=='vol')return v.split('|').some(x=>String(r.ca_volume)===x.replace(/^ca/,''));
 if(k=='year'){const m=v.match(/^(\d{4})(?:\.\.(\d{4}))?$/);if(!m)return true;const y=parseInt(r.year);return !isNaN(y)&&y>=+m[1]&&y<=+(m[2]||m[1]);}
 if(k=='author'||k=='from')return any(r.author,v);
 if(k=='to')return any(r.recipient,v);
 if(k=='place')return any(r.place,v);
 if(k=='tag'){/* a tag is a whole theme, not a substring of one: tag:indigenous must not sweep in indigenous-labor and indigenous-military, which overcounted it 2.5x */const ts=norm(r.themes||'').split(';').map(x=>x.trim()).filter(Boolean);return v.split('|').map(x=>norm(x.trim())).filter(Boolean).some(x=>ts.includes(x));}
 return true;}
function apply(){let q=norm(el('q').value).trim();const fv=el('fv').value,fs=el('fs').value,fg=el('fg').value,fd=el('fd').value,fb=el('fb').value;
 const fld=[];q=q.replace(/(^|\s)(vol|year|author|from|to|place|tag):("[^"]+"|\S+)/g,function(m,sp,k,v){fld.push([k,v.replace(/^"|"$/g,'')]);return sp;}).replace(/\s+/g,' ').trim();
 rows=DATA.filter(r=>{if(fv&&r.ca_volume!==fv)return false;if(fs&&r.source_type!==fs)return false;if(fg&&r.granularity!==fg)return false;if(fd&&decade(r.year)!==fd)return false;if(fb){const b=bstat(r);if(fb==='no'&&b)return false;if(fb!=='no'&&b!==fb)return false;}
  for(const fkv of fld){if(!fmatch(r,fkv[0],fkv[1]))return false;}
  if(q){const h=norm(r.summary+" "+r.author+" "+r.recipient+" "+r.place+" "+r.themes+" "+r.scan);const terms=q.split('|').map(t=>t.trim()).filter(Boolean);if(terms.length&&!terms.some(t=>h.includes(t)))return false;}return true;});
 rows.sort((a,b)=>{let x=a[sortK]||"",y=b[sortK]||"";if(sortK=='ca_volume'||sortK=='doc_id'||sortK=='year'){x=parseInt(x)||0;y=parseInt(y)||0;}return x<y?-sortD:x>y?sortD:0;});render(q);saveHash();}
function hlt(t,q){t=esc(t);if(!q)return t;try{const pat=q.split('|').map(s=>s.trim()).filter(Boolean).map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('|');if(!pat)return t;return t.replace(new RegExp('('+pat+')','ig'),'<mark>$1</mark>');}catch(e){return t;}}
function render(q){const fb=el('fb').value;const pv=[...new Set(rows.map(r=>r.ca_volume))].filter(v=>VOLCOV[v]&&VOLCOV[v].cov!=='complete');
 el('count').textContent=rows.length.toLocaleString()+" records"+(fb?(" · Bancroft: "+el('fb').selectedOptions[0].text):"")+(pv.length?" · ⚠ includes partly-cataloged vols: "+pv.slice(0,3).map(v=>'C-A '+v).join(', ')+(pv.length>3?' +'+(pv.length-3):'')+" (see About)":"")+" · data build 2026-10-21";
 document.querySelectorAll('#catview thead th').forEach(t=>{const a=t.querySelector('.ar');if(a)a.textContent=(t.dataset.k==sortK)?(sortD>0?' ▲':' ▼'):'';});
 const lim=Math.min(rows.length,1500),h=[];
 for(let i=0;i<lim;i++){const r=rows[i],vb=r.source_type=='verbatim transcription';
  h.push('<tr data-i="'+i+'"><td class="v">C-A '+r.ca_volume+'</td><td>'+r.doc_id+'</td><td class="sc">'+(r.ia_url?('<a href="'+r.ia_url+'" target="_blank" rel="noopener" onclick="event.stopPropagation()">'+esc(r.scan)+' ↗</a>'):esc(r.scan))+'</td><td>'+esc(r.date_text||r.year)+'</td><td>'+hlt(r.author,q)+'</td><td class="'+(vb?'vb':'')+'">'+(vb?'verbatim':esc(r.source_type))+'</td><td class="g-'+r.granularity+'">'+(bstat(rows[i])==='cited'?'<span class="bb" title="Cited by Bancroft, History of California; click row for volume & page">B</span>':(bstat(rows[i])==='possible'?'<span class="bb bbq" title="Possible Bancroft citation (tomo unconfirmed)">B?</span>':''))+(r.rating>0?'★'.repeat(Math.min(r.rating,5))+' ':'')+hlt(r.summary,q)+(r.themes?' <span class="th">· '+esc(r.themes)+'</span>':'')+'</td></tr>');}
 if(rows.length>lim)h.push('<tr><td colspan="7" style="text-align:center;color:var(--mut);padding:14px">…showing first '+lim.toLocaleString()+' of '+rows.length.toLocaleString()+'; refine your search.</td></tr>');
 el('tb').innerHTML=h.join('');}
const rkey=r=>'ca'+r.ca_volume+'-d'+r.doc_id+'-'+(String(r.scan||'').match(/n\d+/)||[''])[0];
function mkcite(r){const op=r.orig_page||'';let tomo='',page=op;const m=op.match(/^([IVXLCivxlc]+)[·.](.+)$/);if(m){tomo=m[1];page=m[2];}
 const parts=[];if(r.series)parts.push(r.series+', MS');if(tomo)parts.push('tom. '+tomo);if(page)parts.push('p. '+page);
 return (parts.length?parts.join(', '):'MS')+', Archives of California, BANC MSS C-A '+r.ca_volume+', Bancroft Library, University of California, Berkeley'+(r.savage_page?'; Savage transcript p. '+r.savage_page:'')+' (original destroyed 1906; digitized scan '+(r.scan||'<span class="th">not given</span>')+(r.ia_url?', '+r.ia_url:'')+')';}
let TRMAN=null; fetch('transcriptions/manifest.json').then(x=>x.json()).then(j=>{TRMAN=j;apply();openFromHash();}).catch(()=>{TRMAN={};});
let EXPMAN=null; fetch('expanded/manifest.json').then(x=>x.json()).then(j=>{EXPMAN=j;}).catch(()=>{EXPMAN={};});
let XREF=null; fetch('crossrefs.json').then(x=>x.json()).then(j=>{XREF=j;openFromHash();}).catch(()=>{XREF={};});
let ERR=null; fetch('errata.json').then(x=>x.json()).then(j=>{ERR={};j.forEach(e=>{(ERR[e.key]=ERR[e.key]||[]).push(e)});}).catch(()=>{ERR={};});
let WIT=null; fetch('witnesses.json').then(x=>x.json()).then(j=>{WIT=j._records||{};openFromHash();}).catch(()=>{WIT={};});
let BANC=null; fetch('bancroft.json').then(x=>x.json()).then(j=>{BANC=j._records||{};apply();openFromHash();}).catch(()=>{BANC={};});
let PPL=null; fetch('people.json').then(x=>x.json()).then(j=>{PPL=(j||[]).filter(e=>e&&e.canonical);renderPeople();}).catch(()=>{PPL=[];renderPeople();});
function pplSearch(q){const b=el('q');if(b){b.value=q;}['fv','fs','fg','fd','fb'].forEach(id=>{const e=el(id);if(e)e.value='';});showTab('cat');apply();if(b){b.focus();b.scrollIntoView({block:'center'});}}
function renderPeople(){const box=el('ppllist');if(!box)return;if(!PPL||!PPL.length){box.innerHTML='<p class="th">People register unavailable.</p>';return;}
 box.innerHTML=PPL.map(p=>'<div class="pcard"><div class="pname">'+esc(p.canonical)+(p.fl?' <span class="pfl">fl. '+esc(p.fl)+'</span>':'')+'</div>'+(p.role?'<div class="prole">'+esc(p.role)+'</div>':'')+(p.note&&p.note.trim()?'<div class="pwarn">'+esc(p.note)+'</div>':'')+((p.variants&&p.variants.length)?'<div class="pforms">forms: '+esc(p.variants.join(', '))+'</div>':'')+'<button class="plink" data-q="'+esc(p.query||p.variants[0])+'">Find in the catalog &rarr;</button></div>').join('');
 box.querySelectorAll('.plink').forEach(b=>b.onclick=()=>pplSearch(b.dataset.q));}
function bstat(r){if(!BANC)return'';const b=BANC[rkey(r)];if(!b)return'';return b.cited?'cited':(b.possible?'possible':'');}
function openDetail(r){window.__lastFocus=document.activeElement;const kv=[["Volume","C-A "+r.ca_volume+(r.archive?' ('+esc(r.archive)+')':'')],["Document #",esc(r.doc_id)],["Series",esc(r.series)||'<span class="th">not given</span>'],["Tomo",esc(r.tomo)||'<span class="th">not given</span>'],["Date",esc(r.date_text||r.year)+(r.date_confidence?' <span class="th">('+esc(r.date_confidence)+')</span>':'')],["From",esc(r.author)||'<span class="th">not given</span>'],["To",esc(r.recipient)||'<span class="th">not given</span>'],["Place",esc(r.place)||'<span class="th">not given</span>'],["Scan",esc(r.scan)],["Orig. tomo p.",esc(r.orig_page)||'<span class="th">not given</span>'],["Savage p.",esc(r.savage_page)||'<span class="th">not given</span>'],["Source",esc(r.source_type)||'<span class="th">not given</span>'],["Type",esc(r.doc_type)||'<span class="th">not given</span>'],["Detail",(r.detail&&r.detail.length>3)?esc(r.detail):'<span class="th">not given</span>'],["Highlights",r.rating>0?'★'.repeat(Math.min(r.rating,5)):'; '],["Grain",esc(r.granularity)]];
 const themes=(r.themes||"").split("; ").filter(x=>x).map(t=>'<span class="chip">'+esc(t)+'</span>').join('');
 const key=rkey(r); const cite=mkcite(r);
 const hasTr=TRMAN&&TRMAN[key]; const hasExp=EXPMAN&&EXPMAN[key];
 el('cardbody').innerHTML='<button class="x" aria-label="Close record" onclick="closeD()">×</button><h2>'+esc(r.summary||'(untitled)')+'</h2><div class="meta">C-A '+r.ca_volume+' · doc '+r.doc_id+' · '+esc(r.date_text||r.year)+' · <a href="#'+key+'" onclick="event.stopPropagation()">permalink</a></div><div class="kv">'+kv.map(x=>'<div class="k">'+x[0]+'</div><div>'+x[1]+'</div>').join('')+'</div>'+(themes?'<div style="margin-top:12px">'+themes+'</div>':'')
 +((r.verified)?'<div class="citebox" style="border-color:#2e7d32"><div class="k" style="color:#2e7d32">✓ Leaf-verified</div>'+esc(r.verified)+'</div>':'<div class="citebox"><div class="k">Provenance</div><span class="th">AI-drafted calendar entry, human-reviewed; not yet re-checked against the manuscript image. Field-level error rates for this tier are published in About (blind sample audit, 2026-07-19); verify exact dates, spellings, and quoted words at the linked leaf before citing.</span></div>')+((ERR&&ERR[key])?ERR[key].map(e=>'<div class="citebox" style="border-color:#b5651d"><div class="k" style="color:#b5651d">'+(e.type==='caution'?'⚠ Caution':'✎ Erratum ('+e.type.replace('-',' ')+')')+'</div>'+(e.was&&e.was!=='; '?'<b>Was:</b> '+esc(e.was)+'<br>':'')+'<b>The manuscript:</b> '+esc(e.reads)+(e.note?'<br><span class="th">'+esc(e.note)+'</span>':'')+'</div>').join(''):'')
 +'<div class="citebox"><div class="k">Cite as (the Savage copy)</div><span id="citetxt">'+esc(cite)+'</span></div>'
 +'<div class="citebox"><div class="k">Permanent link to this record</div><a href="/record/ca'+r.ca_volume+'/ca'+r.ca_volume+'-d'+r.doc_id+'.html">/record/ca'+r.ca_volume+'/ca'+r.ca_volume+'-d'+r.doc_id+'.html</a><br><span class="th">A stable, citable page for this entry alone; safe to put in a footnote or send to a colleague.</span></div>'
 +((XREF&&XREF[key])?'<div class="citebox" style="border-color:var(--accent)"><div class="k">'+({published:'Published edition',counterpart:'See also; counterpart (both ends survive)','circular-copy':'See also; circular (another addressee’s copy)',related:'See also; related document',copy:'See also; another copy',original:'See also; the original survives'}[XREF[key].kind]||'Other archives')+'</div>'+esc(XREF[key].text)+(XREF[key].link?' <a href="'+XREF[key].link+'" target="_blank" rel="noopener">↗</a>':'')+'</div>':'')
 +((BANC&&BANC[key])?('<div class="citebox"><div class="k">Bancroft, History of California</div>'+((BANC[key].cited||[]).map(c=>'Cites this document’s original page(s): vol. '+c.v+', p. '+esc(c.p)+'; <span class="th">“…'+esc(c.cite)+'…”</span>'+(c.shared?' <span class="th">(page shared by '+c.shared+' abstracts; verify which is meant)</span>':'')).join('<br>'))+((BANC[key].possible&&BANC[key].possible.length)?((BANC[key].cited?'<br>':'')+'<span class="th">Possible (tomo unconfirmed): '+BANC[key].possible.map(c=>'v.'+c.v+' p.'+esc(c.p)).join(' · ')+'</span>'):'')+'</div>'):'')
 +((WIT&&Array.isArray(WIT[key])&&WIT[key].length)?('<div class="citebox" style="border-color:#8d6e63"><div class="k" style="color:#8d6e63">Witnesses to the original, before 1906</div>'+WIT[key].map(w=>w&&w.note?('<span class="th">'+esc(String(w.note))+'</span>'):('<b>'+esc(String((w&&w.who)||''))+'</b>'+((w&&w.work)?', <i>'+esc(String(w.work))+'</i>':'')+((w&&w.vol)?' '+esc(String(w.vol))+'.':'')+((w&&w.cite)?'; '+esc(String(w.cite)):'')+((w&&w.sole)?'':' <span class="th">(page shared with another abstract; verify which is meant)</span>'))).join('<br>')+'<div class="th" style="margin-top:6px">These writers used the ORIGINAL archive, destroyed in 1906. Matched to this record by series, tomo and page.</div></div>'):'')
 +(hasTr?'<div class="trbox" id="trbox"><div class="trk">Loading '+esc(TRMAN[key].kind||'transcription')+'…</div></div>':'')
 +(hasExp?'<div class="trbox" id="expbox"><div class="trk">Loading expanded entry…</div></div>':'')
 +'<div class="acts">'+(r.ia_url?'<a class="go" href="'+r.ia_url+'" target="_blank" rel="noopener">View manuscript page ↗</a>':'')+'<button onclick="navigator.clipboard&&navigator.clipboard.writeText(document.getElementById(\'citetxt\').textContent)">Copy citation</button><button onclick="navigator.clipboard&&navigator.clipboard.writeText(location.href.split(\'#\')[0]+\'#\'+\''+key+'\')">Copy link</button><button onclick="closeD()">Close</button></div>';
 if(hasTr){fetch('transcriptions/'+TRMAN[key].file).then(x=>x.text()).then(h=>{const b=document.getElementById('trbox');if(b)b.innerHTML=h;}).catch(()=>{});}
 if(hasExp){fetch('expanded/'+EXPMAN[key].file).then(x=>x.text()).then(h=>{const b=document.getElementById('expbox');if(b)b.innerHTML=h;}).catch(()=>{});}
 try{history.replaceState(null,'','#'+key);}catch(e){}
 el('ov').classList.add('on');setTimeout(()=>{const x=el('cardbody').querySelector('.x');if(x)x.focus()},0);}
function closeD(){if(window.__lastFocus)try{window.__lastFocus.focus()}catch(e){};el('ov').classList.remove('on');try{history.replaceState(null,'',location.pathname+location.search);}catch(e){}saveHash();}
el('tb').addEventListener('click',e=>{const tr=e.target.closest('tr[data-i]');if(tr)openDetail(rows[+tr.dataset.i]);});
el('ov').addEventListener('click',e=>{if(e.target===el('ov'))closeD();});
document.addEventListener('keydown',e=>{if(e.key=='Escape')closeD();});
document.querySelectorAll('#catview thead th').forEach(t=>t.onclick=()=>{const k=t.dataset.k;if(k==sortK)sortD=-sortD;else{sortK=k;sortD=1;}apply();});
let dt;el('q').addEventListener('input',()=>{clearTimeout(dt);dt=setTimeout(apply,150);});
['fv','fs','fg','fd','fb'].forEach(id=>{el(id).addEventListener('change',apply);el(id).addEventListener('input',apply);});
el('go').onclick=apply;
el('clear').onclick=()=>{['q','fv','fs','fg','fd','fb'].forEach(id=>el(id).value='');apply();};
(function(){ // dynamic volume filter from DATA
 const vols=[...new Set(DATA.map(d=>parseInt(d.ca_volume)))].sort((a,b)=>a-b);
 el('fv').innerHTML='<option value="">All volumes</option>'+vols.map(v=>'<option>'+v+'</option>').join('');
 const nv=document.getElementById('nvols'); if(nv)nv.textContent=vols.length;
 // sync the About roadmap with the searchable set + coverage grades from VOLCOV
 const hd=document.querySelector('.voltab thead tr'); if(hd){const th=document.createElement('th');th.textContent='Hand';hd.appendChild(th);}
 document.querySelectorAll('.voltab tbody tr').forEach(tr=>{
  const m=(tr.querySelector('td')||{}).textContent?.match(/C-A (\d+)/); if(!m){tr.insertAdjacentHTML('beforeend','<td class="th">not given</td>');return;}
  const c=VOLCOV[m[1]]; const st=tr.children[4];
  if(c&&st){tr.style.background='#fff6ec';
   const g=c.cov==='complete'?'<span style="color:var(--accent);font-weight:700">✓ complete</span>'
    :c.cov==='partial'?'<span style="color:#b5651d;font-weight:700" title="'+(c.note||'').replace(/"/g,'&quot;')+'">◐ partial</span>'
    :'<span style="color:#b5651d;font-weight:700" title="'+(c.note||'').replace(/"/g,'&quot;')+'">◔ targeted</span>';
   st.innerHTML=g+(c.cov!=='complete'&&c.note?'<div class="th" style="font-size:11px;max-width:230px">'+c.note+'</div>':'');
  } else if(st&&st.textContent.includes('searchable')){tr.style.background='';st.innerHTML='<span class="th">in progress</span>';}
  tr.insertAdjacentHTML('beforeend','<td class="th">'+((c&&c.hand)?c.hand.replace(/ \(title-leaf tag\)/,''):'not given')+'</td>');
 });
})();
const HF={q:'q',v:'fv',s:'fs',g:'fg',d:'fd',b:'fb'};
function saveHash(){if(el('ov').classList.contains('on'))return;if(/^ca\d+-d/.test(location.hash.replace('#','')))return;const ps=[];for(const k in HF){const x=el(HF[k]).value;if(x)ps.push(k+'='+encodeURIComponent(x));}try{history.replaceState(null,'',ps.length?'#'+ps.join('&'):location.pathname+location.search);}catch(e){}}
function loadHash(){const h=location.hash.replace('#','');if(!h||!h.includes('='))return;h.split('&').forEach(p=>{const i=p.indexOf('=');if(i<1)return;const k=p.slice(0,i);if(HF[k]){try{el(HF[k]).value=decodeURIComponent(p.slice(i+1));}catch(e){}}});}
function openFromHash(){const h=location.hash.replace('#','');if(!h)return;const m=h.match(/^ca(\d+)-d([\w]+)-?(n\d+)?/);if(!m)return;
 const r=DATA.find(d=>d.ca_volume==m[1]&&d.doc_id==m[2]&&(!m[3]||(String(d.scan||'').match(/n\d+/)||[''])[0]==m[3]));if(r)openDetail(r);}
window.addEventListener('hashchange',openFromHash);
// A bare tab name in the hash opens that tab: citing.html and what-is-in-it.html
// were retired into the About tab and canonicalise to /#abt, which did nothing
// until this existed (audit 2026-10-21).
function openTabFromHash(){const h=location.hash.replace('#','');if(['cat','banc','tag','ppl','abt'].indexOf(h)>=0)showTab(h);}
window.addEventListener('hashchange',openTabFromHash);
// --- Bancroft footnote resolver (engine v9 client port; data = resolver.json) ---
let RESV=null; fetch('resolver.json').then(x=>x.json()).then(j=>{RESV=j;}).catch(()=>{RESV={index:{},labels:{}};});
const RALIAS=[
 [/prov\.?\s*st\.?\s*pap\.?,?\s*ben\.?\s*mil/,'PSP_BM'],
 [/d[er]?p?t?\.?\s*st\.?\s*pap\.?,?\s*ben[.,]?\s*mil/,'PSP_BM'],
 [/st\.?\s*pap\.?,?\s*ben\.?\s*mil/,'PSP_BM'],
 [/ben\.?\s*mil/,'PSP_BM'],
 [/st\.?\s*pap\.?,?\s*ben\.?\s*cust/,'DSP_CH'],
 [/de?p?t?\.?\s*st\.?\s*pap\.?,?\s*ben/,'DSP_BEN'],
 [/de?p?t?\.?\s*st\.?\s*pap\.?,?\s*[8s]\.?\s*jos/,'DSP_SJ'],
 [/de?p?t?\.?\s*st\.?\s*pap\.?,?\s*a[nv]g/,'DSP_ANG'],
 [/[8s]t\.?\s*pap\.?,?\s*s[au][ce]/,'SP_SAC'],
 [/[8s]t\.?\s*pap\.?,?\s*mis+[\w.\-<]*\s*(?:and|&|y)\s*colon/,'SP_MC'],
 [/[8s]t\.?\s*pap\.?,?\s*miss?/,'SP_MISS'],
 [/prov\.?\s*st\.?\s*pap\.?,?\s*presid/,'PSP_PRES'],
 [/presid(?:ios)?\.?\s*,?\s*ms/,'PSP_PRES'],
 [/prov\.?\s*st\.?\s*pap/,'PSP'],
 [/prov\.?\s*rec/,'PROV_REC'],
 [/de?p?t?\.?\s*rec/,'DEPT_REC'],
 [/leg\.?\s*rec/,'LEG_REC'],
 [/de?p?t?\.?\s*st\.?\s*pap(?!\s*,)/,'DSP'],
 [/sup\.?\s*gov/,'SUP_GOV']];
function rSeries(c){c=c.toLowerCase();for(const[re,k]of RALIAS){if(re.test(c))return k}return null}
function rRoman(s){s=s.toLowerCase().replace(/1/g,'i').replace(/\|/g,'i');const v={i:1,v:5,x:10,l:50,c:100,d:500,m:1000};let t=0;for(let k=0;k<s.length;k++){const a=v[s[k]];if(a===undefined)return null;const b=v[s[k+1]]||0;t+=(b>a)?-a:a}return t>0?t:null}
function rToRoman(n){const T=[[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];let o='';for(const[v,s]of T){while(n>=v){o+=s;n-=v}}return o}
function rExpand(p1,p2s){let p2=parseInt(p2s,10);if(p2>=p1)return p2;const b=Math.pow(10,p2s.length);let q=Math.floor(p1/b);if(p1%b>=p2)q++;return q*b+p2}
function rRefs(cite){const out=[];const re=/(?:^|[,.;(\s])([IVXLCDMivxlcdm|1]{1,8})(?:[.,]\s*|\s+)(\d[\d\s,–\-]*)/g;let m;
 while((m=re.exec(cite))){const t=rRoman(m[1]);if(!t||t>200)continue;
  const pre=/(\d+)(?:\s*[–\-]\s*(\d+))?/g;let pm;
  while((pm=pre.exec(m[2]))){const p1=parseInt(pm[1],10);if(p1>2000)continue;out.push([t,p1,pm[2]?rExpand(p1,pm[2]):p1]);}}
 return out}
function rLookup(sk,t,p1,p2){const idx=(RESV.index[sk]||{})[String(t)]||[];const out=[];
 for(const iv of idx){if(iv[0]<=p2&&p1<=iv[1])out.push(iv[2]+'|'+iv[3]+'|'+(iv[4]==='s'?'s':'p')+'|'+(iv[1]-iv[0]));}return out}
function rResolve(){const box=el('bres');
 if(!RESV){box.innerHTML='<p class="th">Index still loading&hellip; try again in a second.</p>';return}
 const cite=el('bq').value.trim();if(!cite){box.innerHTML='';return}
 if(/^\s*id[.,\s]/i.test(cite)){box.innerHTML='<p><b><i>Id.</i></b> repeats the footnote before it; paste that last full citation instead.</p>';return}
 const sk=rSeries(cite);
 if(!sk){box.innerHTML='<p><b>Series not recognized.</b> This resolver covers the C-A series (Prov./Dept. State Papers, Provincial/Departmental Records, Legislative Records, State Papers Sacramento/Missions, Superior Govt). Citations to other collections (Vallejo <i>Doc.</i>, dictations, county archives&hellip;) live elsewhere.</p>';return}
 const label=esc(RESV.labels[sk]||sk);
 const refs=rRefs(cite);
 if(!refs.length){box.innerHTML='<p>Recognized <b>'+label+'</b> but couldn&rsquo;t read a tomo &amp; page. Expected form: <i>series, MS., tomo (roman). page(s)</i>; e.g. <i>'+label+', MS., ii. 87-8</i>.</p>';return}
 let hits=new Set();
 for(const[t,p1,p2]of refs)for(const h of rLookup(sk,t,p1,p2))hits.add(h);
 if(!hits.size){const re2=/[Il]([xvcdm][ivxlcdm]*)[.,]\s*(\d+)/g;let m2;
  while((m2=re2.exec(cite))){const t2=rRoman(m2[1]);if(!t2)continue;const p=parseInt(m2[2],10);for(const h of rLookup(sk,t2,p,p))hits.add(h);}}
 if(hits.size){
  // dedupe by record, keep best (primary beats secondary; tighter interval beats wider)
  const best={};
  for(const h of hits){const[v,d,sys,w]=h.split('|');const k=v+'|'+d;
   if(!(k in best)||(best[k].sys==='s'&&sys==='p')||(best[k].sys===sys&&+w<best[k].w))best[k]={v,d,sys,w:+w};}
  const rs=Object.values(best).map(o=>{const r=DATA.find(r=>String(r.ca_volume)===o.v&&String(r.doc_id).replace(/^d/,'')===o.d);return r?{r,sys:o.sys,w:o.w}:null}).filter(Boolean);
  // rank: page fit, with a 1-page bonus for leaf-system matches (where indexed,
  // the leaf numbering IS the system Bancroft cites) and dated records before
  // undated on ties (found 2026-07-13: an undated gap-read outranked the
  // leaf-verified dated answer on the ix.122-3 trigger case).
  const _ew=x=>x.w-(x.sys==='s'?1:0), _und=x=>(!x.r.year||x.r.year==='null')?1:0;
  rs.sort((a,b)=>(_ew(a)-_ew(b))||(_und(a)-_und(b))||(a.sys<b.sys?1:a.sys>b.sys?-1:0)||(parseInt(a.r.ca_volume)-parseInt(b.r.ca_volume)));
  const volsHit=[...new Set(rs.map(x=>String(x.r.ca_volume)))];
  const cav=(RESV.caveats||{});
  box.innerHTML='<p><b>'+rs.length+(rs.length>1?' candidate records':' record')+'</b> for <i>'+esc(cite)+'</i>'+(rs.length>1?' <span class="th">(several abstracts touch the cited page; ranked by page fit; check the date against the footnote)</span>':'')+':</p>'
   +volsHit.filter(v=>cav[v]).map(v=>'<div class="citebox" style="border-color:#b5651d"><b style="color:#b5651d">&#9888; C-A '+v+' page systems:</b> '+esc(cav[v])+'</div>').join('')
   +rs.map((x,i)=>{const r=x.r;
     const approx=/gap-read/.test(r.doc_type||'')||r.date_confidence==='inferred';
     const dt=esc(r.date_text&&r.date_text!==r.summary?r.date_text:(r.year&&r.year!=='null'?r.year:'date not read'));
     return '<div class="citebox" style="cursor:pointer" data-bi="'+i+'"><b>C-A '+r.ca_volume+' &middot; doc '+esc(String(r.doc_id))+'</b> &middot; <b style="color:#2a6">'+dt+'</b> &middot; orig. pp. '+esc(r.orig_page||'; ')
      +(x.sys==='s'?' &middot; <span style="color:#b5651d" title="Matched on the copy\'s leaf/Savage numbering; the system Bancroft cites for this volume; rather than the recorded original pages.">&asymp; leaf-number match</span>':'')
      +(approx?' &middot; <span style="color:#b5651d" title="Rapid survey record: pages and dates are approximate; verify at the leaf.">&#9888; gap-read (approximate)</span>':'')
      +'<br>'+esc((r.summary||'').slice(0,180))+'&hellip;<br><span class="th">click for the full record + manuscript image</span></div>'}).join('');
  box.querySelectorAll('[data-bi]').forEach(dv=>dv.onclick=()=>openDetail(rs[+dv.dataset.bi].r));
 } else {
  const have=Object.keys(RESV.index[sk]||{}).map(Number).sort((a,b)=>a-b);
  const want=[...new Set(refs.map(r=>r[0]))];
  let why;
  if(!have.length) why='<b>'+label+'</b> is recognized but not yet in the catalog; its volumes are still being read. This footnote will resolve when they publish.';
  else if(!want.some(w=>have.includes(w))) why='Tomo <b>'+want.map(rToRoman).join(', ')+'</b> of <b>'+label+'</b> is not yet cataloged. Cataloged tomos: '+have.map(rToRoman).join(', ')+'.';
  else why='The tomo is cataloged, but the cited page falls in a stretch not yet cataloged (or the record lacks an original-page value). Try the catalog search by content.';
  box.innerHTML='<p>'+why+'</p>';
 }}
el('bgo').onclick=rResolve;
el('bq').addEventListener('keydown',e=>{if(e.key==='Enter')rResolve();});

/* TAG CHIPS ARE CLICKABLE. A tag in the Tags tab, or a theme chip on a result row,
   puts itself into the search box as a fielded term and runs the search. Tags with a
   space are quoted, which is why the fielded-term regex above accepts quoted values. */
function searchTag(tag){
 tag=String(tag||'').trim();
 if(!tag||tag==='; ')return;
 el('q').value='tag:'+(/\s/.test(tag)?'"'+tag+'"':tag);
 ['fv','fs','fg','fd','fb'].forEach(id=>{if(el(id))el(id).value='';});
 showTab('cat');
 apply();
 el('q').focus();
}
document.addEventListener('click',function(e){
 const c=e.target.closest&&e.target.closest('.chip');
 if(c){e.preventDefault();searchTag(c.textContent);}
});
document.addEventListener('keydown',function(e){
 if(e.key!=='Enter'&&e.key!==' ')return;
 const c=e.target.closest&&e.target.closest('.chip');
 if(c){e.preventDefault();searchTag(c.textContent);}
});
/* Make them reachable by keyboard. The tag table is static, so arming it once is
   enough; result-row chips are armed after each render. */
function armChips(root){
 (root||document).querySelectorAll('.chip:not([role])').forEach(c=>{
  if(c.textContent.trim()==='; ')return;
  c.setAttribute('role','button');
  c.setAttribute('tabindex','0');
  c.title='Search for the tag "'+c.textContent.trim()+'"';
 });
}
armChips();
/* Chips are created by several render paths (the result table, the opened record,
   the people register). Rather than hook each one, watch for new nodes and arm what
   turns up. armChips only selects chips that are not already armed, so this is cheap. */
(function(){
 let t=null;
 new MutationObserver(()=>{clearTimeout(t);t=setTimeout(()=>armChips(document),60);})
  .observe(document.body,{childList:true,subtree:true});
})();

loadHash();
apply();
openFromHash();
