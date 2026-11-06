import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Cake,
  ArrowRight,
  Check,
  Upload,
  Sparkles,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { getProducts, getProductSubcategories, Product, PortionOption } from '../services/api';

interface CakeCatalogItem {
  id: number | string;
  name: string;
  image: string;
  subcategory: string;
  description?: string;
  price?: number;
  portions?: PortionOption[];
}

// Sous-catégories par défaut pour les gâteaux (Point 1 : Anniversaire, Mariage, Autres)
const defaultCakeSubcategories = ['Anniversaire', 'Mariage', 'Autres'];

// 8 Gâteaux par défaut du catalogue de la maison Lê Ci répartis par sous-catégorie (avec prix variables)
const fallbackCatalogCakes: CakeCatalogItem[] = [
  { id: 12, name: 'Fraisier Signature Suprême', image: '/products/gateau_1.jpeg', subcategory: 'Anniversaire', price: 12000 },
  { id: 13, name: 'Gâteau Festif Personnalisé Pâte d\'Amande', image: '/products/gateau_2.jpeg', subcategory: 'Anniversaire', price: 14000 },
  { id: 14, name: 'Forêt Noire Grand Cru Cacao & Cerises', image: '/products/gateau_3.jpeg', subcategory: 'Anniversaire', price: 13000 },
  { id: 15, name: 'Layer Cake Chocolat Praliné & Drip Caramel', image: '/products/gateau_4.jpeg', subcategory: 'Anniversaire', price: 15000 },
  { id: 18, name: 'Number Cake Décoré Fruits Frais & Macarons', image: '/products/gateau_7.jpeg', subcategory: 'Anniversaire', price: 16000 },
  { id: 19, name: 'Pièce Montée d\'Exception & Mariage Prestige', image: '/products/gateau_8.jpeg', subcategory: 'Mariage', price: 25000 },
  { id: 16, name: 'Entremet Miroir Fruits Rouges & Velours', image: '/products/gateau_5.jpeg', subcategory: 'Autres', price: 13500 },
  { id: 17, name: 'Red Velvet Cake Onctueux Cream Cheese', image: '/products/gateau_6.jpeg', subcategory: 'Autres', price: 12500 }
];

// Nombre de parts par défaut (6, 8, 10, 12, 15, 20 et + de 20 parts)
const defaultPortionsOptions = [
  { id: '6', label: '6 parts', price: 12000, desc: 'Petit comité (6 parts)' },
  { id: '8', label: '8 parts', price: 15000, desc: 'Format familial (8 parts)' },
  { id: '10', label: '10 parts', price: 20000, desc: 'Format festif (10 parts)' },
  { id: '12', label: '12 parts', price: 25000, desc: 'Belle tablée (12 parts)' },
  { id: '15', label: '15 parts', price: 30000, desc: 'Réception & fête (15 parts)' },
  { id: '20', label: '20 parts', price: 40000, desc: 'Grande célébration (20 parts)' },
  { id: 'plus-20', label: '+ de 20 parts', price: 50000, desc: 'Grand événement (+ de 20 parts)' }
];

function buildPortionsForBasePrice(basePrice = 12000) {
  const b = Math.max(5000, Number(basePrice) || 12000);
  const round500 = (n: number) => Math.round(n / 500) * 500;
  return [
    { id: '6', label: '6 parts', price: round500(b), desc: 'Petit comité (6 parts)' },
    { id: '8', label: '8 parts', price: round500(b * 1.25), desc: 'Format familial (8 parts)' },
    { id: '10', label: '10 parts', price: round500(b * 1.65), desc: 'Format festif (10 parts)' },
    { id: '12', label: '12 parts', price: round500(b * 2.0), desc: 'Belle tablée (12 parts)' },
    { id: '15', label: '15 parts', price: round500(b * 2.5), desc: 'Réception & fête (15 parts)' },
    { id: '20', label: '20 parts', price: round500(b * 3.3), desc: 'Grande célébration (20 parts)' },
    { id: 'plus-20', label: '+ de 20 parts', price: round500(b * 4.1), desc: 'Grand événement (+ de 20 parts)' }
  ];
}

