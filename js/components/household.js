// ═══════════════════════════════════════════════════════════════════════
// PROFIL DU MÉNAGE — fiches résidentielles (BAR-*)
//
// Arrêté du 5 novembre 2026 (JO du 10/11/2026, NOR ECOR2625692A), en vigueur pour les opérations
// ENGAGÉES À PARTIR DU 16/11/2026. Trois catégories de ménages :
//   • ménage très modeste              (II bis de l'article 3-1 de l'arrêté du 29/12/2014)
//   • ménage modeste = « en situation de précarité énergétique » (II ter : déciles de revenus 1 à 5,
//                                       hors très modestes)
//   • autre ménage                      (déciles 6 à 10)
//
// PRIX CEE APPLIQUÉ
//   à partir du 16/11/2026 : très modeste ET modeste → Prix Précarité · autre → Prix Classique
//   avant le 16/11/2026    : très modeste → Prix Précarité · modeste et autre → Prix Classique
//
// COEFFICIENTS DE BONIFICATION (Coup de Pouce) : voir HH_COEF ci-dessous.
// Fiches sans bonification (BAR-EN, BAR-TH-129…) : seul le prix change.
//
// La date d'engagement est lue dans le champ « Date d'engagement prévue » (#regDate) ;
// à défaut, la date du jour.
// ═══════════════════════════════════════════════════════════════════════
const HH_DATE_NEW = '2026-11-16';
const HH_D5 = 16880;   // plafond du décile 5 : revenu fiscal de référence par part (€) — précarité énergétique = déciles 1 à 5
const HH_LABELS = { tresmodeste: 'Ménage très modeste', modeste: 'Ménage modeste', autre: 'Autre ménage' };

// Coefficients Coup de Pouce par fiche : { avant le 16/11/2026, à partir du 16/11/2026 }
// BAR-TH-171/172/113/112 : article 3-6 de l'arrêté du 29/12/2014 modifié (III 1° et IV).
// BAR-TH-168 : fiche SUPPRIMÉE au 04/11/2026, donc avant le 16/11/2026 : seuls les coefficients d'avant s'appliquent
//   (l'arrêté du 05/11/2026 ne la cite pas ; il cite BAR-TH-143 « solaire combiné », absente du simulateur).
const HH_COEF = {
  'BAR-TH-171': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-172': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-113': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-112': { old: { tresmodeste: 5, modeste: 5, autre: 4 }, new: { tresmodeste: 5, modeste: 3, autre: 4 } },
  'BAR-TH-168': { old: { tresmodeste: 5, modeste: 5, autre: 4 }, new: { tresmodeste: 5, modeste: 5, autre: 4 } },
};

function hhDate(){
  const el = document.getElementById('regDate');
  return (el && el.value) ? el.value : new Date().toISOString().slice(0, 10);
}
function hhIsNew(date){ return (date || hhDate()) >= HH_DATE_NEW; }

// 'prec' (Prix Précarité) ou 'class' (Prix Classique) pour un profil donné
function hhKind(profil, date){
  if(profil === 'tresmodeste') return 'prec';
  if(profil === 'modeste') return hhIsNew(date) ? 'prec' : 'class';
  return 'class';
}

// Contexte pour un profil donné : prix retenu et coefficient de bonification de la fiche
function hhCtxFor(code, profil, pc, pp){
  const date = hhDate();
  const regime = hhIsNew(date) ? 'new' : 'old';
  const kind = hhKind(profil, date);
  const coefs = HH_COEF[code];
  return {
    date, regime, profil, kind,
    price: kind === 'prec' ? pp : pc,
    priceLabel: kind === 'prec' ? 'prix précarité' : 'prix classique',
    coef: coefs ? coefs[regime][profil] : 1,
  };
}
// Contexte du profil sélectionné dans le champ « Profil du ménage »
function hhCtx(code, pc, pp, id){
  const el = document.getElementById(id || 'f-menage');
  return hhCtxFor(code, el ? el.value : 'autre', pc, pp);
}

// Prime unique du profil sélectionné : libellé et classe CSS de la ligne
function hhPrimeLabel(hh, texte){ return `${texte || 'Prime'} — ${HH_LABELS[hh.profil].toLowerCase()} (${hh.priceLabel})`; }
// « hi » (sélectionnable dans le comparatif) ; « cdp » si bonifiée ; « prec » ajoute la teinte précarité
function hhRowClass(hh, bonifie){ return bonifie ? 'cdp' : (hh.kind === 'prec' ? 'hi prec' : 'hi'); }

