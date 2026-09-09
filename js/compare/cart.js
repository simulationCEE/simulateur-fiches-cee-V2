// ═══════════════════════════════════════════════════════════════════════
// COMPARATIF (PANIER) — capture générique + export PDF via impression
// ═══════════════════════════════════════════════════════════════════════
let currentFiche = null;
let cart = loadCart();

function loadCart(){
  try{
    return JSON.parse(localStorage.getItem('cee_cart') || '[]');
  }catch(e){ return []; }
}
function saveCart(){
  try{
    localStorage.setItem('cee_cart', JSON.stringify(cart));
  }catch(e){ /* stockage indisponible — le panier reste en mémoire pour la session */ }
}

function captureSnapshot(){
  const params = [];
  document.querySelectorAll('#simBody .field').forEach(f=>{
    const label = f.querySelector('label');
    const input = f.querySelector('input,select');
    if(!label || !input) return;
    const labelText = (label.childNodes[0].textContent || '').trim();
    const value = input.tagName === 'SELECT' ? input.options[input.selectedIndex].text : input.value;
    if(labelText) params.push([labelText, value]);
  });
  const results = [];
  document.querySelectorAll('#simBody .result-row').forEach(r=>{
    const label = r.querySelector('.result-label');
    const val = r.querySelector('.result-val');
    const isHi = r.classList.contains('hi') || r.classList.contains('cdp');
    if(label && val) results.push([label.textContent.trim(), val.textContent.trim(), isHi]);
  });
  return {
    id: 'snap_' + Date.now() + '_' + Math.random().toString(36).slice(2,8),
    code: currentFiche.code,
    title: currentFiche.title,
    date: new Date().toLocaleString('fr-FR'),
    params, results
  };
}

// ═══════════════════════════════════════════════════════════════════════
// MODE DOSSIER — cumul de plusieurs fiches, vérification de non-cumul,
// total sélectionnable (session uniquement, non persisté)
// ═══════════════════════════════════════════════════════════════════════
const NON_CUMUL = {
  'BAR-TH-168': ['BAR-TH-171'],
  'BAR-TH-171': ['BAR-TH-168'],
  'BAR-TH-177': ['BAR-TH-171','BAR-TH-179','BAT-TH-163','BAR-TH-168','BAR-EN-101','BAR-EN-102','BAR-EN-103'],
};
let dossierSelections = {}; // session uniquement — id snapshot -> index de la ligne comptée dans le total

function parseEuroVal(str){
  const n = parseInt(String(str).replace(/[^\d-]/g,''), 10);
  return isNaN(n) ? 0 : n;
}

function checkNonCumul(items){
  const conflicts = [];
  for(let i=0;i<items.length;i++){
    for(let j=i+1;j<items.length;j++){
      const a = items[i].code, b = items[j].code;
      if((NON_CUMUL[a]||[]).includes(b)){
        conflicts.push([a,b]);
      }
    }
  }
  return conflicts;
}

function updateCartUI(){
  const bar = document.getElementById('cartBar');
  const badge = document.getElementById('cartBadge');
  const text = document.getElementById('cartBarText');
  bar.classList.toggle('show', cart.length > 0);
  badge.textContent = cart.length;
  text.textContent = cart.length + (cart.length>1 ? ' simulations' : ' simulation');
  renderCompareTable();
}
function renderCompareTable(){
  const list = document.getElementById('cartList');
  if(cart.length === 0){
    list.innerHTML = `<div class="cart-empty">Aucune simulation enregistrée pour le moment.<br>Ouvrez une fiche et cliquez sur « + Ajouter au comparatif » pour la placer ici.</div>`;
    return;
  }

  const conflicts = checkNonCumul(cart);
  const warningHtml = conflicts.length ? `
    <div class="warn-box show" style="margin-bottom:14px">
      ⚠ <b>Fiches non cumulables détectées dans ce dossier :</b><br>
      ${conflicts.map(([a,b])=>`${a} et ${b}`).join('<br>')}
    </div>` : '';

  // Initialiser la sélection par défaut (première ligne "hi"/"cdp", sinon aucune)
  cart.forEach(s=>{
    if(!(s.id in dossierSelections)){
      const hiIdx = s.results.findIndex(r=>r[2]);
      dossierSelections[s.id] = hiIdx >= 0 ? hiIdx : null;
    }
  });

  const cols = cart.map((s,i) => `
    <div class="compare-col">
      <div class="compare-col-head">
        <button class="compare-col-remove" onclick="removeFromCart(${i})" title="Retirer">✕</button>
        <div class="cc-code">${s.code}</div>
        <div class="cc-title">${s.title}</div>
        <div class="cc-date">${s.date}</div>
      </div>
      <div class="compare-section-label">Paramètres</div>
      ${s.params.map(([l,v])=>`
        <div class="compare-row">
          <span class="cr-label">${l}</span>
          <span class="cr-value">${v}</span>
        </div>`).join('')}
      <div class="compare-section-label">Résultats — cocher la ligne à inclure au total du dossier</div>
      ${s.results.map(([l,v],ri)=>`
        <div class="compare-row result" style="display:flex;align-items:center;gap:6px">
          <input type="radio" name="dossier-${s.id}" value="${ri}" ${dossierSelections[s.id]===ri?'checked':''}
            onchange="setDossierSelection('${s.id}', ${ri})" style="flex-shrink:0">
          <span class="cr-label" style="flex:1">${l}</span>
          <span class="cr-value">${v}</span>
        </div>`).join('')}
      <div class="compare-row" style="display:flex;align-items:center;gap:6px">
        <input type="radio" name="dossier-${s.id}" value="-1" ${dossierSelections[s.id]==null?'checked':''}
          onchange="setDossierSelection('${s.id}', null)" style="flex-shrink:0">
        <span class="cr-label" style="flex:1;font-style:italic">Ne pas inclure au total</span>
      </div>
    </div>
  `).join('');

  const total = cart.reduce((sum,s)=>{
    const idx = dossierSelections[s.id];
    if(idx == null || !s.results[idx]) return sum;
    return sum + parseEuroVal(s.results[idx][1]);
  }, 0);

  list.innerHTML = `
    ${warningHtml}
    <div class="dossier-total">📁 Total du dossier (lignes cochées) : <b>${total.toLocaleString('fr-FR')} €</b></div>
    <div class="compare-grid">${cols}</div>
  `;
}
function setDossierSelection(id, idx){
  dossierSelections[id] = idx === null ? null : parseInt(idx,10);
  renderCompareTable();
}
function removeFromCart(i){ cart.splice(i,1); saveCart(); updateCartUI(); }
function clearCart(){ cart = []; dossierSelections = {}; saveCart(); updateCartUI(); }
function openCart(){ renderCompareTable(); document.getElementById('cartOverlay').classList.add('open'); }
function closeCart(){ document.getElementById('cartOverlay').classList.remove('open'); }
function downloadCartPDF(){
  if(cart.length === 0) return;
  printDocument(cart);
}

