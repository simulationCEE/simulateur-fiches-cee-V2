// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-127 (Ventilation mécanique simple flux hygroréglable)
// Source : fiche BAR-TH-127 vA58-6 à compter du 01-01-2024 (opérations engagées jusqu'au 30/06/2028) · Durée de vie 17 ans
// Installation collective : kWh cumac = forfait par logement (zone) × nombre de logements × R
// Installation individuelle : kWh cumac = forfait (zone) × facteur surface habitable × R
// Prix : individuelle → selon le profil du ménage ; collective → part des logements au prix précarité
//        (très modestes + modestes à partir du 16/11/2026)
// ═══════════════════════════════════════════════════════════════════════
const VENT127_COL = { H1: 21800, H2: 17800, H3: 11900 };   // par logement
const VENT127_IND = { H1: 31600, H2: 25900, H3: 17200 };
// Facteur correctif R : [installation][type][caisson] — null = non applicable
const R127 = {
  col: { A: { bc: 0.96, std: 0.91, bp: 0.76 }, B: { bc: 1, std: 0.95, bp: 0.78 } },
  ind: { A: { bc: 0.9,  std: null, bp: null }, B: { bc: 1, std: null, bp: null } },
};
// Facteur correctif selon la surface habitable (installation individuelle)
function surfFactor127(s){
  if(s < 35) return 0.3;
  if(s < 60) return 0.5;
  if(s < 70) return 0.6;
  if(s < 90) return 0.7;
  if(s < 110) return 1;
  if(s <= 130) return 1.1;
  return 1.6;
}

