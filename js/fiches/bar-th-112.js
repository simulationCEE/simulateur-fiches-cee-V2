// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAR-TH-112 (Appareil indépendant de chauffage au bois)
// Source : BAR-TH-112 vA46-3 à compter du 01-10-2022 — abrogée au 01-10-2027
// ═══════════════════════════════════════════════════════════════════════
const REF112 = {
  '66-72':  {H1:9400,  H2:7700,  H3:5100},
  '72-80':  {H1:23500, H2:19300, H3:12800},
  '80+':    {H1:35300, H2:28900, H3:19200},
};
const ETAS112_LABELS = {
  '66-72':'66% ≤ Etas < 72%',
  '72-80':'72% ≤ Etas < 80%',
  '80+':'Etas ≥ 80%',
};

function renderTH112(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Maison individuelle existante · Bûches : Etas ≥ 66% · Granulés : Etas ≥ 80% · Label Flamme Verte réputé conforme sur les émissions</div>
  `);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Combustible</label>
        <select id="f-combustible"><option value="buches">Bûches / plaquettes</option><option value="granules">Granulés</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Classe Etas de l'appareil</label>
        <select id="f-etas">
          <option value="66-72">66% ≤ Etas < 72%</option>
          <option value="72-80">72% ≤ Etas < 80%</option>
          <option value="80+">Etas ≥ 80%</option>
        </select>
      </div>
      <div class="field"></div>
    </div>
    <div class="field-row">
      <div class="field"><label>Profil du ménage</label>
        <select id="f-profil">
          <option value="classique">Classique (×4 si CdP)</option>
          <option value="modeste">Modeste (×5 si CdP, prix classique)</option>
          <option value="tresmodeste">Très modeste (×5 si CdP, prix précarité)</option>
        </select>
      </div>
      <div class="field">
        <label>Remplace un chauffage au <u>charbon</u> ? <span class="hint">seul combustible ouvrant droit au CdP ici</span></label>
        <select id="f-charbon"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
    </div>
    <div class="field-row">
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
      <div class="field"><label>Prix Précarité <span class="hint">€/MWhc</span></label><input type="number" id="f-pp" value="" step="0.1" placeholder="ex : 11"></div>
    </div>
    <div class="warn-box" id="warnEtas112"></div>
    <div class="warn-box" id="warnCdp112"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAR-TH-112 vA46-3 à compter du 01-10-2022 · Fiche abrogée au 01-10-2027 · Durée de vie 15 ans · CdP ×4 (classique) / ×5 (modeste) uniquement en remplacement d'un chauffage au charbon (ni fioul, ni gaz, contrairement à BAR-TH-113)</div>
  `);
  const baremeWrap = bareme(body, buildBareme112);

  function calcCore112(zone, etasKey){
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    const pp = parseFloat(document.getElementById('f-pp').value)||0;
    const profil = document.getElementById('f-profil').value;
    const charbon = document.getElementById('f-charbon').value==='oui';
    const kwhcBrut = REF112[etasKey][zone];
    const coef = charbon ? (profil==='classique' ? 4 : 5) : 1;
    const kwhc = kwhcBrut*coef;
    const prix = profil==='tresmodeste' ? pp : pc;
    const prime = kwhc/1000*prix;
    return {kwh:kwhc, kwhBrut:kwhcBrut, prime, coef, charbon, profil};
  }
  function calc(){
    const zone = document.getElementById('f-zone').value;
    const etasKey = document.getElementById('f-etas').value;
    const combustible = document.getElementById('f-combustible').value;
    const seuilEtas = combustible==='granules' ? 80 : 66;
    const etasMin = etasKey==='66-72' ? 66 : (etasKey==='72-80' ? 72 : 80);

    const warnEtas = document.getElementById('warnEtas112');
    if(combustible==='granules' && etasKey!=='80+'){
      warnEtas.innerHTML = `⚠ <b>Etas insuffisant pour des granulés :</b> seuil minimum 80% requis, bande sélectionnée sous ce seuil. Non éligible en l'état (sauf label Flamme Verte).`;
      warnEtas.classList.add('show');
    } else {
      warnEtas.classList.remove('show');
    }

    const {kwh:kwhc, kwhBrut, prime, coef, charbon, profil} = calcCore112(zone, etasKey);
    const warnCdp = document.getElementById('warnCdp112');
    if(!charbon){
      warnCdp.innerHTML = `ℹ️ Pas de Coup de Pouce : BAR-TH-112 n'est bonifiée que si l'appareil remplace un chauffage fonctionnant au <b>charbon</b> — le fioul et le gaz n'ouvrent pas droit à cette bonification ici (à la différence de BAR-TH-113).`;
      warnCdp.classList.add('show');
    } else {
      warnCdp.classList.remove('show');
    }

    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">kWh cumac ${coef>1?`(bonifié ×${coef}, brut ${kwh(kwhBrut)})`:''}</span><span class="result-val" style="font-size:14px">${kwh(kwhc)}</span></div>
      <div class="result-row ${profil==='tresmodeste'?'prec':'cdp'}"><span class="result-label">Prime ${profil==='tresmodeste'?'(prix précarité)':'(prix classique)'}</span><span class="result-val">${eur(prime)}</span></div>
    `;
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme112(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const pp = parseFloat(document.getElementById('f-pp').value)||0;
  const curZone = document.getElementById('f-zone').value;
  const curEtas = document.getElementById('f-etas').value;

  let html = `<table class="bareme"><thead><tr><th>Classe Etas</th><th>Zone</th><th>kWh cumac</th><th>Classique</th><th>Précarité</th><th>CdP ×4 Classique</th><th>CdP ×5 Modeste</th><th>CdP ×5 Précarité</th></tr></thead><tbody>`;
  Object.keys(REF112).forEach(ek=>{
    ['H1','H2','H3'].forEach((zone,i)=>{
      const v = REF112[ek][zone];
      const isCur = ek===curEtas && zone===curZone;
      html += `<tr class="${isCur?'hl':''} ${i===2?'grp-end':''}">`;
      if(i===0) html += `<td rowspan="3" style="text-align:left;font-weight:700;font-size:11px">${ETAS112_LABELS[ek]}</td>`;
      html += `<td class="zone-cell z-${zone.toLowerCase()}">${zone}</td>`;
      html += `<td>${num(v)}</td>`;
      html += `<td class="num-c">${eur(v/1000*pc)}</td>`;
      html += `<td class="num-p">${eur(v/1000*pp)}</td>`;
      html += `<td class="num-cdp">${eur(v*4/1000*pc)}</td>`;
      html += `<td class="num-cdp">${eur(v*5/1000*pc)}</td>`;
      html += `<td class="num-cdp">${eur(v*5/1000*pp)}</td>`;
      html += `</tr>`;
    });
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
