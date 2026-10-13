// ═══════════════════════════════════════════════════════════════════════
// RENDER: IND-UT-137 (Système de pompe(s) à chaleur en rehausse de température
//                     de chaleur fatale récupérée)
// Source : fiche d'opération standardisée IND-UT-137 vA84-3 à compter du 25/05/2026
//          (opérations engagées avant le 01/01/2031 — durée de vie conventionnelle 14 ans).
// Formule : kWh cumac = 10,986 × (Q − Eélec)
//   Q     = énergie thermique annuelle fournie en sortie du système (kWh/an)
//   Eélec = énergie électrique annuelle absorbée : compresseurs + auxiliaires (kWh/an)
// Conditions de performance : COP annuel moyen = Q / Eélec ≥ COP annuel moyen minimal
//   (tableau selon l'écart de température ΔT et la température en sortie de condenseur).
// Secteur industrie uniquement → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const COEF_INDUT137 = 10.986;
const PUISSANCE_MAX_KW_INDUT137 = 5000;   // 5 MW (puissance thermique « chaud »)
const PRG_MAX_INDUT137 = 150;             // PRG du ou des fluides frigorigènes strictement inférieur

// COP annuel moyen minimal : [ΔT (K), si T sortie condenseur ≤ 100 °C, si T sortie condenseur > 100 °C]
const COP_MIN_INDUT137 = [
  ['< 30',5.9,4.5],[30,5.9,4.5],[31,5.7,4.3],[32,5.5,4.2],[33,5.4,4.1],[34,5.2,3.9],[35,5.1,3.8],[36,4.9,3.7],
  [37,4.8,3.6],[38,4.7,3.5],[39,4.5,3.4],[40,4.4,3.4],[41,4.3,3.3],[42,4.2,3.2],[43,4.1,3.1],[44,4.0,3.1],
  [45,3.9,3.0],[46,3.9,2.9],[47,3.8,2.9],[48,3.7,2.8],[49,3.6,2.7],[50,3.5,2.7],[51,3.5,2.6],[52,3.4,2.6],
  [53,3.3,2.5],[54,3.3,2.5],[55,3.2,2.4],[56,3.2,2.4],[57,3.1,2.4],[58,3.1,2.3],[59,3.0,2.3],[60,3.0,2.2],
  [61,2.9,2.2],[62,2.9,2.2],[63,2.8,2.1],[64,2.8,2.1],[65,2.7,2.1],[66,2.7,2.0],[67,2.6,2.0],[68,2.6,2.0],
  [69,2.6,2.0],['≥ 70',2.5,2.0],
];

// Ligne du tableau applicable à un écart de température (lecture prudente : arrondi à l'entier inférieur).
function copMinRowIndUt137(dt){
  const n = COP_MIN_INDUT137.length;
  if(dt < 30) return {idx:0, row:COP_MIN_INDUT137[0]};
  if(dt >= 70) return {idx:n-1, row:COP_MIN_INDUT137[n-1]};
  const idx = Math.floor(dt) - 29;           // ΔT 30 → index 1
  return {idx, row:COP_MIN_INDUT137[idx]};
}

const SOURCES_INDUT137 = {
  fatale: { label:"Chaleur fatale d'un process industriel du site", ok:true },
  frigo:  { label:"Process refroidi en circuit fermé (évaporateur d'un groupe frigorifique)", ok:false, motif:"chaleur issue du refroidissement d'un process en circuit fermé côté évaporateur d'un groupe frigorifique : non éligible" },
  secours:{ label:"Effluents d'un équipement de secours", ok:false, motif:"chaleur émise par les effluents d'un équipement de secours : non éligible" },
  autre:  { label:"Géothermie, aérothermie, solaire thermique, cogénération…", ok:false, motif:"cette chaleur n'est pas de la chaleur fatale (géothermie, aérothermie, solaire thermique, cogénération, chaussées thermoactives)" },
};

