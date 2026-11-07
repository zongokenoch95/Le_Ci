import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Cake,
  ArrowRight,
  Check,
  Upload,
  Sparkles,
  AlertCircle,
  ShoppingBag,
  Plus,
  Minus,
  Info,
  PhoneCall,
  MessageCircle
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { getProducts, getProductSubcategories, Product, PortionOption } from '../services/api';

const ASSISTANCE_PHONE = '+22677121289';
const ASSISTANCE_WHATSAPP = '22677121289';

interface CakeCatalogItem {
  id: number | string;
  name: string;
  image: string;
  subcategory: string;
  description?: string;
  price?: number;
  portions?: PortionOption[];
  flavorKey?: string;
}

// Sous-catégories par défaut pour les gâteaux (Point 1 : Anniversaire, Mariage, Autres)
const defaultCakeSubcategories = ['Anniversaire', 'Mariage', 'Autres'];

// ============================================================================
// GRILLES TARIFAIRES OFFICIELLES DES GÂTEAUX D'ANNIVERSAIRE (PAR SAVEUR / TYPE)
// ============================================================================
export interface BirthdayCakeFamily {
  key: string;
  label: string;
  prices: {
    '6': number;
    '8': number;
    '10': number;
    '12': number;
    '15': number;
    '20': number;
  };
}

export const BIRTHDAY_CAKE_FAMILIES: BirthdayCakeFamily[] = [
  {
    key: 'arzanier_orsia',
    label: 'Arzanier (Gâteau au moringa et bissap) ou Orsia (Gâteau au riz et teedo)',
    prices: {
      '6': 10500,
      '8': 13500,
      '10': 17500,
      '12': 20500,
      '15': 25000,
      '20': 33000
    }
  },
  {
    key: 'moka_vanille_chocolat',
    label: 'Les mokas Vanille chocolat',
    prices: {
      '6': 8500,
      '8': 10500,
      '10': 13500,
      '12': 15500,
      '15': 21000,
      '20': 26000
    }
  },
  {
    key: 'moka_vanille_fraise',
    label: 'Les mokas Vanille fraise ou vanille fruits rouges',
    prices: {
      '6': 9000,
      '8': 11000,
      '10': 14500,
      '12': 16500,
      '15': 22000,
      '20': 27000
    }
  },
  {
    key: 'foret_noire_blanche',
    label: 'Forêt noire, forêt blanche',
    prices: {
      '6': 10500,
      '8': 13500,
      '10': 16500,
      '12': 20000,
      '15': 25500,
      '20': 32000
    }
  },
  {
    key: 'infini_chocolat_fraisier',
    label: 'Infini chocolat ou fraisiers',
    prices: {
      '6': 10500,
      '8': 13500,
      '10': 18500,
      '12': 21000,
      '15': 25000,
      '20': 36000
    }
  },
  {
    key: 'gateau_glace',
    label: 'Gâteau glacé',
    prices: {
      '6': 11000,
      '8': 14000,
      '10': 17000,
      '12': 20500,
      '15': 25500,
      '20': 34000
    }
  }
];

// ============================================================================
// TARIFS OFFICIELS DES GÂTEAUX DE MARIAGE (PIÈCES MONTÉES 2 À 5 ÉTAGES)
// ============================================================================
export interface WeddingTieredOption {
  id: string;
  tiers: number;
  tierLabel: string;
  optionLabel: string;
  price: number;
  defaultParts: number;
}

export const WEDDING_TIERED_OPTIONS: WeddingTieredOption[] = [
  { id: '2-etages-opt1', tiers: 2, tierLabel: '2 étages', optionLabel: 'Option 1', price: 30000, defaultParts: 15 },
  { id: '2-etages-opt2', tiers: 2, tierLabel: '2 étages', optionLabel: 'Option 2', price: 50000, defaultParts: 20 },
  { id: '3-etages-opt1', tiers: 3, tierLabel: '3 étages', optionLabel: 'Option 1', price: 60000, defaultParts: 25 },
  { id: '3-etages-opt2', tiers: 3, tierLabel: '3 étages', optionLabel: 'Option 2', price: 80000, defaultParts: 30 },
  { id: '3-etages-opt3', tiers: 3, tierLabel: '3 étages', optionLabel: 'Option 3', price: 100000, defaultParts: 35 },
  { id: '4-etages-opt1', tiers: 4, tierLabel: '4 étages', optionLabel: 'Option 1', price: 100000, defaultParts: 40 },
  { id: '4-etages-opt2', tiers: 4, tierLabel: '4 étages', optionLabel: 'Option 2', price: 125000, defaultParts: 50 },
  { id: '4-etages-opt3', tiers: 4, tierLabel: '4 étages', optionLabel: 'Option 3', price: 150000, defaultParts: 60 },
  { id: '5-etages-opt1', tiers: 5, tierLabel: '5 étages', optionLabel: 'Option 1', price: 150000, defaultParts: 70 },
  { id: '5-etages-opt2', tiers: 5, tierLabel: '5 étages', optionLabel: 'Option 2', price: 200000, defaultParts: 90 }
];

