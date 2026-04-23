# Système Audio

## Moteur de Lecture

Utilise @discordjs/voice pour la gestion audio.

- Ressources: Créées à partir de flux HTTP.
- Lecteur: Gère l'état de lecture et les erreurs.
- Connexion: Gère la communication de passerelle vocale.

## Gestion des Flux

- Validation: URLs vérifiées avant la lecture.
- Logique de Nouvelle Tentative: Flux échoués réessayés avec des solutions de repli.
- Durée: Estimée à partir des en-têtes ou du numéro de sourate.

## Données des Récitateurs

- Sources: mp3quran.net et dépôts JSON personnalisés.
- Mise en Cache: Données mises en cache en mémoire et Firebase.
- Solution de Repli: Fichiers locaux utilisés si les sources distantes échouent.

## Système Radio

- Vérification de Santé: Flux surveillés périodiquement.
- Basculement: Commutation automatique vers les flux fonctionnels.
- Pagination: Radios listées en pages de 25.
