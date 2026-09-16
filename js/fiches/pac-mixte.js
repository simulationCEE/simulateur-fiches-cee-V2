// ═══════════════════════════════════════════════════════════════════════
// RENDER: PAC MIXTE — Bâtiment résidentiel + tertiaire, système commun
// Logique reprise de l'onglet "Simulateur Mixte" (BAREME_BAR_TH_171-177-179_BAT_TH_163.xlsx)
// Réutilise REF179 (défini dans bar-th-179.js) pour le barème BAR-TH-179.
// NB : le forfait BAT-TH-163 ci-dessous utilise les 3 bandes Etas OFFICIELLES
// (111-126% / 126-175% / 175%+), à la différence de la formule Excel source
// qui n'en distinguait que 2 (bug identifié et corrigé sur demande de Simon).
// ═══════════════════════════════════════════════════════════════════════
const FORFAIT_BAT163_MIXTE = {
  '111-126': {H1:1100, H2:900,  H3:600},
  '126-175': {H1:1200, H2:1000, H3:700},
  '175+':    {H1:1300, H2:1000, H3:700},
};
function bat163BandFromEtasKey179(etasKey){
  if(etasKey==='111-126') return '111-126';
  if(etasKey==='175-190' || etasKey==='190+') return '175+';
  return '126-175'; // '126-150' et '150-175'
}
const SECTEURS_MIXTE = [
  {value:1.2, label:"Bureaux (×1,2)"},
  {value:1.1, label:"Santé (×1,1)"},
  {value:0.8, label:"Enseignement (×0,8)"},
  {value:0.9, label:"Commerces (×0,9)"},
  {value:0.7, label:"Hôtellerie/Restauration (×0,7)"},
  {value:0.7, label:"Autres (×0,7)"},
];

