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
  ["mode de fonctionnement", "Organisation horaire du site (1, 2 ou 3 équipes de 8 h, avec ou sans arrêt le week-end) : plus le compresseur tourne longtemps, plus la chaleur récupérée est importante."],
  ["avec échangeur", "Échangeur huile/eau ou air/eau qui transfère la chaleur du compresseur vers un circuit d'eau. Sans échangeur (simple gainage d'air chaud), le calcul se fait sur la puissance électrique du compresseur."],
  ["puissance thermique de l'échangeur", "Puissance figurant sur la plaque signalétique de l'échangeur, à défaut sur la note de dimensionnement de l'installateur ou un document du fabricant. Elle est plafonnée à la puissance électrique du compresseur."],
  ["puissance électrique nominale du compresseur", "Puissance figurant sur la plaque signalétique du compresseur, à défaut sur un document du fabricant. Elle sert de plafond au calcul."],
  ["valorisation de la chaleur", "Usage sur site de la chaleur récupérée : chauffage de locaux / eau chaude sanitaire (forfait selon la zone climatique) ou procédé industriel (forfait identique dans toutes les zones)."],
  ["situation du site", "Remplacement total : toutes les chaudières à combustible du site alimentant le fluide caloporteur sont déposées (hors secours consigné). Site nouveau : aucune chaudière exploitée à l'engagement, ou extension / nouveau besoin de chaleur. L'hybridation n'est pas éligible."],
  ["chaudières à combustible remplacées", "Puissance thermique nominale totale des chaudières gaz, fioul, charbon, coke ou biomasse du site avant travaux. Doit être inférieure à 20 MW et sert de plafond à P en cas de remplacement."],
  ["chaudières électriques installées", "Somme des puissances thermiques nominales des chaudières électriques posées au titre de l'opération (P). Elle détermine le forfait et le coefficient de bonification α."],
  ["chaudières électriques déjà présentes", "Chaudières électriques installées avant l'opération sur le même fluide caloporteur : elles comptent dans le seuil de 20 MW, mais pas dans le calcul des CEE."],
  ["puissance maximale du besoin", "Puissance maximale du besoin de chaleur déterminée au point III de l'étude de dimensionnement. P ne peut pas la dépasser."],
  ["application du groupe de froid", "Usage du froid produit : climatisation de confort (forfait faible), datacenter ou réfrigération / conditionnement d'ambiance hors confort (forfaits élevés). Une seule case possible."],
  ["bâtiment neuf de catégorie ce1", "Catégorie de bâtiment définie par la réglementation thermique (arrêtés du 26/10/2010 et du 28/12/2012). La climatisation de confort y est exclue de la fiche."],
  ["type de condensation", "Atmosphère : condenseur à air (adiabatique ou non), évaporatif, ou condenseur à eau associé à un aéroréfrigérant ou à une tour. Eau seule : condenseur refroidi par l'eau d'une nappe ou d'un cours d'eau."],
  ["puissance électrique nominale du groupe de froid", "Puissance électrique nominale du groupe (mono ou multi-compresseurs) sur sa plaque signalétique, à défaut sur un document du fabricant. Les compresseurs de secours ne sont pas comptés."],
  ["type d'écoulement", "Vertical : l'air chaud est aspiré dans le cinquième supérieur du local et soufflé vers le sol. Horizontal : l'air est aspiré sur toute la hauteur et remis en mouvement horizontalement. Dans les deux cas, vitesse ≤ 0,2 m/s à 1 m du sol."],
  ["chauffage convectif", "Chauffage qui chauffe l'air : aérothermes, centrales de traitement d'air, rooftops, générateurs d'air chaud, ventilo-convecteurs. Somme de leurs puissances nominales pour le local."],
  ["chauffage radiatif", "Chauffage par rayonnement : tubes et panneaux radiants, cassettes, plancher chauffant. Somme de leurs puissances nominales pour le local. Cumulable avec la part convective."],
  ["affectation du local", "Les entrepôts logistiques, réserves, entrepôts et locaux de stockage sont exclus de la fiche, même s'ils sont chauffés."],
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

