# Architecture et Structure

## Philosophie de Conception

Le projet suit une architecture monolithique modulaire. La logique est séparée en domaines distincts incluant État, Données, Interactions et Utilitaires pour faciliter la maintenance. Il utilise un alias de chemin personnalisé pour gérer les structures de répertoires profondes.

## Hiérarchie des Dossiers

- core/bot/: Point d'entrée et initialisation du client principal.
- core/startup/: Logique de bootstrap et enregistrement des commandes.
- core/state/: Gestion de l'état et persistance.
- core/interactions/: Gestion des boutons, menus et commandes.
- core/data/: Récupération et mise en cache des données.
- core/utils/: Utilitaires partagés incluant la journalisation et Firebase.
- core/ui/: Constructeurs d'embeds et créateurs de composants.
- core/package/Envira/: Chargeur de variables d'environnement personnalisé.

## Composants Principaux

- Client: Instance Discord.js Client gérée dans core/bot/core.js.
- Gestionnaire d'État: GuildStateManager et PersistentStateManager gèrent l'état d'exécution et de base de données.
- Processeur d'Interactions: Routage de toutes les interactions Discord vers des gestionnaires spécifiques.
- Chargeur de Données: Gère les appels API externes et la mise en cache pour les récitateurs et sourates.

## Interaction des Modules

La séquence de démarrage initialise le client, charge les données, se connecte à Firebase et restaure les états précédents. Les interactions sont routées via un processeur central qui valide les permissions et les délais d'attente avant d'exécuter des gestionnaires spécifiques.
