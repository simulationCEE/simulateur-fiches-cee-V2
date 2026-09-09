// ═══════════════════════════════════════════════════════════════════════
// SIMULATEUR INVERSÉ — recherche par bissection (robuste, générique)
// opts: { quantityLabel, unitLabel, integer, min, max, hasPrec, calc(q) => {prime}|{primeC,primeP} }
// ═══════════════════════════════════════════════════════════════════════
function reverseSolver(container, opts){
  container.insertAdjacentHTML('beforeend', `
    <div class="adj-block">
      <div class="adj-title">🎯 Simulateur inversé — quelle ${opts.quantityLabel} pour atteindre une prime cible ?</div>
      <div class="adj-fields">
        <div class="adj-field">
          <label>Prime visée <span class="hint">€</span></label>
          <input type="number" id="revTarget" placeholder="ex : 5000">
        </div>
        ${opts.hasPrec ? `<div class="adj-field">
          <label>Type de prime</label>
          <select id="revType"><option value="classique">Classique</option><option value="precarite">Précarité</option></select>
        </div>` : ''}
      </div>
      <div id="revResult"></div>
    </div>
  `);
  const targetEl = container.querySelector('#revTarget');
  const typeEl = container.querySelector('#revType');
  const resultEl = container.querySelector('#revResult');

  function fnAt(q){
    const r = opts.calc(q);
    const usePrec = typeEl && typeEl.value === 'precarite';
    return usePrec ? (r.primeP ?? r.prime ?? 0) : (r.primeC ?? r.prime ?? 0);
  }

  function render(){
    const target = parseFloat(targetEl.value)||0;
    if(target<=0){ resultEl.innerHTML=''; return; }
    const min = opts.min||0;
    const max = opts.max||1000000;
    if(fnAt(max) < target){
      resultEl.innerHTML = `<div class="warn-box show">⚠ Prime cible non atteignable, même à ${max.toLocaleString('fr-FR')} ${opts.unitLabel}. Vérifiez la zone, l'Etas ou le prix saisis.</div>`;
      return;
    }
    if(fnAt(min) >= target){
      resultEl.innerHTML = `
        <div class="result-row hi"><span class="result-label">${opts.quantityLabel} nécessaire</span><span class="result-val">${min} ${opts.unitLabel} (minimum)</span></div>
        <div style="font-size:10.5px;color:var(--text-3);margin-top:6px">La prime cible est déjà atteinte à la valeur minimale testée.</div>`;
      return;
    }
    let lo=min, hi=max;
    for(let i=0;i<60;i++){
      const mid=(lo+hi)/2;
      if(fnAt(mid) < target) lo=mid; else hi=mid;
    }
    const q = opts.integer ? Math.ceil(hi) : Math.round(hi*10)/10;
    const achieved = fnAt(q);
    resultEl.innerHTML = `
      <div class="result-row hi"><span class="result-label">${opts.quantityLabel} nécessaire</span><span class="result-val">${q} ${opts.unitLabel}</span></div>
      <div style="font-size:10.5px;color:var(--text-3);margin-top:6px">Avec cette valeur, la prime obtenue serait de ${eur(achieved)} (≥ ${eur(target)} visé).</div>
    `;
  }
  targetEl.addEventListener('input', render);
  if(typeEl) typeEl.addEventListener('input', render);
  return {refresh: render};
}

