# Améliorations Potentielles

## Mise à l'Échelle

- Base de Données: Migrer de Firebase Realtime Database vers Firestore ou PostgreSQL pour les requêtes complexes.
- Redis: Utiliser Redis pour l'état partagé entre plusieurs instances de bot.

## Sécurité

- Secrets: S'assurer que toutes les clés API sont chiffrées et tournées régulièrement.
- Validation des Entrées: Renforcer la validation sur les entrées de modales et arguments de commandes.
- Limitation de Débit: Implémenter des limites de débit globales plus strictes pour prévenir les bannissements API.

## Optimisation de la Mémoire

- Limites de Cache: Appliquer des limites plus strictes sur les caches d'interactions et d'embeds.
- Gestion des Flux: S'assurer que les ressources audio sont détruites immédiatement après utilisation.
- Écouteurs d'Événements: Auditer les écouteurs d'événements pour prévenir les fuites de mémoire.

## Refactoring de Code

- Injection de Dépendances: Remplacer les variables globales par des dépendances injectées pour une meilleure testabilité.
- TypeScript: Migrer vers TypeScript pour la sécurité des types.
- Tests Unitaires: Ajouter des tests Jest pour les fonctions utilitaires et la logique d'état.
