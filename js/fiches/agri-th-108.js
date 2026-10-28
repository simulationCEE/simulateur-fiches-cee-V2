// ═══════════════════════════════════════════════════════════════════════
// RENDER: AGRI-TH-108 (Pompe à chaleur pour le chauffage de serres)
//
// DEUX VERSIONS, choisies automatiquement selon la DATE D'ENGAGEMENT saisie en haut de la fiche :
//
//  • vA35-2 (à compter du 01/10/2020) — opérations engagées jusqu'au 28/10/2026
//      PAC air/eau ou eau/eau · ηs : 111-126 % / ≥ 126 % · montants 800 / 380 / 970 / 460 kWhc/m²
//      COP > 400 kW : 780 / 370 (3,4 ≤ COP < 4) · 1 040 / 490 (COP ≥ 4)
//      Smin = min [S ; 15 × P] (maraîchère) ou min [S ; 31 × P] (horticole)
//
//  • Arrêté du 26/10/2026 (JO du 28/10/2026, NOR ECOR2626133A) — opérations engagées à partir du 29/10/2026
//      PAC AIR/EAU uniquement, chaque PAC ≥ 300 kW, pas de PAC hybride
//      ηs : 111-140 % / ≥ 140 % · montants 2 600 / 1 200 (maraîchère / horticole) et 2 900 / 1 400
//      COP > 400 kW : 2 700 / 1 300 (3,4 ≤ COP < 4) · 2 800 / 1 300 (COP ≥ 4)
//      Smin = min [S ; 20 × P] (maraîchère) ou min [S ; 18 × P] (horticole)
//      Conditions renforcées : serre isolée, ballon de stockage ≥ 150 m³/ha, étude de dimensionnement
//      indépendante, installation par un professionnel indépendant de l'exploitant, etc.
//      Applicable aux opérations engagées avant le 01/10/2031. Durée de vie 17 ans (inchangée).
//
// Formule : kWh cumac = montant par m² × Smin. Secteur agriculture → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const AGRI108_DATE_V2 = '2026-10-29';     // premier jour d'engagement soumis à la fiche révisée
const AGRI108_DATE_FIN = '2031-09-30';    // dernier jour d'engagement de la fiche révisée
const AGRI108_SEUIL_KW = 400;

const AGRI108_V1 = {
  id: 'v1', nom: 'vA35-2',
  etsHaut: 126,                                   // seuil de la classe d'ηs supérieure (%)
  ets: { lo:{ maraichere:800,  horticole:380 }, hi:{ maraichere:970,  horticole:460 } },
  cop: { lo:{ maraichere:780,  horticole:370 }, hi:{ maraichere:1040, horticole:490 } },
  etsLabels: { lo:'111 % ≤ ηs < 126 %', hi:'126 % ≤ ηs' },
  copLabels: { lo:'3,4 ≤ COP < 4', hi:'4 ≤ COP' },
  ratio: { maraichere:15, horticole:31 },         // m² de serre retenus par kW de PAC
};
const AGRI108_V2 = {
  id: 'v2', nom: 'arrêté du 26/10/2026',
  etsHaut: 140,
  ets: { lo:{ maraichere:2600, horticole:1200 }, hi:{ maraichere:2900, horticole:1400 } },
  cop: { lo:{ maraichere:2700, horticole:1300 }, hi:{ maraichere:2800, horticole:1300 } },
  etsLabels: { lo:'111 % ≤ ηs < 140 %', hi:'140 % ≤ ηs' },
  copLabels: { lo:'3,4 ≤ COP < 4', hi:'4 ≤ COP' },
  ratio: { maraichere:20, horticole:18 },
};
const AGRI108_SERRES = { maraichere: 'Serre maraîchère', horticole: 'Serre horticole' };

function agri108VersionFor(date){ return date >= AGRI108_DATE_V2 ? AGRI108_V2 : AGRI108_V1; }

