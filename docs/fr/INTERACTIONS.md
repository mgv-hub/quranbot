# Gestionnaires d'Interactions

## Processeurs

Situés dans core/interactions/.

- interactionProcessor.js: Routeur principal pour toutes les interactions.
- proc-buttons.js: Route les clics de boutons vers des fichiers de logique spécifiques.
- proc-menus.js: Gère les interactions de menu de sélection.
- proc-modals.js: Traite les soumissions de modales.
- proc-commands.js: Exécute les commandes slash.

## Logique du Système

- État Vocal: Vérifie si le bot est dans un canal vocal avant d'autoriser les commandes de lecture.
- Autorisation: Valide les permissions utilisateur avant d'exécuter des actions sensibles.
- Délais d'Attente: Applique la limitation de débit pour prévenir les abus.
- Gestion des Erreurs: Capture d'erreurs centralisée avec des messages conviviaux.

## Gestionnaires Spécifiques

- Lecture: Play, pause, resume, next, previous.
- Navigation: Pagination pour les listes de Sourates et de Récitateurs.
- Admin: Contrôles réservés aux développeurs pour la gestion et les statistiques du serveur.
- Webhooks: Enregistrement et gestion des services externes webhook Adhkar.