// Saveurs signatures (Point 3 - suite)
const flavorOptions = [
  'Vanille Bourbon pure & crème veloutée',
  'Chocolat noir Grand Cru & praliné feuilleté',
  'Fraisier & coulis de fruits rouges frais',
  'Caramel au beurre salé & noisettes croquantes',
  'Mangue locale & Passion exotique (Signature Lê Ci)',
  'Pistache fine & framboises fraîches',
  'Red Velvet & glaçage cream cheese doux',
  'Citron meringué acidulé',
  'Autre saveur personnalisée'
];

function inferCakeSubcategory(name: string, sub?: string): string {
  if (sub && sub.trim()) {
    const clean = sub.trim();
    if (/autre/i.test(clean)) return 'Autres';
    return clean;
  }
  const lower = (name || '').toLowerCase();
  if (lower.includes('mariage') || lower.includes('pièce montée') || lower.includes('piece montee')) {
    return 'Mariage';
  }
  if (lower.includes('entremet') || lower.includes('red velvet')) {
    return 'Autres';
  }
  return 'Anniversaire';
}

export function CustomOrder() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Point 1 : Catégorie de gâteau (Anniversaire, Mariage, Autre évènement + sous-catégories créées par le gérant)
  const [cakeCategories, setCakeCategories] = useState<string[]>(defaultCakeSubcategories);
  const [cakeSubcatThemes, setCakeSubcatThemes] = useState<Record<string, { theme?: string; image?: string }>>({});
  const [selectedCakeCategory, setSelectedCakeCategory] = useState<string>('Anniversaire');
  const [customEventPrecision, setCustomEventPrecision] = useState<string>('');

  // Point 2 : Catalogue de gâteaux en fonction de la catégorie
  const [allCakes, setAllCakes] = useState<CakeCatalogItem[]>(fallbackCatalogCakes);
  const [modelType, setModelType] = useState<'catalog' | 'upload'>('catalog');
  const [selectedCatalogCake, setSelectedCatalogCake] = useState<string>(fallbackCatalogCakes[0].name);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Point 3 : Taille du gâteau (parts & prix) + Saveur
  const [selectedPortionId, setSelectedPortionId] = useState('10');
  const [selectedFlavor, setSelectedFlavor] = useState(flavorOptions[0]);
  const [customFlavorText, setCustomFlavorText] = useState('');

  // Point 4 : Message à écrire
  const [cakeInscriptionMessage, setCakeInscriptionMessage] = useState('');

  // Erreurs de validation
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    async function loadCakeData() {
      try {
        const [productsData, subcatsData] = await Promise.all([
          getProducts({ available: true }).catch(() => []),
          getProductSubcategories('Gâteaux').catch(() => [])
        ]);

        // Utiliser les sous-catégories de Gâteaux de la base de données (ou fallback par défaut)
        const mergedSubcats: string[] = [];
        const themesMap: Record<string, { theme?: string; image?: string }> = {};
        if (Array.isArray(subcatsData) && subcatsData.length > 0) {
          for (const s of subcatsData) {
            if (s.name && !mergedSubcats.includes(s.name)) {
              mergedSubcats.push(s.name);
            }
            if (s.name) {
              themesMap[s.name] = { theme: s.theme || '', image: s.image || '' };
            }
          }
        }
        if (mergedSubcats.length === 0) {
          mergedSubcats.push(...defaultCakeSubcategories);
        }

        // Extraire les gâteaux depuis la base de données
        let combinedCakes: CakeCatalogItem[] = [...fallbackCatalogCakes];
        if (Array.isArray(productsData) && productsData.length > 0) {
          const dbCakes = productsData
            .filter((p: Product) => p.category && /g[aâ]teau/i.test(p.category.trim()))
            .map((p: Product) => {
              let portions: PortionOption[] = [];
              if (p.portions && Array.isArray(p.portions)) {
                portions = p.portions;
              } else if (p.portions_json) {
                try {
                  portions = JSON.parse(p.portions_json);
                } catch (e) { }
              }
              const sub = inferCakeSubcategory(p.name, p.subcategory);
              if (sub && !mergedSubcats.includes(sub)) {
                mergedSubcats.push(sub);
              }
              return {
                id: p.id,
                name: p.name,
                image: p.image || '/products/gateau_1.jpeg',
                subcategory: sub,
                description: p.description || '',
                price: p.price,
                portions
              };
            });

          if (dbCakes.length > 0) {
            combinedCakes = dbCakes;
          }
        }

        // Ajouter les modèles de sous-catégorie dotés d'un thème et d'une image chargée par le gérant
        if (Array.isArray(subcatsData)) {
          for (const s of subcatsData) {
            if (s.image && s.name) {
              const modelName = s.theme ? `${s.name} — ${s.theme}` : `Modèle ${s.name}`;
              const alreadyInCatalog = combinedCakes.some(
                (c) => c.subcategory.toLowerCase() === s.name.toLowerCase() && c.image === s.image
              );
              if (!alreadyInCatalog) {
                combinedCakes.unshift({
                  id: `subcat-model-${s.id}`,
                  name: modelName,
                  image: s.image,
                  subcategory: s.name,
                  description: s.theme || ''
                });
              }
            }
          }
        }

        setAllCakes(combinedCakes);
        setCakeSubcatThemes(themesMap);
        setCakeCategories(mergedSubcats);
        if (mergedSubcats.length > 0 && !mergedSubcats.includes(selectedCakeCategory)) {
          setSelectedCakeCategory(mergedSubcats[0]);
        }
      } catch (err) {
        console.warn('Utilisation des gâteaux par défaut:', err);
      }
    }
    loadCakeData();
  }, []);

  // Gâteaux filtrés selon la catégorie sélectionnée au Point 1
  const cakesForSelectedCategory = allCakes.filter(
    (c) => c.subcategory.toLowerCase() === selectedCakeCategory.toLowerCase()
  );

  // Dès qu'on change de catégorie au Point 1, sélectionner automatiquement le 1er gâteau de cette catégorie
  useEffect(() => {
    if (cakesForSelectedCategory.length > 0) {
      const stillExists = cakesForSelectedCategory.some((c) => c.name === selectedCatalogCake);
      if (!stillExists) {
        setSelectedCatalogCake(cakesForSelectedCategory[0].name);
      }
    }
  }, [selectedCakeCategory, allCakes]);

  const setSingleError = (key: string, msg: string, elementId: string) => {
    setFieldErrors({ [key]: msg });
    setTimeout(() => {
      const el = document.getElementById(elementId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus();
      }
    }, 60);
  };

  const clearFieldError = (key: string) => {
    if (fieldErrors[key]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  const selectedCakeObj = allCakes.find((c) => c.name === selectedCatalogCake);
  const activePortionsOptions =
    modelType === 'catalog' && selectedCakeObj?.portions && selectedCakeObj.portions.length > 0
      ? selectedCakeObj.portions.map((p, idx) => ({
        id: `custom-p-${idx}-${p.label}`,
        label: p.label,
        price: Number(p.price) || 12000,
        desc: `Tarif spécifique pour ${selectedCakeObj.name}`
      }))
      : modelType === 'catalog' && selectedCakeObj?.price
        ? buildPortionsForBasePrice(selectedCakeObj.price)
        : defaultPortionsOptions;

  const currentPortion =
    activePortionsOptions.find((p) => p.id === selectedPortionId) || activePortionsOptions[0];
  const estimatedPrice = currentPortion.price > 0 ? currentPortion.price : 0;

  // Gestion de l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image est trop lourde (maximum 5 Mo)");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Validation & Ajout au panier avec redirection vers /panier
  const handleAddToCartAndProceed = () => {
    if (selectedFlavor === 'Autre saveur personnalisée' && !customFlavorText.trim()) {
      setSingleError(
        'customFlavorText',
        'Veuillez préciser la saveur personnalisée souhaitée.',
        'field-customFlavorText'
      );
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const eventLabel =
      selectedCakeCategory === 'Autre évènement' && customEventPrecision.trim()
        ? `${selectedCakeCategory} (${customEventPrecision.trim()})`
        : selectedCakeCategory;

    const flavorDisplay =
      selectedFlavor === 'Autre saveur personnalisée'
        ? `Personnalisée : ${customFlavorText.trim()}`
        : selectedFlavor;

    const modelDisplay =
      modelType === 'catalog'
        ? `Modèle catalogue : ${selectedCatalogCake}`
        : uploadedImagePreview
          ? 'Photo personnalisée fournie'
          : 'Modèle personnalisé';

    const finalCakePrice = estimatedPrice > 0 ? estimatedPrice : 15000;

    const chosenCakeImage =
      modelType === 'catalog'
        ? selectedCakeObj?.image || '/products/gateau_1.jpeg'
        : uploadedImagePreview || '/products/gateau_1.jpeg';

    const catalogModelLabel =
      modelType === 'catalog'
        ? selectedCatalogCake
        : uploadedImagePreview
          ? 'Photo personnalisée importée'
          : 'Modèle sur-mesure';

    const customDetailsList = [
      `Catégorie: ${eventLabel}`,
      `Modèle: ${modelDisplay}`,
      `Taille: ${currentPortion.label}`,
      `Saveur: ${flavorDisplay}`,
      cakeInscriptionMessage.trim() ? `Message à écrire: « ${cakeInscriptionMessage.trim()} »` : ''
    ]
      .filter(Boolean)
      .join(' | ');

    addToCart(
      {
        id: `custom-cake-${Date.now()}`,
        name: `Gâteau ${selectedCakeCategory} — ${catalogModelLabel}`,
        price: `${finalCakePrice.toLocaleString('fr-FR')} FCFA`,
        numericPrice: finalCakePrice,
        image: chosenCakeImage,
        category: 'Gâteaux',
        description: customDetailsList,
        portion: currentPortion.label,
        flavor: flavorDisplay,
        catalogModel: catalogModelLabel,
        isCake: true
      },
      1
    );

    navigate('/panier');
  };

  return (
    <div className="min-h-screen py-12 sm:py-16 bg-[#FAF8F5]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Titre & Bannière d'en-tête */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold bg-purple-100 text-[#581C87] uppercase tracking-wider mb-3">
            <Cake size={13} /> Confection Sur-Mesure
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
            Personnalisation de Gâteau
          </h1>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto font-light mt-2 leading-relaxed">
            Configurez votre gâteau en 4 étapes simples : catégorie d'événement, modèle du catalogue, taille & saveur, puis le message à inscrire.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* ========================================================================= */}
          {/* POINT 1 : CATÉGORIE DE GÂTEAU (3 BOUTONS + SOUS-CATÉGORIES DYNAMIQUES) */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                1
              </span>
              Catégorie de gâteau *
            </h3>
            <p className="text-xs text-gray-500 mb-5 font-light">
              Choisissez la catégorie d'événement pour afficher les modèles de gâteaux correspondants.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {cakeCategories.map((catName) => {
                const isSelected = selectedCakeCategory === catName;
                const subMeta = cakeSubcatThemes[catName];
                return (
                  <button
                    key={catName}
                    type="button"
                    onClick={() => {
                      setSelectedCakeCategory(catName);
                      setModelType('catalog');
                    }}
                    className={`py-4 px-5 rounded-2xl border-2 font-extrabold text-sm transition-all cursor-pointer flex items-center justify-between text-left ${isSelected
                      ? 'border-[#581C87] bg-[#581C87] text-white shadow-lg shadow-purple-900/25 scale-[1.01]'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block">{catName}</span>
                      {subMeta?.theme && (
                        <span className={`block text-[11px] font-medium truncate mt-0.5 ${isSelected ? 'text-purple-200' : 'text-gray-500'}`}>
                          {subMeta.theme}
                        </span>
                      )}
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-white text-[#581C87] flex items-center justify-center shrink-0">
                        <Check size={12} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/autre/i.test(selectedCakeCategory) && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 pt-4 border-t border-purple-100"
              >
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  Précisez l'événement (optionnel)
                </label>
                <input
                  type="text"
                  value={customEventPrecision}
                  onChange={(e) => setCustomEventPrecision(e.target.value)}
                  placeholder="Ex : Baptême, Fête d'entreprise, Remise de diplôme..."
                  className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                />
              </motion.div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* POINT 2 : CATALOGUE DE GÂTEAUX EN FONCTION DE LA CATÉGORIE */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                  2
                </span>
                Catalogue de gâteaux — {selectedCakeCategory} *
              </h3>
              <span className="text-xs font-bold text-[#581C87] bg-purple-50 px-3 py-1 rounded-full">
                {cakesForSelectedCategory.length} modèle{cakesForSelectedCategory.length > 1 ? 's' : ''} disponible{cakesForSelectedCategory.length > 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-5 font-light">
              Sélectionnez un modèle de gâteau dans la catégorie « {selectedCakeCategory} » ou importez votre propre photo.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setModelType('catalog')}
                className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${modelType === 'catalog'
                  ? 'bg-[#581C87] border-[#581C87] text-white shadow-md'
                  : 'bg-purple-50/70 border-purple-200 text-gray-700 hover:bg-purple-100/60'
                  }`}
              >
                <Sparkles size={15} />
                <span>Catalogue « {selectedCakeCategory} »</span>
              </button>
              <button
                type="button"
                onClick={() => setModelType('upload')}
                className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${modelType === 'upload'
                  ? 'bg-[#581C87] border-[#581C87] text-white shadow-md'
                  : 'bg-purple-50/70 border-purple-200 text-gray-700 hover:bg-purple-100/60'
                  }`}
              >
                <Upload size={15} />
                <span>Importer ma propre photo</span>
              </button>
            </div>

            {modelType === 'catalog' && (
              <>
                {cakesForSelectedCategory.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {cakesForSelectedCategory.map((cake) => {
                      const isSelected = selectedCatalogCake === cake.name;
                      return (
                        <div
                          key={cake.id}
                          onClick={() => setSelectedCatalogCake(cake.name)}
                          className={`group relative rounded-none overflow-hidden border-2 cursor-pointer transition-all flex flex-col justify-between bg-white ${isSelected
                            ? 'border-[#581C87] shadow-lg ring-2 ring-[#581C87]/20 scale-[1.02]'
                            : 'border-gray-200 hover:border-purple-200'
                            }`}
                        >
                          <div className="aspect-square w-full overflow-hidden bg-gray-100">
                            <ImageWithFallback
                              src={cake.image}
                              alt={cake.name}
                              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="p-3 bg-white">
                            <h4 className="text-xs font-extrabold text-gray-900 leading-snug line-clamp-2">
                              {cake.name}
                            </h4>
                            {cake.description && (
                              <p className="text-[11px] text-gray-500 font-light line-clamp-2 mt-1">
                                {cake.description}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 bg-purple-50/40 rounded-2xl border border-purple-100 p-6">
                    <p className="text-xs text-gray-600 font-medium mb-3">
                      Aucun modèle pré-enregistré dans la sous-catégorie « {selectedCakeCategory} » pour le moment.
                    </p>
                    <button
                      type="button"
                      onClick={() => setModelType('upload')}
                      className="px-5 py-2.5 rounded-full bg-[#581C87] text-white text-xs font-bold hover:bg-[#6B21A8] transition cursor-pointer"
                    >
                      Importer une photo de modèle
                    </button>
                  </div>
                )}
              </>
            )}

            {modelType === 'upload' && (
              <div className="border-2 border-dashed border-purple-200 rounded-3xl p-8 text-center hover:bg-purple-50/30 transition">
                {uploadedImagePreview ? (
                  <div className="flex flex-col items-center">
                    <img
                      src={uploadedImagePreview}
                      alt="Aperçu photo gâteau"
                      className="w-48 h-48 object-cover rounded-2xl shadow-md border-2 border-[#581C87] mb-4"
                    />
                    <label
                      htmlFor="cake-photo-upload"
                      className="px-4 py-2 rounded-full bg-purple-100 text-[#581C87] hover:bg-purple-200 text-xs font-bold cursor-pointer transition"
                    >
                      Changer de photo
                    </label>
                  </div>
                ) : (
                  <label htmlFor="cake-photo-upload" className="cursor-pointer block">
                    <div className="w-16 h-16 rounded-full bg-purple-100 text-[#581C87] flex items-center justify-center mx-auto mb-3">
                      <Upload size={24} />
                    </div>
                    <span className="block font-bold text-sm text-gray-900">
                      Cliquez pour téléverser votre photo de gâteau
                    </span>
                    <span className="block text-xs text-gray-500 font-light mt-1">
                      Formats acceptés : JPG, PNG, WEBP (Max 5 Mo)
                    </span>
                  </label>
                )}
                <input
                  id="cake-photo-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
            )}
          </div>

          {/* ========================================================================= */}
          {/* POINT 3 : TAILLE DU GÂTEAU (NOMBRE DE PARTS & PRIX) ENSUITE LA SAVEUR */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-8">
            {/* 3A. Taille du gâteau avec le nombre de parts et leur prix */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                    3
                  </span>
                  Taille du gâteau (Nombre de parts & Prix) et Saveur *
                </h3>
                {estimatedPrice > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#581C87] text-xs font-extrabold">
                    Tarif choisi : {estimatedPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-4 font-light">
                Choisissez d'abord la taille de votre gâteau selon le nombre de parts souhaité :
              </p>

              <div className="space-y-2.5">
                {activePortionsOptions.map((opt) => {
                  const isSelected = currentPortion.id === opt.id;
                  return (
                    <label
                      key={opt.id}
                      onClick={() => setSelectedPortionId(opt.id)}
                      className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${isSelected
                        ? 'border-[#581C87] bg-purple-50/60 shadow-xs'
                        : 'border-gray-200 hover:border-purple-200 bg-white'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="cakePortion"
                          checked={isSelected}
                          onChange={() => setSelectedPortionId(opt.id)}
                          className="w-4 h-4 accent-[#581C87] cursor-pointer"
                        />
                        <div>
                          <span className="font-extrabold text-sm text-gray-900">{opt.label}</span>
                          {opt.desc && (
                            <span className="text-xs text-gray-500 font-light ml-2 hidden sm:inline">
                              — {opt.desc}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="font-black text-[#581C87] text-sm shrink-0">
                        {opt.price > 0 ? `${opt.price.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 3B. Ensuite la Saveur */}
            <div className="pt-6 border-t border-purple-100">
              <h4 className="text-sm sm:text-base font-extrabold text-gray-900 mb-1.5">
                Saveur du gâteau *
              </h4>
              <p className="text-xs text-gray-500 mb-4 font-light">
                Sélectionnez le parfum de génoise et de crème de votre gâteau :
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flavorOptions.map((flavor) => {
                  const isSelected = selectedFlavor === flavor;
                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => {
                        setSelectedFlavor(flavor);
                        clearFieldError('customFlavorText');
                      }}
                      className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold ${isSelected
                        ? 'border-[#581C87] bg-purple-50 text-[#581C87] shadow-sm ring-2 ring-[#581C87]/20 font-bold'
                        : 'border-gray-200 hover:border-purple-200 text-gray-700 bg-white'
                        }`}
                    >
                      <span>{flavor}</span>
                      {isSelected && (
                        <div className="w-4 h-4 rounded-full bg-[#581C87] text-white flex items-center justify-center shrink-0">
                          <Check size={10} strokeWidth={3} />
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>

              {selectedFlavor === 'Autre saveur personnalisée' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-purple-100"
                >
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Précisez votre association de saveurs sur-mesure *
                  </label>
                  <input
                    id="field-customFlavorText"
                    type="text"
                    value={customFlavorText}
                    onChange={(e) => {
                      setCustomFlavorText(e.target.value);
                      clearFieldError('customFlavorText');
                    }}
                    placeholder="Ex: Chocolat blanc & fruits de la passion, Noisette gianduja..."
                    className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm transition ${fieldErrors.customFlavorText
                      ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200'
                      : 'border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                      }`}
                  />
                  {fieldErrors.customFlavorText && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-2 animate-pulse">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.customFlavorText}</span>
                    </p>
                  )}
                </motion.div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* POINT 4 : MESSAGE À ÉCRIRE */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                4
              </span>
              Message à écrire sur le gâteau
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-light">
              Indiquez le message ou prénom qui sera calligraphié sur votre gâteau (laissez vide si vous ne souhaitez pas d'inscription).
            </p>

            <input
              id="field-cakeInscriptionMessage"
              type="text"
              value={cakeInscriptionMessage}
              onChange={(e) => setCakeInscriptionMessage(e.target.value)}
              placeholder="Ex : « Joyeux Anniversaire Sarah », « Vive les Mariés », « Félicitations »..."
              className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
            />
          </div>

          {/* ========================================================================= */}
          {/* BARRE D'ACTION ET AJOUT AU PANIER */}
          {/* ========================================================================= */}

          <button
            type="button"
            onClick={handleAddToCartAndProceed}
            disabled={isSubmitting}
            className="w-full md:w-auto px-8 py-4 rounded-full bg-white text-[#581C87] hover:bg-purple-50 font-black text-sm shadow-2xl transition cursor-pointer flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-50"
          >
            <ShoppingBag size={18} className="text-[#581C87]" />
            <span>Ajouter au panier</span>
            <ArrowRight size={18} className="text-[#581C87]" />
          </button>


        </div>
      </div>
    </div>
  );
}
