import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Heart, Clock } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

const categories = [
  { name: 'Gâteaux de Fête', image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { name: 'Pâtisserie Fine', image: 'https://images.unsplash.com/photo-1761594606868-1c577b10f69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { name: 'Macarons & Douceurs', image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { name: 'Gâteaux de Mariage', image: 'https://images.unsplash.com/photo-1696236927117-d7041454d199?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
];

const featuredProducts = [
  { id: 1, name: 'Fraisier Signature', price: '75 FCFA', image: 'https://images.unsplash.com/photo-1582180834946-f3d376b18376?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 2, name: 'Opéra Chocolat & Café', price: '65 FCFA', image: 'https://images.unsplash.com/photo-1640794334523-b299f14d28db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 3, name: 'Macarons Assortis', price: '45 FCFA', image: 'https://images.unsplash.com/photo-1728566842903-59fbc50b951b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
  { id: 4, name: 'Entremet Pistache Royale', price: '80 FCFA', image: 'https://images.unsplash.com/photo-1761594606868-1c577b10f69e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=1080' },
];

const testimonials = [
  { name: 'Amina K.', text: 'Les créations de Lê Ci ont sublimé notre fête de famille. Un goût raffiné et une présentation sublime !' },
  { name: 'Karim B.', text: 'Le paiement Orange Money direct et instantané sans attente est un vrai bonheur. La tarte était exquise.' },
  { name: 'Sarah L.', text: 'Une précision artisanale rare. On ressent toute la passion et les ingrédients nobles dans chaque bouchée.' },
];

export function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section avec Tarte rose et blanche sur marbre.png dès le haut */}
      <section className="relative min-h-[92vh] sm:min-h-screen pt-32 sm:pt-40 pb-20 flex items-center justify-center overflow-hidden">
        {/* Photo de couverture */}
        <div className="absolute inset-0 z-0">
          <img
            src="/tarte-cover.png"
            alt="Tarte signature Les Douceurs de Lê Ci"
            className="w-full h-full object-cover object-center scale-105 transform animate-fade-in"
          />
          {/* Overlay dégradé sombre et luxueux pour lisibilité absolue du header et du texte */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/45 to-black/85" />
        </div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 text-center max-w-4xl px-4 sm:px-6"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-[#D4AF37] text-xs font-bold uppercase tracking-widest mb-6"
          >
            <Sparkles size={14} /> Haute Pâtisserie Artisanale
          </motion.div>

          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
            Les Douceurs de Lê Ci
          </h1>

          <p className="text-lg sm:text-2xl text-gray-200 mb-10 max-w-2xl mx-auto font-light leading-relaxed drop-shadow">
            L'excellence de la pâtisserie d'art et des créations gourmandes pour vos moments inoubliables.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/catalogue"
              className="w-full sm:w-auto px-8 py-4 bg-[#D4AF37] hover:bg-[#c29d2b] text-white font-bold rounded-2xl shadow-xl shadow-[#D4AF37]/30 transition-all inline-flex items-center justify-center gap-2 transform hover:-translate-y-0.5"
            >
              Commander en ligne
              <ArrowRight size={20} />
            </Link>

            <Link
              to="/sur-commande"
              className="w-full sm:w-auto px-8 py-4 bg-white/15 hover:bg-white/25 text-white font-bold rounded-2xl backdrop-blur-md border border-white/30 transition-all inline-flex items-center justify-center"
            >
              Gâteau sur mesure
            </Link>
          </div>

          {/* Garanties en bas du Hero */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-3 gap-4 text-white/80 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-1">
              <ShieldCheck size={20} className="text-[#D4AF37]" />
              <span className="text-[11px] font-semibold">Paiement Mobile Instantané</span>
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

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Découverte</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-2 mb-3">Nos Collections Artisanales</h2>
          <p className="text-gray-600 max-w-xl mx-auto">Découvrez nos différentes gammes de douceurs faites avec des ingrédients nobles.</p>
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
              <Link to="/catalogue">
                <div className="relative aspect-square rounded-3xl overflow-hidden mb-4 shadow-sm group-hover:shadow-xl transition-all">
                  <ImageWithFallback
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <h3 className="absolute bottom-5 left-5 right-5 text-white font-bold text-lg text-center">{category.name}</h3>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-white py-20 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between mb-12 gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-[#D4AF37]">Sélection du Chef</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">Les Incontournables de Lê Ci</h2>
            </div>
            <Link
              to="/catalogue"
              className="text-sm font-bold text-[#D4AF37] hover:text-[#c29d2b] inline-flex items-center gap-1"
            >
              Voir tout le catalogue <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((p) => (
              <div key={p.id} className="bg-[#FAF8F5] rounded-3xl overflow-hidden border border-gray-200/60 p-4 flex flex-col justify-between group">
                <div className="aspect-square rounded-2xl overflow-hidden mb-4 bg-gray-100">
                  <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base mb-1">{p.name}</h3>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-sm font-extrabold text-[#D4AF37]">{p.price}</span>
                    <Link
                      to="/catalogue"
                      className="px-3.5 py-1.5 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-800 hover:bg-[#D4AF37] hover:text-white hover:border-[#D4AF37] transition"
                    >
                      Commander
                    </Link>
                  </div>
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
