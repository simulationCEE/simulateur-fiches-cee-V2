// ═══════════════════════════════════════════════════════════════════════
// GÉNÉRATION PDF — jsPDF + autoTable (remplace window.print())
// Élimine l'en-tête/pied de page natif du navigateur (date, URL, n° de
// page) qui apparaissait avec l'ancienne méthode d'impression. Produit un
// vrai fichier .pdf téléchargé directement, avec une mise en page de type
// rapport commercial aux couleurs EBS Énergie.
// ═══════════════════════════════════════════════════════════════════════
const PDF_COLORS = {
  navy: [27,58,92], navyDk: [18,40,63], navyLt: [46,96,150],
  green: [30,107,58], blue: [26,74,122], orange: [217,119,6], red: [179,38,30],
  text: [26,37,48], text2: [91,107,123], text3: [138,151,165], border: [221,227,234],
  zoneH1: [232,81,26], zoneH2: [46,125,50], zoneH3: [21,101,192],
  hlBg: [255,246,221],
};
const PDF_DISCLAIMER = "Estimation indicative et non contractuelle — EBS Énergie ne saurait être tenue responsable des écarts avec le montant de prime effectivement obtenu, lequel dépend de l'obligé CEE retenu, de l'éligibilité réelle des travaux et de la réglementation en vigueur au moment de l'engagement.";

// jsPDF (police standard Helvetica) ne gère pas correctement l'espace insécable
// (séparateur de milliers de toLocaleString('fr-FR')) ni les exposants ² / ³ :
// on les normalise avant tout envoi à jsPDF pour éviter les artefacts d'affichage.
function pdfSafe(str){
  return String(str==null?'':str)
    .replace(/[\u00A0\u202F]/g, ' ')
    .replace(/²/g, '2')
    .replace(/³/g, '3')
    .replace(/≥/g, '>=')
    .replace(/≤/g, '<=')
    .replace(/[\u{1F000}-\u{1FFFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}\uFE0F\u2705\u2714\u2716]/gu, '')
    .replace(/^\s+/, '');
}

function getJsPDFCtor(){
  return (window.jspdf && window.jspdf.jsPDF) || window.jsPDF;
}

function pdfInstallerName(){
  return (window.EBS_INSTALLER_CONFIG && window.EBS_INSTALLER_CONFIG.installerName) || null;
}

// ── En-tête de page (bandeau EBS Énergie + fiche + éventuel nom installateur) ──
function drawPdfHeader(doc, ficheLabel){
  const pageWidth = doc.internal.pageSize.getWidth();
  const installerName = pdfInstallerName();

  doc.setFillColor(...PDF_COLORS.navy);
  doc.rect(0, 0, pageWidth, 18, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(14);
  doc.text('EBS ÉNERGIE', 14, 11.5);
  doc.setFont('helvetica','normal');
  doc.setFontSize(8.5);
  const dateStr = 'Généré le ' + new Date().toLocaleDateString('fr-FR') + ' à ' + new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
  doc.text(pdfSafe(dateStr), pageWidth-14, 11.5, {align:'right'});

  let y = 18;
  if(installerName){
    doc.setFillColor(233,244,236);
    doc.rect(0, y, pageWidth, 7, 'F');
    doc.setTextColor(...PDF_COLORS.green);
    doc.setFont('helvetica','bold');
    doc.setFontSize(9);
    doc.text(pdfSafe('Document généré pour : ' + installerName), 14, y+4.8);
    y += 7;
  }

  y += 8;
  doc.setTextColor(...PDF_COLORS.navyDk);
  doc.setFont('helvetica','bold');
  doc.setFontSize(12.5);
  doc.text(pdfSafe(ficheLabel), 14, y);
  y += 5;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.line(14, y, pageWidth-14, y);
  return y + 6;
}

function drawPdfSectionBand(doc, text, y){
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setFillColor(...PDF_COLORS.navyLt);
  doc.rect(14, y, pageWidth-28, 6.5, 'F');
  doc.setTextColor(255,255,255);
  doc.setFont('helvetica','bold');
  doc.setFontSize(9);
  doc.text(pdfSafe(text.toUpperCase()), 17, y+4.5);
  return y + 6.5 + 3;
}

// ── Pied de page (disclaimer + pagination) appliqué sur toutes les pages ──
function drawPdfFooters(doc){
  const pageCount = doc.internal.getNumberOfPages();
  for(let i=1; i<=pageCount; i++){
    doc.setPage(i);
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.25);
    doc.line(14, pageHeight-14, pageWidth-14, pageHeight-14);
    doc.setFont('helvetica','italic');
    doc.setFontSize(6.8);
    doc.setTextColor(...PDF_COLORS.text3);
    const wrapped = doc.splitTextToSize(PDF_DISCLAIMER, pageWidth-28-38);
    doc.text(wrapped, 14, pageHeight-10.5);
    doc.setFont('helvetica','normal');
    doc.setFontSize(8);
    doc.text(`Page ${i} / ${pageCount}`, pageWidth-14, pageHeight-10.5, {align:'right'});
  }
}

