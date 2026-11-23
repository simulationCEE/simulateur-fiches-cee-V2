// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-125 (Ventilation double flux autoréglable ou modulée à haute performance)
// Source : fiche BAR-TH-125 vA54-5 à compter du 01-01-2024 (opérations engagées jusqu'au 30/06/2028) · Durée de vie 17 ans
// Installation collective : kWh cumac = forfait par logement (zone) × nombre de logements
// Installation individuelle : kWh cumac = forfait (zone) × facteur surface habitable
// Prix : individuelle → selon le profil du ménage ; collective → part des logements au prix précarité
//        (très modestes + modestes à partir du 16/11/2026)
// ═══════════════════════════════════════════════════════════════════════
const VENT125_COL = { H1: 23000, H2: 18800, H3: 12500 };              // autoréglable, par logement
const VENT125_IND = {                                                    // individuelle
  auto:   { H1: 39700, H2: 32500, H3: 21600 },
  module: { H1: 42000, H2: 34400, H3: 22900 },
};
// Facteur correctif selon la surface habitable (installation individuelle)
function surfFactor125(s){
  if(s < 35) return 0.3;
  if(s < 60) return 0.5;
  if(s < 70) return 0.6;
  if(s < 90) return 0.7;
  if(s < 110) return 1;
  if(s <= 130) return 1.1;
  return 1.6;
}

function renderTH125(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Bâtiment résidentiel existant en France métropolitaine · Professionnel RGE (travaux de ventilation) · <b>Individuelle</b> : centrale autoréglable ou à modulation hygroréglable, classe énergétique A ou supérieure, rapport de température ≥ 85 % (NF EN 13141-7, certifié — NF 205 réputée conforme), puissance absorbée pondérée ≤ 47,6 WThC (T4, 1 SdB + 1 WC) ; avis technique CCFAT si modulée · <b>Collective</b> : centrale collective autoréglable uniquement, échangeur collectif ≥ 75 % (NF EN 308, certifié — Eurovent AAHE/AARE réputé conforme) · Engagement jusqu'au 30/06/2028</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Type d'installation</label><select id="f-inst-v"><option value="ind">Individuelle (un seul logement desservi)</option><option value="col">Collective (plusieurs logements desservis)</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Système</label><select id="f-sys125"><option value="auto">Double flux autoréglable</option><option value="module">Double flux modulé (bouches d'extraction hygroréglables) — individuelle uniquement</option></select></div>
      <div class="field"></div>
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
    <div class="source-note">Source : BAR-TH-125 vA54-5 à compter du 01-01-2024 (opérations engagées jusqu'au 30/06/2028) · Durée de vie 17 ans · Collective : forfait par logement × nombre de logements · Individuelle : forfait × facteur surface habitable</div>
  `);
  const baremeWrap = bareme(body, buildBareme125);
  const isCol = () => document.getElementById('f-inst-v').value === 'col';

  // Prix moyen : individuelle = profil du ménage ; collective = part des logements en précarité
  function prixMoyen(){
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    if(!isCol()){ const hh = hhCtx('BAR-TH-125', pc, pp); return {prix: hh.price, hh, share: null}; }
    const nRef = parseFloat(document.getElementById('f-n').value)||0;
    const share = hhShare(parseFloat(document.getElementById('f-ntm').value)||0, parseFloat(document.getElementById('f-nm').value)||0, nRef);
    return {prix: pp*share + pc*(1-share), hh: null, share};
  }
  // q = nombre de logements (collective) ou surface habitable (individuelle)
  function calcCoreV(q){
    const zone=document.getElementById('f-zone').value;
    const sys = sys125();
    const p = prixMoyen();
    let kwhc;
    if(isCol()) kwhc = VENT125_COL[zone] * Math.max(0,q) * (sys.R ?? 0);
    else kwhc = VENT125_IND[document.getElementById('f-sys125').value][zone] * surfFactor125(Math.max(0,q)) * (sys.R ?? 0);
    return {kwh:kwhc, prime:kwhc/1000*p.prix, p, sys};
  }
  function sys125(){
    const s = document.getElementById('f-sys125').value;
    const pbs = [];
    if(isCol() && s === 'module') pbs.push('en installation collective, seule la ventilation double flux autoréglable est éligible');
    return { sys: s, R: 1, pbs };
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const col = isCol();
    document.getElementById('blkInd').style.display = col ? 'none' : '';
    document.getElementById('blkCol').style.display = col ? '' : 'none';
    
    if(col){ hhSyncTotal('f-n','f-ntm','f-nm','f-na'); hhMixRefresh(); } else hhUpdateNote('BAR-TH-125');
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
      ? `${num(VENT125_COL[zone])} kWhc × ${num(q)} logement${q>1?'s':''}`
      : `${num(VENT125_IND[document.getElementById('f-sys125').value][zone])} kWhc × facteur surface ${String(surfFactor125(q)).replace('.',',')}`;
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

function buildBareme125(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>Collective<br>kWhc / logement</th><th>Collective / logement<br>classique · précarité</th><th>Individuelle<br>kWhc (facteur 1)</th><th>Individuelle (90–110 m²)<br>classique · précarité</th></tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const c=VENT125_COL[zone], i=VENT125_IND[document.getElementById('f-sys125').value][zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(c)}</td><td><span class="num-c">${eur(c/1000*pc)}</span> · <span class="num-p">${eur(c/1000*pp)}</span></td><td>${num(i)}</td><td><span class="num-c">${eur(i/1000*pc)}</span> · <span class="num-p">${eur(i/1000*pp)}</span></td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Collective : double flux autoréglable uniquement. Individuelle : valeurs de la ventilation ${document.getElementById('f-sys125').value==='module'?'modulée':'autoréglable'} (sélection en cours). Facteur surface habitable (individuelle) : &lt; 35 m² 0,3 · 35–60 m² 0,5 · 60–70 m² 0,6 · 70–90 m² 0,7 · 90–110 m² 1 · 110–130 m² 1,1 · &gt; 130 m² 1,6.</div>`;
  wrap.innerHTML = html;
}
