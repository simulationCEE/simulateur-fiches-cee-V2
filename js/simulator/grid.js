// GRID RENDERING
// ═══════════════════════════════════════════════════════════════════════
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const chips = document.querySelectorAll('.chip');
let activeFilter = 'all';

function tagLabel(t){
  return {pac:"PAC",isol:"Isolation",solaire:"Solaire",renov:"Rénovation"}[t] || t;
}
function sectionLabel(t){
  return {pac:"Pompes à chaleur",isol:"Isolation",solaire:"Solaire thermique",renov:"Rénovation globale"}[t] || t;
}

function buildCard(f){
  const div = document.createElement('div');
  div.className = 'card';
  div.onclick = () => openSim(f);
  div.innerHTML = `
    <div class="card-top">
      <span class="card-code">${f.code}</span>
      <span class="sector-tag ${f.sector==='res'?'sector-res':'sector-ter'}">${f.sector==='res'?'Résidentiel':'Tertiaire'}</span>
    </div>
    <div class="card-title">${f.title}</div>
    <div class="card-meta">
      <span class="meta-tag">${f.version}</span>
      <span class="meta-tag">DV ${f.dv}</span>
      ${f.tags.map(t=>`<span class="meta-tag">${tagLabel(t)}</span>`).join('')}
    </div>
  `;
  return div;
}

const SUBDOMAIN_ORDER = ['pac','isol','solaire','renov'];
const FEATURED_CODES = ['BAR-TH-171','BAR-TH-168','BAR-TH-179'];
const groupedContainer = document.getElementById('groupedContainer');

function renderFlatGrid(list){
  grid.style.display = '';
  groupedContainer.style.display = 'none';
  grid.innerHTML = '';
  document.getElementById('noResults').style.display = list.length ? 'none' : 'block';
  list.forEach(f => grid.appendChild(buildCard(f)));
  document.getElementById('ficheCount').textContent = `${list.length} / ${FICHES.length} fiches`;
}

function renderGroupedBySector(sector){
  grid.style.display = 'none';
  groupedContainer.style.display = '';
  document.getElementById('noResults').style.display = 'none';
  groupedContainer.innerHTML = '';
  const sectorFiches = FICHES.filter(f => f.sector === sector);

  if(sectorFiches.length === 0){
    groupedContainer.innerHTML = `<div class="empty-sector">Aucune fiche n'est encore référencée pour ce secteur.<br>Cette catégorie sera complétée prochainement.</div>`;
    document.getElementById('ficheCount').textContent = `0 fiche`;
    return;
  }

  let shown = 0;
  SUBDOMAIN_ORDER.forEach(tag=>{
    const group = sectorFiches.filter(f => f.tags.includes(tag));
    if(group.length === 0) return;
    shown += group.length;
    const section = document.createElement('div');
    section.className = 'subdomain-section';
    section.innerHTML = `<div class="subdomain-title">${sectionLabel(tag)} <span class="subdomain-count">${group.length}</span></div>`;
    const subgrid = document.createElement('div');
    subgrid.className = 'grid';
    group.forEach(f => subgrid.appendChild(buildCard(f)));
    section.appendChild(subgrid);
    groupedContainer.appendChild(section);
  });
  document.getElementById('ficheCount').textContent = `${shown} fiche${shown>1?'s':''}`;
}

function renderGrid(){
  const q = searchInput.value.trim().toLowerCase();

  if(q){
    const filtered = FICHES.filter(f=>{
      const matchesSector = activeFilter === 'all' ||
        (activeFilter === 'featured' ? FEATURED_CODES.includes(f.code) : f.sector === activeFilter);
      const matchesSearch = f.code.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.tags.some(t=>tagLabel(t).toLowerCase().includes(q));
      return matchesSector && matchesSearch;
    });
    renderFlatGrid(filtered);
    return;
  }

  if(activeFilter === 'all'){
    renderFlatGrid(FICHES);
    return;
  }

  if(activeFilter === 'featured'){
    renderFlatGrid(FICHES.filter(f => FEATURED_CODES.includes(f.code)));
    return;
  }

  renderGroupedBySector(activeFilter);
}

searchInput.addEventListener('input', renderGrid);
chips.forEach(c => c.addEventListener('click', () => {
  chips.forEach(x=>x.classList.remove('active'));
  c.classList.add('active');
  activeFilter = c.dataset.filter;
  renderGrid();
}));

