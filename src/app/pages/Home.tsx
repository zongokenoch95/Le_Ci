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
  Leaf,
  Plus,
  Minus
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
  },
  {
    id: 14,
    name: 'Orsia — Gâteau Riz Local & Teedo',
    category: 'Gâteaux',
    tag: 'Saveur Locale',
    tagBg: 'bg-[#F8BE40] text-[#2B1204]',
    price: '10 500 FCFA',
    numericPrice: 10500,
    image: '/products/gateau_8.jpeg',
    description:
      'Alliance délicate du riz local et de la poudre de pain de singe (teedo) pour un moelleux incomparable.',
    isCake: true
  },
  {
    id: 5,
    name: 'Assortiment Choux & Tartelettes Fines',
    category: 'Douceurs sucrées',
    tag: 'Pâtisserie Fine',
    tagBg: 'bg-[#EE7362] text-white',
    price: '6 000 FCFA',
    numericPrice: 6000,
    image: '/products/sucree_3.jpeg',
    description:
      'Choux craquelins garnis de crème légère et tartelettes dorées aux fruits frais.',
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

  const { items: cartItems, addToCart, updateQuantity } = useCart();
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

  const getSignatureCartQuantity = (productId: number) => {
    const found = cartItems.find((c) => c.id === `prod-${productId}`);
    return found ? found.quantity : 0;
  };

  const handleAddSignatureToCart = (item: (typeof signatureCreations)[0], immediate = false) => {
    const currentQty = getSignatureCartQuantity(item.id);
    if (!immediate || currentQty === 0) {
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
    }
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
      {/* 1. HERO SECTION (Ancienne configuration avec Charte Graphique)            */}
      {/* ========================================================================= */}
      <section className="relative min-h-[92vh] sm:min-h-screen pt-32 sm:pt-40 pb-20 flex items-center justify-center overflow-hidden">
        {/* Photo de couverture (baniere1) */}
        <div className="absolute inset-0 z-0">
          <img
            src="/img/baniere1.jpg"
            alt="Création signature Les Douceurs de Lê Ci"
            className="w-full h-full object-cover object-center scale-105 transform animate-fade-in"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#2B1204]/75 via-[#2B1204]/50 to-[#2B1204]/85" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="relative z-10 text-center max-w-4xl px-4 sm:px-6"
        >
          {/* Titre Hero : Bienvenue chez / Les Douceurs de / Lê-Ci */}
          <h1 className="flex flex-col items-center justify-center mb-5">
            <span className="font-gotham-pro text-2xl sm:text-4xl md:text-5xl font-bold text-[#FDF8F2] tracking-wide leading-tight drop-shadow-2xl">
              Bienvenue chez
            </span>
            <span className="font-gotham-pro text-2xl sm:text-4xl md:text-5xl font-bold text-[#FDF8F2] tracking-wide leading-tight drop-shadow-2xl mt-1">
              Les Douceurs de
            </span>
            <img
              src="/img/le-ci-signature.png"
              alt="Lê-Ci"
              className="h-44 sm:h-64 md:h-80 w-auto object-contain mt-2 drop-shadow-[0_6px_28px_rgba(248,190,64,0.65)] select-none"
            />
            <span className="sr-only">Lê-Ci</span>
          </h1>

          {/* Slogan */}
          <p className="font-fredoka text-sm sm:text-base md:text-lg text-[#FDF8F2] font-normal mb-8 max-w-2xl mx-auto leading-relaxed drop-shadow">
            La croisée entre la santé consciente, le plaisir gourmand et la fierté locale.
          </p>

          <div className="flex justify-center items-center">
            <button
              onClick={() => scrollToSection('nos-produits')}
              className="px-10 py-4 bg-transparent hover:bg-[#F8BE40]/15 text-[#F8BE40] font-extrabold rounded-full shadow-[0_8px_24px_rgba(0,0,0,0.25)] transition-all inline-flex items-center justify-center gap-2.5 transform hover:-translate-y-0.5 text-sm cursor-pointer border-2 border-[#F8BE40]"
            >
              <span>Commander</span>
              <ArrowRight size={18} />
            </button>
          </div>

          {/* Garanties en bas du Hero */}
          <div className="mt-14 pt-8 border-t border-white/15 grid grid-cols-3 gap-4 text-white/90 max-w-xl mx-auto">
            <div className="flex flex-col items-center gap-1.5">
              <ShieldCheck size={22} className="text-[#F8BE40]" />
              <span className="text-[11px] font-bold tracking-wide">Produits locaux</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Heart size={22} className="text-[#F8BE40]" />
              <span className="text-[11px] font-bold tracking-wide">Healthy</span>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Clock size={22} className="text-[#F8BE40]" />
              <span className="text-[11px] font-bold tracking-wide">Produits frais</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================================= */}
      {/* 2. SECTION NOS DOUCEURS (Ancienne configuration en grille : Image + Titre) */}
      {/* ========================================================================= */}
      <section
        id="nos-produits"
        className="max-w-7xl lg:max-w-5xl xl:max-w-6xl mx-auto px-4 sm:px-6 lg:px-14 xl:px-20 py-20 sm:py-24"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#2B1204] tracking-tight">
            Nos Douceurs
          </h2>
          <p className="font-barcelony text-2xl sm:text-3xl text-[#C20A0A] max-w-2xl mx-auto mt-3 leading-relaxed">
            Explorez toutes nos créations confectionnées avec des ingrédients frais et locaux.
          </p>
        </motion.div>

        {/* Grille des 4 Catégories (présentation encadrée blanc : Image + Titre) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-7">
          {productCategories.map((cat, idx) => {
            const targetUrl =
              cat.id === 'gateaux'
                ? '/sur-commande'
                : `/catalogue?category=${encodeURIComponent(cat.categoryQuery)}`;
            return (
              <motion.div
                key={cat.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="h-full"
              >
                <Link
                  to={targetUrl}
                  className="group relative bg-white p-3 sm:p-5 rounded-2xl border-2 border-[#F8BE40] overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 flex flex-col justify-between h-full cursor-pointer block transform hover:-translate-y-1.5"
                >
                  {/* Photo encadrée de blanc */}
                  <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#FDF6EC]">
                    <ImageWithFallback
                      src={cat.image}
                      alt={cat.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>

                  {/* Titre centré */}
                  <div className="pt-4 pb-1 text-center">
                    <h3 className="font-adapt text-xs sm:text-sm font-bold uppercase tracking-[0.1em] text-[#2B1204] group-hover:text-[#5DBA68] transition">
                      {cat.title}
                    </h3>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 2.BIS SECTION SIGNATURE DE LA MAISON — PRÉSENTATION DE CARTE ÉDITORIALE    */}
      {/* Fond Brun Cacao #2B1204 & Cartes blanches encadrées (Modèle de référence)  */}
      {/* ========================================================================= */}
      <section
        id="signature-maison"
        className="bg-[#2B1204] py-16 sm:py-24 text-[#FDF8F2] relative overflow-hidden"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12 sm:mb-16"
          >
            <h2 className="font-adapt text-2xl sm:text-4xl font-extrabold uppercase tracking-[0.14em] text-[#FDF8F2]">
              Signature de la maison
            </h2>
          </motion.div>

          {/* Grille des cartes produits : contour doré, Nom -> Prix -> Description -> Boutons pilules verts */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-7">
            {signatureCreations.map((item, idx) => {
              const cartQty = getSignatureCartQuantity(item.id);
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.45, delay: idx * 0.08 }}
                  className="bg-white text-[#2B1204] p-3 sm:p-5 rounded-2xl border-2 border-[#F8BE40] shadow-2xl transition-all duration-300 flex flex-col justify-between group hover:-translate-y-1"
                >
                  <div>
                    {/* 1. Photo */}
                    <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-[#FDF8F2]">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>

                    {/* 2. Nom */}
                    <h3 className="font-adapt text-center text-xs sm:text-base font-extrabold text-[#2B1204] mt-4 mb-1.5 line-clamp-2 min-h-[2.2rem] sm:min-h-[2.6rem] flex items-center justify-center">
                      {item.name}
                    </h3>

                    {/* 3. Prix */}
                    <div className="font-adapt text-center text-sm sm:text-base font-black text-[#C20A0A] mb-2">
                      {item.numericPrice.toLocaleString('fr-FR')} FCFA
                    </div>

                    {/* 4. Description */}
                    <p className="font-fredoka text-[11px] sm:text-xs text-center text-[#2B1204]/75 font-normal mb-4 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* 5. Boutons pilules (Ajouter / compteur simple + Commander vert moringa) */}
                  <div className="pt-1 flex flex-col gap-2">
                    {item.isCake ? (
                      <>
                        <Link
                          to="/sur-commande"
                          className="w-full py-1.5 sm:py-2 px-3 rounded-full font-bold text-[11px] sm:text-xs border border-[#F8BE40] text-[#2B1204] hover:bg-[#F8BE40]/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer text-center"
                        >
                          <Cake size={13} />
                          <span>Personnaliser</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleAddSignatureToCart(item, true)}
                          className="w-full py-1.5 sm:py-2 px-3 rounded-full font-extrabold text-[11px] sm:text-xs bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border border-[#F8BE40] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag size={13} />
                          <span>Commander</span>
                        </button>
                      </>
                    ) : (
                      <>
                        {cartQty > 0 ? (
                          <div className="w-full py-0.5 px-2.5 rounded-full border border-[#F8BE40] bg-[#FDF8F2] flex items-center justify-between">
                            <button
                              type="button"
                              onClick={() => updateQuantity(`prod-${item.id}`, -1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[#2B1204] hover:text-[#C20A0A] font-bold transition cursor-pointer"
                              aria-label="Diminuer la quantité"
                            >
                              <Minus size={12} strokeWidth={2.5} />
                            </button>
                            <span className="font-adapt text-xs sm:text-sm font-black text-[#2B1204]">
                              {cartQty}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(`prod-${item.id}`, 1)}
                              className="w-6 h-6 rounded-full flex items-center justify-center text-[#2B1204] hover:text-[#C20A0A] font-bold transition cursor-pointer"
                              aria-label="Augmenter la quantité"
                            >
                              <Plus size={12} strokeWidth={2.5} />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddSignatureToCart(item, false)}
                            className="w-full py-1.5 sm:py-2 px-3 rounded-full font-bold text-[11px] sm:text-xs border border-[#F8BE40] text-[#2B1204] hover:bg-[#F8BE40]/15 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <span>Ajouter</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleAddSignatureToCart(item, true)}
                          className="w-full py-1.5 sm:py-2 px-3 rounded-full font-extrabold text-[11px] sm:text-xs bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border border-[#F8BE40] shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <ShoppingBag size={13} />
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
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] font-extrabold text-xs shadow-lg transition cursor-pointer hover:scale-105"
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
                className="bg-white rounded-2xl p-6 sm:p-7 border-2 border-[#F8BE40] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col sm:flex-row gap-5 items-center"
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
                    className="w-full sm:w-auto self-start px-6 py-2.5 rounded-full bg-[#F8BE40] hover:bg-[#e5ac2e] text-[#2B1204] border-2 border-[#F8BE40] text-xs font-extrabold shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
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
