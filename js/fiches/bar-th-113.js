// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-113 (Chaudière biomasse individuelle)
// Source : BAR-TH-113 vA79-4 à compter du 01-01-2026
// ═══════════════════════════════════════════════════════════════════════
const FORFAIT_BARTH113 = { H1: 41300, H2: 33800, H3: 26300 };

function renderTH113(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Maison individuelle existante · Puissance ≤ 70 kW · Régulateur classe IV-VIII · Silo ≥ 225 L (auto) ou ballon tampon (manuelle) · Non cumulable avec BAR-TH-143 et BAR-TH-162</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Puissance thermique nominale <span class="hint">kW, ≤ 70</span></label><input type="number" id="f-puissance" value="20"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Etas de la chaudière <span class="hint">%, hors régulation</span></label><input type="number" id="f-etas" value="80"></div>
      <div class="field"><label>Mode d'alimentation</label>
        <select id="f-mode"><option value="auto">Automatique (silo ≥ 225 L)</option><option value="manuel">Manuelle (ballon tampon)</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="field-row">
      <div class="field">
        <label>Coup de Pouce ×5 <span class="hint">remplacement chaudière charbon/fioul/gaz hors condensation</span></label>
        <select id="f-cdp"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
      <div class="field"></div>
    </div>
    <div class="warn-box" id="warnEtas113"></div>
    <div class="warn-box" id="warnPuissance113"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-113 vA79-4 à compter du 01-01-2026 · Durée de vie 17 ans · CdP ×5 uniforme (pas de distinction classique/modeste sur le coefficient, contrairement à d'autres fiches PAC) · Dépose de l'équipement fossile obligatoire par l'installateur, à mentionner explicitement sur la facture sous peine de validation hors Coup de Pouce</div>
  `);
  const baremeWrap = bareme(body, buildBareme113);

  function calcCore113(zone){
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    const pp = parseFloat(document.getElementById('f-pp').value)||0;
    const cdp = document.getElementById('f-cdp').value==='oui';
    const mult = cdp ? 5 : 1;
    const kwhcBrut = FORFAIT_BARTH113[zone];
    const kwhc = kwhcBrut*mult;
    return {kwh:kwhc, kwhBrut:kwhcBrut, primeC:kwhc/1000*pc, primeP:kwhc/1000*pp, mult};
  }
  function calc(){
    const zone = document.getElementById('f-zone').value;
    const puissance = parseFloat(document.getElementById('f-puissance').value)||0;
    const etas = parseFloat(document.getElementById('f-etas').value)||0;
    const seuilEtas = puissance>20 ? 79 : 77;

    const warnEtas = document.getElementById('warnEtas113');
    if(etas>0 && etas<seuilEtas){
      warnEtas.innerHTML = `⚠ <b>Etas insuffisant :</b> ${etas}% &lt; ${seuilEtas}% requis pour une puissance ${puissance>20?'> 20 kW':'≤ 20 kW'}. Opération non éligible en l'état (sauf label Flamme Verte 7★, réputé conforme).`;
      warnEtas.classList.add('show');
    } else {
      warnEtas.classList.remove('show');
    }
    const warnPuissance = document.getElementById('warnPuissance113');
    if(puissance>70){
      warnPuissance.innerHTML = `⚠ <b>Puissance hors plafond :</b> ${puissance} kW &gt; 70 kW maximum autorisé par la fiche. Non éligible BAR-TH-113.`;
      warnPuissance.classList.add('show');
    } else {
      warnPuissance.classList.remove('show');
    }

    const {kwh:kwhc, kwhBrut, primeC, primeP, mult} = calcCore113(zone);
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac ${mult>1?`(bonifié ×${mult}, brut ${kwh(kwhBrut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${mult>1?'cdp':'hi'}"><span class="result-label">Prime Classique</span><span class="result-val">${eur(primeC)}</span></div>
      <div class="result-row prec"><span class="result-label">Prime Précarité</span><span class="result-val">${eur(primeP)}</span></div>
    `;
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme113(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const pp = parseFloat(document.getElementById('f-pp').value)||0;
  const curZone = document.getElementById('f-zone').value;

  let html = `<table class="bareme"><thead><tr><th>Zone</th><th>kWh cumac</th><th>Classique</th><th>Précarité</th><th>CdP ×5 Classique</th><th>CdP ×5 Précarité</th></tr></thead><tbody>`;
  Object.keys(FORFAIT_BARTH113).forEach(zone=>{
    const v = FORFAIT_BARTH113[zone];
    const isCur = zone===curZone;
    html += `<tr class="${isCur?'hl':''} grp-end">`;
    html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>`;
    html += `<td>${num(v)}</td>`;
    html += `<td class="num-c">${eur(v/1000*pc)}</td>`;
    html += `<td class="num-p">${eur(v/1000*pp)}</td>`;
    html += `<td class="num-cdp">${eur(v*5/1000*pc)}</td>`;
    html += `<td class="num-cdp">${eur(v*5/1000*pp)}</td>`;
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
