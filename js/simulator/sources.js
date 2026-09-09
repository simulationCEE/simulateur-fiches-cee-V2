function openSources(){
  const body = document.getElementById('sourcesBody');
  body.innerHTML = FICHE_SOURCES.map(s => `
    <div class="source-card">
      <span class="sc-code">${s.code}</span><span class="sc-version">${s.version}</span>
      <div class="sc-detail">${s.detail}</div>
    </div>
  `).join('') + `
    <div class="sources-disclaimer">
      <b>⚖️ Portée de cette veille :</b> les dates ci-dessus proviennent des textes réglementaires transmis à EBS Énergie et vérifiés à la construction de cet outil. Ce simulateur ne surveille pas automatiquement le Journal Officiel : en cas de nouvel arrêté modifiant une fiche ou une bonification, cette page doit être mise à jour manuellement. À reconfirmer périodiquement, notamment pour les fenêtres de bonification proches de leur échéance.
    </div>
  `;
  document.getElementById('sourcesOverlay').classList.add('open');
}
function closeSources(){ document.getElementById('sourcesOverlay').classList.remove('open'); }

