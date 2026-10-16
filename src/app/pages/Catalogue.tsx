import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, Check, Zap, MessageCircle, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';

const categories = ['Tous', 'Gâteaux', 'Macarons', 'Viennoiseries', 'Traditionnels', 'Mariage'];

// Les prix commencent à partir de 500 FCFA
const allProducts = [
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
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  const { addToCart, openCart } = useCart();

  const filteredProducts = allProducts.filter(product => {
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
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37] mb-2 inline-block">Haute Pâtisserie Artisanale</span>
          <h1 className="text-4xl font-extrabold text-gray-900 mb-3">Nos Créations Gourmandes</h1>
          <p className="text-gray-600 max-w-xl mx-auto">
            Commandez vos délices dès <strong>500 FCFA</strong> avec validation automatique instantanée par Orange Money.
          </p>
        </motion.div>

        {/* Barre de recherche */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-xl mx-auto mb-8"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Rechercher une pâtisserie (ex: Fraisier, Croissant, Macarons)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white shadow-sm text-sm"
            />
          </div>
        </motion.div>

        {/* Catégories */}
        <div className="flex flex-wrap justify-center gap-2 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all shadow-sm ${
                selectedCategory === category
                  ? 'bg-[#111827] text-[#D4AF37] shadow-md scale-105'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grille de Produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product) => {
            const isAdded = addedProductId === product.id;
            return (
              <motion.div
                key={product.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col border border-gray-100 group"
              >
                <div className="relative h-64 overflow-hidden bg-gray-100">
                  <ImageWithFallback
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm text-gray-900 text-[11px] font-bold px-3 py-1 rounded-full shadow-sm">
                    {product.category}
                  </div>
                  <div className="absolute bottom-4 right-4 bg-[#111827]/90 backdrop-blur-sm text-[#D4AF37] font-black text-sm px-3.5 py-1.5 rounded-xl shadow-lg border border-[#D4AF37]/30">
                    {product.price}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#D4AF37] transition">
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500 mb-4">
                      Préparé chaque matin avec des ingrédients nobles et pur beurre artisanal.
                    </p>
                  </div>

                  <div className="pt-4 border-t border-gray-100 flex items-center gap-2">
                    {/* Bouton Ajouter au panier */}
                    <button
                      onClick={() => handleAddToCart(product, false)}
                      className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check size={15} />
                          <span>Ajouté !</span>
                        </>
                      ) : (
                        <>
                          <ShoppingBag size={15} />
                          <span>Ajouter au panier</span>
                        </>
                      )}
                    </button>

                    {/* Bouton Commander Direct */}
                    <button
                      onClick={() => handleAddToCart(product, true)}
                      className="py-2.5 px-4 rounded-xl text-xs font-extrabold bg-[#D4AF37] hover:bg-[#c29d2b] text-white shadow-md transition-all flex items-center justify-center gap-1"
                      title="Commander immédiatement"
                    >
                      <span>Commander</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-base">Aucune pâtisserie trouvée pour cette recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
