// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-TH-163 (PAC tertiaire)
// ═══════════════════════════════════════════════════════════════════════
function renderBAT163(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> PAC tertiaire · Pas de précarité en tertiaire · ≤ 400 kW → seuil sur Etas · &gt; 400 kW → seuil sur COP (EN 14511-2) · Facteur secteur et facteur R applicables</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Puissance thermique nominale PAC <span class="hint">kW — total installé</span></label><input type="number" id="f-ppac" value="200"></div>
    </div>
    <div class="field-row">
      <div class="field" id="field-etas"><label>Etas de la PAC (%)</label><input type="number" id="f-etas" value="140"></div>
      <div class="field" id="field-cop" style="display:none"><label>COP de la PAC <span class="hint">EN 14511-2</span></label><input type="number" id="f-cop" value="4" step="0.1"></div>
      <div class="field"><label>Secteur d'activité</label>
        <select id="f-sect"><option value="1.2">Bureaux (×1,2)</option><option value="1.1">Santé (×1,1)</option>
        <option value="0.8">Enseignement (×0,8)</option><option value="0.9">Commerces (×0,9)</option>
        <option value="0.7">Hôtellerie-Restauration (×0,7)</option><option value="0.7">Autres (×0,7)</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface totale chauffée <span class="hint">m²</span></label><input type="number" id="f-surf" value="1000"></div>
      <div class="field"><label>Puissance chaufferie <span class="hint">kW — total après travaux</span></label><input type="number" id="f-pch" value="400"></div>
    </div>
    <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-TH-163 vA81-2 · DV : 22 ans · Prime toujours calculée sur la surface totale (jamais un prix au m²)</div>
  `);
  const baremeWrap = bareme(body, buildBareme163);

  const ppacInput = document.getElementById('f-ppac');
  function toggleRegime(){
    const gt400 = (parseFloat(ppacInput.value)||0) > 400;
    document.getElementById('field-etas').style.display = gt400 ? 'none' : '';
    document.getElementById('field-cop').style.display = gt400 ? '' : 'none';
  }
  ppacInput.addEventListener('input', toggleRegime);

  const FORFAIT_LE400 = {
    '111-126': {H1:1100,H2:900,H3:600},
    '126-175': {H1:1200,H2:1000,H3:700},
    '175+':    {H1:1300,H2:1000,H3:700},
  };
  const FORFAIT_GT400 = {
    '3.4-4.5': {H1:1100,H2:900,H3:600},
    '4.5+':    {H1:1200,H2:1000,H3:700},
  };

  function calcCore163(surf){
    const zone=document.getElementById('f-zone').value;
    const sect=parseFloat(document.getElementById('f-sect').value);
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const ppac=parseFloat(document.getElementById('f-ppac').value)||0;
    const pch=parseFloat(document.getElementById('f-pch').value)||1;
    const gt400 = ppac > 400;

    let brut;
    if(gt400){
      const cop=parseFloat(document.getElementById('f-cop').value)||0;
      brut = FORFAIT_GT400[cop>=4.5 ? '4.5+' : '3.4-4.5'][zone];
    } else {
      const etas=parseFloat(document.getElementById('f-etas').value)||0;
      const band = etas<126 ? '111-126' : (etas<175 ? '126-175' : '175+');
      brut = FORFAIT_LE400[band][zone];
    }

    const R = (ppac/pch)>=0.4 ? 1 : ppac/pch;
    const kwhc = brut*sect*surf*R;
    return {kwh: kwhc, prime: kwhc/1000*pc, R, gt400};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, prime, R, gt400} = calcCore163(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Régime</span><span class="result-val" style="font-size:14px">${gt400?'&gt; 400 kW (COP)':'≤ 400 kW (Etas)'}</span></div>
      <div class="result-row"><span class="result-label">Facteur R</span><span class="result-val" style="font-size:14px">${R.toFixed(2)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:50, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCore163(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:50000,
        calc: (val) => { const r = calcCore163(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  toggleRegime();
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme163(wrap){
  const curZone=document.getElementById('f-zone').value;
  const curPpac=parseFloat(document.getElementById('f-ppac').value)||0;
  const curGt400 = curPpac > 400;
  const curEtas=parseFloat(document.getElementById('f-etas').value)||0;
  const curCop=parseFloat(document.getElementById('f-cop').value)||0;

  let html = `<table class="bareme"><thead><tr>
    <th colspan="5">PAC de puissance thermique nominale ≤ 400 kW — seuil sur Etas</th>
  </tr><tr>
    <th>Zone</th><th>111%≤Etas&lt;126%</th><th>126%≤Etas&lt;175%</th><th>175%≤Etas</th><th></th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const isCur = !curGt400 && zone===curZone;
    const bandCur = curEtas<126?'111-126':(curEtas<175?'126-175':'175+');
    html += `<tr class="${isCur?'hl':''}">
      <td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>
      <td ${isCur&&bandCur==='111-126'?'style="box-shadow:inset 0 0 0 1.5px #E8C15A"':''}>${num({H1:1100,H2:900,H3:600}[zone])}</td>
      <td ${isCur&&bandCur==='126-175'?'style="box-shadow:inset 0 0 0 1.5px #E8C15A"':''}>${num({H1:1200,H2:1000,H3:700}[zone])}</td>
      <td ${isCur&&bandCur==='175+'?'style="box-shadow:inset 0 0 0 1.5px #E8C15A"':''}>${num({H1:1300,H2:1000,H3:700}[zone])}</td>
      <td></td>
    </tr>`;
  });
  html += `</tbody></table><div style="height:14px"></div><table class="bareme"><thead><tr>
    <th colspan="4">PAC de puissance thermique nominale &gt; 400 kW — seuil sur COP (EN 14511-2)</th>
  </tr><tr>
    <th>Zone</th><th>3,4≤COP&lt;4,5</th><th>4,5≤COP</th><th></th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const isCur = curGt400 && zone===curZone;
    const bandCur = curCop>=4.5?'4.5+':'3.4-4.5';
    html += `<tr class="${isCur?'hl':''}">
      <td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>
      <td ${isCur&&bandCur==='3.4-4.5'?'style="box-shadow:inset 0 0 0 1.5px #E8C15A"':''}>${num({H1:1100,H2:900,H3:600}[zone])}</td>
      <td ${isCur&&bandCur==='4.5+'?'style="box-shadow:inset 0 0 0 1.5px #E8C15A"':''}>${num({H1:1200,H2:1000,H3:700}[zone])}</td>
      <td></td>
    </tr>`;
  });
  html += `</tbody></table>
  <div style="padding:10px 12px;font-size:10.5px;color:var(--text-3);line-height:1.6">
    Valeurs en kWh cumac par m² de surface chauffée. La prime réelle = ce forfait × facteur secteur × surface totale chauffée × facteur R × prix ÷ 1 000 — jamais un prix affiché « au m² ».
  </div>`;
  wrap.innerHTML = html;
}

