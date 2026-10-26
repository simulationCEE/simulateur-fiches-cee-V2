// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-102 (Double écran thermique)
// Source : fiche d'opération standardisée AGRI-EQ-102 vA65-2 à compter du 01/04/2025
//          (opérations engagées avant le 01/04/2030 — durée de vie conventionnelle 8 ans).
// Formule : kWh cumac = montant par m² de serre équipée × S
//   Serre maraîchère : 290 kWhc/m² · Serre horticole : 240 kWhc/m²
// Agriculture → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const EQ102_MONTANTS = { maraichere: 290, horticole: 240 };
const EQ102_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };

function renderAGRIEQ102(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles, neuves ou existantes · Double écran thermique, ou second écran en complément d'un premier écran existant, installé au-dessus des cultures d'une serre chauffée · Mise en place par un professionnel · Écran piloté automatiquement · Engagement avant le 01/04/2030</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre102">${Object.entries(EQ102_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de la serre équipée <span class="hint">m²</span></label><input type="number" id="f-surf102" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée</label>
        <select id="f-chauf102"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Dispositif piloté automatiquement</label>
        <select id="f-pilote102"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig102"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-102 vA65-2 à compter du 01/04/2025 · Durée de vie conventionnelle 8 ans · kWh cumac = montant par m² de serre équipée × surface équipée · Secteur agriculture : pas de tarif Précarité</div>
  `);
  const baremeWrap = bareme(body, buildBareme102);

  function read102(){
    return {
      serre: document.getElementById('f-serre102').value,
      S: parseFloat(document.getElementById('f-surf102').value)||0,
      chauf: document.getElementById('f-chauf102').value === 'oui',
      pilote: document.getElementById('f-pilote102').value === 'oui',
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface équipée (m²).
  function calcCore102(S){
    const i = read102();
    const pbs = [];
    if(!i.chauf) pbs.push('serre non chauffée : la fiche vise les serres chauffées');
    if(!i.pilote) pbs.push('écran non piloté automatiquement');
    if(S <= 0) pbs.push('surface de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const unit = EQ102_MONTANTS[i.serre];
    const kwhc = eligible ? unit * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read102();
    const r = calcCore102(i0.S);

    const warn = document.getElementById('warnElig102');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${EQ102_SERRES[i0.serre].toLowerCase()}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf102').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore102(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore102(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme102(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const cur = document.getElementById('f-serre102').value;
  let html = `<table class="bareme"><thead><tr><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  ['maraichere','horticole'].forEach((s, i)=>{
    const m = EQ102_MONTANTS[s];
    html += `<tr class="${s===cur?'hl':''}${i===1?' grp-end':''}"><td>${EQ102_SERRES[s]}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre équipée, à multiplier par la surface équipée.</div>`;
  wrap.innerHTML = html;
}
