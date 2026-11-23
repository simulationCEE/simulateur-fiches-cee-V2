// ═══════════════════════════════════════════════════════════════════════
// RENDER: BAT-TH-116 (Système de gestion technique du bâtiment — GTB)
// Source : fiche BAT-TH-116 vA62-6 à compter du 01-01-2025 (opérations engagées avant le 01/01/2030)
// Durée de vie conventionnelle : 15 ans
// kWh cumac = Σ usages ( forfait[classe][secteur][usage] × surface gérée pour l'usage ) × facteur zone
// Facteur zone : H1 1,1 · H2 0,9 · H3 0,6
// ═══════════════════════════════════════════════════════════════════════
const GTB116_USAGES = [
  { k:'ch',   label:'Chauffage',                         hint:'m² — usage obligatoire en France métropolitaine' },
  { k:'clim', label:'Refroidissement / climatisation',   hint:'m²' },
  { k:'ecs',  label:'Eau chaude sanitaire (ECS)',         hint:'m² — surface chauffée gérée par le système' },
  { k:'ecl',  label:'Éclairage',                          hint:'m²' },
  { k:'aux',  label:'Auxiliaires',                        hint:'m²' },
];
const GTB116_SECTEURS = {
  bureaux:     'Bureaux',
  enseignement:'Enseignement (amphithéâtres inclus)',
  commerces:   'Commerces (hors entrepôts, réserves, stockage)',
  hotellerie:  'Hôtellerie, restauration',
  sante:       'Santé',
};
// kWh cumac / m² — [chauffage, climatisation, ECS, éclairage, auxiliaires] ; null = usage non éligible (« - » dans la fiche)
const GTB116_FORFAITS = {
  A: {
    bureaux:      [360, 233, 15, 184, 19],
    enseignement: [170,  60, 82,  46,  6],
    commerces:    [520, 150, 30, null, 6],
    hotellerie:   [400,  60, 32,  65,  6],
    sante:        [150,  60, 87, null, 19],
  },
  B: {
    bureaux:      [240,  97,  7,  90,  8],
    enseignement: [100,  23, 38,  21,  3],
    commerces:    [250,  44, 13, null, 3],
    hotellerie:   [200,  23, 14,  30,  3],
    sante:        [ 90,  23, 40, null, 9],
  },
};
const GTB116_ZONE = { H1:1.1, H2:0.9, H3:0.6 };

