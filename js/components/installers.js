// ═══════════════════════════════════════════════════════════════════════
// INSTALLATEURS — liste partagée (Firestore), prix par obligé.
// Clic sur un obligé → applique ses prix Classique/Précarité à la
// simulation en cours (et par défaut aux prochaines, via le même
// mécanisme que la carte "Prix CEE" de la page d'accueil).
// ═══════════════════════════════════════════════════════════════════════
const OBLIGES = [
  {id:'engie', label:'Engie'},
  {id:'siplec', label:'Siplec'},
];
const INSTALLERS_MANAGE_CODE_HASH = 'e85107b10d07675b3e632479f34b4edeab3f72b14743674e6c2c4e7098df559f'; // code par défaut : "ebs2026"

let __installersCache = [];

function escapeHtmlInstallers(s){
  const d = document.createElement('div');
  d.textContent = s == null ? '' : String(s);
  return d.innerHTML;
}

async function fetchInstallers(){
  await __ebsFirebaseReady;
  const snap = await ebsDb.collection('installers').orderBy('name').get();
  return snap.docs.map(d => ({id: d.id, ...d.data()}));
}

/* ── Panneau public : liste + application des prix ── */

const EBS_ADMIN_UNLOCK_KEY = 'ebsAdminUnlocked'; // partagé avec installer-links.js (un seul code pour les deux écrans)
let __installersGateCallback = null;

function isEbsAdminUnlocked(){
  try { return sessionStorage.getItem(EBS_ADMIN_UNLOCK_KEY) === '1'; } catch(e){ return false; }
}
function setEbsAdminUnlocked(){
  try { sessionStorage.setItem(EBS_ADMIN_UNLOCK_KEY, '1'); } catch(e){ /* stockage indisponible */ }
}

