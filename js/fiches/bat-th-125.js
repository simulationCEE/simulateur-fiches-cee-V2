// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-TH-125 (Ventilation mécanique simple flux à débit d’air constant ou modulé)
// Source : fiche BAT-TH-125 vA32-2 à compter du 01-04-2020 · Durée de vie 17 ans
// kWh cumac = forfait par m² (type de ventilation, zone) × facteur correctif secteur × surface ventilée
// Surface ventilée = surface totale du bâtiment couverte par le système
// ═══════════════════════════════════════════════════════════════════════
const VENT_BAT125 = {
  prop: { label:'Simple flux modulée proportionnelle', zones:{H1:770, H2:630, H3:420},
    secteurs:{ bureaux:['Bureaux', 0.48], enseignement:['Enseignement', 1], restauration:['Restauration', 0.59], autres:['Autres locaux (dont hôtellerie hygroréglable)', 0.54] } },
  presence: { label:'Simple flux modulée à détection de présence', zones:{H1:690, H2:560, H3:380},
    secteurs:{ bureaux:['Bureaux', 0.4], enseignement:['Enseignement', 1], restauration:['Restauration', 0.45], autres:['Autres locaux', 0.51] } },
  constant: { label:'Simple flux à débit d’air constant', zones:{H1:400, H2:330, H3:220},
    secteurs:{ bureaux:['Bureaux', 0.4], enseignement:['Enseignement', 1], restauration:['Restauration', 0.53], autres:['Autres locaux', 0.58] } },
};

function renderBAT125(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Locaux tertiaires existants · Pose par un professionnel · Ventilation <b>modulée</b> (proportionnelle ou à détection de présence) : avis technique CCFAT en cours de validité à l'engagement (ou équivalent) · Caisson : puissance électrique absorbée ≤ 0,3 W/(m³/h) au débit nominal · Ventilation hygroréglable en hôtellerie = simple flux modulée proportionnelle, secteur « Autres locaux » · Pas de précarité en tertiaire</div>`);
  const typeOpts = Object.entries(VENT_BAT125).map(([k,t])=>`<option value="${k}">${t.label}</option>`).join('');
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Type de ventilation</label><select id="f-type-v">${typeOpts}</select></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Secteur d'activité</label><select id="f-sect-v"></select></div>
      <div class="field"><label>Surface ventilée <span class="hint">m² — surface du bâtiment couverte par le système</span></label><input type="number" id="f-surf" value="1000" min="0"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance électrique absorbée du caisson  <span class="hint">W/(m³/h) au débit nominal · doit être ≤ 0,3</span></label><input type="number" id="f-puiss-v" value="" step="0.01" placeholder="ex : 0,25"></div>
      <div class="field"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig-v"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-TH-125 vA32-2 à compter du 01-04-2020 · Tertiaire · Durée de vie 17 ans · Montant = forfait par m² × facteur correctif secteur × surface ventilée</div>
  `);
  const typeSel = document.getElementById('f-type-v');
  const sectSel = document.getElementById('f-sect-v');
  // Les secteurs proposés dépendent du type de ventilation (fiche : tableaux distincts)
  function fillSecteurs(){
    const prev = sectSel.value;
    const secteurs = VENT_BAT125[typeSel.value].secteurs;
    sectSel.innerHTML = Object.entries(secteurs).map(([k,s])=>`<option value="${k}">${s[0]} (×${String(s[1]).replace('.',',')})</option>`).join('');
    if(secteurs[prev]) sectSel.value = prev;
  }
  fillSecteurs();
  typeSel.addEventListener('input', fillSecteurs);
  const baremeWrap = bareme(body, buildBaremeBAT125);

  function calcCoreV(surf){
    const zone=document.getElementById('f-zone').value;
    const t=VENT_BAT125[typeSel.value];
    const fs=t.secteurs[sectSel.value][1];
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const kwhc=t.zones[zone]*fs*Math.max(0,surf);
    return {kwh:kwhc, prime:kwhc/1000*pc, forfait:t.zones[zone], fs};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const pbs=[];
    const p=document.getElementById('f-puiss-v').value;
    if(p!=='' && parseFloat(p) > 0.3) pbs.push(`puissance absorbée du caisson ${p.replace('.',',')} W/(m³/h) : doit être ≤ 0,3`);
    
    const ineligible=pbs.length>0;
    const warn=document.getElementById('warnElig-v');
    if(ineligible){ warn.innerHTML=`⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');
    const r=calcCoreV(surf);
    const k=ineligible?0:r.kwh, pr=ineligible?0:r.prime;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Forfait (${num(r.forfait)} kWhc/m² × ${String(r.fs).replace('.',',')} × ${num(surf)} m²)</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible?' (non éligible)':''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(pr)}</span></div>
    `;
    {const resEl=document.getElementById('results'); resEl.dataset.perM2C=(surf>0&&!ineligible)?pr/surf:'';}
    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface ventilée', defaultStep:250, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCoreV(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface ventilée', unitLabel:'m²', min:0, max:200000,
        calc: (val) => { const r = calcCoreV(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeBAT125(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const tk=document.getElementById('f-type-v').value;
  const t=VENT_BAT125[tk];
  const curSect=document.getElementById('f-sect-v').value;
  const secteurs=Object.entries(t.secteurs);
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>kWhc/m²</th>${secteurs.map(([,s])=>`<th>${s[0].split(' (')[0]}<br>×${String(s[1]).replace('.',',')} · €/m²</th>`).join('')}</tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v=t.zones[zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td>`;
    secteurs.forEach(([k,s])=>{ html += `<td class="num-c" style="${zone===curZone&&k===curSect?'font-weight:800;text-decoration:underline':''}">${eur2(v*s[1]/1000*pc)}</td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table><div class="source-note">${t.label} · kWh cumac par m² de surface ventilée (avant facteur secteur) · Prime par m² au prix classique saisi.</div>`;
  wrap.innerHTML = html;
}
