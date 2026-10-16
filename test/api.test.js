import http from 'http';
import { app, server } from '../server/index.js';
import db, { run } from '../server/db.js';

async function runTests() {
  console.log('🧪 Démarrage des tests de validation automatique pour Les Douceurs de Lê Ci...\n');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  const PORT = 3099;
  const BASE_URL = `http://localhost:${PORT}`;
  await new Promise((resolve) => server.listen(PORT, resolve));

  try {
    await db.initDb();
    await run("DELETE FROM orders WHERE customer_name LIKE '%Test%'");

    // 1. Création Commande
    const order = await db.createOrder({
      customerName: 'Amina Test',
      customerPhone: '70112233',
      montantTotal: 75,
      items: [{ name: 'Fraisier Premium', price: 75, quantity: 1 }]
    });

    assert(order && order.id.startsWith('CMD-'), 'Création commande avec ID unique');
    assert(order.codeReference && order.codeReference.length === 4, `Génération code référence unique (${order.codeReference})`);
    assert(order.statut === 'EN_ATTENTE_DE_PAIEMENT', 'Statut initial EN_ATTENTE_DE_PAIEMENT');

    // 2. Sécurité Webhook (Rejet sans secret)
    const rejRes = await fetch(`${BASE_URL}/api/webhooks/orange-money`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Vous avez recu 75 FCFA' })
    });
    assert(rejRes.status === 401, 'Sécurité Webhook : rejet 401 si secret manquant');

    // 3. Validation Niveau 1 (Code Référence Marchand)
    const match1Res = await fetch(`${BASE_URL}/api/webhooks/orange-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'resto_secret_2026'
      },
      body: JSON.stringify({
        message: `Paiement marchand de 75 FCFA recu de 70998877 ref ${order.codeReference} Trans ID: OM-TEST-001.`
      })
    });
    const match1Data = await match1Res.json();
    assert(match1Data.matched === true, 'Validation Niveau 1 : Rapprochement réussi via Code Référence');
    assert(match1Data.order && match1Data.order.statut === 'EN_PREPARATION', 'Statut passé à EN_PREPARATION');

    // 4. Idempotence (Rejeu du même SMS)
    const dupRes = await fetch(`${BASE_URL}/api/webhooks/orange-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'resto_secret_2026'
      },
      body: JSON.stringify({
        message: `Paiement marchand de 75 FCFA recu de 70998877 ref ${order.codeReference} Trans ID: OM-TEST-001.`
      })
    });
    const dupData = await dupRes.json();
    assert(dupData.duplicate === true, 'Garantie Idempotence : SMS doublon détecté et rejeté sans double-validation');

    // 5. Validation Niveau 2 (Téléphone Client + Montant)
    const order2 = await db.createOrder({
      customerName: 'Karim Test',
      customerPhone: '76554433',
      montantTotal: 120,
      items: [{ name: 'Gâteau Mariage', price: 120, quantity: 1 }]
    });

    const match2Res = await fetch(`${BASE_URL}/api/webhooks/orange-money`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-webhook-secret': 'resto_secret_2026'
      },
      body: JSON.stringify({
        message: 'Vous avez recu 120 FCFA de +226 76 55 44 33. Trans ID: CI240915.2020.'
      })
    });
    const match2Data = await match2Res.json();
    assert(match2Data.matched === true, 'Validation Niveau 2 : Rapprochement réussi par Téléphone + Montant');
    assert(match2Data.order && match2Data.order.id === order2.id, 'Attribution exacte à la commande correspondante');

    console.log(`\n📊 Résultat : ${passed}/${total} assertions réussies avec succès.\n`);
    process.exit(passed === total ? 0 : 1);
  } catch (err) {
    console.error('❌ Erreur suite de tests:', err);
    process.exit(1);
  }
}

runTests();
