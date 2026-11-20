// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-SE-104 (Réglage des organes d'équilibrage d'une installation de chauffage à eau chaude)
// Source : fiche BAR-SE-104 vA19-1 · Durée de vie 10 ans
// Montant = forfait par appartement (zone climatique) × nombre d'appartements
// Prix : part des logements au prix précarité = très modestes + modestes (engagement à partir du 16/11/2026)
// ═══════════════════════════════════════════════════════════════════════
const REFSE104 = { H1: 9800, H2: 8000, H3: 5300 };

function renderSE104(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Appartements existants équipés d'une installation collective de chauffage à eau chaude · Réglage des organes d'équilibrage (pied de colonne et/ou locaux) par un professionnel · Écart de température entre le logement le plus chauffé et le moins chauffé strictement inférieur à 2 °C · Justificatifs : schéma hydraulique simplifié, grille d'équilibrage, tableau des températures après équilibrage (signé par le bénéficiaire)</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Nombre d'appartements <span class="hint">somme des 3 catégories</span></label><input type="number" id="f-n" value="30" readonly tabindex="-1" style="${HH_READONLY_STYLE}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Ménages très modestes (précarité énergétique) <span class="hint">nombre d'appartements · repère Anah : bleu</span></label><input type="number" id="f-ntm" value="0" min="0"></div>
      <div class="field"><label>Ménages modestes (précarité énergétique, hors très modestes) <span class="hint">nombre d'appartements · repère Anah : jaune</span></label><input type="number" id="f-nm" value="0" min="0"></div>
    </div>
    <div class="field-row">
      ${hhOthersFieldHtml(30)}
      <div class="field"></div>
    </div>
    <div class="hh-note" id="hhNote"></div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-SE-104 vA19-1 · Durée de vie 10 ans · Montant = forfait par appartement × nombre d'appartements</div>
  `);
  const baremeWrap = bareme(body, buildBaremeSE104);

  function calcCoreSE104(n){
    const zone=document.getElementById('f-zone').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const total = REFSE104[zone]*n;
    // Prix moyen pondéré selon la répartition des ménages (part constante quand on fait varier le nombre d'appartements)
    const nRef = parseFloat(document.getElementById('f-n').value)||0;
    const share = hhShare(parseFloat(document.getElementById('f-ntm').value)||0, parseFloat(document.getElementById('f-nm').value)||0, nRef);
    const prix = pp*share + pc*(1-share);
    return {kwh: total, prime: total/1000*prix, share};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    hhSyncTotal('f-n','f-ntm','f-nm','f-na');
    const n=parseFloat(document.getElementById('f-n').value)||0;
    const {kwh:total, prime, share} = calcCoreSE104(n);
    hhMixRefresh();
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(total)}</span></div>
      <div class="result-row ${share>0?'hi prec':'hi'}"><span class="result-label">Prime — ${(share*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} % des appartements au prix précarité</span><span class="result-val">${eur(prime)}</span></div>
      <div class="result-row"><span class="result-label">Prime / appartement</span><span class="result-val" style="font-size:14px">${n>0?eur(prime/n):'—'}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'appts', paramLabel:"Nb d'appartements", defaultStep:5, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-n').value)||0,
        minValid: 1,
        calc: (val) => { const r = calcCoreSE104(Math.round(val)); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:"nombre d'appartements", unitLabel:'appts', integer:true, min:1, max:5000,
        calc: (val) => { const r = calcCoreSE104(Math.round(val)); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
  hhWatch(body, calc);
}

function buildBaremeSE104(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>kWh cumac / appartement</th><th>Prime / appartement<br>prix classique</th><th>Prime / appartement<br>prix précarité</th></tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v = REFSE104[zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td><td class="num-c">${eur(v/1000*pc)}</td><td class="num-p">${eur(v/1000*pp)}</td></tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
