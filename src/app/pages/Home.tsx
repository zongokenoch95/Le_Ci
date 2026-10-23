import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowRight, ShieldCheck, Heart, Clock, Zap, Check, Sparkles, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getProducts, Product } from '../services/api';

// Les 4 catégories demandées par l'utilisateur
const categories = ['Tous', 'Douceurs salés', 'Douceurs sucrées', 'Paquets', 'Gâteaux'];

// 26 produits créés à partir des dossiers d'images de l'utilisateur
const fallbackProducts = [
  // 1. Douceurs salées (3 produits)
  {
    id: 1,
    name: "Plateau Feuilletés Salés Apéritifs",
    category: 'Douceurs salés',
    price: '2 500 FCFA',
    numericPrice: 2500,
    description: "Feuilletés croustillants au fromage fondant et épices douces, parfaits pour vos réceptions.",
    image: '/products/salee_1.jpeg'
  },
  {
    id: 2,
    name: "Croissants Salés Gourmets Farcis",
    category: 'Douceurs salés',
    price: '2 000 FCFA',
    numericPrice: 2000,
    description: "Pâte pur beurre croustillante garnie de volaille assaisonnée et crème onctueuse.",
    image: '/products/salee_2.jpeg'
  },
  {
    id: 3,
    name: "Assortiment Bouchées & Pastels Salés",
    category: 'Douceurs salés',
    price: '3 000 FCFA',
    numericPrice: 3000,
    description: "Beignets salés dorés et croustillants avec sauce maison parfumée de Lê Ci.",
    image: '/products/salee_3.jpeg'
  },

  // 2. Douceurs sucrées (8 produits)
  {
    id: 4,
    name: "Éclairs Fondants Chocolat & Ganache Dorée",
    category: 'Douceurs sucrées',
    price: '1 500 FCFA',
    numericPrice: 1500,
    description: "Pâte à choux aérée garnie de ganache onctueuse au chocolat grand cru.",
    image: '/products/sucree_1.jpeg'
  },
  {
    id: 5,
    name: "Cupcakes Moelleux Crème Vanille Bourbon",
    category: 'Douceurs sucrées',
    price: '1 500 FCFA',
    numericPrice: 1500,
    description: "Gâteau ultra moelleux surmonté d'un tourbillon de crème montée veloutée.",
    image: '/products/sucree_2.jpeg'
  },
  {
    id: 6,
    name: "Macarons Assortis Prestige (Boîte Découverte)",
    category: 'Douceurs sucrées',
    price: '2 000 FCFA',
    numericPrice: 2000,
    description: "Coques craquantes et cœurs fondants : pistache, framboise, chocolat et caramel fleur de sel.",
    image: '/products/sucree_3.jpeg'
  },
  {
    id: 7,
    name: "Tartelettes Sablées Fraises & Fruits Rouges",
    category: 'Douceurs sucrées',
    price: '2 500 FCFA',
    numericPrice: 2500,
    description: "Pâte sablée dorée, crème pâtissière légère et fruits frais sélectionnés.",
    image: '/products/sucree_4.jpeg'
  },
  {
    id: 8,
    name: "Choux Craquelins Cœur Praliné Noisette",
    category: 'Douceurs sucrées',
    price: '1 800 FCFA',
    numericPrice: 1800,
    description: "Craquelin doré et croustillant garni d'une crème pralinée maison.",
    image: '/products/sucree_5.jpeg'
  },
  {
    id: 9,
    name: "Mignardises Sucrées Prestige Assorties",
    category: 'Douceurs sucrées',
    price: '3 500 FCFA',
    numericPrice: 3500,
    description: "Plateau de petits délices sucrés variés pour vos buffets raffinés.",
    image: '/products/sucree_6.jpeg'
  },
  {
    id: 10,
    name: "Verrines Pâtissières Gourmandes Mangue & Passion",
    category: 'Douceurs sucrées',
    price: '2 200 FCFA',
    numericPrice: 2200,
    description: "Mousse légère aux fruits exotiques locaux sur biscuit moelleux.",
    image: '/products/sucree_7.jpeg'
  },
  {
    id: 11,
    name: "Financiers Dorés Amande & Zeste de Citron",
    category: 'Douceurs sucrées',
    price: '1 500 FCFA',
    numericPrice: 1500,
    description: "Petits gâteaux moelleux pur beurre noisette parfumés aux agrumes.",
    image: '/products/sucree_8.jpeg'
  },

  // 3. Paquets (7 produits)
  {
    id: 12,
    name: "Paquet Dégustation Gourmande",
    category: 'Paquets',
    price: '5 000 FCFA',
    numericPrice: 5000,
    description: "Un assortiment équilibré de nos créations signatures dans un emballage prestige.",
    image: '/products/paquet_1.jpeg'
  },
  {
    id: 13,
    name: "Coffret Cadeau Douceurs de Lê Ci",
    category: 'Paquets',
    price: '7 500 FCFA',
    numericPrice: 7500,
    description: "Écrin luxueux composé de biscuits fins, chocolats et douceurs artisanales.",
    image: '/products/paquet_2.jpeg'
  },
  {
    id: 14,
    name: "Box Friandises Artisanales",
    category: 'Paquets',
    price: '4 500 FCFA',
    numericPrice: 4500,
    description: "Sélection gourmande pour les petits et grands moments de fête.",
    image: '/products/paquet_3.jpeg'
  },
  {
    id: 15,
    name: "Panier Festif Épicerie Sucrée",
    category: 'Paquets',
    price: '10 000 FCFA',
    numericPrice: 10000,
    description: "Grand panier garni réunissant nos meilleures spécialités sucrées et salées.",
    image: '/products/paquet_4.jpeg'
  },
  {
    id: 16,
    name: "Pack Événement Privilège",
    category: 'Paquets',
    price: '12 000 FCFA',
    numericPrice: 12000,
    description: "Idéal pour réceptions, réunions professionnelles ou cadeaux d'entreprise.",
    image: '/products/paquet_5.jpeg'
  },
  {
    id: 17,
    name: "Sélection Cadeau Maison Lê Ci",
    category: 'Paquets',
    price: '6 000 FCFA',
    numericPrice: 6000,
    description: "Boîte raffinée avec ruban satin contenant nos douceurs phares.",
    image: '/products/paquet_6.jpeg'
  },
  {
    id: 18,
    name: "Coffret Prestige de Saison",
    category: 'Paquets',
    price: '8 500 FCFA',
    numericPrice: 8500,
    description: "Créations éphémères aux saveurs de saison et fruits locaux sélectionnés.",
    image: '/products/paquet_7.jpeg'
  },

  // 4. Gâteaux (8 produits)
  {
    id: 19,
    name: "Fraisier Signature Suprême Crème Mousseline",
    category: 'Gâteaux',
    price: '6 500 FCFA',
    numericPrice: 6500,
    description: "Génoise imbibée, crème mousseline onctueuse à la vanille et fraises fraîches parfumées.",
    image: '/products/gateau_1.jpeg'
  },
  {
    id: 20,
    name: "Forêt Noire Authentique Griottes & Chocolat",
    category: 'Gâteaux',
    price: '6 000 FCFA',
    numericPrice: 6000,
    description: "Biscuit cacao intense, chantilly légère et cerises griottes acidulées.",
    image: '/products/gateau_2.jpeg'
  },
  {
    id: 21,
    name: "Layer Cake Anniversaire Praliné Croustillant",
    category: 'Gâteaux',
    price: '7 000 FCFA',
    numericPrice: 7000,
    description: "Gâteau haut et moderne décoré à la main, cœur praliné noisette croustillant.",
    image: '/products/gateau_3.jpeg'
  },
  {
    id: 22,
    name: "Entremets Miroir Chocolat Grand Cru",
    category: 'Gâteaux',
    price: '5 500 FCFA',
    numericPrice: 5500,
    description: "Glaçage miroir brillant, mousse chocolat noir intense et croustillant feuillantine.",
    image: '/products/gateau_4.jpeg'
  },
  {
    id: 23,
    name: "Gâteau Red Velvet Crème Cheese Veloutée",
    category: 'Gâteaux',
    price: '5 500 FCFA',
    numericPrice: 5500,
    description: "Biscuit rouge velours cacao garni d'un glaçage cream cheese légèrement citronné.",
    image: '/products/gateau_5.jpeg'
  },
  {
    id: 24,
    name: "Entremets Exotique Mangue & Noix de Coco",
    category: 'Gâteaux',
    price: '6 000 FCFA',
    numericPrice: 6000,
    description: "Dacquoise noix de coco, compotée de mangues locales et mousse coco aérienne.",
    image: '/products/gateau_6.jpeg'
  },
  {
    id: 25,
    name: "Gâteau Moka Traditionnel Café Pur Arabica",
    category: 'Gâteaux',
    price: '5 000 FCFA',
    numericPrice: 5000,
    description: "Biscuit cuillère moelleux imbibé de café et crème au beurre café parfumée.",
    image: '/products/gateau_7.jpeg'
  },
  {
    id: 26,
    name: "Tarte Chiboust Poires Caramélisées",
    category: 'Gâteaux',
    price: '5 500 FCFA',
    numericPrice: 5500,
    description: "Pâte sucrée craquante, poires fondantes caramélisées et crème Chiboust vanillée caramélisée au fer.",
    image: '/products/gateau_8.jpeg'
  }
];

