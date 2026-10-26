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

function tagLabel(t){ return {pac:'PAC',isol:'Isolation',solaire:'Solaire',renov:'Rénovation',biomasse:'Biomasse','chauffage-bois':'Chauffage au bois','recuperation-chaleur':'Récupération de chaleur','chaudiere-industrielle':'Chaudière industrielle',froid:'Froid',destratification:'Déstratification','pac-agriculture':'PAC agriculture','pac-rehausse':'PAC de rehausse industrielle',geothermie:'Système géothermique','ecran thermique simple':'Simple écran thermique','double ecran thermique':'Double écran thermique','ecran thermique lateral':'Écran thermique latéral','isolation parois serre':'Isolation des parois de serre','couverture serre':'Couverture performante de serre','double paroi gonflable':'Double paroi gonflable'}[t] || t; }
function ficheCategory(f){ return Array.isArray(f.sector) ? 'mixte' : (SECTOR_META[f.sector] ? f.sector : 'res'); }
function ficheCategoryMeta(f){ return SECTOR_META[ficheCategory(f)] || SECTOR_META.res; }

// Équipements de serre (AGRI-EQ) : le fichier image porte le nom du tag, ex. « ecran thermique simple.png »
const AGRI_EQ_TAGS = ['double paroi gonflable','double ecran thermique','ecran thermique lateral','ecran thermique simple','isolation parois serre','couverture serre'];
// Autres orthographes acceptées pour le nom du fichier (tirets, mots collés), essayées si la première échoue
function illustrationAlternatives(f){
  const t = (f.tags || []).find(x => AGRI_EQ_TAGS.includes(x));
  return t ? ['assets/illustrations/' + t.replace(/ /g, '-') + '.png', 'assets/illustrations/' + t.replace(/ /g, '') + '.png'] : [];
}
// Image de repli si aucun fichier n'est trouvé
function illustrationFallback(f){
  if(f.sector === 'agri') return 'assets/illustrations/agriculture.png';
  if(f.tags?.includes('pac-rehausse') || f.tags?.includes('geothermie')) return 'assets/illustrations/pac.png';
  return 'assets/illustrations/renovation.png';
}
// Appelée par onerror : essaie l'orthographe suivante, puis l'image de repli
function ebsImgNext(img){
  const alts = (img.dataset.alts || '').split('|').filter(Boolean);
  const next = alts.shift();
  img.dataset.alts = alts.join('|');
  if(next){ img.src = next; }
  else { img.onerror = null; img.src = img.dataset.fallback; }
}

  function illustrationFor(f){
  if(f.tags?.includes('pac')) return 'assets/illustrations/pac.png';
  if(f.tags?.includes('isol')) return 'assets/illustrations/isolation.png';
  if(f.tags?.includes('solaire')) return 'assets/illustrations/solaire.png';
  if(f.tags?.includes('renov')) return 'assets/illustrations/renovation.png';
  if(f.tags?.includes('biomasse')) return 'assets/illustrations/biomasse.png';
  if(f.tags?.includes('chauffage-bois')) return 'assets/illustrations/chauffage-bois.png';
  if(f.tags?.includes('recuperation-chaleur')) return 'assets/illustrations/récupération de chaleur.png';
  if(f.tags?.includes('chaudiere-industrielle')) return 'assets/illustrations/chaudière industrielle.png';
  if(f.tags?.includes('froid')) return 'assets/illustrations/système de régulation hp flottante.png';
  if(f.tags?.includes('destratification')) return "assets/illustrations/destratificateur d'air.png"; // apostrophe : guillemets doubles obligatoires
  if(f.tags?.includes('pac-agriculture')) return 'assets/illustrations/PAC pour agriculture.png';
  if(f.tags?.includes('pac-rehausse')) return 'assets/illustrations/PAC de rehausse industrielle.png';
  if(f.tags?.includes('geothermie')) return 'assets/illustrations/Système géothermique.png';
  const eqTag = (f.tags || []).find(t => AGRI_EQ_TAGS.includes(t));
  if(eqTag) return 'assets/illustrations/' + eqTag + '.png';   // le nom du fichier est le tag
  if(f.sector === 'agri') return 'assets/illustrations/agriculture.png';
  return 'assets/illustrations/renovation.png';
}

