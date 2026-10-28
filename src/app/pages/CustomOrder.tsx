import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  Cake, 
  ArrowRight, 
  Check, 
  Upload, 
  Heart, 
  Sparkles, 
  AlertCircle, 
  ShoppingBag,
  FileText
} from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { useCart } from '../context/CartContext';

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
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Formulaire gâteau (Partie 1 : Description du gâteau)
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
  // Champ 6 : Demandes particulières ou allergies
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Erreurs précises par champ avec bordure rouge & message inline (Notion)
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

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
      setFieldErrors(prev => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
  };

  // Calcul du prix estimé
  const currentPortion = portionsOptions.find(p => p.id === selectedPortionId) || portionsOptions[1];
  const estimatedPrice = currentPortion.price > 0 ? currentPortion.price : 0;

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

  // Validation & Ajout au panier avec redirection vers /panier
  const handleAddToCartAndProceed = () => {
    if (!eventDetails.trim()) {
      setSingleError('eventDetails', 'Veuillez préciser pour quel événement ce gâteau est destiné.', 'field-eventDetails');
      return;
    }
    if (selectedFlavor === 'Autre saveur personnalisée' && !customFlavorText.trim()) {
      setSingleError('customFlavorText', 'Veuillez préciser la saveur personnalisée souhaitée.', 'field-customFlavorText');
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    const flavorDisplay = selectedFlavor === 'Autre saveur personnalisée' 
      ? `Personnalisée : ${customFlavorText.trim()}` 
      : selectedFlavor;
      
    const modelDisplay = modelType === 'catalog' 
      ? `Modèle catalogue : ${selectedCatalogCake}` 
      : (uploadedImagePreview ? 'Photo personnalisée fournie' : 'Modèle personnalisé');

    const finalCakePrice = estimatedPrice > 0 ? estimatedPrice : 15000;

    const customDetailsList = [
      `Événement: ${eventDetails.trim()}`,
      `Format: ${currentPortion.label}`,
      `Saveur: ${flavorDisplay}`,
      cakeInscriptionMessage.trim() ? `Inscription: « ${cakeInscriptionMessage.trim()} »` : '',
      `Modèle: ${modelDisplay}`,
      additionalNotes.trim() ? `Allergies/Notes: ${additionalNotes.trim()}` : ''
    ].filter(Boolean).join(' | ');

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

    // 2. Redirection directe vers la page panier pour configurer la livraison et payer
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
            Créez le gâteau de vos rêves en quelques clics. Vous choisirez ensuite vos modalités de livraison dans votre panier.
          </p>
        </motion.div>

        {/* ========================================================================= */}
        {/* FORMULAIRE : PARTIE 1 - DESCRIPTION DU GÂTEAU */}
        {/* ========================================================================= */}
        <div className="space-y-8">
          
          {/* 1. Événement (Champ 1 : Texte libre, Notion) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">1</span>
              Pour quel événement ? *
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-light">
              Indiquez l'occasion célébrée pour que nos chefs pâtissiers personnalisent l'esprit et le design de votre gâteau.
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

          {/* 2. Message à inscrire sur le gâteau (Champ 2) */}
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

          {/* 3. Nombre de parts & Tarification (Champ 3) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">3</span>
                Nombre de parts & Tarification *
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
                        : 'border-gray-200 hover:border-purple-200 bg-white'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-gray-900">{opt.label}</span>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#581C87] text-white flex items-center justify-center">
                            <Check size={12} strokeWidth={3} />
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 font-light mt-1">{opt.desc}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-baseline justify-between">
                      <span className="text-[11px] text-gray-400">Tarif :</span>
                      <span className="font-black text-[#581C87] text-sm">
                        {opt.price > 0 ? `${opt.price.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Saveur du gâteau (Champ 4) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">4</span>
              Saveur gourmande *
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-light">
              Toutes nos mousses, crèmes et génoises sont réalisées à base d'ingrédients nobles et naturels.
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
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-center justify-between text-xs sm:text-sm font-semibold ${
                      isSelected
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

            {/* Saisie libre si "Autre saveur" */}
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

          {/* 5. Modèle du gâteau : Catalogue Lê Ci ou photo personnalisée (Champ 5) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">5</span>
              Inspiration visuelle & Design *
            </h3>
            <p className="text-xs text-gray-500 mb-6 font-light">
              Sélectionnez un gâteau phare de notre catalogue ou importez la photo d'un modèle que vous adorez.
            </p>

            <div className="flex gap-3 mb-6">
              <button
                type="button"
                onClick={() => setModelType('catalog')}
                className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  modelType === 'catalog' 
                    ? 'bg-[#581C87] text-white shadow-md' 
                    : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                }`}
              >
                <Sparkles size={14} />
                <span>Gâteaux phares Lê Ci (Catalogue)</span>
              </button>
              <button
                type="button"
                onClick={() => setModelType('upload')}
                className={`flex-1 py-3 px-4 rounded-full text-xs font-bold transition cursor-pointer flex items-center justify-center gap-2 ${
                  modelType === 'upload' 
                    ? 'bg-[#581C87] text-white shadow-md' 
                    : 'bg-purple-50 text-gray-700 hover:bg-purple-100/60'
                }`}
              >
                <Upload size={14} />
                <span>Importer ma propre photo</span>
              </button>
            </div>

            {/* Vue Catalogue */}
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
                          ? 'border-[#581C87] shadow-lg ring-2 ring-[#581C87]/20 scale-[1.02]' 
                          : 'border-gray-200 hover:border-purple-200'
                      }`}
                    >
                      <div className="aspect-square w-full overflow-hidden bg-gray-100">
                        <ImageWithFallback
                          src={cake.image}
                          alt={cake.name}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                        />
                      </div>
                      <div className="p-2.5 bg-white">
                        <span className="block text-xs font-bold text-gray-900 leading-tight truncate">
                          {cake.name}
                        </span>
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#581C87] text-white flex items-center justify-center shadow-md">
                          <Check size={14} strokeWidth={3} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Vue Upload Image */}
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

          {/* 6. Demandes particulières & allergies */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100 shadow-sm">
            <h3 className="text-base sm:text-lg font-extrabold text-gray-900 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-100 text-[#581C87] text-xs font-black flex items-center justify-center">6</span>
              Demandes spéciales ou allergies (Optionnel)
            </h3>
            <p className="text-xs text-gray-500 mb-4 font-light">
              Allergies à signaler (arachides, gluten, lactose...), couleur dominante souhaitée ou détails de finition.
            </p>

            <textarea
              rows={3}
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="Ex : Sans arachides s'il vous plaît, couleur dominante violet et or..."
              className="w-full p-4 rounded-2xl border border-gray-200 focus:border-[#581C87] focus:ring-2 focus:ring-purple-200 outline-none text-sm leading-relaxed bg-white"
            />
          </div>

          {/* ========================================================================= */}
          {/* BARRE D'ACTION ET AJOUT AU PANIER */}
          {/* ========================================================================= */}
          <div className="bg-gradient-to-r from-[#581C87] to-[#3B0764] rounded-3xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-xs text-purple-200 uppercase tracking-widest font-bold">
                ✦ Récapitulatif de votre création
              </span>
              <h4 className="text-xl sm:text-2xl font-black">
                {currentPortion.label} &bull; {selectedFlavor === 'Autre saveur personnalisée' && customFlavorText ? customFlavorText : selectedFlavor}
              </h4>
              <p className="text-xs text-purple-200 font-light">
                Tarif indicatif : <span className="font-extrabold text-amber-300 text-sm sm:text-base">{estimatedPrice > 0 ? `${estimatedPrice.toLocaleString('fr-FR')} FCFA` : 'Sur devis'}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddToCartAndProceed}
              disabled={isSubmitting}
              className="w-full md:w-auto px-8 py-4 rounded-full bg-white text-[#581C87] hover:bg-purple-50 font-black text-sm shadow-2xl transition cursor-pointer flex items-center justify-center gap-3 transform hover:scale-105 active:scale-95 shrink-0 disabled:opacity-50"
            >
              <ShoppingBag size={18} className="text-[#581C87]" />
              <span>Ajouter au panier & Finaliser ma commande</span>
              <ArrowRight size={18} className="text-[#581C87]" />
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
