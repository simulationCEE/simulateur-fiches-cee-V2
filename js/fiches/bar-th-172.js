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
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Coup de Pouce ×5 <span class="hint">(remplacement chaudière fossile)</span></label>
        <select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field">
        <label>PAC sur liste agréée <span class="hint">obligatoire depuis le 01/09/2026 pour le ×5</span></label>
        <select id="f-agree"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="warn-box" id="warnAgree172"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-172 vA82-5 à compter du 01-09-2026 (barème inchangé depuis vA78.4) · Non cumulable avec BAR-TH-101/124/143/148/168 · CdP ×5 conditionné à l'agrément PAC (décret n°2026-413, arrêté du 02/07/2026) depuis le 01/09/2026</div>
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
    const mult = (cdp && agree) ? 5 : 1;
    const kwhcBonifie = kwhc*mult;
    return {kwh: kwhcBonifie, kwhBrut: kwhc, primeC: kwhcBonifie/1000*pc, primeP: kwhcBonifie/1000*pp, cdp, agree, mult, forfait};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, kwhBrut, primeC, primeP, cdp, agree, mult} = calcCore172(surf);

    const warn = document.getElementById('warnAgree172');
    if(cdp && !agree){
      warn.innerHTML = `⚠ <b>Coup de Pouce non applicable :</b> depuis le 01/09/2026, la bonification ×5 sur BAR-TH-172 exige que le modèle de PAC figure sur la liste des PAC agréées "qualité et résilience industrielle" (bonus-pac.ademe.fr). Sans agrément, seul le forfait de base s'applique.`;
      warn.classList.add('show');
    } else {
      warn.classList.remove('show');
    }

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac ${mult>1?`(bonifié ×${mult}, brut ${kwh(kwhBrut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${mult>1?'cdp':'hi'}"><span class="result-label">Prime Classique</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(primeP)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCore172(val); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:1000, hasPrec:true,
        calc: (val) => { const r = calcCore172(val); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme172(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curSurf=parseFloat(document.getElementById('f-surf').value)||0;
  const curEtas=parseFloat(document.getElementById('f-etas').value)||0;
  const curBandKey = curEtas>=170?'170+':'111-170';
  const curSurfFacteur = surfFacteur172(curSurf);

  let html = `<table class="bareme"><thead><tr>
    <th>Etas</th><th>Zone</th><th>Surface</th>
    <th>kWh cumac</th>
    <th>Classique</th><th>Précarité</th>
    <th>CdP ×5 Classique</th><th>CdP ×5 Précarité</th>
  </tr></thead><tbody>`;
  const bandLabels = {'111-170':'111% ≤ Etas < 170%','170+':'170% ≤ Etas'};
  const surfRows = [['S < 70 m²',0.5], ['70 ≤ S < 90 m²',0.7], ['S ≥ 90 m²',1]];
  Object.keys(REF172).forEach(bk=>{
    ['H1','H2','H3'].forEach((zone,zi)=>{
      surfRows.forEach(([label,facteur],si)=>{
        const kwhc = REF172[bk]*facteur*ZONE172[zone];
        const isCur = bk===curBandKey && zone===curZone && facteur===curSurfFacteur;
        html += `<tr class="${isCur?'hl':''}">`;
        if(zi===0 && si===0) html += `<td rowspan="9" style="text-align:left;font-weight:700;font-size:11px">${bandLabels[bk]}</td>`;
        if(si===0) html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="3">${zone}</td>`;
        html += `<td>${label}</td>`;
        html += `<td>${num(kwhc)}</td>`;
        html += `<td class="num-c">${eur(kwhc/1000*pc)}</td>`;
        html += `<td class="num-p">${eur(kwhc/1000*pp)}</td>`;
        html += `<td class="num-cdp">${eur(kwhc*5/1000*pc)}</td>`;
        html += `<td class="num-cdp">${eur(kwhc*5/1000*pp)}</td>`;
        html += `</tr>`;
      });
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
