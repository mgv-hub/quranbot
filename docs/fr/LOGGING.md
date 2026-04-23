# Journalisation et Surveillance

## Stratégie

- File d'Attente Asynchrone: Empêche le blocage I/O pendant le trafic élevé.
- Archivage: Anciens journaux compressés et stockés dans storage/logs/archive.
- Nettoyage: Journaux de plus de 60 jours automatiquement supprimés.
- Suivi des Erreurs: Exceptions non capturées et rejets de promesse journalisés avec traces de pile.

## Surveillance

- Vérification de Santé: Serveur HTTP expose les points de terminaison /health et /radio-health.
- Gestion de la Mémoire: Vérifications périodiques déclenchent le garbage collection si l'utilisation de mémoire dépasse les seuils.
- Statistiques: Statistiques d'utilisation du bot (serveurs, commandes, adhkar) suivies et sauvegardées dans Firebase.

## Niveaux de Journal

- debug: Informations internes détaillées.
- info: Messages opérationnels généraux.
- warn: Problèmes potentiels.
- error: Défaillances critiques.
- fatal: Erreurs arrêtant le système.
