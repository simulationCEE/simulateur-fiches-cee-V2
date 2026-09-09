// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-179 (PAC collective)
// ═══════════════════════════════════════════════════════════════════════
const REF179 = {
  '111-126':{H1:[100000,146000],H2:[84000,127000],H3:[60000,100000]},
  '126-150':{H1:[107000,155000],H2:[89000,135000],H3:[64000,107000]},
  '150-175':{H1:[112000,163000],H2:[93000,142000],H3:[67000,112000]},
  '175-190':{H1:[115000,167000],H2:[96000,146000],H3:[69000,115000]},
  '190+':{H1:[117000,170000],H2:[97000,148000],H3:[70000,117000]},
};
function etasKey179(e){
  if(e<126) return '111-126';
  if(e<150) return '126-150';
  if(e<175) return '150-175';
  if(e<190) return '175-190';
  return '190+';
}
function renderTH179(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> PAC collective ≤ 400 kW · Etas ≥ 111% (MT/HT) ou ≥ 126% (BT) · Note de dimensionnement à l'achèvement</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Usage</label><select id="f-usage"><option value="0">Chauffage seul</option><option value="1">Chauffage + ECS</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Etas de la PAC (%)</label><input type="number" id="f-etas" value="140"></div>
      <div class="field"><label>Nombre de logements</label><input type="number" id="f-n" value="30"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Puissance PAC <span class="hint">kW</span></label><input type="number" id="f-ppac" value="200"></div>
      <div class="field"><label>Puissance chaufferie <span class="hint">kW</span></label><input type="number" id="f-pch" value="400"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field">
      <label>Coup de Pouce ×3</label><select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select>
    </div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-179 vA75.1 · R = 1 si Ppac/Pch ≥ 0,40, sinon R = Ppac/Pch</div>
  `);
  const baremeWrap = bareme(body, buildBareme179);

  function calcCore179(n){
    const zone=document.getElementById('f-zone').value;
    const usage=parseInt(document.getElementById('f-usage').value);
    const etas=parseFloat(document.getElementById('f-etas').value)||0;
    const ppac=parseFloat(document.getElementById('f-ppac').value)||0;
    const pch=parseFloat(document.getElementById('f-pch').value)||1;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const cdp=document.getElementById('f-cdp').value==='oui';
    const R = (ppac/pch)>=0.4 ? 1 : ppac/pch;
    const kwhc = REF179[etasKey179(etas)][zone][usage];
    const total = kwhc*n*R;
    const mult = cdp?3:1;
    return {kwh: total, primeC: total/1000*pc*mult, primeP: total/1000*pp*mult, R, cdp, n};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const n=parseFloat(document.getElementById('f-n').value)||0;
    const {kwh:total, primeC, primeP, R, cdp} = calcCore179(n);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Facteur R</span><span class="result-val" style="font-size:14px">${R.toFixed(2)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(total)}</span></div>
      <div class="result-row ${cdp?'cdp':'hi'}"><span class="result-label">Prime Classique ${cdp?'(CdP ×3)':''}</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité ${cdp?'(CdP ×3)':''}</span><span class="result-val">${eur(primeP)}</span></div>
      <div class="result-row"><span class="result-label">Prime Classique / logement</span><span class="result-val" style="font-size:14px">${n>0?eur(primeC/n):'—'}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'logts', paramLabel:'Nb logements', defaultStep:5, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-n').value)||0,
        minValid: 1,
        primeLabel:'Prime Classique', extraLabel:'Prime Précarité',
        calc: (val) => { const r = calcCore179(Math.round(val)); return {kwh:r.kwh, prime:r.primeC, extra:r.primeP}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'nombre de logements', unitLabel:'logts', integer:true, min:1, max:2000, hasPrec:true,
        calc: (val) => { const r = calcCore179(Math.round(val)); return {primeC:r.primeC, primeP:r.primeP}; }
      });
    } else {
      revWrap.refresh();
    }

    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

const ETAS179_LABELS = {
  '111-126':'111% ≤ Etas < 126%', '126-150':'126% ≤ Etas < 150%', '150-175':'150% ≤ Etas < 175%',
  '175-190':'175% ≤ Etas < 190%', '190+':'190% ≤ Etas',
};
function buildBareme179(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const curEtas=parseFloat(document.getElementById('f-etas').value)||0;
  const curEtasKey=etasKey179(curEtas);
  let html = `<table class="bareme"><thead><tr>
    <th>Classe Etas</th><th>Zone</th>
    <th>kWhc/logt<br>Chauffage</th><th>kWhc/logt<br>Chauff.+ECS</th>
    <th>Classique<br>Chauffage</th><th>Classique<br>Chauff.+ECS</th>
    <th>Précarité<br>Chauffage</th><th>Précarité<br>Chauff.+ECS</th>
    <th>CdP ×3 Classique<br>Chauffage</th><th>CdP ×3 Classique<br>Chauff.+ECS</th>
    <th>CdP ×3 Précarité<br>Chauffage</th><th>CdP ×3 Précarité<br>Chauff.+ECS</th>
  </tr></thead><tbody>`;
  Object.keys(REF179).forEach(ek=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const [kc,ke] = REF179[ek][zone];
      const isCur = ek===curEtasKey && zone===curZone;
      html += `<tr class="${isCur?'hl':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700">${ETAS179_LABELS[ek]}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>`;
      html += `<td>${num(kc)}</td><td>${num(ke)}</td>`;
      html += `<td class="num-c">${eur(kc/1000*pc)}</td><td class="num-c">${eur(ke/1000*pc)}</td>`;
      html += `<td class="num-p">${eur(kc/1000*pp)}</td><td class="num-p">${eur(ke/1000*pp)}</td>`;
      html += `<td class="num-cdp">${eur(kc/1000*pc*3)}</td><td class="num-cdp">${eur(ke/1000*pc*3)}</td>`;
      html += `<td class="num-cdp">${eur(kc/1000*pp*3)}</td><td class="num-cdp">${eur(ke/1000*pp*3)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}

