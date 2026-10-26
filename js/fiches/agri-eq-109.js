// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-109 (Couverture performante de serre)
// Source : fiche d'opération standardisée AGRI-EQ-109 vA58-2 à compter du 01/02/2024
//          (opérations engagées jusqu'au 31/12/2028 — durée de vie conventionnelle 20 ans).
// Formule : kWh cumac = montant par m² de serre équipée × S
//   Double paroi ETFE, double paroi verre-ETFE ou simple paroi verre :
//        serre maraîchère 1 060 kWhc/m² · serre horticole 490 kWhc/m²
//   Double paroi en verre :
//        serre maraîchère 1 930 kWhc/m² · serre horticole 900 kWhc/m²
// Conditions : serres NEUVES chauffées, couverture sur la totalité de la serre,
//   U ≤ 4 W/m².K (NF EN 673 / NF EN ISO 6946), transmission lumineuse ≥ 80 % (NF EN 410).
// Agriculture → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const EQ109_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };
const EQ109_COUVERTURES = {
  etfe:  { label: 'Double paroi ETFE, double paroi verre-ETFE ou simple paroi verre', maraichere: 1060, horticole: 490 },
  verre: { label: 'Double paroi en verre',                                              maraichere: 1930, horticole: 900 },
};
const EQ109_U_MAX = 4;     // W/m².K
const EQ109_TL_MIN = 80;   // % de transmission lumineuse

function renderAGRIEQ109(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles <b>neuves</b> et chauffées · Couverture double paroi verre, double paroi ETFE, double paroi verre-ETFE ou simple paroi verre, sur la totalité de la surface de la serre · Coefficient de transmission thermique U ≤ 4 W/m².K (NF EN 673 pour la double paroi en verre, NF EN ISO 6946 pour les autres) · Transmission lumineuse ≥ 80 % (NF EN 410) · Mise en place par un professionnel · Engagement jusqu'au 31/12/2028</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre109">${Object.entries(EQ109_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de la serre équipée <span class="hint">m²</span></label><input type="number" id="f-surf109" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée</label>
        <select id="f-chauf109"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Serre neuve</label>
        <select id="f-neuve109"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Type de couverture</label>
        <select id="f-couv109"><option value="etfe">Double paroi ETFE, verre-ETFE ou simple paroi verre</option><option value="verre">Double paroi en verre</option></select>
      </div>
      <div class="field"><label>Couverture sur la totalité de la surface de la serre</label>
        <select id="f-totalite109"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Coefficient de transmission thermique U <span class="hint">W/m².K, doit être ≤ 4</span></label><input type="number" id="f-u109" value="3" min="0" step="0.1"></div>
      <div class="field"><label>Transmission lumineuse <span class="hint">%, doit être ≥ 80</span></label><input type="number" id="f-tl109" value="85" min="0" step="1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig109"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-109 vA58-2 à compter du 01/02/2024 · Durée de vie conventionnelle 20 ans · kWh cumac = montant par m² de serre équipée × surface équipée · Serres neuves chauffées uniquement · Secteur agriculture : pas de tarif Précarité</div>
  `);
  const baremeWrap = bareme(body, buildBareme109);

  function read109(){
    return {
      serre: document.getElementById('f-serre109').value,
      S: parseFloat(document.getElementById('f-surf109').value)||0,
      chauf: document.getElementById('f-chauf109').value === 'oui',
      neuve: document.getElementById('f-neuve109').value === 'oui',
      couv: document.getElementById('f-couv109').value,
      totalite: document.getElementById('f-totalite109').value === 'oui',
      u: parseFloat(document.getElementById('f-u109').value)||0,
      tl: parseFloat(document.getElementById('f-tl109').value)||0,
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface équipée (m²).
  function calcCore109(S){
    const i = read109();
    const pbs = [];
    if(!i.chauf) pbs.push('serre non chauffée : la fiche vise les serres chauffées');
    if(!i.neuve) pbs.push('serre existante : la fiche ne vise que les serres neuves');
    if(!i.totalite) pbs.push('la couverture doit recouvrir la totalité de la surface de la serre');
    if(i.u <= 0) pbs.push('coefficient U non renseigné');
    else if(i.u > EQ109_U_MAX) pbs.push(`U = ${i.u.toLocaleString('fr-FR')} W/m².K, supérieur au maximum de ${EQ109_U_MAX}`);
    if(i.tl < EQ109_TL_MIN) pbs.push(`transmission lumineuse ${i.tl.toLocaleString('fr-FR')} % inférieure au minimum de ${EQ109_TL_MIN} %`);
    if(S <= 0) pbs.push('surface de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const unit = EQ109_COUVERTURES[i.couv][i.serre];
    const kwhc = eligible ? unit * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read109();
    const r = calcCore109(i0.S);

    const warn = document.getElementById('warnElig109');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${EQ109_SERRES[i0.serre].toLowerCase()} — ${EQ109_COUVERTURES[i0.couv].label}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf109').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore109(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore109(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme109(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const curSerre = document.getElementById('f-serre109').value;
  const curCouv = document.getElementById('f-couv109').value;
  let html = `<table class="bareme"><thead><tr><th>Type de couverture</th><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  Object.entries(EQ109_COUVERTURES).forEach(([ck, cv])=>{
    ['maraichere','horticole'].forEach((s, i)=>{
      const m = cv[s];
      html += `<tr class="${ck===curCouv && s===curSerre ? 'hl' : ''}${i===1?' grp-end':''}">`;
      if(i === 0) html += `<td rowspan="2" style="text-align:left;font-weight:700">${cv.label}</td>`;
      html += `<td>${EQ109_SERRES[s]}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
    });
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre équipée, à multiplier par la surface équipée.</div>`;
  wrap.innerHTML = html;
}
