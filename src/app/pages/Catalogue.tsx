import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Zap, ShieldCheck, Loader2, Cake, Sparkles, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { getProducts, Product } from '../services/api';

// Les 4 catégories officielles issues des dossiers de img/
const categories = ['Tous', 'Douceurs salés', 'Douceurs sucrées', 'Paquets', 'Gâteaux'];

// 26 produits créés à partir des dossiers d'images
const fallbackProducts = [
  // 1. Douceurs salées (3 produits)
  {
    id: 1,
    name: "Plateau Feuilletés Salés Apéritifs",
    category: 'Douceurs salées',
    price: '2 500 FCFA',
    numericPrice: 2500,
    description: "Feuilletés croustillants au fromage fondant et épices douces, parfaits pour vos réceptions.",
    image: '/products/salee_1.jpeg'
  },
  {
    id: 2,
    name: "Croissants Salés Gourmets Farcis",
    category: 'Douceurs salées',
    price: '2 000 FCFA',
    numericPrice: 2000,
    description: "Pâte pur beurre croustillante garnie de volaille assaisonnée et crème onctueuse.",
    image: '/products/salee_2.jpeg'
  },
  {
    id: 3,
    name: "Assortiment Bouchées & Pastels Salés",
    category: 'Douceurs salées',
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
    name: "Donuts Gourmands Glacés & Vermicelles",
    category: 'Douceurs sucrées',
    price: '1 000 FCFA',
    numericPrice: 1000,
    description: "Pâte briochée moelleuse avec glaçage gourmand coloré.",
    image: '/products/sucree_6.jpeg'
  },
  {
    id: 10,
    name: "Sablés Délicats au Beurre & Confiture",
    category: 'Douceurs sucrées',
    price: '1 200 FCFA',
    numericPrice: 1200,
    description: "Biscuits fondants pur beurre garnis de confiture artisanale.",
    image: '/products/sucree_7.jpeg'
  },
  {
    id: 11,
    name: "Mignardises Sucrées Festives de Lê Ci",
    category: 'Douceurs sucrées',
    price: '3 500 FCFA',
    numericPrice: 3500,
    description: "Sélection raffinée de petites bouchées sucrées pour vos pauses gourmandes.",
    image: '/products/sucree_8.jpeg'
  },

  // 3. Gâteaux (8 produits)
  {
    id: 12,
    name: "Fraisier Signature Suprême Crème Mousseline",
    category: 'Gâteaux',
    price: '6 500 FCFA',
    numericPrice: 6500,
    description: "Génoise aérienne, fraises fraîches parfumées et crème mousseline vanillée.",
    image: '/products/gateau_1.jpeg'
  },
  {
    id: 13,
    name: "Gâteau Festif Personnalisé Pâte d'Amande",
    category: 'Gâteaux',
    price: '12 000 FCFA',
    numericPrice: 12000,
    description: "Création sur-mesure décorée à la main pour vos anniversaires et célébrations.",
    image: '/products/gateau_2.jpeg'
  },
  {
    id: 14,
    name: "Forêt Noire Grand Cru Cacao & Cerises",
    category: 'Gâteaux',
    price: '7 000 FCFA',
    numericPrice: 7000,
    description: "Génoise cacao intense, crème chantilly légère et cerises griottes juteuses.",
    image: '/products/gateau_3.jpeg'
  },
  {
    id: 15,
    name: "Layer Cake Chocolat Praliné & Drip Caramel",
    category: 'Gâteaux',
    price: '9 500 FCFA',
    numericPrice: 9500,
    description: "Étages gourmands de chocolat et praliné avec coulant de caramel doré.",
    image: '/products/gateau_4.jpeg'
  },
  {
    id: 16,
    name: "Entremet Miroir Fruits Rouges & Mousse Velours",
    category: 'Gâteaux',
    price: '8 000 FCFA',
    numericPrice: 8000,
    description: "Glaçage miroir étincelant sur mousse onctueuse aux fruits rouges frais.",
    image: '/products/gateau_5.jpeg'
  },
  {
    id: 17,
    name: "Red Velvet Cake Onctueux Cream Cheese",
    category: 'Gâteaux',
    price: '7 500 FCFA',
    numericPrice: 7500,
    description: "Gâteau rouge velours traditionnel avec son glaçage doux au fromage frais.",
    image: '/products/gateau_6.jpeg'
  },
  {
    id: 18,
    name: "Number Cake Décoré Fruits Frais & Macarons",
    category: 'Gâteaux',
    price: '14 000 FCFA',
    numericPrice: 14000,
    description: "Chiffre personnalisé sur sablé amande garni de crème vanille et macarons.",
    image: '/products/gateau_7.jpeg'
  },
  {
    id: 19,
    name: "Pièce Montée d'Exception & Mariage Prestige",
    category: 'Gâteaux',
    price: '25 000 FCFA',
    numericPrice: 25000,
    description: "Chef-d'œuvre de haute pâtisserie pour mariages et grandes réceptions.",
    image: '/products/gateau_8.jpeg'
  },

  // 4. Paquets (7 produits)
  {
    id: 20,
    name: "Box Découverte Douceurs de Lê Ci",
    category: 'Paquets',
    price: '5 000 FCFA',
    numericPrice: 5000,
    description: "Coffret cadeau assorti contenant un mix de nos meilleures pâtisseries artisanales.",
    image: '/products/paquet_1.jpeg'
  },
  {
    id: 21,
    name: "Paquet Cadeau Gourmand Ruban Doré",
    category: 'Paquets',
    price: '6 500 FCFA',
    numericPrice: 6500,
    description: "Emballage d'exception prêt à offrir avec sélection de douceurs raffinées.",
    image: '/products/paquet_2.jpeg'
  },
  {
    id: 22,
    name: "Coffret Dégustation Macarons & Mignardises",
    category: 'Paquets',
    price: '8 000 FCFA',
    numericPrice: 8000,
    description: "Assortiment luxueux présenté dans son écrin de fête personnalisé.",
    image: '/products/paquet_3.jpeg'
  },
  {
    id: 23,
    name: "Pack Fête Familiale (Gâteaux + Mignardises)",
    category: 'Paquets',
    price: '15 000 FCFA',
    numericPrice: 15000,
    description: "Le pack complet pour combler vos invités : gâteau central et bouchées variées.",
    image: '/products/paquet_4.jpeg'
  },
  {
    id: 24,
    name: "Box Pause Douceur & Viennoiseries Assorties",
    category: 'Paquets',
    price: '4 500 FCFA',
    numericPrice: 4500,
    description: "Idéal pour les réunions et pauses gourmandes de bureau.",
    image: '/products/paquet_5.jpeg'
  },
  {
    id: 25,
    name: "Coffret Écrin Anniversaire Surprise",
    category: 'Paquets',
    price: '10 000 FCFA',
    numericPrice: 10000,
    description: "Pack festif avec bougies, douceurs personnalisées et finitions prestige.",
    image: '/products/paquet_6.jpeg'
  },
  {
    id: 26,
    name: "Pack Réception & Cocktails d'Entreprise",
    category: 'Paquets',
    price: '20 000 FCFA',
    numericPrice: 20000,
    description: "Grande sélection de douceurs salées et sucrées pour événements professionnels.",
    image: '/products/paquet_7.jpeg'
  }
];

