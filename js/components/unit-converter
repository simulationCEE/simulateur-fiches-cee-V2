// ═══════════════════════════════════════════════════════════════════════
// CONVERTISSEUR D'UNITÉS CEE — kWhc ↔ MWhc ↔ GWhc ↔ TWhc
// ═══════════════════════════════════════════════════════════════════════
const CEE_UNITS = [
  {key:'kwhc', label:'kWh cumac',  factor:1},
  {key:'mwhc', label:'MWh cumac',  factor:1e3},
  {key:'gwhc', label:'GWh cumac',  factor:1e6},
  {key:'twhc', label:'TWh cumac',  factor:1e9},
];

function openConverter(){
  const body = document.getElementById('converterBody');
  body.innerHTML = `
    <div class="field-row">
      <div class="field"><label>Valeur</label><input type="number" id="conv-value" value="1000000" step="any"></div>
      <div class="field"><label>Unité de départ</label>
        <select id="conv-unit">${CEE_UNITS.map(u=>`<option value="${u.key}">${u.label}</option>`).join('')}</select>
      </div>
    </div>
    <div class="divider"></div>
    <div id="conv-results"></div>
  `;
  document.getElementById('conv-unit').value = 'kwhc';
  const recalc = () => {
    const raw = parseFloat(document.getElementById('conv-value').value);
    const fromKey = document.getElementById('conv-unit').value;
    const fromUnit = CEE_UNITS.find(u=>u.key===fromKey);
    const resultsEl = document.getElementById('conv-results');
    if(isNaN(raw)){ resultsEl.innerHTML = ''; return; }
    const baseKwhc = raw * fromUnit.factor;
    resultsEl.innerHTML = CEE_UNITS.map(u => {
      const converted = baseKwhc / u.factor;
      const isSource = u.key === fromKey;
      return `<div class="result-row ${isSource?'hi':''}">
        <span class="result-label">${u.label}</span>
        <span class="result-val" style="font-size:${isSource?'16px':'14px'}">${converted.toLocaleString('fr-FR',{maximumFractionDigits:6})}</span>
      </div>`;
    }).join('');
  };
  document.getElementById('conv-value').addEventListener('input', recalc);
  document.getElementById('conv-unit').addEventListener('change', recalc);
  recalc();
  document.getElementById('converterOverlay').classList.add('open');
}
function closeConverter(){ document.getElementById('converterOverlay').classList.remove('open'); }
