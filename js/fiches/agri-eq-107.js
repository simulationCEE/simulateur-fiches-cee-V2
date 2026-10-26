// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-107 (Isolation des parois de serre)
// Source : fiche d'opération standardisée AGRI-EQ-107 vA38-1 à compter du 31/07/2021
//          (pas de date de fin dans le texte — durée de vie conventionnelle 15 ans).
// Formule : kWh cumac = montant par m² de serre équipée × S
//   Serre maraîchère : 170 kWhc/m² · Serre horticole : 92 kWhc/m²
// Conditions : isolation latérale sur la totalité des parois, U ≤ 3 W/m².K.
// Agriculture → pas de tarif Précarité.
// ⚠ Version ancienne : vérifier qu'aucune révision n'est intervenue avant tout engagement.
// ═══════════════════════════════════════════════════════════════════════
const EQ107_MONTANTS = { maraichere: 170, horticole: 92 };
const EQ107_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };
const EQ107_U_MAX = 3;   // W/m².K

function renderAGRIEQ107(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles, neuves ou existantes · Isolation latérale au niveau des parois de serres chauffées (polycarbonate, PMMA, double vitrage de verre, panneau sandwich, double paroi verre-ETFE ou double paroi ETFE), le cas échéant en remplacement des parois en plastique ou en verre · Mise en place sur la totalité des parois de la serre · Facteur de transmission thermique U ≤ 3 W/m².K (NF EN 673 pour le verre, NF EN ISO 6946 pour les autres matériaux) · Mise en place par un professionnel</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre107">${Object.entries(EQ107_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de la serre équipée <span class="hint">m²</span></label><input type="number" id="f-surf107" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée</label>
        <select id="f-chauf107"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Isolation sur la totalité des parois de la serre</label>
        <select id="f-totalite107"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Coefficient de transmission thermique U <span class="hint">W/m².K, doit être ≤ 3</span></label><input type="number" id="f-u107" value="2.5" min="0" step="0.1"></div>
      <div class="field"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig107"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-107 vA38-1 à compter du 31/07/2021 · Durée de vie conventionnelle 15 ans · kWh cumac = montant par m² de serre équipée × surface équipée · Secteur agriculture : pas de tarif Précarité · Version ancienne : à revérifier avant tout engagement</div>
  `);
  const baremeWrap = bareme(body, buildBareme107);

  function read107(){
    return {
      serre: document.getElementById('f-serre107').value,
      S: parseFloat(document.getElementById('f-surf107').value)||0,
      chauf: document.getElementById('f-chauf107').value === 'oui',
      totalite: document.getElementById('f-totalite107').value === 'oui',
      u: parseFloat(document.getElementById('f-u107').value)||0,
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface équipée (m²).
  function calcCore107(S){
    const i = read107();
    const pbs = [];
    if(!i.chauf) pbs.push('serre non chauffée : la fiche vise les serres chauffées');
    if(!i.totalite) pbs.push("l'isolation latérale doit être mise en place sur la totalité des parois");
    if(i.u <= 0) pbs.push('coefficient U non renseigné');
    else if(i.u > EQ107_U_MAX) pbs.push(`U = ${i.u.toLocaleString('fr-FR')} W/m².K, supérieur au maximum de ${EQ107_U_MAX}`);
    if(S <= 0) pbs.push('surface de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const unit = EQ107_MONTANTS[i.serre];
    const kwhc = eligible ? unit * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read107();
    const r = calcCore107(i0.S);

    const warn = document.getElementById('warnElig107');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${EQ107_SERRES[i0.serre].toLowerCase()}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf107').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore107(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore107(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme107(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const cur = document.getElementById('f-serre107').value;
  let html = `<table class="bareme"><thead><tr><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  ['maraichere','horticole'].forEach((s, i)=>{
    const m = EQ107_MONTANTS[s];
    html += `<tr class="${s===cur?'hl':''}${i===1?' grp-end':''}"><td>${EQ107_SERRES[s]}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre équipée, à multiplier par la surface équipée.</div>`;
  wrap.innerHTML = html;
}
