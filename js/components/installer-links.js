/* ═══════════════════════════════════════════════════════════════════════
   LIENS INSTALLATEUR — configuration des prix + fiches disponibles
   Les valeurs sont encodées dans l'URL pour fonctionner sur GitHub Pages.
   ═══════════════════════════════════════════════════════════════════════ */

const INSTALLER_QUERY_KEY = 'installateur';

function encodeInstallerConfig(config){
  const json = JSON.stringify(config);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach(b => binary += String.fromCharCode(b));

  return btoa(binary)
    .replace(/\+/g,'-')
    .replace(/\//g,'_')
    .replace(/=+$/,'');
}

function decodeInstallerConfig(value){
  try{
    const padded = value
      .replace(/-/g,'+')
      .replace(/_/g,'/')
      + '==='.slice((value.length + 3) % 4);

    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));

    return JSON.parse(
      new TextDecoder().decode(bytes)
    );

  }catch(e){
    return null;
  }
}

function isResidentialFiche(f){
  return Array.isArray(f.sector)
    ? f.sector.includes('res')
    : f.sector === 'res';
}

function getInstallerPriceConfig(ficheCode){
  const cfg = window.EBS_INSTALLER_CONFIG;

  if(!cfg || !cfg.prices) return null;

  const exception = cfg.exceptions?.[ficheCode];

  return exception
    ? {...cfg.prices, ...exception}
    : cfg.prices;
}

/* ── Ouverture du générateur ── */

function openInstallerLinkBuilder(){

  const overlay =
    document.getElementById('installerOverlay');

  const body =
    document.getElementById('installerBody');

  if(!overlay || !body) return;

  const currentClassic =
    document.getElementById('defaultPriceClassique')?.value || '';

  const currentPrec =
    document.getElementById('defaultPricePrecarite')?.value || '';

  body.innerHTML = `
    <div class="installer-intro">
      <div class="installer-kicker">LIEN INSTALLATEUR</div>

      <h3>Créer un lien de simulation</h3>

      <p>
        Personnalisez l’espace de simulation de votre installateur.
      </p>
    </div>

    <section class="installer-section">

      <div class="installer-section-title">
        Installateur
      </div>

      <div class="installer-fields installer-fields-single">

        <div class="installer-field">

          <label for="installerName">
            Nom de l’installateur
          </label>

          <input
            id="installerName"
            type="text"
            placeholder="Ex. : Dupont Chauffage"
          >

        </div>

        <div class="installer-field">

          <label for="installerLabel">
            Étiquette de ce lien <span style="font-weight:400;color:var(--text-3)">(pour vous y retrouver — non visible par l'installateur)</span>
          </label>

          <input
            id="installerLabel"
            type="text"
            placeholder="Ex. : Dupont Chauffage — devis toiture sept. 2026"
          >

        </div>

      </div>

    </section>

    <section class="installer-section">

      <div class="installer-section-title">
        Prix CEE généraux
      </div>

      <div class="installer-fields">

        <div class="installer-field">

          <label for="installerClassic">
            Prix classique <span>€/MWhc</span>
          </label>

          <input
            id="installerClassic"
            type="number"
            min="0"
            step="0.1"
            value="${escapeAttr(currentClassic)}"
            placeholder="Ex. : 7,8"
          >

        </div>

        <div class="installer-field">

          <label for="installerPrec">
            Prix précarité <span>€/MWhc</span>
          </label>

          <input
            id="installerPrec"
            type="number"
            min="0"
            step="0.1"
            value="${escapeAttr(currentPrec)}"
            placeholder="Ex. : 12,5"
          >

        </div>

      </div>

    </section>

    <section class="installer-section">

      <div class="installer-section-title">
        Fiches disponibles
      </div>

      <div class="installer-help">
        Sélectionnez les fiches qui seront visibles sur la page de l’installateur.
      </div>

      <div class="installer-selection-actions">

        <button
          type="button"
          class="installer-select-btn"
          onclick="selectAllInstallerFiches()"
        >
          Tout sélectionner
        </button>

        <button
          type="button"
          class="installer-select-btn"
          onclick="clearAllInstallerFiches()"
        >
          Tout désélectionner
        </button>

      </div>

      <div
        class="installer-fiche-list"
        id="installerFicheList"
      ></div>

    </section>

    <div
      class="installer-feedback"
      id="installerFeedback"
    ></div>

    <div class="installer-actions">

      <button
        type="button"
        class="btn-secondary"
        onclick="closeInstallerLinkBuilder()"
      >
        Annuler
      </button>

      <button
        type="button"
        class="btn-primary installer-generate"
        onclick="generateInstallerLink()"
      >
        Générer le lien installateur
      </button>

    </div>

    <div
      class="installer-result"
      id="installerResult"
      style="display:none"
    >

      <div class="installer-result-title">
        Lien généré
      </div>

      <div
        class="installer-url"
        id="installerUrl"
      ></div>

      <button
        type="button"
        class="btn-primary"
        onclick="copyInstallerLink()"
      >
        Copier le lien
      </button>

      <span
        class="installer-copied"
        id="installerCopied"
      >
        ✓ Copié
      </span>

    </div>
  `;

  const list =
    document.getElementById('installerFicheList');

  /* ── Fiches disponibles + prix spécifiques ── */

  FICHES.forEach((f, index) => {

    const residential =
      isResidentialFiche(f);

    const row =
      document.createElement('div');

    row.className =
      'installer-fiche-row';

    row.innerHTML = `
      <label class="installer-check">

        <input
          type="checkbox"
          data-index="${index}"
          checked
        >

        <span>
          <b>${escapeHtml(f.code)}</b>
          <small>${escapeHtml(f.title)}</small>
        </span>

      </label>

      <div class="installer-fiche-pricing">

        <label class="installer-specific-toggle">

          <input
            type="checkbox"
            data-specific-index="${index}"
          >

          <span>
            Prix spécifique pour cette fiche
          </span>

        </label>

        <div
          class="installer-exception-fields"
          data-specific-fields="${index}"
          hidden
        >

          <div>

            <label>
              Classique
            </label>

            <input
              type="number"
              min="0"
              step="0.1"
              data-classique="${index}"
              placeholder="€/MWhc"
            >

          </div>

          ${
            residential
              ? `
                <div>

                  <label>
                    Précarité
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    data-precarite="${index}"
                    placeholder="€/MWhc"
                  >

                </div>
              `
              : ''
          }

        </div>

      </div>
    `;

    list.appendChild(row);

    const ficheCheckbox =
      row.querySelector('[data-index]');

    const pricing =
      row.querySelector('.installer-fiche-pricing');

    const specificCheckbox =
      row.querySelector('[data-specific-index]');

    const specificFields =
      row.querySelector('[data-specific-fields]');

    pricing.hidden =
      false;

    ficheCheckbox.addEventListener(
      'change',
      () => {

        pricing.hidden =
          !ficheCheckbox.checked;

        if(!ficheCheckbox.checked){

          specificCheckbox.checked =
            false;

          specificFields.hidden =
            true;
        }

      }
    );

    specificCheckbox.addEventListener(
      'change',
      () => {

        specificFields.hidden =
          !specificCheckbox.checked;

      }
    );

  });

  overlay.classList.add('open');
}

