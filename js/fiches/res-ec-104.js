// ═══════════════════════════════════════════════════════════════════════
// RENDER: RES-EC-104 (Rénovation d'éclairage extérieur — luminaires LED)
// Source : fiche RES-EC-104 vA77-3 à compter du 26-11-2025 (opérations engagées avant le 01/01/2030) · Durée de vie 30 ans
// kWh cumac = 4 000 × N1 (gradation seule) + 5 600 × N2 (gradation + détection de présence)
// Bénéficiaire : État, collectivités territoriales, leurs groupements ou établissements publics · Prix classique
// ═══════════════════════════════════════════════════════════════════════
const REF_EC104 = { grad: 4000, detect: 5600 };

function renderRESEC104(body){
  body.insertAdjacentHTML('beforeend', `<div class="cond-box"><b>Conditions :</b> Éclairage public extérieur existant (fonctionnel : autoroutier, routier, urbain ; ambiances urbaines : rues, parcs, allées, voies piétonnes, parkings) · Hors mise en valeur des sites, terrains de sport et zones extérieures couvertes · Bénéficiaire : <b>État, collectivités territoriales, leurs groupements ou établissements publics</b> · Pose par un professionnel · Luminaires neufs à module LED (IP ≥ 65) ou rééquipement (module LED + appareillage) · Efficacité à 50 % du flux nominal ≥ 135 lm/W (≥ 2 500 K) ou ≥ 110 lm/W (&lt; 2 500 K) · L90B50 ≥ 100 000 h · Mortalité de l'appareillage à 100 000 h ≤ 10 % · Auxiliaires et module LED remplaçables · Pilotage automatique (pas d'allumage de jour) · Gradation ≥ 50 % ou extinction au moins 5 h par nuit · Détection de présence en option (couverture complète, zones qui se chevauchent) · Preuve de recyclage des luminaires déposés · Non cumulable avec RES-EC-103</div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Luminaires avec gradation seule <span class="hint">N1 · remplacés ou rééquipés</span></label><input type="number" id="f-n1" value="100" min="0"></div>
      <div class="field"><label>Luminaires avec gradation et détection de présence <span class="hint">N2 · remplacés ou rééquipés</span></label><input type="number" id="f-n2" value="0" min="0"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Bénéficiaire</label><select id="f-benef104"><option value="public">État, collectivité, groupement ou établissement public</option><option value="prive">Autre (privé)</option></select></div>
      <div class="field"><label>Type d'opération</label><select id="f-op104"><option value="neuf">Luminaires neufs à module LED</option><option value="reeq">Rééquipement de luminaires existants</option></select></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Température de couleur <span class="hint">K</span></label><input type="number" id="f-k104" value="" step="100" placeholder="ex : 3000"></div>
      <div class="field"><label>Efficacité lumineuse à 50 % du flux nominal <span class="hint">lm/W · ≥ 135 (≥ 2 500 K) ou ≥ 110 (&lt; 2 500 K)</span></label><input type="number" id="f-eff104" value="" step="1" placeholder="ex : 150"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Durée de vie L90B50 du module LED <span class="hint">heures · ≥ 100 000</span></label><input type="number" id="f-l90" value="" step="1000" placeholder="ex : 100000"></div>
      <div class="field"><label>Taux de mortalité de l'appareillage à 100 000 h <span class="hint">% · ≤ 10</span></label><input type="number" id="f-mort" value="" step="0.1" placeholder="ex : 10"></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field" id="f-ip-wrap"><label>Degré de protection du luminaire neuf <span class="hint">IP · ≥ 65</span></label><input type="number" id="f-ip" value="" step="1" placeholder="ex : 66"></div>
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="warn-box" id="warnElig104"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : RES-EC-104 vA77-3 à compter du 26-11-2025 (opérations engagées avant le 01/01/2030) · Durée de vie 30 ans · Montant = 4 000 kWhc × N1 (gradation seule) + 5 600 kWhc × N2 (gradation + détection de présence)</div>
  `);
  const baremeWrap = bareme(body, buildBaremeEC104);

  // n1 paramétrable pour le tableau d'écart ; N2 reste celui saisi
  function calcCoreEC104(n1){
    const n2=parseFloat(document.getElementById('f-n2').value)||0;
    const pc=parseFloat(document.getElementById('f-pc').value)||0;
    const k1=REF_EC104.grad*Math.max(0,n1), k2=REF_EC104.detect*Math.max(0,n2);
    return {kwh:k1+k2, prime:(k1+k2)/1000*pc, k1, k2, n2};
  }
  let adjWrap;
  let revWrap;
  function calc(){
    const v = id => document.getElementById(id).value;
    const neuf = v('f-op104')==='neuf';
    document.getElementById('f-ip-wrap').style.visibility = neuf ? '' : 'hidden';
    const pbs=[];
    if(v('f-benef104')==='prive') pbs.push("le bénéficiaire doit être l'État, une collectivité territoriale, un groupement ou un établissement public");
    if(v('f-eff104')!==''){
      const K = parseFloat(v('f-k104')), seuil = (!isNaN(K) && K < 2500) ? 110 : 135;
      if(parseFloat(v('f-eff104')) < seuil) pbs.push(`efficacité lumineuse ${v('f-eff104')} lm/W : doit être ≥ ${seuil} lm/W${isNaN(K)?' (seuil des modules ≥ 2 500 K, température non renseignée)':''}`);
    }
    if(v('f-l90')!=='' && parseFloat(v('f-l90')) < 100000) pbs.push('durée de vie L90B50 inférieure à 100 000 h');
    if(v('f-mort')!=='' && parseFloat(v('f-mort')) > 10) pbs.push("taux de mortalité de l'appareillage supérieur à 10 %");
    if(neuf && v('f-ip')!=='' && parseFloat(v('f-ip')) < 65) pbs.push('degré de protection du luminaire neuf inférieur à IP 65');
    const ineligible=pbs.length>0;
    const warn=document.getElementById('warnElig104');
    if(ineligible){ warn.innerHTML=`⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');
    const n1=parseFloat(v('f-n1'))||0;
    const r=calcCoreEC104(n1);
    const k=ineligible?0:r.kwh, pr=ineligible?0:r.prime, n=n1+r.n2;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Gradation seule (4 000 × ${num(n1)})</span><span class="result-val" style="font-size:14px">${kwh(r.k1)}</span></div>
      <div class="result-row"><span class="result-label">Gradation + détection de présence (5 600 × ${num(r.n2)})</span><span class="result-val" style="font-size:14px">${kwh(r.k2)}</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible?' (non éligible)':''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique</span><span class="result-val">${eur(pr)}</span></div>
      <div class="result-row"><span class="result-label">Prime / luminaire</span><span class="result-val" style="font-size:14px">${n>0?eur(pr/n):'—'}</span></div>
    `;
    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'lum.', paramLabel:'Luminaires gradation seule', defaultStep:25, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-n1').value)||0,
        minValid: 0,
        calc: (val) => { const r = calcCoreEC104(Math.round(val)); return {kwh:r.kwh, prime:r.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    if(!revWrap){
      revWrap = reverseSolver(body, {
        quantityLabel:'nombre de luminaires (gradation seule)', unitLabel:'lum.', integer:true, min:0, max:100000,
        calc: (val) => { const r = calcCoreEC104(Math.round(val)); return {prime:r.prime}; }
      });
    } else {
      revWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeEC104(wrap){
  const pc=parseFloat(document.getElementById('f-pc').value)||0;
  let html = `<table class="bareme"><thead><tr><th>Fonctionnement</th><th>kWh cumac / luminaire</th><th>Prime / luminaire<br>prix classique</th><th>Prime pour 100 luminaires</th></tr></thead><tbody>`;
  [['Gradation seule', REF_EC104.grad], ['Gradation + détection de présence', REF_EC104.detect]].forEach(([l,v])=>{
    html += `<tr><td style="text-align:left">${l}</td><td>${num(v)}</td><td class="num-c">${eur2(v/1000*pc)}</td><td class="num-c">${eur(v*100/1000*pc)}</td></tr>`;
  });
  html += `</tbody></table>`;
  wrap.innerHTML = html;
}