// ── Table de paramètres/résultats (2 colonnes label/valeur) ──
function addPdfKeyValueTable(doc, rows, startY, opts){
  opts = opts || {};
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.autoTable({
    startY,
    margin: {left:14, right:14},
    theme: 'plain',
    styles: {fontSize:9.5, cellPadding:{top:1.8,bottom:1.8,left:2,right:2}, textColor:PDF_COLORS.text},
    columnStyles: {0:{textColor:PDF_COLORS.text2, cellWidth: (pageWidth-28)*0.52}, 1:{fontStyle:'bold', halign:'right'}},
    body: rows.map(r=>[pdfSafe(r[0]), pdfSafe(r[1])]),
    didParseCell: function(data){
      if(data.column.index!==1) return;
      const raw = rows[data.row.index];
      if(opts.results && raw[2]){
        data.cell.styles.fontSize = 12;
        data.cell.styles.textColor = PDF_COLORS.green;
      }
    },
    didDrawCell: function(data){
      if(data.column.index!==0) return;
      if(data.row.index === rows.length-1) return;
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setLineWidth(0.15);
      doc.line(14, data.cell.y+data.cell.height, pageWidth-14, data.cell.y+data.cell.height);
    },
  });
  return doc.lastAutoTable.finalY + 8;
}

// Extrait le texte d'une cellule en respectant les <br> comme retours à la ligne
// (autoTable affiche un '\n' réel comme une nouvelle ligne dans la cellule).
function pdfCellText(el){
  const clone = el.cloneNode(true);
  clone.querySelectorAll('br').forEach(br=>br.replaceWith('\n'));
  return pdfSafe(clone.textContent.split('\n').map(s=>s.replace(/\s+/g,' ').trim()).join('\n').trim());
}

// ── Conversion d'un <table class="bareme"|"surftbl"> du DOM en autoTable ──
function pdfParseHtmlTable(tableEl){
  const theadRows = [...tableEl.querySelectorAll('thead tr')];
  const headRow = theadRows[theadRows.length-1]; // ignore une éventuelle ligne de titre en colspan
  const head = [[...headRow.querySelectorAll('th')].map(th=>pdfCellText(th))];

  const body = [];
  const rowMeta = [];
  [...tableEl.querySelectorAll('tbody tr')].forEach(tr=>{
    const cells = [...tr.children].map(td=>{
      const cell = {content: pdfCellText(td)};
      const rs = parseInt(td.getAttribute('rowspan')||'1',10);
      if(rs>1) cell.rowSpan = rs;
      if(td.classList.contains('zone-cell')){
        cell._zone = ['z-h1','z-h2','z-h3'].find(c=>td.classList.contains(c));
      }
      if(td.classList.contains('num-c')) cell._color = 'c';
      if(td.classList.contains('num-p')) cell._color = 'p';
      if(td.classList.contains('num-cdp')) cell._color = 'cdp';
      return cell;
    });
    body.push(cells);
    rowMeta.push({grpEnd: tr.classList.contains('grp-end'), hl: tr.classList.contains('hl')});
  });
  return {head, body, rowMeta};
}

