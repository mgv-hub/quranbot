# Flux de Démarrage et d'Initialisation

## Séquence

1. Chargement Env: core/config/envSwitcher.js charge les variables d'environnement.
2. Init Client: core/startup/botSetup.js initialise le client Discord et les variables globales.
3. Chargement Données: core/data/data-manager.js récupère les données Coran et Récitateurs.
4. Connexion: Le bot se connecte à Discord.
5. Événement Ready: core/startup/readyHandler.js se déclenche.
   - Initialiser Firebase.
   - Restaurer les États d'Exécution.
   - Récupérer les Connexions Vocales.
   - Enregistrer les Commandes.
   - Démarrer les Minuteries (Adhkar, Sauvegardes, Stats).

## Tâches Récurrentes

- Sauvegarde État: Toutes les 60 secondes.
- Sauvegarde: Toutes les 5 minutes.
- Santé Radio: Toutes les 30 minutes.
- Nettoyage Mémoire: Toutes les 3 minutes.
- Mise à Jour Stats: Toutes les 10 secondes.
