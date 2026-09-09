// ═══════════════════════════════════════════════════════════════════════
// DONNÉES — CATALOGUE COMPLET DES FICHES CEE
// ═══════════════════════════════════════════════════════════════════════
const FICHES = [
  {
    code:"BAR-TH-171", title:"Pompe à chaleur Air/Eau individuelle", sector:"res", tags:["pac"],
    version:"vA78.4", dv:"17 ans",
    render: renderTH171
  },
  {
    code:"BAR-TH-179", title:"Pompe à chaleur Air/Eau collective", sector:"res", tags:["pac"],
    version:"vA75.1", dv:"22 ans",
    render: renderTH179
  },
  {
    code:"BAT-TH-163", title:"Pompe à chaleur Air/Eau tertiaire", sector:"ter", tags:["pac"],
    version:"vA75.1", dv:"22 ans",
    render: renderBAT163
  },
  {
    code:"BAR-TH-177", title:"Rénovation globale résidentiel collectif", sector:"res", tags:["renov"],
    version:"vA63-1", dv:"30 ans",
    render: renderTH177
  },
  {
    code:"BAR-TH-168", title:"Dispositif solaire thermique", sector:"res", tags:["solaire"],
    version:"vA87.4", dv:"25 ans",
    render: renderTH168
  },
  {
    code:"BAR-EN-101", title:"Isolation combles perdus / rampants", sector:"res", tags:["isol"],
    version:"vA64-6", dv:"30 ans",
    render: r=>renderEN(r,{H1:1700,H2:1400,H3:920},true,"BAR-EN-101")
  },
  {
    code:"BAR-EN-102", title:"Isolation des murs", sector:"res", tags:["isol"],
    version:"vA65-4", dv:"30 ans",
    render: r=>renderEN(r,{H1:1600,H2:1300,H3:880},true,"BAR-EN-102")
  },
  {
    code:"BAR-EN-103", title:"Isolation du plancher bas", sector:"res", tags:["isol"],
    version:"vA64-6", dv:"30 ans",
    render: r=>renderEN(r,{H1:1100,H2:890,H3:590},true,"BAR-EN-103")
  },
  {
    code:"BAT-EN-101", title:"Isolation combles / toitures tertiaire", sector:"ter", tags:["isol"],
    version:"vA64-4", dv:"30 ans",
    render: r=>renderENBat(r,{H1:2600,H2:2100,H3:1400},"BAT-EN-101")
  },
  {
    code:"BAT-EN-102", title:"Isolation des murs tertiaire", sector:"ter", tags:["isol"],
    version:"vA64-3", dv:"30 ans",
    render: renderEN102Bat
  },
  {
    code:"BAT-EN-103", title:"Isolation du plancher bas tertiaire", sector:"ter", tags:["isol"],
    version:"vA64-4", dv:"30 ans",
    render: r=>renderENBat(r,{H1:5200,H2:4200,H3:2800},"BAT-EN-103")
  },
];
