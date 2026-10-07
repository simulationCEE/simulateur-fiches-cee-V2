// ═══════════════════════════════════════════════════════════════════════
// RENDER: IND-UT-103 (Système de récupération de chaleur sur un compresseur d'air)
// Source : fiche d'opération standardisée IND-UT-103 vA17.2
// Formule : kWh cumac = Forfait (usage × mode × zone) × P
//   P = puissance thermique de l'échangeur (kW th) si échangeur,
//       sinon puissance électrique nominale du compresseur (kW él),
//   P limitée dans tous les cas à la puissance électrique nominale du compresseur.
// Secteur industrie uniquement → pas de tarif Précarité.
// ═══════════════════════════════════════════════════════════════════════
const MODES_INDUT103 = {
  '1x8':    '1x8h',
  '2x8':    '2x8h',
  '3x8we':  '3x8h avec arrêt le week-end',
  '3x8sans':'3x8h sans arrêt le week-end',
};
const FORFAIT_INDUT103 = {
  // Chauffage de locaux ou eau chaude sanitaire : dépend de la zone climatique
  chauffage: {
    '1x8':    { H1: 6400,  H2: 6000,  H3: 5000  },
    '2x8':    { H1: 15900, H2: 15000, H3: 12600 },
    '3x8we':  { H1: 19700, H2: 18600, H3: 15600 },
    '3x8sans':{ H1: 26700, H2: 25200, H3: 21100 },
  },
  // Procédé industriel : forfait identique quelle que soit la zone
  procede: {
    '1x8':    10300,
    '2x8':    25600,
    '3x8we':  31800,
    '3x8sans':43100,
  },
};

function forfaitIndUt103(usage, mode, zone){
  return usage === 'procede'
    ? FORFAIT_INDUT103.procede[mode]
    : FORFAIT_INDUT103.chauffage[mode][zone];
}