// Libellés du champ « Profil du ménage » : ils disent à quelle catégorie de prix correspond chaque choix
const HH_OPTION_LABELS = {
  new: { tresmodeste: 'Très modeste — précarité énergétique (prix précarité)',
         modeste:     'Modeste — précarité énergétique (prix précarité)',
         autre:       'Autre ménage — hors précarité (prix classique)' },
  old: { tresmodeste: 'Très modeste — précarité (prix précarité)',
         modeste:     'Modeste — hors précarité avant le 16/11/2026 (prix classique)',
         autre:       'Autre ménage (prix classique)' },
};
// Met à jour les libellés selon la date d'engagement (la valeur choisie est conservée)
function hhRefreshOptions(){
  const labels = HH_OPTION_LABELS[hhIsNew() ? 'new' : 'old'];
  ['f-menage', 'f-profil'].forEach(id => {
    const el = document.getElementById(id);
    if(el) [...el.options].forEach(o => { if(labels[o.value]) o.textContent = labels[o.value]; });
  });
}

// Champ « Profil du ménage »
function hhFieldHtml(id){
  const l = HH_OPTION_LABELS.new;
  return `<div class="field"><label>Profil du ménage <span class="hint">repère Anah : bleu = très modeste · jaune = modeste · violet, rose = autre</span></label>
      <select id="${id || 'f-menage'}">
        <option value="autre">${l.autre}</option>
        <option value="modeste">${l.modeste}</option>
        <option value="tresmodeste">${l.tresmodeste}</option>
      </select>
    </div>`;
}

// Bandeau récapitulatif des règles applicables à la date d'engagement
function hhNoteHtml(id){ return `<div class="hh-note" id="${id || 'hhNote'}"></div>`; }
function hhNoteText(code){
  const isNew = hhIsNew();
  const coefs = HH_COEF[code];
  const c = coefs ? coefs[isNew ? 'new' : 'old'] : null;
  const cdp = c ? ` · Coup de Pouce : très modeste ×${c.tresmodeste}, modeste ×${c.modeste}, autre ×${c.autre}` : '';
  if(isNew){
    return `<b>Engagement à partir du 16/11/2026 (arrêté du 5 novembre 2026) :</b> <b>précarité énergétique = ménages très modestes + ménages modestes</b> (revenu fiscal de référence par part ≤ ${HH_D5.toLocaleString('fr-FR')} €) → <b>prix précarité</b> · <b>autres ménages</b> → <b>prix classique</b>${cdp}.`;
  }
  return `<b>Engagement jusqu'au 15/11/2026 :</b> <b>précarité = ménages très modestes seuls</b> → prix précarité · ménages modestes et autres → <b>prix classique</b>${cdp}.`;
}
function hhUpdateNote(code, id){
  const el = document.getElementById(id || 'hhNote');
  if(el) el.innerHTML = hhNoteText(code);
  hhRefreshOptions();
}

