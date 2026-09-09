// ═══════════════════════════════════════════════════════════════════════
// SIMULATOR OVERLAY LOGIC
// ═══════════════════════════════════════════════════════════════════════
const overlay = document.getElementById('overlay');
const simTitle = document.getElementById('simTitle');
const simSubtitle = document.getElementById('simSubtitle');
const simBody = document.getElementById('simBody');

function openSim(f){
  currentFiche = f;
  simTitle.textContent = f.code + " — " + f.title;
  simSubtitle.textContent = `${f.version} · Durée de vie ${f.dv}`;
  simBody.innerHTML = '';
  document.querySelector('.sim-panel').classList.toggle('wide', f.code !== 'BAR-TH-177');
  f.render(simBody);
  addTooltips(simBody);
  applyDefaultPrices(simBody);
  addRegulatoryCheck(simBody, f.code);

  // Capture des valeurs par défaut pour le bouton Réinitialiser
  const defaults = [];
  simBody.querySelectorAll('input,select').forEach(el=>{
    defaults.push({id: el.id, value: el.value});
  });

  simBody.insertAdjacentHTML('beforeend', `
    <div class="legal-note">⚖️ <b>Estimation indicative et non contractuelle.</b> Les montants affichés dépendent des prix CEE saisis par l'utilisateur et de l'éligibilité réelle des travaux, vérifiée sur site. Cet outil ne constitue pas un engagement d'EBS Énergie et ne saurait engager sa responsabilité en cas d'écart avec le montant de prime effectivement obtenu.</div>
    <div class="sim-actions">
      <button type="button" class="btn-reset" id="resetSimBtn" title="Remettre les valeurs par défaut">↺ Réinitialiser</button>
      <button type="button" class="btn-secondary" id="addToCartBtn">+ Ajouter au comparatif</button>
      <div class="pdf-dropdown">
        <button type="button" class="btn-secondary" id="pdfMainBtn">📄 Télécharger PDF ▾</button>
        <div class="pdf-menu" id="pdfMenu"></div>
      </div>
    </div>
  `);
  document.getElementById('resetSimBtn').addEventListener('click', ()=>{
    defaults.forEach(d=>{
      const el = document.getElementById(d.id);
      if(!el) return;
      el.value = d.value;
      el.dispatchEvent(new Event('input', {bubbles:true}));
    });
  });
  const addBtn = document.getElementById('addToCartBtn');
  addBtn.addEventListener('click', ()=>{
    cart.push(captureSnapshot());
    saveCart();
    updateCartUI();
    addBtn.textContent = '✓ Ajouté au comparatif';
    addBtn.classList.add('added');
    setTimeout(()=>{ addBtn.textContent='+ Ajouter au comparatif'; addBtn.classList.remove('added'); }, 1500);
  });

  // Menu déroulant "Télécharger PDF" — options selon ce que la fiche propose
  const hasBareme = !!simBody.querySelector('#baremeWrap');
  const hasAdj = !!simBody.querySelector('#adjTableWrap');
  const pdfMenu = document.getElementById('pdfMenu');
  let menuHtml = `<button type="button" data-opt="sim">Simulation uniquement</button>`;
  if(hasBareme) menuHtml += `<button type="button" data-opt="bareme">+ Barème complet</button>`;
  if(hasAdj) menuHtml += `<button type="button" data-opt="adj">+ Tableau évolutif</button>`;
  if(hasBareme && hasAdj) menuHtml += `<button type="button" class="pdf-opt-all" data-opt="all">Tout inclure (simulation complète)</button>`;
  pdfMenu.innerHTML = menuHtml;

  const pdfMainBtn = document.getElementById('pdfMainBtn');
  pdfMainBtn.addEventListener('click', (e)=>{
    e.stopPropagation();
    pdfMenu.classList.toggle('open');
  });
  pdfMenu.querySelectorAll('button').forEach(b=>{
    b.addEventListener('click', ()=>{
      pdfMenu.classList.remove('open');
      downloadSimPDF(b.dataset.opt);
    });
  });
  document.addEventListener('click', (e)=>{
    if(!e.target.closest('.pdf-dropdown')) pdfMenu.classList.remove('open');
  });

  overlay.classList.add('open');
}
function closeSim(){ overlay.classList.remove('open'); }
document.addEventListener('keydown', e => { if(e.key === 'Escape'){ closeSim(); closeCart(); closeSources(); } });

