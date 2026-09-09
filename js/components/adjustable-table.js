// ═══════════════════════════════════════════════════════════════════════
// GENERIC "COMPARER AVEC UN ÉCART" — table ajustable pilotée par l'utilisateur
// opts: { unitLabel, paramLabel, defaultStep, defaultRep, getBase, minValid, calc }
//   getBase() -> valeur actuelle du paramètre (lu dans le formulaire)
//   calc(val) -> { kwh, prime }  pour cette valeur du paramètre
//   minValid  -> valeur plancher (optionnelle) sous laquelle une ligne est masquée
// ═══════════════════════════════════════════════════════════════════════
function adjustableTable(container, opts){
  container.insertAdjacentHTML('beforeend', `
    <div class="adj-block">
      <div class="adj-title">📊 Comparer avec un écart</div>
      <div class="adj-fields">
        <div class="adj-field">
          <label>Écart <span class="hint">${opts.unitLabel}</span></label>
          <input type="number" id="adjStep" value="${opts.defaultStep}" min="0.1" step="0.1">
        </div>
        <div class="adj-field">
          <label>Répétition <span class="hint">lignes ajoutées, pair, max 6</span></label>
          <input type="number" id="adjRep" value="${opts.defaultRep||2}" min="2" max="6" step="2">
        </div>
      </div>
      <div id="adjTableWrap"></div>
    </div>
  `);
  const stepEl = container.querySelector('#adjStep');
  const repEl  = container.querySelector('#adjRep');
  const wrap   = container.querySelector('#adjTableWrap');

  function render(){
    let step = parseFloat(stepEl.value)||0;
    let rep  = parseInt(repEl.value)||2;
    rep = Math.max(2, Math.min(6, Math.round(rep/2)*2));
    if(String(rep) !== repEl.value) repEl.value = rep;
    const base = opts.getBase();
    const half = rep/2;
    let rows = '';
    const hasExtra = !!opts.extraLabel;
    for(let i=-half; i<=half; i++){
      const val = base + i*step;
      if(opts.minValid !== undefined && val < opts.minValid) continue;
      const r = opts.calc(val);
      const isCur = i===0;
      const valLabel = Number.isInteger(val) ? val : val.toFixed(1);
      rows += `<tr class="${isCur?'hl':''}"><td>${valLabel} ${opts.unitLabel}${isCur?' (actuel)':''}</td><td>${kwh(r.kwh)}</td><td class="prime-val">${eur(r.prime)}</td>${hasExtra?`<td class="prime-val" style="color:var(--blue)">${eur(r.extra)}</td>`:''}</tr>`;
    }
    wrap.innerHTML = `<table class="surftbl"><thead><tr><th>${opts.paramLabel}</th><th>kWh cumac</th><th>${opts.primeLabel||'Prime'}</th>${hasExtra?`<th>${opts.extraLabel}</th>`:''}</tr></thead><tbody>${rows}</tbody></table>`;
  }
  stepEl.addEventListener('input', render);
  repEl.addEventListener('input', render);
  render();
  return {refresh: render};
}

