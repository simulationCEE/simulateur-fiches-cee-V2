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
function applyDefaultPrices(container, ficheCode){
  const defaults = (typeof getInstallerPriceConfig === 'function' && window.EBS_INSTALLER_CONFIG)
    ? getInstallerPriceConfig(ficheCode)
    : loadDefaultPrices();
  const pcEl = container.querySelector('#f-pc');
  const ppEl = container.querySelector('#f-pp');
  if(pcEl && defaults.classique !== undefined && defaults.classique !== '') pcEl.value = defaults.classique;
  if(ppEl && defaults.precarite !== undefined && defaults.precarite !== '') ppEl.value = defaults.precarite;
  if(pcEl) pcEl.dispatchEvent(new Event('input', {bubbles:true}));
  else if(ppEl) ppEl.dispatchEvent(new Event('input', {bubbles:true}));
  if(window.EBS_INSTALLER_CONFIG){
    if(pcEl) pcEl.closest('.field')?.style.setProperty('display','none');
    if(ppEl) ppEl.closest('.field')?.style.setProperty('display','none');
  }
}
/* ── Installateur « cible » actif (dernier choisi dans l'onglet Installateurs) ── */
const ACTIVE_INSTALLER_KEY = 'cee_active_installer';

function getActiveInstallerTarget(){
  try{ return JSON.parse(localStorage.getItem(ACTIVE_INSTALLER_KEY) || 'null'); }catch(e){ return null; }
}
function setActiveInstallerTarget(name, obligeLabel, classique, precarite, installerId, obligeId){
  try{ localStorage.setItem(ACTIVE_INSTALLER_KEY, JSON.stringify({name, obligeLabel, classique, precarite, installerId, obligeId})); }catch(e){ /* stockage indisponible */ }
  updateDpcTargetUI();
}
function clearActiveInstallerTarget(){
  try{ localStorage.removeItem(ACTIVE_INSTALLER_KEY); }catch(e){ /* stockage indisponible */ }
  updateDpcTargetUI();
}
function setDpcFieldMismatch(which, mismatched){
  const input = document.getElementById(which==='classique' ? 'defaultPriceClassique' : 'defaultPricePrecarite');
  const resetBtn = document.getElementById(which==='classique' ? 'dpcResetC' : 'dpcResetP');
  const text = document.getElementById(which==='classique' ? 'dpcMismatchC' : 'dpcMismatchP');
  if(!input) return;
  input.classList.toggle('dpc-mismatch', mismatched);
  if(resetBtn) resetBtn.style.display = mismatched ? 'inline' : 'none';
  if(text) text.style.display = mismatched ? 'block' : 'none';
}
function resetDpcToTarget(which){
  const target = getActiveInstallerTarget();
  if(!target) return;
  const input = document.getElementById(which==='classique' ? 'defaultPriceClassique' : 'defaultPricePrecarite');
  if(!input) return;
  input.value = which==='classique' ? target.classique : target.precarite;
  input.dispatchEvent(new Event('input', {bubbles:true}));
}
function updateDpcTargetUI(){
  const subtitle = document.getElementById('dpcSubtitle');
  const pc = document.getElementById('defaultPriceClassique');
  const pp = document.getElementById('defaultPricePrecarite');
  if(!subtitle || !pc || !pp) return;
  const target = getActiveInstallerTarget();
  if(!target){
    subtitle.classList.remove('dpc-subtitle-active');
    subtitle.textContent = 'À renseigner selon vos valeurs';
    setDpcFieldMismatch('classique', false);
    setDpcFieldMismatch('precarite', false);
    return;
  }
  subtitle.classList.add('dpc-subtitle-active');
  subtitle.innerHTML = `${escapeHtmlDpc(target.name)} · ${escapeHtmlDpc(target.obligeLabel)}
    <button type="button" class="dpc-refresh-target" onclick="refreshActiveInstallerPrices()" title="Rafraîchir le prix">⟳</button>
    <button type="button" class="dpc-clear-target" onclick="clearActiveInstallerTarget()" title="Revenir à l'affichage par défaut">✕</button>`;
  setDpcFieldMismatch('classique', String(pc.value) !== String(target.classique));
  setDpcFieldMismatch('precarite', String(pp.value) !== String(target.precarite));
}
function escapeHtmlDpc(value){
  return String(value==null?'':value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

(function initDefaultPricesUI(){
  const stored = loadDefaultPrices();
  const pc = document.getElementById('defaultPriceClassique');
  const pp = document.getElementById('defaultPricePrecarite');
  if(!pc || !pp) return;
  pc.value = stored.classique || '';
  pp.value = stored.precarite || '';
  pc.addEventListener('input', () => { saveDefaultPrices(); updateDpcTargetUI(); });
  pp.addEventListener('input', () => { saveDefaultPrices(); updateDpcTargetUI(); });
  updateDpcTargetUI();
})();
