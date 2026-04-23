# Meilleures Pratiques et Observations

## Style de Codage

- Modularité: Chaque fonctionnalité est isolée dans son propre fichier.
- Gestion des Erreurs: Blocs try-catch utilisés abondamment autour des opérations asynchrones.
- Nommage: Variables et fonctions utilisent des noms descriptifs.
- Constantes: Valeurs de configuration centralisées dans configConstants.js.

## Gestion des Dépendances

- Discord.js: Version 14 utilisée pour les dernières fonctionnalités.
- Firebase: Utilisé pour les besoins de base de données en temps réel.
- Voix: @discordjs/voice gère les connexions audio.
- Personnalisé: Plusieurs bibliothèques internes (Envira, Path Aliaser) réduisent la dépendance externe.

## Décisions Architecturales

- État Global: Utilisé pour la performance malgré les difficultés de test potentielles.
- Priorité Firebase: La persistance est priorisée sur la vitesse pour les données critiques.
- Récupération en Premier: Le flux de démarrage priorise la restauration des états précédents sur une nouvelle initialisation.
