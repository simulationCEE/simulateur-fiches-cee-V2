// ═══════════════════════════════════════════════════════════════════════
// GLOSSAIRE — info-bulles pédagogiques sur les champs techniques
// ═══════════════════════════════════════════════════════════════════════
const GLOSSARY = [
  ["profil du ménage", "Catégorie de revenus du bénéficiaire (très modeste, modeste, ou autre) : elle détermine le coefficient de bonification et le tarif CEE applicable."],
  ["ménages précaires", "Nombre de logements occupés par des ménages aux ressources modestes ou très modestes, éligibles au tarif Précarité."],
  ["prix précarité", "Tarif CEE plus élevé, réservé aux ménages aux revenus modestes ou très modestes selon les plafonds ANAH."],
  ["prix classique", "Tarif CEE standard, applicable aux ménages ne relevant pas de la précarité énergétique."],
  ["coup de pouce", "Dispositif qui multiplie la prime CEE lorsque les travaux remplacent un chauffage fossile (charbon, fioul, gaz) par un équipement performant."],
  ["etas", "Efficacité énergétique saisonnière de la pompe à chaleur (règlement UE 813/2013). Plus elle est élevée, plus le forfait CEE est important."],
  ["secteur d'activité", "Coefficient qui ajuste le forfait CEE selon l'usage du bâtiment tertiaire (bureaux, santé, commerces...), car leurs besoins de chauffage diffèrent."],
  ["zone climatique", "Zone ADEME définie selon la rigueur du climat (H1 = le plus froid, H3 = le plus doux). Elle détermine le forfait de kWh cumac applicable."],
  ["cep initial", "Consommation conventionnelle en énergie primaire du bâtiment avant travaux, exprimée en kWh par m² et par an."],
  ["cep projet", "Consommation conventionnelle en énergie primaire du bâtiment après travaux, exprimée en kWh par m² et par an."],
  ["puissance pac", "Somme des puissances nominales des pompes à chaleur installées, utilisée pour calculer le facteur R."],
  ["puissance chaufferie", "Puissance totale utile de la chaufferie après travaux, hors équipements de secours."],
  ["énergie de chauffage", "Type d'énergie utilisée par le système de chauffage (électricité ou combustible), qui détermine le forfait applicable."],
  ["type de logement", "Maison individuelle ou appartement : la surface de référence et le forfait CEE diffèrent selon le type de logement."],
  ["usage", "Indique si l'équipement couvre uniquement le chauffage, ou le chauffage et l'eau chaude sanitaire (ECS) — les forfaits diffèrent selon l'usage."],
];
function addTooltips(container){
  container.querySelectorAll('.field label').forEach(label=>{
    const text = label.textContent.toLowerCase();
    const match = GLOSSARY.find(([key]) => text.includes(key));
    if(match && !label.querySelector('.info-icon')){
      label.insertAdjacentHTML('beforeend', `<span class="info-icon">i<span class="tip">${match[1]}</span></span>`);
    }
  });
}