/* ── Sélection des fiches ── */

function selectAllInstallerFiches(){

  document
    .querySelectorAll(
      '#installerFicheList input[data-index]'
    )
    .forEach(cb => {

      cb.checked = true;

      const row =
        cb.closest('.installer-fiche-row');

      const pricing =
        row?.querySelector(
          '.installer-fiche-pricing'
        );

      if(pricing){
        pricing.hidden = false;
      }

    });
}

function clearAllInstallerFiches(){

  document
    .querySelectorAll(
      '#installerFicheList input[data-index]'
    )
    .forEach(cb => {

      cb.checked = false;

      const row =
        cb.closest('.installer-fiche-row');

      if(!row) return;

      const pricing =
        row.querySelector(
          '.installer-fiche-pricing'
        );

      const specificCheckbox =
        row.querySelector(
          '[data-specific-index]'
        );

      const specificFields =
        row.querySelector(
          '[data-specific-fields]'
        );

      if(pricing){
        pricing.hidden = true;
      }

      if(specificCheckbox){
        specificCheckbox.checked = false;
      }

      if(specificFields){
        specificFields.hidden = true;
      }

    });
}

/* ── Fermeture ── */

function closeInstallerLinkBuilder(){

  document
    .getElementById('installerOverlay')
    ?.classList.remove('open');

}

/* ── Génération du lien ── */

