function snapshotToHTML(s, isLast){
  return `
    <div class="print-doc-header">
      <h1>Simulateur CEE — EBS Énergie</h1>
      <p>Estimation indicative générée le ${s.date}</p>
    </div>
    <div class="print-fiche-title">${s.code} — ${s.title}</div>
    <div class="print-section-title">📋 Paramètres du projet saisis</div>
    <table class="print-table">
      ${s.params.map(([l,v])=>`<tr><td class="pt-label">${l}</td><td class="pt-value">${v}</td></tr>`).join('')}
    </table>
    <div class="print-section-title">💶 Résultats de la simulation</div>
    <table class="print-table results">
      ${s.results.map(([l,v])=>`<tr><td class="pt-label">${l}</td><td class="pt-value">${v}</td></tr>`).join('')}
    </table>
    <div class="print-footer">Estimation indicative et non contractuelle — EBS Énergie ne saurait être tenue responsable des écarts avec le montant de prime effectivement obtenu, lequel dépend de l'obligé CEE retenu, de l'éligibilité réelle des travaux et de la réglementation en vigueur au moment de l'engagement.</div>
    ${isLast ? '' : '<div class="print-page-break"></div>'}
  `;
}

function printDocument(snapshots){
  const area = document.getElementById('printArea');
  area.innerHTML = snapshots.map((s,i)=>snapshotToHTML(s, i===snapshots.length-1)).join('');
  window.print();
}

function printBaremeTable(ficheCode, ficheTitle, tableOuterHTML){
  const area = document.getElementById('printArea');
  area.innerHTML = `
    <div class="print-doc-header">
      <h1>Simulateur CEE — EBS Énergie</h1>
      <p>Barème complet — généré le ${new Date().toLocaleString('fr-FR')}</p>
    </div>
    <div class="print-fiche-title">${ficheCode} — ${ficheTitle}</div>
    ${tableOuterHTML}
    <div class="print-footer">Estimation indicative et non contractuelle — EBS Énergie ne saurait être tenue responsable des écarts avec le montant de prime effectivement obtenu, lequel dépend de l'obligé CEE retenu, de l'éligibilité réelle des travaux et de la réglementation en vigueur au moment de l'engagement.</div>
  `;
  window.print();
}

// ═══════════════════════════════════════════════════════════════════════
// TÉLÉCHARGEMENT PDF UNIFIÉ — simulation / barème / tableau évolutif / tout
// ═══════════════════════════════════════════════════════════════════════
function downloadSimPDF(opt){
  const s = captureSnapshot();
  let html = `
    <div class="print-doc-header">
      <h1>Simulateur CEE — EBS Énergie</h1>
      <p>Estimation indicative générée le ${s.date}</p>
    </div>
    <div class="print-fiche-title">${s.code} — ${s.title}</div>
    <div class="print-section-title">📋 Paramètres du projet saisis</div>
    <table class="print-table">
      ${s.params.map(([l,v])=>`<tr><td class="pt-label">${l}</td><td class="pt-value">${v}</td></tr>`).join('')}
    </table>
    <div class="print-section-title">💶 Résultats de la simulation</div>
    <table class="print-table results">
      ${s.results.map(([l,v])=>`<tr><td class="pt-label">${l}</td><td class="pt-value">${v}</td></tr>`).join('')}
    </table>
  `;

  if(opt === 'bareme' || opt === 'all'){
    const wrap = simBody.querySelector('#baremeWrap');
    if(wrap){
      wrap.forceBuild();
      const table = wrap.querySelector('table.bareme');
      if(table) html += `<div class="print-section-title">📊 Barème complet</div>${table.outerHTML}`;
    }
  }
  if(opt === 'adj' || opt === 'all'){
    const adjWrapEl = simBody.querySelector('#adjTableWrap');
    if(adjWrapEl){
      const table = adjWrapEl.querySelector('table.surftbl');
      const stepEl = document.getElementById('adjStep');
      const repEl = document.getElementById('adjRep');
      const stepVal = stepEl ? stepEl.value : '';
      const repVal = repEl ? repEl.value : '';
      if(table) html += `<div class="print-section-title">📈 Tableau évolutif (écart ${stepVal}, ${repVal} lignes ajoutées)</div>${table.outerHTML}`;
    }
  }

  html += `<div class="print-footer">Estimation indicative et non contractuelle — EBS Énergie ne saurait être tenue responsable des écarts avec le montant de prime effectivement obtenu, lequel dépend de l'obligé CEE retenu, de l'éligibilité réelle des travaux et de la réglementation en vigueur au moment de l'engagement.</div>`;

  const area = document.getElementById('printArea');
  area.innerHTML = html;
  window.print();
}

