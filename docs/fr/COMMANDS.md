# Système de Commandes

## Commandes Slash

- /control: Affiche le panneau de contrôle principal pour la lecture.
- /setup: Crée la catégorie Coran et les canaux.
- /join: Rejoint le canal vocal configuré.
- /leave: Déconnecte du canal vocal.
- /ping: Affiche la latence du bot et les statistiques.
- /prayer_times: Affiche les heures de prière pour les emplacements sélectionnés.
- /sources: Liste les sources de données utilisées par le bot.
- /guide: Affiche les instructions d'utilisation.

## Niveaux de Permission

- Administrateur: Accès complet à toutes les commandes.
- Utilisateurs Spéciaux: Définis dans les variables d'environnement.
- Tout le Monde: Limité à la navigation de lecture dans des modes spécifiques.

## Délais d'Attente

Les commandes utilisent un système de délai d'attente pour prévenir les abus.

- Délais Utilisateur: Appliqués par utilisateur par commande.
- Délais Serveur: Appliqués par guilde pour les commandes de configuration.
- Délais Globaux: Appliqués pendant les situations de charge élevée.

## Flux d'Exécution

1. Interaction reçue.
2. Vérification des permissions.
3. Vérification du délai d'attente.
4. Exécution de la commande.
5. Mise à jour de l'état.
