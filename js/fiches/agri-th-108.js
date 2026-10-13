// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-TH-108 (Pompe à chaleur de type air/eau ou eau/eau — serres)
// Source : fiche d'opération standardisée AGRI-TH-108 vA35-2 à compter du 01/10/2020
//          (version en vigueur publiée par le ministère ; partie A à compter du 01/07/2026).
// Formule : kWh cumac = montant par m² (performance × type de serre) × Smin
//   PAC ≤ 400 kW : performance = efficacité énergétique saisonnière ηs
//   PAC > 400 kW : performance = COP (EN 14511-2, sortie échangeur intérieur à 35 °C)
//   Smin = plus petite valeur entre S (surface chauffée) et k × P :
//          k = 15 m²/kW (serre maraîchère) ou 31 m²/kW (serre horticole)
// Secteur agriculture → pas de tarif Précarité.
// ⚠ Un projet d'arrêté de révision (v. AXX.4, forfaits environ ×3) existe mais n'était
//   PAS publié au Journal officiel au 13/10/2026 : il n'est volontairement pas appliqué ici.
// ═══════════════════════════════════════════════════════════════════════
const AGRI108_FORFAITS = {
  ets: {                                   // PAC ≤ 400 kW, par classe d'ηs
    '111-126': { maraichere: 800,  horticole: 380 },
    '126+':    { maraichere: 970,  horticole: 460 },
  },
  cop: {                                   // PAC > 400 kW, par classe de COP
    '3.4-4':   { maraichere: 780,  horticole: 370 },
    '4+':      { maraichere: 1040, horticole: 490 },
  },
};
const AGRI108_RATIO = { maraichere: 15, horticole: 31 };   // m² de serre retenus par kW de PAC
const AGRI108_SEUIL_KW = 400;
const AGRI108_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };
const AGRI108_CLASSES_ETS = { '111-126': '111 % ≤ ηs < 126 %', '126+': 'ηs ≥ 126 %' };
const AGRI108_CLASSES_COP = { '3.4-4': '3,4 ≤ COP < 4', '4+': 'COP ≥ 4' };

// Projet d'arrêté de révision (v. AXX.4) — NON PUBLIÉ au Journal officiel au 13/10/2026.
// Utilisé uniquement pour la ligne indicative « Projet d'arrêté » : jamais pour le résultat principal.
const AGRI108_PROJET = {
  forfaits: {
    ets: { '111-140': { maraichere: 2600, horticole: 1200 }, '140+': { maraichere: 2900, horticole: 1400 } },
    cop: { '3.4-4':   { maraichere: 2700, horticole: 1300 }, '4+':   { maraichere: 2800, horticole: 1300 } },
  },
  ratio: { maraichere: 20, horticole: 18 },   // m² de serre retenus par kW de PAC
  puissanceMinUnitaire: 300,                  // kW, chaque PAC (air/eau uniquement)
};

