import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight, ArrowLeft, Check, Upload } from 'lucide-react';

interface FormData {
  eventType: string;
  flavor: string;
  size: string;
  decoration: string;
  name: string;
  phone: string;
  email: string;
  date: string;
  message: string;
  decorationImage: File | null;
}

const steps = [
  { id: 1, title: "Type d'événement" },
  { id: 2, title: 'Goût et garniture' },
  { id: 3, title: 'Taille et quantité' },
  { id: 4, title: 'Décoration' },
  { id: 5, title: 'Informations' },
];

const eventTypes = ['Anniversaire', 'Mariage', 'Fiançailles', 'Naissance', 'Entreprise', 'Autre'];
const flavors = ['Vanille', 'Chocolat', 'Fraise', 'Pistache', 'Caramel', 'Citron', 'Café'];
const sizes = ['Petit (6-8 personnes)', 'Moyen (10-15 personnes)', 'Grand (20-30 personnes)', 'Très Grand (40+ personnes)'];

const basePrices: { [key: string]: number } = {
  'Petit (6-8 personnes)': 60,
  'Moyen (10-15 personnes)': 100,
  'Grand (20-30 personnes)': 180,
  'Très Grand (40+ personnes)': 300,
};

export function CustomOrder() {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    eventType: '',
    flavor: '',
    size: '',
    decoration: '',
    name: '',
    phone: '',
    email: '',
    date: '',
    message: '',
    decorationImage: null,
  });

  const estimatedPrice = formData.size ? basePrices[formData.size] : 0;

  const handleNext = () => {
    if (currentStep < 5) setCurrentStep(currentStep + 1);
  };

  const handlePrevious = () => {
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSubmit = () => {
    const phoneNumber = '21671123456';
    const message = `Nouvelle commande personnalisée:
    
Type d'événement: ${formData.eventType}
Goût: ${formData.flavor}
Taille: ${formData.size}
Décoration: ${formData.decoration}
Date: ${formData.date}

Informations client:
Nom: ${formData.name}
Téléphone: ${formData.phone}
Email: ${formData.email}

Message: ${formData.message || 'Aucun'}

Prix estimatif: ${estimatedPrice} DT`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.eventType !== '';
      case 2: return formData.flavor !== '';
      case 3: return formData.size !== '';
      case 4: return formData.decoration !== '';
      case 5: return formData.name && formData.phone && formData.date;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="mb-4">Personnalisez votre gâteau</h1>
          <p className="opacity-70">Créez une pièce unique pour votre événement</p>
        </motion.div>

        {/* Progress Steps */}
        <div className="mb-12">
          <div className="flex justify-between items-center">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                      currentStep >= step.id
                        ? 'bg-[var(--beige-gold)] text-white'
                        : 'bg-[var(--grey-light)] text-gray-400'
                    }`}
                  >
                    {currentStep > step.id ? <Check size={20} /> : step.id}
                  </div>
                  <p className="text-xs mt-2 text-center hidden sm:block">{step.title}</p>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-0.5 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-[var(--beige-gold)]' : 'bg-[var(--grey-light)]'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-white rounded-2xl p-8 shadow-sm mb-8"
        >
          {currentStep === 1 && (
            <div>
              <h3 className="mb-6">Quel type d'événement célébrez-vous ?</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {eventTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData({ ...formData, eventType: type })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.eventType === type
                        ? 'border-[var(--beige-gold)] bg-[var(--beige-gold)]/10'
                        : 'border-[var(--grey-light)] hover:border-[var(--beige-gold)]'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div>
              <h3 className="mb-6">Choisissez votre goût préféré</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {flavors.map((flavor) => (
                  <button
                    key={flavor}
                    onClick={() => setFormData({ ...formData, flavor })}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      formData.flavor === flavor
                        ? 'border-[var(--beige-gold)] bg-[var(--beige-gold)]/10'
                        : 'border-[var(--grey-light)] hover:border-[var(--beige-gold)]'
                    }`}
                  >
                    {flavor}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div>
              <h3 className="mb-6">Quelle taille souhaitez-vous ?</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setFormData({ ...formData, size })}
                    className={`p-6 rounded-lg border-2 transition-all text-left ${
                      formData.size === size
                        ? 'border-[var(--beige-gold)] bg-[var(--beige-gold)]/10'
                        : 'border-[var(--grey-light)] hover:border-[var(--beige-gold)]'
                    }`}
                  >
                    <h4 className="mb-1">{size}</h4>
                    <p className="text-[var(--beige-gold)]">À partir de {basePrices[size]} DT</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div>
              <h3 className="mb-6">Décoration souhaitée</h3>
              <textarea
                value={formData.decoration}
                onChange={(e) => setFormData({ ...formData, decoration: e.target.value })}
                placeholder="Décrivez la décoration que vous souhaitez (couleurs, thème, style...)"
                rows={5}
                className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)] mb-4"
              />
              
              <div className="border-2 border-dashed border-[var(--grey-light)] rounded-lg p-8 text-center hover:border-[var(--beige-gold)] transition-colors cursor-pointer">
                <Upload size={40} className="mx-auto mb-4 opacity-40" />
                <p className="opacity-60 mb-2">Télécharger une image de référence (optionnel)</p>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setFormData({ ...formData, decorationImage: e.target.files?.[0] || null })}
                  className="hidden"
                  id="decoration-upload"
                />
                <label htmlFor="decoration-upload" className="text-[var(--beige-gold)] cursor-pointer">
                  Choisir un fichier
                </label>
                {formData.decorationImage && (
                  <p className="mt-2 text-sm opacity-70">{formData.decorationImage.name}</p>
                )}
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div>
              <h3 className="mb-6">Vos informations</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 opacity-70">Nom complet *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                    placeholder="Votre nom"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 opacity-70">Téléphone *</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                    placeholder="+216 XX XXX XXX"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 opacity-70">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                    placeholder="votre@email.com"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 opacity-70">Date de livraison souhaitée *</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 opacity-70">Message supplémentaire</label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                    placeholder="Informations complémentaires..."
                  />
                </div>
              </div>
            </div>
          )}
        </motion.div>

        {/* Price Estimate */}
        {estimatedPrice > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--beige-gold)]/10 border border-[var(--beige-gold)] rounded-lg p-6 mb-8"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="opacity-70 text-sm mb-1">Prix estimatif</p>
                <h3 className="text-[var(--beige-gold)]">{estimatedPrice} DT</h3>
              </div>
              <p className="text-xs opacity-60 max-w-xs">
                Le prix final sera confirmé après validation de votre commande
              </p>
            </div>
          </motion.div>
        )}

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              currentStep === 1
                ? 'opacity-40 cursor-not-allowed'
                : 'border-2 border-[var(--beige-gold)] text-[var(--brown-deep)] hover:bg-[var(--beige-gold)] hover:text-white'
            }`}
          >
            <ArrowLeft size={20} />
            Précédent
          </button>

          {currentStep < 5 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                !canProceed()
                  ? 'opacity-40 cursor-not-allowed bg-[var(--grey-light)]'
                  : 'bg-[var(--beige-gold)] text-white hover:opacity-90'
              }`}
            >
              Suivant
              <ArrowRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
                !canProceed()
                  ? 'opacity-40 cursor-not-allowed bg-[var(--grey-light)]'
                  : 'bg-[var(--beige-gold)] text-white hover:opacity-90'
              }`}
            >
              <Check size={20} />
              Envoyer la commande via WhatsApp
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
