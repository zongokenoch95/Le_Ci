import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  ShieldCheck,
  Heart,
  Clock,
  Sparkles,
  Cake,
  Package,
  UtensilsCrossed,
  Copy,
  CheckCircle2,
  ChevronRight,
  Crown,
  ShoppingBag,
  Check,
  Leaf
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';

// Créations phares : Section Signature de la Maison (affichées en 2 colonnes)
const signatureCreations = [
  {
    id: 12,
    name: 'Arzanier — Gâteau Moringa & Bissap',
    category: 'Gâteaux',
    tag: 'Signature Moringa',
    tagBg: 'bg-[#5DBA68] text-white',
    price: '10 500 FCFA',
    numericPrice: 10500,
    image: '/products/gateau_1.jpeg',
    description:
      'Notre création emblématique alliant la fraîcheur végétale du moringa local et l’intensité fruitée du bissap.',
    isCake: true
  },
  {
    id: 1,
    name: 'Plateau Feuilletés Salés Apéritifs',
    category: 'Douceurs salées',
    tag: 'Douceur Salée',
    tagBg: 'bg-[#F8BE40] text-[#2B1204]',
    price: '5 000 FCFA',
    numericPrice: 5000,
    image: '/products/salee_1.jpeg',
    description:
      'Assortiment doré au four : 20 mini pizzas, 13 nems croustillants et 11 pastels savoureux faits main.',
    isCake: false
  },
  {
    id: 4,
    name: 'Coffret Douceurs Sucrées & Ganache Cacao',
    category: 'Douceurs sucrées',
    tag: 'Brun Cacao',
    tagBg: 'bg-[#2B1204] text-[#F8BE40]',
    price: '5 000 FCFA',
    numericPrice: 5000,
    image: '/products/sucree_1.jpeg',
    description:
      'Mélange gourmand de 20 mini brownies au cacao intense, 13 mini cakes dorés et 11 choux à la crème.',
    isCake: false
  },
  {
    id: 20,
    name: 'Box Découverte Les Douceurs de Lê-Ci',
    category: 'Paquets',
    tag: 'Rouge Gourmand',
    tagBg: 'bg-[#C20A0A] text-white',
    price: '5 000 FCFA',
    numericPrice: 5000,
    image: '/products/paquet_1.jpeg',
    description:
      'Coffret généreux réunissant nos meilleures douceurs artisanales dans un écrin chaleureux.',
    isCake: false
  }
];

// 4 Catégories officielles vendues par la maison Lê-Ci (affichées en 2 colonnes)
const productCategories = [
  {
    id: 'salees',
    title: 'Douceurs salées',
    categoryQuery: 'Douceurs salés',
    tag: 'Apéritif & Réceptions',
    accentColor: '#F8BE40',
    description:
      'Plateaux de feuilletés croustillants pur beurre, mini pizzas, nems et pastels dorés pour sublimer vos réceptions.',
    image: '/products/salee_1.jpeg',
    badge: 'Assortiments salés',
    icon: UtensilsCrossed
  },
  {
    id: 'sucrees',
    title: 'Douceurs sucrées',
    categoryQuery: 'Douceurs sucrées',
    tag: 'Pâtisserie Fine',
    accentColor: '#EE7362',
    description:
      'Mini brownies au cacao, choux à la crème, macarons et tartelettes fruitées confectionnés avec passion.',
    image: '/products/sucree_3.jpeg',
    badge: 'Créations sucrées',
    icon: Sparkles
  },
  {
    id: 'paquets',
    title: 'Paquets & Coffrets',
    categoryQuery: 'Paquets',
    tag: 'Cadeaux Gourmands',
    accentColor: '#C20A0A',
    description:
      'Paquets personnalisables de votre douceur préférée (à partir du minimum de pièces souhaité).',
    image: '/products/paquet_2.jpeg',
    badge: 'Format sur-mesure',
    icon: Package
  },
  {
    id: 'gateaux',
    title: 'Gâteaux de Fête',
    categoryQuery: 'Gâteaux',
    tag: 'Anniversaire & Mariage',
    accentColor: '#5DBA68',
    description:
      'Arzanier au moringa & bissap, Orsia au riz & teedo, Mokas, Forêt noire et pièces montées de mariage.',
    image: '/products/gateau_1.jpeg',
    badge: 'Sur commande',
    icon: Cake
  }
];

