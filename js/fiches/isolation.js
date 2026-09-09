// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-EN-101/102/103 (Isolation résidentielle)
// ═══════════════════════════════════════════════════════════════════════
function renderEN(body, forfaits, hasPrec, code){
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Surface isolée <span class="hint">m²</span></label><input type="number" id="f-surf" value="100"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWh</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWh</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : ${code} · Résidentiel · Durée de vie 30 ans</div>
  `);
  const baremeWrap = bareme(body, w=>buildBaremeEN(w, forfaits, code));

  function calcCoreEN(surf){
    const zone=document.getElementById('f-zone').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const forfait = forfaits[zone];
    const kwhc = forfait*surf;
    return {kwh: kwhc, primeC: kwhc/1000*pc, primeP: kwhc/1000*pp, forfait};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, primeC, primeP, forfait} = calcCoreEN(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Forfait / kWh cumac</span><span class="result-val" style="font-size:14px">${forfait} kWhc/m² · ${kwh(kwhc)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(primeP)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCoreEN(val); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:50000, hasPrec:true,
        calc: (val) => { const r = calcCoreEN(val); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeEN(wrap, forfaits, code){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>kWhc/m²</th><th>Prime/m²<br>Classique</th><th>Prime/m²<br>Précarité</th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v = forfaits[zone];
    const isCur = zone===curZone;
    html += `<tr class="${isCur?'hl':''}">
      <td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>
      <td>${num(v)}</td>
      <td class="num-c">${eur2(v/1000*pc)}</td>
      <td class="num-p">${eur2(v/1000*pp)}</td>
    </tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-EN-101/103 (Isolation tertiaire simple)
// ═══════════════════════════════════════════════════════════════════════
function renderENBat(body, forfaits, code){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Note :</b> Pas de précarité en tertiaire · Facteur secteur applicable</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Secteur d'activité</label>
        <select id="f-sect"><option value="0.6">Bureaux/Ens./Commerces (×0,6)</option><option value="0.7">Hôtellerie-Restauration (×0,7)</option><option value="1.2">Santé (×1,2)</option><option value="0.6">Autres (×0,6)</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface isolée <span class="hint">m²</span></label><input type="number" id="f-surf" value="500"></div>
      <div class="field"><label>Prix Classique <span class="hint">€/MWh</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : ${code} · Tertiaire · Durée de vie 30 ans</div>
  `);
  const baremeWrap = bareme(body, w=>buildBaremeENBat(w, forfaits, code));

  function calcCoreENBat(surf){
    const zone=document.getElementById('f-zone').value;
    const sect=parseFloat(document.getElementById('f-sect').value);
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const forfait = forfaits[zone];
    const kwhc = forfait*sect*surf;
    return {kwh: kwhc, prime: kwhc/1000*pc};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, prime} = calcCoreENBat(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:50, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCoreENBat(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:100000,
        calc: (val) => { const r = calcCoreENBat(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeENBat(wrap, forfaits, code){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curSect=parseFloat(document.getElementById('f-sect').value);
  const secteurs = [['Bureaux/Ens./Commerces',0.6],['Hôtellerie-Restauration',0.7],['Santé',1.2]];
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>kWhc/m²<br>brut</th>
    ${secteurs.map(([n])=>`<th class="sub">Prime/m²<br>${n}</th>`).join('')}
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v = forfaits[zone];
    const isCur = zone===curZone;
    html += `<tr class="${isCur?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td>`;
    secteurs.forEach(([,f])=>{
      const isCurCell = isCur && f===curSect;
      html += `<td class="num-c" style="${isCurCell?'box-shadow:inset 0 0 0 1.5px #E8C15A':''}">${eur2(v*f/1000*pc)}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-EN-102 (Isolation murs tertiaire — élec/comb)
// ═══════════════════════════════════════════════════════════════════════
function renderEN102Bat(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Note :</b> Deux forfaits selon énergie de chauffage · Facteur secteur applicable · Santé = ×1,3</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Énergie de chauffage</label><select id="f-energie"><option value="elec">Électricité</option><option value="comb">Combustible</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Secteur d'activité</label>
        <select id="f-sect"><option value="0.6">Bureaux/Ens./Commerces (×0,6)</option><option value="0.7">Hôtellerie-Restauration (×0,7)</option><option value="1.3">Santé (×1,3)</option></select>
      </div>
      <div class="field"><label>Surface isolée <span class="hint">m²</span></label><input type="number" id="f-surf" value="500"></div>
    </div>
    <div class="field"><label>Prix Classique <span class="hint">€/MWh</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-EN-102 vA64-3 · Tertiaire · Durée de vie 30 ans</div>
  `);
  const forf = {H1:{elec:3000,comb:4800},H2:{elec:2500,comb:3900},H3:{elec:1600,comb:2600}};
  const baremeWrap = bareme(body, w=>buildBareme102Bat(w, forf));

  function calcCore102Bat(surf){
    const zone=document.getElementById('f-zone').value;
    const energie=document.getElementById('f-energie').value;
    const sect=parseFloat(document.getElementById('f-sect').value);
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const forfait = forf[zone][energie];
    const kwhc = forfait*sect*surf;
    return {kwh: kwhc, prime: kwhc/1000*pc};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, prime} = calcCore102Bat(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:50, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCore102Bat(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:100000,
        calc: (val) => { const r = calcCore102Bat(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme102Bat(wrap, forf){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curEnergie=document.getElementById('f-energie').value;
  const curSect=parseFloat(document.getElementById('f-sect').value);
  const secteurs = [['Bureaux/Ens./Commerces',0.6],['Hôtellerie-Restauration',0.7],['Santé',1.3]];
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>Énergie</th><th>kWhc/m²<br>brut</th>
    ${secteurs.map(([n])=>`<th class="sub">Prime/m²<br>${n}</th>`).join('')}
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    [['Électricité','elec'],['Combustible','comb']].forEach(([label,key],i)=>{
      const v = forf[zone][key];
      const isCur = zone===curZone && key===curEnergie;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="2">${zone}</td>`;
      html += `<td>${label}</td><td>${num(v)}</td>`;
      secteurs.forEach(([,f])=>{
        const isCurCell = isCur && f===curSect;
        html += `<td class="num-c" style="${isCurCell?'box-shadow:inset 0 0 0 1.5px #E8C15A':''}">${eur2(v*f/1000*pc)}</td>`;
      });
      html += `</tr>`;
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
