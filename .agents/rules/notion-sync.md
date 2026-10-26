# Synchronisation et Analyse Notion (Lê Ci)

L'utilisateur gère ses spécifications, correctifs et évolutions dans son espace Notion dédié :
- Page principale : **Correction Le CI** (ID: `401d39dc-b430-8330-acf3-01b102e63c93`)
- Page projet : **LE CI** (ID: `449d39dc-b430-83e1-8c80-813ea556ed22`)
- Base de données : `404d39dc-b430-809b-8ac1-e49c4693a59e`

### ⚡ DÉCLENCHEUR OBLIGATOIRE : "update analyse"
À chaque fois que l'utilisateur dit ou écrit **"update analyse"** (ou toute variante similaire) :
1. L'assistant DOIT immédiatement exécuter le script d'extraction Notion (`node scratch/find_update.mjs` ou script équivalent) pour lire le paragraphe **`UPDATE`** le plus récent de la page Notion **`Correction Le CI`**.
2. Analyser les nouveaux points listés sous le paragraphe `UPDATE`.
3. Présenter clairement les points détectés et exécuter les correctifs demandés dans le codebase.
4. Mettre à jour `NOTION_CORRECTIFS.md` avec la date de synchronisation.
