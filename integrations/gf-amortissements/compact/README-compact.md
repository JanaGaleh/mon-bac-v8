# MonAvenir — Chapitre 2, parcours compact

Version validée : 10 fiches (5 linéaire et 5 unités d’œuvre), 9 exercices (3 faciles, 3 moyens, 3 difficiles ; chaque niveau contient les trois catégories linéaire, UO et comparaison). Les simulateurs, les plans éditables, le journal à cinq colonnes, le bilan et le zoom sont conservés. Les exercices associés aux fiches renvoient au même catalogue de neuf exercices, sans créer de doublons.

`live-ch2.js` est le module révisé ; `compact-edge.mjs` est le Worker complémentaire complet construit à partir de la version active 9820a08d-cddc-424f-a045-b95befeb055e. Les trois autres ressources pédagogiques et les correctifs de visibilité et de mise à jour PWA sont conservés ; seul le chapitre 2 et le suffixe de cache statique sont modifiés. Le Worker primaire, les routes, les données et les autres chapitres restent inchangés.

Tests : `node --test gf-ch2-reduit.test.cjs`, contrôle syntaxique du Worker et contrôle des trois points de livraison ; tests Chromium isolés réussis en 390×850, 768×850 et 1440×850. Progression v2 du chapitre avec nouveaux identifiants : les anciennes données locales v1 ne sont pas supprimées, mais ne sont pas assimilées à des résultats sur les nouveaux exercices.
