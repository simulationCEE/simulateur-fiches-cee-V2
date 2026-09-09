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
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field">
      <label>Coup de Pouce ×5 <span class="hint">(remplacement chaudière fossile)</span></label>
      <select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-171 vA78.4 · Cumul CEE + MaPrimeRénov' plafonné à 12 000 €</div>
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
    const band = surfBand(type, surf);
    const idx = etas>=140 ? 1 : 0;
    const kwhc = REF171[zone][type][band][idx];
    const mult = cdp ? 5 : 1;
    return {kwh: kwhc, primeC: kwhc/1000*pc*mult, primeP: kwhc/1000*pp*mult, cdp};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const surf=parseFloat(document.getElementById('f-surf').value)||0;
    const {kwh:kwhc, primeC, primeP, cdp} = calcCore171(surf);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${cdp?'cdp':'hi'}"><span class="result-label">Prime Classique ${cdp?'(CdP ×5)':''}</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité ${cdp?'(CdP ×5)':''}</span><span class="result-val">${eur(primeP)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface', defaultStep:10, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-surf').value)||0,
        minValid: 0,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCore171(val); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'surface', unitLabel:'m²', min:0, max:1000, hasPrec:true,
        calc: (val) => { const r = calcCore171(val); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme171(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
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
    <th>Classique<br>Etas1 / Etas2</th>
    <th>Précarité<br>Etas1 / Etas2</th>
    <th>CdP ×5 Classique<br>Etas1 / Etas2</th>
    <th>CdP ×5 Précarité<br>Etas1 / Etas2</th>
  </tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    rows.forEach(grp=>{
      grp.bands.forEach(([label,bandKey],i)=>{
        const [e1,e2] = REF171[zone][grp.type][bandKey];
        const isCur = zone===curZone && grp.type===curType && bandKey===curBand;
        html += `<tr class="${isCur?'hl':''}">`;
        if(grp.type==='maison' && i===0){
          html += `<td class="zone-cell z-${zone.toLowerCase()}" rowspan="6">${zone}</td>`;
        }
        html += `<td style="text-align:left;font-weight:${i===0?'700':'400'}">${i===0?grp.label:''}</td>`;
        html += `<td>${label}</td>`;
        html += `<td>${num(e1)} / ${num(e2)}</td>`;
        html += `<td class="num-c">${eur(e1/1000*pc)} / ${eur(e2/1000*pc)}</td>`;
        html += `<td class="num-p">${eur(e1/1000*pp)} / ${eur(e2/1000*pp)}</td>`;
        html += `<td class="num-cdp">${eur(e1/1000*pc*5)} / ${eur(e2/1000*pc*5)}</td>`;
        html += `<td class="num-cdp">${eur(e1/1000*pp*5)} / ${eur(e2/1000*pp*5)}</td>`;
        html += `</tr>`;
      });
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

