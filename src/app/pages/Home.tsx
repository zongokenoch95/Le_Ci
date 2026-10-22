import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { ShoppingBag, ArrowRight, ShieldCheck, Heart, Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

// Les 4 catégories issues des dossiers du dossier img/
const categories = [
  { 
    name: 'Douceurs salées', 
    image: '/products/salee_1.jpeg',
    description: 'Feuilletés croustillants, croissants salés et pastels dorés pour vos pauses et cocktails.'
  },
  { 
    name: 'Douceurs sucrées', 
    image: '/products/sucree_1.jpeg',
    description: 'Éclairs onctueux, macarons raffinés, tartelettes aux fruits et mignardises d\'exception.'
  },
  { 
    name: 'Gâteaux', 
    image: '/products/gateau_1.jpeg',
    description: 'Fraisiers signatures, forêts noires, layer cakes et pièces montées de célébration.'
  },
  { 
    name: 'Paquets', 
    image: '/products/paquet_1.jpeg',
    description: 'Box gourmandes à offrir, packs fêtes familiales et assortiments de dégustation.'
  },
];

const featuredProducts = [
  { 
    id: 1, 
    name: 'Plateau Feuilletés Salés Apéritifs', 
    category: 'Douceurs salées',
    price: '2 500 FCFA', 
    numericPrice: 2500, 
    image: '/products/salee_1.jpeg' 
  },
  { 
    id: 4, 
    name: 'Éclairs Fondants Chocolat & Ganache Dorée', 
    category: 'Douceurs sucrées',
    price: '1 500 FCFA', 
    numericPrice: 1500, 
    image: '/products/sucree_1.jpeg' 
  },
  { 
    id: 12, 
    name: 'Fraisier Signature Suprême Crème Mousseline', 
    category: 'Gâteaux',
    price: '6 500 FCFA', 
    numericPrice: 6500, 
    image: '/products/gateau_1.jpeg' 
  },
  { 
    id: 20, 
    name: 'Box Découverte Douceurs de Lê Ci', 
    category: 'Paquets',
    price: '5 000 FCFA', 
    numericPrice: 5000, 
    image: '/products/paquet_1.jpeg' 
  },
];

const testimonials = [
  { name: 'Amina K.', text: 'Les créations de Lê Ci ont sublimé notre fête de famille. Un goût raffiné et une présentation sublime !' },
  { name: 'Karim B.', text: 'Le paiement Orange Money direct et instantané sans attente est un vrai bonheur. La qualité est toujours au rendez-vous.' },
  { name: 'Sarah L.', text: 'Une précision artisanale rare. On ressent toute la passion et les ingrédients nobles dans chaque bouchée.' },
];

export function Home() {
  const { addToCart, openCart } = useCart();

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
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/85" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 text-center max-w-4xl px-4 sm:px-6"
        >
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
            Les Douceurs de Lê Ci
          </h1>

          <p className="text-lg sm:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow">
            L'excellence de la pâtisserie d'art et des créations gourmandes pour vos moments inoubliables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {/* Bouton "Commander une douceur" */}
            <Link
              to="/nos-douceurs"
              className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#c29d2b] text-black hover:text-white font-extrabold rounded-2xl shadow-xl shadow-[#D4AF37]/30 transition-all inline-flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-base"
            >
              <span>Commander une douceur</span>
              <ArrowRight size={20} />
            </Link>

            <Link
              to="/sur-commande"
              className="w-full sm:w-auto px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl backdrop-blur-md border border-white/30 transition-all inline-flex items-center justify-center text-base"
            >
              Gâteaux personnalisés
            </Link>
          </div>

          {/* Garanties en bas du Hero */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-3 gap-4 text-white/80 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={20} className="text-[#D4AF37]" />
              <span className="text-[11px] font-semibold">Paiement Instantané OM</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Heart size={20} className="text-[#D4AF37]" />
              <span className="text-[11px] font-semibold">100% Fait Main</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Clock size={20} className="text-[#D4AF37]" />
              <span className="text-[11px] font-semibold">Fraîcheur Quotidienne</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Les 4 Catégories de Produits */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Découverte</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Nos 4 Univers Gourmands</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Explorez nos douceurs salées, douceurs sucrées, gâteaux d'exception et paquets cadeaux.</p>
        </motion.div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <motion.div
              key={category.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group cursor-pointer"
            >
              <Link to="/nos-douceurs">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-3 shadow-md group-hover:shadow-2xl transition-all">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 text-center">
                    <h3 className="text-white font-extrabold text-lg tracking-wide mb-1">{category.name}</h3>
                    <span className="text-[11px] text-[#F3E5AB] font-semibold group-hover:underline inline-flex items-center gap-1">
                      Découvrir la carte <ArrowRight size={12} />
                    </span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Sélection des Incontournables */}
      <section className="bg-white py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Sélection du Chef</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">Les Incontournables de Lê Ci</h2>
            </div>
            <Link
              to="/nos-douceurs"
              className="text-sm font-bold text-[#D4AF37] hover:text-[#c29d2b] inline-flex items-center gap-1"
            >
              Voir toutes nos douceurs <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div key={p.id} className="bg-[#FAF8F5] rounded-3xl overflow-hidden border border-gray-200/60 p-4 flex flex-col justify-between group shadow-sm hover:shadow-xl transition-all">
                <div>
                  <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                    <img 
                      src={p.image} 
                      alt={p.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500" 
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1 rounded-full border border-gray-200">
                    {p.category}
                  </span>
                  <h3 className="font-bold text-gray-900 text-sm mt-2 mb-1">{p.name}</h3>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-200/60 flex items-center justify-between gap-2">
                  <span className="text-sm font-black text-[#D4AF37]">{p.price}</span>
                  <button
                    onClick={() => {
                      addToCart({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        numericPrice: p.numericPrice,
                        image: p.image,
                        category: p.category
                      }, 1);
                      openCart();
                    }}
                    className="px-3.5 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                  >
                    <ShoppingBag size={13} />
                    <span>Commander une douceur</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Témoignages</span>
          <h2 className="text-3xl font-extrabold text-gray-900 mt-1">Ce que disent nos clients</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <div key={i} className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative">
              <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">"{t.text}"</p>
              <div className="font-bold text-gray-900 text-sm">{t.name}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