function buildCard(f){
  const div = document.createElement('div');
  const meta = ficheCategoryMeta(f);
  div.className = `card card-type-${meta.cls}`;
  div.onclick = () => openSim(f);
  div.innerHTML = `
    <div class="card-illustration"><img src="${illustrationFor(f)}" alt="Illustration ${f.title}" loading="lazy" data-alts="${illustrationAlternatives(f).join('|')}" data-fallback="${illustrationFallback(f)}" onerror="ebsImgNext(this)"></div>
    <div class="card-content"><div class="card-code">${f.code}</div><div class="card-title">${f.title}</div><span class="sector-badge">${meta.label}</span></div>
    <div class="card-arrow" aria-hidden="true">›</div>`;
  return div;
}

/* ── Affichage par secteur : une section par secteur, fiches triées par technologie ── */
const SECTOR_ORDER = ['res','ter','indus','agri','reseaux','transport','mixte'];
const SECTOR_NOTES = {mixte:'Résidentiel et tertiaire'};
// Ordre des technologies à l'intérieur d'un secteur (les fiches d'une même famille sont voisines)
const TECH_ORDER = ['pac','geothermie','pac-rehausse','pac-agriculture','ecran thermique simple','double ecran thermique','ecran thermique lateral','double paroi gonflable','isolation parois serre','couverture serre','chauffage-bois','biomasse','solaire','renov','isol','chaudiere-industrielle','recuperation-chaleur','froid','destratification'];
function techRank(f){
  const ranks = (f.tags || []).map(t => TECH_ORDER.indexOf(t)).filter(i => i >= 0);
  return ranks.length ? Math.min(...ranks) : TECH_ORDER.length;
}
function compareFiches(a, b){
  return techRank(a) - techRank(b) || a.code.localeCompare(b.code, 'fr', {numeric:true});
}

function renderGroupedGrid(list){
  grid.style.display = 'none';
  grid.innerHTML = '';
  const container = document.getElementById('groupedContainer');
  container.style.display = '';
  container.innerHTML = '';
  document.getElementById('noResults').style.display = list.length ? 'none' : 'block';

  const groups = {};
  list.forEach(f => { const k = ficheCategory(f); (groups[k] = groups[k] || []).push(f); });

  SECTOR_ORDER.filter(k => groups[k]).forEach(k => {
    const meta = SECTOR_META[k] || SECTOR_META.res;
    const fiches = groups[k].slice().sort(compareFiches);
    const section = document.createElement('section');
    section.className = `sector-section sector-section-${meta.cls}`;
    section.innerHTML = `
      <div class="sector-head">
        <h2>${meta.label}</h2>
        ${SECTOR_NOTES[k] ? `<span class="sector-head-note">${SECTOR_NOTES[k]}</span>` : ''}
        <span class="sector-head-count">${fiches.length} fiche${fiches.length > 1 ? 's' : ''}</span>
      </div>`;
    const sectionGrid = document.createElement('div');
    sectionGrid.className = 'grid sector-grid';
    fiches.forEach(f => sectionGrid.appendChild(buildCard(f)));
    section.appendChild(sectionGrid);
    container.appendChild(section);
  });

  document.getElementById('ficheCount').textContent = `${list.length} fiche${list.length > 1 ? 's' : ''} disponible${list.length > 1 ? 's' : ''}`;
}

function renderGrid(){
  const fold = s => String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');   // recherche sans accent
  const q = fold(searchInput.value.trim());
  const allowedFiches = window.EBS_INSTALLER_CONFIG?.fiches || null;

  const filtered = FICHES.filter(f => {
    const matchesInstaller = !allowedFiches || allowedFiches.includes(f.code);
    const matchesSector = activeFilter === 'all' || ficheHasSector(f, activeFilter);
    const matchesSearch = !q || fold(f.code).includes(q) || fold(f.title).includes(q) || f.tags.some(t => fold(tagLabel(t)).includes(q) || fold(t).includes(q));

    return matchesInstaller && matchesSector && matchesSearch;
  });

  renderGroupedGrid(filtered);
}

searchInput.addEventListener('input', renderGrid);
chips.forEach(c => c.addEventListener('click', () => { chips.forEach(x => x.classList.remove('active')); c.classList.add('active'); activeFilter = c.dataset.filter; renderGrid(); }));
