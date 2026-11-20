// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-161 (Isolation de points singuliers d'un réseau — housses isolantes en chaufferie / sous-station)
// Source : fiche BAR-TH-161 vA71-3 à compter du 01-08-2025 (opérations engagées avant le 01/08/2030)
// Montant = Σ (forfait par housse selon DN, zone et température du fluide × nombre de housses)
// Durée de vie : 10 ans si 50 °C ≤ Tfluide ≤ 120 °C · 5 ans si Tfluide > 120 °C
// Prix : part des logements au prix précarité = très modestes + modestes (engagement à partir du 16/11/2026)
// ═══════════════════════════════════════════════════════════════════════
// [50 °C ≤ Tfluide ≤ 120 °C, Tfluide > 120 °C] en kWh cumac par housse
const REF161 = {
  'dn20-65':  { H1:[11700,12900], H2:[10500,11600], H3:[ 8800, 9700] },
  'dn65-100': { H1:[25100,27800], H2:[22700,25100], H3:[18900,20900] },
  'dn100+':   { H1:[40900,45400], H2:[37000,41000], H3:[30800,34100] },
};
const DN161_LABELS = { 'dn20-65':'20 ≤ DN ≤ 65', 'dn65-100':'65 < DN ≤ 100', 'dn100+':'100 < DN' };

function renderTH161(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Bâtiment résidentiel existant · Housses souples, démontables, avec système de fermeture, sur réseau isolé de chauffage et/ou d'ECS en chaufferie ou sous-station collective (manchons non éligibles) · Laine minérale NF EN 14303, température max de service > 200 °C · R ≥ 1,5 m².K/W à 50 °C et ≥ 1,0 m².K/W à 100 °C · Pose par un professionnel · État récapitulatif signé · Contrôle sur site par un organisme d'inspection accrédité COFRAC (≥ 10 % des points vérifiés) · Non cumulable avec RES-CH-104</div>`);
  const dnRows = Object.keys(REF161).map(dn => `
    <div class="field-row">
      <div class="field"><label>Housses ${DN161_LABELS[dn]} mm <span class="hint">50 °C ≤ T fluide ≤ 120 °C</span></label><input type="number" id="f-${dn}-b" value="${dn==='dn20-65'?20:0}" min="0"></div>
      <div class="field"><label>Housses ${DN161_LABELS[dn]} mm <span class="hint">T fluide > 120 °C</span></label><input type="number" id="f-${dn}-h" value="0" min="0"></div>
    </div>`).join('');
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label><select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select></div>
      <div class="field"></div>
    </div>
    ${dnRows}
    <div class="field-row">
      <div class="field"><label>Nombre de logements desservis <span class="hint">somme des 3 catégories</span></label><input type="number" id="f-n" value="30" readonly tabindex="-1" style="${HH_READONLY_STYLE}"></div>
      <div class="field"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Ménages très modestes (précarité énergétique) <span class="hint">nombre de logements · repère Anah : bleu</span></label><input type="number" id="f-ntm" value="0" min="0"></div>
      <div class="field"><label>Ménages modestes (précarité énergétique, hors très modestes) <span class="hint">nombre de logements · repère Anah : jaune</span></label><input type="number" id="f-nm" value="0" min="0"></div>
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
    <div class="source-note">Source : BAR-TH-161 vA71-3 à compter du 01-08-2025 (opérations engagées avant le 01/08/2030) · Durée de vie 10 ans (50–120 °C) ou 5 ans (> 120 °C) · Montant = Σ forfait par housse × nombre de housses</div>
  `);
  const baremeWrap = bareme(body, buildBareme161);

  function calc(){
    hhSyncTotal('f-n','f-ntm','f-nm','f-na');
    const zone=document.getElementById('f-zone').value;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const pp=parseFloat(document.getElementById('f-pp').value)||0;
    const n=parseFloat(document.getElementById('f-n').value)||0;
    let total=0, nbHousses=0;
    Object.keys(REF161).forEach(dn=>{
      const nb = parseFloat(document.getElementById(`f-${dn}-b`).value)||0;
      const nh = parseFloat(document.getElementById(`f-${dn}-h`).value)||0;
      total += REF161[dn][zone][0]*nb + REF161[dn][zone][1]*nh;
      nbHousses += nb + nh;
    });
    const share = hhShare(parseFloat(document.getElementById('f-ntm').value)||0, parseFloat(document.getElementById('f-nm').value)||0, n);
    const prix = pp*share + pc*(1-share);
    const prime = total/1000*prix;
    hhMixRefresh();
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac total (${num(nbHousses)} housse${nbHousses>1?'s':''})</span><span class="result-val" style="font-size:14px">${kwh(total)}</span></div>
      <div class="result-row ${share>0?'hi prec':'hi'}"><span class="result-label">Prime — ${(share*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} % des logements au prix précarité</span><span class="result-val">${eur(prime)}</span></div>
      <div class="result-row"><span class="result-label">Prime / housse</span><span class="result-val" style="font-size:14px">${nbHousses>0?eur(prime/nbHousses):'—'}</span></div>
    `;
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
  hhWatch(body, calc);
}

function buildBareme161(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  const pp=parseFloat(document.getElementById('f-pp').value)||0;
  const curZone=document.getElementById('f-zone').value;
  let html = `<table class="bareme"><thead><tr><th>DN canalisation (mm)</th><th>Zone</th>
    <th>kWhc / housse<br>50–120 °C</th><th>kWhc / housse<br>&gt; 120 °C</th>
    <th>Classique<br>50–120 °C</th><th>Classique<br>&gt; 120 °C</th>
    <th>Précarité<br>50–120 °C</th><th>Précarité<br>&gt; 120 °C</th></tr></thead><tbody>`;
  Object.keys(REF161).forEach(dn=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const [b,h] = REF161[dn][zone];
      html += `<tr class="${zone===curZone?'hl':''} ${zone==='H3'?'grp-end':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700">${DN161_LABELS[dn]}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td><td>${num(b)}</td><td>${num(h)}</td>`;
      html += `<td class="num-c">${eur(b/1000*pc)}</td><td class="num-c">${eur(h/1000*pc)}</td><td class="num-p">${eur(b/1000*pp)}</td><td class="num-p">${eur(h/1000*pp)}</td></tr>`;
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
