import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Check, Zap, ShieldCheck, Loader2 } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { getProducts, Product } from '../services/api';

const categories = ['Tous', 'Gâteaux', 'Macarons', 'Viennoiseries', 'Traditionnels', 'Mariage'];

// Produits de repli par défaut (prix >= 500 FCFA)
const fallbackProducts = [
  { id: 101, name: 'Croissant Beurre Pur Artisanal', category: 'Viennoiseries', price: '500 FCFA', numericPrice: 500, image: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 102, name: 'Pain au Chocolat Feuilleté', category: 'Viennoiseries', price: '600 FCFA', numericPrice: 600, image: 'https://images.unsplash.com/photo-1530610476181-d83430b64dcd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 3, name: 'Macarons Assortis (Boîte Découverte)', category: 'Macarons', price: '1 500 FCFA', numericPrice: 1500, image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 8, name: 'Macarons Chocolat Intense', category: 'Macarons', price: '1 800 FCFA', numericPrice: 1800, image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 6, name: 'Baklava Premium Miel & Pistache', category: 'Traditionnels', price: '2 000 FCFA', numericPrice: 2000, image: 'https://images.unsplash.com/photo-1701357462333-4924d0ad6132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 7, name: 'Tarte aux Fruits Frais', category: 'Gâteaux', price: '2 500 FCFA', numericPrice: 2500, image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 2, name: 'Opéra Classique Chocolat & Café', category: 'Gâteaux', price: '3 000 FCFA', numericPrice: 3000, image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 9, name: 'Forêt Noire Grand Cru', category: 'Gâteaux', price: '3 200 FCFA', numericPrice: 3200, image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 1, name: 'Fraisier Signature Prestige', category: 'Gâteaux', price: '3 500 FCFA', numericPrice: 3500, image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 4, name: 'Entremet Pistache Royale', category: 'Gâteaux', price: '4 000 FCFA', numericPrice: 4000, image: 'https://images.unsplash.com/photo-1761594606868-1c577b10f69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 5, name: 'Gâteau de Mariage Pièce Montée', category: 'Mariage', price: '15 000 FCFA', numericPrice: 15000, image: 'https://images.unsplash.com/photo-1696236927117-d7041454d199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
];

export function Catalogue() {
  const [productsList, setProductsList] = useState<any[]>(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
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
            image: p.image || 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080',
            description: p.description
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
    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (product: any, openDrawer = false) => {
    addToCart(product, 1);
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
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Notre Carte Sucrée</span>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mt-2 mb-4">Catalogue des Délices</h1>
          <p className="text-base text-gray-600 max-w-2xl mx-auto">
            Chaque création est préparée à la commande avec des ingrédients nobles. Commandez en quelques clics et payez instantanément via Orange Money.
          </p>
          <div className="inline-flex items-center gap-2 mt-4 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 text-[#8C6D23] text-xs font-semibold">
            <ShieldCheck size={14} /> Tarifs accessibles à partir de 500 FCFA
          </div>
        </motion.div>

        {/* Barre de Recherche et Filtres */}
        <div className="mb-10 space-y-6">
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un délice, macaron, gâteau..."
              className="w-full pl-11 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all ${
                  selectedCategory === category
                    ? 'bg-[#D4AF37] text-white shadow-md shadow-[#D4AF37]/30 scale-105'
                    : 'bg-white text-gray-700 border border-gray-200/80 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Grille de Produits */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-3">
            <Loader2 className="animate-spin text-[#D4AF37]" size={36} />
            <span className="text-sm font-medium">Chargement des délices artisanaux...</span>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
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

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#D4AF37] transition">
                            {product.name}
                          </h3>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 line-clamp-2">
                          {product.description || 'Création artisanale raffinée avec des ingrédients d excellence.'}
                        </p>
                        <div className="text-xl font-extrabold text-[#D4AF37]">
                          {product.price}
                        </div>
                      </div>
                    </div>

                    <div className="p-6 pt-0 flex gap-2">
                      <button
                        onClick={() => handleAddToCart(product, false)}
                        className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                          isAdded
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                            : 'bg-gray-900 hover:bg-black text-white shadow-md'
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check size={16} /> Ajouté !
                          </>
                        ) : (
                          <>
                            <ShoppingBag size={16} /> Ajouter au panier
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleAddToCart(product, true)}
                        className="py-3 px-4 rounded-2xl font-bold text-xs bg-[#D4AF37] hover:bg-[#c29d2b] text-white flex items-center justify-center gap-1 shadow-md shadow-[#D4AF37]/20"
                        title="Commander tout de suite"
                      >
                        <Zap size={16} />
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
            <p className="text-gray-500 font-medium mb-4">Aucune gourmandise ne correspond à votre recherche.</p>
            <button
              onClick={() => { setSelectedCategory('Tous'); setSearchQuery(''); }}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl text-xs font-bold hover:bg-black transition"
            >
              Réinitialiser les filtres
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
