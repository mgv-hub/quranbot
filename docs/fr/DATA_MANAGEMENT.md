# Gestion des Données

## Récupération

Situé dans core/data/.

- Sources: Données récupérées de mp3quran.net, aladhan.com et dépôts JSON personnalisés.
- Méthodes: Utilise node-fetch avec en-têtes personnalisés et délais d'attente.
- Validation: Structures de données validées avant d'être chargées dans l'état global.

## Mise en Cache

- Cache d'Exécution: Données stockées dans des variables globales pour un accès rapide.
- Cache Firebase: Données critiques sauvegardées dans Firebase pour la persistance.
- Cache Local: Fichiers JSON utilisés comme solution de repli si les sources distantes échouent.

## Stockage

- Firebase: Utilisé pour les configurations de guilde, états, IDs de contrôle et webhooks utilisateur.
- Local: Fichiers de sauvegarde compressés et stockés localement avant envoi aux canaux Discord.
- Environnement: Configuration sensible chargée via le chargeur Envira personnalisé.