// ── Barème Anah 2026 : plafonds de ressources (revenu fiscal de référence du ménage) ──
// Source : tableau « Plafonds de ressources des ménages en 2026 » (hello watt) fourni par EBS Énergie — à confirmer sur anah.gouv.fr
const HH_ANAH_2026 = {
  idf:  { nom: 'Île-de-France',
          base: { tm: [24031, 35270, 42357, 49455, 56580], m: [29253, 42933, 51564, 60208, 68877], i: [40851, 60051, 71846, 84562, 96817] },
          extra: { tm: 7116, m: 8663, i: 12257 } },
  hidf: { nom: 'Hors Île-de-France et Outre-mer',
          base: { tm: [17363, 25393, 30540, 35676, 40835], m: [22259, 32553, 39148, 45735, 52348], i: [31185, 45842, 55196, 64550, 73907] },
          extra: { tm: 5151, m: 6598, i: 9357 } },
};
const HH_ANAH_LABELS = {
  tm: { nom: 'Ménage très modeste (bleu)',      champ: 'Ménages très modestes', prix: 'précarité énergétique → prix précarité' },
  m:  { nom: 'Ménage modeste (jaune)',          champ: 'Ménages modestes',      prix: 'précarité énergétique → prix précarité (engagement à partir du 16/11/2026)' },
  i:  { nom: 'Ménage intermédiaire (violet)',   champ: 'Autres ménages',        prix: 'hors précarité énergétique → prix classique' },
  s:  { nom: 'Ménage supérieur (rose)',         champ: 'Autres ménages',        prix: 'hors précarité énergétique → prix classique' },
};
// Plafond d'une catégorie (tm, m, i) pour un nombre de personnes ; au-delà de 5 : + montant par personne supplémentaire
function hhAnahCeiling(zone, cat, persons){
  const z = HH_ANAH_2026[zone], arr = z.base[cat], p = Math.max(1, Math.floor(persons || 1));
  return p <= 5 ? arr[p - 1] : arr[4] + (p - 5) * z.extra[cat];
}
// Catégorie Anah : première dont le plafond couvre le revenu ; sinon « supérieur »
function hhAnahCategory(zone, persons, rfr){
  for(const cat of ['tm', 'm', 'i']) if(rfr <= hhAnahCeiling(zone, cat, persons)) return cat;
  return 's';
}
function hhAnahHtml(){
  const f = n => n.toLocaleString('fr-FR');
  const table = zone => {
    const z = HH_ANAH_2026[zone];
    const rows = [0, 1, 2, 3, 4].map(k => `<tr><td>${k + 1}</td><td>${f(z.base.tm[k])} €</td><td>${f(z.base.m[k])} €</td><td>${f(z.base.i[k])} €</td><td>&gt; ${f(z.base.i[k])} €</td></tr>`).join('');
    return `<table class="hh-anah-table"><caption>${z.nom}</caption>
      <thead><tr><th>Personnes</th><th class="tm">Très modestes</th><th class="m">Modestes</th><th class="i">Intermédiaires</th><th class="s">Supérieurs</th></tr></thead>
      <tbody>${rows}<tr><td>Par personne en +</td><td>+ ${f(z.extra.tm)} €</td><td>+ ${f(z.extra.m)} €</td><td>+ ${f(z.extra.i)} €</td><td>+ ${f(z.extra.i)} €</td></tr></tbody></table>`;
  };
  return `<details class="hh-anah"><summary>Barème Anah 2026 : retrouver la catégorie d'un ménage</summary>
    <div class="hh-anah-body">
      <div class="hh-anah-row">
        <label>Zone <select id="hhAnahZone"><option value="hidf">Hors Île-de-France et Outre-mer</option><option value="idf">Île-de-France</option></select></label>
        <label>Nombre de personnes du ménage <input type="number" id="hhAnahPers" min="1" value="2"></label>
        <label>Revenu fiscal de référence du ménage (€) <input type="number" id="hhAnahRfr" min="0" step="100" placeholder="ex : 28 000"></label>
      </div>
      <div class="hh-anah-res" id="hhAnahRes"></div>
      ${table('hidf')}${table('idf')}
      <p class="hh-anah-src">Plafonds de ressources 2026 (revenu fiscal de référence du ménage). Source : tableau hello watt fourni par EBS Énergie, à confirmer sur anah.gouv.fr. Repère indicatif : à partir du 16/11/2026, l'arrêté du 5 novembre 2026 définit la précarité énergétique par le revenu fiscal de référence par part (≤ ${HH_D5.toLocaleString('fr-FR')} €).</p>
    </div></details>`;
}
function hhInjectAnah(body){
  if(body.querySelector('.hh-anah')) return;
  if(typeof currentFiche !== 'undefined' && currentFiche && currentFiche.code === 'BAR-TH-168') return;
  const note = body.querySelector('#hhNote');
  if(!note) return;
  note.insertAdjacentHTML('afterend', hhAnahHtml());
  const box = body.querySelector('.hh-anah');
  const res = box.querySelector('#hhAnahRes');
  function update(){
    const rfrRaw = box.querySelector('#hhAnahRfr').value;
    if(rfrRaw === ''){ res.className = 'hh-anah-res'; res.textContent = 'Renseignez le revenu fiscal de référence du ménage pour connaître sa catégorie.'; return; }
    const cat = hhAnahCategory(box.querySelector('#hhAnahZone').value, parseFloat(box.querySelector('#hhAnahPers').value) || 1, parseFloat(rfrRaw) || 0);
    const l = HH_ANAH_LABELS[cat];
    res.className = 'hh-anah-res ' + cat;
    res.innerHTML = `${l.nom} → à compter dans « ${l.champ} » (${l.prix})`;
  }
  box.querySelectorAll('select,input').forEach(el => el.addEventListener('input', update));
  update();
}