export function Catalogue() {
  const [productsList, setProductsList] = useState<any[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedCakePortions, setSelectedCakePortions] = useState<{ [id: number]: { label: string; price: number } }>({});
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  useEffect(() => {
    if (categoryParam) {
      if (categoryParam.includes('sal')) {
        setSelectedCategory('Douceurs salés');
      } else if (categoryParam.includes('sucr')) {
        setSelectedCategory('Douceurs sucrées');
      } else if (categoryParam.includes('Paquet')) {
        setSelectedCategory('Paquets');
      } else if (categoryParam.includes('Gât') || categoryParam.includes('Gateau')) {
        setSelectedCategory('Gâteaux');
      }
    }
  }, [categoryParam]);
  
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const { addToCart, openCart } = useCart();

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const data = await getProducts({ available: true });
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data.map((p: Product) => ({
            id: p.id,
            name: p.name,
            category: p.category || 'Gâteaux',
            price: `${p.price.toLocaleString('fr-FR')} FCFA`,
            numericPrice: p.price,
            image: p.image || '/products/gateau_1.jpeg',
            description: p.description || "",
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
    const chosenPortion = selectedCakePortions[product.id];
    const finalName = chosenPortion ? `${product.name} (${chosenPortion.label})` : product.name;
    const finalPrice = chosenPortion ? `${chosenPortion.price.toLocaleString('fr-FR')} FCFA` : product.price;
    const finalNumericPrice = chosenPortion ? chosenPortion.price : product.numericPrice;

    addToCart({
      id: product.id,
      name: finalName,
      price: finalPrice,
      numericPrice: finalNumericPrice,
      image: product.image,
      category: product.category
    }, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
    if (openDrawer) {
      openCart();
    }
  };

  return (
    <div className="min-h-screen py-12 bg-[#FAF8F5]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-2 mb-4">Nos produits</h1>
          <p className="text-sm text-gray-500 max-w-2xl mx-auto mb-2 font-light">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>
          <p className="text-xs text-gray-600 max-w-2xl mx-auto">
            Chaque création est préparée à la commande avec des ingrédients nobles. Commandez en quelques clics et payez instantanément via Orange Money.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-purple-100/70 text-[#581C87] text-xs font-semibold">
            <ShieldCheck size={14} /> Préparation artisanale fraîche & Paiement direct Orange Money
          </div>
        </motion.div>

        {/* Filtres par Catégorie */}
        <div className="mb-10">
          {/* 4 Boutons de Catégories + Tous */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
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
        </div>

        
        {/* Choix entre Gâteau Classique et Gâteau Sur-Mesure (Demande Notion #3 & #4) */}
        {(selectedCategory === 'Gâteaux' || selectedCategory === 'Tous') && (
          <div className="mb-10 p-6 rounded-3xl bg-gradient-to-r from-purple-900 to-[#581C87] text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-xl text-center md:text-left">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#D4AF37] px-3 py-1 rounded-full bg-white/10 inline-block">
                ✦ Deux formules de gâteaux au choix ✦
              </span>
              <h3 className="text-xl sm:text-2xl font-black">
                Gâteau Simple ou Création Sur-Mesure ?
              </h3>
              <p className="text-xs text-purple-200/90 font-light leading-relaxed">
                • <strong>Gâteau classique</strong> : Choisissez simplement votre recette ci-dessous et le nombre de parts.<br />
                • <strong>Gâteau sur-mesure</strong> : Personnalisez toutes les variables (nom sur le gâteau, saveurs, thème, décoration, carte).
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
              <Link
                to="/sur-commande"
                className="px-6 py-3 rounded-full bg-white text-[#581C87] hover:bg-purple-50 font-extrabold text-xs shadow-lg transition flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <Sparkles size={14} className="text-[#581C87]" />
                <span>Créer un gâteau sur-mesure</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        )}

        {/* Grille de Produits */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <Loader2 className="animate-spin text-[#581C87]" size={36} />
            <span className="text-sm font-medium">Chargement de nos douceurs artisanales...</span>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredProducts.map((product) => {
                const isAdded = addedProductId === product.id;
                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={product.id}
                    className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-square overflow-hidden bg-gray-50">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <span className="absolute top-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-md rounded-full text-[11px] font-bold text-gray-800 shadow-sm">
                          {product.category}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="font-bold text-gray-900 text-base group-hover:text-[#581C87] transition mb-1 line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-gray-500 mb-3 line-clamp-2 leading-relaxed">
                          {product.description || 'Création artisanale raffinée avec des ingrédients d excellence.'}
                        </p>
                        
                        {/* Sélecteur de parts pour les Gâteaux (Notion #4) */}
                        {(product.category === 'Gâteaux' || product.category?.includes('Gât')) && (
                          <div className="mb-3 p-2.5 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs">
                            <label className="block text-[10px] font-extrabold text-[#581C87] uppercase tracking-wider mb-1 flex items-center gap-1">
                              <Cake size={12} /> Format & Nombre de parts :
                            </label>
                            <select
                              value={selectedCakePortions[product.id]?.label || '6-8 parts'}
                              onChange={(e) => {
                                const selectedLabel = e.target.value;
                                let mult = 1;
                                if (selectedLabel.includes('8')) mult = 1.25;
                                if (selectedLabel.includes('10') || selectedLabel.includes('12')) mult = 1.5;
                                if (selectedLabel.includes('15') || selectedLabel.includes('20')) mult = 2;
                                const calculatedPrice = Math.round((product.numericPrice * mult) / 500) * 500;
                                setSelectedCakePortions({
                                  ...selectedCakePortions,
                                  [product.id]: { label: selectedLabel, price: calculatedPrice }
                                });
                              }}
                              className="w-full p-1.5 rounded-lg border border-purple-200 bg-white font-bold text-gray-800 text-[11px] outline-none"
                            >
                              <option value="6-8 parts">6 à 8 parts ({product.numericPrice.toLocaleString('fr-FR')} FCFA)</option>
                              <option value="8-10 parts">8 à 10 parts ({Math.round(product.numericPrice * 1.25).toLocaleString('fr-FR')} FCFA)</option>
                              <option value="10-12 parts">10 à 12 parts ({Math.round(product.numericPrice * 1.5).toLocaleString('fr-FR')} FCFA)</option>
                              <option value="15-20 parts">15 à 20 parts ({Math.round(product.numericPrice * 2).toLocaleString('fr-FR')} FCFA)</option>
                            </select>
                          </div>
                        )}
  
                        <div className="text-base font-extrabold text-[#581C87]">
                          {selectedCakePortions[product.id] ? `${selectedCakePortions[product.id].price.toLocaleString('fr-FR')} FCFA` : product.price}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 pt-0 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product, false)}
                        className={`flex-1 py-2.5 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-white hover:bg-purple-50 text-gray-800 border border-gray-200 hover:border-purple-200 shadow-sm'
                        }`}
                        title="Ajouter au panier"
                      >
                        {isAdded ? (
                          <>
                            <Check size={15} /> Ajouté !
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={15} /> Ajouter au panier
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="flex-1 py-2.5 px-3 rounded-full font-extrabold text-xs bg-[#581C87] hover:bg-[#6B21A8] text-white shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        title="Commander immédiatement"
                      >
                        <Zap size={15} />
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
          <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-8">
            <p className="text-gray-500 font-medium mb-4">Aucune douceur ne correspond à votre recherche.</p>
            <button
              onClick={() => setSelectedCategory('Tous')}
              className="px-7 py-3 bg-[#581C87] text-white rounded-full text-xs font-bold hover:bg-[#6B21A8] transition cursor-pointer shadow-md"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
