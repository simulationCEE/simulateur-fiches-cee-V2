// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-129 (PAC air/air) — PAS de Coup de Pouce (exclue du périmètre)
// Source : vA27-3 à compter du 01-04-2018 (dernière version officielle, vérifiée)
// ═══════════════════════════════════════════════════════════════════════
const REF129_APPT = {
  H1: 21300, H2: 17400, H3: 11600, // 3,9 ≤ SCOP (bande unique pour appartement)
};
const SURF129_APPT = [ [35,0.5], [60,0.7], [70,1], [90,1.2], [110,1.5], [130,1.9], [Infinity,2.5] ];

const REF129_MAISON = {
  '3.9-4.3': { H1: 77900, H2: 63700, H3: 42500 },
  '4.3+':    { H1: 80200, H2: 65600, H3: 43700 },
};
const SURF129_MAISON = [ [35,0.3], [60,0.5], [70,0.6], [90,0.7], [110,1], [130,1.1], [Infinity,1.6] ];

function surfFacteur129(surf, table){
  for(const [seuil, facteur] of table){
    if(surf < seuil) return facteur;
  }
  return table[table.length-1][1];
}

function renderTH129(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Puissance nominale ≤ 12 kW · SCOP ≥ 3,9 · Hors Coup de Pouce Chauffage et hors MaPrimeRénov'</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Type de logement</label>
        <select id="f-type"><option value="maison">Maison individuelle</option><option value="appt">Appartement</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface chauffée par la PAC <span class="hint">m²</span></label><input type="number" id="f-surf" value="70"></div>
      <div class="field"><label>SCOP</label><input type="number" id="f-scop" value="4" step="0.1"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box show">ℹ️ BAR-TH-129 n'est éligible ni au Coup de Pouce Chauffage, ni à MaPrimeRénov' — uniquement à la prime CEE de base ci-dessous.</div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-129 vA27-3 à compter du 01-04-2018 · Durée de vie 17 ans</div>
  `);
  const baremeWrap = bareme(body, buildBareme129);

  function calcCore129(surf){
    const zone=document.getElementById('f-zone').value;
    const type=document.getElementById('f-type').value;
    const scop=parseFloat(document.getElementById('f-scop').value)||0;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;

    let montantUnitaire, facteur;
    if(type==='appt'){
      montantUnitaire = REF129_APPT[zone];
      facteur = surfFacteur129(surf, SURF129_APPT);
    } else {
      const band = scop>=4.3 ? '4.3+' : '3.9-4.3';
      montantUnitaire = REF129_MAISON[band][zone];
      facteur = surfFacteur129(surf, SURF129_MAISON);
    }
    const kwhc = montantUnitaire * facteur;
    return {kwh: kwhc, primeC: kwhc/1000*pc, primeP: kwhc/1000*pp, montantUnitaire, facteur};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, primeC, primeP} = calcCore129(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(primeP)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCore129(val); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500, hasPrec:true,
        calc: (val) => { const r = calcCore129(val); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme129(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curType=document.getElementById('f-type').value;
  const curZone=document.getElementById('f-zone').value;

  let html = `<table class="bareme"><thead><tr><th>Type</th><th>SCOP</th><th>Zone</th><th>Montant unitaire</th><th>Classique (facteur 1)</th><th>Précarité (facteur 1)</th></tr></thead><tbody>`;

  html += `<tr><td rowspan="3" style="text-align:left;font-weight:700">Appartement</td><td rowspan="3">3,9 ≤ SCOP</td>`;
  ['H1','H2','H3'].forEach((zone,i)=>{
    if(i>0) html += `<tr>`;
    const v = REF129_APPT[zone];
    const isCur = curType==='appt' && zone===curZone;
    html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td><td class="num-c">${eur(v/1000*pc)}</td><td class="num-p">${eur(v/1000*pp)}</td></tr>`;
  });

  ['3.9-4.3','4.3+'].forEach((band,bi)=>{
    html += `<tr><td rowspan="3" style="text-align:left;font-weight:700">${bi===0?'Maison':''}</td><td rowspan="3">${band==='4.3+'?'4,3 ≤ SCOP':'3,9 ≤ SCOP < 4,3'}</td>`;
    ['H1','H2','H3'].forEach((zone,i)=>{
      if(i>0) html += `<tr>`;
      const v = REF129_MAISON[band][zone];
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td><td class="num-c">${eur(v/1000*pc)}</td><td class="num-p">${eur(v/1000*pp)}</td></tr>`;
    });
  });

  html += `</tbody></table>
  <div style="padding:10px 12px;font-size:10.5px;color:var(--text-3)">Montants ci-dessus au facteur correctif de surface = 1. Voir grille de facteurs : Appartement 0,5/0,7/1/1,2/1,5/1,9/2,5 (S&lt;35 → &gt;130) · Maison 0,3/0,5/0,6/0,7/1/1,1/1,6 (S&lt;35 → &gt;130).</div>`;
  wrap.innerHTML = html;
}