function addPdfHtmlTable(doc, tableEl, startY){
  const {head, body, rowMeta} = pdfParseHtmlTable(tableEl);
  const zoneColors = {'z-h1':PDF_COLORS.zoneH1, 'z-h2':PDF_COLORS.zoneH2, 'z-h3':PDF_COLORS.zoneH3};
  const numColors = {c:PDF_COLORS.green, p:PDF_COLORS.blue, cdp:PDF_COLORS.orange};

  doc.autoTable({
    startY,
    margin: {left:10, right:10},
    head, body,
    theme: 'grid',
    styles: {fontSize:8, cellPadding:1.5, halign:'center', valign:'middle', lineColor:PDF_COLORS.border, lineWidth:0.15, textColor:PDF_COLORS.text},
    headStyles: {fillColor:PDF_COLORS.navy, textColor:255, fontStyle:'bold', fontSize:7.5},
    didParseCell: function(data){
      if(data.section!=='body') return;
      const raw = data.cell.raw;
      if(raw && typeof raw==='object'){
        if(raw._zone){
          data.cell.styles.fillColor = zoneColors[raw._zone];
          data.cell.styles.textColor = [255,255,255];
          data.cell.styles.fontStyle = 'bold';
        }
        if(raw._color){
          data.cell.styles.textColor = numColors[raw._color];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      const meta = rowMeta[data.row.index];
      if(meta && meta.hl && !(raw && raw._zone)){
        data.cell.styles.fillColor = PDF_COLORS.hlBg;
      }
    },
    didDrawCell: function(data){
      if(data.section!=='body') return;
      const meta = rowMeta[data.row.index];
      if(meta && meta.grpEnd){
        doc.setDrawColor(...PDF_COLORS.navyDk);
        doc.setLineWidth(0.6);
        doc.line(data.cell.x, data.cell.y+data.cell.height, data.cell.x+data.cell.width, data.cell.y+data.cell.height);
        doc.setLineWidth(0.15);
      }
    },
  });
  return doc.lastAutoTable.finalY + 8;
}

function pdfFilename(code, suffix){
  const clean = code.replace(/[^A-Za-z0-9-]+/g,'-');
  const date = new Date().toISOString().slice(0,10);
  return `EBS-Energie_${clean}${suffix?'_'+suffix:''}_${date}.pdf`;
}

// ── Cahier des charges / checklist (texte structuré, pas un tableau) ──
function downloadChecklistPDF(title, containerEl){
  const JsPDF = getJsPDFCtor();
  if(!JsPDF){ alert("La génération PDF n'a pas pu se charger (bibliothèque indisponible). Vérifiez votre connexion et réessayez."); return; }
  const doc = new JsPDF({orientation:'portrait', unit:'mm', format:'a4'});
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - 28;
  let y = drawPdfHeader(doc, title);

  function ensureRoom(needed){
    if(y + needed > pageHeight - 20){
      doc.addPage(undefined, 'portrait');
      y = drawPdfHeader(doc, title);
    }
  }

  [...containerEl.children].forEach(el=>{
    const text = pdfSafe(el.textContent.replace(/\s+/g,' ').trim());
    if(!text) return;
    if(el.classList.contains('checklist-cat')){
      ensureRoom(10);
      y += 3;
      doc.setFillColor(...PDF_COLORS.navyLt);
      doc.rect(14, y, contentWidth, 6, 'F');
      doc.setTextColor(255,255,255);
      doc.setFont('helvetica','bold');
      doc.setFontSize(8.5);
      doc.text(text, 17, y+4.2);
      y += 6 + 3;
    } else if(el.classList.contains('checklist-item')){
      const clean = text.replace(/^☐\s*/,'');
      doc.setFont('helvetica','normal');
      doc.setFontSize(8.5);
      const wrapped = doc.splitTextToSize(clean, contentWidth-6);
      ensureRoom(wrapped.length*4.2+1.5);
      doc.setDrawColor(...PDF_COLORS.text2);
      doc.setLineWidth(0.25);
      doc.rect(14, y-2.8, 2.6, 2.6);
      doc.setTextColor(...PDF_COLORS.text);
      doc.text(wrapped, 19, y);
      y += wrapped.length*4.2 + 1.5;
    } else if(el.classList.contains('checklist-refused')){
      doc.setFont('helvetica','bold');
      doc.setFontSize(8);
      const wrapped = doc.splitTextToSize(text, contentWidth-6);
      ensureRoom(wrapped.length*4+1.5);
      doc.setTextColor(...PDF_COLORS.red);
      doc.text(wrapped, 17, y);
      y += wrapped.length*4 + 1.5;
    } else {
      doc.setFont('helvetica','italic');
      doc.setFontSize(7);
      const wrapped = doc.splitTextToSize(text, contentWidth);
      ensureRoom(wrapped.length*3.6+4);
      doc.setTextColor(...PDF_COLORS.text3);
      y += 2;
      doc.text(wrapped, 14, y);
      y += wrapped.length*3.6 + 2;
    }
  });

  drawPdfFooters(doc);
  doc.save(pdfFilename(title.split(' ')[0]||'Checklist', 'pieces-a-fournir'));
}

// ═══════════════════════════════════════════════════════════════════════
// TÉLÉCHARGEMENT — simulation / barème / tableau évolutif / tout
// ═══════════════════════════════════════════════════════════════════════
function downloadSimPDF(opt){
  const s = captureSnapshot();
  const JsPDF = getJsPDFCtor();
  if(!JsPDF){ alert("La génération PDF n'a pas pu se charger (bibliothèque indisponible). Vérifiez votre connexion et réessayez."); return; }

  const needsWideTable = (opt==='bareme' || opt==='all') && simBody.querySelector('#baremeWrap table.bareme')
    || (opt==='adj' && simBody.querySelector('#adjTableWrap table.surftbl'));
  const doc = new JsPDF({orientation: needsWideTable ? 'landscape' : 'portrait', unit:'mm', format:'a4'});

  let y = drawPdfHeader(doc, `${s.code} — ${s.title}`);
  y = drawPdfSectionBand(doc, 'Paramètres du projet saisis', y);
  y = addPdfKeyValueTable(doc, s.params, y);
  y = drawPdfSectionBand(doc, 'Résultats de la simulation', y);
  y = addPdfKeyValueTable(doc, s.results, y, {results:true});

  if(opt === 'bareme' || opt === 'all'){
    const wrap = simBody.querySelector('#baremeWrap');
    if(wrap){
      wrap.forceBuild();
      const table = wrap.querySelector('table.bareme');
      if(table){
        doc.addPage(undefined, 'landscape');
        y = drawPdfHeader(doc, `${s.code} — ${s.title}`);
        y = drawPdfSectionBand(doc, 'Barème complet', y);
        y = addPdfHtmlTable(doc, table, y);
      }
    }
  }
  if(opt === 'adj' || opt === 'all'){
    const adjWrapEl = simBody.querySelector('#adjTableWrap');
    if(adjWrapEl){
      const table = adjWrapEl.querySelector('table.surftbl');
      if(table){
        const stepEl = document.getElementById('adjStep');
        const repEl = document.getElementById('adjRep');
        doc.addPage(undefined, 'landscape');
        y = drawPdfHeader(doc, `${s.code} — ${s.title}`);
        y = drawPdfSectionBand(doc, `Tableau évolutif (écart ${stepEl?stepEl.value:''}, ${repEl?repEl.value:''} lignes ajoutées)`, y);
        y = addPdfHtmlTable(doc, table, y);
      }
    }
  }

  drawPdfFooters(doc);
  doc.save(pdfFilename(s.code, opt==='sim'?'':opt));
}

// ── Panier comparatif : une fiche par page ──
function printDocument(snapshots){
  const JsPDF = getJsPDFCtor();
  if(!JsPDF){ alert("La génération PDF n'a pas pu se charger (bibliothèque indisponible). Vérifiez votre connexion et réessayez."); return; }
  const doc = new JsPDF({orientation:'portrait', unit:'mm', format:'a4'});

  snapshots.forEach((s, i)=>{
    if(i>0) doc.addPage(undefined, 'portrait');
    let y = drawPdfHeader(doc, `${s.code} — ${s.title}`);
    y = drawPdfSectionBand(doc, 'Paramètres du projet saisis', y);
    y = addPdfKeyValueTable(doc, s.params, y);
    y = drawPdfSectionBand(doc, 'Résultats de la simulation', y);
    y = addPdfKeyValueTable(doc, s.results, y, {results:true});
  });

  drawPdfFooters(doc);
  doc.save(pdfFilename('Comparatif', snapshots.length+'-fiches'));
}
