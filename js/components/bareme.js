// ═══════════════════════════════════════════════════════════════════════
// GENERIC BARÈME TABLE TOGGLE — bouton "Voir le barème complet"
// ═══════════════════════════════════════════════════════════════════════
function bareme(container, buildFn){
  container.insertAdjacentHTML('beforeend', `
    <button type="button" class="bareme-toggle" id="baremeToggleBtn">
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
      <span id="baremeToggleLabel">Voir le barème complet</span>
    </button>
    <div class="bareme-wrap" id="baremeWrap"></div>
  `);
  const btn = container.querySelector('#baremeToggleBtn');
  const wrap = container.querySelector('#baremeWrap');
  const label = container.querySelector('#baremeToggleLabel');
  btn.addEventListener('click', ()=>{
    const isOpen = wrap.classList.toggle('open');
    btn.classList.toggle('expanded', isOpen);
    label.textContent = isOpen ? 'Masquer le barème complet' : 'Voir le barème complet';
    if(isOpen) buildFn(wrap);
  });
  wrap.refresh = () => { if(wrap.classList.contains('open')) buildFn(wrap); };
  wrap.forceBuild = () => buildFn(wrap);
  return wrap;
}

