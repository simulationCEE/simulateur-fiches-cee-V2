// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-168 (Solaire thermique)
// ═══════════════════════════════════════════════════════════════════════
function renderTH168(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Pas d'appoint fossile après travaux · Capteurs vitrés (hybrides exclus) · Engagement avant 01/01/2027 pour bonification</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Usage</label><select id="f-usage"><option value="ecs">ECS seule</option><option value="ch">ECS + Chauffage</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface capteurs <span class="hint">m²</span></label><input type="number" id="f-surf" value="10"></div>
      <div class="field"><label>Profil du ménage</label>
        <select id="f-profil"><option value="autre">Autre ménage (×4)</option><option value="modeste">Modeste (×5)</option><option value="tresmodeste">Très modeste (×5)</option></select>
      </div>
    </div>
    <div class="warn-box" id="warnSurf"></div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-168 vA87.4 (arrêté 17/08/2026) · Non cumulable avec BAR-TH-171/172</div>
  `);
  addChecklist168(body);
  const forf168 = {H1:{ecs:6000,ch:14000},H2:{ecs:7200,ch:12700},H3:{ecs:9600,ch:10300}};
  const baremeWrap = bareme(body, w=>buildBareme168(w, forf168));
  const SEUILS168 = {ecs:2, ch:8};

  // Fonction de calcul unique — utilisée par le résultat principal ET le tableau ajustable
  function calcCore168(surf){
    const zone=document.getElementById('f-zone').value;
    const usage=document.getElementById('f-usage').value;
    const profil=document.getElementById('f-profil').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const kwhc = forf168[zone][usage]*surf;
    const coef = profil==='autre'?4:5;
    const prix = profil==='tresmodeste'?pp:pc;
    const prime = kwhc/1000*prix*coef;
    return {kwh: kwhc, prime, coef};
  }

  let adjWrap;
  let revWrap;
  function calc(){
    const usage=document.getElementById('f-usage').value;
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const seuil = SEUILS168[usage];
    const warnEl = document.getElementById('warnSurf');
    if(surf > 0 && surf < seuil){
      warnEl.innerHTML = `⚠ <b>Surface insuffisante :</b> ${seuil} m² minimum requis pour l'usage « ${usage==='ecs'?'ECS seule':'ECS + Chauffage'} » (surface saisie : ${surf} m²) — l'opération n'est pas éligible en l'état.`;
      warnEl.classList.add('show');
    } else {
      warnEl.classList.remove('show');
    }
    const {kwh:kwhc, prime, coef} = calcCore168(surf);
    const profil=document.getElementById('f-profil').value;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${profil==='tresmodeste'?'prec':'cdp'}"><span class="result-label">Prime bonifiée (×${coef})</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel: 'm²', paramLabel: 'Surface', defaultStep: 2, defaultRep: 2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: seuil,
        calc: (val) => { const r = calcCore168(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel: 'surface', unitLabel: 'm²', min: seuil, max: 200,
        calc: (val) => { const r = calcCore168(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme168(wrap, forf){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const surf=parseFloat(document.getElementById('f-surf').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curUsage=document.getElementById('f-usage').value;
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>Usage</th><th>kWhc/m²</th>
    <th class="sub">Autre ménage<br>×4 Classique</th>
    <th class="sub">Modeste<br>×5 Classique</th>
    <th class="sub">Très modeste<br>×5 Précarité</th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    [['ECS seule','ecs'],['ECS + Chauffage','ch']].forEach(([label,key],i)=>{
      const v = forf[zone][key];
      const kwhcTotal = v*surf;
      const isCur = zone===curZone && key===curUsage;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="2">${zone}</td>`;
      html += `<td style="text-align:left">${label}</td><td>${num(v)}</td>`;
      html += `<td class="num-cdp">${eur(kwhcTotal/1000*pc*4)}</td>`;
      html += `<td class="num-cdp">${eur(kwhcTotal/1000*pc*5)}</td>`;
      html += `<td class="num-p">${eur(kwhcTotal/1000*pp*5)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>
  <div style="padding:10px 12px;font-size:10.5px;color:var(--text-3);line-height:1.6">
    Montants calculés pour la surface de capteurs actuellement saisie (${num(surf)} m²). Modifiez la surface ci-dessus pour mettre ce tableau à jour.
  </div>`;
  wrap.innerHTML = html;
}

