# Module de fidélisation --- RestoBoost

## 1. Objectifs

Le module de fidélisation de RestoBoost aide les restaurants à
transformer leurs clients occasionnels en clients réguliers grâce à un
programme de points et de récompenses.

Il doit permettre de : - encourager les visites répétées ; - récompenser
les achats ou les visites ; - donner aux clients une vue claire de leurs
points et avantages ; - aider le restaurant à suivre l'utilisation du
programme et ses résultats.

## 2. Parcours et fonctionnalités côté client

### Inscription au programme

-   L'accès au menu numérique reste libre : aucun compte ni
    renseignement personnel n'est requis pour consulter le menu.
-   Pour rejoindre le programme de fidélité, le client fournit un nom ou
    pseudonyme et un numéro de téléphone.
-   Le numéro est normalisé avec l'indicatif du pays. Une vérification
    peut être utilisée pour limiter les inscriptions frauduleuses.
-   Les conditions du programme et l'usage des données doivent être
    expliqués clairement. Le consentement aux messages marketing doit
    être distinct de l'inscription au programme.

### Carte de fidélité numérique

Chaque client dispose d'une carte associée à un restaurant, affichant
notamment : - le nom et le logo du restaurant ; - le nom du client ; -
le solde de points ; - la progression vers la prochaine récompense ; -
un identifiant ou un QR code sécurisé si nécessaire.

### Solde et historique

Le client peut consulter son solde ainsi que l'historique des points
gagnés, dépensés, annulés ou expirés, et les récompenses obtenues.

### Catalogue et échange des récompenses

Le restaurant propose des récompenses avec un coût en points et des
conditions précises. Exemple : une boisson à 10 points, un dessert à 20
points ou un repas à 50 points.

Pour échanger une récompense, le système vérifie le solde et les
conditions, crée un coupon ou code à usage unique, puis permet au
personnel de le valider. Les points sont débités une seule fois et le
coupon ne peut pas être réutilisé.

## 3. Fonctionnalités côté restaurant

### Configuration du programme

Le restaurant peut définir : - le nom du programme ; - le mode de gain
des points ; - le barème d'attribution ; - un éventuel bonus de
bienvenue ; - les récompenses proposées ; - l'activation ou la
suspension du programme.

### Attribution des points

Deux modes principaux sont prévus : - **Selon le montant dépensé** : par
exemple, 1 point pour chaque tranche de 1 000 FCFA d'achat éligible. -
**Selon les visites** : un nombre défini de points est accordé pour une
visite validée.

Les règles doivent préciser le traitement des réductions,
remboursements, articles offerts et montants non éligibles.

### Gestion des récompenses

Le restaurant peut créer et modifier des récompenses, définir leur coût
en points, leur disponibilité, leur période de validité, leurs limites
d'utilisation et leurs conditions.

### Gestion des clients et validation

Le personnel peut rechercher un client par téléphone ou carte,
enregistrer un achat ou une visite, consulter les opérations et valider
une récompense. Chaque opération doit être tracée ; les corrections
doivent être justifiées et réservées aux rôles autorisés.

## 4. Intégration aux autres modules

La fidélisation peut fonctionner avec les autres fonctionnalités de
RestoBoost : - réservations ; - avis clients ; - sondages ; -
promotions.

Par exemple, un restaurant peut proposer une récompense liée à une
campagne ou, si les règles du programme le prévoient, accorder des
points après une action admissible. Ces mécanismes doivent être
explicites et contrôlés afin d'éviter les attributions abusives.

## 5. Règles métier et sécurité

-   Chaque carte et chaque solde sont propres à un restaurant : les
    points ne sont pas transférables entre établissements.
-   Chaque crédit ou débit de points est enregistré dans un historique
    traçable.
-   Une même transaction ne peut pas générer plusieurs fois les mêmes
    points.
-   Une récompense ne peut être échangée que si le solde et les
    conditions sont suffisants.
-   Les coupons sont uniques et à usage unique.
-   Les remboursements et annulations entraînent les ajustements prévus
    par les règles du programme.
-   Les opérations sensibles et les corrections sont réservées aux
    personnes autorisées.
-   La suspension du programme ne supprime pas l'historique des clients.
-   Les règles et conditions doivent être accessibles aux clients. Toute
    modification importante du barème doit être communiquée et tracée ;
    elle ne doit pas servir à retirer arbitrairement des points déjà
    acquis.

## 6. Périmètre recommandé pour la première version (MVP)

La première version doit rester simple et exploitable sans intégration
complexe à une caisse.

### Inclus dans le MVP

-   inscription au programme avec nom et numéro de téléphone ;
-   carte de fidélité numérique ;
-   consultation du solde et de l'historique ;
-   attribution des points selon les achats ou les visites ;
-   configuration du barème par le restaurant ;
-   création et gestion des récompenses ;
-   génération et validation de coupons à usage unique ;
-   interface du personnel pour enregistrer les achats ou visites ;
-   tableau de bord de base sur les membres et l'utilisation des
    récompenses ;
-   journal des opérations et protections contre les doublons.

### À prévoir dans une version ultérieure

-   niveaux de fidélité (Bronze, Argent, Or, VIP) ;
-   parrainage ;
-   expiration avancée des points ;
-   campagnes marketing automatisées et segmentation avancée ;
-   notifications via WhatsApp Business API ;
-   intégrations aux logiciels de caisse ;
-   analyses prédictives du risque d'inactivité.

### Indicateurs de suivi

Le tableau de bord peut afficher le nombre de membres, les membres
actifs, les récompenses émises et utilisées, ainsi que la fréquence de
visite et les achats enregistrés lorsqu'ils sont disponibles.

**Limite importante :** sans intégration à une caisse, les montants
dépensés et la fréquence des visites ne sont fiables que si le personnel
enregistre correctement les transactions. Le tableau de bord doit
distinguer les données réellement mesurées des estimations.