function renderPACMixte(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> 1 seul système de chauffage commun aux deux secteurs · Même usage sur les deux secteurs (sinon dossier non éligible) · Facteur R = Ppac/Pch si &lt; 40 %, sinon R = 1</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Usage commun des deux secteurs</label><select id="f-usage"><option value="0">Chauffage seul</option><option value="1">Chauffage + ECS</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Classe Etas de la PAC</label>
        <select id="f-etas">
          <option value="111-126">111% ≤ Etas &lt; 126%</option>
          <option value="126-150">126% ≤ Etas &lt; 150%</option>
          <option value="150-175">150% ≤ Etas &lt; 175%</option>
          <option value="175-190">175% ≤ Etas &lt; 190%</option>
          <option value="190+">190% ≤ Etas</option>
        </select>
      </div>
      <div class="field"><label>Usages différents entre secteurs ?</label>
        <select id="f-usagesdiff"><option value="non">Non</option><option value="oui">Oui — ex. logements Chauf+ECS / commerces Chauf seul</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface résidentielle <span class="hint">m²</span></label><input type="number" id="f-surfres" value="600"></div>
      <div class="field"><label>Nombre de logements réels (N)</label><input type="number" id="f-nreel" value="10"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface tertiaire <span class="hint">m²</span></label><input type="number" id="f-surfter" value="500"></div>
      <div class="field"><label>Secteur d'activité tertiaire</label>
        <select id="f-secteur">${SECTEURS_MIXTE.map(s=>`<option value="${s.value}">${s.label}</option>`).join('')}</select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Puissance PAC(s) — Ppac <span class="hint">kW</span></label><input type="number" id="f-ppac" value="200"></div>
      <div class="field"><label>Puissance utile chaufferie — Pch <span class="hint">kW, hors secours</span></label><input type="number" id="f-pch" value="400"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Coup de Pouce ×3 ?</label><select id="f-cdp"><option value="non">Non</option><option value="oui">Oui</option></select></div>
      <div class="field"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc — résidentiel uniquement</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box" id="warnCasC"></div>
    <div class="warn-box show" id="warnPrecCas3" style="display:none"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">CAS 1 : résidentiel ≥ 75 % → BAR-TH-179 (surface tertiaire convertie en logements ÷ 65) · CAS 2 : tertiaire ≥ 75 % → BAT-TH-163 (surface totale) · CAS 3 : 25-75 % → double calcul, on retient le plus défavorable · Source interne EBS Énergie — logique métier, non une fiche CEE officielle indépendante</div>
  `);
  const baremeWrap = bareme(body, buildBaremeMixte);

  function calcMixte(){
    const zone = document.getElementById('f-zone').value;
    const etasKey = document.getElementById('f-etas').value;
    const usageIdx = parseInt(document.getElementById('f-usage').value);
    const surfRes = parseFloat(document.getElementById('f-surfres').value)||0;
    const nReel = parseFloat(document.getElementById('f-nreel').value)||0;
    const surfTer = parseFloat(document.getElementById('f-surfter').value)||0;
    const facteurSecteur = parseFloat(document.getElementById('f-secteur').value)||1;
    const ppac = parseFloat(document.getElementById('f-ppac').value)||0;
    const pch = parseFloat(document.getElementById('f-pch').value)||0;
    const cdp = document.getElementById('f-cdp').value==='oui';
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    const pp = parseFloat(document.getElementById('f-pp').value)||0;
    const usagesDifferents = document.getElementById('f-usagesdiff').value==='oui';

    const surfaceTotale = surfRes + surfTer;
    const pctRes = surfaceTotale>0 ? surfRes/surfaceTotale : 0;
    const R = pch>0 ? (ppac/pch>=0.4 ? 1 : ppac/pch) : 1;
    const mult = cdp?3:1;

    let cas;
    if(usagesDifferents) cas='C';
    else if(pctRes>=0.75) cas=1;
    else if(pctRes<=0.25) cas=2;
    else cas=3;

    const kwhcLogement = REF179[etasKey][zone][usageIdx];
    const band = bat163BandFromEtasKey179(etasKey);
    const kwhcM2 = FORFAIT_BAT163_MIXTE[band][zone];

    // CAS 1
    const logementsConvertis = Math.floor(surfTer/65);
    const nTotal = nReel + logementsConvertis;
    const totalKwhcCas1Brut = kwhcLogement*nTotal*R;
    const totalKwhcCas1 = totalKwhcCas1Brut*mult;
    const primeClassiqueCas1 = totalKwhcCas1/1000*pc;
    const primePrecariteCas1 = totalKwhcCas1/1000*pp;

    // CAS 2
    const totalKwhcCas2Brut = kwhcM2*facteurSecteur*surfaceTotale*R;
    const totalKwhcCas2 = totalKwhcCas2Brut*mult;
    const primeClassiqueCas2 = totalKwhcCas2/1000*pc;

    // CAS 3
    const kwhc179PurBrut = kwhcLogement*nReel*R;
    const kwhc163PurBrut = kwhcM2*facteurSecteur*surfaceTotale*R;
    const kwhc179Pur = kwhc179PurBrut*mult;
    const kwhc163Pur = kwhc163PurBrut*mult;
    const kwhcRetenuCas3 = Math.min(kwhc179Pur, kwhc163Pur);
    const ficheRetenue = kwhc179Pur<kwhc163Pur ? 'BAR-TH-179 (moins disant)' : (kwhc179Pur>kwhc163Pur ? 'BAT-TH-163 (moins disant)' : 'Égalité — secteur majoritaire');
    const primeClassiqueCas3 = kwhcRetenuCas3/1000*pc;

    return {
      zone, usageIdx, surfRes, nReel, surfTer, surfaceTotale, pctRes, R, mult, cas,
      logementsConvertis, nTotal, kwhcLogement, totalKwhcCas1, totalKwhcCas1Brut, primeClassiqueCas1, primePrecariteCas1,
      kwhcM2, totalKwhcCas2, totalKwhcCas2Brut, primeClassiqueCas2,
      kwhc179Pur, kwhc163Pur, kwhc179PurBrut, kwhc163PurBrut, kwhcRetenuCas3, ficheRetenue, primeClassiqueCas3,
    };
  }

  function calc(){
    const r = calcMixte();
    const warnCasC = document.getElementById('warnCasC');
    const warnPrec3 = document.getElementById('warnPrecCas3');

    if(r.cas==='C'){
      warnCasC.innerHTML = `⚠ <b>Dossier non éligible :</b> usages différents entre les deux secteurs (ex. logements Chauffage+ECS / commerces Chauffage seul). Ni BAR-TH-179 ni BAT-TH-163 ne peuvent être mobilisées sur un système commun dans ce cas.`;
      warnCasC.classList.add('show');
    } else {
      warnCasC.classList.remove('show');
    }
    warnPrec3.style.display = r.cas===3 ? '' : 'none';
    if(r.cas===3){
      warnPrec3.innerHTML = `⚠ <b>Prime Précarité non calculée pour le CAS 3 :</b> absente de la source Excel d'origine — cohérence avec le CAS 1 non tranchée. À valider avec le service conformité avant diffusion commerciale.`;
      warnPrec3.classList.add('show');
    }

    let resultsHtml = `
      <div class="result-row"><span class="result-label">Surface totale</span><span class="result-val" style="font-size:14px">${num(r.surfaceTotale)} m²</span></div>
      <div class="result-row"><span class="result-label">% Résidentiel / Total</span><span class="result-val" style="font-size:14px">${(r.pctRes*100).toFixed(1)} %</span></div>
      <div class="result-row"><span class="result-label">Facteur R</span><span class="result-val" style="font-size:14px">${r.R.toFixed(2)}</span></div>
      <div class="result-row hi"><span class="result-label">Cas applicable</span><span class="result-val" style="font-size:13px">${
        r.cas==='C' ? 'CAS C — Usages différents (non éligible)' :
        r.cas===1 ? 'CAS 1 — BAR-TH-179 (résidentiel ≥ 75 %)' :
        r.cas===2 ? 'CAS 2 — BAT-TH-163 (tertiaire ≥ 75 %)' :
        'CAS 3 — Double calcul (25 % < résidentiel < 75 %)'
      }</span></div>
    `;

    if(r.cas===1){
      resultsHtml += `
        <div class="result-row"><span class="result-label">Logements convertis depuis tertiaire</span><span class="result-val" style="font-size:14px">${num(r.logementsConvertis)}</span></div>
        <div class="result-row"><span class="result-label">N total (réels + convertis)</span><span class="result-val" style="font-size:14px">${num(r.nTotal)}</span></div>
        <div class="result-row"><span class="result-label">kWh cumac total ${r.mult>1?`(bonifié ×${r.mult}, brut ${kwh(r.totalKwhcCas1Brut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(r.totalKwhcCas1)}</span></div>
        <div class="result-row cdp"><span class="result-label">Prime Classique</span><span class="result-val">${eur(r.primeClassiqueCas1)}</span></div>
        <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(r.primePrecariteCas1)}</span></div>
      `;
    } else if(r.cas===2){
      resultsHtml += `
        <div class="result-row"><span class="result-label">kWh cumac total ${r.mult>1?`(bonifié ×${r.mult}, brut ${kwh(r.totalKwhcCas2Brut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(r.totalKwhcCas2)}</span></div>
        <div class="result-row cdp"><span class="result-label">Prime Classique</span><span class="result-val">${eur(r.primeClassiqueCas2)}</span></div>
        <div class="result-row"><span class="result-label">Prime Précarité</span><span class="result-val" style="font-size:13px;color:var(--text-3)">— (pas de précarité en tertiaire)</span></div>
      `;
    } else if(r.cas===3){
      resultsHtml += `
        <div class="result-row"><span class="result-label">[179] kWhc résidentiel pur ${r.mult>1?`(bonifié ×${r.mult})`:''}</span><span class="result-val" style="font-size:14px">${kwh(r.kwhc179Pur)}</span></div>
        <div class="result-row"><span class="result-label">[163] kWhc tertiaire pur ${r.mult>1?`(bonifié ×${r.mult})`:''}</span><span class="result-val" style="font-size:14px">${kwh(r.kwhc163Pur)}</span></div>
        <div class="result-row"><span class="result-label">Fiche retenue</span><span class="result-val" style="font-size:13px">${r.ficheRetenue}</span></div>
        <div class="result-row cdp"><span class="result-label">Prime Classique</span><span class="result-val">${eur(r.primeClassiqueCas3)}</span></div>
      `;
    }

    document.getElementById('results').innerHTML = resultsHtml;
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeMixte(wrap){
  const curZone = document.getElementById('f-zone').value;
  const curEtasKey = document.getElementById('f-etas').value;
  const curBand = bat163BandFromEtasKey179(curEtasKey);

  let html = `<div style="font-size:11px;font-weight:700;color:var(--text-2);padding:8px 12px 2px">BAR-TH-179 — kWh cumac / logement</div>`;
  html += `<table class="bareme"><thead><tr><th>Classe Etas</th><th>Zone</th><th>Chauffage</th><th>Chauff.+ECS</th></tr></thead><tbody>`;
  Object.keys(REF179).forEach(ek=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const [kc,ke] = REF179[ek][zone];
      const isCur = ek===curEtasKey && zone===curZone;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700">${ETAS179_LABELS[ek]}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(kc)}</td><td>${num(ke)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>`;

  html += `<div style="font-size:11px;font-weight:700;color:var(--text-2);padding:12px 12px 2px">BAT-TH-163 — kWh cumac / m² (3 bandes officielles)</div>`;
  html += `<table class="bareme"><thead><tr><th>Classe Etas</th><th>Zone</th><th>kWhc/m²</th></tr></thead><tbody>`;
  const bandLabels = {'111-126':'111% ≤ Etas < 126%','126-175':'126% ≤ Etas < 175%','175+':'175% ≤ Etas'};
  Object.keys(FORFAIT_BAT163_MIXTE).forEach(bk=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const v = FORFAIT_BAT163_MIXTE[bk][zone];
      const isCur = bk===curBand && zone===curZone;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700">${bandLabels[bk]}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>
  <div style="padding:10px 12px;font-size:10.5px;color:var(--text-3);line-height:1.6">
    Ces deux barèmes sont ceux des fiches BAR-TH-179 et BAT-TH-163 seules. La logique CAS 1/2/3 ci-dessus (répartition selon % résidentiel, conversion tertiaire → logements, double calcul) est une construction interne EBS Énergie — elle ne figure dans aucune fiche CEE officielle et doit être validée dossier par dossier avec le service conformité.
  </div>`;
  wrap.innerHTML = html;
}
