# Documentation du Projet QuranBot

## Aperçu

QuranBot est une application Node.js complète conçue pour la plateforme Discord. Son objectif principal est de fournir des services de contenu islamique, y compris la récitation du Coran, la diffusion radio, l'automatisation des Adhkar et les informations sur les heures de prière. Le projet est conçu pour une haute disponibilité, la persistance de l'état et l'évolutivité modulaire.

## Public Cible

- Administrateurs de serveurs Discord recherchant une automatisation de contenu islamique.
- Développeurs intéressés par l'architecture modulaire de bots Discord.
- Utilisateurs finaux ayant besoin de streaming audio fiable et d'utilitaires religieux.

## Fonctionnalités Principales

- Lecture Audio: Streaming de récitations du Coran de plusieurs récitateurs et stations de radio.
- Persistance de l'État: Sauvegarde et restauration des configurations de serveur via Firebase.
- Adhkar Automatisés: Envoi programmé de messages de rappel.
- Heures de Prière: Recherche mondiale des heures de prière avec précision basée sur la localisation.
- Contrôles Admin: Panneau développeur dédié pour la gestion du serveur.
- Systèmes de Récupération: Reconnexion automatique aux canaux vocaux après les redémarrages.

## Installation

1. Clonez le dépôt.
2. Installez les dépendances avec pnpm install.
3. Configurez les variables d'environnement dans .env.
4. Démarrez le bot avec pnpm start.

## Licence

Licence MIT
