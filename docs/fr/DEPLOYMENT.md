# Déploiement et Configuration

## Variables d'Environnement

- DISCORD_TOKEN: Jeton d'authentification du bot.
- FIREBASE_CONFIG: Identifiants de base de données.
- SPE_USER_ID: IDs d'utilisateurs développeurs spéciaux.
- NODE_ENV: Mode production ou développement.

## Scripts de Démarrage

- start.bat: Script de démarrage Windows.
- start.sh: Script de démarrage Linux.
- Gestionnaire de Paquets: Utilise pnpm pour la gestion des dépendances.

## Surveillance

- Vérification de Santé: Point de terminaison HTTP pour le statut.
- Journalisation: Basée sur des fichiers avec rotation et archivage.
- Statistiques: Métriques d'utilisation suivies dans Firebase.

## Système de Sauvegarde

- Local: Fichiers JSON compressés stockés localement.
- Distant: Envoyés au canal Discord via webhook.
- Planification: S'exécute toutes les 5 minutes automatiquement.

## Mise à l'Échelle

- Mémoire: Optimisé pour le déploiement d'instance unique.
- Base de Données: Firebase utilisé pour l'état partagé.
