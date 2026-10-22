import fs from 'fs';
import db from './db.js';

const newProducts = [
  // 1. Douceurs salées (3 produits)
  {
    name: 'Plateau Feuilletés Salés Apéritifs',
    category: 'Douceurs salées',
    price: 2500,
    description: 'Feuilletés croustillants au fromage fondant et épices douces, parfaits pour vos réceptions.',
    image: '/products/salee_1.jpeg'
  },
  {
    name: 'Croissants Salés Gourmets Farcis',
    category: 'Douceurs salées',
    price: 2000,
    description: 'Pâte pur beurre croustillante garnie de volaille assaisonnée et crème onctueuse.',
    image: '/products/salee_2.jpeg'
  },
  {
    name: 'Assortiment Bouchées & Pastels Salés',
    category: 'Douceurs salées',
    price: 3000,
    description: 'Beignets salés dorés et croustillants avec sauce maison parfumée de Lê Ci.',
    image: '/products/salee_3.jpeg'
  },

  // 2. Douceurs sucrées (8 produits)
  {
    name: 'Éclairs Fondants Chocolat & Ganache Dorée',
    category: 'Douceurs sucrées',
    price: 1500,
    description: 'Pâte à choux aérée garnie de ganache onctueuse au chocolat grand cru.',
    image: '/products/sucree_1.jpeg'
  },
  {
    name: 'Cupcakes Moelleux Crème Vanille Bourbon',
    category: 'Douceurs sucrées',
    price: 1500,
    description: 'Gâteau ultra moelleux surmonté d\'un tourbillon de crème montée veloutée.',
    image: '/products/sucree_2.jpeg'
  },
  {
    name: 'Macarons Assortis Prestige (Boîte Découverte)',
    category: 'Douceurs sucrées',
    price: 2000,
    description: 'Coques craquantes et cœurs fondants : pistache, framboise, chocolat et caramel fleur de sel.',
    image: '/products/sucree_3.jpeg'
  },
  {
    name: 'Tartelettes Sablées Fraises & Fruits Rouges',
    category: 'Douceurs sucrées',
    price: 2500,
    description: 'Pâte sablée dorée, crème pâtissière légère et fruits frais sélectionnés.',
    image: '/products/sucree_4.jpeg'
  },
  {
    name: 'Choux Craquelins Cœur Praliné Noisette',
    category: 'Douceurs sucrées',
    price: 1800,
    description: 'Craquelin doré et croustillant garni d\'une crème pralinée maison.',
    image: '/products/sucree_5.jpeg'
  },
  {
    name: 'Donuts Gourmands Glacés & Vermicelles',
    category: 'Douceurs sucrées',
    price: 1000,
    description: 'Pâte briochée moelleuse avec glaçage gourmand coloré.',
    image: '/products/sucree_6.jpeg'
  },
  {
    name: 'Sablés Délicats au Beurre & Confiture',
    category: 'Douceurs sucrées',
    price: 1200,
    description: 'Biscuits fondants pur beurre garnis de confiture artisanale.',
    image: '/products/sucree_7.jpeg'
  },
  {
    name: 'Mignardises Sucrées Festives de Lê Ci',
    category: 'Douceurs sucrées',
    price: 3500,
    description: 'Sélection raffinée de petites bouchées sucrées pour vos pauses gourmandes.',
    image: '/products/sucree_8.jpeg'
  },

  // 3. Gâteaux (8 produits)
  {
    name: 'Fraisier Signature Suprême Crème Mousseline',
    category: 'Gâteaux',
    price: 6500,
    description: 'Génoise aérienne, fraises fraîches parfumées et crème mousseline vanillée.',
    image: '/products/gateau_1.jpeg'
  },
  {
    name: 'Gâteau Festif Personnalisé Pâte d\'Amande',
    category: 'Gâteaux',
    price: 12000,
    description: 'Création sur-mesure décorée à la main pour vos anniversaires et célébrations.',
    image: '/products/gateau_2.jpeg'
  },
  {
    name: 'Forêt Noire Grand Cru Cacao & Cerises',
    category: 'Gâteaux',
    price: 7000,
    description: 'Génoise cacao intense, crème chantilly légère et cerises griottes juteuses.',
    image: '/products/gateau_3.jpeg'
  },
  {
    name: 'Layer Cake Chocolat Praliné & Drip Caramel',
    category: 'Gâteaux',
    price: 9500,
    description: 'Étages gourmands de chocolat et praliné avec coulant de caramel doré.',
    image: '/products/gateau_4.jpeg'
  },
  {
    name: 'Entremet Miroir Fruits Rouges & Mousse Velours',
    category: 'Gâteaux',
    price: 8000,
    description: 'Glaçage miroir étincelant sur mousse onctueuse aux fruits rouges frais.',
    image: '/products/gateau_5.jpeg'
  },
  {
    name: 'Red Velvet Cake Onctueux Cream Cheese',
    category: 'Gâteaux',
    price: 7500,
    description: 'Gâteau rouge velours traditionnel avec son glaçage doux au fromage frais.',
    image: '/products/gateau_6.jpeg'
  },
  {
    name: 'Number Cake Décoré Fruits Frais & Macarons',
    category: 'Gâteaux',
    price: 14000,
    description: 'Chiffre personnalisé sur sablé amande garni de crème vanille et macarons.',
    image: '/products/gateau_7.jpeg'
  },
  {
    name: 'Pièce Montée d\'Exception & Mariage Prestige',
    category: 'Gâteaux',
    price: 25000,
    description: 'Chef-d\'œuvre de haute pâtisserie pour mariages et grandes réceptions.',
    image: '/products/gateau_8.jpeg'
  },

  // 4. Paquets (7 produits)
  {
    name: 'Box Découverte Douceurs de Lê Ci',
    category: 'Paquets',
    price: 5000,
    description: 'Coffret cadeau assorti contenant un mix de nos meilleures pâtisseries artisanales.',
    image: '/products/paquet_1.jpeg'
  },
  {
    name: 'Paquet Cadeau Gourmand Ruban Doré',
    category: 'Paquets',
    price: 6500,
    description: 'Emballage d\'exception prêt à offrir avec sélection de douceurs raffinées.',
    image: '/products/paquet_2.jpeg'
  },
  {
    name: 'Coffret Dégustation Macarons & Mignardises',
    category: 'Paquets',
    price: 8000,
    description: 'Assortiment luxueux présenté dans son écrin de fête personnalisé.',
    image: '/products/paquet_3.jpeg'
  },
  {
    name: 'Pack Fête Familiale (Gâteaux + Mignardises)',
    category: 'Paquets',
    price: 15000,
    description: 'Le pack complet pour combler vos invités : gâteau central et bouchées variées.',
    image: '/products/paquet_4.jpeg'
  },
  {
    name: 'Box Pause Douceur & Viennoiseries Assorties',
    category: 'Paquets',
    price: 4500,
    description: 'Idéal pour les réunions et pauses gourmandes de bureau.',
    image: '/products/paquet_5.jpeg'
  },
  {
    name: 'Coffret Écrin Anniversaire Surprise',
    category: 'Paquets',
    price: 10000,
    description: 'Pack festif avec bougies, douceurs personnalisées et finitions prestige.',
    image: '/products/paquet_6.jpeg'
  },
  {
    name: 'Pack Réception & Cocktails d\'Entreprise',
    category: 'Paquets',
    price: 20000,
    description: 'Grande sélection de douceurs salées et sucrées pour événements professionnels.',
    image: '/products/paquet_7.jpeg'
  }
];

await db.initDb();

const existing = await db.getAllProducts({});
console.log('Suppression des anciens produits existants :', existing.length);
for (const p of existing) {
  await db.deleteProduct(p.id);
}

console.log('Insertion des 26 nouveaux produits issus des 4 dossiers...');
for (const p of newProducts) {
  await db.createProduct(p);
}

console.log('✅ 26 produits enregistrés dans SQLite.');

// Update initialProducts in server/db.js
const dbScriptPath = 'server/db.js';
let dbScript = fs.readFileSync(dbScriptPath, 'utf8');

const productsJsonCode = JSON.stringify(newProducts.map(p => [p.name, p.category, p.price, p.description, p.image]), null, 2);

const regexOldProducts = /const initialProducts = \[[\s\S]*?\];/;
dbScript = dbScript.replace(regexOldProducts, `const initialProducts = ${productsJsonCode};`);
fs.writeFileSync(dbScriptPath, dbScript, 'utf8');
console.log('✅ server/db.js mis à jour avec le tableau initialProducts.');
process.exit(0);
