import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createOrder } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cake, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Upload, 
  Heart, 
  Sparkles, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  User, 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  X, 
  ShieldCheck,
  CreditCard,
  Loader2, 
  Navigation, 
  Truck, 
  Store,
  FileText,
  HelpCircle,
  Share2,
  ShoppingBag
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';
import { validateBurkinaPhone } from '../utils/phoneValidation';
import { DeliveryMapPicker, DeliveryLocationData } from '../components/DeliveryMapPicker';

// 8 Gâteaux du catalogue de la maison Lê Ci
const catalogCakes = [
  { id: 1, name: 'Fraisier Signature Suprême', image: '/products/gateau_1.jpeg' },
  { id: 2, name: 'Gâteau Festif Personnalisé Pâte d\'Amande', image: '/products/gateau_2.jpeg' },
  { id: 3, name: 'Forêt Noire Grand Cru Cacao & Cerises', image: '/products/gateau_3.jpeg' },
  { id: 4, name: 'Layer Cake Chocolat Praliné & Drip Caramel', image: '/products/gateau_4.jpeg' },
  { id: 5, name: 'Entremet Miroir Fruits Rouges & Velours', image: '/products/gateau_5.jpeg' },
  { id: 6, name: 'Red Velvet Cake Onctueux Cream Cheese', image: '/products/gateau_6.jpeg' },
  { id: 7, name: 'Number Cake Décoré Fruits Frais & Macarons', image: '/products/gateau_7.jpeg' },
  { id: 8, name: 'Pièce Montée d\'Exception & Mariage Prestige', image: '/products/gateau_8.jpeg' }
];

// Nombre de parts avec tarifs indicatifs transparents en FCFA
const portionsOptions = [
  { id: '6-8', label: '6 à 8 parts', price: 15000, desc: 'Idéal en petit comité / famille' },
  { id: '10-12', label: '10 à 12 parts', price: 25000, desc: 'Anniversaire ou dîner festif' },
  { id: '15-20', label: '15 à 20 parts', price: 35000, desc: 'Célébrations & fêtes d\'enfants' },
  { id: '25-30', label: '25 à 30 parts', price: 50000, desc: 'Grand anniversaire / baptême' },
  { id: '40-50', label: '40 à 50 parts', price: 80000, desc: 'Grand événement / Cérémonie' },
  { id: 'custom', label: 'Plus de 50 parts', price: 0, desc: 'Pièce montée / Devis sur-mesure' }
];

// Saveurs signatures
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