export function Home() {
  const { addToCart, openCart } = useCart();
  const [productsList, setProductsList] = useState<any[]>(fallbackProducts);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [addedId, setAddedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCatalogue() {
      try {
        setLoading(true);
        const data = await getProducts({ available: true });
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((p: Product) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Gâteaux',
            price: `${p.price.toLocaleString('fr-FR')} FCFA`,
            numericPrice: p.price,
            image: p.image || '/products/gateau_1.jpeg',
            description: p.description || '',
          }));
          setProductsList(formatted);
        }
      } catch (err) {
        console.warn('Utilisation du catalogue local', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalogue();
  }, []);

  const filteredProducts = productsList.filter(product => {
    if (selectedCategory === 'Tous') return true;
    if (selectedCategory === 'Douceurs salés') {
      return product.category === 'Douceurs salés' || product.category === 'Douceurs salées';
    }
    return product.category === selectedCategory;
  });

  const handleAddToCart = (product: any, openDrawer = false) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      numericPrice: product.numericPrice,
      image: product.image,
      category: product.category
    }, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
    if (openDrawer) {
      openCart();
    }
  };

  const scrollToCatalogue = () => {
    const el = document.getElementById('catalogue-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-[92vh] sm:min-h-screen pt-32 sm:pt-40 pb-20 flex items-center justify-center overflow-hidden">
        {/* Photo de couverture */}
        <div className="absolute inset-0 z-0">
          <img
            src="/tarte-cover.png"
            alt="Création signature Les Douceurs de Lê Ci"
            className="w-full h-full object-cover object-center scale-105 transform animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/55 to-black/90" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 text-center max-w-4xl px-4 sm:px-6"
        >
          

          <h1 className="font-barcelony text-6xl sm:text-8xl md:text-9xl text-white tracking-wide mb-3 leading-tight drop-shadow-2xl">
            Les Douceurs de Lê Ci
          </h1>

          <p className="font-gotham text-sm sm:text-base md:text-lg text-purple-100 font-normal mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>

          <div className="flex justify-center items-center">
            {/* Bouton "Commander" en Pill (rounded-full) */}
            <button
              onClick={scrollToCatalogue}
              className="px-10 py-4 bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold rounded-full shadow-2xl shadow-purple-950/60 transition-all inline-flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 text-sm cursor-pointer border border-purple-400/30"
            >
              <span>Commander</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Garanties en bas du Hero */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-3 gap-4 text-white/90 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={22} className="text-purple-300" />
              <span className="text-[11px] font-bold tracking-wide">Produits locaux</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Heart size={22} className="text-purple-300" />
              <span className="text-[11px] font-bold tracking-wide">Healthy</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock size={22} className="text-purple-300" />
              <span className="text-[11px] font-bold tracking-wide">Produits frais</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* CATALOGUE DES DOUCEURS (REMPLACE DIRECTEMENT LA SECTION DÉCOUVERTE) */}
      {/* ========================================================================= */}
      <section id="catalogue-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 mb-3">
            Nos produits
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 max-w-xl mx-auto font-light mt-1">
            Préparés avec passion à la commande pour vos moments inoubliables.
          </p>
        </motion.div>

        {/* 4 Boutons de Catégories + Tous selon l'ordre demandé : Douceurs salés, Douceurs sucrées, Paquets, Gâteaux */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-2.5 rounded-full text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                selectedCategory === category
                  ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30 scale-105'
                  : 'bg-white text-gray-700 border border-purple-100 hover:border-purple-300 hover:bg-purple-50/50'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grille de Produits */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <Loader2 className="animate-spin text-[#581C87]" size={36} />
            <span className="text-sm font-medium">Chargement de nos douceurs...</span>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const isAdded = addedId === product.id;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className="bg-white rounded-3xl overflow-hidden border border-purple-100/70 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-square overflow-hidden bg-purple-50/30">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-bold text-[#581C87] shadow-sm border border-purple-100">
                          {product.category}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-sm group-hover:text-[#581C87] transition mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                          {product.description || 'Création artisanale raffinée confectionnée avec des ingrédients d’exception.'}
                        </p>
                        <div className="text-base font-extrabold text-[#581C87]">
                          {product.price}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product, false)}
                        className={`flex-1 py-2.5 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white hover:bg-purple-50 text-gray-800 border border-gray-200 hover:border-purple-200 shadow-sm'
                        }`}
                        title="Ajouter au panier"
                      >
                        {isAdded ? (
                          <>
                            <Check size={14} className="text-white" /> Ajouté !
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={14} /> Ajouter au panier
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="flex-1 py-2.5 px-3 rounded-full font-extrabold text-xs bg-[#581C87] hover:bg-[#6B21A8] text-white shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Commander immédiatement"
                      >
                        <Zap size={14} />
                        <span>Commander</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-purple-100 p-8">
            <p className="text-gray-500 font-medium mb-4">Aucune douceur dans cette catégorie pour le moment.</p>
            <button
              onClick={() => setSelectedCategory('Tous')}
              className="px-7 py-3 bg-[#581C87] text-white rounded-full text-xs font-bold hover:bg-[#6B21A8] transition cursor-pointer shadow-md"
            >
              Voir toutes les douceurs
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