// Section Promotions & Événements aux couleurs de la Charte (Rouge gourmand, Jaune doré, Vert moringa, Brun cacao)
const promoEvents = [
  {
    id: 1,
    type: 'promo',
    badge: '✦ GRANDE PROMO ✦',
    badgeColor: 'bg-[#F8BE40] text-[#C20A0A] border-[#F8BE40]',
    title: 'Offre Spéciale Bienvenue -10%',
    subtitle: 'Sur votre première commande en ligne',
    description:
      'Rejoignez notre programme de fidélité et profitez immédiatement de votre remise gourmande au moment de commander.',
    promoCode: 'DOUCEUR10',
    actionText: 'Activer ma réduction',
    actionLink: '/fidelite',
    image: '/products/sucree_1.jpeg'
  },
  {
    id: 2,
    type: 'moringa',
    badge: '✦ LE BURKINA DANS TON ASSIETTE ✦',
    badgeColor: 'bg-[#5DBA68] text-white border-[#5DBA68]',
    title: 'Connaissez-vous le Arzanier ?',
    subtitle: 'Gâteau signature au Moringa & Bissap',
    description:
      'Découvrez la pâtisserie autrement : l’alliance unique de la naturalité du moringa, de l’intensité du bissap et du savoir-faire artisanal.',
    actionText: 'Commander un Arzanier',
    actionLink: '/sur-commande',
    image: '/products/gateau_1.jpeg'
  },
  {
    id: 3,
    type: 'custom',
    badge: '✦ OFFRE DOUCEURS ✦',
    badgeColor: 'bg-[#2B1204] text-[#F8BE40] border-[#2B1204]',
    title: 'Gâteaux d’Anniversaire & Mariage',
    subtitle: 'De 6 parts jusqu’aux pièces montées 5 étages',
    description:
      'Composez votre gâteau sur-mesure : choix de la saveur, du nombre de parts, des suppléments et de votre message personnalisé.',
    actionText: 'Personnaliser mon gâteau',
    actionLink: '/sur-commande',
    image: '/products/gateau_8.jpeg'
  },
  {
    id: 4,
    type: 'event',
    badge: '✦ ROUGE GOURMAND ✦',
    badgeColor: 'bg-[#C20A0A] text-white border-[#C20A0A]',
    title: 'Paquets Festifs & Réceptions',
    subtitle: 'Buffets salés et sucrés clé-en-main',
    description:
      'Idéal pour vos réunions, fêtes de famille et événements : composez vos paquets de mini pizzas, nems, pastels ou mignardises.',
    actionText: 'Découvrir nos paquets',
    actionLink: '/catalogue?category=Paquets',
    image: '/products/paquet_5.jpeg'
  }
];

// Mémoire de navigation SPA : s'affiche à chaque ouverture du lien / rechargement du site,
// sans bloquer les retours internes vers l'accueil durant la navigation.
let hasShownSplashInMemory = false;

