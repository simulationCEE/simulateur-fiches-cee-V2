// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-TH-162 (Système géothermique — bâtiments tertiaires existants)
// Source : fiche d'opération standardisée BAT-TH-162 vA81-2 à compter du 30/04/2026
//          (opérations engagées jusqu'au 31/12/2030 — durée de vie conventionnelle 25 ans).
// Formule : kWh cumac = montant par m² (Etas ou COP × zone × usage) × S × facteur secteur × R
//           × coefficient Coup de Pouce (×5 si remplacement d'une chaudière charbon, fioul ou gaz)
//   S = surface chauffée par le système géothermique (m²)
//   R = rapport P(PAC installées) / P(chaufferie après travaux) si ce rapport est < 40 %, sinon 1
// Tertiaire → pas de tarif Précarité.
// ⚠ Le Coup de Pouce ×5 repose sur des sources secondaires concordantes (arrêté du 27/04/2026) :
//   à reconfirmer sur le texte officiel.
// ═══════════════════════════════════════════════════════════════════════
const GEO162_ETS = {                 // PAC ≤ 400 kW : [Chauffage, Chauffage et ECS] en kWhc/m²
  '111-126': { H1:[1400,1600], H2:[1100,1400], H3:[800,1000] },
  '126-175': { H1:[1500,1800], H2:[1200,1500], H3:[800,1100] },
  '175+':    { H1:[1600,1900], H2:[1300,1600], H3:[900,1200] },
};
const GEO162_COP = {                 // PAC > 400 kW
  '4-5': { H1:[1500,1800], H2:[1300,1500], H3:[800,1100] },
  '5+':  { H1:[1600,1900], H2:[1300,1600], H3:[900,1200] },
};
const GEO162_CLASSES_ETS = { '111-126':'111 % ≤ Etas < 126 %', '126-175':'126 % ≤ Etas < 175 %', '175+':'175 % ≤ Etas' };
const GEO162_CLASSES_COP = { '4-5':'4 ≤ COP < 5', '5+':'5 ≤ COP' };
const GEO162_SECTEURS = {
  bureaux:    { label:'Bureaux (×1,2)',                  f:1.2 },
  sante:      { label:'Santé (×1,1)',                    f:1.1 },
  enseign:    { label:'Enseignement (×0,8)',             f:0.8 },
  commerces:  { label:'Commerces (×0,9)',                f:0.9 },
  hotel:      { label:'Hôtellerie, restauration (×0,7)', f:0.7 },
  autres:     { label:'Autres (×0,7)',                   f:0.7 },
};
const GEO162_SEUIL_KW = 400;
const GEO162_PUISSANCE_MIN_KW = 30;
const GEO162_COP_MIN = { sondes:4, nappe:4.5 };          // PAC > 400 kW
const GEO162_COEF_COUP_DE_POUCE = 5;

