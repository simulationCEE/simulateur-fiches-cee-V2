// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-EN-112 (Revêtements réflectifs en toiture — cool roof)
// Source : fiche BAT-EN-112 vA38-1 à compter du 31-07-2021 · Durée de vie 20 ans
// kWh cumac = forfait par m² (zone) × surface de toiture couverte
// Bâtiment tertiaire à usage commercial · Non cumulable avec BAT-EN-109
// ═══════════════════════════════════════════════════════════════════════
const REF_EN112 = { H1: 160, H2: 170, H3: 270 };

function renderBATEN112(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Bâtiment tertiaire à <b>usage commercial</b> · Chaud et froid produits par une <b>pompe à chaleur</b> · Toiture sans revêtement réflectif avant l'opération · Revêtement posé au droit d'un volume fermé et climatisé · Pose par un professionnel · SRI &gt; 100 à l'état neuf et &gt; 90 à l'état vieilli (ASTM E1980-11) · Attestation du fabricant pour le lot (marque, référence, n° de lot, SRI), présentée au bénéficiaire avant l'engagement · Pas de précarité en tertiaire · Non cumulable avec BAT-EN-109</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Surface de toiture couverte <span class="hint">m² — au droit d'un volume fermé et climatisé</span></label><input type="number" id="f-surf" value="1000" min="0"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>SRI à l'état neuf <span class="hint">doit être &gt; 100</span></label><input type="number" id="f-sri-n" value="" step="1" placeholder="ex : 105"></div>
      <div class="field"><label>SRI à l'état vieilli <span class="hint">doit être &gt; 90</span></label><input type="number" id="f-sri-v" value="" step="1" placeholder="ex : 95"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Chaud et froid produits par une pompe à chaleur</label><select id="f-pac112"><option value="oui">Oui</option><option value="non">Non</option></select></div>
      <div class="field"><label>Toiture déjà équipée d'un revêtement réflectif</label><select id="f-deja112"><option value="non">Non</option><option value="oui">Oui</option></select></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig112"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-EN-112 vA38-1 à compter du 31-07-2021 · Tertiaire à usage commercial · Durée de vie 20 ans · Montant = forfait par m² (H1 160 · H2 170 · H3 270 kWhc) × surface de toiture couverte</div>
  `);
  const baremeWrap = bareme(body, buildBaremeEN112);

  function calcCoreEN112(surf){
    const zone=document.getElementById('f-zone').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const kwhc = REF_EN112[zone]*Math.max(0, surf);
    return {kwh: kwhc, prime: kwhc/1000*pc};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const sriN=document.getElementById('f-sri-n').value, sriV=document.getElementById('f-sri-v').value;
    const pbs = [];
    if(document.getElementById('f-pac112').value==='non') pbs.push('le chaud et le froid doivent être produits par une pompe à chaleur');
    if(document.getElementById('f-deja112').value==='oui') pbs.push('la toiture ne doit pas déjà avoir de revêtement réflectif');
    if(sriN!=='' && parseFloat(sriN) <= 100) pbs.push(`SRI à l'état neuf ${sriN} : doit être supérieur à 100`);
    if(sriV!=='' && parseFloat(sriV) <= 90) pbs.push(`SRI à l'état vieilli ${sriV} : doit être supérieur à 90`);
    const ineligible = pbs.length > 0;
    const warn = document.getElementById('warnElig112');
    if(ineligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const r = calcCoreEN112(surf);
    const k = ineligible ? 0 : r.kwh, pr = ineligible ? 0 : r.prime;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible ? ' (non éligible)' : ''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(pr)}</span></div>
    `;
    {const resEl=document.getElementById('results'); resEl.dataset.perM2C = (surf>0 && !ineligible) ? pr/surf : '';}

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:250, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCoreEN112(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface de toiture', unitLabel:'m²', min:0, max:200000,
        calc: (val) => { const r = calcCoreEN112(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeEN112(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>kWh cumac / m² de toiture</th><th>Prime / m²<br>prix classique</th><th>Prime pour 1 000 m²</th></tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v = REF_EN112[zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td><td class="num-c">${eur2(v/1000*pc)}</td><td class="num-c">${eur(v*1000/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
