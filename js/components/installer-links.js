/* ═══════════════════════════════════════════════════════════════════════
   LIENS INSTALLATEUR
   Nouveaux liens : config stockée dans Firestore (collection installerLinks),
   l'URL ne contient que l'identifiant (?inst=XXXX) → modifiable après coup
   sans changer le lien, révocable instantanément.
   Anciens liens (?installateur=<base64>) : continuent de fonctionner tels
   quels indéfiniment, décodage 100% local, inchangé.
   ═══════════════════════════════════════════════════════════════════════ */

const INSTALLER_QUERY_KEY = 'installateur';       // ancien format (legacy, conservé)
const INSTALLER_ID_QUERY_KEY = 'inst';             // nouveau format (Firestore)

function encodeInstallerConfig(config){
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));
  return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decodeInstallerConfig(value){
  try{
    const padded = value.replace(/-/g,'+').replace(/_/g,'/') + '==='.slice((value.length + 3) % 4);
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  }catch(e){ return null; }
}
function isResidentialFiche(f){
  return Array.isArray(f.sector) ? f.sector.includes('res') : f.sector === 'res';
}
function getInstallerPriceConfig(ficheCode){
  const cfg = window.EBS_INSTALLER_CONFIG;
  if(!cfg || !cfg.prices) return null;
  const exception = cfg.exceptions?.[ficheCode];
  return exception ? {...cfg.prices, ...exception} : cfg.prices;
}

/* ── État d'édition (null = création d'un nouveau lien) ── */
let __editingFirestoreId = null;
let __editingHistoryId = null;

/* ── Ouverture du générateur (création OU édition d'un lien existant) ── */

