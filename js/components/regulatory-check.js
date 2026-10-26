// ═══════════════════════════════════════════════════════════════════════
// VÉRIFICATION DE FENÊTRE RÉGLEMENTAIRE — fenêtres vérifiées sur documents officiels
// (voir onglet Sources pour le détail et les dates de dernière vérification)
// ═══════════════════════════════════════════════════════════════════════
const REGULATORY_WINDOWS = {
  'BAR-TH-168': {
    type: 'bonification',
    label: 'Bonification ×4 / ×5',
    start: '2026-09-01', end: '2026-12-31',
    source: 'Arrêté du 17/08/2026 — JORF du 23/08/2026'
  },
  'BAR-TH-171': {
    type: 'bonification',
    label: 'Coup de Pouce ×5',
    start: '2025-10-01', end: '2030-12-31',
    source: 'Charte Coup de Pouce Chauffage'
  },
  'BAR-TH-177': {
    type: 'bonification',
    label: 'Coup de Pouce (prolongé)',
    start: '2026-01-17', end: null,
    source: "Arrêté du 07/01/2026 — pas de date de fin connue à ce jour, à reconfirmer"
  },
  'BAR-TH-179': {
    type: 'validite',
    label: 'Validité de la fiche',
    start: null, end: '2030-12-31',
    source: 'BAR-TH-179 vA75.1'
  },
  'BAT-TH-163': {
    type: 'validite',
    label: 'Validité de la fiche',
    start: null, end: '2030-12-31',
    source: 'BAT-TH-163 vA81-2'
  },
  'IND-BA-110': {
    type: 'validite',
    label: 'Version vA71-4 (opérations engagées avant le 01/08/2030)',
    start: '2025-08-01', end: '2030-07-31',
    source: 'IND-BA-110 vA71-4 à compter du 01/08/2025'
  },
  'BAT-TH-142': {
    type: 'validite',
    label: 'Version vA71-4 (opérations engagées avant le 01/08/2030)',
    start: '2025-08-01', end: '2030-07-31',
    source: 'BAT-TH-142 vA71-4 à compter du 01/08/2025'
  },
  'AGRI-EQ-102': {
    type: 'validite',
    label: 'Version vA65-2 (opérations engagées avant le 01/04/2030)',
    start: '2025-04-01', end: '2030-03-31',
    source: 'AGRI-EQ-102 vA65-2 à compter du 01/04/2025'
  },
  'AGRI-EQ-104': {
    type: 'validite',
    label: 'Version vA62-2 (opérations engagées avant le 01/01/2030)',
    start: '2025-01-01', end: '2029-12-31',
    source: 'AGRI-EQ-104 vA62-2 à compter du 01/01/2025'
  },
  'AGRI-EQ-107': {
    type: 'validite',
    label: 'Version vA38-1 (pas de date de fin dans le texte)',
    start: '2021-07-31', end: null,
    source: 'AGRI-EQ-107 vA38-1 à compter du 31/07/2021'
  },
  'AGRI-EQ-109': {
    type: 'validite',
    label: "Version vA58-2 (opérations engagées jusqu'au 31/12/2028)",
    start: '2024-02-01', end: '2028-12-31',
    source: 'AGRI-EQ-109 vA58-2 à compter du 01/02/2024'
  },
  'AGRI-EQ-112': {
    type: 'validite',
    label: 'Version vA73-3 — FICHE ABROGÉE à compter du 24/06/2026 (engagement avant cette date uniquement)',
    start: '2025-09-01', end: '2026-06-23',
    source: 'AGRI-EQ-112 vA73-3 à compter du 01/09/2025 ; abrogée à compter du 24/06/2026'
  },
  'AGRI-EQ-111': {
    type: 'validite',
    label: 'Version vA62-1 (opérations engagées avant le 01/08/2029)',
    start: '2024-08-31', end: '2029-07-31',
    source: 'AGRI-EQ-111 vA62-1 à compter du 31/08/2024'
  },
  'BAT-TH-162': {
    type: 'validite',
    label: 'Version vA81-2 (opérations engagées jusqu\'au 31/12/2030)',
    start: '2026-04-30', end: '2030-12-31',
    source: 'BAT-TH-162 vA81-2 à compter du 30/04/2026'
  },
  'IND-UT-137': {
    type: 'validite',
    label: 'Version vA84-3 (opérations engagées avant le 01/01/2031)',
    start: '2026-05-25', end: '2030-12-31',
    source: 'IND-UT-137 vA84-3 à compter du 25/05/2026'
  },
  'IND-UT-141': {
    type: 'validite',
    label: 'Validité de la fiche (bonification α à partir du 27/09/2026)',
    start: '2026-09-05', end: '2031-08-31',
    source: 'Arrêté du 01/09/2026 — JORF du 04/09/2026 ; bonification : arrêté du 18/09/2026 — JORF du 26/09/2026'
  },
};

function addRegulatoryCheck(container, ficheCode){
  const win = REGULATORY_WINDOWS[ficheCode];
  if(!win) return;
  const today = new Date().toISOString().slice(0,10);
  container.insertAdjacentHTML('afterbegin', `
    <div class="reg-check" id="regCheckBox">
      <div class="reg-check-row">
        <label for="regDate">📅 Date d'engagement prévue</label>
        <input type="date" id="regDate" value="${today}">
        <span class="reg-status" id="regStatus"></span>
      </div>
      <div class="reg-source">${win.label} — Source : ${win.source}</div>
    </div>
  `);
  const dateEl = container.querySelector('#regDate');
  const statusEl = container.querySelector('#regStatus');
  const boxEl = container.querySelector('#regCheckBox');
  function evaluate(){
    const d = dateEl.value;
    const beforeStart = win.start && d < win.start;
    const afterEnd = win.end && d > win.end;
    const ok = !beforeStart && !afterEnd;
    if(ok){
      statusEl.textContent = '✓ Dans la fenêtre valide';
      statusEl.className = 'reg-status reg-ok';
      boxEl.style.background = 'var(--green-bg)';
    } else {
      statusEl.textContent = afterEnd ? '⚠ Fenêtre dépassée à cette date' : '⚠ Pas encore active à cette date';
      statusEl.className = 'reg-status reg-warn';
      boxEl.style.background = 'var(--orange-bg)';
    }
  }
  dateEl.addEventListener('input', evaluate);
  evaluate();
}