function renderAGRITH108(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Agriculture : serres maraîchères et horticoles, neuves ou existantes · Pompe à chaleur air/eau ou eau/eau mise en place par un professionnel · PAC ≤ 400 kW : ηs ≥ 111 % (moyenne et haute température) ou ≥ 126 % (basse température), ηs de la PAC seule hors régulation · PAC &gt; 400 kW : COP ≥ 3,4 (EN 14511-2, sortie de l'échangeur intérieur à 35 °C) · Surface retenue plafonnée à 15 m²/kW (maraîchère) ou 31 m²/kW (horticole) · Les PAC en relève d'une chaudière à haute performance énergétique ne donnent pas lieu à des CEE</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Type de serre</label>
        <select id="f-serre-agri">${Object.entries(AGRI108_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de serre chauffée <span class="hint">m², chauffée par la PAC</span></label><input type="number" id="f-surf-agri" value="4000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance thermique nominale de la PAC <span class="hint">kW, somme des PAC en parallèle</span></label><input type="number" id="f-p-agri" value="300" min="0" step="1"></div>
      <div class="field"><label>Technologie de la PAC <span class="hint">sans effet sur la fiche en vigueur</span></label>
        <select id="f-techno-agri"><option value="air">Air/eau</option><option value="eau">Eau/eau</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="field-ets-agri"><label>Efficacité énergétique saisonnière ηs <span class="hint">%, PAC seule hors régulation</span></label><input type="number" id="f-ets-agri" value="130" min="0" step="1"></div>
      <div class="field" id="field-cop-agri"><label>COP de la PAC <span class="hint">EN 14511-2, sortie échangeur à 35 °C</span></label><input type="number" id="f-cop-agri" value="3.6" min="0" step="0.1"></div>
      <div class="field" id="field-typepac-agri"><label>Type de PAC <span class="hint">PAC ≤ 400 kW</span></label>
        <select id="f-typepac-agri"><option value="moyenne">Moyenne ou haute température (ηs ≥ 111 %)</option><option value="basse">Basse température (ηs ≥ 126 %)</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>PAC en relève d'une chaudière à haute performance énergétique</label>
        <select id="f-releve-agri"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="warn-box" id="warnElig-agri"></div>
    <div class="warn-box" id="warnPlafond-agri"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : AGRI-TH-108 vA35-2 à compter du 01/10/2020 · Durée de vie conventionnelle 17 ans · kWh cumac = montant par m² × Smin, avec Smin = min [S ; 15 × P] (maraîchère) ou min [S ; 31 × P] (horticole) · Plusieurs PAC de classes différentes en parallèle : retenir le montant par m² de la PAC la plus faible · Secteur agriculture : pas de tarif Précarité · ⚠ Un projet d'arrêté de révision (forfaits environ ×3, plafond 20 / 18 m²/kW, PAC air/eau ≥ 300 kW) n'est pas publié au Journal officiel : il n'apparaît que sur les lignes « Projet d'arrêté », à titre indicatif</div>
  `);
  const baremeWrap = bareme(body, buildBareme108);

  function read108(){
    return {
      serre: document.getElementById('f-serre-agri').value,
      S: parseFloat(document.getElementById('f-surf-agri').value)||0,
      P: parseFloat(document.getElementById('f-p-agri').value)||0,
      typePac: document.getElementById('f-typepac-agri').value,
      ets: parseFloat(document.getElementById('f-ets-agri').value)||0,
      cop: parseFloat(document.getElementById('f-cop-agri').value)||0,
      techno: document.getElementById('f-techno-agri').value,
      releve: document.getElementById('f-releve-agri').value === 'oui',
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, barème et tableau d'écart. S = surface chauffée saisie (m²).
  function calcCore108(S){
    const i = read108();
    const petite = i.P <= AGRI108_SEUIL_KW;
    const classe = petite ? (i.ets >= 126 ? '126+' : '111-126') : (i.cop >= 4 ? '4+' : '3.4-4');
    const unit = AGRI108_FORFAITS[petite ? 'ets' : 'cop'][classe][i.serre];

    const pbs = [];
    if(i.P <= 0) pbs.push('puissance thermique nominale non renseignée');
    if(petite && i.P > 0){
      const seuil = i.typePac === 'basse' ? 126 : 111;
      if(i.ets < seuil) pbs.push(`ηs ${num(i.ets)} % inférieur au minimum de ${seuil} % pour une PAC ${i.typePac === 'basse' ? 'basse' : 'moyenne ou haute'} température`);
    }
    if(!petite && i.cop < 3.4) pbs.push(`COP ${i.cop.toLocaleString('fr-FR')} inférieur au minimum de 3,4`);
    if(i.releve) pbs.push("PAC en relève d'une chaudière à haute performance énergétique : pas de CEE");
    if(S <= 0) pbs.push('surface de serre chauffée non renseignée');
    const eligible = pbs.length === 0;

    const plafondSurface = AGRI108_RATIO[i.serre] * Math.max(0, i.P);
    const Smin = Math.max(0, Math.min(S, plafondSurface));
    const kwhc = eligible ? unit * Smin : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, Smin, plafondSurface, plafonne: S > plafondSurface, eligible, pbs, petite, classe, i};
  }

  // Estimation avec les forfaits du PROJET d'arrêté (non publié) — indicative uniquement.
  function calcProjet108(S){
    const base = calcCore108(S), i = base.i;
    const petite = i.P <= AGRI108_SEUIL_KW;
    const classe = petite ? (i.ets >= 140 ? '140+' : '111-140') : (i.cop >= 4 ? '4+' : '3.4-4');
    const unit = AGRI108_PROJET.forfaits[petite ? 'ets' : 'cop'][classe][i.serre];
    const pbs = base.pbs.slice();
    if(i.P > 0 && i.P < AGRI108_PROJET.puissanceMinUnitaire) pbs.push(`PAC de moins de ${AGRI108_PROJET.puissanceMinUnitaire} kW`);
    if(i.techno === 'eau') pbs.push('PAC eau/eau exclue (air/eau uniquement)');
    const eligible = pbs.length === 0;
    const k = AGRI108_PROJET.ratio[i.serre];
    const plafondSurface = k * Math.max(0, i.P);
    const Smin = Math.max(0, Math.min(S, plafondSurface));
    const kwhc = eligible ? unit * Smin : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, Smin, k, plafonne: S > plafondSurface, eligible, pbs};
  }

  let adjWrap;
  function calc(){
    const i0 = read108();
    // Champs conditionnels (display:none = exclus du comparatif / PDF)
    const petite = i0.P <= AGRI108_SEUIL_KW;
    document.getElementById('field-typepac-agri').style.display = petite ? '' : 'none';
    document.getElementById('field-ets-agri').style.display = petite ? '' : 'none';
    document.getElementById('field-cop-agri').style.display = petite ? 'none' : '';

    const r = calcCore108(i0.S);
    const k = AGRI108_RATIO[i0.serre];

    const warnElig = document.getElementById('warnElig-agri');
    if(!r.eligible){ warnElig.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warnElig.classList.add('show'); }
    else warnElig.classList.remove('show');

    const warnPlafond = document.getElementById('warnPlafond-agri');
    if(r.plafonne && i0.P > 0){
      warnPlafond.innerHTML = `⚠ <b>Surface plafonnée :</b> S = ${num(i0.S)} m² &gt; ${k} × P = ${num(r.plafondSurface)} m². Seuls ${num(r.Smin)} m² sont retenus dans le calcul.`;
      warnPlafond.classList.add('show');
    } else warnPlafond.classList.remove('show');

    const proj = calcProjet108(i0.S);
    const perf = r.petite ? AGRI108_CLASSES_ETS[r.classe] : AGRI108_CLASSES_COP[r.classe];
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Montant unitaire — ${AGRI108_SERRES[i0.serre].toLowerCase()}, ${perf}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface retenue Smin = min [S ; ${k} × P]${r.plafonne ? ' — plafonnée' : ''}</span><span class="result-val" style="font-size:14px">${num(r.Smin)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
      <div class="result-row result-info" data-group="Projet d'arrêté (non publié)" style="border:1.5px dashed #E8B964;background:#FFF8E8"><span class="result-label">Projet d'arrêté (non publié) — kWh cumac</span><span class="result-val" style="font-size:14px;color:#B46A00">${proj.eligible ? kwh(proj.kwh) : '—'}</span></div>
      <div class="result-row result-info" data-group="Projet d'arrêté (non publié)" style="border:1.5px dashed #E8B964;background:#FFF8E8"><span class="result-label">Projet d'arrêté (non publié) — prime Classique indicative</span><span class="result-val" style="color:#B46A00">${proj.eligible ? eur(proj.prime) : '—'}</span></div>
      <div class="source-note" style="margin-top:-4px">${proj.eligible
        ? `Projet v. AXX.4 : ${num(proj.unit)} kWhc/m² × ${num(proj.Smin)} m² (plafond ${proj.k} × P${proj.plafonne ? ', atteint' : ''}). Estimation <b>indicative et non contractuelle</b> : le texte n'est pas publié au Journal officiel — à ne pas présenter comme acquis. Suppose chaque PAC d'au moins 300 kW.`
        : `Projet d'arrêté (non publié) : non éligible — ${proj.pbs.join(' · ')}.`}</div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface chauffée S', defaultStep:500, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf-agri').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore108(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme108(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const serre = document.getElementById('f-serre-agri').value;
  const P = parseFloat(document.getElementById('f-p-agri').value)||0;
  const ets = parseFloat(document.getElementById('f-ets-agri').value)||0;
  const cop = parseFloat(document.getElementById('f-cop-agri').value)||0;
  const petite = P <= AGRI108_SEUIL_KW;
  const curClasse = petite ? (ets >= 126 ? '126+' : '111-126') : (cop >= 4 ? '4+' : '3.4-4');

  let html = `<table class="bareme"><thead><tr><th>Puissance PAC</th><th>Performance</th><th>Type de serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  [['ets', '≤ 400 kW', AGRI108_CLASSES_ETS, true], ['cop', '> 400 kW', AGRI108_CLASSES_COP, false]].forEach(([regime, regimeLabel, classes, isPetite])=>{
    const keys = Object.keys(classes);
    keys.forEach((ck, ci)=>{
      ['maraichere','horticole'].forEach((s, si)=>{
        const v = AGRI108_FORFAITS[regime][ck][s];
        const isCur = petite === isPetite && ck === curClasse && s === serre;
        const lastOfClass = si === 1;
        html += `<tr class="${isCur?'hl':''}${lastOfClass?' grp-end':''}">`;
        if(ci === 0 && si === 0) html += `<td rowspan="4" style="text-align:left;font-weight:700">${regimeLabel}</td>`;
        if(si === 0) html += `<td rowspan="2">${classes[ck]}</td>`;
        html += `<td>${s === 'maraichere' ? 'Maraîchère' : 'Horticole'}</td><td>${num(v)}</td><td class="num-c">${eur2(v/1000*pc)}</td></tr>`;
      });
    });
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de serre chauffée. Multiplier par Smin = min [S ; 15 × P] (maraîchère) ou min [S ; 31 × P] (horticole).</div>`;
  wrap.innerHTML = html;
}