// Alerte en tête de chaque fiche concernée par le changement du 16/11/2026
function hhInjectAlert(body){
  if(body.querySelector('.hh-alert')) return;
  if(typeof currentFiche !== 'undefined' && currentFiche && currentFiche.code === 'BAR-TH-168') return; // fiche supprimée au 04/11/2026
  body.insertAdjacentHTML('afterbegin', `<div class="warn-box show hh-alert"><b>⚠ Attention : la date d'engagement peut faire varier votre prime.</b> Pour les opérations engagées à partir du <b>16/11/2026</b>, la définition de la précarité énergétique change (arrêté du 5 novembre 2026) : les ménages en précarité énergétique (très modestes <b>et</b> modestes) sont valorisés au prix précarité, les autres ménages au prix classique, et les coefficients Coup de Pouce évoluent. Pour un engagement avant cette date, seuls les ménages très modestes sont au prix précarité.</div>`);
}

// Champ « résidence principale » : condition du Coup de Pouce BAR-TH-171/172 à partir du 16/11/2026
function hhResPrincField(id){
  return `<div class="field"><label>Logement occupé à titre de résidence principale</label>
      <select id="${id || 'f-respr'}"><option value="oui">Oui</option><option value="non">Non</option></select>
    </div>`;
}

// Recalcul quand la date d'engagement change (le champ est ajouté après le rendu de la fiche)
function hhWatch(body, calc){
  hhInjectAlert(body);
  hhInjectAnah(body);
  body.addEventListener('input', e => { if(e.target && e.target.id === 'regDate') calc(); });
  setTimeout(calc, 0);
}

// ── Fiches collectives (BAR-TH-177, BAR-TH-179) : plusieurs ménages dans l'opération ──
// Fiches collectives : le nombre de logements de chaque catégorie est SAISI ; le total de logements en est la SOMME.
const HH_READONLY_STYLE = 'background:var(--bg);color:var(--text-2);cursor:default';
function hhOthersFieldHtml(defaut){
  return `<div class="field"><label>Autres ménages (hors précarité énergétique) <span class="hint">nombre de logements · repère Anah : violet, rose</span></label>
      <input type="number" id="f-na" value="${defaut || 0}" min="0"></div>`;
}
// Total de logements = très modestes + modestes + autres (champ total en lecture seule)
function hhSyncTotal(totalId, tmId, mId, aId){
  const v = id => parseFloat((document.getElementById(id) || {}).value) || 0;
  const total = document.getElementById(totalId);
  if(total) total.value = v(tmId) + v(mId) + v(aId);
}
// Bandeau des règles de prix selon la date d'engagement
function hhMixRefresh(){
  const note = document.getElementById('hhNote');
  if(note) note.innerHTML = hhMixNoteText();
}

// Part des logements facturée au Prix Précarité : très modestes + (modestes à partir du 16/11/2026)
function hhShare(nTM, nM, n){
  const prec = (nTM || 0) + (hhIsNew() ? (nM || 0) : 0);
  return n > 0 ? Math.min(1, prec / n) : 0;
}
// Prix moyen pondéré selon la répartition des logements
function hhMixPrice(nTM, nM, n, pc, pp){
  const s = hhShare(nTM, nM, n);
  return pp * s + pc * (1 - s);
}
function hhMixNoteText(){
  if(hhIsNew()){
    return `<b>Engagement à partir du 16/11/2026 :</b> précarité énergétique = <b>ménages très modestes + ménages modestes</b> → <b>prix précarité</b> · <b>autres ménages</b> → <b>prix classique</b>. Le nombre de logements est la somme des trois catégories.`;
  }
  return `<b>Engagement jusqu'au 15/11/2026 :</b> précarité = <b>ménages très modestes seuls</b> → prix précarité · ménages modestes et autres → <b>prix classique</b>. Le nombre de logements est la somme des trois catégories.`;
}
