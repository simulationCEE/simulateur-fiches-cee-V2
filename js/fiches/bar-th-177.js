// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-177 (Rénovation globale)
// ═══════════════════════════════════════════════════════════════════════
function renderTH177(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Cep après travaux &lt; 331 kWh/m².an · Gain énergétique ≥ 35% en énergie primaire · Émissions GES après ≤ avant</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Shab <span class="hint">m² après rénovation</span></label><input type="number" id="f-shab" value="1000"></div>
      <div class="field"><label>Nombre de logements</label><input type="number" id="f-n" value="30"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Ménages précaires <span class="hint">nombre</span></label><input type="number" id="f-np" value="0"></div>
      <div class="field"><label>Coup de Pouce <span class="hint">changement chauffage fossile</span></label><select id="f-cdp"><option value="oui">Oui</option><option value="non">Non</option></select></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Cep initial <span class="hint">kWh/m².an</span></label><input type="number" id="f-ci" value="250"></div>
      <div class="field"><label>Cep projet <span class="hint">kWh/m².an</span></label><input type="number" id="f-cp" value="150"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="divider"></div>
    <div id="condResult"></div>
    <div class="results" id="results" style="margin-top:10px"></div>
    <div class="source-note">Source : BAR-TH-177 vA63-1 · Forfait fixe 2 100 kWhc/m² · CdP charte : 41 €/m² (avec chgt chauffage) / 27 €/m² (sans)</div>
  `);
  function calcCore177(shab){
    const n=parseFloat(document.getElementById('f-n').value)||1;
    const np=parseFloat(document.getElementById('f-np').value)||0;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const kwhc = 2100*shab;
    const primeMix = (kwhc/1000*pp*np/n) + (kwhc/1000*pc*(n-np)/n);
    return {kwh: kwhc, prime: primeMix};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const shab=parseFloat(document.getElementById('f-shab').value)||0;
    const n=parseFloat(document.getElementById('f-n').value)||1;
    const cdp=document.getElementById('f-cdp').value==='oui';
    const ci=parseFloat(document.getElementById('f-ci').value)||0;
    const cp=parseFloat(document.getElementById('f-cp').value)||0;
    const gain = ci>0 ? (ci-cp)/ci : 0;
    const cond1 = cp<331, cond2 = gain>=0.35;
    document.getElementById('condResult').innerHTML = `
      <div class="result-row" style="background:${cond1?'#E9F4EC':'#FBEAEA'};border-color:${cond1?'#B9DCC2':'#EFC9C6'}">
        <span class="result-label">Cep projet &lt; 331 kWh/m².an</span>
        <span class="result-val" style="font-size:13px;color:${cond1?'#1E6B3A':'#B3261E'}">${cond1?'✓ Conforme':'✗ Non conforme'}</span>
      </div>
      <div class="result-row" style="margin-top:8px;background:${cond2?'#E9F4EC':'#FBEAEA'};border-color:${cond2?'#B9DCC2':'#EFC9C6'}">
        <span class="result-label">Gain énergétique : ${(gain*100).toFixed(1)}%</span>
        <span class="result-val" style="font-size:13px;color:${cond2?'#1E6B3A':'#B3261E'}">${cond2?'✓ ≥ 35%':'✗ < 35%'}</span>
      </div>
    `;
    const {kwh:kwhc, prime:primeMix} = calcCore177(shab);
    const cdpMin = cdp ? shab*41 : shab*27;
    document.getElementById('results').innerHTML = `
      <div class="result-row hi"><span class="result-label">Prime CEE (mix précarité/classique)</span><span class="result-val">${eur(primeMix)}</span></div>
      <div class="result-row cdp"><span class="result-label">Minimum Coup de Pouce charte</span><span class="result-val">${eur(cdpMin)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Shab', defaultStep:50, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-shab').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCore177(val); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }

    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'Shab', unitLabel:'m²', min:0, max:50000,
        calc: (val) => { const r = calcCore177(val); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