const AGRI108_COND_V1 = "Agriculture : serres maraîchères et horticoles, neuves ou existantes · Pompe à chaleur air/eau ou eau/eau mise en place par un professionnel · PAC ≤ 400 kW : ηs ≥ 111 % (moyenne et haute température) ou ≥ 126 % (basse température), ηs de la PAC seule hors régulation · PAC &gt; 400 kW : COP ≥ 3,4 (EN 14511-2, sortie de l'échangeur intérieur à 35 °C) · Surface retenue plafonnée à 15 m²/kW (maraîchère) ou 31 m²/kW (horticole) · Les PAC en relève d'une chaudière à haute performance énergétique ne donnent pas lieu à des CEE";
const AGRI108_COND_V2 = "Agriculture : serres maraîchères ou horticoles chauffées, neuves ou existantes, <b>isolées au moins au niveau de la couverture</b> · PAC fixes <b>air/eau uniquement</b> (eau/eau et PAC hybrides gaz/électricité exclues), <b>chaque PAC ≥ 300 kW</b> · Électrification totale : aucune chaudière à combustible conservée ou installée (hors secours ≤ 500 h/an et ≤ 12 % de la consommation) · PAC ≤ 400 kW : ηs ≥ 111 % (départ réseau &gt; 35 °C) ou ≥ 126 % (départ ≤ 35 °C) · PAC &gt; 400 kW : COP ≥ 3,4 (35 °C) · Puissance électrique souscrite supérieure à la somme des puissances des PAC · Alimentation exclusivement par le réseau public (et photovoltaïque) · Système fixe de gestion climatique avec station météo · Ballon de stockage ≥ 1 h et ≥ 150 m³ par hectare (Smin) · Étude de dimensionnement indépendante de l'installateur · Installation par un professionnel indépendant de l'exploitant · Contrôle sur site 100 % · Engagement avant le 01/10/2031";

