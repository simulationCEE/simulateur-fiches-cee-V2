// ═══════════════════════════════════════════════════════════════════════
// RENDER: Système de déstratification d'air (France métropolitaine)
//   BAT-TH-142 vA71-4 (tertiaire)  — à compter du 01/08/2025
//   IND-BA-110 vA71-4 (industrie)  — à compter du 01/08/2025
// Formule : kWh cumac = Fconv(zone) × Pconv + Frad(zone) × Prad
//   Pconv / Prad = puissances nominales des systèmes de chauffage convectif / radiatif
//   du local déstratifié (kW). Les deux montants se cumulent si le local a les deux.
// Opérations engagées avant le 01/08/2030. Durée de vie conventionnelle : 15 ans.
// ═══════════════════════════════════════════════════════════════════════
const DESTRAT_FORFAITS = {
  'BAT-TH-142': { H1:{conv:3900, rad:1400}, H2:{conv:4500, rad:1600}, H3:{conv:4600, rad:1600} },
  'IND-BA-110': { H1:{conv:7200, rad:2500}, H2:{conv:8000, rad:2800}, H3:{conv:8500, rad:3000} },
};

function renderDestrat(body, code){
  const isTer = code === 'BAT-TH-142';
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> ${isTer ? 'Bâtiment tertiaire existant' : 'Bâtiment industriel existant'} · Local complètement clos, hauteur ≥ 5 m, consigne de chauffage en occupation ≥ 15 °C · Entrepôts logistiques, réserves et locaux de stockage exclus · Brasseurs d'air plafonniers exclus · Système sans apport de chaleur, indépendant du chauffage · Asservi à une mesure de température en partie haute · Vitesse d'air ≤ 0,2 m/s à 1 m du sol${isTer ? ' · Bruit au sol &lt; 45 dB(A)' : ''} · Installateur avec décennale électricité · <b>Note de dimensionnement et calepinage</b> signés (OPQIBI 1327 ou ${isTer ? '1905' : '1717'}, ou NF X 50-091 / NF EN 16247) · Engagement avant le 01/08/2030</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Type d'écoulement du déstratificateur</label>
        <select id="f-ecoul-ds"><option value="vertical">Vertical (aspiration en partie haute, soufflage vers le sol)</option><option value="horizontal">Horizontal (aspiration sur toute la hauteur)</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance de chauffage convectif du local <span class="hint">kW — aérothermes, CTA, rooftops, générateurs d'air chaud…</span></label><input type="number" id="f-pconv-ds" value="300" min="0" step="1"></div>
      <div class="field"><label>Puissance de chauffage radiatif du local <span class="hint">kW — tubes et panneaux radiants, cassettes, plancher chauffant…</span></label><input type="number" id="f-prad-ds" value="0" min="0" step="1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Hauteur sous plafond ou sous faîtage <span class="hint">m</span></label><input type="number" id="f-haut-ds" value="8" min="0" step="0.1"></div>
      <div class="field"><label>Affectation du local</label>
        <select id="f-local-ds">
          <option value="ok">${isTer ? 'Local tertiaire chauffé (gymnase, salle, commerce, atelier…)' : 'Atelier ou hall de production chauffé'}</option>
          <option value="stockage">Entrepôt logistique, réserve ou local de stockage</option>
        </select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Local complètement clos et consigne en occupation ≥ 15 °C</label>
        <select id="f-clos-ds"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      ${isTer ? `<div class="field"><label>Bruit au sol du système inférieur à 45 dB(A)</label>
        <select id="f-bruit-ds"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>` : '<div class="field"></div>'}
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig-ds"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : ${code} vA71-4 à compter du 01/08/2025 · Durée de vie 15 ans · Montants convectif et radiatif cumulables · Chaudière commune à plusieurs locaux : retenir la part de sa puissance au prorata des volumes chauffés · Chauffage centralisé : puissance ≤ puissance nominale de la chaudière · Le nombre d'appareils doit correspondre à la note de dimensionnement</div>
  `);
  const baremeWrap = bareme(body, wrap => buildBaremeDestrat(wrap, code));

  function readDS(){
    return {
      zone: document.getElementById('f-zone').value,
      pconv: parseFloat(document.getElementById('f-pconv-ds').value)||0,
      prad: parseFloat(document.getElementById('f-prad-ds').value)||0,
      haut: parseFloat(document.getElementById('f-haut-ds').value)||0,
      stockage: document.getElementById('f-local-ds').value === 'stockage',
      closOk: document.getElementById('f-clos-ds').value === 'oui',
      bruitOk: isTer ? document.getElementById('f-bruit-ds').value === 'oui' : true,
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // pConv paramétrable pour le tableau d'écart ; la puissance radiative reste celle saisie.
  function calcCoreDS(pConv){
    const {zone, prad, pc} = readDS();
    const f = DESTRAT_FORFAITS[code][zone];
    const kwhConv = f.conv * Math.max(0, pConv);
    const kwhRad = f.rad * Math.max(0, prad);
    const total = kwhConv + kwhRad;
    return {kwh:total, prime:total/1000*pc, kwhConv, kwhRad, f};
  }

  let adjWrap;
  function calc(){
    const d = readDS();
    const r = calcCoreDS(d.pconv);

    const pbs = [];
    if(d.haut < 5) pbs.push(`hauteur ${num(d.haut)} m inférieure à 5 m`);
    if(d.stockage) pbs.push('entrepôts, réserves et locaux de stockage exclus');
    if(!d.closOk) pbs.push('le local doit être complètement clos avec une consigne de chauffage ≥ 15 °C en occupation');
    if(!d.bruitOk) pbs.push('bruit au sol du système ≥ 45 dB(A)');
    if(d.pconv <= 0 && d.prad <= 0) pbs.push('aucune puissance de chauffage renseignée');
    const ineligible = pbs.length > 0;
    const warn = document.getElementById('warnElig-ds');
    if(ineligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const k = ineligible ? 0 : r.kwh;
    const pr = ineligible ? 0 : r.prime;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Part convective (${num(r.f.conv)} × ${num(d.pconv)} kW)</span><span class="result-val" style="font-size:14px">${kwh(r.kwhConv)}</span></div>
      <div class="result-row"><span class="result-label">Part radiative (${num(r.f.rad)} × ${num(d.prad)} kW)</span><span class="result-val" style="font-size:14px">${kwh(r.kwhRad)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible ? ' (non éligible)' : ''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(pr)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'kW', paramLabel:'Puissance convective', defaultStep:50, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-pconv-ds').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCoreDS(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeDestrat(wrap, code){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const curZone = document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>Convectif (kWhc/kW)</th><th>Prime / kW convectif</th><th>Radiatif (kWhc/kW)</th><th>Prime / kW radiatif</th></tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(z=>{
    const v = DESTRAT_FORFAITS[code][z];
    html += `<tr class="${z===curZone?'hl':''}"><td>${z}</td><td>${num(v.conv)}</td><td class="num-c">${eur2(v.conv/1000*pc)}</td><td>${num(v.rad)}</td><td class="num-c">${eur2(v.rad/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par kW de puissance nominale de chauffage du local. Le convectif rapporte environ ${code==='IND-BA-110' ? '2,9' : '2,8'} fois plus que le radiatif : l'air chaud monte davantage avec un chauffage par air.</div>`;
  wrap.innerHTML = html;
}
