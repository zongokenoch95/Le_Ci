import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Search, ShoppingBag, X, Zap, MessageCircle, ShieldCheck } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { createOrder } from '../services/api';

const categories = ['Tous', 'Gâteaux', 'Macarons', 'Traditionnels', 'Mariage'];

const allProducts = [
  { id: 1, name: 'Fraisier Premium', category: 'Gâteaux', price: '75 FCFA', numericPrice: 75, image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 2, name: 'Opéra Classique', category: 'Gâteaux', price: '65 FCFA', numericPrice: 65, image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 3, name: 'Macarons Assortis', category: 'Macarons', price: '45 FCFA', numericPrice: 45, image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 4, name: 'Entremet Pistache', category: 'Gâteaux', price: '80 FCFA', numericPrice: 80, image: 'https://images.unsplash.com/photo-1761594606868-1c577b10f69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 5, name: 'Gâteau de Mariage', category: 'Mariage', price: '350 FCFA', numericPrice: 350, image: 'https://images.unsplash.com/photo-1696236927117-d7041454d199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 6, name: 'Baklava Premium', category: 'Traditionnels', price: '55 FCFA', numericPrice: 55, image: 'https://images.unsplash.com/photo-1701357462333-4924d0ad6132?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 7, name: 'Tarte aux Fruits', category: 'Gâteaux', price: '60 FCFA', numericPrice: 60, image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 8, name: 'Macarons Chocolat', category: 'Macarons', price: '48 FCFA', numericPrice: 48, image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 9, name: 'Forêt Noire', category: 'Gâteaux', price: '70 FCFA', numericPrice: 70, image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
];

export function Catalogue() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal de commande
  const [activeProduct, setActiveProduct] = useState<any>(null);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredProducts = allProducts.filter(product => {
    const matchesCategory = selectedCategory === 'Tous' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleOpenOrder = (product: any) => {
    setActiveProduct(product);
  };

  const handleCreatePaymentOrder = async () => {
    if (!customerName || !customerPhone) {
      alert('Veuillez renseigner votre nom et votre numéro de téléphone.');
      return;
    }
    setIsSubmitting(true);
    try {
      const order = await createOrder({
        customerName,
        customerPhone,
        items: [{
          id: activeProduct.id,
          name: activeProduct.name,
          price: activeProduct.numericPrice,
          quantity: 1,
          image: activeProduct.image
        }],
        montantTotal: activeProduct.numericPrice,
        modePaiement: 'orange_money',
        notes: `Commande directe depuis le catalogue`
      });

      setActiveProduct(null);
      navigate(`/paiement/${order.id}`);
    } catch (err: any) {
      alert(err.message || 'Erreur création commande');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsAppOrder = () => {
    const phoneNumber = '21671123456';
    const message = `Bonjour, je souhaite commander : ${activeProduct?.name} (${activeProduct?.price})`;
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    setActiveProduct(null);
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
          <p className="text-gray-600 max-w-xl mx-auto">Commandez vos douceurs avec validation automatique instantanée par Orange Money.</p>
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
              placeholder="Rechercher une pâtisserie..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#D4AF37] bg-white shadow-sm"
            />
          </div>
        </motion.div>

        {/* Filtres catégories */}
        <div className="flex flex-wrap justify-center gap-2 mb-10">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-5 py-2.5 rounded-full text-xs font-bold transition ${
                selectedCategory === category
                  ? 'bg-[#111827] text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Grille de produits */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map((product, idx) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col group"
            >
              <div className="relative h-64 overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-extrabold text-[#D4AF37] shadow-sm">
                  {product.price}
                </span>
              </div>

              <div className="p-6 flex flex-col flex-1 justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">{product.category}</span>
                  <h3 className="text-xl font-bold text-gray-900 mt-1 mb-2">{product.name}</h3>
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    <ShieldCheck size={14} className="text-emerald-500" /> Validation instantanée
                  </div>
                  <button
                    onClick={() => handleOpenOrder(product)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] hover:bg-[#c29d2b] text-white text-xs font-bold rounded-xl transition shadow-md shadow-[#D4AF37]/20"
                  >
                    <ShoppingBag size={14} /> Commander
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* MODAL DE CHECKOUT & PAIEMENT */}
      <AnimatePresence>
        {activeProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative border border-gray-100"
            >
              <button
                onClick={() => setActiveProduct(null)}
                className="absolute top-5 right-5 p-2 text-gray-400 hover:text-gray-900 rounded-full hover:bg-gray-100 transition"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <img
                  src={activeProduct.image}
                  alt={activeProduct.name}
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{activeProduct.name}</h3>
                  <p className="text-sm font-extrabold text-[#D4AF37]">{activeProduct.price}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Votre Nom Complet</label>
                  <input
                    type="text"
                    placeholder="Ex: Amina Khelifi"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Numéro Mobile (Orange Money)</label>
                  <input
                    type="tel"
                    placeholder="Ex: 70 12 34 56"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] text-sm"
                  />
                </div>
              </div>

              {/* Bouton Paiement Auto (Orange Money) */}
              <div className="space-y-3">
                <button
                  onClick={handleCreatePaymentOrder}
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 bg-[#FF6600] hover:bg-[#e65c00] text-white font-bold rounded-xl transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 text-sm"
                >
                  <Zap size={18} />
                  {isSubmitting ? 'Création de la commande...' : 'Payer par Orange Money (Validation Automatique)'}
                </button>

                <button
                  onClick={handleWhatsAppOrder}
                  className="w-full py-3 px-6 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] font-bold rounded-xl transition flex items-center justify-center gap-2 text-sm border border-[#25D366]/30"
                >
                  <MessageCircle size={18} />
                  Commander sur WhatsApp
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
