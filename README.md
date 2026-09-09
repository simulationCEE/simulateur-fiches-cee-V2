# Simulateur CEE EBS Énergie — V2

Migration structurelle de `simulateur-cee (13).html` sans refonte métier.

- CSS extrait de l'HTML.
- JavaScript découpé par responsabilité et par fiche.
- Scripts chargés en mode classique afin de conserver les fonctions globales existantes et les `onclick` présents dans l'interface.
- Calculs, valeurs, textes, IDs, classes et règles métier conservés à l'identique.
- Le rendu initial de la grille et du panier est simplement exécuté en dernier, une fois tous les modules chargés.

## Structure
```text
simulateur-cee-v2/
├── index.html
├── css/
│   └── style.css
└── js/
    ├── app.js
    ├── core/
    │   ├── formatters.js
    │   └── default-prices.js
    ├── data/
    │   ├── fiches.js
    │   └── sources.js
    ├── components/
    │   ├── bareme.js
    │   ├── adjustable-table.js
    │   ├── reverse-solver.js
    │   ├── tooltips.js
    │   ├── regulatory-check.js
    │   └── checklist-168.js
    ├── simulator/
    │   ├── grid.js
    │   ├── overlay.js
    │   └── sources.js
    ├── compare/
    │   └── cart.js
    ├── pdf/
    │   └── pdf.js
    └── fiches/
        ├── bar-th-171.js
        ├── bar-th-179.js
        ├── bat-th-163.js
        ├── bar-th-177.js
        ├── bar-th-168.js
        └── isolation.js
```

Source de référence : `simulateur-cee (13).html`.
