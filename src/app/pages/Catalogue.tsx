import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, Check, Zap, ShieldCheck, Loader2, Cake, Sparkles, ArrowRight, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { getProducts, getProductCategories, Product } from '../services/api';

// Les catégories officielles par défaut vendues par la maison Lê Ci
const defaultCategories = ['Tous', 'Signature de la maison', 'Douceurs salés', 'Douceurs sucrées', 'Paquets', 'Gâteaux'];

const isCakeCategory = (cat?: string) => Boolean(cat && /g[aâ]teau/i.test(cat.trim()));

// 26 produits créés à partir des dossiers d'images
const fallbackProducts = [
  // 1. Douceurs salées (mélange de plusieurs pièces de douceurs salées différentes - nombre précis)
  {
    id: 1,
    name: "Plateau Mélange Douceurs Salées Classique",
    category: 'Douceurs salées',
    price: '5 000 FCFA',
    numericPrice: 5000,
    description: "Paquet constitué de 20 mini pizza, 13 nem et 11 pastel.",
    composition: [
      { name: 'Mini pizza', count: 20 },
      { name: 'Nem', count: 13 },
      { name: 'Pastel', count: 11 }
    ],
    image: '/products/salee_1.jpeg'
  },
  {
    id: 2,
    name: "Assortiment Gourmet Feuilletés & Croissants Salés",
    category: 'Douceurs salées',
    price: '4 500 FCFA',
    numericPrice: 4500,
    description: "Paquet constitué de 15 mini croissants farcis, 12 feuilletés fromage et 10 mini quiches.",
    composition: [
      { name: 'Mini croissants farcis', count: 15 },
      { name: 'Feuilletés fromage', count: 12 },
      { name: 'Mini quiches', count: 10 }
    ],
    image: '/products/salee_2.jpeg'
  },
  {
    id: 3,
    name: "Grand Coffret Réception Bouchées Salées",
    category: 'Douceurs salées',
    price: '7 500 FCFA',
    numericPrice: 7500,
    description: "Paquet constitué de 25 mini pizza, 20 nem, 15 pastel et 10 samoussas.",
    composition: [
      { name: 'Mini pizza', count: 25 },
      { name: 'Nem', count: 20 },
      { name: 'Pastel', count: 15 },
      { name: 'Samoussas', count: 10 }
    ],
    image: '/products/salee_3.jpeg'
  },

  // 2. Douceurs sucrées (mélange de plusieurs pièces de douceurs sucrées différentes - nombre précis)
  {
    id: 4,
    name: "Coffret Mélange Douceurs Sucrées Signature",
    category: 'Douceurs sucrées',
    price: '5 000 FCFA',
    numericPrice: 5000,
    description: "Paquet constitué de 20 mini brownies, 13 mini cake et 11 choux à la crème.",
    composition: [
      { name: 'Mini brownies', count: 20 },
      { name: 'Mini cake', count: 13 },
      { name: 'Choux à la crème', count: 11 }
    ],
    image: '/products/sucree_1.jpeg'
  },
  {
    id: 5,
    name: "Assortiment Cupcakes, Éclairs & Tartelettes",
    category: 'Douceurs sucrées',
    price: '4 500 FCFA',
    numericPrice: 4500,
    description: "Paquet constitué de 15 mini cupcakes vanille, 12 mini éclairs chocolat et 10 tartelettes fruits.",
    composition: [
      { name: 'Mini cupcakes vanille', count: 15 },
      { name: 'Mini éclairs chocolat', count: 12 },
      { name: 'Tartelettes fruits', count: 10 }
    ],
    image: '/products/sucree_2.jpeg'
  },
  {
    id: 6,
    name: "Macarons & Mignardises Prestige (Boîte Découverte)",
    category: 'Douceurs sucrées',
    price: '6 000 FCFA',
    numericPrice: 6000,
    description: "Paquet constitué de 16 macarons assortis, 14 financiers dorés et 12 choux craquelins.",
    composition: [
      { name: 'Macarons assortis', count: 16 },
      { name: 'Financiers dorés', count: 14 },
      { name: 'Choux craquelins', count: 12 }
    ],
    image: '/products/sucree_3.jpeg'
  },
  {
    id: 7,
    name: "Tartelettes Sablées Fraises & Douceurs Fruitées",
    category: 'Douceurs sucrées',
    price: '4 000 FCFA',
    numericPrice: 4000,
    description: "Paquet constitué de 15 mini tartelettes fraises, 12 sablés confiture et 10 choux vanille.",
    image: '/products/sucree_4.jpeg'
  },
  {
    id: 8,
    name: "Choux Craquelins, Brownies & Cœur Praliné",
    category: 'Douceurs sucrées',
    price: '4 500 FCFA',
    numericPrice: 4500,
    description: "Paquet constitué de 18 choux craquelins praliné, 14 mini brownies et 10 mini cakes.",
    image: '/products/sucree_5.jpeg'
  },
  {
    id: 9,
    name: "Mélange Donuts Glacés, Sablés & Mini Cakes",
    category: 'Douceurs sucrées',
    price: '3 500 FCFA',
    numericPrice: 3500,
    description: "Paquet constitué de 15 mini donuts glacés, 12 sablés pur beurre et 10 mini cakes.",
    image: '/products/sucree_6.jpeg'
  },
  {
    id: 10,
    name: "Sablés Délicats, Mini Brownies & Choux",
    category: 'Douceurs sucrées',
    price: '3 800 FCFA',
    numericPrice: 3800,
    description: "Paquet constitué de 20 sablés fondants, 12 mini brownies et 10 choux à la crème.",
    image: '/products/sucree_7.jpeg'
  },
  {
    id: 11,
    name: "Grand Plateau Mignardises Sucrées Festives",
    category: 'Douceurs sucrées',
    price: '6 500 FCFA',
    numericPrice: 6500,
    description: "Paquet constitué de 20 mini brownies, 15 mini cakes, 12 choux à la crème et 10 tartelettes.",
    image: '/products/sucree_8.jpeg'
  },

  // 3. Paquets (constitué de plusieurs pièces d'une douceur unique : nombre minimal avec possibilité d'augmenter)
  {
    id: 20,
    name: "Paquet Unique — Mini Pizzas Artisanales",
    category: 'Paquets',
    price: '5 000 FCFA',
    numericPrice: 5000,
    min_pieces: 20,
    description: "Paquet constitué uniquement de mini pizzas moelleuses (minimum 20 pièces, possibilité d'augmenter selon vos besoins).",
    image: '/products/paquet_1.jpeg'
  },
  {
    id: 21,
    name: "Paquet Unique — Nems Dorés Croustillants",
    category: 'Paquets',
    price: '4 500 FCFA',
    numericPrice: 4500,
    min_pieces: 15,
    description: "Paquet constitué uniquement de nems dorés faits maison (minimum 15 pièces, possibilité d'augmenter).",
    image: '/products/paquet_2.jpeg'
  },
  {
    id: 22,
    name: "Paquet Unique — Pastels Farcis Savoureux",
    category: 'Paquets',
    price: '4 000 FCFA',
    numericPrice: 4000,
    min_pieces: 20,
    description: "Paquet constitué uniquement de pastels farcis avec sauce maison (minimum 20 pièces, possibilité d'augmenter).",
    image: '/products/paquet_3.jpeg'
  },
  {
    id: 23,
    name: "Paquet Unique — Mini Brownies Chocolat Intense",
    category: 'Paquets',
    price: '5 000 FCFA',
    numericPrice: 5000,
    min_pieces: 20,
    description: "Paquet constitué uniquement de mini brownies fondants (minimum 20 pièces, possibilité d'augmenter).",
    image: '/products/paquet_4.jpeg'
  },
  {
    id: 24,
    name: "Paquet Unique — Choux à la Crème Vanille",
    category: 'Paquets',
    price: '4 500 FCFA',
    numericPrice: 4500,
    min_pieces: 15,
    description: "Paquet constitué uniquement de choux à la crème onctueuse (minimum 15 pièces, possibilité d'augmenter).",
    image: '/products/paquet_5.jpeg'
  },
  {
    id: 25,
    name: "Paquet Unique — Mini Cakes Moelleux",
    category: 'Paquets',
    price: '4 000 FCFA',
    numericPrice: 4000,
    min_pieces: 20,
    description: "Paquet constitué uniquement de mini cakes pur beurre (minimum 20 pièces, possibilité d'augmenter).",
    image: '/products/paquet_6.jpeg'
  },
  {
    id: 26,
    name: "Paquet Unique — Mini Croissants Salés",
    category: 'Paquets',
    price: '5 500 FCFA',
    numericPrice: 5500,
    min_pieces: 25,
    description: "Paquet constitué uniquement de mini croissants salés gourmets (minimum 25 pièces, possibilité d'augmenter).",
    image: '/products/paquet_7.jpeg'
  }
];