function generateInstallerLink(){

  const classic =
    parseFloat(
      document
        .getElementById('installerClassic')
        ?.value
    );

  const prec =
    parseFloat(
      document
        .getElementById('installerPrec')
        ?.value
    );

  const installerName =
    document
      .getElementById('installerName')
      ?.value
      .trim() || '';

  const feedback =
    document.getElementById(
      'installerFeedback'
    );

  if(!installerName){

    feedback.textContent =
      'Renseignez le nom de l’installateur.';

    feedback.className =
      'installer-feedback error';

    return;
  }

  if(
    !Number.isFinite(classic) ||
    classic < 0 ||
    !Number.isFinite(prec) ||
    prec < 0
  ){

    feedback.textContent =
      'Renseignez un prix classique et un prix précarité valides.';

    feedback.className =
      'installer-feedback error';

    return;
  }

  /* ── Fiches sélectionnées ── */

  const selectedFiches = [];

  document
    .querySelectorAll(
      '#installerFicheList input[data-index]:checked'
    )
    .forEach(checkbox => {

      const index =
        Number(checkbox.dataset.index);

      selectedFiches.push(
        FICHES[index].code
      );

    });

  if(!selectedFiches.length){

    feedback.textContent =
      'Sélectionnez au moins une fiche.';

    feedback.className =
      'installer-feedback error';

    return;
  }

  /* ── Exceptions de prix ── */

  const exceptions = {};

  let exceptionError =
    false;

  document
    .querySelectorAll(
      '#installerFicheList .installer-fiche-row'
    )
    .forEach(row => {

      if(exceptionError) return;

      const ficheCheckbox =
        row.querySelector(
          '[data-index]'
        );

      if(!ficheCheckbox?.checked) return;

      const specificCheckbox =
        row.querySelector(
          '[data-specific-index]'
        );

      if(!specificCheckbox?.checked) return;

      const index =
        Number(
          ficheCheckbox.dataset.index
        );

      const fiche =
        FICHES[index];

      const residential =
        isResidentialFiche(fiche);

      const c =
        parseFloat(
          row.querySelector(
            `[data-classique="${index}"]`
          )?.value
        );

      const p =
        residential
          ? parseFloat(
              row.querySelector(
                `[data-precarite="${index}"]`
              )?.value
            )
          : NaN;

      if(
        !Number.isFinite(c) ||
        c < 0 ||
        (
          residential &&
          (
            !Number.isFinite(p) ||
            p < 0
          )
        )
      ){

        feedback.textContent =
          `Complétez le prix spécifique de ${fiche.code}.`;

        feedback.className =
          'installer-feedback error';

        exceptionError =
          true;

        return;
      }

      exceptions[fiche.code] =
        residential
          ? {
              classique:c,
              precarite:p
            }
          : {
              classique:c
            };

    });

  if(exceptionError) return;

  /* ── Configuration ── */

  const config = {

    v:2,

    installerName,

    fiches:selectedFiches,

    prices:{
      classique:classic,
      precarite:prec
    },

    exceptions

  };

  const encoded =
    encodeInstallerConfig(config);

  const url =
    `${window.location.origin}${window.location.pathname}?${INSTALLER_QUERY_KEY}=${encoded}`;

  document
    .getElementById('installerUrl')
    .textContent = url;

  document
    .getElementById('installerResult')
    .style.display = 'block';

  feedback.textContent =
    'Lien prêt à être copié.';

  feedback.className =
    'installer-feedback success';

  window.__lastInstallerLink =
    url;

  const label =
    document
      .getElementById('installerLabel')
      ?.value
      .trim() || '';

  saveInstallerLinkToHistory({
    label,
    installerName,
    createdAt: new Date().toISOString(),
    prices: {classique:classic, precarite:prec},
    fiches: selectedFiches,
    exceptions,
    url,
  });
}

/* ── Historique local des liens créés (ce navigateur uniquement) ── */

const INSTALLER_HISTORY_KEY = 'ebsInstallerLinksHistory';
const INSTALLER_HISTORY_CODE_HASH = 'e85107b10d07675b3e632479f34b4edeab3f72b14743674e6c2c4e7098df559f'; // code par défaut : "ebs2026" — à changer (voir instructions plus bas)

function saveInstallerLinkToHistory(entry){
  let list = [];
  try { list = JSON.parse(localStorage.getItem(INSTALLER_HISTORY_KEY)) || []; } catch(e){ list = []; }
  entry.id = Date.now() + '-' + Math.random().toString(36).slice(2,8);
  list.unshift(entry);
  localStorage.setItem(INSTALLER_HISTORY_KEY, JSON.stringify(list));
}

function getInstallerLinkHistory(){
  try { return JSON.parse(localStorage.getItem(INSTALLER_HISTORY_KEY)) || []; } catch(e){ return []; }
}

function deleteInstallerLinkHistoryEntry(id){
  const list = getInstallerLinkHistory().filter(e => e.id !== id);
  localStorage.setItem(INSTALLER_HISTORY_KEY, JSON.stringify(list));
  renderInstallerHistory();
}

