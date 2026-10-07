// ═══════════════════════════════════════════════════════════════════════
// RENDER: IND-UT-141 (Chaudière industrielle électrique)
// Sources : arrêté du 01/09/2026 (JO du 04/09/2026) créant la fiche IND-UT-141 ;
//           arrêté du 18/09/2026 (JO du 26/09/2026) relatif à la bonification.
// Fiche applicable aux opérations engagées du 05/09/2026 au 31/08/2031.
//
// Formule : kWh cumac = 8 600 000 × P × α
//   P = puissance thermique nominale totale des chaudières électriques installées (MW),
//       plafonnée à la puissance maximale du besoin de chaleur (étude, point III)
//       et, en cas de remplacement, à la puissance nominale totale des chaudières remplacées.
//   α (bonification, opérations engagées à partir du 27/09/2026) :
//       P* ≤ 10 MW → α = 3 − P*/5   ;   P* > 10 MW → α = 1
//       P* = somme des puissances nominales des chaudières électriques installées (MW).
//   Opérations engagées du 05/09/2026 au 26/09/2026 : pas de bonification (α = 1).
// Secteur industrie uniquement → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const FORFAIT_INDUT141 = 8600000;          // kWh cumac par MW
const DATE_DEBUT_INDUT141 = '2026-09-05';  // première date d'engagement éligible
const DATE_FIN_INDUT141 = '2031-08-31';    // dernière date d'engagement éligible
const DATE_BONIF_INDUT141 = '2026-09-27';  // bonification α applicable à partir de cette date
const SEUIL_PUISSANCE_INDUT141 = 20;       // MW, strictement inférieur

function alphaIndUt141(pInstallee){
  if(pInstallee <= 0) return 1;
  return pInstallee <= 10 ? 3 - pInstallee/5 : 1;
}

