// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-172 (PAC eau/eau ou eau glycolée/eau, individuelle)
// Source : vA78.4 (01-01-2026), barème repris à l'identique par vA82-5 (01-09-2026)
// ═══════════════════════════════════════════════════════════════════════
const REF172 = {
  '111-170': 101400,
  '170+': 119400,
};
const SURF172 = [ [70, 0.5], [90, 0.7], [Infinity, 1] ]; // [seuil max exclu, facteur] — S<70:0.5, 70≤S<90:0.7, 90≤S:1
const ZONE172 = { H1: 1.2, H2: 1, H3: 0.7 };

function surfFacteur172(s){
  if(s < 70) return 0.5;
  if(s < 90) return 0.7;
  return 1;
}

function renderTH172(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Etas ≥ 111% (MT/HT) ou ≥ 126% (BT) · Régulateur classe IV-VIII obligatoire · Note de dimensionnement · Maison individuelle uniquement</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Surface chauffée <span class="hint">m²</span></label><input type="number" id="f-surf" value="100"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Etas de la PAC (%)</label><input type="number" id="f-etas" value="150"></div>
      <div class="field"></div>
    </div>
    <div class="field-row">
      ${hhFieldHtml()}
      <div class="field"></div>
    </div>
    ${hhNoteHtml()}
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Coup de Pouce <span class="hint">(remplacement chaudière fossile ; ×5 / ×3 selon le ménage)</span></label>
        <select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field">
        <label>PAC sur liste agréée <span class="hint">obligatoire pour le Coup de Pouce ; n° d'agrément sur la preuve de réalisation</span></label>
        <select id="f-agree"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="warn-box" id="warnAgree172"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-172 vA82-5 à compter du 01-09-2026 (barème inchangé depuis vA78.4) · Non cumulable avec BAR-TH-101/124/143/148/168 · CdP conditionné à l'agrément PAC (décret n°2026-413, arrêté du 02/07/2026) depuis le 01/09/2026</div>
  `);
  const baremeWrap = bareme(body, buildBareme172);

  function calcCore172(surf){
    const zone=document.getElementById('f-zone').value;
    const etas=parseFloat(document.getElementById('f-etas').value)||0;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const cdp=document.getElementById('f-cdp').value==='oui';
    const agree=document.getElementById('f-agree').value==='oui';
    const forfait = etas>=170 ? REF172['170+'] : REF172['111-170'];
    const kwhc = forfait * surfFacteur172(surf) * ZONE172[zone];
    const hh = hhCtx('BAR-TH-172', pc, pp);
    const mult = (cdp && agree) ? hh.coef : 1;
    const kwhcBonifie = kwhc*mult;
    return {kwh: kwhcBonifie, kwhBrut: kwhc, prime: kwhcBonifie/1000*hh.price, hh, cdp, agree, mult, forfait};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, kwhBrut, prime, hh, cdp, agree, mult} = calcCore172(surf);
    hhUpdateNote('BAR-TH-172');

    const warn = document.getElementById('warnAgree172');
    if(cdp && !agree){
      warn.innerHTML = `⚠ <b>Coup de Pouce non applicable :</b> depuis le 01/09/2026, la bonification Coup de Pouce sur BAR-TH-172 exige que le modèle de PAC figure sur la liste des PAC agréées "qualité et résilience industrielle" (bonus-pac.ademe.fr). Sans agrément, seul le forfait de base s'applique.`;
      warn.classList.add('show');
    } else {
      warn.classList.remove('show');
    }

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac ${mult>1?`(bonifié ×${mult}, brut ${kwh(kwhBrut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${hhRowClass(hh, mult>1)}"><span class="result-label">${hhPrimeLabel(hh)}</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCore172(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:1000,
        calc: (val) => { const r = calcCore172(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
  hhWatch(body, calc);
}

function buildBareme172(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const hh = hhCtx('BAR-TH-172', pc, pp);
  const curZone=document.getElementById('f-zone').value;
  const curSurf=parseFloat(document.getElementById('f-surf').value)||0;
  const curEtas=parseFloat(document.getElementById('f-etas').value)||0;
  const curBandKey = curEtas>=170?'170+':'111-170';
  const curSurfFacteur = surfFacteur172(curSurf);

  let html = `<table class="bareme"><thead><tr>
    <th>Etas</th><th>Zone</th><th>Surface</th>
    <th>kWh cumac</th>
    <th>Prime sans bonification</th><th>Prime avec Coup de Pouce ×${hh.coef}</th>
  </tr></thead><tbody>`;
  const bandLabels = {'111-170':'111% ≤ Etas < 170%','170+':'170% ≤ Etas'};
  const surfRows = [['S < 70 m²',0.5], ['70 ≤ S < 90 m²',0.7], ['S ≥ 90 m²',1]];
  Object.keys(REF172).forEach(bk=>{
    ['H1','H2','H3'].forEach((zone,zi)=>{
      surfRows.forEach(([label,facteur],si)=>{
        const kwhc = REF172[bk]*facteur*ZONE172[zone];
        const isCur = bk===curBandKey && zone===curZone && facteur===curSurfFacteur;
        const isGrpEnd = si===surfRows.length-1;
        html += `<tr class="${isCur?'hl':''} ${isGrpEnd?'grp-end':''}">`;
        if(zi===0 && si===0) html += `<td rowspan="9" style="text-align:left;font-weight:700;font-size:11px">${bandLabels[bk]}</td>`;
        if(si===0) html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="3">${zone}</td>`;
        html += `<td>${label}</td>`;
        html += `<td>${num(kwhc)}</td>`;
        html += `<td class="${hh.kind==='prec'?'num-p':'num-c'}">${eur(kwhc/1000*hh.price)}</td>`;
        html += `<td class="num-cdp">${eur(kwhc*hh.coef/1000*hh.price)}</td>`;
        html += `</tr>`;
      });
    });
  });
  html += `</tbody></table><div class="source-note">Montants pour le profil sélectionné : ${HH_LABELS[hh.profil]} (${hh.priceLabel}).</div>`;
  wrap.innerHTML = html;
}
