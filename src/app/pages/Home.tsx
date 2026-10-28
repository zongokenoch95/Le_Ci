import { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, 
  ShieldCheck, 
  Heart, 
  Clock, 
  Sparkles, 
  Gift, 
  Cake, 
  Package, 
  UtensilsCrossed, 
  Copy, 
  CheckCircle2, 
  ChevronRight,
  Crown,
  ShoppingBag,
  Check
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';

// Créations phares : Section Signature de la Maison (Notion 28/10/26)
const signatureCreations = [
  {
    id: 12,
    name: "Fraisier Signature Suprême",
    category: "Gâteaux",
    tag: "Gâteau Signature",
    price: "6 500 FCFA",
    numericPrice: 6500,
    image: "/products/gateau_1.jpeg",
    description: "Génoise aérienne, fraises fraîches locales et crème mousseline onctueuse à la vanille Bourbon.",
    isCake: true
  },
  {
    id: 1,
    name: "Plateau Feuilletés Salés Apéritifs",
    category: "Douceurs salées",
    tag: "Douceur Salée",
    price: "2 500 FCFA",
    numericPrice: 2500,
    image: "/products/salee_1.jpeg",
    description: "Feuilletés croustillants au fromage fondant et épices douces, pur beurre fait main.",
    isCake: false
  },
  {
    id: 4,
    name: "Éclairs Fondants Ganache Dorée",
    category: "Douceurs sucrées",
    tag: "Douceur Sucrée",
    price: "1 500 FCFA",
    numericPrice: 1500,
    image: "/products/sucree_1.jpeg",
    description: "Pâte à choux aérée garnie de ganache au chocolat grand cru et fine feuille d'or comestible.",
    isCake: false
  },
  {
    id: 20,
    name: "Box Découverte Douceurs de Lê Ci",
    category: "Paquets",
    tag: "Paquet Cadeau",
    price: "5 000 FCFA",
    numericPrice: 5000,
    image: "/products/paquet_1.jpeg",
    description: "Coffret d'exception réunissant nos meilleures douceurs sucrées et salées dans un écrin festif.",
    isCake: false
  }
];

// 4 Catégories officielles vendues par la maison Lê Ci
const productCategories = [
  {
    id: 'salees',
    title: 'Douceurs salées',
    categoryQuery: 'Douceurs salés',
    tag: 'Apéritif & Réceptions',
    description: 'Plateaux de feuilletés croustillants pur beurre, croissants salés farcis et pastels dorés pour sublimer vos buffets.',
    image: '/products/salee_1.jpeg',
    badge: '3 créations',
    icon: UtensilsCrossed
  },
  {
    id: 'sucrees',
    title: 'Douceurs sucrées',
    categoryQuery: 'Douceurs sucrées',
    tag: 'Pâtisserie Fine',
    description: 'Éclairs au chocolat grand cru, macarons d\'exception, choux craquelins et cupcakes fondants confectionnés avec amour.',
    image: '/products/sucree_3.jpeg',
    badge: '8 créations',
    icon: Sparkles
  },
  {
    id: 'paquets',
    title: 'Paquets & Coffrets',
    categoryQuery: 'Paquets',
    tag: 'Cadeaux Gourmands',
    description: 'Assortiments luxueux, coffrets dégustation prestige et packs festifs pensés pour gâter vos proches ou collaborateurs.',
    image: '/products/paquet_2.jpeg',
    badge: '7 assortiments',
    icon: Package
  },
  {
    id: 'gateaux',
    title: 'Gâteaux de Fête',
    categoryQuery: 'Gâteaux',
    tag: 'Cérémonies & Prestige',
    description: 'Fraisiers signatures, layer cakes gourmands, entremets miroir et créations personnalisées pour vos plus beaux événements.',
    image: '/products/gateau_1.jpeg',
    badge: '8 créations',
    icon: Cake
  }
];

// Section Promotions & Événements
const promoEvents = [
  {
    id: 1,
    type: 'promo',
    badge: '✦ Réduction Immédiate ✦',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    title: 'Offre Spéciale Bienvenue -10%',
    subtitle: 'Sur votre première commande en ligne',
    description: 'Créez votre compte sur notre espace fidélité et appliquez instantanément votre code privilège au moment de commander.',
    promoCode: 'DOUCEUR10',
    actionText: 'Activer ma réduction',
    actionLink: '/fidelite',
    image: '/products/sucree_1.jpeg'
  },
  {
    id: 2,
    type: 'custom',
    badge: '✦ Création Sur-Mesure ✦',
    badgeColor: 'bg-purple-100 text-[#581C87] border-purple-200',
    title: 'Gâteaux de Cérémonie Personnalisés',
    subtitle: 'Mariages, anniversaires & fêtes privées',
    description: 'Décrivez votre gâteau de rêve en 2 étapes simples : saveurs, nombre de parts, modèle photo et livraison soignée à domicile.',
    actionText: 'Personnaliser mon gâteau',
    actionLink: '/sur-commande',
    image: '/products/gateau_8.jpeg'
  },
  {
    id: 3,
    type: 'event',
    badge: '✦ Formule Traiteur ✦',
    badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
    title: 'Packs Festifs & Cocktails d\'Entreprise',
    subtitle: 'Buffets salés et sucrés clé-en-main',
    description: 'Profitez de tarifs dégressifs avantageux et d\'une mise en place sur mesure pour vos réunions, séminaires et célébrations.',
    actionText: 'Découvrir nos paquets',
    actionLink: '/catalogue?category=Paquets',
    image: '/products/paquet_5.jpeg'
  },
  {
    id: 4,
    type: 'event',
    badge: '✦ Événement Mensuel ✦',
    badgeColor: 'bg-rose-100 text-rose-900 border-rose-200',
    title: 'Samedi Dégustation des Nouveautés',
    subtitle: 'Chaque 1er samedi du mois (10h - 13h)',
    description: 'Venez savourer en avant-première nos nouvelles recettes sans gluten et douceurs aux fruits locaux avec notre cheffe pâtissière.',
    actionText: 'En savoir plus',
    actionLink: '/a-propos',
    image: '/products/sucree_4.jpeg'
  }
];

export function Home() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const handleAddSignatureToCart = (item: typeof signatureCreations[0], immediate = false) => {
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      numericPrice: item.numericPrice,
      image: item.image,
      category: item.category,
      description: item.description,
      catalogModel: item.name,
      isCake: item.isCake
    }, 1);
    setAddedProductId(item.id);
    setTimeout(() => setAddedProductId(null), 1500);
    if (immediate) {
      navigate('/panier');
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* ========================================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================================= */}
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
          {/* Titre en police calligraphique Barcelony */}
          <h1 className="font-barcelony text-6xl sm:text-8xl md:text-9xl text-white tracking-wide mb-3 leading-tight drop-shadow-2xl">
            Les Douceurs de Lê Ci
          </h1>

          {/* Slogan en police épurée Gotham Pro */}
          <p className="font-gotham text-sm sm:text-base md:text-lg text-purple-100 font-normal mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>

          <div className="flex justify-center items-center">
            {/* Bouton "Commander" en Pill (rounded-full) */}
            <button
              onClick={() => scrollToSection('nos-produits')}
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
      {/* 2. SECTION NOS PRODUITS (CATÉGORIES DE PRODUITS VENDUS) */}
      {/* Instruction 8 : Affiche les catégories vendues SANS afficher les produits */}
      {/* ========================================================================= */}
      <section id="nos-produits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-[#581C87] uppercase tracking-wider mb-3">
            <Sparkles size={13} /> Univers Gourmands
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Nos produits
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-light mt-3 leading-relaxed">
            Explorez nos 4 familles de douceurs artisanales confectionnées à la commande avec des ingrédients frais, sains et locaux.
          </p>
        </motion.div>

        {/* Grille des 4 Catégories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {productCategories.map((cat, idx) => {
            const IconComp = cat.icon;
            const targetUrl = cat.id === 'gateaux' ? '/sur-commande' : `/catalogue?category=${encodeURIComponent(cat.categoryQuery)}`;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="h-full"
              >
                {/* Carte entière cliquable (Notion #16) */}
                <Link
                  to={targetUrl}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-purple-100/80 shadow-md hover:shadow-2xl hover:border-purple-300 transition-all duration-300 flex flex-col justify-between h-full cursor-pointer block transform hover:-translate-y-1.5"
                >
                  {/* Photo représentative de la catégorie */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-purple-50">
                    <ImageWithFallback
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                    
                    {/* Badge en haut */}
                    <span className="absolute top-3.5 left-3.5 px-3 py-1 bg-white/95 backdrop-blur-md rounded-full text-[10px] font-extrabold text-[#581C87] shadow-sm uppercase tracking-wider border border-purple-100">
                      {cat.tag}
                    </span>

                    <span className="absolute bottom-3.5 right-3.5 px-2.5 py-0.5 bg-black/50 backdrop-blur-md rounded-full text-[10px] font-semibold text-white">
                      {cat.badge}
                    </span>

                    <div className="absolute bottom-3 left-3 flex items-center gap-2 text-white">
                      <div className="w-8 h-8 rounded-full bg-[#581C87]/90 flex items-center justify-center text-white shadow">
                        <IconComp size={16} />
                      </div>
                      <h3 className="text-lg font-extrabold drop-shadow-md">
                        {cat.title}
                      </h3>
                    </div>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <p className="text-xs sm:text-sm text-gray-600 font-light leading-relaxed mb-6">
                      {cat.description}
                    </p>

                    {/* Bouton Pill visuel pour explorer la catégorie */}
                    <div
                      className="w-full py-3 px-5 rounded-full bg-purple-50 group-hover:bg-[#581C87] text-[#581C87] group-hover:text-white font-bold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-sm border border-purple-200 group-hover:border-[#581C87]"
                    >
                      <span>{cat.id === 'gateaux' ? 'Personnaliser mon gâteau' : 'Découvrir la sélection'}</span>
                      <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Boutons d'action centraux sous les catégories */}
        <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/catalogue"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-sm shadow-xl shadow-purple-950/20 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <span>Voir tout notre catalogue</span>
            <ArrowRight size={16} />
          </Link>

          <Link
            to="/sur-commande"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white hover:bg-purple-50 text-[#581C87] font-extrabold text-sm border-2 border-[#581C87] transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Cake size={16} />
            <span>Personnaliser un gâteau</span>
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.BIS SECTION SIGNATURE DE LA MAISON (Notion 28/10/26) */}
      {/* Les créations phares (douceurs, paquets ou gâteaux) de la pâtisserie */}
      {/* ========================================================================= */}
      <section id="signature-maison" className="bg-gradient-to-b from-purple-950 via-[#3B0764] to-[#2E0249] py-20 sm:py-24 text-white relative overflow-hidden">
        {/* Lueur d'ambiance dorée / violette */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-[#D4AF37] to-amber-300 text-purple-950 uppercase tracking-widest mb-3 shadow-lg shadow-amber-900/30">
              <Crown size={14} className="text-purple-950" /> Créations Phares
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Signature de la maison
            </h2>
            <p className="text-sm sm:text-base text-purple-200/90 max-w-2xl mx-auto font-light mt-3 leading-relaxed">
              Découvrez les créations emblématiques de la pâtisserie Lê Ci : des recettes d'exception préparées avec passion pour sublimer vos moments inoubliables.
            </p>
          </motion.div>

          {/* Grille des 4 créations phares */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {signatureCreations.map((item, idx) => {
              const isAdded = addedProductId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-3xl overflow-hidden border border-white/15 hover:border-[#D4AF37]/50 shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1.5"
                >
                  <div>
                    {/* Photo de la création signature */}
                    <div className="relative aspect-square overflow-hidden bg-purple-900/40">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      {/* Tag Signature */}
                      <span className="absolute top-3 left-3 px-3 py-1 bg-gradient-to-r from-[#D4AF37] to-amber-300 text-purple-950 text-[10px] font-black rounded-full uppercase tracking-wider shadow-md">
                        {item.tag}
                      </span>

                      {/* Catégorie */}
                      <span className="absolute top-3 right-3 px-2.5 py-0.5 bg-black/60 backdrop-blur-md rounded-full text-[10px] font-semibold text-white">
                        {item.category}
                      </span>

                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-base sm:text-lg font-black text-white drop-shadow leading-snug line-clamp-1">
                          {item.name}
                        </h3>
                        <div className="text-amber-300 text-sm font-black mt-0.5">
                          {item.price}
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <div className="p-5">
                      <p className="text-xs text-purple-100/80 font-light leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="p-5 pt-0 flex gap-2">
                    {item.isCake ? (
                      <Link
                        to="/sur-commande"
                        className="w-full py-2.5 px-4 rounded-full font-extrabold text-xs bg-gradient-to-r from-[#D4AF37] to-amber-300 hover:from-amber-300 hover:to-[#D4AF37] text-purple-950 shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer transform active:scale-95 text-center"
                      >
                        <Cake size={14} />
                        <span>Personnaliser</span>
                        <ArrowRight size={13} />
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleAddSignatureToCart(item, false)}
                          className={`flex-1 py-2.5 px-3 rounded-full font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-emerald-500 text-white shadow-md'
                              : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                          }`}
                        >
                          {isAdded ? (
                            <>
                              <Check size={14} /> Ajouté !
                            </>
                          ) : (
                            <>
                              <ShoppingBag size={14} /> Panier
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleAddSignatureToCart(item, true)}
                          className="flex-1 py-2.5 px-3 rounded-full font-black text-xs bg-gradient-to-r from-[#D4AF37] to-amber-300 hover:from-amber-300 hover:to-[#D4AF37] text-purple-950 shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <span>Commander</span>
                        </button>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Lien vers la catégorie Signature du catalogue */}
          <div className="mt-12 text-center">
            <Link
              to="/catalogue?category=Signature"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs border border-white/20 transition backdrop-blur-md cursor-pointer hover:scale-105"
            >
              <Crown size={15} className="text-[#D4AF37]" />
              <span>Voir toutes nos créations signatures dans le catalogue</span>
              <ArrowRight size={14} />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION PROMOTIONS ET ÉVÈNEMENTS */}
      {/* Instruction 9 : En dessous des catégories */}
      {/* ========================================================================= */}
      <section id="promotions-evenements" className="bg-gradient-to-b from-white via-purple-50/40 to-white py-20 sm:py-24 border-t border-purple-100/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-[#581C87] text-white uppercase tracking-wider mb-3 shadow-md shadow-purple-900/20">
              <Gift size={13} /> Offres & Privilèges
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Promotions et Événements
            </h2>
            <p className="text-sm sm:text-base text-gray-600 max-w-2xl mx-auto font-light mt-3 leading-relaxed">
              Profitez de nos offres exclusives, remises de fidélité et moments gourmands organisés par la maison Lê Ci.
            </p>
          </motion.div>

          {/* Grille des Promotions & Événements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {promoEvents.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-6 items-center"
              >
                {/* Image miniature */}
                <div className="w-full sm:w-44 h-44 rounded-2xl overflow-hidden shrink-0 relative shadow-sm">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-purple-950/15" />
                </div>

                {/* Contenu */}
                <div className="flex-1 flex flex-col justify-between w-full">
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider mb-2.5 ${item.badgeColor}`}>
                      {item.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 mb-1 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs font-semibold text-[#581C87] mb-2">
                      {item.subtitle}
                    </p>
                    <p className="text-xs text-gray-500 font-light leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Bloc Code promo interactif si présent */}
                    {item.promoCode && (
                      <div className="mb-4 inline-flex items-center gap-2 p-2 px-3 rounded-xl bg-purple-50 border border-purple-200">
                        <span className="text-[11px] font-bold text-gray-600">Code :</span>
                        <code className="text-xs font-mono font-extrabold text-[#581C87] tracking-wider">
                          {item.promoCode}
                        </code>
                        <button
                          onClick={() => handleCopyCode(item.promoCode!)}
                          className="p-1 hover:bg-purple-200 rounded-lg text-[#581C87] transition cursor-pointer"
                          title="Copier le code"
                        >
                          {copiedCode ? <CheckCircle2 size={14} className="text-emerald-600" /> : <Copy size={14} />}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bouton Pill */}
                  <Link
                    to={item.actionLink}
                    className="w-full sm:w-auto self-start px-6 py-2.5 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white text-xs font-bold shadow-md shadow-purple-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>{item.actionText}</span>
                    <ChevronRight size={14} />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>

        </div>
      </section>
    </div>
  );
}
