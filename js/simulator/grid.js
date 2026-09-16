// GRID RENDERING — accueil / catalogue
const grid = document.getElementById('grid');
const searchInput = document.getElementById('searchInput');
const chips = document.querySelectorAll('.chip');
let activeFilter = 'all';

function ficheHasSector(f, sector){
  return Array.isArray(f.sector) ? f.sector.includes(sector) : f.sector === sector;
}

const SECTOR_META = {
  res:{label:'Résidentiel',cls:'res'}, ter:{label:'Tertiaire',cls:'ter'}, indus:{label:'Industrie',cls:'indus'},
  agri:{label:'Agriculture',cls:'agri'}, reseaux:{label:'Réseaux',cls:'reseaux'}, transport:{label:'Transport',cls:'transport'}, mixte:{label:'Mixte',cls:'mixte'}
};

function tagLabel(t){ return {pac:'PAC',isol:'Isolation',solaire:'Solaire',renov:'Rénovation'}[t] || t; }
function ficheCategory(f){ return Array.isArray(f.sector) ? 'mixte' : (SECTOR_META[f.sector] ? f.sector : 'res'); }
function ficheCategoryMeta(f){ return SECTOR_META[ficheCategory(f)] || SECTOR_META.res; }

  function illustrationFor(f){
  if(f.tags?.includes('pac')) return 'assets/illustrations/pac.png';
  if(f.tags?.includes('isol')) return 'assets/illustrations/isolation.png';
  if(f.tags?.includes('solaire')) return 'assets/illustrations/solaire.png';
  if(f.tags?.includes('renov')) return 'assets/illustrations/renovation.png';
  if(f.sector === 'agri') return 'assets/illustrations/agriculture.png';
  return 'assets/illustrations/renovation.png';
}

function buildCard(f){
  const div = document.createElement('div');
  const meta = ficheCategoryMeta(f);
  div.className = `card card-type-${meta.cls}`;
  div.onclick = () => openSim(f);
  div.innerHTML = `
    <div class="card-illustration"><img src="${illustrationFor(f)}" alt="Illustration ${f.title}" loading="lazy"></div>
    <div class="card-content"><div class="card-code">${f.code}</div><div class="card-title">${f.title}</div><span class="sector-badge">${meta.label}</span></div>
    <div class="card-arrow" aria-hidden="true">›</div>`;
  return div;
}

function renderFlatGrid(list){
  grid.style.display = '';
  document.getElementById('groupedContainer').style.display = 'none';
  grid.innerHTML = '';
  document.getElementById('noResults').style.display = list.length ? 'none' : 'block';
  list.forEach(f => grid.appendChild(buildCard(f)));
  document.getElementById('ficheCount').textContent = `${list.length} fiche${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;
}

function renderGrid(){
  const q = searchInput.value.trim().toLowerCase();
  const filtered = FICHES.filter(f => {
    const matchesSector = activeFilter === 'all' || ficheHasSector(f, activeFilter);
    const matchesSearch = !q || f.code.toLowerCase().includes(q) || f.title.toLowerCase().includes(q) || f.tags.some(t => tagLabel(t).toLowerCase().includes(q));
    return matchesSector && matchesSearch;
  });
  renderFlatGrid(filtered);
}

searchInput.addEventListener('input', renderGrid);
chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x => x.classList.remove('active')); c.classList.add('active'); activeFilter = c.dataset.filter; renderGrid(); }));
