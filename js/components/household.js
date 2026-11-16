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
  body.addEventListener('input', e => { if(e.target && e.target.id === 'regDate') calc(); });
  setTimeout(calc, 0);
}

// ── Fiches collectives (BAR-TH-177, BAR-TH-179) : plusieurs ménages dans l'opération ──
// Troisième catégorie des fiches collectives : « autres ménages » (prix classique), calculée automatiquement
function hhOthersFieldHtml(){
  return `<div class="field"><label>Autres ménages (hors précarité énergétique) <span class="hint">calculé automatiquement · repère Anah : violet, rose</span></label>
      <input type="number" id="f-na" value="0" readonly tabindex="-1" style="background:var(--bg);color:var(--text-2);cursor:default"></div>`;
}
// Met à jour le bandeau de répartition et le nombre d'autres ménages (logements − très modestes − modestes)
function hhMixRefresh(nTM, nM, n){
  const note = document.getElementById('hhNote');
  if(note) note.innerHTML = hhMixNoteText(nTM, nM, n);
  const na = document.getElementById('f-na');
  if(na) na.value = Math.max(0, (n || 0) - (nTM || 0) - (nM || 0));
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
function hhMixNoteText(nTM, nM, n){
  nTM = nTM || 0; nM = nM || 0; n = n || 0;
  const lg = x => `${x.toLocaleString('fr-FR', {maximumFractionDigits:1})} logement${x > 1 ? 's' : ''}`;
  const warn = (nTM + nM > n) ? ' <b>⚠ Le total des ménages très modestes et modestes dépasse le nombre de logements.</b>' : '';
  if(hhIsNew()){
    const prec = nTM + nM, autres = Math.max(0, n - prec);
    return `<b>Engagement à partir du 16/11/2026 :</b> <b>précarité énergétique = ménages très modestes + modestes</b> → prix précarité · <b>autres ménages</b> → prix classique.<br><b>Cette opération :</b> <b>${lg(prec)} au prix précarité</b> (${nTM} très modeste${nTM > 1 ? 's' : ''} + ${nM} modeste${nM > 1 ? 's' : ''}) · <b>${lg(autres)} au prix classique</b> (autres ménages).${warn}`;
  }
  const autres = Math.max(0, n - nTM);
  return `<b>Engagement jusqu'au 15/11/2026 :</b> <b>précarité = ménages très modestes seuls</b> → prix précarité · ménages modestes et autres → prix classique.<br><b>Cette opération :</b> <b>${lg(nTM)} au prix précarité</b> (très modestes) · <b>${lg(autres)} au prix classique</b> (dont ${nM} modeste${nM > 1 ? 's' : ''}).${warn}`;
}