export function Home() {
  const [copiedCode, setCopiedCode] = useState(false);
  const [addedProductId, setAddedProductId] = useState<number | null>(null);

  // 1. État de la page de chargement (Splash Screen) pour atterrir sur la page d'accueil
  const [showSplash, setShowSplash] = useState<boolean>(() => !hasShownSplashInMemory);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);

  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (!showSplash) return;

    const interval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 4;
      });
    }, 65);

    const timer = setTimeout(() => {
      hasShownSplashInMemory = true;
      setShowSplash(false);
    }, 2100);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [showSplash]);

  const handleDismissSplash = () => {
    hasShownSplashInMemory = true;
    setShowSplash(false);
  };

  const handleAddSignatureToCart = (item: (typeof signatureCreations)[0], immediate = false) => {
    addToCart(
      {
        id: item.id,
        name: item.name,
        price: item.price,
        numericPrice: item.numericPrice,
        image: item.image,
        category: item.category,
        description: item.description,
        catalogModel: item.name,
        isCake: item.isCake
      },
      1
    );
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
    <div className="min-h-screen bg-[#FDF8F2] text-[#2B1204]">
      {/* ========================================================================= */}
      {/* 0. PAGE DE CHARGEMENT DU SITE (SPLASH SCREEN CHARTE GRAPHIQUE 2026)       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="le-ci-splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.55, ease: 'easeInOut' }}
            className="fixed inset-0 z-[100] bg-[#2B1204] flex flex-col items-center justify-between p-6 sm:p-10 overflow-hidden select-none"
          >
            {/* Liseré supérieur aux 6 couleurs officielles de la Charte */}
            <div className="w-full max-w-md h-2 rounded-full overflow-hidden flex shadow-lg">
              <div className="flex-1 bg-[#F8BE40]" />
              <div className="flex-1 bg-[#C20A0A]" />
              <div className="flex-1 bg-[#EE7362]" />
              <div className="flex-1 bg-[#F6C58E]" />
              <div className="flex-1 bg-[#FFFFFF]" />
              <div className="flex-1 bg-[#5DBA68]" />
            </div>

            {/* Halos lumineux d'arrière-plan (Jaune doré, Vert moringa, Rouge gourmand) */}
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-[#F8BE40]/15 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-[#5DBA68]/15 blur-3xl pointer-events-none" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-[#C20A0A]/10 blur-3xl pointer-events-none" />

            {/* Contenu central : Logo, Signature & Barre de progression */}
            <div className="relative z-10 flex flex-col items-center text-center max-w-lg my-auto">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
                className="relative mb-6"
              >
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full bg-[#FDF8F2]/10 border-2 border-[#F8BE40] p-3 flex items-center justify-center shadow-[0_0_40px_rgba(248,190,64,0.3)]">
                  <img
                    src="/logo.png"
                    alt="Les Douceurs de Lê-Ci"
                    className="w-full h-full object-contain drop-shadow-xl"
                  />
                </div>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="font-barcelony text-5xl sm:text-7xl text-[#F8BE40] mb-3 drop-shadow-lg"
              >
                Les Douceurs de Lê-Ci
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35, duration: 0.5 }}
                className="font-fredoka text-xs sm:text-sm text-[#F6C58E] tracking-wide max-w-md mb-8 leading-relaxed"
              >
                Artisanat pâtissier • Moringa, Bissap & Saveurs authentiques du Burkina Faso
              </motion.p>

              {/* Barre de chargement dorée */}
              <div className="w-64 sm:w-80 bg-white/10 h-2.5 rounded-full overflow-hidden border border-[#F8BE40]/30 p-0.5 mb-3">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F8BE40] via-[#EE7362] to-[#5DBA68]"
                  style={{ width: `${Math.min(100, loadingProgress)}%` }}
                />
              </div>

              <div className="flex items-center gap-3 text-[11px] font-bold text-[#FDF8F2]/80 tracking-widest uppercase">
                <span>Préparation de vos douceurs...</span>
                <span className="text-[#F8BE40]">{Math.min(100, loadingProgress)}%</span>
              </div>

              <button
                type="button"
                onClick={handleDismissSplash}
                className="mt-7 px-6 py-2.5 rounded-lg bg-[#F8BE40] hover:bg-[#f5b120] text-[#2B1204] font-extrabold text-xs tracking-wide transition shadow-lg cursor-pointer inline-flex items-center gap-2"
              >
                <span>Entrer dans la pâtisserie</span>
                <ArrowRight size={14} />
              </button>
            </div>

            {/* Pied du Splash Screen */}
            <div className="relative z-10 text-[11px] text-[#F6C58E]/70 font-corsiva italic text-center">
              « La croisée entre la santé consciente, le plaisir gourmand et la fierté locale »
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 1. HERO SECTION (Brun Cacao #2B1204, Jaune Doré #F8BE40, Vert Moringa)    */}
      {/* ========================================================================= */}
      <section className="relative min-h-[88vh] sm:min-h-[94vh] pt-32 sm:pt-40 pb-20 flex items-center justify-center overflow-hidden">
        {/* Photo de couverture avec voile Brun Cacao chaleureux */}
        <div className="absolute inset-0 z-0">
          <img
            src="/tarte-cover.png"
            alt="Création signature Les Douceurs de Lê-Ci"
            className="w-full h-full object-cover object-center scale-105 transform animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2B1204]/90 via-[#2B1204]/65 to-[#2B1204]/95" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 text-center max-w-4xl px-4 sm:px-6"
        >
          {/* Badge Vert Moringa / Produits locaux */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#5DBA68]/20 border border-[#5DBA68]/60 text-[#FDF8F2] text-xs font-bold mb-5 backdrop-blur-xs">
            <Leaf size={14} className="text-[#5DBA68]" />
            <span>Pâtisserie Artisanale & Saveurs Locales (Moringa, Bissap, Teedo)</span>
          </div>

          {/* Titre en police signature Barcelony / Monotype Corsiva */}
          <h1 className="font-barcelony text-6xl sm:text-8xl md:text-9xl text-[#F8BE40] tracking-wide mb-4 leading-tight drop-shadow-2xl">
            Les Douceurs de Lê-Ci
          </h1>

          {/* Slogan en police Fredoka (typographie éditoriale principale de la charte) */}
          <p className="font-fredoka text-sm sm:text-base md:text-lg text-[#FDF8F2] font-normal mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>

          <div className="flex flex-wrap justify-center items-center gap-4">
            {/* Bouton CTA principal en Jaune doré #F8BE40 et texte Brun cacao #2B1204 (Charte page 5) */}
            <button
              onClick={() => scrollToSection('nos-produits')}
              className="px-9 py-4 bg-[#F8BE40] hover:bg-[#f5b120] text-[#2B1204] font-extrabold rounded-lg shadow-2xl transition-all inline-flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 text-sm cursor-pointer border-2 border-[#F8BE40]"
            >
              <span>Commander</span>
              <ArrowRight size={18} />
            </button>

            <Link
              to="/sur-commande"
              className="px-8 py-4 bg-[#C20A0A] hover:bg-[#a50808] text-white font-extrabold rounded-lg shadow-xl transition-all inline-flex items-center justify-center gap-2 transform hover:-translate-y-0.5 text-sm cursor-pointer"
            >
              <Cake size={18} />
              <span>Gâteau sur-mesure</span>
            </Link>
          </div>

          {/* Garanties en bas du Hero */}
          <div className="mt-14 pt-8 border-t border-[#F6C58E]/25 grid grid-cols-3 gap-4 text-[#FDF8F2] max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-1.5">
              <Leaf size={22} className="text-[#5DBA68]" />
              <span className="text-[11px] font-bold tracking-wide">Produits locaux</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Heart size={22} className="text-[#EE7362]" />
              <span className="text-[11px] font-bold tracking-wide">Healthy & Équilibré</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock size={22} className="text-[#F8BE40]" />
              <span className="text-[11px] font-bold tracking-wide">Fraîcheur du four</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* BANDEAU DES 3 ASSOCIATIONS COULEURS DE LA CHARTE (CHARTE2.jpeg Page 6)    */}
      {/* ========================================================================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            to="/catalogue"
            className="bg-[#2B1204] text-[#F8BE40] py-5 px-6 rounded-xl shadow-lg border border-[#F8BE40]/30 text-center font-adapt font-black text-base sm:text-lg tracking-wider uppercase hover:scale-[1.02] transition transform"
          >
            OFFRE DOUCEURS
          </Link>
          <Link
            to="/fidelite"
            className="bg-[#F8BE40] text-[#C20A0A] py-5 px-6 rounded-xl shadow-lg border border-[#2B1204]/10 text-center font-adapt font-black text-base sm:text-lg tracking-wider uppercase hover:scale-[1.02] transition transform"
          >
            GRANDE PROMO
          </Link>
          <Link
            to="/sur-commande"
            className="bg-[#5DBA68] text-white py-5 px-6 rounded-xl shadow-lg text-center font-fredoka font-bold text-sm sm:text-base hover:scale-[1.02] transition transform flex items-center justify-center"
          >
            Connaissez-vous le Arzanier ?
          </Link>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION NOS DOUCEURS — AFFICHAGE EN 2 COLONNES                         */}
      {/* ========================================================================= */}
      <section
        id="nos-produits"
        className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-16 sm:py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 sm:mb-16"
        >
          <span className="inline-block px-3.5 py-1 rounded-full bg-[#F6C58E]/50 text-[#2B1204] text-xs font-extrabold uppercase tracking-wider mb-2">
            Savoir-faire artisanal
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-[#2B1204] tracking-tight">
            Nos Douceurs
          </h2>
          <p className="font-barcelony text-2xl sm:text-3xl text-[#C20A0A] max-w-2xl mx-auto mt-3 leading-relaxed">
            Explorez toutes nos créations confectionnées avec des ingrédients frais et locaux.
          </p>
        </motion.div>

        {/* Grille des Catégories en 2 COLONNES (grid-cols-2) */}
        <div className="grid grid-cols-2 gap-4 sm:gap-8">
          {productCategories.map((cat, idx) => {
            const targetUrl =
              cat.id === 'gateaux'
                ? '/sur-commande'
                : `/catalogue?category=${encodeURIComponent(cat.categoryQuery)}`;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.45, delay: idx * 0.08 }}
                className="h-full"
              >
                <Link
                  to={targetUrl}
                  className="group relative bg-white rounded-2xl overflow-hidden border-2 border-[#F6C58E]/60 hover:border-[#2B1204] shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full cursor-pointer transform hover:-translate-y-1"
                >
                  {/* Photo représentative de la catégorie */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-[#FDF6EC]">
                    <ImageWithFallback
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <span
                      className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-extrabold shadow-xs"
                      style={{
                        backgroundColor: cat.accentColor,
                        color: cat.accentColor === '#F8BE40' ? '#2B1204' : '#FFFFFF'
                      }}
                    >
                      {cat.tag}
                    </span>
                  </div>

                  {/* Corps de la carte */}
                  <div className="p-4 sm:p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base sm:text-xl font-black text-[#2B1204] group-hover:text-[#C20A0A] transition mb-1.5">
                        {cat.title}
                      </h3>
                      <p className="hidden sm:block text-xs text-[#2B1204]/75 font-normal leading-relaxed mb-4 line-clamp-2">
                        {cat.description}
                      </p>
                    </div>

                    {/* Bouton Découvrir à coin légèrement arrondi */}
                    <div className="w-full py-2.5 sm:py-3 px-3 sm:px-5 rounded-lg bg-[#2B1204] group-hover:bg-[#F8BE40] text-[#F8BE40] group-hover:text-[#2B1204] font-extrabold text-xs transition-all duration-300 flex items-center justify-center gap-2 shadow-xs">
                      <span>Découvrir</span>
                      <ArrowRight
                        size={14}
                        className="group-hover:translate-x-1 transition-transform"
                      />
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.BIS SECTION SIGNATURE DE LA MAISON — PRODUITS AFFICHÉS EN 2 COLONNES     */}
      {/* Fond Brun Cacao #2B1204 & Accents Jaune Doré #F8BE40 (Charte Page 5)       */}
      {/* ========================================================================= */}
      <section
        id="signature-maison"
        className="bg-[#2B1204] py-16 sm:py-24 text-[#FDF8F2] relative overflow-hidden border-y-4 border-[#F8BE40]"
      >
        {/* Lueurs d'ambiance Jaune doré & Vert moringa */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#F8BE40]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#5DBA68]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <span className="inline-block px-3.5 py-1 rounded-full bg-[#F8BE40] text-[#2B1204] text-xs font-black uppercase tracking-wider mb-3">
              Fierté locale & Gourmandise
            </span>
            <h2 className="text-3xl sm:text-5xl font-black text-[#F8BE40] tracking-tight">
              Signature de la maison
            </h2>
            <p className="font-barcelony text-2xl sm:text-3xl text-[#F6C58E] max-w-2xl mx-auto mt-3 leading-relaxed">
              Découvrez les créations emblématiques de la pâtisserie Lê-Ci
            </p>
          </motion.div>

          {/* Grille des produits phares en 2 COLONNES (grid-cols-2) */}
          <div className="grid grid-cols-2 gap-4 sm:gap-8">
            {signatureCreations.map((item, idx) => {
              const isAdded = addedProductId === item.id;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="bg-[#FDF8F2] text-[#2B1204] rounded-2xl overflow-hidden border-2 border-[#F8BE40]/40 hover:border-[#F8BE40] shadow-xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* Photo de la création signature */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#F6C58E]/30">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <span
                        className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-extrabold shadow-xs ${item.tagBg}`}
                      >
                        {item.tag}
                      </span>
                    </div>

                    {/* Titre, Description & Prix */}
                    <div className="p-4 sm:p-6">
                      <h3 className="text-sm sm:text-xl font-black text-[#2B1204] leading-snug line-clamp-2 mb-1.5">
                        {item.name}
                      </h3>
                      <p className="hidden sm:block text-xs text-[#2B1204]/75 font-normal leading-relaxed line-clamp-2 mb-3">
                        {item.description}
                      </p>
                      <div className="text-[#C20A0A] text-sm sm:text-lg font-black mt-1">
                        {item.price}
                      </div>
                    </div>
                  </div>

                  {/* Boutons d'action */}
                  <div className="p-4 sm:p-6 pt-0 flex flex-col sm:flex-row gap-2">
                    {item.isCake ? (
                      <Link
                        to="/sur-commande"
                        className="w-full py-2.5 sm:py-3 px-4 rounded-lg font-extrabold text-xs bg-[#F8BE40] hover:bg-[#f5b120] text-[#2B1204] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
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
                          className={`flex-1 py-2.5 px-3 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                            isAdded
                              ? 'bg-[#5DBA68] text-white shadow-md'
                              : 'bg-[#FDF6EC] hover:bg-[#F6C58E]/50 text-[#2B1204] border border-[#2B1204]/20'
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
                          className="flex-1 py-2.5 px-3 rounded-lg font-black text-xs bg-[#2B1204] hover:bg-[#431E09] text-[#F8BE40] shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-lg bg-[#F8BE40] hover:bg-[#f5b120] text-[#2B1204] font-extrabold text-xs shadow-lg transition cursor-pointer hover:scale-105"
            >
              <Crown size={15} className="text-[#2B1204]" />
              <span>Découvrir plus</span>
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 3. SECTION PROMOTIONS ET ÉVÈNEMENTS (2 COLONNES)                          */}
      {/* ========================================================================= */}
      <section
        id="promotions-evenements"
        className="bg-gradient-to-b from-[#FDF8F2] via-[#FDF6EC] to-[#FDF8F2] py-16 sm:py-24"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="text-3xl sm:text-5xl font-black text-[#2B1204] tracking-tight">
              Promotions et Événements
            </h2>
            <p className="font-barcelony text-2xl sm:text-3xl text-[#C20A0A] max-w-2xl mx-auto mt-3 leading-relaxed">
              Soyez au courant de nos offres gourmandes et créations du terroir.
            </p>
          </motion.div>

          {/* Grille des Promotions & Événements en 2 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
            {promoEvents.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-[#F6C58E]/60 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center"
              >
                {/* Image miniature */}
                <div className="w-full sm:w-40 h-40 rounded-xl overflow-hidden shrink-0 relative shadow-xs">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Contenu */}
                <div className="flex-1 flex flex-col justify-between w-full">
                  <div>
                    <span
                      className={`inline-block px-3 py-1 rounded-md text-[10px] font-black border uppercase tracking-wider mb-2.5 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-[#2B1204] mb-1 leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-xs font-bold text-[#C20A0A] mb-2">{item.subtitle}</p>
                    <p className="text-xs text-[#2B1204]/75 font-normal leading-relaxed mb-4">
                      {item.description}
                    </p>

                    {/* Bloc Code promo interactif si présent */}
                    {item.promoCode && (
                      <div className="mb-4 inline-flex items-center gap-2 p-2 px-3 rounded-lg bg-[#FDF6EC] border border-[#F8BE40]">
                        <span className="text-[11px] font-bold text-[#2B1204]">Code :</span>
                        <code className="text-xs font-mono font-extrabold text-[#C20A0A] tracking-wider">
                          {item.promoCode}
                        </code>
                        <button
                          onClick={() => handleCopyCode(item.promoCode!)}
                          className="p-1 hover:bg-[#F8BE40]/40 rounded-md text-[#2B1204] transition cursor-pointer"
                          title="Copier le code"
                        >
                          {copiedCode ? (
                            <CheckCircle2 size={14} className="text-[#5DBA68]" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bouton */}
                  <Link
                    to={item.actionLink}
                    className="w-full sm:w-auto self-start px-5 py-2.5 rounded-lg bg-[#2B1204] hover:bg-[#F8BE40] text-[#F8BE40] hover:text-[#2B1204] text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
