# Gestion de l'État

## État de la Guilde

Chaque guilde a un objet d'état d'exécution stocké en mémoire.

- Connexion: Objet de connexion vocale.
- Lecture: Sourate actuelle, récitateurs et mode.
- Minuteries: Minuteries Adhkar et d'inactivité.
- Configuration: Mode de contrôle et IDs de canal.

## État Persistant

L'état est synchronisé avec Firebase Realtime Database.

- Récupération: Les états sont restaurés au redémarrage du bot.
- Sauvegarde: Sauvegardes automatiques toutes les 5 minutes.
- Nettoyage: Données obsolètes supprimées pour les guildes quittées.

## Restauration de l'État

1. Charger les états depuis Firebase.
2. Valider l'existence du canal.
3. Reconnecter les canaux vocaux.
4. Reprendre la lecture si applicable.

## Gestion de la Mémoire

- Garbage collection déclenché sur utilisation élevée de mémoire.
- Cache d'interactions effacé périodiquement.
- Connexions détruites nettoyées automatiquement.
