// ═══════════════════════════════════════════════════════════════════════
// DONNÉES — CATALOGUE COMPLET DES FICHES CEE
// ═══════════════════════════════════════════════════════════════════════
const FICHES = [
  {
    code:"BAR-TH-171", title:"Pompe à chaleur Air/Eau individuelle", sector:"res", tags:["pac"],
    version:"vA82-5", dv:"17 ans",
    render: renderTH171
  },
  {
    code:"BAR-TH-172", title:"Pompe à chaleur eau/eau individuelle", sector:"res", tags:["pac"],
    version:"vA82-5", dv:"20 ans",
    render: renderTH172
  },
  {
    code:"BAR-TH-129", title:"Pompe à chaleur Air/Air", sector:"res", tags:["pac"],
    version:"vA27-3", dv:"17 ans",
    render: renderTH129
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
    code:"BAT-TH-162", title:"Système géothermique tertiaire", sector:"ter", tags:["geothermie"],
    version:"vA81-2", dv:"25 ans",
    render: renderBAT162
  },
  {
    code:"PAC MIXTE", title:"PAC collective mixte – BAR-TH-179 + BAT-TH-163", sector:["res","ter"], tags:["pac"],
    version:"interne EBS", dv:"22 ans",
    render: renderPACMixte
  },
  {
    code:"BAR-TH-177", title:"Rénovation globale résidentiel collectif", sector:"res", tags:["renov"],
    version:"vA63-1", dv:"30 ans",
    render: renderTH177
  },
  {
    code:"BAR-TH-112", title:"Appareil indépendant de chauffage au bois", sector:"res", tags:["chauffage-bois"],
    version:"vA46-3", dv:"15 ans",
    render: renderTH112
  },
  {
    code:"BAR-TH-113", title:"Chaudière biomasse individuelle", sector:"res", tags:["biomasse"],
    version:"vA79-4", dv:"17 ans",
    render: renderTH113
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
  {
    code:"IND-UT-103", title:"Récupération de chaleur sur compresseur d'air", sector:"indus", tags:["recuperation-chaleur"],
    version:"vA17.2", dv:"13 ans",
    render: renderINDUT103
  },
  {
    code:"IND-UT-141", title:"Chaudière industrielle électrique", sector:"indus", tags:["chaudiere-industrielle"],
    version:"arrêté du 01/09/2026", dv:"22 ans",
    render: renderINDUT141
  },
  {
    code:"IND-UT-116", title:"Haute pression flottante sur groupe de froid", sector:"indus", tags:["froid"],
    version:"vA14.1", dv:"14 ans",
    render: r=>renderHPFlottante(r,"IND-UT-116")
  },
  {
    code:"BAT-TH-134", title:"Haute pression flottante sur groupe de froid tertiaire", sector:"ter", tags:["froid"],
    version:"vA22.1", dv:"14 ans",
    render: r=>renderHPFlottante(r,"BAT-TH-134")
  },
  {
    code:"IND-BA-110", title:"Déstratification d'air en local industriel", sector:"indus", tags:["destratification"],
    version:"vA71-4", dv:"15 ans",
    render: r=>renderDestrat(r,"IND-BA-110")
  },
  {
    code:"BAT-TH-142", title:"Déstratification d'air en local tertiaire", sector:"ter", tags:["destratification"],
    version:"vA71-4", dv:"15 ans",
    render: r=>renderDestrat(r,"BAT-TH-142")
  },
  {
    code:"AGRI-TH-108", title:"Pompe à chaleur air/eau pour serres", sector:"agri", tags:["pac-agriculture"],
    version:"arrêté du 26/10/2026", dv:"17 ans",
    render: renderAGRITH108
  },
  {
    code:"IND-UT-137", title:"Pompe à chaleur en rehausse de température de chaleur fatale", sector:"indus", tags:["pac-rehausse"],
    version:"vA84-3", dv:"14 ans",
    render: renderINDUT137
  },
  {
    code:"AGRI-EQ-111", title:"Simple écran thermique", sector:"agri", tags:["ecran thermique simple"],
    version:"vA62-1", dv:"8 ans",
    render: renderAGRIEQ111
  },
  {
    code:"AGRI-EQ-112", title:"Double paroi gonflable (abrogée au 24/06/2026)", sector:"agri", tags:["double paroi gonflable"],
    version:"vA73-3", dv:"5 ans",
    render: renderAGRIEQ112
  },
  {
    code:"AGRI-TH-118", title:"Double tube de chauffage pour serres maraîchères", sector:"agri", tags:["double tube de chauffage"],
    version:"vA14-1", dv:"15 ans",
    render: renderAGRITH118
  },
  {
    code:"AGRI-EQ-102", title:"Double écran thermique", sector:"agri", tags:["double ecran thermique"],
    version:"vA65-2", dv:"8 ans",
    render: renderAGRIEQ102
  },
  {
    code:"AGRI-EQ-104", title:"Écrans thermiques latéraux", sector:"agri", tags:["ecran thermique lateral"],
    version:"vA62-2", dv:"8 ans",
    render: renderAGRIEQ104
  },
  {
    code:"AGRI-EQ-107", title:"Isolation des parois de serre", sector:"agri", tags:["isolation parois serre"],
    version:"vA38-1", dv:"15 ans",
    render: renderAGRIEQ107
  },
  {
    code:"AGRI-EQ-109", title:"Couverture performante de serre", sector:"agri", tags:["couverture serre"],
    version:"vA58-2", dv:"20 ans",
    render: renderAGRIEQ109
  },
];