// ============================================================================
// SUPPLÉMENTS OFFICIELS
// ============================================================================
const SUPPLEMENT_PRICES = {
  edibleImage: 5000,       // Images comestibles : 5 000 F
  nonEdibleImage: 1500,    // Images non comestibles : 1 500 F
  alcohol: 1000,           // Alcool : 1 000 F
  sugarPastePerPart: 2500  // Pâte à sucre : 2 500 F / part
};

function buildPortionsFromFamily(family: BirthdayCakeFamily): {
  id: string;
  label: string;
  partsCount: number;
  price: number;
}[] {
  return [
    { id: '6', label: '6 parts', partsCount: 6, price: family.prices['6'] },
    { id: '8', label: '8 parts', partsCount: 8, price: family.prices['8'] },
    { id: '10', label: '10 parts', partsCount: 10, price: family.prices['10'] },
    { id: '12', label: '12 parts', partsCount: 12, price: family.prices['12'] },
    { id: '15', label: '15 parts', partsCount: 15, price: family.prices['15'] },
    { id: '20', label: '20 parts', partsCount: 20, price: family.prices['20'] },
    { id: 'plus-20', label: '+ de 20 parts', partsCount: 25, price: family.prices['20'] }
  ];
}

// Catalogue par défaut de la maison Lê Ci
const fallbackCatalogCakes: CakeCatalogItem[] = [
  {
    id: 101,
    name: 'Arzanier (Moringa & Bissap) / Orsia (Riz & Teedo)',
    image: '/products/gateau_1.jpeg',
    subcategory: 'Anniversaire',
    price: 10500,
    flavorKey: 'arzanier_orsia',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[0]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 102,
    name: 'Les mokas Vanille chocolat',
    image: '/products/gateau_2.jpeg',
    subcategory: 'Anniversaire',
    price: 8500,
    flavorKey: 'moka_vanille_chocolat',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[1]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 103,
    name: 'Les mokas Vanille fraise ou vanille fruits rouges',
    image: '/products/gateau_4.jpeg',
    subcategory: 'Anniversaire',
    price: 9000,
    flavorKey: 'moka_vanille_fraise',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[2]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 104,
    name: 'Forêt noire, forêt blanche',
    image: '/products/gateau_3.jpeg',
    subcategory: 'Anniversaire',
    price: 10500,
    flavorKey: 'foret_noire_blanche',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[3]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 105,
    name: 'Infini chocolat ou fraisiers',
    image: '/products/gateau_7.jpeg',
    subcategory: 'Anniversaire',
    price: 10500,
    flavorKey: 'infini_chocolat_fraisier',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[4]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 106,
    name: 'Gâteau glacé',
    image: '/products/gateau_5.jpeg',
    subcategory: 'Anniversaire',
    price: 11000,
    flavorKey: 'gateau_glace',
    portions: buildPortionsFromFamily(BIRTHDAY_CAKE_FAMILIES[5]).map(p => ({ label: p.label, price: p.price }))
  },
  {
    id: 19,
    name: 'Pièce Montée d\'Exception & Mariage Prestige',
    image: '/products/gateau_8.jpeg',
    subcategory: 'Mariage',
    price: 30000
  },
  {
    id: 17,
    name: 'Création Célébration & Événements',
    image: '/products/gateau_6.jpeg',
    subcategory: 'Autres',
    price: 10500,
    flavorKey: 'arzanier_orsia'
  }
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
  if (lower.includes('célébration') || lower.includes('red velvet')) {
    return 'Autres';
  }
  return 'Anniversaire';
}

function inferFlavorKeyFromName(name: string): string | undefined {
  const lower = (name || '').toLowerCase();
  if (lower.includes('arzanier') || lower.includes('orsia') || lower.includes('moringa') || lower.includes('teedo')) {
    return 'arzanier_orsia';
  }
  if (lower.includes('moka') && (lower.includes('fraise') || lower.includes('fruits rouges'))) {
    return 'moka_vanille_fraise';
  }
  if (lower.includes('moka')) {
    return 'moka_vanille_chocolat';
  }
  if (lower.includes('forêt') || lower.includes('foret')) {
    return 'foret_noire_blanche';
  }
  if (lower.includes('infini') || lower.includes('fraisier')) {
    return 'infini_chocolat_fraisier';
  }
  if (lower.includes('glacé') || lower.includes('glace')) {
    return 'gateau_glace';
  }
  return undefined;
}

