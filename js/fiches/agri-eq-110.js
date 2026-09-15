// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-110 — Séchage solaire par insufflation (panneaux hybrides)
// Source : AGRI-EQ-110 vA38-1 à compter du 31-07-2021
// ═══════════════════════════════════════════════════════════════════════
const FORFAIT_AGRIEQ110 = {
  neuf:   {H1:{agri:42700,  foret:102600}, H2:{agri:48500,  foret:116600}, H3:{agri:55700,  foret:134100}},
  toiture:{H1:{agri:12200,  foret:16900},  H2:{agri:13900,  foret:19300},  H3:{agri:17400,  foret:24100}},
};
const OPERATION_LABELS_AGRIEQ110 = {
  neuf: "Système complet neuf de séchage (basse temp. 25-40°C)",
  toiture: "Toiture solaire couplée au système existant (haute temp. 60-80°C)",
};

function renderAGRIEQ110(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Bâtiment de séchage fermé · Panneaux hybrides certifiés IEC 61215 + IEC 61730 · Productivité des capteurs ≥ 500 W/m² (élec. IEC 61215 + therm. ISO 9806)</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Type d'opération</label>
        <select id="f-operation">
          <option value="neuf">${OPERATION_LABELS_AGRIEQ110.neuf}</option>
          <option value="toiture">${OPERATION_LABELS_AGRIEQ110.toiture}</option>
        </select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Produits séchés</label><select id="f-produit"><option value="agri">Agricoles</option><option value="foret">Forestiers</option></select></div>
      <div class="field"><label>Puissance thermique installée <span class="hint">kW</span></label><input type="number" id="f-p" value="100"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Productivité des capteurs <span class="hint">W/m² — informatif, seuil réglementaire</span></label><input type="number" id="f-productivite" value="550"></div>
      <div class="field"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box" id="warnProductivite"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-110 vA38-1 à compter du 31-07-2021 · Agriculture · Durée de vie 15 ans</div>
  `);
  const baremeWrap = bareme(body, buildBaremeAGRIEQ110);

  function calcCoreAGRIEQ110(p){
    const zone = document.getElementById('f-zone').value;
    const operation = document.getElementById('f-operation').value;
    const produit = document.getElementById('f-produit').value;
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    const pp = parseFloat(document.getElementById('f-pp').value)||0;
    const forfait = FORFAIT_AGRIEQ110[operation][zone][produit];
    const kwhc = forfait*p;
    return {kwh:kwhc, primeC:kwhc/1000*pc, primeP:kwhc/1000*pp, forfait};
  }

  let adjWrap;
  let revWrap;
  function calc(){
    const p = parseFloat(document.getElementById('f-p').value)||0;
    const productivite = parseFloat(document.getElementById('f-productivite').value)||0;
    const {kwh:kwhc, primeC, primeP, forfait} = calcCoreAGRIEQ110(p);

    const warn = document.getElementById('warnProductivite');
    if(productivite>0 && productivite<500){
      warn.innerHTML = `⚠ <b>Productivité inférieure au seuil réglementaire :</b> ${num(productivite)} W/m² &lt; 500 W/m² requis. Opération non éligible en l'état.`;
      warn.classList.add('show');
    } else {
      warn.classList.remove('show');
    }

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Forfait / kW installé</span><span class="result-val" style="font-size:14px">${num(forfait)} kWhc/kW</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row hi cdp"><span class="result-label">Prime Classique</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(primeP)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'kW', paramLabel:'Puissance', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-p').value)||0,
        minValid: 0,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCoreAGRIEQ110(val); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'puissance', unitLabel:'kW', min:0, max:5000, hasPrec:true,
        calc: (val) => { const r = calcCoreAGRIEQ110(val); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeAGRIEQ110(wrap){
  const curZone = document.getElementById('f-zone').value;
  const curOperation = document.getElementById('f-operation').value;
  let html = `<table class="bareme"><thead><tr><th>Opération</th><th>Zone</th><th>Agricoles<br>kWhc/kW</th><th>Forestiers<br>kWhc/kW</th></tr></thead><tbody>`;
  Object.keys(OPERATION_LABELS_AGRIEQ110).forEach(op=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const v = FORFAIT_AGRIEQ110[op][zone];
      const isCur = op===curOperation && zone===curZone;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700;font-size:11px">${op==='neuf'?'Système neuf':'Toiture couplée'}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v.agri)}</td><td>${num(v.foret)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