function openInstallersGate(onSuccess){
  if(isEbsAdminUnlocked()){ onSuccess(); return; }
  __installersGateCallback = onSuccess;
  document.getElementById('installersManageCodeInput').value = '';
  document.getElementById('installersManageCodeError').style.display = 'none';
  document.getElementById('installersManageGateOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('installersManageCodeInput')?.focus(), 50);
}

async function openInstallersPanel(){
  const body = document.getElementById('installersPanelBody');
  body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Chargement…</div>`;
  document.getElementById('installersPanelOverlay').classList.add('open');
  try{
    __installersCache = await fetchInstallers();
    renderInstallersPanel();
  }catch(err){
    console.error('Erreur chargement installateurs :', err);
    body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--red);font-size:13px">
      Impossible de charger la liste des installateurs.<br><span style="font-size:11px;color:var(--text-3)">${escapeHtmlInstallers(err.message||err)}</span>
    </div>`;
  }
}
function closeInstallersPanel(){
  document.getElementById('installersPanelOverlay').classList.remove('open');
}
function renderInstallersPanel(){
  const body = document.getElementById('installersPanelBody');
  if(!__installersCache.length){
    body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Aucun installateur enregistré pour l'instant. Clique sur "🔒 Gérer les installateurs" pour en ajouter un.</div>`;
    return;
  }
  body.innerHTML = __installersCache.map(inst => `
    <div class="installer-row">
      <div class="installer-row-name">${escapeHtmlInstallers(inst.name)}</div>
      <div class="installer-row-obliges">
        ${OBLIGES.map(o => {
          const p = inst.prices?.[o.id];
          if(!p || (p.classique===undefined && p.precarite===undefined)) return '';
          return `
            <button type="button" class="installer-obligé-chip" onclick="applyInstallerPrices('${inst.id}','${o.id}')">
              <span class="installer-obligé-label">${o.label}</span>
              <span class="installer-obligé-prices">Classique ${p.classique ?? '—'} € · Précarité ${p.precarite ?? '—'} €</span>
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `).join('');
}
const ACTIVE_INSTALLER_KEY = 'cee_active_installer';

function saveActiveInstallerDisplay(name, obligeLabel){
  try{ localStorage.setItem(ACTIVE_INSTALLER_KEY, JSON.stringify({name, obligeLabel})); }catch(e){ /* stockage indisponible */ }
  renderActiveInstallerDisplay(name, obligeLabel);
}
function clearActiveInstallerDisplay(){
  try{ localStorage.removeItem(ACTIVE_INSTALLER_KEY); }catch(e){ /* stockage indisponible */ }
  const el = document.getElementById('activeInstallerDisplay');
  if(el){ el.style.display = 'none'; el.innerHTML = ''; }
}
function renderActiveInstallerDisplay(name, obligeLabel){
  const el = document.getElementById('activeInstallerDisplay');
  if(!el) return;
  el.innerHTML = `
    <span class="active-installer-icon">👷</span>
    <span class="active-installer-text"><b>${escapeHtmlInstallers(name)}</b> · ${escapeHtmlInstallers(obligeLabel)}</span>
    <button type="button" class="active-installer-clear" onclick="clearActiveInstallerDisplay()" title="Retirer">✕</button>
  `;
  el.style.display = 'flex';
}
function initActiveInstallerDisplay(){
  try{
    const stored = JSON.parse(localStorage.getItem(ACTIVE_INSTALLER_KEY) || 'null');
    if(stored?.name) renderActiveInstallerDisplay(stored.name, stored.obligeLabel);
  }catch(e){ /* rien à afficher */ }
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initActiveInstallerDisplay);
} else {
  initActiveInstallerDisplay();
}

function applyInstallerPrices(installerId, obligeId){
  const inst = __installersCache.find(i => i.id === installerId);
  const p = inst?.prices?.[obligeId];
  if(!p) return;
  const classique = p.classique ?? '';
  const precarite = p.precarite ?? '';

  try{
    localStorage.setItem('cee_default_prices', JSON.stringify({classique, precarite}));
  }catch(e){ /* stockage indisponible */ }

  const homeC = document.getElementById('defaultPriceClassique');
  const homeP = document.getElementById('defaultPricePrecarite');
  if(homeC){ homeC.value = classique; homeC.dispatchEvent(new Event('input', {bubbles:true})); }
  if(homeP){ homeP.value = precarite; homeP.dispatchEvent(new Event('input', {bubbles:true})); }

  const simC = document.getElementById('f-pc');
  const simP = document.getElementById('f-pp');
  if(simC){ simC.value = classique; simC.dispatchEvent(new Event('input', {bubbles:true})); }
  if(simP){ simP.value = precarite; simP.dispatchEvent(new Event('input', {bubbles:true})); }

  const oblige = OBLIGES.find(o=>o.id===obligeId);
  saveActiveInstallerDisplay(inst.name, oblige?.label || obligeId);

  const banner = document.createElement('div');
  banner.className = 'installer-applied-toast';
  banner.textContent = `✓ Prix ${inst.name} (${oblige?.label||obligeId}) appliqués`;
  document.body.appendChild(banner);
  setTimeout(()=>banner.classList.add('show'), 10);
  setTimeout(()=>{ banner.classList.remove('show'); setTimeout(()=>banner.remove(), 300); }, 2200);

  closeInstallersPanel();
}

/* ── Gate + gestion (ajout / édition / suppression) ── */

async function sha256HexInstallers(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function closeInstallersManageGate(){
  document.getElementById('installersManageGateOverlay').classList.remove('open');
}
async function checkInstallersManageCode(){
  const input = document.getElementById('installersManageCodeInput');
  const hash = await sha256HexInstallers(input.value);
  if(hash === INSTALLERS_MANAGE_CODE_HASH){
    setEbsAdminUnlocked();
    closeInstallersManageGate();
    const cb = __installersGateCallback;
    __installersGateCallback = null;
    if(cb) await cb();
  } else {
    document.getElementById('installersManageCodeError').style.display = 'block';
    input.value = '';
    input.focus();
  }
}
async function openInstallersManage(){
  const body = document.getElementById('installersManageBody');
  body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Chargement…</div>`;
  document.getElementById('installersManageOverlay').classList.add('open');
  try{
    __installersCache = await fetchInstallers();
    renderInstallersManage();
  }catch(err){
    body.innerHTML = `<div style="padding:20px;color:var(--red);font-size:13px">Erreur de chargement : ${escapeHtmlInstallers(err.message||err)}</div>`;
  }
}
function closeInstallersManage(){
  document.getElementById('installersManageOverlay').classList.remove('open');
}
function priceFieldsHtml(prefix, prices){
  return OBLIGES.map(o => `
    <div class="installer-manage-obligé">
      <div class="installer-manage-obligé-label">${o.label}</div>
      <div class="field-row">
        <div class="field"><label>Classique €/MWhc</label><input type="number" step="0.1" id="${prefix}-${o.id}-c" value="${prices?.[o.id]?.classique ?? ''}"></div>
        <div class="field"><label>Précarité €/MWhc</label><input type="number" step="0.1" id="${prefix}-${o.id}-p" value="${prices?.[o.id]?.precarite ?? ''}"></div>
      </div>
    </div>
  `).join('');
}
function renderInstallersManage(){
  const body = document.getElementById('installersManageBody');
  const existingHtml = __installersCache.map(inst => `
    <div class="installer-manage-card" id="manage-${inst.id}">
      <div class="field"><label>Nom de l'installateur</label><input type="text" id="manage-${inst.id}-name" value="${escapeHtmlInstallers(inst.name)}"></div>
      ${priceFieldsHtml('manage-'+inst.id, inst.prices)}
      <div class="installer-manage-actions">
        <button type="button" class="btn-secondary" onclick="deleteInstaller('${inst.id}')">Supprimer</button>
        <button type="button" class="btn-primary" onclick="saveInstaller('${inst.id}')">Enregistrer</button>
      </div>
      <div class="installer-manage-feedback" id="manage-${inst.id}-feedback"></div>
    </div>
  `).join('');

  body.innerHTML = `
    ${existingHtml}
    <div class="installer-manage-card installer-manage-new">
      <div style="font-weight:700;font-size:13px;color:var(--navy-dk);margin-bottom:10px">+ Nouvel installateur</div>
      <div class="field"><label>Nom de l'installateur</label><input type="text" id="manage-new-name" placeholder="Ex. : Dupont Chauffage"></div>
      ${priceFieldsHtml('manage-new', {})}
      <div class="installer-manage-actions">
        <button type="button" class="btn-primary" onclick="saveInstaller('new')">Ajouter</button>
      </div>
      <div class="installer-manage-feedback" id="manage-new-feedback"></div>
    </div>
  `;
}
function readInstallerPricesFromForm(prefix){
  const prices = {};
  OBLIGES.forEach(o => {
    const c = document.getElementById(`${prefix}-${o.id}-c`)?.value;
    const p = document.getElementById(`${prefix}-${o.id}-p`)?.value;
    if(c !== '' && c !== undefined) { prices[o.id] = prices[o.id]||{}; prices[o.id].classique = parseFloat(c); }
    if(p !== '' && p !== undefined) { prices[o.id] = prices[o.id]||{}; prices[o.id].precarite = parseFloat(p); }
  });
  return prices;
}
async function saveInstaller(id){
  const isNew = id === 'new';
  const prefix = isNew ? 'manage-new' : 'manage-'+id;
  const name = document.getElementById(`${prefix}-name`).value.trim();
  const feedback = document.getElementById(`${prefix}-feedback`);
  if(!name){
    feedback.textContent = 'Le nom est obligatoire.';
    feedback.className = 'installer-manage-feedback error';
    return;
  }
  const prices = readInstallerPricesFromForm(prefix);
  feedback.textContent = 'Enregistrement…';
  feedback.className = 'installer-manage-feedback';
  try{
    await __ebsFirebaseReady;
    if(isNew){
      await ebsDb.collection('installers').add({name, prices, createdAt: firebase.firestore.FieldValue.serverTimestamp()});
    } else {
      await ebsDb.collection('installers').doc(id).set({name, prices, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    }
    feedback.textContent = '✓ Enregistré';
    feedback.className = 'installer-manage-feedback success';
    __installersCache = await fetchInstallers();
    if(isNew) renderInstallersManage();
  }catch(err){
    console.error('Erreur enregistrement installateur :', err);
    feedback.textContent = 'Échec : ' + (err.message||err) + ' (vérifie les règles Firestore)';
    feedback.className = 'installer-manage-feedback error';
  }
}
async function deleteInstaller(id){
  if(!confirm('Supprimer définitivement cet installateur ?')) return;
  try{
    await __ebsFirebaseReady;
    await ebsDb.collection('installers').doc(id).delete();
    __installersCache = __installersCache.filter(i => i.id !== id);
    renderInstallersManage();
  }catch(err){
    alert('Échec de la suppression : ' + (err.message||err));
  }
}

document.getElementById('installersManageUnlockBtn')?.addEventListener('click', checkInstallersManageCode);
document.getElementById('installersManageCodeInput')?.addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') checkInstallersManageCode();
});
