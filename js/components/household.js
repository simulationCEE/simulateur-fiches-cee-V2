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
const HH_LABELS = { tresmodeste: 'Ménage très modeste', modeste: 'Ménage modeste', autre: 'Autre ménage' };

// Coefficients Coup de Pouce par fiche : { avant le 16/11/2026, à partir du 16/11/2026 }
// BAR-TH-171/172/113/112 : article 3-6 de l'arrêté du 29/12/2014 modifié (III 1° et IV).
// BAR-TH-168 : ⚠ rattachement à l'article 3-9 supposé (mêmes coefficients 5 / 3 / 4) — à confirmer.
const HH_COEF = {
  'BAR-TH-171': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-172': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-113': { old: { tresmodeste: 5, modeste: 5, autre: 5 }, new: { tresmodeste: 5, modeste: 3, autre: 5 } },
  'BAR-TH-112': { old: { tresmodeste: 5, modeste: 5, autre: 4 }, new: { tresmodeste: 5, modeste: 3, autre: 4 } },
  'BAR-TH-168': { old: { tresmodeste: 5, modeste: 5, autre: 4 }, new: { tresmodeste: 5, modeste: 3, autre: 4 } },
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

// Champ « Profil du ménage »
function hhFieldHtml(id){
  return `<div class="field"><label>Profil du ménage</label>
      <select id="${id || 'f-menage'}">
        <option value="autre">Autre ménage</option>
        <option value="modeste">Ménage modeste</option>
        <option value="tresmodeste">Ménage très modeste</option>
      </select>
    </div>`;
}

// Bandeau récapitulatif des règles applicables à la date d'engagement
function hhNoteHtml(id){ return `<div class="hh-note" id="${id || 'hhNote'}"></div>`; }
function hhNoteText(code){
  const isNew = hhIsNew();
  const coefs = HH_COEF[code];
  const prix = isNew
    ? 'prix précarité pour les ménages <b>très modestes et modestes</b> (déciles 1 à 5), prix classique pour les autres'
    : 'prix précarité pour les ménages <b>très modestes</b> ; ménages modestes et autres au prix classique';
  const cdp = coefs ? ` · Coup de Pouce : très modeste ×${coefs[isNew?'new':'old'].tresmodeste}, modeste ×${coefs[isNew?'new':'old'].modeste}, autre ×${coefs[isNew?'new':'old'].autre}` : '';
  const ref = isNew ? 'Arrêté du 5 novembre 2026, opérations engagées à partir du 16/11/2026' : 'Règles applicables aux opérations engagées jusqu\'au 15/11/2026';
  return `<b>${ref} :</b> ${prix}${cdp}.`;
}
function hhUpdateNote(code, id){
  const el = document.getElementById(id || 'hhNote');
  if(el) el.innerHTML = hhNoteText(code);
}

// Recalcul quand la date d'engagement change (le champ est ajouté après le rendu de la fiche)
function hhWatch(body, calc){
  body.addEventListener('input', e => { if(e.target && e.target.id === 'regDate') calc(); });
  setTimeout(calc, 0);
}

// ── Fiches collectives (BAR-TH-177, BAR-TH-179) : plusieurs ménages dans l'opération ──
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
  const s = hhShare(nTM, nM, n);
  const regle = hhIsNew()
    ? 'très modestes et modestes au prix précarité'
    : 'très modestes seuls au prix précarité (modestes au prix classique)';
  return `<b>${hhIsNew() ? 'Arrêté du 5 novembre 2026 (engagement à partir du 16/11/2026)' : 'Règles jusqu\'au 15/11/2026'} :</b> ${regle}, autres ménages au prix classique. Part facturée au prix précarité : <b>${(s*100).toLocaleString('fr-FR',{maximumFractionDigits:1})} %</b> des logements.${(nTM||0)+(nM||0) > n ? ' <b>⚠ Le total des ménages très modestes et modestes dépasse le nombre de logements.</b>' : ''}`;
}
