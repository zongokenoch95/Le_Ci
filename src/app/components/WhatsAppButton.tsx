import { MessageCircle } from 'lucide-react';

export function WhatsAppButton() {
  const handleWhatsAppClick = () => {
    const phoneNumber = '21671123456'; // Replace with actual WhatsApp number
    const message = 'Bonjour, je souhaite passer une commande.';
    window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 bg-[var(--beige-gold)] text-white p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
      aria-label="Contacter via WhatsApp"
    >
      <MessageCircle size={24} />
    </button>
  );
}