async function sha256HexInstaller(str){
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
  return [...new Uint8Array(buf)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function openInstallerHistoryGate(){
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
    closeInstallerHistoryGate();
    renderInstallerHistory();
    document.getElementById('installerHistoryOverlay').classList.add('open');
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
  try{
    await navigator.clipboard.writeText(input.value);
  }catch(e){
    input.select();
    document.execCommand('copy');
  }
  const original = btn.textContent;
  btn.textContent = '✓ Copié';
  setTimeout(()=>{ btn.textContent = original; }, 1400);
}

function renderInstallerHistory(){
  const body = document.getElementById('installerHistoryBody');
  const list = getInstallerLinkHistory();
  if(!list.length){
    body.innerHTML = `<div style="padding:30px 20px;text-align:center;color:var(--text-3);font-size:13px">Aucun lien créé depuis ce navigateur pour l'instant.</div>`;
    return;
  }
  body.innerHTML = list.map(e => {
    const date = new Date(e.createdAt).toLocaleString('fr-FR', {dateStyle:'medium', timeStyle:'short'});
    const ficheCount = e.fiches ? e.fiches.length : 0;
    return `
      <div class="installer-history-row">
        <div class="installer-history-row-head">
          <div>
            <div class="installer-history-label">${escapeHtml(e.label || e.installerName)}</div>
            <div class="installer-history-meta">${escapeHtml(e.installerName)} · créé le ${date}</div>
          </div>
          <button type="button" class="installer-history-del" onclick="deleteInstallerLinkHistoryEntry('${e.id}')" title="Retirer de l'historique">✕</button>
        </div>
        <div class="installer-history-details">
          <span><b>Prix Classique :</b> ${e.prices.classique} €/MWhc</span>
          <span><b>Prix Précarité :</b> ${e.prices.precarite} €/MWhc</span>
          <span><b>${ficheCount} fiche${ficheCount>1?'s':''} :</b> ${escapeHtml((e.fiches||[]).join(', '))}</span>
        </div>
        <div class="installer-history-url-row">
          <input type="text" class="installer-history-url-input" id="hist-url-${e.id}" value="${escapeHtml(e.url)}" readonly onclick="this.select()">
          <button type="button" class="installer-select-btn" onclick="copyInstallerHistoryLink('${e.id}', this)">Copier</button>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Copier le lien ── */

async function copyInstallerLink(){

  if(!window.__lastInstallerLink) return;

  try{

    await navigator.clipboard.writeText(
      window.__lastInstallerLink
    );

  }catch(e){

    const ta =
      document.createElement('textarea');

    ta.value =
      window.__lastInstallerLink;

    document.body.appendChild(ta);

    ta.select();

    document.execCommand('copy');

    ta.remove();
  }

  const el =
    document.getElementById(
      'installerCopied'
    );

  if(el){

    el.classList.add('show');

    setTimeout(
      () => {
        el.classList.remove('show');
      },
      1400
    );

  }
}

/* ── Sécurité HTML ── */

function escapeHtml(value){

  return String(value).replace(
    /[&<>'"]/g,
    c => ({
      '&':'&amp;',
      '<':'&lt;',
      '>':'&gt;',
      "'":'&#39;',
      '"':'&quot;'
    }[c])
  );

}

function escapeAttr(value){
  return escapeHtml(value);
}

document.getElementById('installerHistoryUnlockBtn').addEventListener('click', checkInstallerHistoryCode);
document.getElementById('installerHistoryCodeInput').addEventListener('keydown', (e)=>{
  if(e.key === 'Enter') checkInstallerHistoryCode();
});

/* ── Mode installateur ── */

(function initInstallerMode(){

  const raw =
    new URLSearchParams(
      window.location.search
    ).get(INSTALLER_QUERY_KEY);

  if(!raw) return;

  const config =
    decodeInstallerConfig(raw);

  if(!config?.prices) return;

  window.EBS_INSTALLER_CONFIG =
    config;

  document.documentElement.classList.add(
    'installer-mode'
  );

  function insertInstallerBanner(){

    const card =
      document.querySelector(
        '.default-prices-card'
      );

    if(card){
      card.style.display =
        'none';
    }

    const heroIntro =
      document.querySelector('.hero-intro');

    if(heroIntro){

      const installerName =
        config.installerName ||
        'Espace installateur';

      heroIntro.insertAdjacentHTML(
        'afterend',
        `
          <div class="installer-hero-slot">
            <div class="installer-hero-badge">
              <span class="installer-hero-icon">🔧</span>
              <span class="installer-hero-text">
                <span class="installer-hero-kicker">Espace installateur</span>
                <span class="installer-hero-name">${escapeHtml(installerName)}</span>
              </span>
            </div>
          </div>
        `
      );

    }

  }

  if(document.readyState === 'loading'){
    window.addEventListener('DOMContentLoaded', insertInstallerBanner);
  } else {
    insertInstallerBanner();
  }

})();
