# Synchronisation et Implémentation Notion (Lê Ci)

L'utilisateur gère ses spécifications, correctifs et évolutions dans son espace Notion dédié :
- Page principale : **Correction Le CI** (ID: `401d39dc-b430-8330-acf3-01b102e63c93`)
- Page projet : **LE CI** (ID: `449d39dc-b430-83e1-8c80-813ea556ed22`)
- Base de données : `404d39dc-b430-809b-8ac1-e49c4693a59e`

### ⚡ DÉCLENCHEUR OBLIGATOIRE : "UPDATE"
À chaque fois que l'utilisateur dit ou écrit **"UPDATE"** (ou toute variante comme "update", "update analyse") :
1. L'assistant DOIT immédiatement exécuter le script de synchronisation Notion (`node scripts/sync-notion.mjs`) pour récupérer en temps réel le contenu du paragraphe **`UPDATE`** de la page **`Correction Le CI`**.
2. Analyser l'ensemble des points listés (nouveaux points ajoutés ou points modifiés).
3. **Implémenter directement** les nouveaux changements et correctifs dans le code source du projet.
4. Compiler/tester avec `npm run build` pour s'assurer qu'il n'y a aucune régression.
5. Présenter un compte-rendu clair et synthétique des points traités à l'utilisateur.
