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

// ── ENGAGEMENT À PARTIR DU 01/01/2027 : projet d'arrêté « bonifications BAR-TH-171 et BAR-TH-172 » ──
// (texte en consultation, NOR et date de signature non renseignés : À CONFIRMER à la publication au JO)
// Article 3-6 III 1° de l'arrêté du 29/12/2014, réécrit : coefficient + montant forfaitaire (kWhc) ajouté, par catégorie de ménage.
//   BAR-TH-171 : très modeste ×5 + 417 000 · modeste (précarité, hors très modeste) ×3 + 417 000
//                · autres ménages ×5 (prix classique)
// Choix EBS (20/11/2026) : revenus intermédiaires et autres ménages regroupés en « autres ménages » ×5, prix classique.
// Le forfait de 400 000 kWhc prévu par le projet pour les ménages aux revenus intermédiaires n'est donc pas appliqué.
// Ne s'applique pas si un dossier MaPrimeRénov' (PTE) a été déposé à l'Anah avant le 01/01/2027 (hors refus) — article 3 du projet.
const HH_DATE_2027 = '2027-01-01';
const HH_2027 = {
  'BAR-TH-171': {
    coef:    { tresmodeste: 5, modeste: 3, autre: 5 },
    forfait: { tresmodeste: 417000, modeste: 417000, autre: 0 },
  },
};
function hhIs2027(date){ return (date || hhDate()) >= HH_DATE_2027; }
// Le régime 2027 s'applique-t-il à cette fiche ? (date ≥ 01/01/2027 et pas de dossier MaPrimeRénov' déposé avant)
function hhRegime2027(code, date){
  if(!HH_2027[code] || !hhIs2027(date)) return false;
  const mpr = document.getElementById('f-mpr');
  return !(mpr && mpr.value === 'oui');
}

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
  const y27 = hhRegime2027(code, date);
  const c = coefs ? (coefs[regime][profil] != null ? coefs[regime][profil] : coefs[regime].autre) : 1;
  return {
    date, regime, profil, kind, y27,
    price: kind === 'prec' ? pp : pc,
    priceLabel: kind === 'prec' ? 'prix précarité' : 'prix classique',
    coef: y27 ? HH_2027[code].coef[profil] : c,
    forfait: y27 ? HH_2027[code].forfait[profil] : 0,   // kWhc ajoutés après application du coefficient
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
  if(hhRegime2027(code)){
    const f = HH_2027[code], n = x => x.toLocaleString('fr-FR');
    return `<b>Engagement à partir du 01/01/2027 (projet d'arrêté, non publié à ce jour : à confirmer) :</b> Coup de Pouce = coefficient <b>+ forfait</b> · très modeste ×${f.coef.tresmodeste} + ${n(f.forfait.tresmodeste)} kWhc · modeste ×${f.coef.modeste} + ${n(f.forfait.modeste)} kWhc · autres ménages ×${f.coef.autre}. <b>Prix précarité</b> : très modestes et modestes · <b>prix classique</b> : autres ménages.`;
  }
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

// ── BAILLEURS SOCIAUX / COPROPRIÉTÉS EN QPV : valorisation différente ──
// Arrêté du 29/12/2014, article 3-1 IV et VI, annexes I et I bis remplacées par l'arrêté du 5 novembre 2026
// (JO du 10/11/2026, texte 10 sur 61), opérations engagées à partir du 16/11/2026.
//  • Logements sociaux (IV) : à défaut de justificatifs de revenus, part précarité = logements sociaux / total × % annexe I bis
//    du département ; part très modestes = logements sociaux / total × % annexe I.
//  • Copropriété en QPV (VI, dérogation) : part précarité = % annexe I bis du département ; part très modestes = % annexe I.
// [code département, nom, % ménages très modestes (annexe I), % ménages en précarité énergétique (annexe I bis)]
const HH_DEPT_PCT = [
  ['01', "Ain", 55, 88],
  ['02', "Aisne", 63, 91],
  ['03', "Allier", 67, 93],
  ['04', "Alpes-de-Haute-Provence", 67, 92],
  ['05', "Hautes-Alpes", 53, 88],
  ['06', "Alpes-Maritimes", 43, 80],
  ['07', "Ardèche", 67, 94],
  ['08', "Ardennes", 64, 93],
  ['09', "Ariège", 74, 95],
  ['10', "Aube", 63, 92],
  ['11', "Aude", 74, 95],
  ['12', "Aveyron", 67, 94],
  ['13', "Bouches-du-Rhône", 61, 89],
  ['14', "Calvados", 60, 91],
  ['15', "Cantal", 65, 93],
  ['16', "Charente", 70, 93],
  ['17', "Charente-Maritime", 67, 93],
  ['18', "Cher", 61, 91],
  ['19', "Corrèze", 68, 93],
  ['2A', "Corse-du-Sud", 59, 87],
  ['2B', "Haute-Corse", 63, 89],
  ['21', "Côte-d’Or", 58, 90],
  ['22', "Côtes-d’Armor", 71, 95],
  ['23', "Creuse", 65, 92],
  ['24', "Dordogne", 67, 93],
  ['25', "Doubs", 64, 91],
  ['26', "Drôme", 70, 94],
  ['27', "Eure", 59, 90],
  ['28', "Eure-et-Loir", 57, 87],
  ['29', "Finistère", 69, 95],
  ['30', "Gard", 77, 95],
  ['31', "Haute-Garonne", 63, 90],
  ['32', "Gers", 64, 91],
  ['33', "Gironde", 55, 88],
  ['34', "Hérault", 68, 93],
  ['35', "Ille-et-Vilaine", 61, 92],
  ['36', "Indre", 61, 92],
  ['37', "Indre-et-Loire", 67, 93],
  ['38', "Isère", 60, 90],
  ['39', "Jura", 64, 91],
  ['40', "Landes", 64, 92],
  ['41', "Loir-et-Cher", 61, 92],
  ['42', "Loire", 63, 92],
  ['43', "Haute-Loire", 68, 93],
  ['44', "Loire-Atlantique", 62, 91],
  ['45', "Loiret", 61, 91],
  ['46', "Lot", 70, 94],
  ['47', "Lot-et-Garonne", 72, 94],
  ['48', "Lozère", 59, 89],
  ['49', "Maine-et-Loire", 56, 87],
  ['50', "Manche", 59, 90],
  ['51', "Marne", 51, 85],
  ['52', "Haute-Marne", 60, 90],
  ['53', "Mayenne", 60, 92],
  ['54', "Meurthe-et-Moselle", 60, 89],
  ['55', "Meuse", 67, 92],
  ['56', "Morbihan", 66, 94],
  ['57', "Moselle", 61, 89],
  ['58', "Nièvre", 63, 92],
  ['59', "Nord", 63, 92],
  ['60', "Oise", 55, 87],
  ['61', "Orne", 63, 92],
  ['62', "Pas-de-Calais", 66, 93],
  ['63', "Puy-de-Dôme", 59, 90],
  ['64', "Pyrénées-Atlantiques", 60, 90],
  ['65', "Hautes-Pyrénées", 66, 93],
  ['66', "Pyrénées-Orientales", 72, 94],
  ['67', "Bas-Rhin", 61, 89],
  ['68', "Haut-Rhin", 61, 90],
  ['69', "Rhône", 58, 89],
  ['70', "Haute-Saône", 66, 93],
  ['71', "Saône-et-Loire", 61, 91],
  ['72', "Sarthe", 61, 92],
  ['73', "Savoie", 53, 87],
  ['74', "Haute-Savoie", 52, 85],
  ['75', "Paris", 51, 80],
  ['76', "Seine-Maritime", 54, 87],
  ['77', "Seine-et-Marne", 62, 92],
  ['78', "Yvelines", 53, 87],
  ['79', "Deux-Sèvres", 62, 93],
  ['80', "Somme", 64, 91],
  ['81', "Tarn", 74, 96],
  ['82', "Tarn-et-Garonne", 77, 96],
  ['83', "Var", 62, 90],
  ['84', "Vaucluse", 70, 94],
  ['85', "Vendée", 63, 94],
  ['86', "Vienne", 65, 92],
  ['87', "Haute-Vienne", 63, 92],
  ['88', "Vosges", 62, 91],
  ['89', "Yonne", 68, 93],
  ['90', "Territoire de Belfort", 64, 90],
  ['91', "Essonne", 55, 89],
  ['92', "Hauts-de-Seine", 46, 82],
  ['93', "Seine-Saint-Denis", 62, 90],
  ['94', "Val-de-Marne", 53, 86],
  ['95', "Val-d’Oise", 58, 89],
  ['', "Collectivités d’outre-mer", 80, 94],
];
const HH_BAILLEUR_FICHES = ['BAR-TH-179', 'BAR-TH-177', 'PAC MIXTE', 'BAR-SE-104', 'BAR-TH-161'];
function hhInjectBailleur(body){
  if(body.querySelector('.hh-bailleur')) return;
  if(typeof currentFiche === 'undefined' || !currentFiche || !HH_BAILLEUR_FICHES.includes(currentFiche.code)) return;
  const lbl = r => (r[0] ? r[0] + ' - ' : '') + r[1];
  const opts = HH_DEPT_PCT.map((r, i) => `<option value="${i}">${lbl(r)}</option>`).join('');
  const rows = HH_DEPT_PCT.map(r => `<tr><td>${lbl(r)}</td><td>${r[2]} %</td><td>${r[3]} %</td></tr>`).join('');
  const html = `<div class="warn-box show hh-bailleur"><b>⚠ ATTENTION VALORISATION DIFFERENTE POUR BAILLEURS SOCIAUX</b><br>
      Logements sociaux sans justificatifs de revenus, ou copropriété située en QPV : la part au prix précarité n'est pas le décompte des ménages
      mais le <b>pourcentage du département</b> (annexe I bis ; annexe I pour les ménages très modestes). Le calcul ci-dessous ne l'applique pas.
      <details class="hh-anah" style="margin:10px 0 0">
        <summary>Pourcentages par département (arrêté du 5 novembre 2026, engagement à partir du 16/11/2026)</summary>
        <div class="hh-anah-body">
          <div class="hh-anah-row"><label>Département <select id="hhDeptSel">${opts}</select></label></div>
          <div class="hh-anah-res" id="hhDeptRes"></div>
          <table class="hh-anah-table"><thead><tr><th>Département</th><th class="tm">Ménages très modestes (annexe I)</th><th class="m">Précarité énergétique (annexe I bis)</th></tr></thead><tbody>${rows}</tbody></table>
          <p class="hh-anah-src">Logements sociaux (art. 3-1 IV) : à défaut de justificatifs, part précarité = nombre de logements sociaux ÷ total × % annexe I bis. Copropriété en QPV (art. 3-1 VI, dérogation) : part précarité = % annexe I bis. Source : arrêté du 5 novembre 2026, JO du 10/11/2026 (NOR ECOR2625692A).</p>
        </div>
      </details></div>`;
  const anchor = body.querySelector('.hh-alert');
  if(anchor) anchor.insertAdjacentHTML('afterend', html); else body.insertAdjacentHTML('afterbegin', html);
  const sel = body.querySelector('#hhDeptSel'), res = body.querySelector('#hhDeptRes');
  const upd = () => { const r = HH_DEPT_PCT[+sel.value]; res.innerHTML = `${lbl(r)} : <b>${r[3]} %</b> de ménages en précarité énergétique (prix précarité) · dont <b>${r[2]} %</b> de ménages très modestes`; };
  sel.addEventListener('input', e => { e.stopPropagation(); upd(); });
  upd();
}

// Recalcul quand la date d'engagement change (le champ est ajouté après le rendu de la fiche)
function hhWatch(body, calc){
  hhInjectAlert(body);
  hhInjectBailleur(body);
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
