// ═══════════════════════════════════════════════════════════════════════
// CAHIER DES CHARGES — BAR-TH-168 (pièces à fournir)
// ═══════════════════════════════════════════════════════════════════════
function addChecklist168(container){
  container.insertAdjacentHTML('beforeend', `
    <div class="bareme-actions-row">
      <button type="button" class="bareme-toggle" id="checklistToggleBtn">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        <span id="checklistToggleLabel">📋 Pièces à fournir pour ce dossier</span>
      </button>
      <button type="button" class="btn-pdf-sm" id="checklistDownloadBtn" title="Télécharger le cahier des charges en PDF">📄 PDF</button>
    </div>
    <div class="bareme-wrap" id="checklistWrap"></div>
  `);
  const btn = container.querySelector('#checklistToggleBtn');
  const wrap = container.querySelector('#checklistWrap');
  const label = container.querySelector('#checklistToggleLabel');
  const dlBtn = container.querySelector('#checklistDownloadBtn');

  function buildContent(){
    return `
      <div class="checklist-section" style="padding:14px 16px">
        <div class="checklist-cat">✅ Conditions d'éligibilité</div>
        <div class="checklist-item">☐ Logement achevé depuis plus de 2 ans</div>
        <div class="checklist-item">☐ Bénéficiaire : personne physique ou personne morale (SCI, SAS…)</div>
        <div class="checklist-item">☐ Personne morale, logement loué : transmission du cadre R2</div>
        <div class="checklist-item">☐ Non cumulable avec BAR-TH-171 et BAR-TH-172</div>
        <div class="checklist-item">☐ Aucun équipement gaz/fioul/charbon conservé après travaux (bonification)</div>

        <div class="checklist-cat">👤 Documents du bénéficiaire</div>
        <div class="checklist-item">☐ Avis d'imposition N-1 ou N-2</div>
        <div class="checklist-item">☐ Si adresse différente : justificatif de changement d'adresse (impots.gouv.fr) + un justificatif à l'adresse des travaux (facture énergie/eau, internet fixe, assurance habitation, taxe foncière/habitation, ou acte notarié)</div>
        <div class="checklist-refused">✕ Non acceptés : facture mobile, quittance de loyer, contrat de bail</div>

        <div class="checklist-cat">✍️ Documents CEE</div>
        <div class="checklist-item">☐ Devis daté et signé</div>
        <div class="checklist-item">☐ Cadre de contribution transmis au bénéficiaire</div>
        <div class="checklist-item">☐ Étude de dimensionnement (capteurs, ballon, émetteurs)</div>
        <div class="checklist-item">☐ Déclaration préalable de travaux — Cerfa n° 13703*12</div>
        <div class="checklist-item">☐ Décision de non-opposition de la mairie</div>
        <div class="checklist-item">☐ Attestation sur l'honneur signée (bénéficiaire + installateur)</div>
        <div class="checklist-item">☐ Facture définitive</div>
        <div class="checklist-item">☐ Attestation de remplacement des émetteurs en basse température</div>

        <div class="checklist-cat">👷 Documents de l'installateur</div>
        <div class="checklist-item">☐ Qualification RGE valide (devis + achèvement) : Qualisol Combi (chauffage+ECS) / Qualisol CESI (ECS seule) / Qualibat 5241</div>
        <div class="checklist-item">☐ Attestation d'assurance décennale (solaire thermique, hydraulique, toiture)</div>

        <div class="checklist-cat">☀️ Documents du dispositif solaire</div>
        <div class="checklist-item">☐ Type d'appoint, marque, référence, puissance thermique nominale, Etas</div>
        <div class="checklist-item">☐ Attestation de compatibilité des émetteurs basse température</div>

        <div class="checklist-cat">📸 Photographies obligatoires (datées, géolocalisées, nettes)</div>
        <div class="checklist-item">☐ Avant / pendant / après travaux — Vue générale de la maison</div>
        <div class="checklist-item">☐ Capteurs en toiture — Ballon solaire + plaque signalétique</div>
        <div class="checklist-item">☐ Régulateur, groupe de sécurité, vase d'expansion — Raccordements hydrauliques</div>
        <div class="checklist-item">☐ Appoint ENR + plaque signalétique — Reconfiguration basse température</div>
        <div class="checklist-item">☐ Émetteurs basse température — Équipement fossile avant/après dépose (le cas échéant)</div>

        <div style="font-size:10px;color:var(--text-3);margin-top:12px;padding-top:8px;border-top:1px solid var(--border)">
          Document interne EBS Énergie — ne se substitue pas à la fiche d'opération standardisée officielle.
        </div>
      </div>
    `;
  }

  btn.addEventListener('click', ()=>{
    const isOpen = wrap.classList.toggle('open');
    btn.classList.toggle('expanded', isOpen);
    label.textContent = isOpen ? 'Masquer les pièces à fournir' : '📋 Pièces à fournir pour ce dossier';
    if(isOpen) wrap.innerHTML = buildContent();
  });
  dlBtn.addEventListener('click', ()=>{
    const area = document.getElementById('printArea');
    area.innerHTML = `
      <div class="print-doc-header">
        <h1>Cahier des charges — BAR-TH-168</h1>
        <p>Pièces justificatives à transmettre à EBS Énergie — généré le ${new Date().toLocaleString('fr-FR')}</p>
      </div>
      ${buildContent()}
    `;
    window.print();
  });
}

