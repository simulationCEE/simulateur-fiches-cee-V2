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
  ["type de serre", "Serre maraîchère (légumes, fruits…) ou horticole (fleurs, plantes ornementales) : le montant au m² et le plafond de surface par kW diffèrent."],
  ["surface de serre chauffée", "Surface totale de serre chauffée par la pompe à chaleur. La surface retenue est la plus petite valeur entre cette surface et 15 × P (maraîchère) ou 31 × P (horticole), P étant la puissance thermique nominale en kW."],
  ["puissance thermique nominale de la pac", "Puissance thermique nominale de la pompe à chaleur (somme des PAC en parallèle). Jusqu'à 400 kW, la performance se mesure par l'efficacité énergétique saisonnière ηs ; au-delà, par le COP."],
  ["type de pac", "Basse température : ηs minimal de 126 %. Moyenne ou haute température : ηs minimal de 111 %. Le type de PAC doit figurer sur la preuve de réalisation."],
  ["efficacité énergétique saisonnière", "ηs de la PAC seule pour le chauffage des serres (hors dispositif de régulation), selon le règlement UE 813/2013. Classes de la fiche : de 111 % à moins de 126 %, puis 126 % et plus."],
  ["cop de la pac", "Coefficient de performance mesuré selon la norme EN 14511-2 à une température de 35 °C en sortie de l'échangeur thermique intérieur. Minimum 3,4 ; classes de la fiche : de 3,4 à moins de 4, puis 4 et plus."],
  ["relève d'une chaudière", "Une PAC installée en relève d'une chaudière à haute performance énergétique (la chaudière reste le générateur principal) ne donne pas lieu à la délivrance de certificats."],
  ["source de chaleur récupérée", "Seule la chaleur fatale d'un process industriel du site est éligible (fumées, buées, effluents, eau ou air au condenseur d'un groupe frigorifique…). Sont exclus : le refroidissement d'un process en circuit fermé côté évaporateur d'un groupe frigorifique, les effluents d'un équipement de secours, et les sources qui ne sont pas de la chaleur fatale (géothermie, aérothermie, solaire thermique, cogénération, chaussées thermoactives)."],
  ["fluide en entrée de la pac", "Effluent liquide ou gazeux dont la température est supérieure ou égale à 25 °C pendant au moins 90 jours par an (consécutifs ou non) et dont la température moyenne annuelle est strictement supérieure à 18 °C."],
  ["énergie thermique annuelle fournie", "Q : énergie thermique annuelle fournie sous forme de chaleur en sortie du système de PAC, calculée dans l'étude de dimensionnement à partir de 5 à 10 points de fonctionnement et de leurs durées (au plus 8 760 h/an)."],
  ["énergie électrique annuelle absorbée", "Eélec : somme des énergies électriques annuelles absorbées par le ou les compresseurs et par les auxiliaires (pompes et ventilateurs des évaporateurs et condenseurs, même préexistants), calculée dans l'étude de dimensionnement."],
  ["écart de température", "Écart (en K) entre la température du fluide caloporteur en sortie du condenseur et celle du fluide frigoporteur en sortie de l'évaporateur. Il détermine le COP annuel moyen minimal exigé : plus l'écart est grand, moins le COP exigé est élevé."],
  ["température du fluide en sortie de condenseur", "Le COP annuel moyen minimal exigé n'est pas le même selon que la température en sortie du condenseur est inférieure ou égale à 100 °C, ou supérieure à 100 °C."],
  ["puissance thermique maximale du système", "Puissance thermique « chaud » : puissance thermique maximale nécessaire du système (somme des PAC en parallèle, dernière PAC en série). La fiche est limitée à 5 MW."],
  ["prg du fluide frigorigène", "Potentiel de réchauffement global du ou des fluides frigorigènes utilisés : il doit être strictement inférieur à 150."],
  ["surface chauffée par le système", "Surface des locaux disposant d'émetteurs de chaleur alimentés par la ou les PAC du système géothermique installées au titre de la fiche (m²)."],
  ["usage couvert par la pac", "Chauffage seul, ou chauffage et eau chaude sanitaire (colonne « Chauffage et ECS » du barème ; la PAC est alors réputée d'application moyenne ou haute température). Un système installé uniquement pour l'eau chaude sanitaire ne donne pas lieu à des certificats."],
  ["type de captage et de pac", "Eau/eau : captage sur aquifère superficiel (profondeur inférieure à 200 m), Etas calculé pour une source à +10 / +7 °C. Eau glycolée/eau : sondes géothermiques, source à 0 / −3 °C. Au-delà de 400 kW, le COP minimal est de 4,5 en eau/eau et de 4 en eau glycolée/eau."],
  ["type d'émetteurs", "Plancher, plafond ou mur chauffant et ventilo-convecteurs à eau : application basse température (Etas ≥ 126 %). Autres émetteurs, y compris les solutions mixtes et les radiateurs « basse température » à régime d'eau 45 °C : application moyenne ou haute température (Etas ≥ 111 %)."],
  ["cop mesuré", "Coefficient de performance mesuré selon la norme EN 14511-2 : régime 0/−3 °C et 30/35 °C pour une PAC eau glycolée/eau, régime 10/7 °C et 30/35 °C pour une PAC eau/eau. Minimum 4 (eau glycolée/eau) ou 4,5 (eau/eau) ; classes de la fiche : de 4 à moins de 5, puis 5 et plus."],
  ["puissance utile de la chaufferie", "Somme des puissances thermiques nominales des équipements de chauffage (ou chauffage et ECS) de la chaufferie après travaux, PAC de la fiche incluses, hors équipements de secours. Si les PAC installées représentent moins de 40 % de cette puissance, le facteur R est égal au rapport des deux ; sinon R = 1."],
  ["refroidissement du bâtiment", "Optionnel. Rafraîchissement actif (PAC réversible, thermofrigopompe) : EER ≥ 3,6. Geocooling (rafraîchissement passif) : SEER supérieur à 20 sur sondes, supérieur à 14 sur nappe."],
  ["eer ou seer", "EER : coefficient de performance frigorifique du rafraîchissement actif (minimum 3,6, EN 14511). SEER : coefficient de performance annuel froid du geocooling (supérieur à 20 sur sondes, supérieur à 14 sur nappe)."],
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

