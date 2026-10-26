// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-EQ-112 (Double paroi gonflable sur serres maraîchères ou horticoles)
// Source : fiche d'opération standardisée AGRI-EQ-112 vA73-3 à compter du 01/09/2025
//          (durée de vie conventionnelle 5 ans).
// Formule : kWh cumac = montant par m² de serre équipée × S
//   Serre maraîchère : 410 kWhc/m² · Serre horticole : 290 kWhc/m²
// Conditions : serre chauffée (consigne minimale de chauffage > 12 °C sur la période de culture),
//   dispositif piloté automatiquement, couverture multicouche plastique neuve avec système de
//   gonflage au-dessus des cultures ; pose UNIQUEMENT sur les parois verticales exclue ;
//   non cumulable avec AGRI-EQ-108.
// ⚠ FICHE ABROGÉE À COMPTER DU 24/06/2026 : conservée uniquement pour les dossiers engagés avant
//   cette date. Une date d'engagement postérieure bloque le calcul (opération non éligible).
// Agriculture → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const EQ112_MONTANTS = { maraichere: 410, horticole: 290 };
const EQ112_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };
const EQ112_DEBUT = '2025-09-01';   // première date d'engagement couverte par la version vA73-3
const EQ112_FIN = '2026-06-23';     // dernière date d'engagement avant l'abrogation (24/06/2026)

function renderAGRIEQ112(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="warn-box show" style="margin-bottom:10px"><b>⚠ Fiche abrogée à compter du 24/06/2026.</b> Seules les opérations engagées <b>avant cette date</b> peuvent encore en bénéficier : pour une date d'engagement postérieure, le simulateur n'affiche aucun montant.</div>
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles, neuves ou existantes · Couverture multicouche en plastique neuve avec système de gonflage, installée au-dessus des cultures et, le cas échéant, sur les parois verticales d'une serre chauffée · Serre chauffée : température de consigne minimale de chauffage supérieure à 12 °C sur la période de culture · Installation uniquement sur les parois verticales exclue · Dispositif piloté automatiquement · Mise en place par un professionnel · Non cumulable avec AGRI-EQ-108</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre112">${Object.entries(EQ112_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de la serre équipée <span class="hint">m²</span></label><input type="number" id="f-surf112" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée <span class="hint">consigne minimale &gt; 12 °C en culture</span></label>
        <select id="f-chauf112"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Dispositif piloté automatiquement</label>
        <select id="f-pilote112"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Double paroi posée uniquement sur les parois verticales</label>
        <select id="f-vertical112"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
      <div class="field"><label>Cumul avec AGRI-EQ-108 sur la même serre</label>
        <select id="f-cumul112"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig112"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-EQ-112 vA73-3 à compter du 01/09/2025 · Fiche abrogée à compter du 24/06/2026 · Durée de vie conventionnelle 5 ans · kWh cumac = montant par m² de serre équipée × surface équipée · Secteur agriculture : pas de tarif Précarité · La date d'engagement saisie en haut du simulateur détermine si la fiche s'applique</div>
  `);
  const baremeWrap = bareme(body, buildBareme112);

  function read112(){
    const dateEl = document.getElementById('regDate');
    return {
      serre: document.getElementById('f-serre112').value,
      S: parseFloat(document.getElementById('f-surf112').value)||0,
      chauf: document.getElementById('f-chauf112').value === 'oui',
      pilote: document.getElementById('f-pilote112').value === 'oui',
      vertical: document.getElementById('f-vertical112').value === 'oui',
      cumul: document.getElementById('f-cumul112').value === 'oui',
      date: dateEl ? dateEl.value : new Date().toISOString().slice(0,10),
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface équipée (m²).
  function calcCore112(S){
    const i = read112();
    const pbs = [];
    if(i.date > EQ112_FIN) pbs.push("fiche abrogée à compter du 24/06/2026 : une opération engagée après le 23/06/2026 ne donne plus lieu à des certificats");
    else if(i.date < EQ112_DEBUT) pbs.push("la version vA73-3 s'applique à partir du 01/09/2025 : pour un engagement antérieur, se référer à la version alors en vigueur");
    if(!i.chauf) pbs.push('serre non chauffée (consigne minimale de chauffage ≤ 12 °C sur la période de culture)');
    if(!i.pilote) pbs.push('dispositif non piloté automatiquement');
    if(i.vertical) pbs.push('installation uniquement sur les parois verticales : exclue');
    if(i.cumul) pbs.push('non cumulable avec AGRI-EQ-108');
    if(S <= 0) pbs.push('surface de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const unit = EQ112_MONTANTS[i.serre];
    const kwhc = eligible ? unit * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read112();
    const r = calcCore112(i0.S);

    const warn = document.getElementById('warnElig112');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${EQ112_SERRES[i0.serre].toLowerCase()}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf112').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore112(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore112(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  // La date d'engagement (#regDate) est ajoutée après le rendu par addRegulatoryCheck :
  // écoute déléguée, puis recalcul une fois le panneau complet.
  body.addEventListener('input', e => { if(e.target && e.target.id === 'regDate') calc(); });
  calc();
  setTimeout(calc, 0);
}

function buildBareme112(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const cur = document.getElementById('f-serre112').value;
  let html = `<table class="bareme"><thead><tr><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  ['maraichere','horticole'].forEach((s, i)=>{
    const m = EQ112_MONTANTS[s];
    html += `<tr class="${s===cur?'hl':''}${i===1?' grp-end':''}"><td>${EQ112_SERRES[s]}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre équipée, à multiplier par la surface équipée. Fiche abrogée à compter du 24/06/2026 : valables uniquement pour un engagement antérieur.</div>`;
  wrap.innerHTML = html;
}
