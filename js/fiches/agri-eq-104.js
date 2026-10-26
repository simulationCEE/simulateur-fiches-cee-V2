// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-104 (Écrans thermiques latéraux)
// Source : fiche d'opération standardisée AGRI-EQ-104 vA62-2 à compter du 01/01/2025
//          (opérations engagées avant le 01/01/2030 — durée de vie conventionnelle 8 ans).
// Formule : kWh cumac = montant par m² de serre équipée × S
//   S = surface AU SOL de la serre équipée (m²)
//   Serre maraîchère : 48 kWhc/m² · Serre horticole : 22 kWhc/m²
// Agriculture → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const EQ104_MONTANTS = { maraichere: 48, horticole: 22 };
const EQ104_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };

function renderAGRIEQ104(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles, neuves ou existantes · Écran thermique latéral installé au niveau des parois de serres chauffées · Mise en place par un professionnel · Écran piloté automatiquement · Surface prise en compte : surface au sol de la serre équipée · Engagement avant le 01/01/2030</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre104">${Object.entries(EQ104_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface au sol de serre équipée <span class="hint">m²</span></label><input type="number" id="f-surf104" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée</label>
        <select id="f-chauf104"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Dispositif piloté automatiquement</label>
        <select id="f-pilote104"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig104"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-104 vA62-2 à compter du 01/01/2025 · Durée de vie conventionnelle 8 ans · kWh cumac = montant par m² de serre équipée × surface au sol équipée · Secteur agriculture : pas de tarif Précarité</div>
  `);
  const baremeWrap = bareme(body, buildBareme104);

  function read104(){
    return {
      serre: document.getElementById('f-serre104').value,
      S: parseFloat(document.getElementById('f-surf104').value)||0,
      chauf: document.getElementById('f-chauf104').value === 'oui',
      pilote: document.getElementById('f-pilote104').value === 'oui',
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface au sol équipée (m²).
  function calcCore104(S){
    const i = read104();
    const pbs = [];
    if(!i.chauf) pbs.push('serre non chauffée : la fiche vise les serres chauffées');
    if(!i.pilote) pbs.push('écran non piloté automatiquement');
    if(S <= 0) pbs.push('surface au sol de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const unit = EQ104_MONTANTS[i.serre];
    const kwhc = eligible ? unit * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read104();
    const r = calcCore104(i0.S);

    const warn = document.getElementById('warnElig104');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${EQ104_SERRES[i0.serre].toLowerCase()}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface au sol de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf104').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore104(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore104(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme104(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const cur = document.getElementById('f-serre104').value;
  let html = `<table class="bareme"><thead><tr><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  ['maraichere','horticole'].forEach((s, i)=>{
    const m = EQ104_MONTANTS[s];
    html += `<tr class="${s===cur?'hl':''}${i===1?' grp-end':''}"><td>${EQ104_SERRES[s]}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre équipée (surface au sol), à multiplier par la surface équipée.</div>`;
  wrap.innerHTML = html;
}
