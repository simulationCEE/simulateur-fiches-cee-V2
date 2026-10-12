// ═══════════════════════════════════════════════════════════════════════
// RENDER: Haute pression flottante sur groupe de production de froid
//   IND-UT-116 (industrie, partie A v. A14.1)
//   BAT-TH-134 (tertiaire, France métropolitaine, partie A v. A22.1)
// Formule commune : kWh cumac = Forfait (zone × type de condensation [× application]) × P
//   P = puissance électrique nominale du groupe de froid (kW), plaque signalétique,
//       hors compresseurs de secours (BAT-TH-134).
// Durée de vie conventionnelle : 14 ans. Pas de tarif Précarité (industrie / tertiaire).
// ═══════════════════════════════════════════════════════════════════════
const HPF_CONDENSATION = {
  atmo: 'Par rapport à l\'atmosphère (air sec, adiabatique, évaporatif, tour…)',
  eau:  'À eau seule (nappe ou cours d\'eau)',
};

const HPF_FORFAITS = {
  'IND-UT-116': {
    unique: { H1:{atmo:14300, eau:11700}, H2:{atmo:14300, eau:11700}, H3:{atmo:13500, eau:10400} },
  },
  'BAT-TH-134': {
    confort:    { H1:{atmo:2000,  eau:670},   H2:{atmo:1800,  eau:480},   H3:{atmo:1600,  eau:290}   },
    datacenter: { H1:{atmo:22800, eau:14500}, H2:{atmo:20500, eau:13900}, H3:{atmo:20200, eau:11300} },
    autres:     { H1:{atmo:19100, eau:13400}, H2:{atmo:17000, eau:12800}, H3:{atmo:16400, eau:10500} },
  },
};

const HPF_APPLICATIONS = {
  confort:    'Climatisation de confort des occupants',
  datacenter: 'Climatisation d\'un datacenter',
  autres:     'Réfrigération ou conditionnement d\'ambiance hors confort',
};