function openInstallerLinkBuilder(prefill){
  __editingFirestoreId = prefill?.firestoreId || null;
  __editingHistoryId = prefill?.id || null;

  const overlay = document.getElementById('installerOverlay');
  const body = document.getElementById('installerBody');
  if(!overlay || !body) return;

  const currentClassic = prefill ? prefill.prices.classique : (document.getElementById('defaultPriceClassique')?.value || '');
  const currentPrec = prefill ? prefill.prices.precarite : (document.getElementById('defaultPricePrecarite')?.value || '');
  const isEdit = !!__editingFirestoreId;

  body.innerHTML = `
    <div class="installer-intro">
      <div class="installer-kicker">LIEN INSTALLATEUR</div>
      <h3>${isEdit ? 'Modifier ce lien' : 'Créer un lien de simulation'}</h3>
      <p>${isEdit ? "Les changements s'appliquent immédiatement au même lien, déjà envoyé à l'installateur — il n'a rien de nouveau à récupérer." : "Personnalisez l'espace de simulation de votre installateur."}</p>
    </div>
    <section class="installer-section">
      <div class="installer-section-title">Installateur</div>
      <div class="installer-fields installer-fields-single">
        <div class="installer-field">
          <label for="installerName">Nom de l'installateur</label>
          <input id="installerName" type="text" placeholder="Ex. : Dupont Chauffage" value="${escapeAttr(prefill?.installerName||'')}">
        </div>
        <div class="installer-field">
          <label for="installerLabel">Étiquette de ce lien <span style="font-weight:400;color:var(--text-3)">(pour vous y retrouver — non visible par l'installateur)</span></label>
          <input id="installerLabel" type="text" placeholder="Ex. : Dupont Chauffage — devis toiture sept. 2026" value="${escapeAttr(prefill?.label||'')}">
        </div>
      </div>
    </section>
    <section class="installer-section">
      <div class="installer-section-title">Prix CEE généraux</div>
      <div class="installer-fields">
        <div class="installer-field">
          <label for="installerClassic">Prix classique <span>€/MWhc</span></label>
          <input id="installerClassic" type="number" min="0" step="0.1" value="${escapeAttr(currentClassic)}" placeholder="Ex. : 7,8">
        </div>
        <div class="installer-field">
          <label for="installerPrec">Prix précarité <span>€/MWhc</span></label>
          <input id="installerPrec" type="number" min="0" step="0.1" value="${escapeAttr(currentPrec)}" placeholder="Ex. : 12,5">
        </div>
      </div>
    </section>
    <section class="installer-section">
      <div class="installer-section-title">Fiches disponibles</div>
      <div class="installer-help">Sélectionnez les fiches qui seront visibles sur la page de l'installateur.</div>
      <div class="installer-selection-actions">
        <button type="button" class="installer-select-btn" onclick="selectAllInstallerFiches()">Tout sélectionner</button>
        <button type="button" class="installer-select-btn" onclick="clearAllInstallerFiches()">Tout désélectionner</button>
      </div>
      <div class="installer-fiche-list" id="installerFicheList"></div>
    </section>
    <div class="installer-feedback" id="installerFeedback"></div>
    <div class="installer-actions">
      <button type="button" class="btn-secondary" onclick="closeInstallerLinkBuilder()">Annuler</button>
      <button type="button" class="btn-primary installer-generate" id="installerGenerateBtn" onclick="generateInstallerLink()">${isEdit ? 'Mettre à jour ce lien' : 'Générer le lien installateur'}</button>
    </div>
    <div class="installer-result" id="installerResult" style="display:${isEdit?'block':'none'}">
      <div class="installer-result-title">${isEdit ? 'Lien (inchangé)' : 'Lien généré'}</div>
      <div class="installer-url" id="installerUrl">${isEdit ? escapeHtml(prefill.url) : ''}</div>
      <button type="button" class="btn-primary" onclick="copyInstallerLink()">Copier le lien</button>
      <span class="installer-copied" id="installerCopied">✓ Copié</span>
    </div>
  `;

  if(isEdit) window.__lastInstallerLink = prefill.url;

  const list = document.getElementById('installerFicheList');
  const selectedSet = new Set(prefill?.fiches || FICHES.map(f=>f.code));
  const exceptions = prefill?.exceptions || {};

  FICHES.forEach((f, index) => {
    const residential = isResidentialFiche(f);
    const isChecked = selectedSet.has(f.code);
    const exc = exceptions[f.code];
    const row = document.createElement('div');
    row.className = 'installer-fiche-row';
    row.innerHTML = `
      <label class="installer-check">
        <input type="checkbox" data-index="${index}" ${isChecked?'checked':''}>
        <span><b>${escapeHtml(f.code)}</b><small>${escapeHtml(f.title)}</small></span>
      </label>
      <div class="installer-fiche-pricing">
        <label class="installer-specific-toggle">
          <input type="checkbox" data-specific-index="${index}" ${exc?'checked':''}>
          <span>Prix spécifique pour cette fiche</span>
        </label>
        <div class="installer-exception-fields" data-specific-fields="${index}" ${exc?'':'hidden'}>
          <div>
            <label>Classique</label>
            <input type="number" min="0" step="0.1" data-classique="${index}" placeholder="€/MWhc" value="${exc?.classique ?? ''}">
          </div>
          ${residential ? `
            <div>
              <label>Précarité</label>
              <input type="number" min="0" step="0.1" data-precarite="${index}" placeholder="€/MWhc" value="${exc?.precarite ?? ''}">
            </div>
          ` : ''}
        </div>
      </div>
    `;
    list.appendChild(row);

    const ficheCheckbox = row.querySelector('[data-index]');
    const pricing = row.querySelector('.installer-fiche-pricing');
    const specificCheckbox = row.querySelector('[data-specific-index]');
    const specificFields = row.querySelector('[data-specific-fields]');
    pricing.hidden = !isChecked;

    ficheCheckbox.addEventListener('change', () => {
      pricing.hidden = !ficheCheckbox.checked;
      if(!ficheCheckbox.checked){
        specificCheckbox.checked = false;
        specificFields.hidden = true;
      }
    });
    specificCheckbox.addEventListener('change', () => {
      specificFields.hidden = !specificCheckbox.checked;
    });
  });

  overlay.classList.add('open');
}

/* ── Sélection des fiches ── */

function selectAllInstallerFiches(){
  document.querySelectorAll('#installerFicheList input[data-index]').forEach(cb => {
    cb.checked = true;
    const pricing = cb.closest('.installer-fiche-row')?.querySelector('.installer-fiche-pricing');
    if(pricing) pricing.hidden = false;
  });
}
function clearAllInstallerFiches(){
  document.querySelectorAll('#installerFicheList input[data-index]').forEach(cb => {
    cb.checked = false;
    const row = cb.closest('.installer-fiche-row');
    if(!row) return;
    const pricing = row.querySelector('.installer-fiche-pricing');
    const specificCheckbox = row.querySelector('[data-specific-index]');
    const specificFields = row.querySelector('[data-specific-fields]');
    if(pricing) pricing.hidden = true;
    if(specificCheckbox) specificCheckbox.checked = false;
    if(specificFields) specificFields.hidden = true;
  });
}