function renderINDUT137(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Secteur industrie · Système de PAC à compression de vapeur entraînée par moteur électrique, en rehausse de température d'une chaleur fatale récupérée sur le site · Puissance thermique « chaud » ≤ 5 MW · Fluide en entrée ≥ 25 °C pendant au moins 90 jours par an, température moyenne annuelle &gt; 18 °C · PRG du ou des fluides frigorigènes &lt; 150 · COP annuel moyen (Q / Eélec) ≥ COP minimal du tableau selon l'écart de température · <b>Étude de dimensionnement</b> datée et signée · Mesures (wattmètre, énergie thermique au condenseur et à l'évaporateur) conservées 6 ans · Système utilisé <b>une seule fois</b> par source · Non cumulable avec IND-UT-103, IND-UT-118, IND-UT-138 et IND-UT-139 pour une même fraction de chaleur fatale · Engagement avant le 01/01/2031</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Source de chaleur récupérée</label>
        <select id="f-source137">${Object.entries(SOURCES_INDUT137).map(([k,v])=>`<option value="${k}">${v.label}</option>`).join('')}</select>
      </div>
      <div class="field"><label>Fluide en entrée de la PAC ≥ 25 °C pendant au moins 90 jours par an, moyenne annuelle &gt; 18 °C</label>
        <select id="f-fluide137"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Énergie thermique annuelle fournie Q <span class="hint">kWh/an, en sortie du système (étude de dimensionnement)</span></label><input type="number" id="f-q137" value="5000000" min="0" step="10000"></div>
      <div class="field"><label>Énergie électrique annuelle absorbée Eélec <span class="hint">kWh/an, compresseurs + auxiliaires</span></label><input type="number" id="f-e137" value="1000000" min="0" step="10000"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Écart de température ΔT <span class="hint">K, sortie condenseur − sortie évaporateur</span></label><input type="number" id="f-dt137" value="40" min="0" step="1"></div>
      <div class="field"><label>Température du fluide en sortie de condenseur</label>
        <select id="f-tcond137"><option value="bas">Inférieure ou égale à 100 °C</option><option value="haut">Supérieure à 100 °C</option></select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance thermique maximale du système <span class="hint">kW, « chaud », ≤ 5 000 kW</span></label><input type="number" id="f-p137" value="1000" min="0" step="10"></div>
      <div class="field"><label>PRG du fluide frigorigène <span class="hint">doit être &lt; 150</span></label><input type="number" id="f-prg137" value="3" min="0" step="1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnElig137"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : IND-UT-137 vA84-3 à compter du 25/05/2026 · Durée de vie conventionnelle 14 ans · kWh cumac = 10,986 × (Q − Eélec) · Q et Eélec sont ceux de l'étude de dimensionnement ; le système installé doit fournir au moins Q et absorber au plus Eélec · ΔT : le tableau est lu à l'entier inférieur (lecture prudente) · Secteur industrie : pas de tarif Précarité · Cette version porte la puissance « chaud » à 5 MW (2 MW dans la version précédente)</div>
  `);
  const baremeWrap = bareme(body, buildBareme137);

  function read137(){
    return {
      source: document.getElementById('f-source137').value,
      fluideOk: document.getElementById('f-fluide137').value === 'oui',
      Q: parseFloat(document.getElementById('f-q137').value)||0,
      E: parseFloat(document.getElementById('f-e137').value)||0,
      dt: parseFloat(document.getElementById('f-dt137').value)||0,
      haut: document.getElementById('f-tcond137').value === 'haut',
      P: parseFloat(document.getElementById('f-p137').value)||0,
      prg: parseFloat(document.getElementById('f-prg137').value),
      pc: parseFloat(document.getElementById('f-pc').value)||0,
    };
  }

  // Calcul unique — résultat principal et tableau d'écart. Qval = énergie thermique annuelle Q (kWh/an).
  function calcCore137(Qval){
    const i = read137();
    const {idx, row} = copMinRowIndUt137(i.dt);
    const copMin = i.haut ? row[2] : row[1];
    const cop = i.E > 0 ? Qval / i.E : 0;
    const pbs = [];
    if(!SOURCES_INDUT137[i.source].ok) pbs.push(SOURCES_INDUT137[i.source].motif);
    if(!i.fluideOk) pbs.push("fluide en entrée : il doit être ≥ 25 °C au moins 90 jours par an, avec une moyenne annuelle > 18 °C");
    if(i.P > PUISSANCE_MAX_KW_INDUT137) pbs.push(`puissance thermique « chaud » ${num(i.P)} kW supérieure à 5 MW`);
    if(Number.isFinite(i.prg) && i.prg >= PRG_MAX_INDUT137) pbs.push(`PRG ${num(i.prg)} ≥ 150`);
    if(!Number.isFinite(i.prg)) pbs.push('PRG du fluide frigorigène non renseigné');
    if(Qval <= 0 || i.E <= 0) pbs.push('énergies Q et Eélec à renseigner');
    else if(cop + 1e-9 < copMin) pbs.push(`COP annuel moyen ${cop.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})} inférieur au minimum de ${copMin.toLocaleString('fr-FR',{minimumFractionDigits:1})} requis`);
    const eligible = pbs.length === 0;
    const net = Math.max(0, Qval - i.E);
    const kwhc = eligible ? COEF_INDUT137 * net : 0;
    return {kwh:kwhc, prime:kwhc/1000*i.pc, cop, copMin, idx, net, eligible, pbs, i};
  }

  let adjWrap;
  function calc(){
    const i0 = read137();
    const r = calcCore137(i0.Q);

    const warn = document.getElementById('warnElig137');
    if(!r.eligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${r.pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const fr = (v,d)=>v.toLocaleString('fr-FR',{minimumFractionDigits:d,maximumFractionDigits:d});
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">COP annuel moyen Q / Eélec (minimum requis : ${fr(r.copMin,1)})</span><span class="result-val" style="font-size:14px">${i0.E>0 ? fr(r.cop,2) : '—'}</span></div>
      <div class="result-row"><span class="result-label">Énergie thermique nette (Q − Eélec)</span><span class="result-val" style="font-size:14px">${num(r.net)} kWh/an</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total (10,986 × net)${r.eligible ? '' : ' (non éligible)'}</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'kWh/an', paramLabel:'Énergie thermique Q', defaultStep:500000, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-q137').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCore137(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

// Tableau des COP annuels moyens minimaux, présenté en deux blocs pour tenir sur une page.
function buildBareme137(wrap){
  const dt = parseFloat(document.getElementById('f-dt137').value)||0;
  const haut = document.getElementById('f-tcond137').value === 'haut';
  const curIdx = copMinRowIndUt137(dt).idx;
  const n = COP_MIN_INDUT137.length, half = n/2;
  const fmt = v => v.toLocaleString('fr-FR',{minimumFractionDigits:1,maximumFractionDigits:1});
  const cell = (k, rowIdx) => {
    const [label, bas, hautv] = COP_MIN_INDUT137[rowIdx];
    const cur = rowIdx === curIdx;
    const st = cur ? ' style="background:#FFF6DD;font-weight:700"' : '';
    const stBas = cur && !haut ? ' style="background:#FFE9A8;font-weight:800"' : st;
    const stHaut = cur && haut ? ' style="background:#FFE9A8;font-weight:800"' : st;
    return `<td${st}>${label}</td><td${stBas}>${fmt(bas)}</td><td${stHaut}>${fmt(hautv)}</td>`;
  };
  let html = `<table class="bareme"><thead><tr><th>ΔT (K)</th><th>COP min si ≤ 100 °C</th><th>COP min si &gt; 100 °C</th><th>ΔT (K)</th><th>COP min si ≤ 100 °C</th><th>COP min si &gt; 100 °C</th></tr></thead><tbody>`;
  for(let r=0; r<half; r++){
    html += `<tr class="${(r+1)%10===0?'grp-end':''}">${cell(0,r)}${cell(1,r+half)}</tr>`;
  }
  html += `</tbody></table><div class="source-note">COP annuel moyen minimal (Q / Eélec) selon l'écart de température entre le fluide caloporteur en sortie du condenseur et le fluide frigoporteur en sortie de l'évaporateur, et selon la température de sortie du condenseur. Valeurs de la fiche IND-UT-137 vA84-3.</div>`;
  wrap.innerHTML = html;
}
