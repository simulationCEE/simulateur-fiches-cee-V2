// ═══════════════════════════════════════════════════════════════════════
// PRIX PAR DÉFAUT — appliqués automatiquement à toutes les simulations
// ═══════════════════════════════════════════════════════════════════════
function loadDefaultPrices(){
  try{
    return JSON.parse(localStorage.getItem('cee_default_prices') || '{"classique":"","precarite":""}');
  }catch(e){ return {classique:"",precarite:""}; }
}
function saveDefaultPrices(){
  try{
    localStorage.setItem('cee_default_prices', JSON.stringify({
      classique: document.getElementById('defaultPriceClassique').value,
      precarite: document.getElementById('defaultPricePrecarite').value,
    }));
    const saved = document.getElementById('dpcSaved');
    saved.classList.add('show');
    clearTimeout(saveDefaultPrices._t);
    saveDefaultPrices._t = setTimeout(()=>saved.classList.remove('show'), 1200);
  }catch(e){ /* stockage indisponible */ }
}
function applyDefaultPrices(container){
  const defaults = loadDefaultPrices();
  const pcEl = container.querySelector('#f-pc');
  const ppEl = container.querySelector('#f-pp');
  if(pcEl && defaults.classique){ pcEl.value = defaults.classique; }
  if(ppEl && defaults.precarite){ ppEl.value = defaults.precarite; }
  if(pcEl) pcEl.dispatchEvent(new Event('input', {bubbles:true}));
  else if(ppEl) ppEl.dispatchEvent(new Event('input', {bubbles:true}));
}
(function initDefaultPricesUI(){
  const stored = loadDefaultPrices();
  document.getElementById('defaultPriceClassique').value = stored.classique || '';
  document.getElementById('defaultPricePrecarite').value = stored.precarite || '';
  document.getElementById('defaultPriceClassique').addEventListener('input', saveDefaultPrices);
  document.getElementById('defaultPricePrecarite').addEventListener('input', saveDefaultPrices);
})();