function renderAGRITH108(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="warn-box show" id="verBanner108" style="margin-bottom:10px"></div>
    <div class="cond-box" id="cond108"></div>
  `);
  const yn = (id, label, hint, def='oui', cls='v2only108') => `
    <div class="field ${cls}"><label>${label}${hint ? ` <span class="hint">${hint}</span>` : ''}</label>
      <select id="${id}"><option value="oui"${def==='oui'?' selected':''}>Oui</option><option value="non"${def==='non'?' selected':''}>Non</option></select>
    </div>`;
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Type de serre</label>
        <select id="f-serre-agri">${Object.entries(AGRI108_SERRES).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Surface de serre chauffée <span class="hint">m², chauffée par la PAC</span></label><input type="number" id="f-surf-agri" value="4000" min="0" step="100"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance thermique nominale de la PAC <span class="hint">kW, somme des PAC en parallèle</span></label><input type="number" id="f-p-agri" value="300" min="0" step="1"></div>
      <div class="field"><label>Technologie de la PAC <span class="hint">air/eau seule depuis le 29/10/2026</span></label>
        <select id="f-techno-agri"><option value="air">Air/eau</option><option value="eau">Eau/eau</option><option value="hybride">Hybride gaz/électricité</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="field-ets-agri"><label>Efficacité énergétique saisonnière ηs <span class="hint">%, PAC seule hors régulation</span></label><input type="number" id="f-ets-agri" value="145" min="0" step="1"></div>
      <div class="field" id="field-cop-agri"><label>COP de la PAC <span class="hint">EN 14511-2, sortie échangeur à 35 °C</span></label><input type="number" id="f-cop-agri" value="3.6" min="0" step="0.1"></div>
      <div class="field" id="field-typepac-agri"><label>Type de PAC <span class="hint">PAC ≤ 400 kW</span></label>
        <select id="f-typepac-agri"><option value="moyenne">Moyenne ou haute température (ηs ≥ 111 %)</option><option value="basse">Basse température (ηs ≥ 126 %)</option></select>
      </div>
    </div>
    <div class="field-row align-inputs v2only108">
      ${yn('f-chauf108', 'Serre chauffée', 'consigne ≥ 12 °C tomates/concombres, ≥ 8 °C autres (nov.-avril)')}
      ${yn('f-isole108', 'Serre isolée au moins au niveau de la couverture')}
    </div>
    <div class="field-row align-inputs v2only108">
      ${yn('f-chaque300-108', 'Chaque PAC a une puissance thermique nominale ≥ 300 kW')}
      ${yn('f-chaudiere108', 'Chaudière à combustible conservée (hors équipement de secours)', '', 'non')}
    </div>
    <div class="field-row align-inputs v2only108">
      ${yn('f-ballon108', 'Ballon de stockage conforme', '≥ 1 h d\'autonomie, ≥ 150 m³/ha')}
      ${yn('f-puiss108', 'Puissance souscrite supérieure à la somme des puissances des PAC')}
    </div>
    <div class="field-row align-inputs v2only108">
      ${yn('f-alim108', 'Alimentation exclusivement par le réseau public (et photovoltaïque)')}
      ${yn('f-indep108', 'Installation par un professionnel indépendant de l\'exploitant')}
    </div>
    <div class="field-row align-inputs">
      ${yn('f-releve-agri', 'PAC en relève d\'une chaudière à haute performance énergétique', '', 'non', 'v1only108')}
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="warn-box" id="warnElig-agri"></div>
    <div class="warn-box" id="warnPlafond-agri"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note" id="note108"></div>
  `);
  const baremeWrap = bareme(body, buildBareme108);

  function read108(){
    const g = id => document.getElementById(id);
    const dateEl = g('regDate');
    return {
      date: dateEl ? dateEl.value : new Date().toISOString().slice(0,10),
      serre: g('f-serre-agri').value,
      S: parseFloat(g('f-surf-agri').value)||0,
      P: parseFloat(g('f-p-agri').value)||0,
      techno: g('f-techno-agri').value,
      typePac: g('f-typepac-agri').value,
      ets: parseFloat(g('f-ets-agri').value)||0,
      cop: parseFloat(g('f-cop-agri').value)||0,
      releve: g('f-releve-agri').value === 'oui',
      chauf: g('f-chauf108').value === 'oui',
      isole: g('f-isole108').value === 'oui',
      chaque300: g('f-chaque300-108').value === 'oui',
      chaudiere: g('f-chaudiere108').value === 'oui',
      ballon: g('f-ballon108').value === 'oui',
      puiss: g('f-puiss108').value === 'oui',
      alim: g('f-alim108').value === 'oui',
      indep: g('f-indep108').value === 'oui',
      pc: parseFloat(g('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, barème et tableau d'écart. S = surface chauffée saisie (m²).
  function calcCore108(S){
    const i = read108();
    const v = agri108VersionFor(i.date);
    const isV2 = v === AGRI108_V2;
    const petite = i.P <= AGRI108_SEUIL_KW;
    const lvl = petite ? (i.ets >= v.etsHaut ? 'hi' : 'lo') : (i.cop >= 4 ? 'hi' : 'lo');
    const unit = (petite ? v.ets : v.cop)[lvl][i.serre];

    const pbs = [];
    if(isV2 && i.date > AGRI108_DATE_FIN) pbs.push("engagement après le 30/09/2031 : hors période d'application de la fiche");
    if(i.P <= 0) pbs.push('puissance thermique nominale non renseignée');
    if(petite && i.P > 0){
      const seuil = i.typePac === 'basse' ? 126 : 111;
      if(i.ets < seuil) pbs.push(`ηs ${i.ets.toLocaleString('fr-FR',{maximumFractionDigits:1})} % inférieur au minimum de ${seuil} % pour une PAC ${i.typePac === 'basse' ? 'basse' : 'moyenne ou haute'} température`);
    }
    if(!petite && i.cop < 3.4) pbs.push(`COP ${i.cop.toLocaleString('fr-FR')} inférieur au minimum de 3,4`);
    if(isV2){
      if(i.techno === 'eau') pbs.push('PAC eau/eau : exclue (air/eau uniquement depuis le 29/10/2026)');
      if(i.techno === 'hybride') pbs.push('PAC hybride gaz/électricité : non éligible');
      if(i.P > 0 && i.P < 300) pbs.push(`puissance ${i.P.toLocaleString('fr-FR')} kW : chaque PAC doit atteindre 300 kW`);
      else if(!i.chaque300) pbs.push('chaque PAC doit avoir une puissance thermique nominale ≥ 300 kW');
      if(!i.chauf) pbs.push('serre non chauffée (consigne ≥ 12 °C pour tomates et concombres, ≥ 8 °C pour les autres cultures, de novembre à avril)');
      if(!i.isole) pbs.push('serre non isolée au moins au niveau de la couverture');
      if(i.chaudiere) pbs.push('chaudière à combustible conservée hors équipement de secours : électrification totale exigée');
      if(!i.ballon) pbs.push('ballon de stockage non conforme (≥ 1 h d\'autonomie et ≥ 150 m³ par hectare de Smin)');
      if(!i.puiss) pbs.push('la puissance souscrite doit être strictement supérieure à la somme des puissances thermiques nominales des PAC');
      if(!i.alim) pbs.push('le système doit être alimenté exclusivement par le réseau public (et le photovoltaïque)');
      if(!i.indep) pbs.push("installation par l'exploitant ou son service technique interne : non éligible");
    } else if(i.releve){
      pbs.push("PAC en relève d'une chaudière à haute performance énergétique : pas de CEE");
    }
    if(S <= 0) pbs.push('surface de serre chauffée non renseignée');
    const eligible = pbs.length === 0;

    const plafondSurface = v.ratio[i.serre] * Math.max(0, i.P);
    const Smin = Math.max(0, Math.min(S, plafondSurface));
    const kwhc = eligible ? unit * Smin : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, Smin, plafondSurface, plafonne: S > plafondSurface, eligible, pbs, petite, lvl, v, isV2, i};
  }

  let adjWrap;
  function calc(){
    const i0 = read108();
    const v = agri108VersionFor(i0.date);
    const isV2 = v === AGRI108_V2;
    const petite = i0.P <= AGRI108_SEUIL_KW;

    // Champs propres à une version ou à un régime (display:none sur le champ = exclu du comparatif / PDF)
    body.querySelectorAll('.v2only108').forEach(el => { el.style.display = isV2 ? '' : 'none'; });
    body.querySelectorAll('.v1only108').forEach(el => { el.style.display = isV2 ? 'none' : ''; });
    document.getElementById('field-typepac-agri').style.display = petite ? '' : 'none';
    document.getElementById('field-ets-agri').style.display = petite ? '' : 'none';
    document.getElementById('field-cop-agri').style.display = petite ? 'none' : '';

    document.getElementById('verBanner108').innerHTML = isV2
      ? `<b>ℹ Fiche révisée par l'arrêté du 26/10/2026</b> (JO du 28/10/2026), applicable aux opérations engagées <b>à partir du 29/10/2026</b> : forfaits relevés, PAC air/eau d'au moins 300 kW uniquement, conditions renforcées.`
      : `<b>ℹ Version vA35-2</b>, applicable aux opérations engagées <b>jusqu'au 28/10/2026</b>. La fiche révisée (forfaits environ ×3, PAC air/eau d'au moins 300 kW) s'applique aux opérations engagées à partir du 29/10/2026 : modifier la date d'engagement ci-dessus pour la simuler.`;
    document.getElementById('cond108').innerHTML = `<b>Conditions :</b> ${isV2 ? AGRI108_COND_V2 : AGRI108_COND_V1}`;
    document.getElementById('note108').innerHTML = isV2
      ? `Source : arrêté du 26/10/2026 portant révision de la fiche AGRI-TH-108 (JO du 28/10/2026, NOR ECOR2626133A) · Durée de vie conventionnelle 17 ans · kWh cumac = montant par m² × Smin, avec Smin = min [S ; 20 × P] (maraîchère) ou min [S ; 18 × P] (horticole) · PAC de classes ou de régimes différents en parallèle : retenir le montant par m² de la PAC la plus faible · Secteur agriculture : pas de tarif Précarité`
      : `Source : AGRI-TH-108 vA35-2 à compter du 01/10/2020 · Durée de vie conventionnelle 17 ans · kWh cumac = montant par m² × Smin, avec Smin = min [S ; 15 × P] (maraîchère) ou min [S ; 31 × P] (horticole) · PAC de classes différentes en parallèle : retenir le montant par m² de la PAC la plus faible · Secteur agriculture : pas de tarif Précarité`;

    const r = calcCore108(i0.S);
    const k = v.ratio[i0.serre];

    const warnElig = document.getElementById('warnElig-agri');
    if(!r.eligible){ warnElig.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warnElig.classList.add('show'); }
    else warnElig.classList.remove('show');

    const warnPlafond = document.getElementById('warnPlafond-agri');
    if(r.plafonne && i0.P > 0){
      warnPlafond.innerHTML = `⚠ <b>Surface plafonnée :</b> S = ${num(i0.S)} m² &gt; ${k} × P = ${num(r.plafondSurface)} m². Seuls ${num(r.Smin)} m² sont retenus dans le calcul.`;
      warnPlafond.classList.add('show');
    } else warnPlafond.classList.remove('show');

    const perf = r.petite ? v.etsLabels[r.lvl] : v.copLabels[r.lvl];
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Version de la fiche appliquée (date d'engagement)</span><span class="result-val" style="font-size:14px">${v.nom}</span></div>
      <div class="result-row"><span class="result-label">Montant unitaire — ${AGRI108_SERRES[i0.serre].toLowerCase()}, ${perf}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Surface retenue Smin = min [S ; ${k} × P]${r.plafonne ? ' — plafonnée' : ''}</span><span class="result-val" style="font-size:14px">${num(r.Smin)} m²</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
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
  // La date d'engagement (#regDate) est ajoutée après le rendu par addRegulatoryCheck :
  // écoute déléguée, puis recalcul une fois le panneau complet.
  body.addEventListener('input', e => { if(e.target && e.target.id === 'regDate') calc(); });
  calc();
  setTimeout(calc, 0);
}

function buildBareme108(wrap){
  const g = id => document.getElementById(id);
  const dateEl = g('regDate');
  const date = dateEl ? dateEl.value : new Date().toISOString().slice(0,10);
  const v = agri108VersionFor(date);
  const pc = parseFloat(g('f-pc').value)||0;
  const serre = g('f-serre-agri').value;
  const P = parseFloat(g('f-p-agri').value)||0;
  const ets = parseFloat(g('f-ets-agri').value)||0;
  const cop = parseFloat(g('f-cop-agri').value)||0;
  const petite = P <= AGRI108_SEUIL_KW;
  const curLvl = petite ? (ets >= v.etsHaut ? 'hi' : 'lo') : (cop >= 4 ? 'hi' : 'lo');

  let html = `<table class="bareme"><thead><tr><th>Puissance PAC</th><th>Performance</th><th>Type de serre</th><th>kWh cumac / m²</th><th>Prime / m² (classique)</th></tr></thead><tbody>`;
  [['ets', '≤ 400 kW', v.etsLabels, true], ['cop', '> 400 kW', v.copLabels, false]].forEach(([regime, regimeLabel, labels, isPetite])=>{
    ['lo','hi'].forEach((lvl, li)=>{
      ['maraichere','horticole'].forEach((s, si)=>{
        const m = v[regime][lvl][s];
        const isCur = petite === isPetite && lvl === curLvl && s === serre;
        html += `<tr class="${isCur?'hl':''}${si===1?' grp-end':''}">`;
        if(li === 0 && si === 0) html += `<td rowspan="4" style="text-align:left;font-weight:700">${regimeLabel}</td>`;
        if(si === 0) html += `<td rowspan="2">${labels[lvl]}</td>`;
        html += `<td>${s === 'maraichere' ? 'Maraîchère' : 'Horticole'}</td><td>${num(m)}</td><td class="num-c">${eur2(m/1000*pc)}</td></tr>`;
      });
    });
  });
  html += `</tbody></table><div class="source-note">Barème de la version « ${v.nom} », en kWh cumac par m² de serre chauffée. Multiplier par Smin = min [S ; ${v.ratio.maraichere} × P] (maraîchère) ou min [S ; ${v.ratio.horticole} × P] (horticole).</div>`;
  wrap.innerHTML = html;
}
