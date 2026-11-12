// ═══════════════════════════════════════════════════════════════════════
// PRIME FACIALE — module générique, actif sur TOUTES les fiches
//
// Affiche sous les résultats de chaque simulateur la « prime faciale »
// proposée au client : un pourcentage (60 % par défaut) de la prime CEE
// réelle calculée par la fiche, à partir des prix CEE (valorisation) saisis.
// Un curseur permet de faire varier ce pourcentage jusqu'à 100 %.
//
// Aucune fiche n'est modifiée : le module s'accroche à openSim() et lit les
// lignes de prime affichées dans #results (toute ligne dont le libellé
// commence par « Prime » et dont la valeur est en €, hors lignes « / m² »
// ou « / logement »). Il se recalcule automatiquement à chaque nouveau
// calcul de la fiche (MutationObserver sur #results).
//
// Les lignes de prime faciale ont la classe .result-row : elles sont donc
// reprises automatiquement dans le comparatif, le dossier et le PDF.
//
// Réglage optionnel par lien installateur (Firestore / config du lien) :
//   window.EBS_INSTALLER_CONFIG.primeFaciale = { defaut: 60, min: 0, max: 100 }
// ═══════════════════════════════════════════════════════════════════════
const PRIME_FACIALE = (function(){
  const DEFAULTS = { defaut: 60, min: 0, max: 100, pas: 1 };
  const PRESETS = [50, 60, 70, 80, 90, 100];

  function config(){
    const c = (window.EBS_INSTALLER_CONFIG && window.EBS_INSTALLER_CONFIG.primeFaciale) || {};
    const min = clamp(num(c.min, DEFAULTS.min), 0, 100);
    const max = clamp(num(c.max, DEFAULTS.max), min, 100);
    const defaut = clamp(num(c.defaut, DEFAULTS.defaut), min, max);
    return { min, max, defaut, pas: DEFAULTS.pas };
  }
  function num(v, fallback){ const n = parseFloat(v); return Number.isFinite(n) ? n : fallback; }
  function clamp(v, a, b){ return Math.min(b, Math.max(a, v)); }

  // Taux conservé d'une fiche à l'autre pendant la visite (remis à la valeur par défaut au rechargement)
  let currentPct = null;

  // "12 345 €" (espaces fines insécables) → 12345
  function parseEuro(text){
    const cleaned = String(text).replace(/[\s\u00A0\u202F]/g, '').replace(/[^\d,.-]/g, '').replace(',', '.');
    const n = parseFloat(cleaned);
    return Number.isFinite(n) ? n : null;
  }

  // Lignes de prime « réelle » affichées par la fiche
  function readPrimes(resultsEl){
    const out = [];
    resultsEl.querySelectorAll('.result-row').forEach(row => {
      if(row.classList.contains('result-info')) return;
      const labelEl = row.querySelector('.result-label');
      const valEl = row.querySelector('.result-val');
      if(!labelEl || !valEl) return;
      const label = labelEl.textContent.replace(/\s+/g, ' ').trim();
      const valText = valEl.textContent;
      if(!/^prime\b/i.test(label)) return;   // seulement les lignes « Prime … »
      if(/\s\/\s|\/\s*m²/i.test(label)) return; // exclut « Prime / logement », « … / m² »
      if(!valText.includes('€')) return;       // exclut « — (pas de précarité…) »
      const value = parseEuro(valText);
      if(value === null) return;
      out.push({ label, value });
    });
    return out;
  }

  function fmtPct(p){ return p.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' %'; }
  function shortLabel(label){ return label.replace(/^prime\s*/i, '').replace(/^[—–-]\s*/, '').trim(); }

  function mount(body){
    const resultsEl = body.querySelector('#results');
    if(!resultsEl) return;
    const cfg = config();
    if(currentPct === null || currentPct < cfg.min || currentPct > cfg.max) currentPct = cfg.defaut;

    const presets = PRESETS.filter(p => p >= cfg.min && p <= cfg.max);
    resultsEl.insertAdjacentHTML('afterend', `
      <section class="pf-box" id="pfBox" aria-labelledby="pfTitle">
        <div class="pf-head">
          <div>
            <h4 class="pf-title" id="pfTitle">Prime faciale client</h4>
            <p class="pf-sub">Part de la prime CEE réelle reversée au client, calculée selon la valorisation saisie.</p>
          </div>
          <output class="pf-pct" id="pfPctOut" for="pfPct">${fmtPct(currentPct)}</output>
        </div>
        <div class="field pf-field">
          <label for="pfPct">Taux de prime faciale (%) <span class="hint">de ${cfg.min} à ${cfg.max} % de la prime CEE</span></label>
          <input type="range" id="pfPct" min="${cfg.min}" max="${cfg.max}" step="${cfg.pas}" value="${currentPct}">
        </div>
        ${presets.length ? `<div class="pf-presets" role="group" aria-label="Taux rapides">
          ${presets.map(p => `<button type="button" class="pf-preset" data-pct="${p}">${p} %</button>`).join('')}
        </div>` : ''}
        <div class="results pf-results" id="pfResults" aria-live="polite"></div>
      </section>
    `);

    const box = body.querySelector('#pfBox');
    const range = box.querySelector('#pfPct');
    const out = box.querySelector('#pfPctOut');
    const rowsEl = box.querySelector('#pfResults');

    function render(){
      const pct = currentPct;
      const ratio = pct / 100;
      range.value = pct;
      range.style.setProperty('--pf-fill', ((pct - cfg.min) / Math.max(1, cfg.max - cfg.min) * 100) + '%');
      out.textContent = fmtPct(pct);
      box.querySelectorAll('.pf-preset').forEach(b => b.classList.toggle('active', +b.dataset.pct === pct));

      const primes = readPrimes(resultsEl);
      if(!primes.length){
        rowsEl.innerHTML = `<p class="pf-empty">Renseignez les prix CEE et les paramètres ci-dessus pour obtenir la prime faciale.</p>`;
        return;
      }
      rowsEl.innerHTML = primes.map(p => {
        const faciale = Math.round(p.value * ratio);
        const ecart = Math.round(p.value) - faciale;
        const detail = shortLabel(p.label);
        return `
          <div class="result-row hi pf-row">
            <span class="result-label">Prime faciale ${fmtPct(pct)}${detail ? ' — ' + detail : ''}</span>
            <span class="result-val">${eur(faciale)}</span>
          </div>
          <div class="pf-detail">Prime CEE réelle ${eur(p.value)} · écart ${eur(ecart)}</div>`;
      }).join('');
    }

    range.addEventListener('input', e => {
      e.stopPropagation(); // le curseur ne déclenche pas le recalcul de la fiche
      currentPct = clamp(parseInt(range.value, 10) || 0, cfg.min, cfg.max);
      render();
    });
    box.addEventListener('click', e => {
      const b = e.target.closest('.pf-preset');
      if(!b) return;
      currentPct = clamp(+b.dataset.pct, cfg.min, cfg.max);
      render();
    });

    // Recalcul automatique quand la fiche réécrit ses résultats
    new MutationObserver(render).observe(resultsEl, { childList: true, subtree: true, characterData: true });

    // Le bouton « Réinitialiser » remet aussi le taux par défaut
    const resetBtn = body.querySelector('#resetSimBtn');
    if(resetBtn) resetBtn.addEventListener('click', () => { currentPct = cfg.defaut; render(); });

    render();
  }

  return { mount, readPrimes };
})();

// Accroche sur l'ouverture de chaque simulateur (openSim est défini dans js/simulator/overlay.js)
(function(){
  if(typeof openSim !== 'function') { console.error('prime-faciale.js doit être chargé après overlay.js'); return; }
  const openSimOriginal = openSim;
  openSim = function(f){
    openSimOriginal(f);
    try { PRIME_FACIALE.mount(simBody, f); }
    catch(e){ console.error('Prime faciale :', e); }
  };
})();
