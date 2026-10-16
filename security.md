# Audit de sécurité : automatisation SaasResto

Périmètre : système MacroDroid qui intercepte les SMS de confirmation de paiement Mobile Money et envoie un webhook (HTTP POST) vers la plateforme SaasResto pour valider les commandes.

Source : rapport d'audit initial, complété par une analyse de type test d'intrusion.

---

## 1. Constat initial (rapport d'audit)

- **Déclencheur universel :** la macro réagit à « Tout Numéro ». N'importe qui connaissant le numéro peut déclencher l'action.
- **Aucun filtrage du contenu :** un SMS « Bonjour » valide une commande comme un vrai reçu.
- **Fuite de données :** tous les SMS reçus (OTP, messages personnels) sont transmis au serveur.
- **Déni de service :** un « SMS bombing » force des requêtes continues et épuise le téléphone et le serveur.

### Sender ID et encodage T9

Les opérateurs utilisent un Sender ID alphanumérique (ex. `OrangeMoney`). Sur les applications miroirs PC (« Mobile connecté »), il peut s'afficher en chiffres : `67264366639` correspond à `ORANGEMONEY` sur un clavier T9. MacroDroid lit l'identifiant texte, donc la macro doit cibler `OrangeMoney` exactement, pas les chiffres.

---

## 2. Spoofing de SMS

Le filtrage par expéditeur est nécessaire mais insuffisant.

- Un Sender ID alphanumérique n'est qu'une étiquette déclarée par l'émetteur. Certains services d'envoi en masse permettent de mettre `OrangeMoney` comme nom d'expéditeur.
- Selon les téléphones, le faux message peut s'afficher dans la même conversation que les vrais SMS de l'opérateur.
- La protection dépend de la réglementation et des opérateurs ; l'enregistrement des Sender ID est faible ou inexistant sur beaucoup de marchés.
- Un fraudeur qui connaît le format d'un vrai reçu (mots-clés, « FCFA », structure de l'ID) passe le filtre d'expéditeur et le filtre de contenu.

**Conclusion :** le SMS ne prouve pas que l'argent est arrivé, il prouve seulement qu'un texte est arrivé. Il ne doit servir que de déclencheur, jamais de preuve de paiement.

---

## 3. Vulnérabilités (test d'intrusion)

### Critique

| # | Faille | Parade |
|---|--------|--------|
| 1 | **Webhook sans authentification.** L'attaquant peut appeler l'URL directement et marquer ses commandes payées, sans SMS. | Signature HMAC du corps de la requête avec un secret partagé, plus timestamp et nonce, le tout en HTTPS. |
| 2 | **Confiance dans le SMS.** Sender ID usurpable, format de reçu imitable. | Le serveur vérifie la transaction auprès de l'opérateur, ou à défaut la réconcilie avec l'historique du compte marchand. |
| 3 | **Rejeu.** Le même SMS ou le même ID de transaction peut valider plusieurs commandes. | Contrainte `UNIQUE` sur l'ID de transaction en base, requêtes idempotentes. |
| 4 | **Montant et commande non liés.** 500 FCFA peuvent valider une commande de 15 000. | Montant exact attendu, référence unique par commande, fenêtre de validité courte. |

### Élevé

| # | Faille | Parade |
|---|--------|--------|
| 5 | **Fuite de données.** OTP et SMS personnels envoyés au serveur. | N'envoyer que les champs extraits (ID, montant), jamais le SMS brut. Utiliser une SIM et un téléphone dédiés. |
| 6 | **Téléphone = point unique de compromission** (vol, root, économiseur de batterie, miroir PC qui expose les SMS). | Téléphone dédié, verrouillé et chiffré, sans miroir PC, 2FA sur le compte Google, exclusion de l'optimisation batterie. |
| 7 | **Secret en clair dans la macro.** Un export ou une sauvegarde le divulgue. | Secret rotatif, révocable et propre à chaque restaurant. |
| 8 | **Race condition.** Deux requêtes simultanées consomment la même transaction. | Transaction SQL avec verrou (`SELECT ... FOR UPDATE`). |

### Moyen

| # | Faille | Parade |
|---|--------|--------|
| 9 | **Texte du SMS non fiable.** Risque d'injection SQL côté PHP ou de XSS dans le tableau de bord. | Requêtes préparées, échappement à l'affichage, validation stricte du format. |
| 10 | **Isolation multi-tenant.** Un restaurant pourrait valider les commandes d'un autre (IDOR). | Un secret et un identifiant par tenant, vérification systématique de l'appartenance. |
| 11 | **DoS.** SMS bombing et appels directs saturent le service. | Rate limiting par IP et par tenant, file d'attente. |
| 12 | **Pas de détection.** | Journal d'audit et alertes sur les anomalies (rafale de requêtes, ID dupliqués, montants incohérents). |

---

## 4. Recommandations détaillées

### A. Filtrage strict côté MacroDroid

- Restreindre l'expéditeur à `OrangeMoney` exactement.
- Exiger par regex ou correspondance exacte des mots-clés de transaction (ex. « Vous avez recu », « FCFA », format d'ID de transaction) avant de déclencher la requête.
- Les SMS promotionnels du même opérateur ne doivent pas déclencher le webhook.

### B. Validation côté serveur

- Transmettre uniquement l'ID de référence et le montant extraits du SMS.
- Le serveur interroge l'API de l'opérateur pour vérifier que la transaction existe, correspond au montant attendu et n'a pas déjà été consommée, avant de marquer la commande comme payée.
- **Sans accès à l'API opérateur :**
  - référence ou montant unique par commande, vérifié à la réception ;
  - rejet des IDs de transaction déjà utilisés ;
  - comparaison avec le solde réel ou l'historique du compte marchand ;
  - validation manuelle au-delà d'un certain montant.

### C. Protection du webhook

- HTTPS obligatoire.
- Signature HMAC (secret partagé), timestamp et nonce pour empêcher le rejeu.
- Un secret par tenant, révocable.

---

## 5. Ordre de correction conseillé

1. HMAC, unicité de l'ID de transaction et montant lié à la commande (failles 1, 3, 4).
2. Filtre d'expéditeur et de contenu, puis n'envoyer que les champs extraits (faille 5).
3. Statut intermédiaire « paiement à vérifier » avant « payé », avec validation manuelle au-delà d'un seuil.
4. Vérification auprès de l'opérateur, dès que l'accès à l'API est possible (faille 2).

---

## 6. Limites de cet audit

Cet audit se base uniquement sur le rapport. Il n'a pas porté sur le code de l'endpoint du webhook ni sur son traitement côté serveur. Pour aller plus loin, il faut examiner ce code.
