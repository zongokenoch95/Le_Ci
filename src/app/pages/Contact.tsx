import { useState } from 'react';
import { motion } from 'motion/react';
import { MapPin, Phone, Mail, Clock } from 'lucide-react';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const phoneNumber = '21671123456';
    const message = `Nouveau message de contact:
    
Nom: ${formData.name}
Téléphone: ${formData.phone}
Email: ${formData.email}

Message:
${formData.message}`;

    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="mb-4">Contactez-nous</h1>
          <p className="opacity-70">Nous sommes à votre écoute pour toute question</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="mb-6">Envoyez-nous un message</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm mb-2 opacity-70">Nom complet *</label>
                  <input
                    type="text"
                    required
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
                    required
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
                  <label className="block text-sm mb-2 opacity-70">Message *</label>
                  <textarea
                    required
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 border border-[var(--grey-light)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--beige-gold)]"
                    placeholder="Votre message..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-4 bg-[var(--beige-gold)] text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  Envoyer le message
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Information */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-8"
          >
            {/* Info Cards */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h3 className="mb-6">Nos Coordonnées</h3>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--beige-gold)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin size={24} className="text-[var(--beige-gold)]" />
                  </div>
                  <div>
                    <h4 className="mb-1">Adresse</h4>
                    <p className="opacity-70">
                      Avenue Habib Bourguiba<br />
                      La Marsa, Tunis 2078<br />
                      Tunisie
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--beige-gold)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Phone size={24} className="text-[var(--beige-gold)]" />
                  </div>
                  <div>
                    <h4 className="mb-1">Téléphone</h4>
                    <p className="opacity-70">+216 71 123 456</p>
                    <p className="opacity-70">+216 98 765 432</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--beige-gold)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Mail size={24} className="text-[var(--beige-gold)]" />
                  </div>
                  <div>
                    <h4 className="mb-1">Email</h4>
                    <p className="opacity-70">contact@lesdouceursdeleci.com</p>
                    <p className="opacity-70">commandes@alfann.tn</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[var(--beige-gold)]/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Clock size={24} className="text-[var(--beige-gold)]" />
                  </div>
                  <div>
                    <h4 className="mb-1">Horaires</h4>
                    <p className="opacity-70">Lundi - Samedi: 8h00 - 20h00</p>
                    <p className="opacity-70">Dimanche: 9h00 - 18h00</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-2xl p-2 shadow-sm overflow-hidden">
              <div className="w-full h-80 bg-[var(--grey-light)] rounded-xl flex items-center justify-center">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3192.0846825106775!2d10.325277315346938!3d36.87852597993917!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x12fd35a01bc7e0f5%3A0x9c5c2d8c5b5a5d8e!2sLa%20Marsa%2C%20Tunisia!5e0!3m2!1sen!2s!4v1234567890123!5m2!1sen!2s"
                  width="100%"
                  height="100%"
                  style={{ border: 0, borderRadius: '0.75rem' }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Notre localisation"
                ></iframe>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