function renderBAT162(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Bâtiments tertiaires existants · Captage géothermique (échangeur ouvert sur aquifère superficiel &lt; 200 m, ou fermé sur sondes) associé à une ou plusieurs PAC eau/eau ou eau glycolée/eau d'au moins 30 kW au total · Chauffage, ou chauffage et ECS (ECS seule exclue) · Pas de raccordement à un réseau de chaleur ou de froid, ni à une boucle d'eau tempérée géothermique · ≤ 400 kW : Etas ≥ 111 % (moyenne/haute température) ou ≥ 126 % (basse température) · &gt; 400 kW : COP ≥ 4 (eau glycolée/eau) ou ≥ 4,5 (eau/eau) · Rafraîchissement éventuel : EER ≥ 3,6 ; geocooling : SEER &gt; 20 (sondes) ou &gt; 14 (nappe) · <b>Étude de dimensionnement</b> et étude des ressources géothermiques par des professionnels RGE Études (OPQIBI 10.07 et 20.13) · Non cumulable avec BAT-TH-164 pour la même PAC · Engagement jusqu'au 31/12/2030</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Secteur d'activité</label>
        <select id="f-sect162">${Object.entries(GEO162_SECTEURS).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Surface chauffée par le système géothermique <span class="hint">m²</span></label><input type="number" id="f-surf162" value="3000" min="0" step="50"></div>
      <div class="field"><label>Usage couvert par la PAC</label>
        <select id="f-usage162"><option value="chauffage">Chauffage seul</option><option value="chauffage_ecs">Chauffage et eau chaude sanitaire</option><option value="ecs">Eau chaude sanitaire seule</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Type de captage et de PAC</label>
        <select id="f-capt162"><option value="sondes">Eau glycolée/eau sur sondes géothermiques</option><option value="nappe">Eau/eau sur aquifère superficiel (&lt; 200 m)</option></select>
      </div>
      <div class="field"><label>Puissance thermique nominale de la PAC <span class="hint">kW, somme des PAC installées</span></label><input type="number" id="f-ppac162" value="200" min="0" step="1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="field-ets162"><label>Efficacité énergétique saisonnière Etas <span class="hint">%, PAC seule hors régulation</span></label><input type="number" id="f-ets162" value="140" min="0" step="1"></div>
      <div class="field" id="field-cop162"><label>COP mesuré <span class="hint">EN 14511-2</span></label><input type="number" id="f-cop162" value="4.5" min="0" step="0.1"></div>
      <div class="field" id="field-emet162"><label>Type d'émetteurs de chauffage</label>
        <select id="f-emet162"><option value="basse">Plancher chauffant, ventilo-convecteurs…</option><option value="autre">Autres (radiateurs, mixtes…)</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance utile de la chaufferie après travaux <span class="hint">kW, hors secours, PAC incluses</span></label><input type="number" id="f-pch162" value="400" min="0" step="1"></div>
      <div class="field"><label>Refroidissement du bâtiment</label>
        <select id="f-froid162"><option value="aucun">Aucun</option><option value="actif">Rafraîchissement actif (PAC réversible, thermofrigopompe)</option><option value="geo_sondes">Geocooling sur sondes</option><option value="geo_nappe">Geocooling sur nappe</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="field-eer162"><label>EER ou SEER du refroidissement <span class="hint">EER ≥ 3,6 · SEER &gt; 20 (sondes) ou &gt; 14 (nappe)</span></label><input type="number" id="f-eer162" value="4" min="0" step="0.1"></div>
      <div class="field"><label>Remplacement d'une chaudière à combustible fossile</label>
        <select id="f-fossile162"><option value="non">Non</option><option value="oui">Oui — charbon / fioul / gaz (Coup de Pouce ×5)</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig162"></div>
    <div class="warn-box" id="warnR162"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-TH-162 vA81-2 à compter du 30/04/2026 · Durée de vie conventionnelle 25 ans · kWh cumac = montant par m² × S × facteur secteur × facteur R × Coup de Pouce · Plusieurs PAC de classes ou de régimes différents : retenir le montant par m² de la PAC la plus faible · Aucune nouvelle opération de remplacement des équipements installés ne peut donner lieu à des certificats pendant la durée de vie · Tertiaire : pas de tarif Précarité · Coup de Pouce ×5 en remplacement d'une chaudière charbon, fioul ou gaz : à reconfirmer sur l'arrêté du 27/04/2026</div>
  `);
  const baremeWrap = bareme(body, buildBareme162);

  function read162(){
    return {
      sect: GEO162_SECTEURS[document.getElementById('f-sect162').value].f,
      zone: document.getElementById('f-zone').value,
      S: parseFloat(document.getElementById('f-surf162').value)||0,
      usage: document.getElementById('f-usage162').value,
      capt: document.getElementById('f-capt162').value,
      P: parseFloat(document.getElementById('f-ppac162').value)||0,
      ets: parseFloat(document.getElementById('f-ets162').value)||0,
      cop: parseFloat(document.getElementById('f-cop162').value)||0,
      emet: document.getElementById('f-emet162').value,
      pch: parseFloat(document.getElementById('f-pch162').value)||0,
      froid: document.getElementById('f-froid162').value,
      eer: parseFloat(document.getElementById('f-eer162').value)||0,
      fossile: document.getElementById('f-fossile162').value === 'oui',
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal, tableau d'écart et simulateur inversé. S = surface chauffée (m²).
  function calcCore162(S){
    const i = read162();
    const petite = i.P <= GEO162_SEUIL_KW;
    // Application de la PAC (≤ 400 kW) : basse température uniquement pour un système chauffage seul
    // avec émetteurs basse température ; chauffage + ECS ou autres émetteurs : moyenne/haute température.
    const basse = i.usage === 'chauffage' && i.emet === 'basse';
    const classe = petite ? (i.ets >= 175 ? '175+' : (i.ets >= 126 ? '126-175' : '111-126')) : (i.cop >= 5 ? '5+' : '4-5');
    const col = i.usage === 'chauffage' ? 0 : 1;               // colonne « Chauffage » ou « Chauffage et ECS »
    const unit = (petite ? GEO162_ETS : GEO162_COP)[classe][i.zone][col];

    const pbs = [];
    if(i.usage === 'ecs') pbs.push("système installé uniquement pour l'eau chaude sanitaire : pas de certificats");
    if(i.P <= 0) pbs.push('puissance thermique nominale non renseignée');
    else if(i.P < GEO162_PUISSANCE_MIN_KW) pbs.push(`puissance ${num(i.P)} kW inférieure au minimum de ${GEO162_PUISSANCE_MIN_KW} kW`);
    if(petite && i.P > 0){
      const seuil = basse ? 126 : 111;
      if(i.ets < seuil) pbs.push(`Etas ${i.ets.toLocaleString('fr-FR',{maximumFractionDigits:1})} % inférieur au minimum de ${seuil} % (application ${basse ? 'basse' : 'moyenne ou haute'} température)`);
    }
    if(!petite){
      const min = GEO162_COP_MIN[i.capt];
      if(i.cop < min) pbs.push(`COP ${i.cop.toLocaleString('fr-FR')} inférieur au minimum de ${min.toLocaleString('fr-FR')} (${i.capt === 'nappe' ? 'eau/eau' : 'eau glycolée/eau'})`);
    }
    if(i.froid === 'actif' && i.eer < 3.6) pbs.push(`EER ${i.eer.toLocaleString('fr-FR')} inférieur au minimum de 3,6`);
    if(i.froid === 'geo_sondes' && !(i.eer > 20)) pbs.push('SEER du geocooling sur sondes : doit être supérieur à 20');
    if(i.froid === 'geo_nappe' && !(i.eer > 14)) pbs.push('SEER du geocooling sur nappe : doit être supérieur à 14');
    if(S <= 0) pbs.push('surface chauffée non renseignée');
    const eligible = pbs.length === 0;

    const ratio = i.pch > 0 ? i.P / i.pch : 1;
    const R = (i.pch > 0 && ratio < 0.4) ? ratio : 1;
    const coef = i.fossile ? GEO162_COEF_COUP_DE_POUCE : 1;
    const kwhc = eligible ? unit * i.sect * S * R * coef : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, unit, R, ratio, coef, eligible, pbs, petite, basse, classe, col, i};
  }

  let adjWrap, revWrap;
  function calc(){
    const i0 = read162();
    // Champs conditionnels (display:none = exclus du comparatif / PDF)
    const petite = i0.P <= GEO162_SEUIL_KW;
    document.getElementById('field-ets162').style.display = petite ? '' : 'none';
    document.getElementById('field-cop162').style.display = petite ? 'none' : '';
    document.getElementById('field-emet162').style.display = (petite && i0.usage === 'chauffage') ? '' : 'none';
    document.getElementById('field-eer162').style.display = i0.froid === 'aucun' ? 'none' : '';

    const r = calcCore162(i0.S);

    const warn = document.getElementById('warnElig162');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const warnR = document.getElementById('warnR162');
    if(i0.pch > 0 && i0.P > i0.pch){
      warnR.innerHTML = `⚠ <b>Incohérence :</b> la puissance utile de la chaufferie (${num(i0.pch)} kW) inclut les PAC installées (${num(i0.P)} kW) : elle ne peut pas être inférieure. Facteur R retenu : 1.`;
      warnR.classList.add('show');
    } else warnR.classList.remove('show');

    const regime = r.petite
      ? `≤ 400 kW (Etas) — application ${r.basse ? 'basse' : 'moyenne ou haute'} température`
      : `&gt; 400 kW (COP) — ${i0.capt === 'nappe' ? 'eau/eau' : 'eau glycolée/eau'}`;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Régime et application</span><span class="result-val" style="font-size:13px">${regime}</span></div>
      <div class="result-row"><span class="result-label">Montant unitaire — ${r.petite ? GEO162_CLASSES_ETS[r.classe] : GEO162_CLASSES_COP[r.classe]}, ${i0.zone}, ${r.col === 0 ? 'chauffage' : 'chauffage et ECS'}</span><span class="result-val" style="font-size:14px">${num(r.unit)} kWhc / m²</span></div>
      <div class="result-row"><span class="result-label">Facteur secteur</span><span class="result-val" style="font-size:14px">×${i0.sect.toLocaleString('fr-FR')}</span></div>
      <div class="result-row"><span class="result-label">Facteur R</span><span class="result-val" style="font-size:14px">${r.R.toFixed(2)}</span></div>
      <div class="result-row"><span class="result-label">Bonification Coup de Pouce</span><span class="result-val" style="font-size:14px">${r.coef > 1 ? '×' + r.coef : 'Aucune'}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface chauffée', defaultStep:500, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf162').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore162(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:200000,
        calc: (val) => { const res = calcCore162(val); return {prime:res.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }

  // Valeur par défaut pertinente quand on choisit un type de refroidissement
  document.getElementById('f-froid162').addEventListener('change', e => {
    const def = {actif:4, geo_sondes:25, geo_nappe:16}[e.target.value];
    if(def !== undefined){ document.getElementById('f-eer162').value = def; }
  });
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  document.getElementById('f-froid162').addEventListener('change', calc);
  calc();
}

function buildBareme162(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const zone = document.getElementById('f-zone').value;
  const P = parseFloat(document.getElementById('f-ppac162').value)||0;
  const ets = parseFloat(document.getElementById('f-ets162').value)||0;
  const cop = parseFloat(document.getElementById('f-cop162').value)||0;
  const usage = document.getElementById('f-usage162').value;
  const petite = P <= GEO162_SEUIL_KW;
  const curClasse = petite ? (ets >= 175 ? '175+' : (ets >= 126 ? '126-175' : '111-126')) : (cop >= 5 ? '5+' : '4-5');
  const curCol = usage === 'chauffage' ? 0 : 1;
  const hlCell = 'style="box-shadow:inset 0 0 0 1.5px #E8C15A"';

  let html = `<table class="bareme"><thead><tr><th>Puissance PAC</th><th>Performance</th><th>Zone</th><th>Chauffage (kWhc/m²)</th><th>Chauffage + ECS (kWhc/m²)</th><th>Prime/m² chauffage</th><th>Prime/m² chauffage + ECS</th></tr></thead><tbody>`;
  [[GEO162_ETS, GEO162_CLASSES_ETS, '≤ 400 kW', true], [GEO162_COP, GEO162_CLASSES_COP, '> 400 kW', false]].forEach(([table, classes, regimeLabel, isPetite])=>{
    const keys = Object.keys(classes);
    const rowsInRegime = keys.length * 3;
    keys.forEach((ck, ci)=>{
      ['H1','H2','H3'].forEach((z, zi)=>{
        const [chf, ecs] = table[ck][z];
        const isCur = petite === isPetite && ck === curClasse && z === zone;
        html += `<tr class="${isCur?'hl':''}${zi===2?' grp-end':''}">`;
        if(ci === 0 && zi === 0) html += `<td rowspan="${rowsInRegime}" style="text-align:left;font-weight:700">${regimeLabel}</td>`;
        if(zi === 0) html += `<td rowspan="3">${classes[ck]}</td>`;
        html += `<td class="zone-cell z-${z.toLowerCase()}">${z}</td>`;
        html += `<td ${isCur && curCol===0 ? hlCell : ''}>${num(chf)}</td><td ${isCur && curCol===1 ? hlCell : ''}>${num(ecs)}</td>`;
        html += `<td class="num-c">${eur2(chf/1000*pc)}</td><td class="num-c">${eur2(ecs/1000*pc)}</td></tr>`;
      });
    });
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par m² de surface chauffée, avant facteurs. La prime réelle = forfait × facteur secteur × surface chauffée × facteur R × coefficient Coup de Pouce × prix ÷ 1 000. Facteurs secteur : bureaux 1,2 · santé 1,1 · commerces 0,9 · enseignement 0,8 · hôtellerie-restauration et autres 0,7.</div>`;
  wrap.innerHTML = html;
}
