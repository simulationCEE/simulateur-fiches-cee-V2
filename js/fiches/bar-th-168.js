// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-168 (Solaire thermique)
// ═══════════════════════════════════════════════════════════════════════
function renderTH168(body){
  body.insertAdjacentHTML('beforeend', `<div class="warn-box show" style="margin-bottom:10px"><b>⚠ FICHE SUPPRIMÉE.</b> Supprimée par l'arrêté du 28 octobre 2026 (JO du 3 novembre 2026), en vigueur le <b>4 novembre 2026</b>. Selon la presse spécialisée (à confirmer sur le texte de l'arrêté), seules restent valorisables les opérations engagées au plus tard le 3 novembre 2026 et déclarées dans la liste à transmettre au ministre avant le 13 novembre 2026.</div>`);
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Pas d'appoint fossile après travaux · Capteurs vitrés (hybrides exclus) · Engagement avant 01/01/2027 pour bonification</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Usage</label><select id="f-usage"><option value="ecs">ECS seule</option><option value="ch">ECS + Chauffage</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface capteurs <span class="hint">m²</span></label><input type="number" id="f-surf" value="10"></div>
      ${hhFieldHtml('f-profil')}
    </div>
    ${hhNoteHtml()}
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
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const hh = hhCtx('BAR-TH-168', pc, pp, 'f-profil');
    const kwhc = forf168[zone][usage]*surf;
    const coef = hh.coef;
    const kwhcBonifie = kwhc*coef;
    const prime = kwhcBonifie/1000*hh.price;
    return {kwh: kwhcBonifie, kwhBrut: kwhc, prime, coef, hh};
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
    const {kwh:kwhc, kwhBrut, prime, coef, hh} = calcCore168(surf);
    hhUpdateNote('BAR-TH-168');
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac (bonifié ×${coef}, brut ${kwh(kwhBrut)})</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${hhRowClass(hh, coef>1)}"><span class="result-label">${hhPrimeLabel(hh, 'Prime bonifiée')}</span><span class="result-val">${eur(prime)}</span></div>
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
  hhWatch(body, calc);
}

function buildBareme168(wrap, forf){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const surf=parseFloat(document.getElementById('f-surf').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curUsage=document.getElementById('f-usage').value;
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>Usage</th><th>kWhc/m²</th>
    ${['autre','modeste','tresmodeste'].map(p=>{const h=hhCtxFor('BAR-TH-168',p,pc,pp);return `<th class="sub">${HH_LABELS[p].replace('Ménage ','').replace(/^./,c=>c.toUpperCase())}<br>×${h.coef} ${h.kind==='prec'?'Précarité':'Classique'}</th>`;}).join('')}
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    [['ECS seule','ecs'],['ECS + Chauffage','ch']].forEach(([label,key],i)=>{
      const v = forf[zone][key];
      const kwhcTotal = v*surf;
      const isCur = zone===curZone && key===curUsage;
      html += `<tr class="${isCur?'hl':''} ${i===1?'grp-end':''}">`;
      if(i===0) html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="2">${zone}</td>`;
      html += `<td style="text-align:left">${label}</td><td>${num(v)}</td>`;
      ['autre','modeste','tresmodeste'].forEach(p=>{ const h=hhCtxFor('BAR-TH-168',p,pc,pp); html += `<td class="${h.kind==='prec'?'num-p':'num-cdp'}">${eur(kwhcTotal*h.coef/1000*h.price)}</td>`; });
      html += `</tr>`;
    });
  });
  html += `</tbody></table>
  <div style="padding:10px 12px;font-size:10.5px;color:var(--text-3);line-height:1.6">
    Montants calculés pour la surface de capteurs actuellement saisie (${num(surf)} m²). Modifiez la surface ci-dessus pour mettre ce tableau à jour.
  </div>`;
  wrap.innerHTML = html;
}