function renderHPFlottante(body, code){
  const isTer = code === 'BAT-TH-134';
  const cond = isTer
    ? `<b>Conditions :</b> Bâtiment tertiaire en France métropolitaine · Régulation qui calcule en continu la consigne de pression de condensation selon la température extérieure mesurée · Mise en place par un professionnel · <b>Étude technique préalable</b> (besoins en froid, type de groupe mono ou multi-compresseurs, puissance électrique nominale totale) · Climatisation de confort exclue dans un bâtiment neuf de catégorie CE1 · Compresseurs de secours non comptés dans P`
    : `<b>Conditions :</b> Secteur industrie · Régulation qui calcule en continu la consigne de pression de condensation selon la température extérieure mesurée et ajuste la puissance de refroidissement au condenseur · Mise en place par un professionnel · Facture mentionnant un « système de régulation sur un groupe de production de froid »`;
  body.insertAdjacentHTML('beforeend', `<div class="cond-box">${cond}</div>`);

  body.insertAdjacentHTML('beforeend', `
    ${isTer ? `
    <div class="field-row align-inputs">
      <div class="field"><label>Application du groupe de froid</label>
        <select id="f-app-hpf">
          ${Object.entries(HPF_APPLICATIONS).map(([k,v])=>`<option value="${k}"${k==='autres'?' selected':''}>${v}</option>`).join('')}
        </select>
      </div>
      <div class="field" id="field-ce1-hpf"><label>Bâtiment neuf de catégorie CE1</label>
        <select id="f-ce1-hpf"><option value="non">Non</option><option value="oui">Oui</option></select>
      </div>
    </div>` : ''}
    <div class="field-row align-inputs">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Type de condensation</label>
        <select id="f-cond-hpf">
          ${Object.entries(HPF_CONDENSATION).map(([k,v])=>`<option value="${k}">${v}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Puissance électrique nominale du groupe de froid <span class="hint">kW, plaque signalétique${isTer ? ', hors compresseurs de secours' : ''}</span></label><input type="number" id="f-p-hpf" value="${isTer ? 150 : 200}" min="0" step="0.1"></div>
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="warn-box" id="warnElig-hpf"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : ${code} ${isTer ? 'partie A v. A22.1' : 'partie A v. A14.1'} · Durée de vie 14 ans · P = puissance électrique nominale du groupe de froid (plaque signalétique, à défaut document du fabricant)${isTer ? ', hors compresseurs de secours · Document justificatif : étude technique préalable' : ''} · Condensation à eau seule = eau de nappe ou de cours d'eau ; tous les autres condenseurs (air, adiabatique, évaporatif, tours) relèvent de la condensation par rapport à l'atmosphère</div>
  `);
  const baremeWrap = bareme(body, wrap => buildBaremeHPF(wrap, code));

  function readHPF(){
    const app = isTer ? document.getElementById('f-app-hpf').value : 'unique';
    const ce1 = isTer ? document.getElementById('f-ce1-hpf').value === 'oui' : false;
    const zone = document.getElementById('f-zone').value;
    const condType = document.getElementById('f-cond-hpf').value;
    const p = parseFloat(document.getElementById('f-p-hpf').value)||0;
    const pc = parseFloat(document.getElementById('f-pc').value)||0;
    return {app, ce1, zone, condType, p, pc};
  }

  function calcCoreHPF(pVal){
    const {app, zone, condType, pc} = readHPF();
    const forfait = HPF_FORFAITS[code][app][zone][condType];
    const kwhc = forfait * Math.max(0, pVal);
    return {kwh:kwhc, prime:kwhc/1000*pc, forfait};
  }

  let adjWrap;
  function calc(){
    const {app, ce1, p} = readHPF();
    if(isTer){
      // La question CE1 ne concerne que la climatisation de confort
      document.getElementById('field-ce1-hpf').style.display = app === 'confort' ? '' : 'none';
    }
    const r = calcCoreHPF(p);

    const pbs = [];
    if(isTer && app === 'confort' && ce1) pbs.push('climatisation de confort dans un bâtiment neuf de catégorie CE1 : opération exclue');
    if(p <= 0) pbs.push('puissance électrique du groupe de froid non renseignée');
    const warn = document.getElementById('warnElig-hpf');
    if(pbs.length){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const exclu = isTer && app === 'confort' && ce1;
    document.getElementById('results').innerHTML = `
      <div class="result-row"><span class="result-label">Forfait unitaire</span><span class="result-val" style="font-size:14px">${num(r.forfait)} kWhc / kW</span></div>
      <div class="result-row"><span class="result-label">Puissance électrique P</span><span class="result-val" style="font-size:14px">${num(p)} kW</span></div>
      <div class="result-row"><span class="result-label">kWh cumac total</span><span class="result-val" style="font-size:14px">${kwh(exclu ? 0 : r.kwh)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(exclu ? 0 : r.prime)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'kW', paramLabel:'Puissance P', defaultStep:25, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-p-hpf').value)||0,
        minValid: 0,
        calc: (val) => { const res = calcCoreHPF(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBaremeHPF(wrap, code){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const isTer = code === 'BAT-TH-134';
  const curApp = isTer ? document.getElementById('f-app-hpf').value : 'unique';
  const curZone = document.getElementById('f-zone').value;
  const curCond = document.getElementById('f-cond-hpf').value;
  const apps = isTer ? Object.keys(HPF_APPLICATIONS) : ['unique'];

  let html = `<table class="bareme"><thead><tr>${isTer?'<th>Application</th>':''}<th>Zone</th><th>Atmosphère (kWhc/kW)</th><th>Eau seule (kWhc/kW)</th><th>Prime / kW (${curCond==='atmo'?'atmosphère':'eau seule'})</th></tr></thead><tbody>`;
  apps.forEach(app=>{
    ['H1','H2','H3'].forEach((z, idx)=>{
      const v = HPF_FORFAITS[code][app][z];
      const isCur = app===curApp && z===curZone;
      html += `<tr class="${isCur?'hl':''}${idx===2?' grp-end':''}">`;
      if(isTer) html += `<td>${idx===0 ? HPF_APPLICATIONS[app] : ''}</td>`;
      html += `<td>${z}</td><td>${num(v.atmo)}</td><td>${num(v.eau)}</td><td class="num-c">${eur2(v[curCond]/1000*pc)}</td></tr>`;
    });
  });
  html += `</tbody></table><div class="source-note">Valeurs en kWh cumac par kW de puissance électrique nominale du groupe de froid.${isTer ? '' : ' H1 et H2 ont le même forfait.'}</div>`;
  wrap.innerHTML = html;
}
