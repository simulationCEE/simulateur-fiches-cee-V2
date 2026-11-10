// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-171 (PAC individuelle)
// ═══════════════════════════════════════════════════════════════════════
const REF171 = {
  H1:{maison:{'<70':[54500,65500],'70-90':[76400,91700],'>=90':[109100,131000]},
      appt:{'<35':[29200,35300],'35-60':[40900,49500],'>=60':[58400,70700]}},
  H2:{maison:{'<70':[45400,54600],'70-90':[63600,76400],'>=90':[90800,109100]},
      appt:{'<35':[24300,29400],'35-60':[34100,41200],'>=60':[48600,58900]}},
  H3:{maison:{'<70':[31800,38200],'70-90':[44500,53500],'>=90':[63600,76400]},
      appt:{'<35':[17000,20600],'35-60':[23900,28900],'>=60':[34000,41200]}},
};

function renderTH171(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Etas ≥ 111% (MT/HT) ou ≥ 126% (BT) · Régulateur classe IV-VIII obligatoire · Note de dimensionnement</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Type de logement</label>
        <select id="f-type"><option value="maison">Maison</option><option value="appt">Appartement</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Surface (m²)</label><input type="number" id="f-surf" value="100"></div>
      <div class="field"><label>Etas de la PAC (%)</label><input type="number" id="f-etas" value="140"></div>
    </div>
    <div class="field-row">
      ${hhFieldHtml()}
      <div class="field"></div>
    </div>
    ${hhNoteHtml()}
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Coup de Pouce <span class="hint">(remplacement chaudière fossile ; ×5 / ×3 selon le ménage)</span></label>
        <select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
      <div class="field">
        <label>PAC sur liste agréée <span class="hint">obligatoire pour le Coup de Pouce ; n° d'agrément sur la preuve de réalisation</span></label>
        <select id="f-agree"><option value="oui">Oui</option><option value="non">Non</option></select>
      </div>
    </div>
    <div class="warn-box" id="warnAgree171"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-171 vA82-5 à compter du 01-09-2026 (barème inchangé depuis vA78.4) · Cumul CEE + MaPrimeRénov' plafonné à 12 000 € · CdP conditionné à l'agrément PAC (décret n°2026-413, arrêté du 02/07/2026) depuis le 01/09/2026</div>
  `);
  const baremeWrap = bareme(body, buildBareme171);

  function surfBand(type, surf){
    if(type==='maison') return surf<70?'<70':(surf<90?'70-90':'>=90');
    return surf<35?'<35':(surf<60?'35-60':'>=60');
  }
  function calcCore171(surf){
    const zone=document.getElementById('f-zone').value;
    const type=document.getElementById('f-type').value;
    const etas=parseFloat(document.getElementById('f-etas').value)||0;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const cdp=document.getElementById('f-cdp').value==='oui';
    const agree=document.getElementById('f-agree').value==='oui';
    const band = surfBand(type, surf);
    const idx = etas>=140 ? 1 : 0;
    const kwhc = REF171[zone][type][band][idx];
    const hh = hhCtx('BAR-TH-171', pc, pp);
    const mult = (cdp && agree) ? hh.coef : 1;
    const kwhcBonifie = kwhc*mult;
    return {kwh: kwhcBonifie, kwhBrut: kwhc, prime: kwhcBonifie/1000*hh.price, hh, cdp, agree, mult};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, kwhBrut, prime, hh, cdp, agree, mult} = calcCore171(surf);
    hhUpdateNote('BAR-TH-171');
    const warn = document.getElementById('warnAgree171');
    if(cdp && !agree){
      warn.innerHTML = `⚠ <b>Coup de Pouce non applicable :</b> depuis le 01/09/2026, la bonification Coup de Pouce sur BAR-TH-171 exige que le modèle de PAC figure sur la liste des PAC agréées "qualité et résilience industrielle" (bonus-pac.ademe.fr). Sans agrément, seul le forfait de base s'applique.`;
      warn.classList.add('show');
    } else {
      warn.classList.remove('show');
    }
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac ${mult>1?`(bonifié ×${mult}, brut ${kwh(kwhBrut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${hhRowClass(hh, mult>1)}"><span class="result-label">${hhPrimeLabel(hh)}</span><span class="result-val">${eur(prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCore171(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:1000,
        calc: (val) => { const r = calcCore171(val); return {prime:r.prime}; }
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

function buildBareme171(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const hh = hhCtx('BAR-TH-171', pc, pp);
  const curZone=document.getElementById('f-zone').value;
  const curType=document.getElementById('f-type').value;
  const curSurf=parseFloat(document.getElementById('f-surf').value)||0;
  const curEtas=parseFloat(document.getElementById('f-etas').value)||0;
  const curIdx = curEtas>=140?1:0;
  const curBand = curType==='maison'
    ? (curSurf<70?'<70':(curSurf<90?'70-90':'>=90'))
    : (curSurf<35?'<35':(curSurf<60?'35-60':'>=60'));

  const rows = [
    {type:'maison', label:'Maison', bands:[['< 70 m²','<70'],['70–90 m²','70-90'],['≥ 90 m²','>=90']]},
    {type:'appt', label:'Appartement', bands:[['< 35 m²','<35'],['35–60 m²','35-60'],['≥ 60 m²','>=60']]},
  ];
  let html = `<table class="bareme"><thead><tr>
    <th>Zone</th><th>Type</th><th>Surface</th>
    <th>kWh cumac<br>Etas1 / Etas2</th>
    <th>Prime sans bonification<br>Etas1 / Etas2</th>
    <th>Prime avec Coup de Pouce ×${hh.coef}<br>Etas1 / Etas2</th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    rows.forEach(grp=>{
      grp.bands.forEach(([label,bandKey],i)=>{
        const [e1,e2] = REF171[zone][grp.type][bandKey];
        const isCur = zone===curZone && grp.type===curType && bandKey===curBand;
        const isGrpEnd = i===grp.bands.length-1;
        html += `<tr class="${isCur?'hl':''} ${isGrpEnd?'grp-end':''}">`;
        if(grp.type==='maison' && i===0){
          html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="6">${zone}</td>`;
        }
        html += `<td style="text-align:left;font-weight:${i===0?'700':'400'}">${i===0?grp.label:''}</td>`;
        html += `<td>${label}</td>`;
        html += `<td>${num(e1)} / ${num(e2)}</td>`;
        html += `<td class="${hh.kind==='prec'?'num-p':'num-c'}">${eur(e1/1000*hh.price)} / ${eur(e2/1000*hh.price)}</td>`;
        html += `<td class="num-cdp">${eur(e1/1000*hh.price*hh.coef)} / ${eur(e2/1000*hh.price*hh.coef)}</td>`;
        html += `</tr>`;
      });
    });
  });
  html += `</tbody></table><div class="source-note">Montants pour le profil sélectionné : ${HH_LABELS[hh.profil]} (${hh.priceLabel}).</div>`;
  wrap.innerHTML = html;
}

