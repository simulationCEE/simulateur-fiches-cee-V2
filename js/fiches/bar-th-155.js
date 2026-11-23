// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-155 (Ventilation hybride hygroréglable — France métropolitaine)
// Source : fiche BAR-TH-155 vA40-4 à compter du 01-04-2022 · Durée de vie 17 ans
// kWh cumac = forfait par appartement (zone) × nombre d'appartements × R (type A/B, extracteur)
// Prix : part des appartements au prix précarité = très modestes + modestes (engagement à partir du 16/11/2026)
// ═══════════════════════════════════════════════════════════════════════
const REF155 = { H1: 17700, H2: 14500, H3: 9700 };
// Facteur correctif R : [type][extracteur]
const R155 = { A: { bc: 0.98, std: 0.93 }, B: { bc: 1, std: 0.95 } };

function renderTH155(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Appartements existants en France métropolitaine, équipés d'une ventilation naturelle ou sans système de ventilation · Professionnel RGE (travaux de ventilation) · Avis technique CCFAT en cours de validité (ou équivalent) · Type A : bouches d'extraction hygroréglables · Type B : bouches d'extraction et entrées d'air hygroréglables · Puissance spécifique de l'extracteur &lt; 0,25 Wh/m³ (basse consommation si ≤ 0,1 Wh/m³)</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"><label>Nombre d'appartements <span class="hint">somme des 3 catégories</span></label><input type="number" id="f-n" value="20" readonly tabindex="-1" style="${HH_READONLY_STYLE}"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Type de ventilation hybride</label><select id="f-type155"><option value="B">Type B (extraction et entrées d'air hygroréglables)</option><option value="A">Type A (extraction hygroréglable seule)</option></select></div>
      <div class="field"><label>Puissance spécifique de l'extracteur <span class="hint">Wh/m³ · doit être &lt; 0,25 · basse consommation si ≤ 0,1</span></label><input type="number" id="f-ps155" value="0.1" step="0.01" min="0"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Ménages très modestes (précarité énergétique) <span class="hint">nombre d'appartements · repère Anah : bleu</span></label><input type="number" id="f-ntm" value="0" min="0"></div>
      <div class="field"><label>Ménages modestes (précarité énergétique, hors très modestes) <span class="hint">nombre d'appartements · repère Anah : jaune</span></label><input type="number" id="f-nm" value="0" min="0"></div>
    </div>
    <div class="field-row">
      ${hhOthersFieldHtml(20)}
      <div class="field"></div>
    </div>
    <div class="hh-note" id="hhNote"></div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box" id="warnElig155"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-155 vA40-4 à compter du 01-04-2022 · Durée de vie 17 ans · Montant = forfait par appartement × nombre d'appartements × R</div>
  `);
  const baremeWrap = bareme(body, buildBareme155);

  function r155(){
    const ps = parseFloat(document.getElementById('f-ps155').value);
    const ext = (!isNaN(ps) && ps <= 0.1) ? 'bc' : 'std';
    return { R: R155[document.getElementById('f-type155').value][ext], ext, ps };
  }
  function calcCore155(n){
    const zone=document.getElementById('f-zone').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const {R} = r155();
    const total = REF155[zone]*n*R;
    const nRef = parseFloat(document.getElementById('f-n').value)||0;
    const share = hhShare(parseFloat(document.getElementById('f-ntm').value)||0, parseFloat(document.getElementById('f-nm').value)||0, nRef);
    const prix = pp*share + pc*(1-share);
    return {kwh: total, prime: total/1000*prix, share, R};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    hhSyncTotal('f-n','f-ntm','f-nm','f-na');
    const n=parseFloat(document.getElementById('f-n').value)||0;
    const {ext, ps} = r155();
    const pbs=[];
    if(!isNaN(ps) && ps >= 0.25) pbs.push(`puissance spécifique de l'extracteur ${String(ps).replace('.',',')} Wh/m³ : doit être inférieure à 0,25`);
    const ineligible = pbs.length>0;
    const warn=document.getElementById('warnElig155');
    if(ineligible){ warn.innerHTML=`⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');
    const r = calcCore155(n);
    const k=ineligible?0:r.kwh, pr=ineligible?0:r.prime;
    hhMixRefresh();
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Facteur R (type ${document.getElementById('f-type155').value}, extracteur ${ext==='bc'?'basse consommation':'standard'})</span><span class="result-val" style="font-size:14px">${String(r.R).replace('.',',')}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible?' (non éligible)':''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row ${r.share>0?'hi prec':'hi'}"><span class="result-label">Prime — ${(r.share*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} % des appartements au prix précarité</span><span class="result-val">${eur(pr)}</span></div>
      <div class="result-row"><span class="result-label">Prime / appartement</span><span class="result-val" style="font-size:14px">${n>0?eur(pr/n):'—'}</span></div>
    `;
    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'appts', paramLabel:"Nb d'appartements", defaultStep:5, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-n').value)||0,
        minValid: 1,
        calc: (val) => { const r = calcCore155(Math.round(val)); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:"nombre d'appartements", unitLabel:'appts', integer:true, min:1, max:5000,
        calc: (val) => { const r = calcCore155(Math.round(val)); return {prime:r.prime}; }
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

function buildBareme155(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  const cols=[['A','bc','Type A · basse conso.'],['A','std','Type A · standard'],['B','bc','Type B · basse conso.'],['B','std','Type B · standard']];
  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>kWhc / appt<br>(R = 1)</th>${cols.map(c=>`<th>${c[2]}<br>R ${String(R155[c[0]][c[1]]).replace('.',',')} · classique / précarité</th>`).join('')}</tr></thead><tbody>`;
  ['H1','H2','H3'].forEach(zone=>{
    const v=REF155[zone];
    html += `<tr class="${zone===curZone?'hl':''}"><td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(v)}</td>`;
    cols.forEach(c=>{ const k=v*R155[c[0]][c[1]]; html += `<td><span class="num-c">${eur(k/1000*pc)}</span> / <span class="num-p">${eur(k/1000*pp)}</span></td>`; });
    html += `</tr>`;
  });
  html += `</tbody></table><div class="source-note">Prime par appartement.</div>`;
  wrap.innerHTML = html;
}