function renderINDUT141(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Secteur industrie · Chaudière(s) électrique(s) neuve(s) à jet, à électrodes ou à thermoplongeur, rendement ≥ 99 % · Fluide caloporteur &gt; 110 °C (vapeur, eau surchauffée, fluide thermique) · <b>Électrification totale</b> : remplacement de toutes les chaudières à combustible ou site nouveau / extension / nouveau besoin · Hybridation exclue · Chaudières à combustible avant travaux &lt; 20 MW et chaudières électriques &lt; 20 MW · Étude de dimensionnement signée à l'engagement · Mesure de température (ou pression) quotidienne et compteur électrique au pas de 10 min, conservés 6 ans · Secours consigné ≤ 500 h/an et ≤ 8 % de la consommation · Contrôle sur site 100 %</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Situation du site</label>
        <select id="f-cas141">
          <option value="remplacement">Remplacement total des chaudières à combustible</option>
          <option value="nouveau">Site nouveau, extension ou nouveau besoin de chaleur</option>
        </select>
      </div>
      <div class="field" id="field-pcomb141"><label>Puissance des chaudières à combustible remplacées <span class="hint">MW, nominale totale avant travaux</span></label><input type="number" id="f-pcomb141" value="5" min="0" step="0.1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance des chaudières électriques installées <span class="hint">MW, nominale totale de l'opération</span></label><input type="number" id="f-pelec141" value="4" min="0" step="0.1"></div>
      <div class="field"><label>Chaudières électriques déjà présentes <span class="hint">MW, installées avant l'opération</span></label><input type="number" id="f-pexist141" value="0" min="0" step="0.1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance maximale du besoin de chaleur <span class="hint">MW, étude de dimensionnement (point III)</span></label><input type="number" id="f-pbesoin141" value="4" min="0" step="0.1"></div>
      <div class="field"><label>Température du fluide caloporteur supérieure à 110 °C</label>
        <select id="f-temp141"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnEligib141"></div>
    <div class="warn-box" id="warnPlafond141"></div>
    <div class="warn-box" id="warnDate141"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : arrêté du 01/09/2026 (JO du 04/09/2026) créant IND-UT-141 et arrêté du 18/09/2026 (JO du 26/09/2026) sur la bonification · Forfait 8 600 000 kWh cumac/MW · Durée de vie 22 ans · Bonification α = 3 − P/5 si P ≤ 10 MW, α = 1 au-delà, pour les opérations engagées à partir du 27/09/2026 · La date d'engagement saisie en haut du simulateur détermine l'application de la bonification · Secteur industrie : pas de tarif Précarité</div>
  `);
  const baremeWrap = bareme(body, buildBareme141);

  function readInputs141(){
    const cas = document.getElementById('f-cas141').value;
    const pcomb = parseFloat(document.getElementById('f-pcomb141').value)||0;
    const pelec = parseFloat(document.getElementById('f-pelec141').value)||0;
    const pexist = parseFloat(document.getElementById('f-pexist141').value)||0;
    const pbesoin = parseFloat(document.getElementById('f-pbesoin141').value)||0;
    const tempOk = document.getElementById('f-temp141').value === 'oui';
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    const dateEl = document.getElementById('regDate');
    const date = dateEl ? dateEl.value : new Date().toISOString().slice(0,10);
    return {cas, pcomb, pelec, pexist, pbesoin, tempOk, pc, date};
  }

  // Calcul unique — résultat principal, barème et tableau d'écart.
  // pInstallee = puissance nominale totale des chaudières électriques de l'opération (MW).
  function calcCore141(pInstallee){
    const {cas, pcomb, pbesoin, pc, date} = readInputs141();
    let pRetenue = Math.max(0, pInstallee);
    const plafonds = [];
    if(pbesoin > 0 && pRetenue > pbesoin){ pRetenue = pbesoin; plafonds.push('besoin'); }
    if(cas === 'remplacement' && pcomb > 0 && pRetenue > pcomb){ pRetenue = pcomb; plafonds.push('remplacement'); }
    const bonifActive = date >= DATE_BONIF_INDUT141;
    const alpha = bonifActive ? alphaIndUt141(pInstallee) : 1;
    const kwhBrut = FORFAIT_INDUT141 * pRetenue;
    const kwhc = kwhBrut * alpha;
    return {kwh:kwhc, kwhBrut, prime:kwhc/1000*pc, pRetenue, plafonds, alpha, bonifActive};
  }

  let adjWrap;

  function calc(){
    const {cas, pcomb, pelec, pexist, pbesoin, tempOk, date} = readInputs141();

    // Champ conditionnel (display:none = exclu du comparatif / PDF)
    document.getElementById('field-pcomb141').style.display = cas === 'remplacement' ? '' : 'none';

    const r = calcCore141(pelec);

    // Éligibilité
    const pbs = [];
    if(cas === 'remplacement' && pcomb >= SEUIL_PUISSANCE_INDUT141) pbs.push(`chaudières à combustible avant travaux ${num(pcomb)} MW ≥ 20 MW`);
    if(pelec + pexist >= SEUIL_PUISSANCE_INDUT141) pbs.push(`chaudières électriques ${num(pelec + pexist)} MW au total (y compris celles déjà présentes) ≥ 20 MW`);
    if(!tempOk) pbs.push('fluide caloporteur à 110 °C ou moins');
    if(pelec <= 0) pbs.push('puissance des chaudières électriques non renseignée');
    const warnEligib = document.getElementById('warnEligib141');
    if(pbs.length){
      warnEligib.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`;
      warnEligib.classList.add('show');
    } else {
      warnEligib.classList.remove('show');
    }

    // Plafonds de P
    const warnPlafond = document.getElementById('warnPlafond141');
    if(r.plafonds.length){
      const motifs = [];
      if(r.plafonds.includes('besoin')) motifs.push(`la puissance maximale du besoin de chaleur (${num(pbesoin)} MW)`);
      if(r.plafonds.includes('remplacement')) motifs.push(`la puissance des chaudières remplacées (${num(pcomb)} MW)`);
      warnPlafond.innerHTML = `⚠ <b>Puissance plafonnée :</b> ${num(pelec)} MW installés, mais P est limitée à ${motifs.join(' et à ')}. P retenue : ${r.pRetenue.toLocaleString('fr-FR',{maximumFractionDigits:2})} MW.`;
      warnPlafond.classList.add('show');
    } else {
      warnPlafond.classList.remove('show');
    }

    // Date d'engagement
    const warnDate = document.getElementById('warnDate141');
    if(date < DATE_DEBUT_INDUT141 || date > DATE_FIN_INDUT141){
      warnDate.innerHTML = `⚠ <b>Date d'engagement hors fenêtre :</b> la fiche s'applique aux opérations engagées du 05/09/2026 au 31/08/2031.`;
      warnDate.classList.add('show');
    } else if(!r.bonifActive){
      warnDate.innerHTML = `⚠ <b>Pas de bonification :</b> les opérations engagées entre le 05/09/2026 et le 26/09/2026 ne bénéficient pas du coefficient α.`;
      warnDate.classList.add('show');
    } else {
      warnDate.classList.remove('show');
    }

    const alphaTxt = r.alpha.toLocaleString('fr-FR',{maximumFractionDigits:2});
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Puissance P retenue${r.plafonds.length ? ' — plafonnée' : ''}</span><span class="result-val" style="font-size:14px">${r.pRetenue.toLocaleString('fr-FR',{maximumFractionDigits:2})} MW</span></div>
      <div class="result-row"><span class="result-label">kWh cumac avant bonification (8 600 000 × P)</span><span class="result-val" style="font-size:14px">${kwh(r.kwhBrut)}</span></div>
      <div class="result-row"><span class="result-label">Coefficient de bonification α ${r.bonifActive ? (pelec <= 10 ? '(3 − P/5)' : '(P > 10 MW)') : '(engagement avant le 27/09/2026)'}</span><span class="result-val" style="font-size:14px">×${alphaTxt}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)} <span style="font-weight:400;opacity:.7">(${(r.kwh/1e6).toLocaleString('fr-FR',{maximumFractionDigits:2})} GWhc)</span></span></div>
      <div class="result-row ${r.alpha>1?'cdp':'hi'}"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'MW', paramLabel:'Puissance installée', defaultStep:1, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-pelec141').value)||0,
        minValid: 0,
        calc: (val) => {
          const res = calcCore141(val);
          return {kwh:res.kwh, prime:res.prime};
        }
      });
    } else {
      adjWrap.refresh();
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

function buildBareme141(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const pelec = parseFloat(document.getElementById('f-pelec141').value)||0;
  const dateEl = document.getElementById('regDate');
  const bonifActive = (dateEl ? dateEl.value : new Date().toISOString().slice(0,10)) >= DATE_BONIF_INDUT141;
  const paliers = [0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 19.9];

  let html = `<table class="bareme"><thead><tr><th>Puissance P</th><th>α ${bonifActive ? '' : '(non applicable)'}</th><th>kWh cumac</th><th>GWhc</th><th>Prime Classique</th></tr></thead><tbody>`;
  paliers.forEach(p=>{
    const alpha = bonifActive ? alphaIndUt141(p) : 1;
    const v = FORFAIT_INDUT141 * p * alpha;
    const isCur = Math.abs(p - pelec) < 1e-9;
    html += `<tr class="${isCur?'hl':''}${p===10?' grp-end':''}">`;
    html += `<td>${p.toLocaleString('fr-FR')} MW</td>`;
    html += `<td>×${alpha.toLocaleString('fr-FR',{maximumFractionDigits:2})}</td>`;
    html += `<td>${num(v)}</td>`;
    html += `<td>${(v/1e6).toLocaleString('fr-FR',{maximumFractionDigits:1})}</td>`;
    html += `<td class="num-c">${eur(v/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Barème sans plafonnement (P = puissance installée). La bonification est maximale pour les petites puissances et disparaît au-delà de 10 MW.</div>`;
  wrap.innerHTML = html;
}