function closeInstallerLinkBuilder(){
  document.getElementById('installerOverlay')?.classList.remove('open');
  __editingFirestoreId = null;
  __editingHistoryId = null;
}

/* ── Génération / mise à jour du lien ── */

async function generateInstallerLink(){
  const classic = parseFloat(document.getElementById('installerClassic')?.value);
  const prec = parseFloat(document.getElementById('installerPrec')?.value);
  const installerName = document.getElementById('installerName')?.value.trim() || '';
  const feedback = document.getElementById('installerFeedback');
  const genBtn = document.getElementById('installerGenerateBtn');

  if(!installerName){
    feedback.textContent = "Renseignez le nom de l'installateur.";
    feedback.className = 'installer-feedback error';
    return;
  }
  if(!Number.isFinite(classic) || classic < 0 || !Number.isFinite(prec) || prec < 0){
    feedback.textContent = 'Renseignez un prix classique et un prix précarité valides.';
    feedback.className = 'installer-feedback error';
    return;
  }

  const selectedFiches = [];
  document.querySelectorAll('#installerFicheList input[data-index]:checked').forEach(checkbox => {
    selectedFiches.push(FICHES[Number(checkbox.dataset.index)].code);
  });
  if(!selectedFiches.length){
    feedback.textContent = 'Sélectionnez au moins une fiche.';
    feedback.className = 'installer-feedback error';
    return;
  }

  const exceptions = {};
  let exceptionError = false;
  document.querySelectorAll('#installerFicheList .installer-fiche-row').forEach(row => {
    if(exceptionError) return;
    const ficheCheckbox = row.querySelector('[data-index]');
    if(!ficheCheckbox?.checked) return;
    const specificCheckbox = row.querySelector('[data-specific-index]');
    if(!specificCheckbox?.checked) return;
    const index = Number(ficheCheckbox.dataset.index);
    const fiche = FICHES[index];
    const residential = isResidentialFiche(fiche);
    const c = parseFloat(row.querySelector(`[data-classique="${index}"]`)?.value);
    const p = residential ? parseFloat(row.querySelector(`[data-precarite="${index}"]`)?.value) : NaN;
    if(!Number.isFinite(c) || c < 0 || (residential && (!Number.isFinite(p) || p < 0))){
      feedback.textContent = `Complétez le prix spécifique de ${fiche.code}.`;
      feedback.className = 'installer-feedback error';
      exceptionError = true;
      return;
    }
    exceptions[fiche.code] = residential ? {classique:c, precarite:p} : {classique:c};
  });
  if(exceptionError) return;

  const label = document.getElementById('installerLabel')?.value.trim() || '';
  const config = {
    v:3,
    installerName,
    label,
    fiches:selectedFiches,
    prices:{classique:classic, precarite:prec},
    exceptions,
  };

  genBtn.disabled = true;
  const originalLabel = genBtn.textContent;
  genBtn.textContent = 'Enregistrement…';
  feedback.textContent = '';

  try{
    await __ebsFirebaseReady;

    if(__editingFirestoreId){
      await ebsDb.collection('installerLinks').doc(__editingFirestoreId).set(
        {...config, active:true, updatedAt: firebase.firestore.FieldValue.serverTimestamp()},
        {merge:true}
      );
      const url = window.__lastInstallerLink;
      feedback.textContent = '✓ Lien mis à jour — le même lien reflète désormais ces changements.';
      feedback.className = 'installer-feedback success';
      document.getElementById('installerUrl').textContent = url;
      document.getElementById('installerResult').style.display = 'block';
    } else {
      const docRef = await ebsDb.collection('installerLinks').add({
        ...config, active:true, createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      const url = `${window.location.origin}${window.location.pathname}?${INSTALLER_ID_QUERY_KEY}=${docRef.id}`;
      document.getElementById('installerUrl').textContent = url;
      document.getElementById('installerResult').style.display = 'block';
      feedback.textContent = 'Lien prêt à être copié.';
      feedback.className = 'installer-feedback success';
      window.__lastInstallerLink = url;
    }
  }catch(err){
    console.error('Erreur génération lien installateur :', err);
    feedback.textContent = 'Échec : ' + (err.message||err) + ' (vérifie les règles Firestore)';
    feedback.className = 'installer-feedback error';
  }finally{
    genBtn.disabled = false;
    genBtn.textContent = originalLabel;
  }
}

/* ── Révocation instantanée (liens Firestore uniquement) ── */

async function revokeInstallerLink(firestoreId){
  if(!confirm('Révoquer ce lien ? Il affichera immédiatement un message "lien invalide" chez l\'installateur.')) return;
  try{
    await __ebsFirebaseReady;
    await ebsDb.collection('installerLinks').doc(firestoreId).set({active:false, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await renderInstallerHistory();
  }catch(err){
    alert('Échec de la révocation : ' + (err.message||err));
  }
}
async function restoreInstallerLink(firestoreId){
  try{
    await __ebsFirebaseReady;
    await ebsDb.collection('installerLinks').doc(firestoreId).set({active:true, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}, {merge:true});
    await renderInstallerHistory();
  }catch(err){
    alert('Échec de la réactivation : ' + (err.message||err));
  }
}

/* ── Historique des liens créés — PARTAGÉ via Firestore (tous ordinateurs) ──
   Les très anciens liens créés avant la mise en place de Firebase restent
   visibles séparément, localement, à titre de rattrapage uniquement. ── */

const INSTALLER_HISTORY_KEY = 'ebsInstallerLinksHistory'; // ancien stockage local, conservé en lecture seule
const INSTALLER_HISTORY_CODE_HASH = 'e85107b10d07675b3e632479f34b4edeab3f72b14743674e6c2c4e7098df559f'; // code par défaut : "ebs2026"

function getLegacyLocalHistory(){
  try { return JSON.parse(localStorage.getItem(INSTALLER_HISTORY_KEY)) || []; } catch(e){ return []; }
}
function deleteLegacyLocalHistoryEntry(id){
  const list = getLegacyLocalHistory().filter(e => e.id !== id);
  localStorage.setItem(INSTALLER_HISTORY_KEY, JSON.stringify(list));
  renderInstallerHistory();
}
async function fetchInstallerLinks(){
  await __ebsFirebaseReady;
  const snap = await ebsDb.collection('installerLinks').orderBy('createdAt','desc').get();
  return snap.docs.map(d => ({firestoreId: d.id, ...d.data()}));
}
function editInstallerLinkFromHistory(firestoreId){
  const entry = __installerLinksCache.find(e => e.firestoreId === firestoreId);
  if(!entry) return;
  const url = `${window.location.origin}${window.location.pathname}?${INSTALLER_ID_QUERY_KEY}=${firestoreId}`;
  closeInstallerHistory();
  openInstallerLinkBuilder({...entry, id:null, url});
}
async function deleteInstallerLink(firestoreId){
  if(!confirm('Supprimer définitivement ce lien ? Il ne fonctionnera plus pour personne — cette action est irréversible.')) return;
  try{
    await __ebsFirebaseReady;
    await ebsDb.collection('installerLinks').doc(firestoreId).delete();
    await renderInstallerHistory();
  }catch(err){
    alert('Échec de la suppression : ' + (err.message||err));
  }
}

async function sha256HexInstaller(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}
async function openInstallerHistoryGate(){
  if(isEbsAdminUnlocked()){
    document.getElementById('installerHistoryOverlay').classList.add('open');
    await renderInstallerHistory();
    return;
  }
  document.getElementById('installerHistoryCodeInput').value = '';
  document.getElementById('installerHistoryCodeError').style.display = 'none';
  document.getElementById('installerHistoryGateOverlay').classList.add('open');
  setTimeout(()=>document.getElementById('installerHistoryCodeInput')?.focus(), 50);
}
function closeInstallerHistoryGate(){
  document.getElementById('installerHistoryGateOverlay').classList.remove('open');
}
async function checkInstallerHistoryCode(){
  const input = document.getElementById('installerHistoryCodeInput');
  const hash = await sha256HexInstaller(input.value);
  if(hash === INSTALLER_HISTORY_CODE_HASH){
    setEbsAdminUnlocked();
    closeInstallerHistoryGate();
    document.getElementById('installerHistoryOverlay').classList.add('open');
    await renderInstallerHistory();
  } else {
    document.getElementById('installerHistoryCodeError').style.display = 'block';
    input.value = '';
    input.focus();
  }
}
function closeInstallerHistory(){
  document.getElementById('installerHistoryOverlay').classList.remove('open');
}
async function copyInstallerHistoryLink(id, btn){
  const input = document.getElementById('hist-url-'+id);
  if(!input) return;
  try{ await navigator.clipboard.writeText(input.value); }
  catch(e){ input.select(); document.execCommand('copy'); }
  const original = btn.textContent;
  btn.textContent = '✓ Copié';
  setTimeout(()=>{ btn.textContent = original; }, 1400);
}

let __installerLinksCache = [];

async function renderInstallerHistory(){
  const body = document.getElementById('installerHistoryBody');
  body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Chargement…</div>`;

  let sharedList = [];
  try{
    sharedList = await fetchInstallerLinks();
    __installerLinksCache = sharedList;
  }catch(err){
    body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--red);font-size:13px">Impossible de charger les liens depuis Firebase.<br><span style="font-size:11px;color:var(--text-3)">${escapeHtml(err.message||err)}</span></div>`;
    return;
  }
  const legacyList = getLegacyLocalHistory().filter(e => !e.firestoreId); // les vrais anciens liens pré-Firebase

  if(!sharedList.length && !legacyList.length){
    body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Aucun lien créé pour l'instant.</div>`;
    return;
  }

  const sharedHtml = sharedList.map(e => {
    const date = e.createdAt?.toDate ? e.createdAt.toDate().toLocaleString('fr-FR', {dateStyle:'medium', timeStyle:'short'}) : '—';
    const ficheCount = e.fiches ? e.fiches.length : 0;
    const url = `${window.location.origin}${window.location.pathname}?${INSTALLER_ID_QUERY_KEY}=${e.firestoreId}`;
    const inactive = e.active === false;
    return `
      <div class="installer-history-row${inactive?' installer-history-row-revoked':''}">
        <div class="installer-history-row-head">
          <div>
            <div class="installer-history-label">${escapeHtml(e.label || e.installerName)}</div>
            <div class="installer-history-meta">${escapeHtml(e.installerName)} · créé le ${date}${inactive ? ' · <span style="color:var(--red)">révoqué</span>' : ' · <span style="color:var(--green)">actif, modifiable</span>'}</div>
          </div>
          <div class="installer-history-row-actions">
            <button type="button" class="installer-history-edit" onclick="editInstallerLinkFromHistory('${e.firestoreId}')" title="Modifier fiches/prix">✏️ Modifier</button>
            ${inactive
              ? `<button type="button" class="installer-history-revoke" onclick="restoreInstallerLink('${e.firestoreId}')" title="Réactiver ce lien">↺ Réactiver</button>`
              : `<button type="button" class="installer-history-revoke" onclick="revokeInstallerLink('${e.firestoreId}')" title="Révoquer ce lien">🔒 Révoquer</button>`}
            <button type="button" class="installer-history-del" onclick="deleteInstallerLink('${e.firestoreId}')" title="Supprimer définitivement">🗑️</button>
          </div>
        </div>
        <div class="installer-history-details">
          <span><b>Prix Classique :</b> ${e.prices.classique} €/MWhc</span>
          <span><b>Prix Précarité :</b> ${e.prices.precarite} €/MWhc</span>
          <span><b>${ficheCount} fiche${ficheCount>1?'s':''} :</b> ${escapeHtml((e.fiches||[]).join(', '))}</span>
        </div>
        <div class="installer-history-url-row">
          <input type="text" class="installer-history-url-input" id="hist-url-${e.firestoreId}" value="${escapeHtml(url)}" readonly onclick="this.select()">
          <button type="button" class="installer-select-btn" onclick="copyInstallerHistoryLink('${e.firestoreId}', this)">Copier</button>
        </div>
      </div>
    `;
  }).join('');

  const legacyHtml = legacyList.length ? `
    <div style="font-size:11px;font-weight:700;color:var(--text-3);text-transform:uppercase;letter-spacing:.03em;margin:18px 0 8px">
      Anciens liens (créés avant la synchronisation Firebase — visibles sur cet ordinateur uniquement, figés)
    </div>
    ${legacyList.map(e => {
      const date = new Date(e.createdAt).toLocaleString('fr-FR', {dateStyle:'medium', timeStyle:'short'});
      return `
        <div class="installer-history-row">
          <div class="installer-history-row-head">
            <div>
              <div class="installer-history-label">${escapeHtml(e.label || e.installerName)}</div>
              <div class="installer-history-meta">${escapeHtml(e.installerName)} · créé le ${date}</div>
            </div>
            <button type="button" class="installer-history-del" onclick="deleteLegacyLocalHistoryEntry('${e.id}')" title="Retirer de cette liste locale">✕</button>
          </div>
          <div class="installer-history-url-row">
            <input type="text" class="installer-history-url-input" value="${escapeHtml(e.url)}" readonly onclick="this.select()">
          </div>
        </div>
      `;
    }).join('')}
  ` : '';

  body.innerHTML = sharedHtml + legacyHtml;
}

/* ── Copier le lien (écran de génération) ── */

async function copyInstallerLink(){
  if(!window.__lastInstallerLink) return;
  try{ await navigator.clipboard.writeText(window.__lastInstallerLink); }
  catch(e){
    const ta = document.createElement('textarea');
    ta.value = window.__lastInstallerLink;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    ta.remove();
  }
  const el = document.getElementById('installerCopied');
  if(el){ el.classList.add('show'); setTimeout(()=>el.classList.remove('show'), 1400); }
}

/* ── Sécurité HTML ── */

function escapeHtml(value){
  return String(value).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function escapeAttr(value){ return escapeHtml(value); }

document.getElementById('installerHistoryUnlockBtn').addEventListener('click', checkInstallerHistoryCode);
document.getElementById('installerHistoryCodeInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') checkInstallerHistoryCode();
});

/* ── Mode installateur (ouverture d'un lien) ── */

function showInstallerLinkInvalidScreen(message){
  window.__EBS_LINK_REVOKED = true;
  document.documentElement.classList.add('installer-mode', 'installer-revoked');
  function show(){
    document.body.innerHTML = `
      <div class="installer-revoked-screen">
        <div class="installer-revoked-icon">🔒</div>
        <h2>Ce lien n'est plus valide</h2>
        <p>${message || "Ce lien de simulation a été désactivé par EBS Énergie. Merci de contacter votre interlocuteur habituel pour obtenir un nouveau lien."}</p>
      </div>
    `;
  }
  if(document.readyState === 'loading') window.addEventListener('DOMContentLoaded', show);
  else show();
}

function insertInstallerBanner(installerName){
  const card = document.querySelector('.default-prices-card');
  if(card) card.style.display = 'none';
  const heroIntro = document.querySelector('.hero-intro');
  if(heroIntro){
    heroIntro.insertAdjacentHTML('afterend', `
      <div class="installer-hero-slot">
        <div class="installer-hero-badge">
          <span class="installer-hero-icon">🔧</span>
          <span class="installer-hero-text">
            <span class="installer-hero-kicker">Espace installateur</span>
            <span class="installer-hero-name">${escapeHtml(installerName || 'Espace installateur')}</span>
          </span>
        </div>
      </div>
    `);
  }
}

(async function initInstallerMode(){
  const params = new URLSearchParams(window.location.search);
  const instId = params.get(INSTALLER_ID_QUERY_KEY);
  const legacyRaw = params.get(INSTALLER_QUERY_KEY);

  let config = null;

  if(instId){
    try{
      await __ebsFirebaseReady;
      const doc = await ebsDb.collection('installerLinks').doc(instId).get();
      if(!doc.exists || doc.data().active === false){
        showInstallerLinkInvalidScreen();
        return;
      }
      config = doc.data();
    }catch(err){
      console.error('Erreur chargement lien installateur :', err);
      showInstallerLinkInvalidScreen("Ce lien n'a pas pu être chargé pour le moment. Vérifiez votre connexion et réessayez.");
      return;
    }
  } else if(legacyRaw){
    config = decodeInstallerConfig(legacyRaw);
  }

  if(!config?.prices) return;

  window.EBS_INSTALLER_CONFIG = config;
  document.documentElement.classList.add('installer-mode');

  if(document.readyState === 'loading'){
    window.addEventListener('DOMContentLoaded', () => insertInstallerBanner(config.installerName));
  } else {
    insertInstallerBanner(config.installerName);
  }
})();
