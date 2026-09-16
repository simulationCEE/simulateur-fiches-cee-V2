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

    return JSON.parse(new TextDecoder().decode(bytes));
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
  const overlay = document.getElementById('installerOverlay');
  const body = document.getElementById('installerBody');

  if(!overlay || !body) return;

  const currentClassic =
    document.getElementById('defaultPriceClassique')?.value || '';

  const currentPrec =
    document.getElementById('defaultPricePrecarite')?.value || '';

  body.innerHTML = `
    <div class="installer-intro">
      <div class="installer-kicker">LIEN INSTALLATEUR</div>
      <h3>Créer un lien de simulation</h3>
      <p>Personnalisez l’espace de simulation de votre installateur.</p>
    </div>

    <section class="installer-section">
      <div class="installer-section-title">Installateur</div>

      <div class="installer-fields installer-fields-single">
        <div class="installer-field">
          <label for="installerName">Nom de l’installateur</label>
          <input
            id="installerName"
            type="text"
            placeholder="Ex. : Dupont Chauffage"
          >
        </div>
      </div>
    </section>

    <section class="installer-section">
      <div class="installer-section-title">Prix CEE généraux</div>

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
      <div class="installer-section-title">Fiches disponibles</div>

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

    <section class="installer-section">
      <div class="installer-section-title">
        Exceptions de prix par fiche
      </div>

      <div class="installer-help">
        Utilisez cette section uniquement si une fiche doit avoir un prix
        différent du prix général.
      </div>

      <div
        class="installer-exception-list"
        id="installerExceptionList"
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

  const list = document.getElementById('installerFicheList');
  const exceptionList =
    document.getElementById('installerExceptionList');

  /* ── Fiches disponibles ── */

  FICHES.forEach((f, index) => {
    const row = document.createElement('div');

    row.className = 'installer-fiche-row';

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
    `;

    list.appendChild(row);
  });

  /* ── Exceptions de prix ── */

  FICHES.forEach((f, index) => {
    const residential = isResidentialFiche(f);

    const row = document.createElement('div');

    row.className = 'installer-exception-row';

    row.innerHTML = `
      <label class="installer-check">
        <input
          type="checkbox"
          data-exception-index="${index}"
        >

        <span>
          <b>${escapeHtml(f.code)}</b>
          <small>Prix spécifique</small>
        </span>
      </label>

      <div
        class="installer-exception-fields"
        data-exception-fields="${index}"
        hidden
      >
        <div>
          <label>Classique</label>

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
                <label>Précarité</label>

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
    `;

    exceptionList.appendChild(row);

    const checkbox =
      row.querySelector('[data-exception-index]');

    const fields =
      row.querySelector('[data-exception-fields]');

    checkbox.addEventListener('change', () => {
      fields.hidden = !checkbox.checked;
    });
  });

  overlay.classList.add('open');
}

/* ── Sélection des fiches ── */

function selectAllInstallerFiches(){
  document
    .querySelectorAll('#installerFicheList input[data-index]')
    .forEach(cb => {
      cb.checked = true;
    });
}

function clearAllInstallerFiches(){
  document
    .querySelectorAll('#installerFicheList input[data-index]')
    .forEach(cb => {
      cb.checked = false;
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
      document.getElementById('installerClassic')?.value
    );

  const prec =
    parseFloat(
      document.getElementById('installerPrec')?.value
    );

  const installerName =
    document.getElementById('installerName')?.value.trim() || '';

  const feedback =
    document.getElementById('installerFeedback');

  const exceptions = {};

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

  /* ── Exceptions ── */

  let exceptionError = false;

  document
    .querySelectorAll(
      '#installerExceptionList .installer-exception-row'
    )
    .forEach(row => {

      if(exceptionError) return;

      const checkbox =
        row.querySelector(
          '[data-exception-index]'
        );

      if(!checkbox || !checkbox.checked) return;

      const index =
        Number(checkbox.dataset.exceptionIndex);

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
          `Complétez les prix de l’exception ${fiche.code}.`;

        feedback.className =
          'installer-feedback error';

        exceptionError = true;

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

  document.getElementById('installerUrl').textContent =
    url;

  document.getElementById('installerResult').style.display =
    'block';

  feedback.textContent =
    'Lien prêt à être copié.';

  feedback.className =
    'installer-feedback success';

  window.__lastInstallerLink =
    url;
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
    document.getElementById('installerCopied');

  if(el){

    el.classList.add('show');

    setTimeout(
      () => el.classList.remove('show'),
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

  window.addEventListener(
    'DOMContentLoaded',
    () => {

      const card =
        document.querySelector(
          '.default-prices-card'
        );

      if(card){
        card.style.display = 'none';
      }

      const intro =
        document.querySelector(
          '.hero-intro'
        );

      if(intro){

        const installerName =
          config.installerName ||
          'Espace installateur';

        intro.insertAdjacentHTML(
          'beforeend',
          `
            <div class="installer-name-display">
              ${escapeHtml(installerName)}
            </div>

            <div class="installer-mode-badge">
              Espace installateur
            </div>
          `
        );
      }
    }
  );
})();
