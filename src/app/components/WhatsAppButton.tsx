export function WhatsAppButton() {
  const handleWhatsAppClick = () => {
    const message = 'Bonjour Les Douceurs de Lê Ci, je souhaite avoir des renseignements et passer une commande.';
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <button
      onClick={handleWhatsAppClick}
      className="fixed bottom-6 right-6 z-50 p-2.5 bg-white/95 hover:bg-white rounded-full shadow-[0_4px_25px_rgba(0,0,0,0.25)] border border-emerald-500/20 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer flex items-center justify-center animate-fade-in"
      aria-label="Contacter Les Douceurs de Lê Ci sur WhatsApp"
      title="Discuter sur WhatsApp"
    >
      <img
        src="/whatsapp.png"
        alt="WhatsApp Les Douceurs de Lê Ci"
        className="w-11 h-11 sm:w-12 sm:h-12 object-contain filter drop-shadow group-hover:rotate-6 transition-transform"
      />
    </button>
  );
}
