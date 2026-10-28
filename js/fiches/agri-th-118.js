// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-TH-118 (Double tube de chauffage pour serres maraîchères)
// Source : fiche d'opération standardisée AGRI-TH-118 vA14-1 (partie A à compter du 01/07/2026),
//          présentation EBS Énergie du 29/09/2026 ; durée de vie conventionnelle 15 ans.
// Formule : kWh cumac = 370 × S
//   S = surface AU SOL de serre équipée du double tube dans la végétation (m²)
//       (au moins deux tubes par rangée de culture) — seule la surface réellement équipée est déclarée.
// Conditions : serres maraîchères (neuves ou existantes) chauffées · réseau « basse température »
//   (eau < 60 °C) · tubes métalliques · au moins deux tubes par rangée, ou un second tube en
//   complément d'un premier existant · mise en place par un professionnel.
// Agriculture → pas de tarif Précarité.
// ⚠ Aucune date de fin n'apparaît dans les documents transmis ; durée de vie (15 ans) relevée dans
//   des sources concordantes : à reconfirmer sur le PDF officiel de la fiche.
// ═══════════════════════════════════════════════════════════════════════
const TH118_MONTANT = 370;   // kWh cumac par m² de serre équipée
const TH118_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };

function renderAGRITH118(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : <b>serres maraîchères</b> neuves ou existantes (serres horticoles et ornementales exclues) · Serre chauffée · Réseau de chauffage « basse température » (eau &lt; 60 °C) dans la végétation, avec vannes, pompes et régulation du circuit · Tubes de chauffage <b>métalliques</b> · Au moins <b>deux tubes par rangée</b> de culture, ou un second tube en complément d'un premier existant · Surface prise en compte : surface au sol de serre équipée · Mise en place par un professionnel · Contrôle sur le lieu des opérations pour 100 % des dossiers</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Nature de la serre</label>
        <select id="f-serre118">${Object.entries(TH118_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface au sol équipée du double tube <span class="hint">m²</span></label><input type="number" id="f-surf118" value="5000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Serre chauffée</label>
        <select id="f-chauf118"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Réseau de chauffage basse température <span class="hint">eau &lt; 60 °C</span></label>
        <select id="f-bt118"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Tubes de chauffage métalliques</label>
        <select id="f-metal118"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field"><label>Au moins deux tubes par rangée <span class="hint">ou second tube en complément d'un existant</span></label>
        <select id="f-tubes118"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig118"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-TH-118 vA14-1 (partie A à compter du 01/07/2026) · Durée de vie conventionnelle 15 ans · kWh cumac = 370 × surface au sol de serre équipée · Seule la surface effectivement équipée est déclarée, pas la surface totale d'une serre partiellement équipée · Secteur agriculture : pas de tarif Précarité · À coupler éventuellement avec AGRI-TH-108 ou AGRI-TH-110 · Aucune date de fin dans les documents transmis : à reconfirmer sur le PDF officiel</div>
  `);
  const baremeWrap = bareme(body, buildBareme118);

  function read118(){
    return {
      serre: document.getElementById('f-serre118').value,
      S: parseFloat(document.getElementById('f-surf118').value)||0,
      chauf: document.getElementById('f-chauf118').value === 'oui',
      bt: document.getElementById('f-bt118').value === 'oui',
      metal: document.getElementById('f-metal118').value === 'oui',
      tubes: document.getElementById('f-tubes118').value === 'oui',
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface équipée (m²).
  function calcCore118(S){
    const i = read118();
    const pbs = [];
    if(i.serre !== 'maraichere') pbs.push('serre horticole : la fiche est réservée aux serres maraîchères');
    if(!i.chauf) pbs.push('serre non chauffée : la fiche vise les serres chauffées');
    if(!i.bt) pbs.push('réseau de chauffage non « basse température » (eau à 60 °C ou plus)');
    if(!i.metal) pbs.push('tubes non métalliques (polyéthylène, plastique, composite) : non éligibles');
    if(!i.tubes) pbs.push('un seul tube par rangée, sans tube existant en complément : non éligible');
    if(S <= 0) pbs.push('surface de serre équipée non renseignée');
    const eligible = pbs.length === 0;
    const kwhc = eligible ? TH118_MONTANT * S : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit:TH118_MONTANT, eligible, pbs, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read118();
    const r = calcCore118(i0.S);

    const warn = document.getElementById('warnElig118');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — serre maraîchère</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface au sol de serre équipée</span><span class="result-val" style="font-size:14px">${num(i0.S)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface équipée', defaultStep:1000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf118').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore118(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:500000,
        calc: (val) => { const res = calcCore118(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme118(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const html = `<table class="bareme"><thead><tr><th>Nature de la serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>
    <tr class="hl grp-end"><td>${TH118_SERRES.maraichere}</td><td>${num(TH118_MONTANT)}</td><td class="num-c">${eur2(TH118_MONTANT/1000*pc)}</td></tr>
  </tbody></table><div class="source-note">Valeur en kWh cumac par m² de serre maraîchère équipée, à multiplier par la surface au sol équipée. Fiche réservée aux serres maraîchères.</div>`;
  wrap.innerHTML = html;
}
