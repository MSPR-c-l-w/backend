# Guide d'utilisation — HealthAI Coach (application mobile)

**Application :** HealthAI Coach Mobile  
**Plateformes :** iOS, Android, Web (Expo)  
**Référence fonctionnelle :** branche `main` (mai 2026)  
**Évolution documentée sur cette branche :** affichage des **badges** et du **streak** sur le profil (`95-profile-08`)

Ce document décrit **comment utiliser l'application** du point de vue de l'utilisateur final. Il ne couvre pas l'architecture technique ni le développement.

---

## Table des matières

1. [Présentation](#1-présentation)
2. [Démarrer l'application](#2-démarrer-lapplication)
3. [Créer un compte et se connecter](#3-créer-un-compte-et-se-connecter)
4. [Navigation générale](#4-navigation-générale)
5. [Accueil — fil de publications](#5-accueil--fil-de-publications)
6. [Consulter une publication](#6-consulter-une-publication)
7. [Publier du contenu](#7-publier-du-contenu)
8. [Profil utilisateur](#8-profil-utilisateur)
9. [Badges et streak](#9-badges-et-streak)
10. [Réglages et compte](#10-réglages-et-compte)
11. [Mode hors ligne](#11-mode-hors-ligne)
12. [Dépannage (FAQ)](#12-dépannage-faq)

---

## 1. Présentation

HealthAI Coach est une application mobile orientée **bien-être, sport et nutrition**. Elle permet notamment de :

- consulter un **fil unique** de publications de la communauté ;
- **publier** du texte, des photos ou une vidéo ;
- **aimer** et **commenter** les publications ;
- consulter son **profil** (statistiques, niveau, badges, streak) ;
- gérer ses **informations personnelles** et sa **session**.

L'application nécessite une **connexion Internet** pour la plupart des actions (consultation du fil en direct, publication, likes). Un **cache local** permet d'afficher d'anciennes données en cas de coupure réseau (voir §11).

---

## 2. Démarrer l'application

### 2.1 Prérequis

- **Node.js** ≥ 20.19.4 (développement / build local)
- Un **compte utilisateur** créé dans l'application ou fourni par votre organisme
- Pour les tests en local : l'API backend doit être accessible (variable `EXPO_PUBLIC_API_URL`, par défaut `http://localhost:3001`)

### 2.2 Lancement (développement)

```bash
npm install
npm start
```

Puis choisir la plateforme dans le menu Expo :

- **`a`** — Android (émulateur ou appareil)
- **`i`** — iOS (simulateur ou appareil, macOS)
- **`w`** — navigateur Web

### 2.3 Premier écran

Au lancement, l'application vérifie si une **session** est déjà enregistrée sur l'appareil :

| Situation                        | Écran affiché                                |
| -------------------------------- | -------------------------------------------- |
| Session valide                   | Application principale (onglets en bas)      |
| Pas de session / session expirée | Écran **Connexion**                          |
| Vérification en cours            | Indicateur de chargement (quelques secondes) |

---

## 3. Créer un compte et se connecter

### 3.1 Connexion

1. Saisissez votre **adresse e-mail** et votre **mot de passe**.
2. Appuyez sur **Se connecter**.
3. En cas d'erreur, un message rouge s'affiche en haut du formulaire (ex. identifiants incorrects). Appuyez sur **×** pour fermer le message.

**Astuce :** utilisez l'icône en forme d'œil pour afficher ou masquer le mot de passe.

**Lien :** _Pas encore de compte ?_ → **Créer un compte**

### 3.2 Création de compte

1. Depuis l'écran de connexion, appuyez sur **Créer un compte**.
2. Renseignez les champs obligatoires :
   - **Prénom** et **nom**
   - **Adresse e-mail**
   - **Mot de passe** (minimum **12 caractères**)
3. Champs optionnels : date de naissance, genre, taille (cm).
4. Appuyez sur le bouton de validation en bas de l'écran.

Après inscription réussie, vous êtes connecté et redirigé vers l'application principale.

### 3.3 Persistance de session

Tant que vous ne vous **déconnectez** pas, l'application restaure votre session au prochain lancement (tokens sécurisés sur l'appareil). Si le jeton expire, une reconnexion automatique est tentée ; sinon, l'écran de connexion réapparaît.

---

## 4. Navigation générale

Une fois connecté, quatre onglets sont disponibles en bas de l'écran :

| Onglet | Libellé      | Rôle                               |
| ------ | ------------ | ---------------------------------- |
| 🏠     | **Accueil**  | Fil de publications                |
| ➕     | **Publier**  | Créer une nouvelle publication     |
| 👤     | **Profil**   | Votre profil, badges, statistiques |
| ⚙️     | **Réglages** | Prénom, nom, déconnexion           |

```
┌─────────────────────────────────────┐
│         Contenu de l'écran          │
│                                     │
├─────────┬─────────┬─────────┬───────┤
│ Accueil │ Publier │ Profil  │Réglag.│
└─────────┴─────────┴─────────┴───────┘
```

**Depuis le profil :**

- **← Retour** (en haut à gauche) → retour à l'onglet Accueil
- **⚙ Réglages** (en haut à droite) → onglet Réglages

**Depuis le fil :** appuyer sur une carte de publication ouvre le **détail** de la publication (écran plein avec commentaires).

---

## 5. Accueil — fil de publications

### 5.1 En-tête

L'écran d'accueil affiche la marque **HealthAI** et le sous-titre _Flux unique · publications_.

### 5.2 Filtres par catégorie

Sous l'en-tête, des pastilles permettent de filtrer le fil :

| Filtre        | Contenu affiché                   |
| ------------- | --------------------------------- |
| **Tous**      | Toutes les publications           |
| **Workout**   | Publications sport / entraînement |
| **Nutrition** | Publications alimentation         |
| **Bien-être** | Publications bien-être            |

Appuyez sur une pastille pour changer de filtre. Le fil se recharge automatiquement.

### 5.3 Carte d'une publication

Chaque publication affiche notamment :

- le **nom de l'auteur** et éventuellement une **émoji d'humeur** ;
- l'**horodatage** relatif (ex. « il y a 2 h ») ;
- une **pastille de catégorie** (Workout, Nutrition, Bien-être) ;
- le **texte** et, le cas échéant, une **image** ou une **vidéo** ;
- le nombre de **likes** et de **commentaires**.

**Actions sur la carte :**

| Action                  | Gestuelle                                |
| ----------------------- | ---------------------------------------- |
| Ouvrir le détail        | Appuyer sur la carte (hors boutons like) |
| Aimer / retirer le like | Appuyer sur l'icône cœur                 |

### 5.4 Actualiser et charger plus

- **Tirer vers le bas** (pull-to-refresh) sur la liste → actualise le fil.
- **Faire défiler vers le bas** → charge des publications plus anciennes (pagination automatique).

### 5.5 Fil vide

Si aucune publication ne correspond au filtre, le message suivant s'affiche : _Aucune publication pour le moment._

### 5.6 Chargement

Lors du premier chargement, des **cartes squelettes** (placeholders gris) s'affichent brièvement à la place des publications.

---

## 6. Consulter une publication

### 6.1 Accès

Depuis l'accueil, appuyez sur une publication pour ouvrir son **écran de détail**.

### 6.2 Contenu de l'écran

- Publication complète (texte, médias, catégorie, humeur).
- Bouton **like** (synchronisé avec le fil au retour).
- Liste des **commentaires** (réponses imbriquées sous le commentaire parent).

### 6.3 Commenter

1. Saisissez votre texte dans le champ en bas de l'écran.
2. Appuyez sur le bouton d'envoi.

**Répondre à un commentaire :** appuyez sur **Répondre** sous un commentaire ; le champ indique à qui vous répondez. Vous pouvez annuler la réponse avant d'envoyer.

### 6.4 Retour

Utilisez le bouton **retour** du système ou de la navigation pour revenir au fil. Les compteurs de likes et de commentaires sur le fil sont mis à jour.

---

## 7. Publier du contenu

Onglet **Publier** → écran **Nouvelle publication**.

### 7.1 Conditions pour publier

Le bouton **Publier** (en haut à droite) devient actif lorsque **au moins une** des conditions suivantes est remplie :

| Condition     | Détail                                                                     |
| ------------- | -------------------------------------------------------------------------- |
| Texte complet | **Titre** renseigné **et** corps du message renseigné                      |
| Médias seuls  | Au moins **une photo** ou **une vidéo** ajoutée (sans obligation de texte) |

Si le bouton reste grisé, complétez le titre et le texte, ou ajoutez un média.

### 7.2 Champs du formulaire

| Champ                 | Limite / règle                                              |
| --------------------- | ----------------------------------------------------------- |
| **Titre**             | 120 caractères maximum                                      |
| **Mon humeur**        | Choix parmi 6 émojis (💪 😊 🔥 💧 ⭐ 🎯)                    |
| **Corps du message**  | 500 caractères maximum ; barre de progression sous le champ |
| **Catégorie**         | Workout, Nutrition ou Bien-être (une seule)                 |
| **Hashtags suggérés** | Appuyer sur un tag pour l'insérer dans le texte             |
| **Médias**            | Voir §7.3                                                   |

**Hashtags proposés :** #fitness, #running, #nutrition, #meditation, #workout, #health, #wellness, #motivation

### 7.3 Médias

| Type            | Règle                                                                                         |
| --------------- | --------------------------------------------------------------------------------------------- |
| **Photos**      | Jusqu'à **5** images (galerie ou caméra)                                                      |
| **Vidéo**       | **Une** vidéo, durée max. **120 secondes** ; **remplace** les photos déjà sélectionnées       |
| **Aperçu**      | Miniatures avec bouton de suppression par média                                               |
| **Compression** | Les photos peuvent être compressées automatiquement (message de taille affiché si applicable) |

**Boutons :** Galerie · Caméra · Vidéo

### 7.4 Envoi et annulation

1. Appuyez sur **Publier**.
2. Une barre de progression indique l'envoi (**Envoi… X %**).
3. Pour interrompre : **Annuler** pendant l'envoi.
4. En cas d'erreur, un bandeau rouge affiche le message ; corrigez puis réessayez.
5. Après succès, vous êtes redirigé vers l'**Accueil** ; la nouvelle publication apparaît en tête du fil.

**Connexion requise :** si vous n'êtes pas connecté, un message indique que la publication nécessite une session active.

---

## 8. Profil utilisateur

Onglet **Profil**.

### 8.1 Vue d'ensemble

| Zone                              | Description                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| **Photo de couverture**           | Bannière en haut de l'écran                                                                     |
| **Avatar**                        | Photo de profil (stockée localement sur l'appareil si personnalisée) ; pastille **Lv** (niveau) |
| **Nom et @handle**                | Nom d'affichage et identifiant dérivé (ex. `@marie-dupont`)                                     |
| **Bio**                           | Texte de présentation                                                                           |
| **Badges et streak**              | Rangée horizontale sous la bio (voir §9)                                                        |
| **Statistiques sociales**         | Ex. abonnés, abonnements, publications (données d'affichage)                                    |
| **Statistiques détaillées**       | Cartes défilables (activité, calories, etc.)                                                    |
| **Niveau et XP**                  | Barre de progression vers le niveau suivant                                                     |
| **Onglets Publications / J'aime** | Grille de visuels ou message vide                                                               |

### 8.2 Onglet Publications

Grille de **miniatures** des publications (affichage type galerie). Appuyer sur une miniature peut être prévu dans une version ultérieure ; à ce stade, la navigation principale vers le détail se fait depuis le **fil**.

### 8.3 Onglet J'aime

Affiche le message : _Les publications que vous aimez apparaîtront ici._ si la liste est vide.

### 8.4 Données affichées

| Donnée                        | Source                                                                     |
| ----------------------------- | -------------------------------------------------------------------------- |
| Nom sur le profil             | Préférences locales + compte (selon configuration)                         |
| **Badges et streak**          | **API** (`GET /users/{id}/badges`) — voir §9                               |
| Statistiques, XP, grille, bio | Données d'**illustration** (maquette) en attendant branchement API complet |

---

## 9. Badges et streak

> Fonctionnalité livrée sur la branche **`95-profile-08`** — affichage des récompenses et de la régularité.

### 9.1 Où les voir ?

Sur l'écran **Profil**, sous votre bio : une **liste horizontale** (défilement latéral) de pastilles rondes.

### 9.2 Badges

| Élément           | Comportement                                                                         |
| ----------------- | ------------------------------------------------------------------------------------ |
| **Apparence**     | Pastille ronde avec **icône** (symbole Ionicons ou image distante)                   |
| **Affichage**     | Seuls les badges **débloqués** sont visibles                                         |
| **Accessibilité** | Chaque badge possède un libellé vocal (`accessibilityLabel`) correspondant à son nom |
| **Source**        | Synchronisation avec le serveur à l'ouverture du profil                              |

Si vous n'avez aucun badge débloqué, la rangée peut n'afficher que le streak (si applicable) ou rester vide.

### 9.3 Streak (série de jours)

| Élément           | Comportement                                                                                                                |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **Apparence**     | Pastille **orange** avec le texte **`Nj`** (N = nombre de jours)                                                            |
| **Affichage**     | Visible **uniquement** si votre streak est **supérieur à 0 jour**                                                           |
| **Signification** | Nombre de jours consécutifs d'activité enregistrés côté serveur (sport, nutrition, connexion — selon règles métier backend) |

### 9.4 Mise à jour

Les badges et le streak sont **rechargés** lorsque vous ouvrez le profil (ou lorsque votre identifiant utilisateur change). En cas d'erreur réseau, les badges peuvent ne pas s'afficher temporairement sans bloquer le reste du profil.

### 9.5 Schéma visuel

```
  [🏅] [🏅] [🔥 7j]  ← défilement horizontal
   ↑      ↑     ↑
 badge  badge  streak (ex. 7 jours)
```

---

## 10. Réglages et compte

Onglet **Réglages** (ou icône ⚙ depuis le profil).

### 10.1 Informations personnelles

| Action                               | Étapes                                                  |
| ------------------------------------ | ------------------------------------------------------- |
| Modifier le **prénom** ou le **nom** | Saisir les champs → **Enregistrer**                     |
| Validation                           | Lettres, espaces, tirets et apostrophes uniquement      |
| Succès                               | Message vert _Profil mis à jour avec succès._           |
| Erreur                               | Message rouge ; les valeurs précédentes sont restaurées |

Les modifications sont enregistrées sur le **serveur** et reflétées dans votre session.

### 10.2 Bloc API (développement)

Si la variable d'environnement `EXPO_PUBLIC_API_URL` est définie, l'URL de l'API s'affiche à titre informatif (usage marketing / développement).

### 10.3 Déconnexion

1. Appuyez sur **Déconnexion** (bouton rouge en bas).
2. Confirmez dans la fenêtre modale : **Se déconnecter** ou **Annuler**.
3. Vous êtes renvoyé à l'écran de **Connexion** ; la session locale est effacée.

---

## 11. Mode hors ligne

### 11.1 Quand apparaît-il ?

Si le fil ne peut pas être chargé depuis le serveur (pas de réseau, API indisponible), une **bannière ambre** s'affiche sous l'en-tête :

> _Mode hors ligne — données non actualisées_

### 11.2 Comportement

| Situation       | Comportement                                                        |
| --------------- | ------------------------------------------------------------------- |
| Filtre **Tous** | Dernière version **mise en cache** du fil peut s'afficher           |
| Autres filtres  | Pas de cache dédié ; liste possiblement vide                        |
| Actualisation   | Appuyez sur **Réessayer** dans la bannière ou tirez pour rafraîchir |

Les actions **publier**, **liker** et **commenter** nécessitent en général une connexion active.

---

## 12. Dépannage (FAQ)

| Problème                                | Piste de solution                                                           |
| --------------------------------------- | --------------------------------------------------------------------------- |
| Impossible de se connecter              | Vérifiez e-mail/mot de passe ; mot de passe ≥ 12 caractères à l'inscription |
| Message _Session expirée_               | Reconnectez-vous                                                            |
| Le bouton **Publier** reste grisé       | Ajoutez titre + texte, ou au moins un média                                 |
| Texte refusé / trop long                | Corps limité à **500** caractères ; titre à **120**                         |
| Vidéo non acceptée                      | Durée max. **120 s** ; une seule vidéo à la fois                            |
| Publication en erreur                   | Vérifiez la connexion ; réessayez ; restez connecté                         |
| Fil vide alors que le réseau fonctionne | Changez de filtre ; tirez pour actualiser                                   |
| Bannière hors ligne persistante         | **Réessayer** ; vérifier que l'API backend est démarrée                     |
| Badges absents                          | Connexion requise ; le serveur peut ne renvoyer aucun badge débloqué        |
| Streak non visible                      | Normal si streak = **0 jour**                                               |
| Prénom/nom refusés à l'enregistrement   | Utilisez uniquement des lettres (accents autorisés)                         |

### 12.1 Permissions (mobile)

L'application peut demander l'accès à :

- la **galerie photo** et la **caméra** (publication et avatar) ;
- le **microphone** (vidéo, selon plateforme).

Refuser une permission limite la fonction associée ; vous pouvez l'activer dans les réglages système de l'appareil.

### 12.2 Support

Pour un environnement de démonstration MSPR, assurez-vous que :

1. le backend NestJS est démarré ;
2. `EXPO_PUBLIC_API_URL` pointe vers cette API ;
3. vous disposez d'un compte **CLIENT** (ou rôle autorisé) créé côté serveur ou via l'inscription.

---

## Récapitulatif des parcours utilisateur

```
Lancement app
    │
    ▼
Session valide ?
    ├── Non → Connexion / Inscription
    └── Oui ─┐
              ▼
         Onglets principaux
         ┌───────────────────────────────────────┐
         │                                       │
         ▼           ▼           ▼           ▼  │
      Accueil      Publier     Profil      Réglag.
    fil + filtres             badges      prénom/nom
         │                    streak      déconnexion
         ▼
    Détail + commentaires
```

---

_Guide d'utilisation — HealthAI Coach. Basé sur `main` ; section badges/streak alignée sur la branche `95-profile-08`. Mai 2026._
