# Utilitaires Personnalisés

## Chargeur Envira

Situé dans core/package/Envira/.

- Objectif: Alternative personnalisée à dotenv avec support de chiffrement.
- Fonctionnalités: Analyse les fichiers .env, supporte les valeurs chiffrées, gère plusieurs environnements.

## Alias de Chemin

- Bibliothèque: pathlra-aliaser.
- Usage: Permet des imports comme @logger au lieu de chemins relatifs.
- Configuration: Défini dans package.json sous path*aliaser*.

## Utilitaires Audio

- Logique de Nouvelle Tentative: fetchWithRetry gère l'instabilité du réseau.
- Validation de Flux: Vérifie le type de contenu et le statut avant la lecture.
- Calcul de Durée: Estime la durée audio pour le suivi de progression.

## Nettoyeur de Base de Données

Situé dans core/utils/databaseCleaner.js.

- Fonction: Supprime les données obsolètes pour les guildes où le bot n'est plus.
- Cibles: Guildes de configuration, états de guilde et IDs de contrôle.