export function CustomOrder() {
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Étape 1 : Description du gâteau (Notion #20)
  // Champ 1 : Texte libre pour l'événement
  const [eventDetails, setEventDetails] = useState('');
  // Champ 2 : Message à inscrire sur le gâteau
  const [cakeInscriptionMessage, setCakeInscriptionMessage] = useState('');
  // Champ 3 : Nombre de parts & Tarification
  const [selectedPortionId, setSelectedPortionId] = useState('10-12');
  // Champ 4 : Saveur
  const [selectedFlavor, setSelectedFlavor] = useState(flavorOptions[0]);
  const [customFlavorText, setCustomFlavorText] = useState('');
  // Champ 5 : Référence catalogue ou upload
  const [modelType, setModelType] = useState<'catalog' | 'upload'>('catalog');
  const [selectedCatalogCake, setSelectedCatalogCake] = useState<string>(catalogCakes[0].name);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  // Champ 6 : Carte de petit mot personnalisée (200 FCFA)
  const [hasGreetingCard, setHasGreetingCard] = useState<boolean>(false);
  const [cardMessage, setCardMessage] = useState('');

  // Étape 2 : Informations pour la livraison (Notion #20)
  // Champ 1 : Type de commande
  const [deliveryType, setDeliveryType] = useState<'livraison' | 'sur_place'>('livraison');
  // Champ 2 : Date via bouton calendrier & Heure en texte libre
  const [receptionDate, setReceptionDate] = useState('');
  const [receptionTime, setReceptionTime] = useState('');
  
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Coordonnées de la personne qui va recevoir le colis (Notion #21)
  const [recipientPhone, setRecipientPhone] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhoneBackup, setRecipientPhoneBackup] = useState('');

  // Lieu de livraison & Géolocalisation (Notion 28/10/26 : GPS ou carte)
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState<DeliveryLocationData | null>(null);

  // Informations complémentaires
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Modale de confirmation
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Erreurs précises par champ avec bordure rouge & message inline (Notion #18)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const setSingleError = (key: string, msg: string, elementId: string) => {
    setFieldErrors({ [key]: msg });
    setValidationError(null); // Notion 28/10/26 : Pas d'erreur au niveau du récapitulatif, uniquement près du champ erroné
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
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
      setValidationError(null);
    }
  };

  // Calcul du prix estimé avec supplément carte 200 FCFA (Notion #20)
  const currentPortion = portionsOptions.find(p => p.id === selectedPortionId) || portionsOptions[1];
  const cardFee = hasGreetingCard ? 200 : 0;
  const estimatedPrice = currentPortion.price > 0 ? currentPortion.price + cardFee : 0;

  // Calcul de la date minimale : Aujourd'hui + 2 jours pour préparation artisanale
  const minDate = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d.toISOString().split('T')[0];
  })();

  // Gestion de l'upload d'image
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('L\'image est trop lourde (maximum 5 Mo)');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const [geoStatusMsg, setGeoStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // Géolocalisation GPS multi-niveaux ultra robuste (Point 14)
  const handleGetLocation = () => {
    setGeoStatusMsg(null);
    if (!navigator.geolocation) {
      setGeoStatusMsg({ type: 'error', text: "La géolocalisation n'est pas supportée par votre navigateur/appareil." });
      return;
    }

    setGeoLocating(true);

    const onLocationFound = async (pos: GeolocationPosition) => {
      const { latitude, longitude, accuracy } = pos.coords;
      setGeoCoords({ lat: latitude, lng: longitude });

      let locationLabel = `Position GPS : ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3500);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            const shortQ = data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || data.display_name.split(',')[0];
            locationLabel = `📍 ${shortQ} (GPS: ${latitude.toFixed(5)}, ${longitude.toFixed(5)})`;
          }
        }
      } catch (e) {
        // Fallback sans nom
      }

      const mapsLink = `https://maps.google.com/?q=${latitude},${longitude}`;
      setDeliveryAddress(prev => {
        if (!prev) return `${locationLabel} - ${mapsLink}`;
        return `${prev} | ${locationLabel}`;
      });
      setGeoStatusMsg({ type: 'success', text: `Position GPS capturée avec succès (${Math.round(accuracy)}m de précision) !` });
      setGeoLocating(false);
    };

    const tryLowAccuracy = () => {
      navigator.geolocation.getCurrentPosition(
        onLocationFound,
        (finalErr) => {
          console.warn('Erreur GPS client:', finalErr);
          setGeoLocating(false);
          if (finalErr.code === 1) {
            setGeoStatusMsg({
              type: 'error',
              text: "Veuillez activer la géolocalisation sur votre appareil"
            });
          } else if (finalErr.code === 3) {
            setGeoStatusMsg({
              type: 'error',
              text: "Veuillez activer la géolocalisation sur votre appareil"
            });
          } else {
            setGeoStatusMsg({
              type: 'error',
              text: "Veuillez activer la géolocalisation sur votre appareil"
            });
          }
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 300000 }
      );
    };

    // 1ère tentative : haute précision (timeout 7s)
    navigator.geolocation.getCurrentPosition(
      onLocationFound,
      () => {
        // 2ème tentative automatique : basse précision / triangulation réseau
        tryLowAccuracy();
      },
      { enableHighAccuracy: true, timeout: 7000 }
    );
  };

  // Validation Étape 1 avec bordure rouge & scroll automatique (Notion #18 & #20)
  const validateStep1 = () => {
    if (!eventDetails.trim()) {
      setSingleError('eventDetails', 'Veuillez préciser pour quel événement ce gâteau est destiné.', 'field-eventDetails');
      return false;
    }
    if (selectedFlavor === 'Autre saveur personnalisée' && !customFlavorText.trim()) {
      setSingleError('customFlavorText', 'Veuillez préciser la saveur personnalisée souhaitée.', 'field-customFlavorText');
      return false;
    }
    if (hasGreetingCard && !cardMessage.trim()) {
      setSingleError('cardMessage', 'Veuillez saisir le texte de votre carte de vœux.', 'field-cardMessage');
      return false;
    }
    setFieldErrors({});
    setValidationError(null);
    return true;
  };

  // Validation Étape 2 avec conformité téléphonique BF & scroll automatique (Notion 28/10/26)
  const validateStep2 = () => {
    if (!receptionDate) {
      setSingleError('receptionDate', 'Veuillez sélectionner la date souhaitée pour votre commande.', 'cake-reception-date-input');
      return false;
    }

    // Validation stricte du format téléphonique Burkina Faso (8 chiffres)
    const phoneVal = validateBurkinaPhone(recipientPhone);
    if (!phoneVal.isValid) {
      setSingleError('recipientPhone', phoneVal.error || 'Veuillez saisir un numéro valide du Burkina Faso (8 chiffres).', 'field-recipientPhone');
      return false;
    }

    // Validation du numéro de secours s'il a été renseigné
    if (recipientPhoneBackup.trim()) {
      const backupVal = validateBurkinaPhone(recipientPhoneBackup, true);
      if (!backupVal.isValid) {
        setSingleError('recipientPhoneBackup', backupVal.error || 'Numéro de secours invalide (8 chiffres requis).', 'field-recipientPhoneBackup');
        return false;
      }
    }

    if (deliveryType === 'livraison' && !deliveryAddress.trim()) {
      setSingleError('deliveryAddress', 'Veuillez choisir votre mode de livraison (Votre position actuelle ou Un autre endroit).', 'field-deliveryAddress');
      return false;
    }

    setFieldErrors({});
    setValidationError(null);
    return true;
  };

  const handleNextStep = () => {
    if (validateStep1()) {
      setCurrentStep(2);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
    setValidationError(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Validation et passage d'abord par le panier (Notion point 86 : "Apres avoir remplile formlaire de gateau on passe dabord dans la page panier avant de passer a la page de verification de paiement")
  const handleSubmitOrder = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);
    setValidationError(null);

    const flavorDisplay = selectedFlavor === 'Autre saveur personnalisée' ? `Personnalisée : ${customFlavorText}` : selectedFlavor;
    const modelDisplay = modelType === 'catalog' 
      ? `Modèle catalogue : ${selectedCatalogCake}` 
      : (uploadedImagePreview ? 'Photo personnalisée transmise' : 'Aucune photo');

    const finalCakePrice = estimatedPrice > 0 ? estimatedPrice : 15000;

    const fullDeliveryAddress = [
      deliveryAddress.trim(),
      deliveryLandmark.trim() ? `Repère: ${deliveryLandmark.trim()}` : ''
    ].filter(Boolean).join(' | ');

    const customDetailsList = [
      `Événement: ${eventDetails.trim()}`,
      `Format: ${currentPortion.label}`,
      `Saveur: ${flavorDisplay}`,
      cakeInscriptionMessage.trim() ? `Inscription gâteau: « ${cakeInscriptionMessage.trim()} »` : '',
      `Modèle: ${modelDisplay}`,
      hasGreetingCard ? `Carte de vœux (+200F): « ${cardMessage.trim()} »` : '',
      `Mode: ${deliveryType === 'livraison' ? 'Livraison' : 'Retrait sur place'}`,
      `Date souhaitée: ${receptionDate} (${receptionTime || 'Créneau libre'})`,
      `Réceptionnaire: ${recipientPhone.trim()}${recipientName.trim() ? ` (${recipientName.trim()})` : ''}`,
      recipientPhoneBackup.trim() ? `Tél secours: ${recipientPhoneBackup.trim()}` : '',
      deliveryType === 'livraison' ? `Adresse: ${fullDeliveryAddress}` : 'Retrait atelier',
      additionalNotes.trim() ? `Allergies/Notes: ${additionalNotes.trim()}` : ''
    ].filter(Boolean).join(' | ');

    try {
      // 1. Ajout de la création personnalisée au panier
      addToCart({
        id: `custom-cake-${Date.now()}`,
        name: `Gâteau Sur-Mesure (${eventDetails.trim()} - ${currentPortion.label})`,
        price: `${finalCakePrice.toLocaleString('fr-FR')} FCFA`,
        numericPrice: finalCakePrice,
        image: uploadedImagePreview || '/products/gateau_1.jpeg',
        category: 'Gâteaux',
        description: customDetailsList
      }, 1);

      // 2. Mémorisation des coordonnées pour pré-remplir le panier de façon fluide
      localStorage.setItem('le_ci_checkout_pref', JSON.stringify({
        customerName: recipientName.trim(),
        customerPhone: recipientPhone.trim(),
        backupPhone: recipientPhoneBackup.trim(),
        deliveryType,
        deliveryDate: receptionDate,
        deliveryTimeSlot: receptionTime || '14h00 - 17h00',
        deliveryAddress: fullDeliveryAddress,
        distanceKm: deliveryLocation?.distanceKm || 3.5,
        deliveryFee: deliveryLocation?.deliveryFee || 1000,
        notes: additionalNotes.trim(),
        hasGreetingCard,
        cardMessage: cardMessage.trim()
      }));

      // 3. Redirection vers la page panier pour récapitulatif avant paiement (Notion point 86)
      navigate('/panier');
    } catch (err: any) {
      setValidationError(err.message || 'Erreur lors de l\'enregistrement de votre commande');
    } finally {
      setIsSubmitting(false);
    }
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
            Donnez vie à vos idées gourmandes en 2 étapes : décrivez votre création idéale et planifiez sa réception.
          </p>
        </motion.div>

        {/* Indicateur d'Étapes (Stepper) */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-purple-200/60 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-[#581C87] -translate-y-1/2 z-0 transition-all duration-500" 
              style={{ width: currentStep === 1 ? '50%' : '100%' }}
            />

            {/* Bulle Étape 1 */}
            <div 
              onClick={() => setCurrentStep(1)}
              className={`relative z-10 flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer transition-all ${
                currentStep === 1 
                  ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30 scale-105' 
                  : 'bg-white text-purple-900 border border-purple-200 shadow-sm'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                currentStep === 1 ? 'bg-white text-[#581C87]' : 'bg-purple-100 text-purple-900'
              }`}>
                1
              </div>
              <span className="text-xs sm:text-sm font-bold">Description du gâteau</span>
            </div>

            {/* Bulle Étape 2 */}
            <div 
              onClick={() => validateStep1() && setCurrentStep(2)}
              className={`relative z-10 flex items-center gap-3 px-5 py-2.5 rounded-full cursor-pointer transition-all ${
                currentStep === 2 
                  ? 'bg-[#581C87] text-white shadow-lg shadow-purple-900/30 scale-105' 
                  : 'bg-white text-purple-900 border border-purple-200 shadow-sm'
              }`}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-extrabold ${
                currentStep === 2 ? 'bg-white text-[#581C87]' : 'bg-purple-100 text-purple-900'
              }`}>
                2
              </div>
              <span className="text-xs sm:text-sm font-bold">Livraison & Contact</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FORMULAIRE : ÉTAPE 1 - DESCRIPTION DU GÂTEAU */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-10"
          >
            {/* 1. Événement (Champ 1 : Texte libre, Notion #20) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">1</span>
                Pour quel événement ?
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-light">
                Indiquez simplement l'occasion célébrée pour que nos chefs pâtissiers personnalisent l'esprit et le design de votre gâteau.
              </p>

              <input
                id="field-eventDetails"
                type="text"
                value={eventDetails}
                onChange={(e) => { setEventDetails(e.target.value); clearFieldError('eventDetails'); }}
                placeholder="Ex : Anniversaire des 25 ans de Sarah, Mariage religieux, Baptême, Fête d'entreprise, Réussite au diplôme..."
                className={`w-full px-4 py-3.5 rounded-2xl outline-none text-sm bg-white transition ${
                  fieldErrors.eventDetails 
                    ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                    : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                }`}
              />
              {fieldErrors.eventDetails && (
                <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-2 animate-pulse">
                  <AlertCircle size={14} className="text-red-500 shrink-0" />
                  <span>{fieldErrors.eventDetails}</span>
                </p>
              )}
            </div>

            {/* 2. Message à inscrire sur le gâteau (Champ 2, Notion #20) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">2</span>
                Message à inscrire sur le gâteau
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-light">
                Le texte ou prénom qui sera délicatement calligraphié à la main sur votre gâteau (laisser vide si vous ne souhaitez pas d'inscription).
              </p>

              <input
                id="field-cakeInscriptionMessage"
                type="text"
                value={cakeInscriptionMessage}
                onChange={(e) => setCakeInscriptionMessage(e.target.value)}
                placeholder="Ex : « Joyeux Anniversaire Sarah », « 10 ans d'amour », « Bienvenue Bébé Liam »..."
                className="w-full px-4 py-3.5 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
              />
            </div>

            {/* 3. Nombre de parts mentionné avec les prix */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">3</span>
                  Nombre de parts & Tarification
                </h3>
                {estimatedPrice > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[#581C87] text-xs font-extrabold">
                    Estimatif : {estimatedPrice.toLocaleString('fr-FR')} FCFA
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Choisissez le calibre de votre gâteau. Les prix indiqués sont clairs et sans surprise.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {portionsOptions.map((opt) => {
                  const isSelected = selectedPortionId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setSelectedPortionId(opt.id)}
                      className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected 
                          ? 'border-[#581C87] bg-purple-50/60 shadow-md ring-2 ring-[#581C87]/20' 
                          : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-extrabold text-gray-900">{opt.label}</span>
                        {isSelected && <CheckCircle2 size={16} className="text-[#581C87]" />}
                      </div>
                      <div className="text-xs text-gray-500 font-light mb-3">{opt.desc}</div>
                      <div className="text-sm font-black text-[#581C87]">
                        {opt.price > 0 ? `${opt.price.toLocaleString('fr-FR')} FCFA` : 'Sur devis (+50 parts)'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Saveur */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">4</span>
                Saveurs gourmandes & garnitures
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Sélectionnez le parfum principal de votre biscuit et de sa crème onctueuse.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {flavorOptions.map((flavor) => {
                  const isSelected = selectedFlavor === flavor;
                  return (
                    <button
                      key={flavor}
                      type="button"
                      onClick={() => setSelectedFlavor(flavor)}
                      className={`p-3.5 px-4 rounded-2xl border text-left text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center justify-between ${
                        isSelected 
                          ? 'border-[#581C87] bg-purple-50 text-[#581C87] shadow-sm' 
                          : 'border-gray-200 hover:border-purple-200 text-gray-700 hover:bg-gray-50/60'
                      }`}
                    >
                      <span>{flavor}</span>
                      {isSelected ? <Check size={16} className="text-[#581C87] shrink-0" /> : <div className="w-4 h-4 rounded-full border border-gray-300 shrink-0" />}
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
                    Précisez votre saveur souhaitée :
                  </label>
                  <input
                    id="field-customFlavorText"
                    type="text"
                    value={customFlavorText}
                    onChange={(e) => { setCustomFlavorText(e.target.value); clearFieldError('customFlavorText'); }}
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

            {/* 5. Charger une image d'un gâteau OU choisir parmi les gâteaux du catalogue */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">5</span>
                Modèle de référence visuelle
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Choisissez si vous préférez vous inspirer d'une création du catalogue Lê Ci ou importer votre propre photo.
              </p>

              {/* Onglets de choix */}
              <div className="flex gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => setModelType('catalog')}
                  className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    modelType === 'catalog' 
                      ? 'bg-[#581C87] text-white shadow-md' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                  }`}
                >
                  Choisir parmi les gâteaux du catalogue
                </button>
                <button
                  type="button"
                  onClick={() => setModelType('upload')}
                  className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    modelType === 'upload' 
                      ? 'bg-[#581C87] text-white shadow-md' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                  }`}
                >
                  Charger une photo / capture de gâteau
                </button>
              </div>

              {/* Option A : Choix catalogue */}
              {modelType === 'catalog' && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {catalogCakes.map((cake) => {
                    const isSelected = selectedCatalogCake === cake.name;
                    return (
                      <div
                        key={cake.id}
                        onClick={() => setSelectedCatalogCake(cake.name)}
                        className={`group relative rounded-2xl overflow-hidden border-2 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-[#581C87] ring-4 ring-purple-200 shadow-lg' 
                            : 'border-gray-200 hover:border-purple-300 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="aspect-square bg-gray-100 relative">
                          <ImageWithFallback
                            src={cake.image}
                            alt={cake.name}
                            className="w-full h-full object-cover"
                          />
                          {isSelected && (
                            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#581C87] text-white flex items-center justify-center shadow">
                              <Check size={14} />
                            </div>
                          )}
                        </div>
                        <div className="p-2.5 bg-white text-center">
                          <p className="text-[11px] font-bold text-gray-800 line-clamp-1 leading-tight">
                            {cake.name}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Option B : Upload de photo */}
              {modelType === 'upload' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-purple-200 rounded-3xl p-8 text-center hover:bg-purple-50/40 transition">
                    {uploadedImagePreview ? (
                      <div className="flex flex-col items-center">
                        <div className="relative w-48 h-48 rounded-2xl overflow-hidden shadow-md mb-4 border border-purple-200">
                          <img
                            src={uploadedImagePreview}
                            alt="Aperçu modèle personnalisé"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setUploadedImagePreview(null)}
                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black transition cursor-pointer"
                            title="Retirer la photo"
                          >
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 mb-2">
                          <CheckCircle2 size={15} /> Photo chargée avec succès
                        </p>
                        <label className="cursor-pointer text-xs font-bold text-[#581C87] hover:underline">
                          Changer de photo
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    ) : (
                      <div>
                        <div className="w-14 h-14 rounded-full bg-purple-100 text-[#581C87] flex items-center justify-center mx-auto mb-3">
                          <Upload size={24} />
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-800 mb-1">
                          Glissez-déposez ou parcourez une photo
                        </h4>
                        <p className="text-xs text-gray-500 mb-4 font-light">
                          Formats acceptés : JPG, PNG, WEBP (max 5 Mo)
                        </p>
                        <label className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#581C87] text-white text-xs font-bold shadow-md hover:bg-[#6B21A8] transition cursor-pointer">
                          <span>Sélectionner une photo</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 6. Avec ou sans carte de petit mot */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">6</span>
                Carte de petit mot personnalisée
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Offrez une délicate attention avec une jolie carte de vœux manuscrite glissée dans votre coffret.
              </p>

              <div className="flex gap-3 mb-4">
                <button
                  type="button"
                  onClick={() => setHasGreetingCard(false)}
                  className={`flex-1 py-3 px-5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    !hasGreetingCard 
                      ? 'bg-[#581C87] text-white shadow-md' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                  }`}
                >
                  Sans carte de petit mot
                </button>
                <button
                  type="button"
                  onClick={() => setHasGreetingCard(true)}
                  className={`flex-1 py-3 px-5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    hasGreetingCard 
                      ? 'bg-[#581C87] text-white shadow-md' 
                      : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                  }`}
                >
                  ✦ Avec carte de vœux (offerte)
                </button>
              </div>

              {hasGreetingCard && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-4 pt-4 border-t border-purple-100"
                >
                  <label className="block text-xs font-bold text-gray-700 mb-2">
                    Texte à inscrire sur la carte :
                  </label>
                  <textarea
                    id="field-cardMessage"
                    rows={3}
                    value={cardMessage}
                    onChange={(e) => { setCardMessage(e.target.value); clearFieldError('cardMessage'); }}
                    placeholder="Ex: Joyeux anniversaire ma douce maman ! Que cette nouvelle année t'apporte bonheur et santé. Avec tout notre amour."
                    className={`w-full p-4 rounded-2xl border outline-none text-sm leading-relaxed transition ${
                      fieldErrors.cardMessage
                        ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200'
                        : 'border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                    }`}
                  />
                  {fieldErrors.cardMessage && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-2 animate-pulse">
                      <AlertCircle size={14} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.cardMessage}</span>
                    </p>
                  )}
                </motion.div>
              )}
            </div>

            {/* Bouton de Passage à l'Étape 2 */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
              <button
                type="button"
                onClick={handleNextStep}
                className="w-full sm:w-auto sm:ml-auto px-10 py-4 rounded-full bg-[#581C87] hover:bg-[#6B21A8] text-white font-extrabold text-sm shadow-xl shadow-purple-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Passer à l'étape 2 (Livraison & Contact)</span>
                <ArrowRight size={18} />
              </button>
            </div>
          </motion.div>
        )}

        {/* ========================================================================= */}
        {/* FORMULAIRE : ÉTAPE 2 - INFORMATIONS POUR LA LIVRAISON */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
          >
            {/* 1. Type de commande (livraison, sur place) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">1</span>
                Type de commande
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Choisissez comment vous souhaitez récupérer votre gâteau d'exception.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setDeliveryType('livraison')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                    deliveryType === 'livraison' 
                      ? 'border-[#581C87] bg-purple-50/60 shadow-md ring-2 ring-[#581C87]/20' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center shrink-0">
                    <Truck size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-gray-900 text-sm">Livraison à domicile</div>
                    <div className="text-[11px] text-gray-500 font-light mt-0.5">Livraison soignée et climatisée à votre porte</div>
                  </div>
                  {deliveryType === 'livraison' && <CheckCircle2 size={18} className="text-[#581C87]" />}
                </button>

                <button
                  type="button"
                  onClick={() => setDeliveryType('sur_place')}
                  className={`p-5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center gap-4 ${
                    deliveryType === 'sur_place' 
                      ? 'border-[#581C87] bg-purple-50/60 shadow-md ring-2 ring-[#581C87]/20' 
                      : 'border-gray-200 hover:border-purple-200 hover:bg-gray-50/50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-[#581C87] flex items-center justify-center shrink-0">
                    <Store size={22} />
                  </div>
                  <div className="flex-1">
                    <div className="font-extrabold text-gray-900 text-sm">Retrait sur place</div>
                    <div className="text-[11px] text-gray-500 font-light mt-0.5">À l'Atelier Lê Ci (Ouagadougou)</div>
                  </div>
                  {deliveryType === 'sur_place' && <CheckCircle2 size={18} className="text-[#581C87]" />}
                </button>
              </div>
            </div>

            {/* 2. Date et heure de réception (Bouton calendrier + heure texte libre, Notion #20) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">2</span>
                Date et heure de réception
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Un préavis minimum de 48h est requis pour garantir la fraîcheur et la confection sur-mesure de votre gâteau.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-start">
                {/* Champ 2a : Bouton pour sélectionner la date de réception */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Calendar size={14} className="text-[#581C87]" />
                    Date de réception souhaitée *
                  </label>

                  <div className="relative">
                    <button
                      id="field-receptionDate"
                      type="button"
                      onClick={() => {
                        const picker = document.getElementById('cake-reception-date-input') as HTMLInputElement;
                        if (picker) {
                          if (typeof picker.showPicker === 'function') {
                            picker.showPicker();
                          } else {
                            picker.focus();
                            picker.click();
                          }
                        }
                      }}
                      className={`w-full py-3.5 px-4 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-bold transition cursor-pointer shadow-sm ${
                        fieldErrors.receptionDate 
                          ? 'border-2 border-red-500 bg-red-50/20 text-red-700 ring-2 ring-red-200' 
                          : receptionDate
                            ? 'border-2 border-[#581C87] bg-purple-50/80 text-[#581C87]'
                            : 'border border-gray-200 bg-white text-gray-700 hover:border-purple-300 hover:bg-purple-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Calendar size={18} className={receptionDate ? 'text-[#581C87]' : 'text-gray-400'} />
                        <span className="truncate">
                          {receptionDate 
                            ? `Date : ${new Date(receptionDate + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}`
                            : 'Sélectionner votre date de réception'}
                        </span>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-[#581C87] text-white text-[11px] font-extrabold shrink-0">
                        {receptionDate ? 'Modifier' : 'Choisir'}
                      </span>
                    </button>

                    {/* Input date caché activé par le bouton */}
                    <input
                      id="cake-reception-date-input"
                      type="date"
                      min={minDate}
                      value={receptionDate}
                      onChange={(e) => { 
                        setReceptionDate(e.target.value); 
                        clearFieldError('receptionDate'); 
                      }}
                      className="absolute bottom-0 left-0 w-0 h-0 opacity-0 pointer-events-none"
                    />
                  </div>

                  {fieldErrors.receptionDate && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.receptionDate}</span>
                    </p>
                  )}
                  <span className="block text-[11px] text-gray-400 mt-1">Délai minimum de préparation : dès le {minDate}</span>
                </div>

                {/* Champ 2b : Heure en texte libre uniquement (Notion #20) */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Clock size={14} className="text-[#581C87]" />
                    Heure souhaitée pour la réception *
                  </label>
                  <input
                    id="field-receptionTime"
                    type="text"
                    value={receptionTime}
                    onChange={(e) => { setReceptionTime(e.target.value); clearFieldError('receptionTime'); }}
                    placeholder="Ex : 15h30, en début d'après-midi, vers 18h..."
                    className={`w-full px-4 py-3.5 rounded-2xl outline-none text-sm bg-white transition ${
                      fieldErrors.receptionTime 
                        ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                        : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                    }`}
                  />
                  {fieldErrors.receptionTime && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.receptionTime}</span>
                    </p>
                  )}
                  <span className="block text-[11px] text-gray-400 mt-1">Indiquez librement votre créneau horaire idéal.</span>
                </div>
              </div>
            </div>

            {/* 3. Coordonnées de la personne qui va recevoir le colis (Point 21 Notion) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">3</span>
                Coordonnées de la personne qui va recevoir le colis
              </h3>
              <p className="text-xs text-gray-500 mb-6 font-light">
                Le livreur ou l'atelier contactera ce numéro pour la remise de votre création gourmande. Vous pouvez renseigner un second numéro de secours.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                    <Phone size={14} className="text-[#581C87]" />
                    Numéro WhatsApp / Téléphone de réception *
                  </label>
                  <input
                    id="field-recipientPhone"
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => { setRecipientPhone(e.target.value); clearFieldError('recipientPhone'); }}
                    placeholder="Ex: 70 00 00 00 ou +226 70 12 34 56"
                    className={`w-full px-4 py-3.5 rounded-2xl outline-none text-sm bg-white transition ${
                      fieldErrors.recipientPhone 
                        ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200' 
                        : 'border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                    }`}
                  />
                  {fieldErrors.recipientPhone && (
                    <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                      <AlertCircle size={13} className="text-red-500 shrink-0" />
                      <span>{fieldErrors.recipientPhone}</span>
                    </p>
                  )}
                  <span className="block text-[11px] text-gray-400 mt-1">Numéro du Burkina Faso à 8 chiffres (Orange, Moov, Telecel).</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <User size={14} className="text-[#581C87]" />
                      Nom de la personne qui reçoit <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      id="field-recipientName"
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Ex: Salimata Traoré"
                      className="w-full px-4 py-3 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5">
                      <Phone size={14} className="text-[#581C87]" />
                      Second numéro de secours <span className="text-[11px] font-normal text-gray-400">(optionnel)</span>
                    </label>
                    <input
                      id="field-recipientPhoneBackup"
                      type="tel"
                      value={recipientPhoneBackup}
                      onChange={(e) => { setRecipientPhoneBackup(e.target.value); clearFieldError('recipientPhoneBackup'); }}
                      placeholder="Ex: 76 00 00 00 (famille, conjoint...)"
                      className={`w-full px-4 py-3 rounded-2xl border outline-none text-sm bg-white transition ${
                        fieldErrors.recipientPhoneBackup
                          ? 'border-2 border-red-500 bg-red-50/20 ring-2 ring-red-200'
                          : 'border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200'
                      }`}
                    />
                    {fieldErrors.recipientPhoneBackup && (
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5 mt-1.5 animate-pulse">
                        <AlertCircle size={13} className="text-red-500 shrink-0" />
                        <span>{fieldErrors.recipientPhoneBackup}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Lieu de réception (Notion 28/10/26 : Deux options - Position actuelle GPS ou Indiquer sur la carte) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm" id="field-deliveryAddress">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">4</span>
                Lieu de réception
              </h3>

              {deliveryType === 'sur_place' ? (
                <div className="p-5 rounded-2xl bg-purple-50/60 border border-purple-200 flex items-start gap-4">
                  <Store size={24} className="text-[#581C87] shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-extrabold text-gray-900 text-sm">Atelier Les Douceurs de Lê Ci</h4>
                    <p className="text-xs text-gray-600 mt-1 font-light leading-relaxed">
                      Ouagadougou, Burkina Faso. Votre commande sera soigneusement emballée et prête à votre créneau choisi.
                    </p>
                  </div>
                </div>
              ) : (
                <DeliveryMapPicker
                  totalCartAmount={estimatedPrice}
                  initialAddress={deliveryAddress}
                  initialLandmark={deliveryLandmark}
                  error={fieldErrors.deliveryAddress}
                  onChange={(loc) => {
                    setDeliveryAddress(loc.address);
                    setDeliveryLandmark(loc.landmark);
                    setDeliveryLocation(loc);
                    clearFieldError('deliveryAddress');
                  }}
                />
              )}
            </div>



            {/* 7. Informations complémentaires (allergies, demandes spéciales...) */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">5</span>
                Informations complémentaires
              </h3>
              <p className="text-xs text-gray-500 mb-4 font-light">
                Indiquez d'éventuelles allergies alimentaires (gluten, fruits à coque, lactose...), consignes pour le livreur ou demandes spécifiques.
              </p>

              <textarea
                rows={3}
                value={additionalNotes}
                onChange={(e) => setAdditionalNotes(e.target.value)}
                placeholder="Ex: Sans arachides svp, intolérance au lactose pour l'un des invités, ou consignes de sonner à la porte gauche..."
                className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm leading-relaxed"
              />
            </div>

            {/* Récapitulatif & Actions Finales */}
            <div className="bg-gradient-to-br from-purple-900 to-[#581C87] rounded-3xl p-6 sm:p-8 text-white shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-purple-700/60">
                <div>
                  <span className="text-xs text-purple-200 uppercase tracking-widest font-bold">Récapitulatif de votre création</span>
                  <h4 className="text-xl sm:text-2xl font-black mt-1">
                    {eventDetails || 'Gâteau de célébration'} • {currentPortion.label}
                  </h4>
                  <p className="text-xs text-purple-200/80 mt-1">
                    Saveur : {selectedFlavor === 'Autre saveur personnalisée' ? customFlavorText : selectedFlavor}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-purple-200">Tarif indicatif</span>
                  <div className="text-2xl sm:text-3xl font-black">
                    {estimatedPrice > 0 ? `${estimatedPrice.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 border border-white/20"
                >
                  <ArrowLeft size={16} />
                  <span>Revenir à l'étape 1</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-10 py-4 rounded-full bg-white text-[#581C87] hover:bg-purple-50 font-black text-sm shadow-2xl transition cursor-pointer flex items-center justify-center gap-2.5 transform hover:scale-105 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin text-[#581C87]" />
                      <span>Ajout au panier en cours...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} className="text-[#581C87]" />
                      <span>Vérifier mon panier & Régler</span>
                      <ArrowRight size={18} className="text-[#581C87]" />
                    </>
                  )}
                </button>
              </div>
            </div>

          </motion.div>
        )}

      </div>

      {/* ========================================================================= */}
      {/* MODALE DE SUCCÈS APRÈS VALIDATION */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {showSuccessModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl relative border border-purple-100"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={36} />
              </div>

              <h3 className="text-2xl font-black text-gray-900 mb-2">
                Demande transmise avec succès !
              </h3>

              <p className="text-xs sm:text-sm text-gray-600 mb-6 font-light leading-relaxed">
                Votre récapitulatif complet a été généré et transmis vers notre WhatsApp officiel. Notre cheffe pâtissière vous répondra sous quelques minutes pour confirmer la faisabilité et le créneau de confection.
              </p>

              <div className="p-4 rounded-2xl bg-purple-50 text-left text-xs text-gray-700 space-y-1.5 mb-6">
                <div><span className="font-bold">Gâteau :</span> {currentPortion.label} ({eventDetails})</div>
                <div><span className="font-bold">Date de réception :</span> {receptionDate} ({receptionTime})</div>
                <div><span className="font-bold">Mode :</span> {deliveryType === 'livraison' ? 'Livraison à domicile' : 'Retrait atelier'}</div>
                <div><span className="font-bold">Tarif estimé :</span> {estimatedPrice > 0 ? `${estimatedPrice.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}</div>
              </div>

              <button
                type="button"
                onClick={() => setShowSuccessModal(false)}
                className="w-full py-3.5 px-6 rounded-full bg-[#581C87] text-white text-xs font-bold hover:bg-[#6B21A8] transition shadow-md cursor-pointer"
              >
                Fermer et revenir au site
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