function renderBAT116(body){
  body.insertAdjacentHTML('beforeend', `
    <div class="cond-box"><b>Conditions :</b> Bâtiment tertiaire existant · Mise en place par un professionnel · Achat d'un système neuf de GTB, ou amélioration d'un système existant au plus de classe C (NF EN ISO 52120-1 : 2022) · Le système assure, par un système d'automatisation centralisé, les fonctions de régulation de <b>classe B ou A</b> pour le chauffage et, le cas échéant, l'ECS, le refroidissement/climatisation, l'éclairage ou les auxiliaires · Le simple raccordement à une GTB existante n'est pas éligible · Preuve de réalisation : mention de la classe B ou A, ou marque et référence + attestation du professionnel · Non cumulable avec BAT-EQ-127 (éclairage), BAT-SE-103, BAT-TH-108, BAT-TH-109 (chauffage) et BAT-TH-122 (climatisation) · Engagement avant le 01/01/2030</div>
  `);
  const secteurOpts = Object.entries(GTB116_SECTEURS).map(([k,v])=>`<option value="${k}">${v}</option>`).join('');
  const surfFields = GTB116_USAGES.map(u => `
      <div class="field"><label>Surface gérée — ${u.label} <span class="hint">${u.hint}</span></label><input type="number" id="f-s116-${u.k}" value="${u.k==='ch'?1000:0}" min="0" step="1"></div>`);
  body.insertAdjacentHTML('beforeend', `
    <div class="field-row align-inputs">
      <div class="field"><label>Zone climatique</label>
        <select id="f-zone"><option>H1</option><option>H2</option><option>H3</option></select>
      </div>
      <div class="field"><label>Secteur d'activité</label><select id="f-sect116">${secteurOpts}</select></div>
    </div>
    <div class="field-row align-inputs">
      <div class="field"><label>Classe du système installé <span class="hint">NF EN ISO 52120-1 : 2022</span></label>
        <select id="f-classe116"><option value="A">Classe A</option><option value="B" selected>Classe B</option></select>
      </div>
      <div class="field"><label>Type d'opération</label>
        <select id="f-op116">
          <option value="neuf">Achat d'un système neuf de GTB</option>
          <option value="amelio">Amélioration d'une GTB existante de classe C ou D</option>
          <option value="amelioAB">Amélioration d'une GTB existante déjà de classe B ou A</option>
          <option value="raccord">Simple raccordement à une GTB existante</option>
        </select>
      </div>
    </div>
    <div class="field-row align-inputs">${surfFields[0]}${surfFields[1]}</div>
    <div class="field-row align-inputs">${surfFields[2]}${surfFields[3]}</div>
    <div class="field-row align-inputs">${surfFields[4]}
      <div class="field"><label>Prix Classique <span class="hint">€/MWhc</span></label><input type="number" id="f-pc" value="" step="0.1" placeholder="ex : 7,8"></div>
    </div>
    <div class="warn-box" id="warnElig116"></div>
    <div class="divider"></div>
    <div class="results" id="results"></div>
    <div class="source-note">Source : BAT-TH-116 vA62-6 à compter du 01-01-2025 (opérations engagées avant le 01/01/2030) · Durée de vie 15 ans · kWh cumac = Σ (forfait par m² de l'usage × surface gérée pour l'usage) × facteur zone (H1 1,1 · H2 0,9 · H3 0,6)</div>
  `);
  const baremeWrap = bareme(body, buildBareme116);

  function read116(){
    const v = id => parseFloat(document.getElementById(id).value)||0;
    const surf = {};
    GTB116_USAGES.forEach(u => surf[u.k] = v('f-s116-' + u.k));
    return {
      zone: document.getElementById('f-zone').value,
      secteur: document.getElementById('f-sect116').value,
      classe: document.getElementById('f-classe116').value,
      op: document.getElementById('f-op116').value,
      surf, pc: v('f-pc'),
    };
  }

  // sCh paramétrable pour le tableau d'écart ; les autres surfaces restent celles saisies.
  function calcCore116(sCh){
    const d = read116();
    const forf = GTB116_FORFAITS[d.classe][d.secteur];
    const fz = GTB116_ZONE[d.zone];
    const parts = GTB116_USAGES.map((u,i) => {
      const s = u.k === 'ch' ? Math.max(0, sCh) : d.surf[u.k];
      const f = forf[i];
      return { u, s, f, kwh: f == null ? 0 : f * s * fz };
    });
    const total = parts.reduce((a,p)=>a+p.kwh, 0);
    return { kwh:total, prime:total/1000*d.pc, parts, fz };
  }

  let adjWrap;
  function calc(){
    const d = read116();
    // Éclairage non éligible en commerces et santé (« - » dans la fiche)
    const eclNA = GTB116_FORFAITS[d.classe][d.secteur][3] == null;
    const ecl = document.getElementById('f-s116-ecl');
    ecl.disabled = eclNA;
    if(eclNA) ecl.value = 0;
    const r = calcCore116(d.surf.ch);

    const pbs = [];
    if(d.op === 'amelioAB') pbs.push("l'amélioration n'est éligible que si la GTB existante est au plus de classe C");
    if(d.op === 'raccord') pbs.push("le simple raccordement d'un bâtiment à une GTB existante n'est pas éligible");
    if(d.surf.ch <= 0) pbs.push("l'usage chauffage doit être géré par le système (surface chauffage à renseigner)");
    const ineligible = pbs.length > 0;
    const warn = document.getElementById('warnElig116');
    if(ineligible){ warn.innerHTML = `⚠ <b>Opération non éligible en l'état :</b> ${pbs.join(' · ')}.`; warn.classList.add('show'); }
    else warn.classList.remove('show');

    const k = ineligible ? 0 : r.kwh;
    const pr = ineligible ? 0 : r.prime;
    const lignes = r.parts.filter(p => p.s > 0 && p.f != null).map(p =>
      `<div class="result-row"><span class="result-label">${p.u.label} (${num(p.f)} × ${num(p.s)} m² × ${String(r.fz).replace('.',',')})</span><span class="result-val" style="font-size:14px">${kwh(p.kwh)}</span></div>`).join('');
    document.getElementById('results').innerHTML = `
      ${lignes}
      <div class="result-row"><span class="result-label">kWh cumac total${ineligible ? ' (non éligible)' : ''}</span><span class="result-val" style="font-size:14px">${kwh(k)}</span></div>
      <div class="result-row hi"><span class="result-label">Prime Classique (totale)</span><span class="result-val">${eur(pr)}</span></div>
    `;

    if(!adjWrap){
      adjWrap = adjustableTable(body, {
        unitLabel:'m²', paramLabel:'Surface chauffage', defaultStep:500, defaultRep:2,
        getBase: () => parseFloat(document.getElementById('f-s116-ch').value)||0,
        minValid: 1,
        calc: (val) => { const res = calcCore116(val); return {kwh:res.kwh, prime:res.prime}; }
      });
    } else {
      adjWrap.refresh();
    }
    baremeWrap.refresh();
  }
  body.querySelectorAll('input,select').forEach(i=>i.addEventListener('input',calc));
  calc();
}

function buildBareme116(wrap){
  const pc = parseFloat(document.getElementById('f-pc').value)||0;
  const zone = document.getElementById('f-zone').value;
  const classe = document.getElementById('f-classe116').value;
  const curSect = document.getElementById('f-sect116').value;
  const fz = GTB116_ZONE[zone];
  let html = `<table class="bareme"><thead><tr><th>Secteur (classe ${classe})</th>${GTB116_USAGES.map(u=>`<th>${u.label}<br>kWhc/m² · €/m²</th>`).join('')}</tr></thead><tbody>`;
  Object.entries(GTB116_SECTEURS).forEach(([k,lab])=>{
    html += `<tr class="${k===curSect?'hl':''}"><td style="text-align:left">${lab.split(' (')[0]}</td>`;
    GTB116_FORFAITS[classe][k].forEach(f=>{
      html += f == null ? `<td>—</td>` : `<td>${num(f)} · <span class="num-c">${eur2(f*fz/1000*pc)}</span></td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table><div class="source-note">kWh cumac par m² de surface gérée (valeurs de la fiche, avant facteur zone). Les montants en €/m² incluent le facteur de la zone ${zone} (×${String(fz).replace('.',',')}) et le prix classique saisi. « — » : usage non éligible pour ce secteur.</div>`;
  wrap.innerHTML = html;
}