export function CustomOrder() {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Point 1 : Catégorie de gâteau (Anniversaire, Mariage, Autres)
  const [cakeCategories, setCakeCategories] = useState<string[]>(defaultCakeSubcategories);
  const [cakeSubcatThemes, setCakeSubcatThemes] = useState<Record<string, { theme?: string; image?: string }>>({});
  const [selectedCakeCategory, setSelectedCakeCategory] = useState<string>('Anniversaire');
  const [customEventPrecision, setCustomEventPrecision] = useState<string>('');

  // Point 2 : Catalogue de gâteaux en fonction de la catégorie
  const [allCakes, setAllCakes] = useState<CakeCatalogItem[]>(fallbackCatalogCakes);
  const [modelType, setModelType] = useState<'catalog' | 'upload'>('catalog');
  const [selectedCatalogCake, setSelectedCatalogCake] = useState<string>(fallbackCatalogCakes[0].name);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);

  // Point 3 : Taille & Saveur
  const [selectedFlavorKey, setSelectedFlavorKey] = useState<string>(BIRTHDAY_CAKE_FAMILIES[0].key);
  const [customFlavorText, setCustomFlavorText] = useState('');
  const [selectedPortionId, setSelectedPortionId] = useState<string>('6');

  // Configuration spécifique Mariage (Pièce montée vs Gâteaux séparés)
  const [weddingFormat, setWeddingFormat] = useState<'piece_montee' | 'gateaux_separes'>('piece_montee');
  const [selectedWeddingTierOptionId, setSelectedWeddingTierOptionId] = useState<string>(WEDDING_TIERED_OPTIONS[0].id);
  const [separateCakesCount, setSeparateCakesCount] = useState<number>(3); // Minimum 3 gâteaux
  const [separateCakePortionId, setSeparateCakePortionId] = useState<string>('8'); // À partir de 8 parts par gâteau
  const [weddingTieredPartsForSugarPaste, setWeddingTieredPartsForSugarPaste] = useState<number>(15);

  // Point 4 : Supplément (optionnel)
  const [suppEdibleImage, setSuppEdibleImage] = useState<boolean>(false);
  const [suppNonEdibleImage, setSuppNonEdibleImage] = useState<boolean>(false);
  const [suppAlcohol, setSuppAlcohol] = useState<boolean>(false);
  const [suppSugarPaste, setSuppSugarPaste] = useState<boolean>(false);

  // Point 5 : Message à écrire sur le gâteau
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

        const combinedCakes: CakeCatalogItem[] = [...fallbackCatalogCakes];
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
                } catch (e) {}
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
                portions,
                flavorKey: inferFlavorKeyFromName(p.name)
              };
            });

          for (const dbCake of dbCakes) {
            const existsIdx = combinedCakes.findIndex(
              (c) =>
                c.name.toLowerCase() === dbCake.name.toLowerCase() ||
                (c.flavorKey && c.flavorKey === dbCake.flavorKey && c.subcategory === dbCake.subcategory)
            );
            if (existsIdx >= 0) {
              combinedCakes[existsIdx] = {
                ...combinedCakes[existsIdx],
                image: dbCake.image || combinedCakes[existsIdx].image,
                portions:
                  dbCake.portions && dbCake.portions.length > 0
                    ? dbCake.portions
                    : combinedCakes[existsIdx].portions
              };
            } else {
              combinedCakes.push(dbCake);
            }
          }
        }

        if (Array.isArray(subcatsData)) {
          for (const s of subcatsData) {
            if (s.image && s.name) {
              const modelName = s.theme ? `${s.name} — ${s.theme}` : `Modèle ${s.name}`;
              const alreadyInCatalog = combinedCakes.some(
                (c) => c.subcategory.toLowerCase() === s.name.toLowerCase() && c.image === s.image
              );
              if (!alreadyInCatalog) {
                combinedCakes.push({
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

  const isWeddingCategory = /mariage/i.test(selectedCakeCategory);

  // Gâteaux filtrés selon la catégorie sélectionnée au Point 1
  const cakesForSelectedCategory = allCakes.filter(
    (c) => c.subcategory.toLowerCase() === selectedCakeCategory.toLowerCase()
  );

  useEffect(() => {
    if (cakesForSelectedCategory.length > 0) {
      const stillExists = cakesForSelectedCategory.some((c) => c.name === selectedCatalogCake);
      if (!stillExists) {
        const firstCake = cakesForSelectedCategory[0];
        setSelectedCatalogCake(firstCake.name);
        if (firstCake.flavorKey) {
          setSelectedFlavorKey(firstCake.flavorKey);
        }
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

  // Famille de saveur sélectionnée
  const activeFamily =
    BIRTHDAY_CAKE_FAMILIES.find((f) => f.key === selectedFlavorKey) || BIRTHDAY_CAKE_FAMILIES[0];

  const selectedCakeObj = allCakes.find((c) => c.name === selectedCatalogCake);

  // Options de parts pour Anniversaire / Autres (6, 8, 10, 12, 15, 20 et + de 20 parts)
  const birthdayPortionsOptions = buildPortionsFromFamily(activeFamily);
  const currentBirthdayPortion =
    birthdayPortionsOptions.find((p) => p.id === selectedPortionId) || birthdayPortionsOptions[0];

  // Options de parts pour Gâteaux séparés de Mariage (à partir de 8 parts par gâteau, min 3 gâteaux)
  const separateWeddingPortionOptions = birthdayPortionsOptions.filter((p) => p.partsCount >= 8);
  const currentSeparateWeddingPortion =
    separateWeddingPortionOptions.find((p) => p.id === separateCakePortionId) || separateWeddingPortionOptions[0];

  // Option sélectionnée pour Pièce montée de Mariage (2 à 5 étages)
  const currentWeddingTierOption =
    WEDDING_TIERED_OPTIONS.find((o) => o.id === selectedWeddingTierOptionId) || WEDDING_TIERED_OPTIONS[0];

  useEffect(() => {
    setWeddingTieredPartsForSugarPaste(currentWeddingTierOption.defaultParts);
  }, [selectedWeddingTierOptionId]);

  // Est-ce que l'option "+ de 20 parts" est sélectionnée ?
  const isPlus20Selected = !isWeddingCategory
    ? selectedPortionId === 'plus-20'
    : weddingFormat === 'gateaux_separes' && separateCakePortionId === 'plus-20';

  // Résumé de la commande jusqu'à la taille du gâteau (> 20 parts) pour l'assistance WhatsApp
  const eventLabelForSummary =
    /autre/i.test(selectedCakeCategory) && customEventPrecision.trim()
      ? `${selectedCakeCategory} (${customEventPrecision.trim()})`
      : selectedCakeCategory;

  const modelDisplayForSummary =
    modelType === 'catalog'
      ? selectedCatalogCake
      : uploadedImagePreview
        ? 'Photo personnalisée fournie'
        : 'Modèle personnalisé';

  const flavorDisplayForSummary =
    selectedFlavorKey === 'custom'
      ? customFlavorText.trim() || 'Saveur personnalisée'
      : activeFamily.label;

  const assistanceMessage = [
    'Bonjour Les Douceurs de Lê Ci ! Je souhaite commander un gâteau au-delà de 20 parts :',
    `• Catégorie : ${eventLabelForSummary}`,
    `• Modèle : ${modelDisplayForSummary}`,
    `• Saveur : ${flavorDisplayForSummary}`,
    isWeddingCategory && weddingFormat === 'gateaux_separes'
      ? `• Taille du gâteau : ${separateCakesCount} gâteaux séparés de + de 20 parts chacun`
      : '• Taille du gâteau : Au-delà de 20 parts (+ de 20 parts)'
  ].join('\n');

  const whatsappAssistanceUrl = `https://wa.me/${ASSISTANCE_WHATSAPP}?text=${encodeURIComponent(assistanceMessage)}`;
  const phoneAssistanceUrl = `tel:${ASSISTANCE_PHONE}`;

  // ============================================================================
  // CALCUL DU PRIX DU GÂTEAU + SUPPLÉMENTS
  // ============================================================================
  const baseCakePrice = isWeddingCategory
    ? weddingFormat === 'piece_montee'
      ? currentWeddingTierOption.price
      : currentSeparateWeddingPortion.price * Math.max(3, separateCakesCount)
    : currentBirthdayPortion.price;

  const effectivePartsCount = isWeddingCategory
    ? weddingFormat === 'piece_montee'
      ? Math.max(6, weddingTieredPartsForSugarPaste)
      : currentSeparateWeddingPortion.partsCount * Math.max(3, separateCakesCount)
    : currentBirthdayPortion.partsCount;

  const edibleImageCost = suppEdibleImage ? SUPPLEMENT_PRICES.edibleImage : 0;
  const nonEdibleImageCost = suppNonEdibleImage ? SUPPLEMENT_PRICES.nonEdibleImage : 0;
  const alcoholCost = suppAlcohol ? SUPPLEMENT_PRICES.alcohol : 0;
  const sugarPasteCost = suppSugarPaste ? SUPPLEMENT_PRICES.sugarPastePerPart * effectivePartsCount : 0;

  const cakeSupplementsTotal = edibleImageCost + nonEdibleImageCost + alcoholCost + sugarPasteCost;
  const cakeItemPriceForCart = baseCakePrice + cakeSupplementsTotal;

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
    if (selectedFlavorKey === 'custom' && !customFlavorText.trim()) {
      setSingleError(
        'customFlavorText',
        'Veuillez préciser la saveur personnalisée souhaitée.',
        'field-customFlavorText'
      );
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const portionLabel = isWeddingCategory
      ? weddingFormat === 'piece_montee'
        ? `Pièce montée ${currentWeddingTierOption.tierLabel} (${currentWeddingTierOption.optionLabel})`
        : `${Math.max(3, separateCakesCount)} gâteaux séparés × ${currentSeparateWeddingPortion.label}`
      : currentBirthdayPortion.label;

    const chosenSupplementsList = [
      suppEdibleImage ? `Image comestible (+${SUPPLEMENT_PRICES.edibleImage.toLocaleString('fr-FR')} F)` : '',
      suppNonEdibleImage ? `Image non comestible (+${SUPPLEMENT_PRICES.nonEdibleImage.toLocaleString('fr-FR')} F)` : '',
      suppAlcohol ? `Alcool (+${SUPPLEMENT_PRICES.alcohol.toLocaleString('fr-FR')} F)` : '',
      suppSugarPaste
        ? `Pâte à sucre 2500F × ${effectivePartsCount} parts (+${sugarPasteCost.toLocaleString('fr-FR')} F)`
        : ''
    ].filter(Boolean);

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
      `Catégorie: ${eventLabelForSummary}`,
      `Modèle: ${modelDisplayForSummary}`,
      `Format/Taille: ${portionLabel} (${baseCakePrice.toLocaleString('fr-FR')} F)`,
      `Saveur: ${flavorDisplayForSummary}`,
      chosenSupplementsList.length > 0 ? `Suppléments: ${chosenSupplementsList.join(', ')}` : 'Sans supplément',
      cakeInscriptionMessage.trim() ? `Message sur gâteau: « ${cakeInscriptionMessage.trim()} »` : ''
    ]
      .filter(Boolean)
      .join(' | ');

    addToCart(
      {
        id: `custom-cake-${Date.now()}`,
        name: `Gâteau ${selectedCakeCategory} — ${catalogModelLabel}`,
        price: `${cakeItemPriceForCart.toLocaleString('fr-FR')} FCFA`,
        numericPrice: cakeItemPriceForCart,
        image: chosenCakeImage,
        category: 'Gâteaux',
        description: customDetailsList,
        portion: portionLabel,
        flavor: flavorDisplayForSummary,
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
            Configurez votre gâteau étape par étape : catégorie, modèle, taille & saveur, suppléments et message à inscrire.
          </p>
        </motion.div>

        <div className="space-y-8">
          {/* ========================================================================= */}
          {/* POINT 1 : CATÉGORIE DE GÂTEAU (INCHANGÉ)                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                1
              </span>
              Catégorie de gâteau
            </h3>

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
                    className={`py-4 px-5 rounded-2xl border-2 font-extrabold text-sm transition-all cursor-pointer flex items-center justify-between text-left ${
                      isSelected
                        ? 'border-[#581C87] bg-[#581C87] text-white shadow-lg shadow-purple-900/25 scale-[1.01]'
                        : 'border-gray-200 bg-white text-gray-800 hover:border-purple-300 hover:bg-purple-50/40'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="block">{catName}</span>
                      {subMeta?.theme && (
                        <span
                          className={`block text-[11px] font-medium truncate mt-0.5 ${
                            isSelected ? 'text-purple-200' : 'text-gray-500'
                          }`}
                        >
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
          {/* POINT 2 : CATALOGUE DE GÂTEAUX EN FONCTION DE LA CATÉGORIE (INCHANGÉ)     */}
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
              Sélectionnez un modèle de gâteau ou chargez une photo du gâteau que vous aimeriez avoir.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => setModelType('catalog')}
                className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  modelType === 'catalog'
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
                className={`py-3 px-4 rounded-xl border-2 text-xs sm:text-sm font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  modelType === 'upload'
                    ? 'bg-[#581C87] border-[#581C87] text-white shadow-md'
                    : 'bg-purple-50/70 border-purple-200 text-gray-700 hover:bg-purple-100/60'
                }`}
              >
                <Upload size={15} />
                <span>Charger ma propre photo</span>
              </button>
            </div>

            {modelType === 'catalog' && (
              <>
                {cakesForSelectedCategory.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {cakesForSelectedCategory.map((cake) => {
                      const isSelected = selectedCatalogCake === cake.name;
                      return (
                        <div
                          key={cake.id}
                          onClick={() => {
                            setSelectedCatalogCake(cake.name);
                            if (cake.flavorKey) {
                              setSelectedFlavorKey(cake.flavorKey);
                            }
                          }}
                          className={`group relative rounded-none overflow-hidden border-2 cursor-pointer transition-all flex flex-col justify-between bg-white ${
                            isSelected
                              ? 'border-[#581C87] shadow-lg ring-2 ring-[#581C87]/20 scale-[1.01]'
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
                      className="px-5 py-2.5 rounded-lg bg-[#581C87] text-white text-xs font-bold hover:bg-[#6B21A8] transition cursor-pointer"
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
                      className="px-4 py-2 rounded-lg bg-purple-100 text-[#581C87] hover:bg-purple-200 text-xs font-bold cursor-pointer transition"
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
          {/* POINT 3 : TAILLE ET SAVEUR                                                */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                  3
                </span>
                Taille et saveur
              </h3>
              {!isPlus20Selected && (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-purple-100 text-[#581C87] text-xs font-extrabold">
                  Prix du gâteau : {baseCakePrice.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            {/* --------------------------------------------------------------------- */}
            {/* 3A. SAVEUR DU GÂTEAU (PUCES RADIO, UNIQUEMENT LE NOM SANS PARTS/PRIX) */}
            {/* --------------------------------------------------------------------- */}
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-gray-900 mb-3">
                Saveur du gâteau *
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {BIRTHDAY_CAKE_FAMILIES.map((fam) => {
                  const isSelected = selectedFlavorKey === fam.key;
                  return (
                    <label
                      key={fam.key}
                      onClick={() => {
                        setSelectedFlavorKey(fam.key);
                        clearFieldError('customFlavorText');
                      }}
                      className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                        isSelected
                          ? 'border-[#581C87] bg-purple-50/60 shadow-xs'
                          : 'border-gray-200 hover:border-purple-200 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        name="cakeFlavorOption"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedFlavorKey(fam.key);
                          clearFieldError('customFlavorText');
                        }}
                        className="w-4 h-4 accent-[#581C87] cursor-pointer shrink-0"
                      />
                      <span className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                        {fam.label}
                      </span>
                    </label>
                  );
                })}

                <label
                  onClick={() => setSelectedFlavorKey('custom')}
                  className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center gap-3 ${
                    selectedFlavorKey === 'custom'
                      ? 'border-[#581C87] bg-purple-50/60 shadow-xs'
                      : 'border-gray-200 hover:border-purple-200 bg-white'
                  }`}
                >
                  <input
                    type="radio"
                    name="cakeFlavorOption"
                    checked={selectedFlavorKey === 'custom'}
                    onChange={() => setSelectedFlavorKey('custom')}
                    className="w-4 h-4 accent-[#581C87] cursor-pointer shrink-0"
                  />
                  <span className="text-xs sm:text-sm font-bold text-gray-900">
                    Autre saveur personnalisée
                  </span>
                </label>
              </div>

              {selectedFlavorKey === 'custom' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 pt-4 border-t border-purple-100"
                >
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Précisez votre saveur sur-mesure *
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
                    className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm transition ${
                      fieldErrors.customFlavorText
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

            {/* --------------------------------------------------------------------- */}
            {/* 3B. TAILLE DU GÂTEAU (AVEC PUCES RADIO & ASSISTANCE POUR + DE 20 PARTS) */}
            {/* --------------------------------------------------------------------- */}
            <div className="pt-6 border-t border-purple-100">
              {isWeddingCategory ? (
                <div className="space-y-6">
                  <div>
                    <h4 className="text-sm sm:text-base font-extrabold text-gray-900 mb-3">
                      Taille / Format du Gâteau de Mariage *
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
                      <label
                        onClick={() => setWeddingFormat('piece_montee')}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                          weddingFormat === 'piece_montee'
                            ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="weddingFormatRadio"
                          checked={weddingFormat === 'piece_montee'}
                          onChange={() => setWeddingFormat('piece_montee')}
                          className="w-4 h-4 accent-[#581C87] cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="font-extrabold text-sm text-gray-900">Pièces montées (2 à 5 étages)</div>
                          <div className="text-[11px] text-gray-500">De 30 000 FCFA à 200 000 FCFA</div>
                        </div>
                      </label>

                      <label
                        onClick={() => setWeddingFormat('gateaux_separes')}
                        className={`p-4 rounded-xl border transition cursor-pointer flex items-center gap-3 ${
                          weddingFormat === 'gateaux_separes'
                            ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-purple-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="weddingFormatRadio"
                          checked={weddingFormat === 'gateaux_separes'}
                          onChange={() => setWeddingFormat('gateaux_separes')}
                          className="w-4 h-4 accent-[#581C87] cursor-pointer shrink-0"
                        />
                        <div>
                          <div className="font-extrabold text-sm text-gray-900">Gâteaux séparés</div>
                          <div className="text-[11px] text-gray-500">À partir de 8 parts par gâteau et 3 gâteaux</div>
                        </div>
                      </label>
                    </div>

                    {weddingFormat === 'piece_montee' ? (
                      <div className="space-y-4">
                        {[2, 3, 4, 5].map((tierNum) => {
                          const tierOptions = WEDDING_TIERED_OPTIONS.filter((o) => o.tiers === tierNum);
                          return (
                            <div key={tierNum} className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-2.5">
                              <div className="text-xs font-black uppercase tracking-wider text-[#581C87]">
                                Pièce montée — {tierNum} étages
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                {tierOptions.map((opt) => {
                                  const isSelected = selectedWeddingTierOptionId === opt.id;
                                  return (
                                    <label
                                      key={opt.id}
                                      onClick={() => setSelectedWeddingTierOptionId(opt.id)}
                                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                                        isSelected
                                          ? 'border-[#581C87] bg-white shadow-sm ring-2 ring-[#581C87]/20'
                                          : 'border-gray-200 hover:border-purple-200 bg-white/80'
                                      }`}
                                    >
                                      <div className="flex items-center gap-2">
                                        <input
                                          type="radio"
                                          name="weddingTierOption"
                                          checked={isSelected}
                                          onChange={() => setSelectedWeddingTierOptionId(opt.id)}
                                          className="w-4 h-4 accent-[#581C87] cursor-pointer"
                                        />
                                        <span className="font-bold text-xs text-gray-900">{opt.optionLabel}</span>
                                      </div>
                                      <span className="font-black text-xs text-[#581C87]">
                                        {opt.price.toLocaleString('fr-FR')} F
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-5 rounded-2xl bg-purple-50/40 border border-purple-100 space-y-5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-purple-100">
                          <div>
                            <span className="block text-xs sm:text-sm font-extrabold text-gray-900">
                              Nombre de gâteaux séparés (minimum 3 gâteaux)
                            </span>
                            <span className="text-[11px] text-gray-500">
                              Nous prenons à partir de 8 parts pour chaque gâteau et 3 gâteaux minimum.
                            </span>
                          </div>
                          <div className="flex items-center gap-2 bg-white border border-purple-200 rounded-xl px-3 py-1.5 self-start sm:self-center">
                            <button
                              type="button"
                              onClick={() => setSeparateCakesCount((c) => Math.max(3, c - 1))}
                              disabled={separateCakesCount <= 3}
                              className="p-1 text-[#581C87] disabled:opacity-30 cursor-pointer"
                            >
                              <Minus size={15} />
                            </button>
                            <span className="px-3 font-black text-sm text-[#581C87]">
                              {separateCakesCount} gâteaux
                            </span>
                            <button
                              type="button"
                              onClick={() => setSeparateCakesCount((c) => c + 1)}
                              className="p-1 text-[#581C87] cursor-pointer"
                            >
                              <Plus size={15} />
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-extrabold text-gray-800 mb-2.5">
                            Nombre de parts par gâteau (à partir de 8 parts) :
                          </label>
                          <div className="space-y-2">
                            {separateWeddingPortionOptions.map((opt) => {
                              const isSelected = currentSeparateWeddingPortion.id === opt.id;
                              const isOptPlus20 = opt.id === 'plus-20';
                              const totalForAllCakes = opt.price * Math.max(3, separateCakesCount);
                              return (
                                <label
                                  key={opt.id}
                                  onClick={() => setSeparateCakePortionId(opt.id)}
                                  className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                                    isSelected
                                      ? 'border-[#581C87] bg-white shadow-xs ring-2 ring-[#581C87]/15'
                                      : 'border-gray-200 hover:border-purple-200 bg-white/80'
                                  }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <input
                                      type="radio"
                                      name="separateWeddingPortion"
                                      checked={isSelected}
                                      onChange={() => setSeparateCakePortionId(opt.id)}
                                      className="w-4 h-4 accent-[#581C87] cursor-pointer"
                                    />
                                    <div>
                                      <span className="font-extrabold text-xs sm:text-sm text-gray-900">
                                        {opt.label} / gâteau
                                      </span>
                                      {!isOptPlus20 && (
                                        <span className="text-xs text-gray-500 ml-2">
                                          ({opt.price.toLocaleString('fr-FR')} F × {separateCakesCount} gâteaux)
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  {!isOptPlus20 && (
                                    <span className="font-black text-[#581C87] text-sm shrink-0">
                                      {totalForAllCakes.toLocaleString('fr-FR')} FCFA
                                    </span>
                                  )}
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Note officielle NB pour les gâteaux de mariage */}
                  <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
                    <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <span className="font-semibold">
                      NB : Ces prix peuvent changer en fonction du décor et d'autres paramètres.
                    </span>
                  </div>
                </div>
              ) : (
                <div>
                  <h4 className="text-sm sm:text-base font-extrabold text-gray-900 mb-3">
                    Taille du gâteau (Nombre de parts et prix) *
                  </h4>

                  <div className="space-y-2.5">
                    {birthdayPortionsOptions.map((opt) => {
                      const isSelected = currentBirthdayPortion.id === opt.id;
                      const isOptPlus20 = opt.id === 'plus-20';
                      return (
                        <label
                          key={opt.id}
                          onClick={() => setSelectedPortionId(opt.id)}
                          className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
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
                            <span className="font-extrabold text-sm text-gray-900">{opt.label}</span>
                          </div>
                          {!isOptPlus20 && (
                            <span className="font-black text-[#581C87] text-sm shrink-0">
                              {opt.price.toLocaleString('fr-FR')} FCFA
                            </span>
                          )}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Encadré d'assistance directe (WhatsApp & Appel téléphonique) lorsque "+ de 20 parts" est choisi */}
              {isPlus20Selected && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-5 rounded-2xl bg-purple-50/80 border-2 border-[#581C87]/30 space-y-4"
                >
                  <div>
                    <h5 className="text-xs sm:text-sm font-extrabold text-[#581C87]">
                      Commande de gâteau au-delà de 20 parts
                    </h5>
                    <p className="text-xs text-gray-600 mt-1">
                      Pour un gâteau de plus de 20 parts, contactez directement notre assistance par WhatsApp ou par appel téléphonique. Le récapitulatif de votre commande est déjà prêt :
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-white border border-purple-100 text-xs text-gray-700 space-y-1 font-medium">
                    <div><span className="font-bold text-gray-900">Catégorie :</span> {eventLabelForSummary}</div>
                    <div><span className="font-bold text-gray-900">Modèle :</span> {modelDisplayForSummary}</div>
                    <div><span className="font-bold text-gray-900">Saveur :</span> {flavorDisplayForSummary}</div>
                    <div><span className="font-bold text-[#581C87]">Taille :</span> Au-delà de 20 parts (+ de 20 parts)</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={whatsappAssistanceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3.5 px-5 rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle size={18} />
                      <span>Contacter sur WhatsApp</span>
                    </a>

                    <a
                      href={phoneAssistanceUrl}
                      className="py-3.5 px-5 rounded-lg bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2"
                    >
                      <PhoneCall size={18} />
                      <span>Appel téléphonique</span>
                    </a>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* POINT 4 : SUPPLÉMENT (OPTIONNEL)                                          */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                  4
                </span>
                Supplément (optionnel)
              </h3>
              <p className="text-xs text-gray-500 mt-1 font-light">
                Sélectionnez les suppléments souhaités pour votre gâteau :
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Images comestibles : 5 000 F */}
              <label
                className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  suppEdibleImage
                    ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={suppEdibleImage}
                    onChange={(e) => setSuppEdibleImage(e.target.checked)}
                    className="w-4 h-4 accent-[#581C87] rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Images comestibles</span>
                </div>
                <span className="text-xs font-black text-[#581C87] shrink-0">+5 000 FCFA</span>
              </label>

              {/* Images non comestibles : 1 500 F */}
              <label
                className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  suppNonEdibleImage
                    ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={suppNonEdibleImage}
                    onChange={(e) => setSuppNonEdibleImage(e.target.checked)}
                    className="w-4 h-4 accent-[#581C87] rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Images non comestibles</span>
                </div>
                <span className="text-xs font-black text-[#581C87] shrink-0">+1 500 FCFA</span>
              </label>

              {/* Alcool : 1 000 F */}
              <label
                className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  suppAlcohol
                    ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={suppAlcohol}
                    onChange={(e) => setSuppAlcohol(e.target.checked)}
                    className="w-4 h-4 accent-[#581C87] rounded cursor-pointer"
                  />
                  <span className="text-xs sm:text-sm font-bold text-gray-900">Alcool</span>
                </div>
                <span className="text-xs font-black text-[#581C87] shrink-0">+1 000 FCFA</span>
              </label>

              {/* Pâte à sucre : 2 500 F / part */}
              <label
                className={`p-3.5 px-4 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  suppSugarPaste
                    ? 'border-[#581C87] bg-purple-50/70 shadow-xs'
                    : 'border-gray-200 hover:border-purple-200 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={suppSugarPaste}
                    onChange={(e) => setSuppSugarPaste(e.target.checked)}
                    className="w-4 h-4 accent-[#581C87] rounded cursor-pointer"
                  />
                  <div>
                    <span className="block text-xs sm:text-sm font-bold text-gray-900">
                      Pâte à sucre (2 500 F / part)
                    </span>
                    <span className="block text-[11px] text-gray-500">
                      2 500 F × {effectivePartsCount} parts
                    </span>
                  </div>
                </div>
                <span className="text-xs font-black text-[#581C87] shrink-0">
                  +{(SUPPLEMENT_PRICES.sugarPastePerPart * effectivePartsCount).toLocaleString('fr-FR')} FCFA
                </span>
              </label>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* POINT 5 : MESSAGE À ÉCRIRE SUR LE GÂTEAU                                  */}
          {/* ========================================================================= */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">
                5
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
          {/* RÉCAPITULATIF DU MONTANT TOTAL & AJOUT AU PANIER                          */}
          {/* ========================================================================= */}
          {!isPlus20Selected && (
            <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-[#581C87]/20 shadow-lg space-y-4">
              <div className="space-y-2 text-xs sm:text-sm text-gray-700">
                <div className="flex justify-between">
                  <span>Prix du gâteau :</span>
                  <span className="font-bold text-gray-900">{baseCakePrice.toLocaleString('fr-FR')} FCFA</span>
                </div>

                {suppEdibleImage && (
                  <div className="flex justify-between text-purple-900">
                    <span>Images comestibles :</span>
                    <span className="font-bold">+{edibleImageCost.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                {suppNonEdibleImage && (
                  <div className="flex justify-between text-purple-900">
                    <span>Images non comestibles :</span>
                    <span className="font-bold">+{nonEdibleImageCost.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                {suppAlcohol && (
                  <div className="flex justify-between text-purple-900">
                    <span>Alcool :</span>
                    <span className="font-bold">+{alcoholCost.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                {suppSugarPaste && (
                  <div className="flex justify-between text-purple-900">
                    <span>Pâte à sucre (2 500 F × {effectivePartsCount} parts) :</span>
                    <span className="font-bold">+{sugarPasteCost.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                )}

                <div className="pt-3 border-t border-gray-200 flex items-baseline justify-between">
                  <span className="text-sm sm:text-base font-extrabold text-gray-900">
                    Montant Total :
                  </span>
                  <span className="text-xl sm:text-2xl font-black text-[#581C87]">
                    {cakeItemPriceForCart.toLocaleString('fr-FR')} FCFA
                  </span>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleAddToCartAndProceed}
                  disabled={isSubmitting}
                  className="w-full md:w-auto px-8 py-4 rounded-lg bg-[#581C87] text-white hover:bg-[#6B21A8] font-black text-sm shadow-xl transition cursor-pointer flex items-center justify-center gap-3 transform hover:scale-[1.01] active:scale-95 shrink-0 disabled:opacity-50"
                >
                  <ShoppingBag size={18} />
                  <span>Ajouter au panier ({cakeItemPriceForCart.toLocaleString('fr-FR')} FCFA)</span>
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