export function Catalogue() {
  const [productsList, setProductsList] = useState<any[]>(fallbackProducts);
  const [categories, setCategories] = useState<string[]>(defaultCategories);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [selectedCakePortions, setSelectedCakePortions] = useState<{ [id: number]: { label: string; price: number } }>({});
  const [selectedPaquetPieces, setSelectedPaquetPieces] = useState<{ [id: number]: number }>({});
  const [searchParams] = useSearchParams();
  const categoryParam = searchParams.get('category');

  const navigate = useNavigate();

  useEffect(() => {
    if (categoryParam) {
      if (categoryParam.toLowerCase().includes('signature')) {
        setSelectedCategory('Signature de la maison');
      } else if (categoryParam.includes('sal')) {
        setSelectedCategory('Douceurs salés');
      } else if (categoryParam.includes('sucr')) {
        setSelectedCategory('Douceurs sucrées');
      } else if (categoryParam.includes('Paquet')) {
        setSelectedCategory('Paquets');
      } else if (categoryParam.includes('Gât') || categoryParam.includes('Gateau')) {
        navigate('/sur-commande');
      }
    }
  }, [categoryParam, navigate]);
  
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const { addToCart, openCart } = useCart();

  useEffect(() => {
    async function loadCatalogue() {
      try {
        const [data, dbCats] = await Promise.all([
          getProducts({ available: true }),
          getProductCategories().catch(() => [])
        ]);
        if (Array.isArray(dbCats) && dbCats.length > 0) {
          const merged = [...defaultCategories];
          for (const c of dbCats) {
            if (
              c.name &&
              !isCakeCategory(c.name) &&
              !merged.includes(c.name) &&
              !(c.name === 'Douceurs salées' && merged.includes('Douceurs salés'))
            ) {
              merged.push(c.name);
            }
          }
          setCategories(merged);
        }
        if (Array.isArray(data) && data.length > 0) {
          const formatted = data
            .filter((p: Product) => !isCakeCategory(p.category))
            .map((p: Product) => {
              let portions: any[] = [];
              if (p.portions && Array.isArray(p.portions)) {
                portions = p.portions;
              } else if (p.portions_json) {
                try { portions = JSON.parse(p.portions_json); } catch(e) {}
              }
              let composition: { name: string; count: number }[] = [];
              if (p.composition && Array.isArray(p.composition)) {
                composition = p.composition;
              } else if (p.composition_json) {
                try { composition = JSON.parse(p.composition_json); } catch(e) {}
              }
              const isPaquetCat = Boolean(p.category && /paquet/i.test(p.category));
              const minPieces = p.min_pieces && p.min_pieces > 0 ? p.min_pieces : (isPaquetCat ? 20 : 0);
              return {
                id: p.id,
                name: p.name,
                category: p.category || 'Douceurs sucrées',
                price: `${p.price.toLocaleString('fr-FR')} FCFA`,
                numericPrice: p.price,
                image: p.image || '/products/sucree_1.jpeg',
                description: p.description || "",
                min_pieces: minPieces,
                composition,
                portions
              };
            });
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
    if (isCakeCategory(product.category)) return false;
    if (selectedCategory === 'Tous') return true;
    if (selectedCategory === 'Signature de la maison') {
      const signatureIds = [1, 4, 6, 7, 20, 22];
      const nameLower = (product.name || '').toLowerCase();
      const descLower = (product.description || '').toLowerCase();
      return signatureIds.includes(product.id) || 
        nameLower.includes('signature') || 
        nameLower.includes('prestige') || 
        descLower.includes('signature') ||
        product.is_signature;
    }
    if (selectedCategory === 'Douceurs salés') {
      return product.category === 'Douceurs salés' || product.category === 'Douceurs salées';
    }
    return product.category === selectedCategory;
  });

  const handleAddToCart = (product: any, goImmediate = false) => {
    const isCakeProduct = product.category === 'Gâteaux' || product.category?.includes('Gât');
    const isPaquetProduct = Boolean(product.category && /paquet/i.test(product.category));
    const minPieces = product.min_pieces && product.min_pieces > 0 ? product.min_pieces : 20;
    const chosenPieces = isPaquetProduct ? Math.max(minPieces, selectedPaquetPieces[product.id] || minPieces) : 0;

    const chosenPortion = selectedCakePortions[product.id];
    const defaultPortionLabel = product.portions?.[0]?.label || '6 parts';
    const portionLabel = isCakeProduct ? (chosenPortion?.label || defaultPortionLabel) : undefined;

    let finalName = product.name;
    let finalNumericPrice = product.numericPrice;

    if (isPaquetProduct) {
      finalName = `${product.name} (${chosenPieces} pièces)`;
      finalNumericPrice = Math.round((product.numericPrice / minPieces) * chosenPieces);
    } else if (chosenPortion) {
      finalName = `${product.name} (${chosenPortion.label})`;
      finalNumericPrice = chosenPortion.price;
    }

    const finalPrice = `${finalNumericPrice.toLocaleString('fr-FR')} FCFA`;

    addToCart({
      id: isPaquetProduct ? `${product.id}-pcs-${chosenPieces}` : product.id,
      name: finalName,
      price: finalPrice,
      numericPrice: finalNumericPrice,
      image: product.image,
      category: product.category,
      portion: portionLabel,
      catalogModel: product.name,
      isCake: isCakeProduct,
      description: product.description
    }, 1);
    setAddedProductId(product.id);
    setTimeout(() => setAddedProductId(null), 1500);
    if (goImmediate) {
      navigate('/panier');
    }
  };

  return (
    <div className="min-h-screen py-12 bg-[#FDF8F2] text-[#2B1204]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
        {/* En-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl sm:text-5xl font-black text-[#2B1204] mt-2 mb-4">Nos Douceurs</h1>
          <p className="font-barcelony text-2xl sm:text-3xl text-[#C20A0A] max-w-2xl mx-auto mb-2">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>
          <p className="text-xs text-[#2B1204]/75 max-w-2xl mx-auto">
            Chaque création est préparée à la commande avec des ingrédients nobles et locaux. Commandez en quelques clics et payez instantanément via Mobile Money.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-[#5DBA68]/15 border border-[#5DBA68]/40 text-[#2B1204] text-xs font-bold">
            <ShieldCheck size={14} className="text-[#5DBA68]" /> Préparation artisanale fraîche & Paiement direct Mobile Money
          </div>
        </motion.div>

        {/* Filtres par Catégorie — Intitulés alignés horizontalement avec défilement horizontal */}
        <div className="mb-10">
          <div className="flex flex-nowrap items-center justify-start md:justify-center gap-2.5 sm:gap-3 overflow-x-auto pb-2 px-1">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => {
                  if (isCakeCategory(category)) {
                    navigate('/sur-commande');
                  } else {
                    setSelectedCategory(category);
                  }
                }}
                className={`shrink-0 whitespace-nowrap px-5 sm:px-6 py-2.5 rounded-lg text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  selectedCategory === category
                    ? 'bg-[#2B1204] text-[#F8BE40] shadow-lg border-2 border-[#F8BE40]'
                    : 'bg-white text-[#2B1204] border border-[#F6C58E] hover:border-[#2B1204] hover:bg-[#FDF6EC]'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de Produits en 2 COLONNES */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-[#2B1204]/60 gap-3">
            <Loader2 className="animate-spin text-[#2B1204]" size={36} />
            <span className="text-sm font-medium">Chargement de nos douceurs artisanales...</span>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-2 gap-4 sm:gap-8">
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
                    className="bg-white rounded-2xl overflow-hidden border-2 border-[#F6C58E]/60 hover:border-[#2B1204] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="relative aspect-[4/3] overflow-hidden bg-[#FDF6EC]">
                        <ImageWithFallback
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="p-4 sm:p-6">
                        <h3 className="font-black text-[#2B1204] text-sm sm:text-lg group-hover:text-[#C20A0A] transition mb-1.5 line-clamp-2">
                          {product.name}
                        </h3>
                        <p className="hidden sm:block text-xs text-[#2B1204]/75 mb-3 line-clamp-2 leading-relaxed">
                          {product.description || 'Création artisanale raffinée avec des ingrédients d excellence.'}
                        </p>

                        {/* Affichage de la composition précise pour Douceurs salées / Douceurs sucrées */}
                        {Array.isArray(product.composition) && product.composition.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {product.composition.map((comp: { name: string; count: number }, idx: number) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 rounded-md bg-[#FDF6EC] text-[#2B1204] border border-[#F6C58E] text-[10px] font-bold"
                              >
                                {comp.count} {comp.name}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Configurateur de nombre de pièces pour Paquets (minimum + possibilité d'augmenter) */}
                        {/paquet/i.test(product.category || '') ? (
                          <div className="mt-2 pt-2 border-t border-[#F6C58E]/60 space-y-2">
                            {(() => {
                              const minPcs = product.min_pieces && product.min_pieces > 0 ? product.min_pieces : 20;
                              const currentPcs = Math.max(minPcs, selectedPaquetPieces[product.id] || minPcs);
                              const computedPrice = Math.round((product.numericPrice / minPcs) * currentPcs);
                              return (
                                <>
                                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                    <span className="font-semibold text-[#2B1204]/80">
                                      Min. <strong className="text-[#C20A0A]">{minPcs} pcs</strong> :
                                    </span>
                                    <div className="flex items-center gap-1">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedPaquetPieces(prev => ({
                                            ...prev,
                                            [product.id]: Math.max(minPcs, currentPcs - 1)
                                          }))
                                        }
                                        disabled={currentPcs <= minPcs}
                                        className="w-6 h-6 rounded-md border border-[#F6C58E] bg-[#FDF6EC] text-[#2B1204] flex items-center justify-center disabled:opacity-40 cursor-pointer"
                                      >
                                        <Minus size={11} />
                                      </button>
                                      <input
                                        type="number"
                                        min={minPcs}
                                        value={currentPcs}
                                        onChange={(e) => {
                                          const val = parseInt(e.target.value, 10);
                                          setSelectedPaquetPieces(prev => ({
                                            ...prev,
                                            [product.id]: isNaN(val) ? minPcs : Math.max(minPcs, val)
                                          }));
                                        }}
                                        className="w-12 sm:w-14 text-center py-0.5 border border-[#F6C58E] rounded-md text-xs font-extrabold text-[#2B1204] focus:outline-none"
                                      />
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setSelectedPaquetPieces(prev => ({
                                            ...prev,
                                            [product.id]: currentPcs + 1
                                          }))
                                        }
                                        className="w-6 h-6 rounded-md border border-[#F6C58E] bg-[#FDF6EC] text-[#2B1204] flex items-center justify-center cursor-pointer"
                                      >
                                        <Plus size={11} />
                                      </button>
                                    </div>
                                  </div>
                                  <div className="text-sm sm:text-lg font-black text-[#C20A0A]">
                                    {computedPrice.toLocaleString('fr-FR')} FCFA{' '}
                                    <span className="text-[11px] font-medium text-[#2B1204]/60">({currentPcs} pcs)</span>
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="text-sm sm:text-lg font-black text-[#C20A0A]">
                            {product.price}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row gap-2">
                        <button
                          onClick={() => handleAddToCart(product, false)}
                          className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-[#5DBA68] text-white shadow-md'
                              : 'bg-[#FDF6EC] hover:bg-[#F8BE40]/40 text-[#2B1204] border border-[#2B1204]/20 shadow-xs'
                          }`}
                          title="Ajouter au panier"
                        >
                          {isAdded ? (
                            <>
                              <Check size={15} /> Ajouté !
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={15} /> Panier
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => handleAddToCart(product, true)}
                          className="flex-1 py-2.5 px-3 rounded-lg font-extrabold text-xs bg-[#2B1204] hover:bg-[#F8BE40] text-[#F8BE40] hover:text-[#2B1204] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                          title="Commander immédiatement"
                        >
                          <Zap size={15} />
                          <span>Commander</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
        )}

        {filteredProducts.length === 0 && !loading && (
          <div className="text-center py-16 bg-white rounded-3xl border border-[#F6C58E] p-8">
            <p className="text-[#2B1204]/70 font-medium mb-4">Aucune douceur ne correspond à votre recherche.</p>
            <button
              onClick={() => setSelectedCategory('Tous')}
              className="px-7 py-3 bg-[#2B1204] text-[#F8BE40] rounded-lg text-xs font-extrabold hover:bg-[#431E09] transition cursor-pointer shadow-md"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