function renderINDUT103(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Secteur industrie uniquement · Valorisation sur site (chauffage de locaux, ECS ou procédé) · Mise en place par un professionnel · Exclu : récupération interne au compresseur pour régénérer un sécheur d'air · Non cumulable avec IND-BA-112 si le compresseur est raccordé à la tour aéroréfrigérante</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Valorisation de la chaleur</label>
        <select id="f-usage103">
          <option value="chauffage">Chauffage de locaux ou eau chaude sanitaire</option>
          <option value="procede">Procédé industriel</option>
        </select>
      </div>
      <div class="field"><label>Mode de fonctionnement du site</label>
        <select id="f-mode103">
          ${Object.entries(MODES_INDUT103).map(([k,v])=>`<option value="${k}"${k==='2x8'?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="field-zone103"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Puissance électrique nominale du compresseur <span class="hint">kW, plaque signalétique</span></label><input type="number" id="f-pcomp103" value="90" min="0" step="0.1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Système avec échangeur</label>
        <select id="f-ech103"><option value="oui">Oui</option><option value="non">Non (tuyauterie / gainage)</option></select>
      </div>
      <div class="field" id="field-pech103"><label>Puissance thermique de l'échangeur <span class="hint">kW thermiques</span></label><input type="number" id="f-pech103" value="70" min="0" step="0.1"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnPlafond103"></div>
    <div class="warn-box" id="warnSaisie103"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : IND-UT-103 vA17.2 · Durée de vie conventionnelle 13 ans · P limitée à la puissance électrique nominale du compresseur · Puissance thermique : plaque signalétique de l'échangeur, à défaut note de dimensionnement de l'installateur ou document fabricant · Secteur industrie : pas de tarif Précarité</div>
  `);
  const baremeWrap = bareme(body, buildBareme103);

  // Lit le formulaire et retourne la puissance P retenue (avant écart éventuel)
  function readInputs103(){
    const usage = document.getElementById('f-usage103').value;
    const mode = document.getElementById('f-mode103').value;
    const zone = document.getElementById('f-zone').value;
    const pcomp = parseFloat(document.getElementById('f-pcomp103').value)||0;
    const avecEch = document.getElementById('f-ech103').value === 'oui';
    const pech = parseFloat(document.getElementById('f-pech103').value)||0;
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    return {usage, mode, zone, pcomp, avecEch, pech, pc};
  }

  // Calcul unique — utilisé par le résultat principal et le tableau d'écart.
  // pInput = puissance saisie (échangeur ou compresseur), avant plafonnement.
  function calcCore103(pInput){
    const {usage, mode, zone, pcomp, pc} = readInputs103();
    const forfait = forfaitIndUt103(usage, mode, zone);
    const pRetenue = Math.max(0, Math.min(pInput, pcomp));
    const kwhc = forfait * pRetenue;
    return {kwh:kwhc, prime:kwhc/1000*pc, forfait, pRetenue, plafonne: pInput > pcomp};
  }

  let adjWrap;

  function calc(){
    const {usage, pcomp, avecEch, pech} = readInputs103();

    // Champs conditionnels (display:none = exclus du comparatif / PDF)
    document.getElementById('field-zone103').style.display = usage === 'procede' ? 'none' : '';
    document.getElementById('field-pech103').style.display = avecEch ? '' : 'none';

    const pInput = avecEch ? pech : pcomp;
    const r = calcCore103(pInput);

    const warnPlafond = document.getElementById('warnPlafond103');
    if(avecEch && r.plafonne){
      warnPlafond.innerHTML = `⚠ <b>Puissance plafonnée :</b> échangeur ${num(pech)} kW &gt; compresseur ${num(pcomp)} kW. La fiche limite P à la puissance électrique nominale du compresseur, soit ${num(pcomp)} kW retenus.`;
      warnPlafond.classList.add('show');
    } else {
      warnPlafond.classList.remove('show');
    }
    const warnSaisie = document.getElementById('warnSaisie103');
    if(pcomp <= 0 || (avecEch && pech <= 0)){
      warnSaisie.innerHTML = `⚠ <b>Saisie incomplète :</b> renseigne ${pcomp<=0 ? 'la puissance électrique du compresseur' : 'la puissance thermique de l\'échangeur'} pour obtenir un montant.`;
      warnSaisie.classList.add('show');
    } else {
      warnSaisie.classList.remove('show');
    }

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Forfait unitaire</span><span class="result-val" style="font-size:14px">${num(r.forfait)} kWhc / kW</span></div>
      <div class="result-row"><span class="result-label">Puissance P retenue ${avecEch ? '(échangeur, kW th)' : '(compresseur, kW él)'}${r.plafonne && avecEch ? ' — plafonnée' : ''}</span><span class="result-val" style="font-size:14px">${num(r.pRetenue)} kW</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'kW', paramLabel:'Puissance P', defaultStep:10, defaultRep:2,
        getBase: () => {
          const i = readInputs103();
          return i.avecEch ? i.pech : i.pcomp;
        },
        minValid: 0,
        calc: (val) => {
          const res = calcCore103(val);
          return {kwh:res.kwh, prime:res.prime};
        }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme103(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const usage = document.getElementById('f-usage103').value;
  const mode = document.getElementById('f-mode103').value;
  const zone = document.getElementById('f-zone').value;

  let html = `<table class="bareme"><thead><tr><th>Usage</th><th>Mode</th><th>H1</th><th>H2</th><th>H3</th><th>Prime / kW (zone ${usage==='procede'?'—':zone})</th></tr></thead><tbody>`;
  Object.keys(MODES_INDUT103).forEach((m, idx, arr)=>{
    const v = FORFAIT_INDUT103.chauffage[m];
    const isCur = usage==='chauffage' && m===mode;
    html += `<tr class="${isCur?'hl':''}${idx===arr.length-1?' grp-end':''}">`;
    html += `<td>${idx===0?'Chauffage / ECS':''}</td><td>${MODES_INDUT103[m]}</td>`;
    html += `<td>${num(v.H1)}</td><td>${num(v.H2)}</td><td>${num(v.H3)}</td>`;
    html += `<td class="num-c">${eur2(v[zone]/1000*pc)}</td></tr>`;
  });
  Object.keys(MODES_INDUT103).forEach((m, idx, arr)=>{
    const v = FORFAIT_INDUT103.procede[m];
    const isCur = usage==='procede' && m===mode;
    html += `<tr class="${isCur?'hl':''}${idx===arr.length-1?' grp-end':''}">`;
    html += `<td>${idx===0?'Procédé industriel':''}</td><td>${MODES_INDUT103[m]}</td>`;
    html += `<td colspan="3" style="text-align:center">${num(v)} (toutes zones)</td>`;
    html += `<td class="num-c">${eur2(v/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par kW de puissance P. Multiplier par P (plafonnée à la puissance électrique du compresseur).</div>`;
  wrap.innerHTML = html;
}