function renderTH127(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Bâtiment résidentiel existant en France métropolitaine · Professionnel RGE (travaux de ventilation) · Avis technique CCFAT en cours de validité à l'engagement · Type A : bouches d'extraction hygroréglables · Type B : bouches et entrées d'air hygroréglables · <b>Individuelle</b> : VMC simple flux hygroréglable uniquement, caisson classe B ou supérieure et basse consommation (≤ 15 WThC en T4, 1 SdB + 1 WC) · <b>Collective</b> : VMC (≤ 0,25 WThC/(m³/h) ; basse consommation si ≤ 0,10 et courbe aéraulique montante) ou VMBP (≤ 0,12 WThC/(m³/h)) · Engagement jusqu'au 30/06/2028</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Type d'installation</label><select id="f-inst-v"><option value="ind">Individuelle (un seul logement desservi)</option><option value="col">Collective (plusieurs logements desservis)</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Type de ventilation hygroréglable</label><select id="f-type127"><option value="B">Type B (extraction et entrées d'air hygroréglables)</option><option value="A">Type A (extraction hygroréglable seule)</option></select></div>
      <div class="field"><label>Caisson de ventilation</label><select id="f-caisson127"><option value="bc">VMC — caisson basse consommation</option><option value="std">VMC — caisson standard (collective uniquement)</option><option value="bp">VMBP — basse pression (collective uniquement)</option></select></div>
    </div>
    <div id="blkInd">
      <div class="field-row">
        <div class="field"><label>Surface habitable <span class="hint">m²</span></label><input type="number" id="f-surf" value="100" min="0"></div>
        ${hhFieldHtml()}
      </div>
    </div>
    <div id="blkCol" style="display:none">
      <div class="field-row">
        <div class="field"><label>Nombre de logements <span class="hint">somme des 3 catégories</span></label><input type="number" id="f-n" value="20" readonly tabindex="-1" style="${HH_READONLY_STYLE}"></div>
        <div class="field"></div>
      </div>
      <div class="field-row">
        <div class="field"><label>Ménages très modestes (précarité énergétique) <span class="hint">nombre de logements · repère Anah : bleu</span></label><input type="number" id="f-ntm" value="0" min="0"></div>
        <div class="field"><label>Ménages modestes (précarité énergétique, hors très modestes) <span class="hint">nombre de logements · repère Anah : jaune</span></label><input type="number" id="f-nm" value="0" min="0"></div>
      </div>
      <div class="field-row">
        ${hhOthersFieldHtml(20)}
        <div class="field"></div>
      </div>
    </div>
    <div class="hh-note" id="hhNote"></div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box" id="warnElig-v"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-127 vA58-6 à compter du 01-01-2024 (opérations engagées jusqu'au 30/06/2028) · Durée de vie 17 ans · Collective : forfait par logement × nombre de logements × R · Individuelle : forfait × facteur surface habitable × R</div>
  `);
  const baremeWrap = bareme(body, buildBareme127);
  const isCol = () => document.getElementById('f-inst-v').value === 'col';

  // Prix moyen : individuelle = profil du ménage ; collective = part des logements en précarité
  function prixMoyen(){
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    if(!isCol()){ const hh = hhCtx('BAR-TH-127', pc, pp); return {prix: hh.price, hh, share: null}; }
    const nRef = parseFloat(document.getElementById('f-n').value)||0;
    const share = hhShare(parseFloat(document.getElementById('f-ntm').value)||0, parseFloat(document.getElementById('f-nm').value)||0, nRef);
    return {prix: pp*share + pc*(1-share), hh: null, share};
  }
  // q = nombre de logements (collective) ou surface habitable (individuelle)
  function calcCoreV(q){
    const zone=document.getElementById('f-zone').value;
    const sys = sys127();
    const p = prixMoyen();
    let kwhc;
    if(isCol()) kwhc = VENT127_COL[zone] * Math.max(0,q) * (sys.R ?? 0);
    else kwhc = VENT127_IND[zone] * surfFactor127(Math.max(0,q)) * (sys.R ?? 0);
    return {kwh:kwhc, prime:kwhc/1000*p.prix, p, sys};
  }
  function sys127(){
    const inst = isCol() ? 'col' : 'ind';
    const t = document.getElementById('f-type127').value;
    const c = document.getElementById('f-caisson127').value;
    const R = R127[inst][t][c];
    const pbs = [];
    if(R == null) pbs.push(c === 'bp' ? 'la VMBP n\'est éligible qu\'en installation collective' : 'en installation individuelle, le caisson doit être basse consommation');
    return { R, pbs };
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const col = isCol();
    document.getElementById('blkInd').style.display = col ? 'none' : '';
    document.getElementById('blkCol').style.display = col ? '' : 'none';
    
    if(col){ hhSyncTotal('f-n','f-ntm','f-nm','f-na'); hhMixRefresh(); } else hhUpdateNote('BAR-TH-127');
    const q = col ? (parseFloat(document.getElementById('f-n').value)||0) : (parseFloat(document.getElementById('f-surf').value)||0);
    const r = calcCoreV(q);
    const pbs = r.sys.pbs.slice();
    const ineligible = pbs.length>0 || r.sys.R == null;
    const warn=document.getElementById('warnElig-v');
    if(ineligible){ warn.innerHTML=`⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');
    const k=ineligible?0:r.kwh, pr=ineligible?0:r.prime;
    const zone=document.getElementById('f-zone').value;
    const detail = col
      ? `${num(VENT127_COL[zone])} kWhc × ${num(q)} logement${q>1?'s':''} × R ${String(r.sys.R ?? '—').replace('.',',')}`
      : `${num(VENT127_IND[zone])} kWhc × facteur surface ${String(surfFactor127(q)).replace('.',',')} × R ${String(r.sys.R ?? '—').replace('.',',')}`;
    const primeRow = col
      ? `<div class="result-row ${r.p.share>0?'hi prec':'hi'}"><span class="result-label">Prime — ${(r.p.share*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} % des logements au prix précarité</span><span class="result-val">${eur(pr)}</span></div>
         <div class="result-row"><span class="result-label">Prime / logement</span><span class="result-val" style="font-size:14px">${q>0?eur(pr/q):'—'}</span></div>`
      : `<div class="result-row ${hhRowClass(r.p.hh, false)}"><span class="result-label">${hhPrimeLabel(r.p.hh)}</span><span class="result-val">${eur(pr)}</span></div>`;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">${detail}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible?' (non éligible)':''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      ${primeRow}
    `;
    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'', paramLabel:'Logements (collective) / surface (individuelle)', defaultStep:5, defaultRep:2,
        getBase: () => isCol() ? (parseFloat(document.getElementById('f-n').value)||0) : (parseFloat(document.getElementById('f-surf').value)||0),
        minValid: 1,
        calc: (val) => { const r = calcCoreV(isCol() ? Math.round(val) : val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
  hhWatch(body, calc);
}

function buildBareme127(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>Collective<br>kWhc / logement</th><th>Collective / logement<br>classique · précarité</th><th>Individuelle<br>kWhc (facteur 1)</th><th>Individuelle (90–110 m²)<br>classique · précarité</th></tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const c=VENT127_COL[zone], i=VENT127_IND[zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(c)}</td><td><span class="num-c">${eur(c/1000*pc)}</span> · <span class="num-p">${eur(c/1000*pp)}</span></td><td>${num(i)}</td><td><span class="num-c">${eur(i/1000*pc)}</span> · <span class="num-p">${eur(i/1000*pp)}</span></td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Facteur R (collective) : type A 0,96 / 0,91 / 0,76 · type B 1 / 0,95 / 0,78 (basse consommation / standard / basse pression) · Individuelle : type A 0,9 · type B 1 (caisson basse consommation uniquement). Montants ci-dessus avec R = 1. Facteur surface habitable (individuelle) : &lt; 35 m² 0,3 · 35–60 m² 0,5 · 60–70 m² 0,6 · 70–90 m² 0,7 · 90–110 m² 1 · 110–130 m² 1,1 · &gt; 130 m² 1,6.</div>`;
  wrap.innerHTML = html;
}
